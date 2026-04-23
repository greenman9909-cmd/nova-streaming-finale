import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PLANS = [
    {
        id: 'basic',
        name: 'Basic',
        badge: null,
        monthly: 4.99,
        yearly: 44.99,
        yearlySavings: 15,
        color: 'from-slate-500 to-slate-700',
        accentColor: 'text-slate-300',
        borderColor: 'border-slate-500/40',
        glowColor: 'rgba(100,116,139,0.15)',
        features: [
            { icon: 'ri-hd-line', text: '720p HD quality' },
            { icon: 'ri-device-line', text: '1 screen at a time' },
            { icon: 'ri-movie-line', text: 'Movies & TV shows' },
            { icon: 'ri-download-line', text: 'No downloads' },
            { icon: 'ri-advertisement-line', text: 'With ads' },
        ],
        missing: ['Downloads', 'Dolby Atmos', 'Simultaneous streams'],
    },
    {
        id: 'standard',
        name: 'Standard',
        badge: 'Popular',
        monthly: 9.99,
        yearly: 89.99,
        yearlySavings: 25,
        color: 'from-violet-600 to-indigo-700',
        accentColor: 'text-violet-300',
        borderColor: 'border-violet-500/50',
        glowColor: 'rgba(139,92,246,0.2)',
        features: [
            { icon: 'ri-hd-line', text: 'Full HD 1080p' },
            { icon: 'ri-device-line', text: '2 screens at a time' },
            { icon: 'ri-movie-line', text: 'Movies & TV shows' },
            { icon: 'ri-download-line', text: '25 downloads/month' },
            { icon: 'ri-spam-2-line', text: 'Ad-free' },
        ],
        missing: ['Dolby Atmos', '4K Ultra HD'],
    },
    {
        id: 'nova-plus',
        name: 'NOVA+',
        badge: 'Best Value',
        monthly: 14.99,
        yearly: 134.99,
        yearlySavings: 25,
        color: 'from-cyan-500 to-blue-600',
        accentColor: 'text-cyan-300',
        borderColor: 'border-cyan-400/50',
        glowColor: 'rgba(6,182,212,0.25)',
        features: [
            { icon: 'ri-4k-line', text: '4K Ultra HD + HDR' },
            { icon: 'ri-device-line', text: '4 screens at a time' },
            { icon: 'ri-movie-line', text: 'All content + exclusives' },
            { icon: 'ri-download-line', text: 'Unlimited downloads' },
            { icon: 'ri-spam-2-line', text: 'Ad-free' },
            { icon: 'ri-music-2-line', text: 'Dolby Atmos audio' },
            { icon: 'ri-vip-crown-line', text: 'Early access & premieres' },
        ],
        missing: [],
    },
];

export default function Plans() {
    const { user, subscription, isPremium, refreshSubscription } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null);
    const [dealLoading, setDealLoading] = useState(false);

    // Handle success/cancel redirects from Stripe
    useEffect(() => {
        const sessionId = searchParams.get('session_id');
        const isDeal = searchParams.get('deal') === 'success';
        const isSuccess = searchParams.get('success') === 'true';

        if ((isDeal || isSuccess) && sessionId) {
            // Synchronously write subscription from Stripe session, then refresh context
            fetch(`${import.meta.env.VITE_API_URL || ""}/api/stripe/verify-session?session_id=${sessionId}`)
                .then(() => refreshSubscription())
                .then(() => {
                    setToast({
                        type: 'success',
                        msg: isDeal
                            ? '¡Deal activado! 7 días de Nova+ por €1. ¡Disfrútalo!'
                            : '¡Suscripción activada! Disfruta de Nova+',
                    });
                })
                .catch(() => refreshSubscription());
            window.history.replaceState({}, '', '/plans');
        } else if (searchParams.get('canceled') === 'true') {
            setToast({ type: 'info', msg: 'Pago cancelado. Puedes intentarlo de nuevo cuando quieras.' });
            window.history.replaceState({}, '', '/plans');
        }
    }, []);

    const handleDealCheckout = async () => {
        if (!user) { navigate('/login?redirect=/plans'); return; }
        setDealLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/stripe/deal-checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, userEmail: user.email }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                setToast({ type: 'error', msg: data.error || 'Error al iniciar el pago.' });
            }
        } catch {
            setToast({ type: 'error', msg: 'No se pudo conectar con el servidor de pagos.' });
        } finally {
            setDealLoading(false);
        }
    };

    useEffect(() => {
        if (toast) {
            const t = setTimeout(() => setToast(null), 5000);
            return () => clearTimeout(t);
        }
    }, [toast]);

    const handleCheckout = async (planId: string) => {
        if (!user) {
            navigate('/login?redirect=/plans');
            return;
        }
        if (isPremium && subscription?.planId === planId) return;

        setLoadingPlan(planId);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/stripe/create-checkout-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId,
                    interval,
                    userId: user.id,
                    userEmail: user.email,
                }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                setToast({ type: 'error', msg: data.error || 'Error al iniciar el pago.' });
            }
        } catch (err) {
            setToast({ type: 'error', msg: 'No se pudo conectar con el servidor de pagos.' });
        } finally {
            setLoadingPlan(null);
        }
    };

    const isCurrentPlan = (planId: string) =>
        isPremium && subscription?.planId === planId;

    const price = (plan: typeof PLANS[0]) =>
        interval === 'yearly' ? plan.yearly : plan.monthly;

    const perMonth = (plan: typeof PLANS[0]) =>
        interval === 'yearly' ? (plan.yearly / 12).toFixed(2) : plan.monthly.toFixed(2);

    return (
        <main className="min-h-screen bg-[#030305] pb-24">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold backdrop-blur border transition-all animate-slide-in
                    ${toast.type === 'success' ? 'bg-emerald-900/90 border-emerald-500/40 text-emerald-200' :
                      toast.type === 'error'   ? 'bg-red-900/90 border-red-500/40 text-red-200' :
                                                 'bg-slate-800/90 border-white/10 text-white'}`}>
                    <i className={toast.type === 'success' ? 'ri-checkbox-circle-fill text-emerald-400' : toast.type === 'error' ? 'ri-error-warning-fill text-red-400' : 'ri-information-fill text-blue-400'} />
                    {toast.msg}
                </div>
            )}

            {/* Hero header */}
            <div className="relative overflow-hidden pt-32 pb-16 text-center page-gutter">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-500/8 blur-[100px] rounded-full" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-cyan-400/25 bg-cyan-400/10 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300 mb-6">
                    <i className="ri-vip-crown-fill" /> Nova+
                </span>
                <h1 className="text-5xl md:text-7xl font-black text-white leading-none mb-4" style={{ fontFamily: "'Bebas Neue', Impact, sans-serif" }}>
                    Elige tu plan
                </h1>
                <p className="text-white/55 text-base max-w-lg mx-auto leading-relaxed mb-8">
                    7 días gratis. Sin compromisos. Cancela cuando quieras.
                </p>

                {/* Interval toggle */}
                <div className="inline-flex items-center gap-0 p-1 rounded-xl bg-white/5 border border-white/10">
                    <button
                        onClick={() => setInterval('monthly')}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${interval === 'monthly' ? 'bg-white text-black' : 'text-white/50 hover:text-white'}`}
                    >
                        Mensual
                    </button>
                    <button
                        onClick={() => setInterval('yearly')}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${interval === 'yearly' ? 'bg-white text-black' : 'text-white/50 hover:text-white'}`}
                    >
                        Anual
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${interval === 'yearly' ? 'bg-emerald-500 text-white' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            −25%
                        </span>
                    </button>
                </div>
            </div>

            {/* Current subscription banner */}
            {isPremium && subscription && (
                <div className="page-gutter max-w-4xl mx-auto mb-8">
                    <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-emerald-900/30 border border-emerald-500/30 text-sm">
                        <i className="ri-checkbox-circle-fill text-emerald-400 text-lg" />
                        <span className="text-emerald-200 font-semibold">
                            Plan activo: <span className="text-white font-black uppercase">{subscription.planId}</span>
                            {subscription.currentPeriodEnd && (
                                <span className="text-emerald-300/70 font-normal ml-2">
                                    · Renueva el {new Date(subscription.currentPeriodEnd).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                            )}
                        </span>
                    </div>
                </div>
            )}

            {/* LIMITED TIME DEAL BANNER */}
            {!isPremium && (
                <div className="page-gutter max-w-5xl mx-auto mb-10">
                    <div className="relative overflow-hidden rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-950/60 via-orange-950/50 to-red-950/40 backdrop-blur">
                        {/* Glow */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-[400px] h-[150px] bg-amber-500/15 blur-[60px] rounded-full" />
                        </div>
                        <div className="relative flex flex-col md:flex-row items-center gap-6 px-7 py-6">
                            {/* Icon + label */}
                            <div className="flex-shrink-0 flex flex-col items-center gap-2">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                                    <i className="ri-flashlight-fill text-white text-3xl" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-400 bg-amber-400/10 border border-amber-400/25 px-2 py-0.5 rounded-full">
                                    Oferta limitada
                                </span>
                            </div>
                            {/* Text */}
                            <div className="flex-1 text-center md:text-left">
                                <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-1">
                                    7 días de <span className="text-amber-400">NOVA+</span> por solo <span className="text-amber-300">€1</span>
                                </h2>
                                <p className="text-white/55 text-sm leading-relaxed">
                                    4K Ultra HD · Ad-free · Dolby Atmos · Acceso completo. Sin compromiso — un único pago de €1.
                                </p>
                                <div className="flex flex-wrap items-center gap-3 mt-3 justify-center md:justify-start">
                                    {['4K + HDR', 'Sin anuncios', 'Dolby Atmos', '4 pantallas'].map(f => (
                                        <span key={f} className="flex items-center gap-1 text-[11px] font-semibold text-amber-300/80">
                                            <i className="ri-check-line text-amber-400" />{f}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            {/* CTA */}
                            <div className="flex-shrink-0 flex flex-col items-center gap-2">
                                <button
                                    onClick={handleDealCheckout}
                                    disabled={dealLoading}
                                    className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-black text-base bg-gradient-to-r from-amber-400 to-orange-500 text-black hover:brightness-110 transition-all shadow-lg shadow-amber-500/30 disabled:opacity-70 disabled:cursor-wait"
                                >
                                    {dealLoading ? (
                                        <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg> Procesando...</>
                                    ) : (
                                        <><i className="ri-shopping-cart-2-fill" /> Conseguir por €1</>
                                    )}
                                </button>
                                <span className="text-white/30 text-[10px]">Pago único · Sin renovación</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Pricing cards */}
            <div className="page-gutter max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
                {PLANS.map((plan) => {
                    const current = isCurrentPlan(plan.id);
                    const isNovaPlus = plan.id === 'nova-plus';

                    return (
                        <div
                            key={plan.id}
                            className={`relative flex flex-col rounded-2xl border bg-white/[0.03] backdrop-blur transition-all duration-300 overflow-hidden
                                ${isNovaPlus ? 'ring-1 ring-cyan-400/30 shadow-[0_0_60px_rgba(6,182,212,0.12)]' : ''}
                                ${plan.borderColor}`}
                            style={{ boxShadow: isNovaPlus ? `0 0 80px ${plan.glowColor}` : undefined }}
                        >
                            {/* Badge */}
                            {plan.badge && (
                                <div className={`absolute top-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider
                                    ${isNovaPlus ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/30' : 'bg-violet-400/20 text-violet-300 border border-violet-400/30'}`}>
                                    {plan.badge}
                                </div>
                            )}

                            {/* Current plan indicator */}
                            {current && (
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
                            )}

                            <div className="p-7 flex flex-col flex-1">
                                {/* Plan name */}
                                <div className="mb-6">
                                    <div className={`inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest mb-2 ${plan.accentColor}`}>
                                        <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${plan.color} flex items-center justify-center`}>
                                            <i className="ri-play-fill text-white text-[8px]" />
                                        </div>
                                        Nova {plan.name}
                                    </div>
                                    <div className="flex items-end gap-1 mt-3">
                                        <span className="text-4xl font-black text-white leading-none">
                                            €{perMonth(plan)}
                                        </span>
                                        <span className="text-white/40 text-sm mb-0.5">/mes</span>
                                    </div>
                                    {interval === 'yearly' && (
                                        <div className="text-white/40 text-xs mt-1">
                                            €{price(plan).toFixed(2)} facturado anualmente
                                        </div>
                                    )}
                                </div>

                                {/* CTA button */}
                                <button
                                    onClick={() => handleCheckout(plan.id)}
                                    disabled={!!loadingPlan || current}
                                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all mb-7 flex items-center justify-center gap-2
                                        ${current
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                                            : isNovaPlus
                                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:brightness-110 shadow-lg shadow-cyan-500/20'
                                            : 'bg-white/10 hover:bg-white/20 text-white border border-white/15 hover:border-white/30'
                                        }
                                        ${loadingPlan === plan.id ? 'opacity-70 cursor-wait' : ''}
                                        ${loadingPlan && loadingPlan !== plan.id ? 'opacity-40 cursor-not-allowed' : ''}`}
                                >
                                    {loadingPlan === plan.id ? (
                                        <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg> Redirigiendo...</>
                                    ) : current ? (
                                        <><i className="ri-checkbox-circle-fill" /> Plan actual</>
                                    ) : !user ? (
                                        'Comenzar gratis'
                                    ) : (
                                        <>Elegir {plan.name} <i className="ri-arrow-right-line" /></>
                                    )}
                                </button>

                                {/* Divider */}
                                <div className="border-t border-white/5 mb-5" />

                                {/* Features */}
                                <ul className="space-y-3 flex-1">
                                    {plan.features.map((f) => (
                                        <li key={f.text} className="flex items-center gap-2.5 text-sm text-white/80">
                                            <i className={`${f.icon} text-base ${plan.accentColor} flex-shrink-0`} />
                                            {f.text}
                                        </li>
                                    ))}
                                    {plan.missing.map((f) => (
                                        <li key={f} className="flex items-center gap-2.5 text-sm text-white/20 line-through">
                                            <i className="ri-close-line text-base flex-shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Trust row */}
            <div className="page-gutter max-w-3xl mx-auto mt-14 flex flex-wrap items-center justify-center gap-6 text-white/30 text-xs font-semibold">
                {[
                    { icon: 'ri-lock-line', text: 'Pago 100% seguro con Stripe' },
                    { icon: 'ri-calendar-close-line', text: 'Cancela en cualquier momento' },
                    { icon: 'ri-gift-line', text: '7 días de prueba gratuita' },
                    { icon: 'ri-customer-service-line', text: 'Soporte 24/7' },
                ].map((item) => (
                    <div key={item.text} className="flex items-center gap-1.5">
                        <i className={`${item.icon} text-sm`} />
                        {item.text}
                    </div>
                ))}
            </div>

            {/* Stripe badge */}
            <div className="text-center mt-8">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/3 border border-white/8 text-white/25 text-[11px] font-semibold">
                    <i className="ri-shield-check-line" /> Pagos procesados de forma segura por Stripe
                </span>
            </div>
        </main>
    );
}
