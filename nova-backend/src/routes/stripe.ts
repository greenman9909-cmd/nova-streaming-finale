import { Hono } from 'hono';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripeRouter = new Hono();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_dummy_key_to_prevent_crash', {
  apiVersion: '2025-01-27.acacia' as any,
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

const PRICE_MAP: Record<string, { monthly: string; yearly: string }> = {
  'basic':     { monthly: 'price_1TNcRgBC4EINc08b7NtN3x7Y', yearly: 'price_1TNcRfBC4EINc08bDPMdt58j' },
  'standard':  { monthly: 'price_1TNcRgBC4EINc08b591s1rUp', yearly: 'price_1TNcRfBC4EINc08bFx6MCndg' },
  'nova-plus': { monthly: 'price_1TNcRkBC4EINc08bimXV7d5N', yearly: 'price_1TNcRjBC4EINc08bNYG5rd4q' },
};

const getPeriodEnd = (sub: any): string =>
  new Date((sub.current_period_end ?? sub.billing_cycle_anchor ?? 0) * 1000).toISOString();

const getPaymentIntent = (invoice: any): string | null => {
  const pi = invoice?.payment_intent ?? invoice?.payment_intent_data?.payment_intent ?? null;
  if (!pi) return null;
  return typeof pi === 'string' ? pi : pi.id;
};

stripeRouter.post('/create-checkout-session', async (c) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) return c.json({ error: 'Stripe is not configured.' }, 500);

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

stripeRouter.post('/cancel-subscription', async (c) => {
  try {
    const { userId } = await c.req.json();
    if (!userId) return c.json({ error: 'Missing userId' }, 400);

    const { data: sub } = await supabase
      .from('subscriptions').select('stripe_subscription_id')
      .eq('user_id', userId).in('status', ['active', 'trialing']).maybeSingle();

    if (!sub?.stripe_subscription_id) return c.json({ error: 'No active subscription found' }, 404);

    await stripe.subscriptions.update(sub.stripe_subscription_id, { cancel_at_period_end: true });
    await supabase.from('subscriptions').update({ status: 'canceling' }).eq('stripe_subscription_id', sub.stripe_subscription_id);

    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

stripeRouter.post('/request-refund', async (c) => {
  try {
    const { userId } = await c.req.json();
    if (!userId) return c.json({ error: 'Missing userId' }, 400);

    const { data: sub } = await supabase
      .from('subscriptions').select('stripe_subscription_id')
      .eq('user_id', userId).in('status', ['active', 'trialing', 'canceling']).maybeSingle();

    if (!sub?.stripe_subscription_id) return c.json({ error: 'No active subscription found' }, 404);

    const invoices = await stripe.invoices.list({ subscription: sub.stripe_subscription_id, limit: 1 });
    const latestInvoice = invoices.data[0] as any;
    const paymentIntentId = getPaymentIntent(latestInvoice);

    if (!latestInvoice || !paymentIntentId) {
      await stripe.subscriptions.cancel(sub.stripe_subscription_id);
      await supabase.from('subscriptions').update({ status: 'canceled' }).eq('stripe_subscription_id', sub.stripe_subscription_id);
      return c.json({ success: true, refunded: false });
    }

    const daysSinceCharge = (Date.now() - latestInvoice.created * 1000) / (1000 * 60 * 60 * 24);
    if (daysSinceCharge > 7) return c.json({ error: 'Refund window expired', eligible: false }, 400);

    await stripe.refunds.create({ payment_intent: paymentIntentId });
    await stripe.subscriptions.cancel(sub.stripe_subscription_id);
    await supabase.from('subscriptions').update({ status: 'canceled' }).eq('stripe_subscription_id', sub.stripe_subscription_id);

    return c.json({ success: true, refunded: true });
  } catch (err: any) {
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
      const userId = session.client_reference_id;
      const subscriptionId = session.subscription as string;
      if (!userId || !subscriptionId) break;
      const stripeSub = await stripe.subscriptions.retrieve(subscriptionId) as any;
      await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscriptionId,
        plan_id: stripeSub.metadata?.plan_id || 'basic',
        status: stripeSub.status,
        current_period_end: getPeriodEnd(stripeSub)
      }, { onConflict: 'user_id' });
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
