import { Hono } from 'hono';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripeRouter = new Hono();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-01-27.acacia' as any,
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

const PRICE_MAP: Record<string, { monthly: string; yearly: string }> = {
  'nova-plus': { monthly: 'price_1TRFTxAxU1OE9jbwi9Nyo5u1', yearly: 'price_1TRFTxAxU1OE9jbwi9Nyo5u1' },
};

const DEAL_PRICE_ID = 'price_1TNchPBC4EINc08b3JVCueS7'; // €1 one-time — 7 days Nova+

stripeRouter.post('/deal-checkout', async (c) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) return c.json({ error: 'Stripe not configured.' }, 500);

    const { userId, userEmail } = await c.req.json();
    if (!userId) return c.json({ error: 'Not logged in.' }, 400);

    // Prevent buying the deal twice
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('plan_id')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing', 'deal'])
      .maybeSingle();

    if (existing) return c.json({ error: 'Ya tienes una suscripción activa.' }, 400);

    const origin = c.req.header('origin') || process.env.FRONTEND_URL || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: DEAL_PRICE_ID, quantity: 1 }],
      mode: 'payment',
      customer_creation: 'always',
      success_url: `${origin}/plans?deal=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/plans?canceled=true`,
      customer_email: userEmail || undefined,
      client_reference_id: userId,
      metadata: { user_id: userId, plan_id: 'nova-plus', deal: 'true' },
    });

    return c.json({ url: session.url });
  } catch (err: any) {
    console.error('Deal checkout error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// Helper: safely get current_period_end from a subscription (API version agnostic)
const getPeriodEnd = (sub: any): string =>
  new Date((sub.current_period_end ?? sub.billing_cycle_anchor ?? 0) * 1000).toISOString();

// Helper: safely get payment_intent from an invoice
const getPaymentIntent = (invoice: any): string | null => {
  const pi = invoice.payment_intent ?? invoice.payment_intent_data?.payment_intent ?? null;
  if (!pi) return null;
  return typeof pi === 'string' ? pi : pi.id;
};

const upsertSubscription = async (data: {
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string;
  plan_id: string;
  status: string;
  current_period_end: string;
}) => {
  const { data: existing, error: selectError } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', data.user_id)
    .limit(1)
    .maybeSingle();

  if (selectError) console.error('upsertSubscription select error:', selectError);

  if (existing) {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        stripe_customer_id: data.stripe_customer_id,
        stripe_subscription_id: data.stripe_subscription_id,
        plan_id: data.plan_id,
        status: data.status,
        current_period_end: data.current_period_end,
      })
      .eq('user_id', data.user_id);
    if (error) console.error('upsertSubscription update error:', error);
    return error;
  } else {
    const { error } = await supabase.from('subscriptions').insert(data);
    if (error) console.error('upsertSubscription insert error:', error);
    return error;
  }
};

// Called from frontend after Stripe redirects back — writes subscription synchronously
stripeRouter.get('/verify-session', async (c) => {
  try {
    const sessionId = c.req.query('session_id');
    if (!sessionId) return c.json({ error: 'Missing session_id' }, 400);

    const session = await stripe.checkout.sessions.retrieve(sessionId) as any;
    const userId = session.client_reference_id || session.metadata?.user_id;
    if (!userId) return c.json({ error: 'No user_id on session' }, 400);

    // One-time deal payment
    if (session.mode === 'payment' && session.metadata?.deal === 'true') {
      if (session.payment_status !== 'paid') {
        return c.json({ error: 'Payment not completed', payment_status: session.payment_status }, 402);
      }
      const sevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const err = await upsertSubscription({
        user_id: userId,
        stripe_customer_id: session.customer ?? null,
        stripe_subscription_id: `deal_${session.id}`,
        plan_id: 'nova-plus',
        status: 'deal',
        current_period_end: sevenDays,
      });
      if (err) return c.json({ error: 'Failed to save subscription', detail: err.message }, 500);
      return c.json({ ok: true, plan: 'nova-plus', status: 'deal' });
    }

    // Regular subscription
    const subscriptionId = session.subscription;
    if (subscriptionId) {
      const stripeSub = await stripe.subscriptions.retrieve(subscriptionId) as any;
      const planId = stripeSub.metadata?.plan_id || session.metadata?.plan_id || 'standard';
      const err = await upsertSubscription({
        user_id: userId,
        stripe_customer_id: session.customer ?? null,
        stripe_subscription_id: subscriptionId,
        plan_id: planId,
        status: stripeSub.status,
        current_period_end: getPeriodEnd(stripeSub),
      });
      if (err) return c.json({ error: 'Failed to save subscription', detail: err.message }, 500);
      return c.json({ ok: true, plan: planId, status: stripeSub.status });
    }

    return c.json({ ok: true });
  } catch (err: any) {
    console.error('verify-session error:', err);
    return c.json({ error: err.message }, 500);
  }
});

stripeRouter.post('/create-checkout-session', async (c) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return c.json({ error: 'Stripe is not configured.' }, 500);
    }

    const { planId, interval, userId, userEmail } = await c.req.json();

    const prices = PRICE_MAP[planId];
    if (!prices) return c.json({ error: 'Invalid plan ID' }, 400);

    const priceId = interval === 'yearly' ? prices.yearly : prices.monthly;
    const origin = c.req.header('origin') || process.env.FRONTEND_URL || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${origin}/plans?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/plans?canceled=true`,
      customer_email: userEmail || undefined,
      client_reference_id: userId,
      subscription_data: {
        trial_period_days: 7,
        metadata: { user_id: userId, plan_id: planId }
      }
    });

    return c.json({ url: session.url });
  } catch (err: any) {
    console.error('Checkout error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// Cancel at period end — user keeps access until then
// Recovery: look up the most recent completed deal session for a user and re-apply it
stripeRouter.post('/recover-session', async (c) => {
  try {
    const { userId, userEmail } = await c.req.json();
    if (!userId && !userEmail) return c.json({ error: 'userId or userEmail required' }, 400);

    // Search recent completed payment sessions for this user
    const sessions = await stripe.checkout.sessions.list({
      limit: 10,
      expand: ['data.customer'],
    }) as any;

    const match = sessions.data.find((s: any) =>
      (s.client_reference_id === userId || s.metadata?.user_id === userId || s.customer_email === userEmail) &&
      s.payment_status === 'paid' &&
      s.metadata?.deal === 'true'
    );

    if (!match) {
      return c.json({ error: 'No completed deal session found for this user' }, 404);
    }

    const uid = match.client_reference_id || match.metadata?.user_id || userId;
    const sevenDays = new Date(new Date(match.created * 1000).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const err = await upsertSubscription({
      user_id: uid,
      stripe_customer_id: (typeof match.customer === 'string' ? match.customer : match.customer?.id) ?? null,
      stripe_subscription_id: `deal_${match.id}`,
      plan_id: 'nova-plus',
      status: 'deal',
      current_period_end: sevenDays,
    });

    if (err) return c.json({ error: 'DB write failed', detail: err.message }, 500);
    return c.json({ ok: true, plan: 'nova-plus', status: 'deal', expires: sevenDays });
  } catch (err: any) {
    console.error('recover-session error:', err);
    return c.json({ error: err.message }, 500);
  }
});

stripeRouter.post('/cancel-subscription', async (c) => {
  try {
    const { userId } = await c.req.json();
    if (!userId) return c.json({ error: 'Missing userId' }, 400);

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .maybeSingle();

    if (!sub?.stripe_subscription_id) return c.json({ error: 'No active subscription found' }, 404);

    await stripe.subscriptions.update(sub.stripe_subscription_id, { cancel_at_period_end: true });
    await supabase.from('subscriptions').update({ status: 'canceling' }).eq('stripe_subscription_id', sub.stripe_subscription_id);

    return c.json({ success: true, message: 'Subscription will cancel at end of billing period.' });
  } catch (err: any) {
    console.error('Cancel error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// Refund latest charge and cancel immediately (within 7-day window)
stripeRouter.post('/request-refund', async (c) => {
  try {
    const { userId } = await c.req.json();
    if (!userId) return c.json({ error: 'Missing userId' }, 400);

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing', 'canceling'])
      .maybeSingle();

    if (!sub?.stripe_subscription_id) return c.json({ error: 'No active subscription found' }, 404);

    const invoices = await stripe.invoices.list({ subscription: sub.stripe_subscription_id, limit: 1 });
    const latestInvoice = invoices.data[0] as any;
    const paymentIntentId = getPaymentIntent(latestInvoice);

    if (!latestInvoice || !paymentIntentId) {
      // Still in trial — no charge yet, just cancel
      await stripe.subscriptions.cancel(sub.stripe_subscription_id);
      await supabase.from('subscriptions').update({ status: 'canceled' }).eq('stripe_subscription_id', sub.stripe_subscription_id);
      return c.json({ success: true, refunded: false, message: 'Canceled (trial — no charge to refund).' });
    }

    const daysSinceCharge = (Date.now() - latestInvoice.created * 1000) / (1000 * 60 * 60 * 24);
    if (daysSinceCharge > 7) {
      return c.json({ error: 'Refund window expired', eligible: false }, 400);
    }

    await stripe.refunds.create({ payment_intent: paymentIntentId });
    await stripe.subscriptions.cancel(sub.stripe_subscription_id);
    await supabase.from('subscriptions').update({ status: 'canceled' }).eq('stripe_subscription_id', sub.stripe_subscription_id);

    return c.json({ success: true, refunded: true, message: 'Refund issued and subscription canceled.' });
  } catch (err: any) {
    console.error('Refund error:', err);
    return c.json({ error: err.message }, 500);
  }
});

stripeRouter.post('/webhook', async (c) => {
  const sig = c.req.header('stripe-signature');
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const body = await c.req.text();

  let event: Stripe.Event;
  try {
    if (endpointSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } else {
      event = JSON.parse(body);
    }
  } catch (err: any) {
    return c.text(`Webhook Error: ${err.message}`, 400);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id || (session.metadata as any)?.user_id;
      if (!userId) break;

      // One-time deal payment
      if (session.mode === 'payment' && (session.metadata as any)?.deal === 'true') {
        if ((session as any).payment_status !== 'paid') break;
        const sevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        await upsertSubscription({
          user_id: userId,
          stripe_customer_id: (session.customer as string) ?? null,
          stripe_subscription_id: `deal_${session.id}`,
          plan_id: 'nova-plus',
          status: 'deal',
          current_period_end: sevenDays,
        });
        break;
      }

      // Regular subscription
      const subscriptionId = session.subscription as string;
      if (!subscriptionId) break;
      const stripeSub = await stripe.subscriptions.retrieve(subscriptionId) as any;
      const planId = stripeSub.metadata?.plan_id || (session.metadata as any)?.plan_id || 'standard';
      await upsertSubscription({
        user_id: userId,
        stripe_customer_id: (session.customer as string) ?? null,
        stripe_subscription_id: subscriptionId,
        plan_id: planId,
        status: stripeSub.status,
        current_period_end: getPeriodEnd(stripeSub),
      });
      break;
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object as any;
      await supabase.from('subscriptions').update({
        status: sub.status,
        plan_id: sub.metadata?.plan_id,
        current_period_end: getPeriodEnd(sub)
      }).eq('stripe_subscription_id', sub.id);
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as any;
      await supabase.from('subscriptions').update({
        status: 'canceled',
        current_period_end: getPeriodEnd(sub)
      }).eq('stripe_subscription_id', sub.id);
      break;
    }
  }

  return c.json({ received: true });
});

export { stripeRouter };
