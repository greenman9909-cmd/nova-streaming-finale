import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { supabase } from '../lib/supabase';
import { WatchHistoryItem } from '../services/api';

type DeviceSession = {
    id: number;
    name: string;
    location: string;
    current: boolean;
    ip: string;
};

const PLAN_LABELS: Record<string, string> = {
    'basic': 'Nova Basic',
    'standard': 'Nova Standard',
    'nova-plus': 'NOVA+',
};

export default function Settings() {
    const { user, updateProfile, subscription, isPremium, refreshSubscription } = useAuth();
    const { settings, updateSettings, t } = useSettings();
    const [activeTab, setActiveTab] = useState<'account' | 'web' | 'playback' | 'notifications' | 'appearance' | 'devices' | 'history'>('account');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Account State
    const [email, setEmail] = useState(user?.email || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [historyItems, setHistoryItems] = useState<WatchHistoryItem[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [testNotifStatus, setTestNotifStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [subAction, setSubAction] = useState<'idle' | 'canceling' | 'refunding'>('idle');
    const [subModal, setSubModal] = useState<'cancel' | 'refund' | null>(null);
    const [subMsg, setSubMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Real Current Device Data
    const [devices, setDevices] = useState<DeviceSession[]>([]);

    useEffect(() => {
        const getDeviceName = () => {
            const ua = window.navigator.userAgent;
            const platform = navigator.platform || '';
            let os = 'Unknown OS';
            if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';
            else if (/Android/.test(ua)) os = 'Android';
            else if (platform.includes('Mac')) os = 'Mac OS';
            else if (platform.includes('Win') || /Win/.test(ua)) os = 'Windows PC';
            else if (platform.includes('Linux')) os = 'Linux';

            let browser = 'Browser';
            if (ua.includes('Firefox') && !ua.includes('Seamonkey')) browser = 'Firefox';
            else if (ua.includes('Edg/') || ua.includes('EdgA/')) browser = 'Edge';
            else if (ua.includes('OPR/') || ua.includes('Opera')) browser = 'Opera';
            else if (ua.includes('Chrome') && !ua.includes('Chromium')) browser = 'Chrome';
            else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';

            return `${os} (${browser})`;
        };

        const deviceName = getDeviceName();

        // Seed with timezone city while the IP fetch is in flight
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const tzCity = tz ? tz.split('/').pop()?.replace(/_/g, ' ') ?? 'Unknown' : 'Unknown';

        setDevices([{ id: 1, name: deviceName, location: tzCity, current: true, ip: 'Loading...' }]);

        // Fetch real public IP + city from ipapi.co (free, no key, 1000 req/day)
        fetch('https://ipapi.co/json/')
            .then(r => r.json())
            .then((data) => {
                const city = data.city || tzCity;
                const country = data.country_name || '';
                const ip = data.ip || '—';
                setDevices([{
                    id: 1,
                    name: deviceName,
                    location: country ? `${city} • ${country}` : city,
                    current: true,
                    ip,
                }]);
            })
            .catch(() => {
                // Keep timezone city on error, show — for IP
                setDevices([{ id: 1, name: deviceName, location: tzCity, current: true, ip: '—' }]);
            });
    }, []);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            const updates: { email?: string; password?: string } = {};
            if (email !== user?.email) updates.email = email;
            if (password) {
                if (password !== confirmPassword) throw new Error(t('settings.passwordsMismatch'));
                updates.password = password;
            }

            if (Object.keys(updates).length === 0) return;

            const { success, error } = await updateProfile(updates);
            if (!success) throw error;

            setMessage({ type: 'success', text: t('settings.profileUpdated') });
            setPassword('');
            setConfirmPassword('');
        } catch (error: unknown) {
            const text = error instanceof Error ? error.message : t('login.unexpectedError');
            setMessage({ type: 'error', text });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveDevice = (id: number) => {
        setDevices(devices.filter(d => d.id !== id));
    };

    const loadHistory = async () => {
        if (!user) return;
        setHistoryLoading(true);
        const { data, error } = await supabase
            .from('watch_history')
            .select('id,media_id,media_type,title,progress,image,updated_at')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(24);

        if (!error) {
            setHistoryItems((data || []) as WatchHistoryItem[]);
        } else {
            console.error('Failed to load history:', error);
        }
        setHistoryLoading(false);
    };

    const clearHistory = async () => {
        if (!user) return;
        await supabase.from('watch_history').delete().eq('user_id', user.id);
        setHistoryItems([]);
    };

    const sendTestNotification = async () => {
        if (!user) return;
        setTestNotifStatus(null);
        const { error } = await supabase.from('notifications').insert({
            user_id: user.id,
            title: t('settings.testNotificationTitle'),
            message: t('settings.testNotificationMessage'),
            icon: 'ri-notification-3-fill',
            read: false
        });
        if (error) {
            console.error('Failed to send test notification:', error);
            setTestNotifStatus({ type: 'error', text: t('settings.testNotificationError') });
            return;
        }
        setTestNotifStatus({ type: 'success', text: t('settings.testNotificationSent') });
        setTimeout(() => setTestNotifStatus(null), 2500);
    };

    useEffect(() => {
        if (activeTab === 'history') {
            loadHistory();
        }
    }, [activeTab, user]);

    const tabs = [
        { id: 'account', label: t('settings.account'), icon: 'ri-user-line' },
        { id: 'web', label: t('settings.web'), icon: 'ri-settings-line' },
        { id: 'playback', label: t('settings.playback'), icon: 'ri-film-line' },
        { id: 'notifications', label: t('settings.notifications'), icon: 'ri-notification-3-line' },
        { id: 'appearance', label: t('settings.appearance'), icon: 'ri-palette-line' },
        { id: 'devices', label: t('settings.devices'), icon: 'ri-computer-line' },
        { id: 'history', label: t('settings.history'), icon: 'ri-history-line' },
    ] as const;

    const handleCancelSubscription = async () => {
        if (!user) return;
        setSubAction('canceling');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/stripe/cancel-subscription`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id }),
            });
            const data = await res.json();
            if (data.success) {
                setSubMsg({ type: 'success', text: 'Suscripción cancelada. Mantendrás el acceso hasta el final del período actual.' });
                await refreshSubscription();
            } else {
                setSubMsg({ type: 'error', text: data.error || 'Error al cancelar.' });
            }
        } catch {
            setSubMsg({ type: 'error', text: 'No se pudo conectar con el servidor.' });
        } finally {
            setSubAction('idle');
            setSubModal(null);
        }
    };

    const handleRequestRefund = async () => {
        if (!user) return;
        setSubAction('refunding');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/stripe/request-refund`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id }),
            });
            const data = await res.json();
            if (data.success) {
                const msg = data.refunded
                    ? 'Reembolso procesado y suscripción cancelada. Verás el cargo revertido en 5–10 días hábiles.'
                    : 'Suscripción cancelada (estabas en período de prueba, sin cargo que reembolsar).';
                setSubMsg({ type: 'success', text: msg });
                await refreshSubscription();
            } else if (data.error === 'Refund window expired') {
                setSubMsg({ type: 'error', text: 'El período de reembolso de 7 días ha expirado. Puedes cancelar la suscripción sin reembolso.' });
            } else {
                setSubMsg({ type: 'error', text: data.error || 'Error al procesar el reembolso.' });
            }
        } catch {
            setSubMsg({ type: 'error', text: 'No se pudo conectar con el servidor.' });
        } finally {
            setSubAction('idle');
            setSubModal(null);
        }
    };

    return (
        <div className="min-h-screen pt-24 page-gutter pb-10">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-black text-white mb-8">{t('settings.title')}</h1>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Navigation */}
                    <div className="w-full lg:w-64 flex-shrink-0">
                        <div className="bg-[#0a0a0f] border border-white/10 rounded-2xl p-2 sticky top-24">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all mb-1 text-sm ${activeTab === tab.id
                                        ? 'bg-nova-accent/20 text-nova-accent border border-nova-accent/20'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <i className={`${tab.icon} text-lg`}></i>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1">
                        <div className="bg-[#0a0a0f] border border-white/10 rounded-2xl p-8 shadow-xl relative overflow-hidden min-h-[500px]">
                            {/* Background Bloom */}
                            <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

                            {/* ACCOUNT TAB */}
                            {activeTab === 'account' && (
                                <div className="space-y-8 relative z-10 animate-fade-in">
                                    <div>
                                        <h2 className="text-xl font-bold text-white mb-1">{t('settings.account')}</h2>
                                        <p className="text-gray-400 text-sm">{t('settings.accountSubtitle')}</p>
                                    </div>

                                    <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-lg">
                                        {message && (
                                            <div className={`p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                                {message.text}
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">{t('settings.emailAddress')}</label>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">{t('settings.newPassword')}</label>
                                            <input
                                                type="password"
                                                placeholder={t('settings.passwordPlaceholder')}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                                            />
                                        </div>

                                        {password && (
                                            <div className="animate-fade-in">
                                                <label className="block text-sm font-medium text-gray-400 mb-2">{t('settings.confirmPassword')}</label>
                                                <input
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                                                />
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {isLoading && <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
                                            {t('settings.saveChanges')}
                                        </button>
                                    </form>

                                    <div className="pt-8 border-t border-white/10">
                                        <h3 className="text-lg font-bold text-white mb-4">{t('settings.subscriptionPlan')}</h3>

                                        {/* Sub message */}
                                        {subMsg && (
                                            <div className={`mb-4 flex items-start gap-3 p-4 rounded-xl text-sm font-medium border ${subMsg.type === 'success' ? 'bg-emerald-900/30 border-emerald-500/30 text-emerald-200' : 'bg-red-900/30 border-red-500/30 text-red-200'}`}>
                                                <i className={subMsg.type === 'success' ? 'ri-checkbox-circle-fill text-emerald-400 mt-0.5' : 'ri-error-warning-fill text-red-400 mt-0.5'} />
                                                <span>{subMsg.text}</span>
                                            </div>
                                        )}

                                        {isPremium && subscription ? (
                                            <div className="space-y-4">
                                                {/* Active plan card */}
                                                <div className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/25 rounded-xl p-6">
                                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <i className="ri-vip-crown-fill text-cyan-400"></i>
                                                                <span className="font-black text-white text-lg">{PLAN_LABELS[subscription.planId] || subscription.planId}</span>
                                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${subscription.status === 'trialing' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : subscription.status === 'canceling' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : subscription.status === 'deal' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
                                                                    {subscription.status === 'trialing' ? 'Prueba' : subscription.status === 'canceling' ? 'Cancelando' : subscription.status === 'deal' ? 'Deal 7 días' : 'Activo'}
                                                                </span>
                                                            </div>
                                                            {subscription.currentPeriodEnd && (
                                                                <p className="text-gray-400 text-sm">
                                                                    {subscription.status === 'canceling' || subscription.status === 'deal'
                                                                        ? `Acceso hasta el ${new Date(subscription.currentPeriodEnd).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`
                                                                        : `Próxima renovación: ${new Date(subscription.currentPeriodEnd).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                        <a href="/plans" className="px-5 py-2 bg-white/8 hover:bg-white/15 border border-white/15 text-white text-sm font-semibold rounded-lg transition-all whitespace-nowrap">
                                                            Cambiar plan
                                                        </a>
                                                    </div>
                                                </div>

                                                {/* Danger zone */}
                                                {subscription.status !== 'canceling' && (
                                                    <div className="border border-white/8 rounded-xl p-5 space-y-3">
                                                        <h4 className="text-sm font-bold text-white/60 uppercase tracking-widest">Gestionar suscripción</h4>
                                                        <div className="flex flex-col sm:flex-row gap-3">
                                                            <button
                                                                onClick={() => { setSubModal('refund'); setSubMsg(null); }}
                                                                className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-300 text-sm font-semibold transition-all"
                                                            >
                                                                <i className="ri-refund-line" />
                                                                Solicitar reembolso
                                                            </button>
                                                            <button
                                                                onClick={() => { setSubModal('cancel'); setSubMsg(null); }}
                                                                className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-300 text-sm font-semibold transition-all"
                                                            >
                                                                <i className="ri-close-circle-line" />
                                                                Cancelar suscripción
                                                            </button>
                                                        </div>
                                                        <p className="text-white/30 text-xs">Reembolsos disponibles dentro de los 7 días posteriores al pago.</p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <i className="ri-vip-crown-fill text-yellow-400"></i>
                                                        <span className="font-bold text-white">{t('settings.freePlan')}</span>
                                                    </div>
                                                    <p className="text-gray-400 text-sm">{t('settings.upgradePlanSubtitle')}</p>
                                                </div>
                                                <a href="/plans" className="px-6 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-violet-500/25 transition-all">
                                                    {t('settings.upgradePlan')}
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    {/* Confirmation modals */}
                                    {subModal && (
                                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setSubModal(null)}>
                                            <div className="w-full max-w-sm bg-[#111114] border border-white/12 rounded-2xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${subModal === 'refund' ? 'bg-amber-500/15' : 'bg-red-500/15'}`}>
                                                    <i className={`text-2xl ${subModal === 'refund' ? 'ri-refund-line text-amber-400' : 'ri-close-circle-line text-red-400'}`} />
                                                </div>
                                                <h3 className="text-lg font-black text-white mb-2">
                                                    {subModal === 'refund' ? 'Solicitar reembolso' : 'Cancelar suscripción'}
                                                </h3>
                                                <p className="text-white/55 text-sm mb-6 leading-relaxed">
                                                    {subModal === 'refund'
                                                        ? 'Se reembolsará tu último pago y la suscripción se cancelará inmediatamente. Solo disponible dentro de los 7 días del último cargo.'
                                                        : 'Tu suscripción se cancelará al final del período actual. Seguirás teniendo acceso hasta entonces.'
                                                    }
                                                </p>
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => setSubModal(null)}
                                                        className="flex-1 py-2.5 rounded-xl bg-white/8 hover:bg-white/15 text-white text-sm font-semibold transition-all"
                                                    >
                                                        Volver
                                                    </button>
                                                    <button
                                                        onClick={subModal === 'refund' ? handleRequestRefund : handleCancelSubscription}
                                                        disabled={subAction !== 'idle'}
                                                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${subModal === 'refund' ? 'bg-amber-500 hover:bg-amber-400 text-black' : 'bg-red-600 hover:bg-red-500 text-white'} disabled:opacity-60`}
                                                    >
                                                        {subAction !== 'idle' && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
                                                        {subAction !== 'idle' ? 'Procesando...' : subModal === 'refund' ? 'Confirmar reembolso' : 'Confirmar cancelación'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* WEB SETTINGS TAB */}
                            {activeTab === 'web' && (
                                <div className="space-y-8 relative z-10 animate-fade-in">
                                    <div>
                                        <h2 className="text-xl font-bold text-white mb-1">{t('settings.web')}</h2>
                                        <p className="text-gray-400 text-sm">{t('settings.webSubtitle')}</p>
                                    </div>

                                    <div className="space-y-4 max-w-2xl">
                                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                                    <i className="ri-play-circle-line text-xl"></i>
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-white">{t('settings.autoplay')}</h3>
                                                    <p className="text-xs text-gray-500">{t('settings.autoplayHint')}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => updateSettings({ autoplay: !settings.autoplay })} className={`w-12 h-6 rounded-full transition-colors relative ${settings.autoplay ? 'bg-nova-accent' : 'bg-gray-700'}`}>
                                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.autoplay ? 'translate-x-6' : 'translate-x-0'}`} />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                                                    <i className="ri-shield-keyhole-line text-xl"></i>
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-white">{t('settings.adultFilter')}</h3>
                                                    <p className="text-xs text-gray-500">{t('settings.adultFilterHint')}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => updateSettings({ contentFilter: !settings.contentFilter })} className={`w-12 h-6 rounded-full transition-colors relative ${settings.contentFilter ? 'bg-nova-accent' : 'bg-gray-700'}`}>
                                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.contentFilter ? 'translate-x-6' : 'translate-x-0'}`} />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                                    <i className="ri-save-3-line text-xl"></i>
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-white">{t('settings.dataSaver')}</h3>
                                                    <p className="text-xs text-gray-500">{t('settings.dataSaverHint')}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => updateSettings({ dataSaver: !settings.dataSaver })} className={`w-12 h-6 rounded-full transition-colors relative ${settings.dataSaver ? 'bg-nova-accent' : 'bg-gray-700'}`}>
                                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.dataSaver ? 'translate-x-6' : 'translate-x-0'}`} />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                                                    <i className="ri-wifi-line text-xl"></i>
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-white">{t('settings.streamOverWifiOnly')}</h3>
                                                    <p className="text-xs text-gray-500">{t('settings.streamOverWifiOnlyHint')}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => updateSettings({ streamOverWifiOnly: !settings.streamOverWifiOnly })} className={`w-12 h-6 rounded-full transition-colors relative ${settings.streamOverWifiOnly ? 'bg-nova-accent' : 'bg-gray-700'}`}>
                                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.streamOverWifiOnly ? 'translate-x-6' : 'translate-x-0'}`} />
                                            </button>
                                        </div>

                                        {/* Language Selection */}
                                        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                            <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                                                <i className="ri-translate-2 text-nova-accent"></i> {t('settings.language')}
                                            </h3>
                                            <div className="grid grid-cols-4 gap-2">
                                                {['en', 'es', 'fr', 'pt'].map((lang) => (
                                                    <button
                                                        key={lang}
                                                        onClick={() => updateSettings({ language: lang as 'en' | 'es' | 'fr' | 'pt' })}
                                                        className={`py-2 rounded-lg text-sm font-medium border ${settings.language === lang
                                                            ? 'bg-nova-accent/20 border-nova-accent text-white'
                                                            : 'bg-black/20 border-transparent text-gray-400 hover:border-white/10'
                                                            }`}
                                                    >
                                                        {lang === 'en' && 'English'}
                                                        {lang === 'es' && 'Espanol'}
                                                        {lang === 'fr' && 'Francais'}
                                                        {lang === 'pt' && 'Portugues'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* PLAYBACK TAB */}
                            {activeTab === 'playback' && (
                                <div className="space-y-8 relative z-10 animate-fade-in">
                                    <div>
                                        <h2 className="text-xl font-bold text-white mb-1">{t('settings.playback')}</h2>
                                        <p className="text-gray-400 text-sm">{t('settings.playbackSubtitle')}</p>
                                    </div>

                                    <div className="space-y-6 max-w-2xl">
                                        {/* Quality & Speed */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                                <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                                                    <i className="ri-hd-line text-violet-400"></i> {t('settings.defaultQuality')}
                                                </h3>
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                                    {['1080p', '720p', '480p', 'Auto'].map((q) => (
                                                        <button
                                                            key={q}
                                                            onClick={() => updateSettings({ defaultQuality: q })}
                                                            className={`py-2 rounded-lg text-sm font-medium border ${settings.defaultQuality === q
                                                                ? 'bg-nova-accent/20 border-nova-accent text-white'
                                                                : 'bg-black/20 border-transparent text-gray-400 hover:border-white/10'
                                                                }`}
                                                        >
                                                            {q}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                                <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                                                    <i className="ri-speed-up-line text-violet-400"></i> {t('settings.playbackSpeed')}
                                                </h3>
                                                <div className="grid grid-cols-3 lg:grid-cols-5 gap-2">
                                                    {['0.75x', '1x', '1.25x', '1.5x', '2x'].map((s) => (
                                                        <button
                                                            key={s}
                                                            onClick={() => updateSettings({ playbackSpeed: s as '0.75x' | '1x' | '1.25x' | '1.5x' | '2x' })}
                                                            className={`py-2 rounded-lg text-xs font-medium border ${settings.playbackSpeed === s
                                                                ? 'bg-nova-accent/20 border-nova-accent text-white'
                                                                : 'bg-black/20 border-transparent text-gray-400 hover:border-white/10'
                                                                }`}
                                                        >
                                                            {s}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Audio Preferences */}
                                        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                            <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                                                <i className="ri-volume-up-line text-violet-400"></i> {t('settings.audioPreferences')}
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs text-gray-500 mb-2 block">{t('settings.preferredAudio')}</label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {['sub', 'dub'].map((type) => (
                                                            <button
                                                                key={type}
                                                                onClick={() => updateSettings({ preferredAudioType: type as 'sub' | 'dub' })}
                                                                className={`py-2 rounded-lg text-sm font-medium border ${settings.preferredAudioType === type
                                                                    ? 'bg-nova-accent/20 border-nova-accent text-white'
                                                                    : 'bg-black/20 border-transparent text-gray-400 hover:border-white/10'
                                                                    }`}
                                                            >
                                                                {type === 'sub' ? t('settings.audioSub') : t('settings.audioDub')}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500 mb-2 block">{t('settings.audioLanguage')}</label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {['original', 'english'].map((lang) => (
                                                            <button
                                                                key={lang}
                                                                onClick={() => updateSettings({ preferredAudioLanguage: lang as 'original' | 'english' })}
                                                                className={`py-2 rounded-lg text-sm font-medium border ${settings.preferredAudioLanguage === lang
                                                                    ? 'bg-nova-accent/20 border-nova-accent text-white'
                                                                    : 'bg-black/20 border-transparent text-gray-400 hover:border-white/10'
                                                                    }`}
                                                            >
                                                                {lang === 'original' ? t('settings.audioOriginal') : t('settings.audioEnglish')}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Playback Behaviors */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                                        <i className="ri-skip-forward-line text-xl"></i>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-medium text-white">{t('settings.autoSkipIntro')}</h3>
                                                        <p className="text-xs text-gray-500">{t('settings.autoSkipIntroHint')}</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => updateSettings({ autoSkipIntro: !settings.autoSkipIntro })} className={`w-12 h-6 rounded-full transition-colors relative ${settings.autoSkipIntro ? 'bg-nova-accent' : 'bg-gray-700'}`}>
                                                    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.autoSkipIntro ? 'translate-x-6' : 'translate-x-0'}`} />
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                                        <i className="ri-skip-forward-fill text-xl"></i>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-medium text-white">{t('settings.autoSkipCredits')}</h3>
                                                        <p className="text-xs text-gray-500">{t('settings.autoSkipCreditsHint')}</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => updateSettings({ autoSkipCredits: !settings.autoSkipCredits })} className={`w-12 h-6 rounded-full transition-colors relative ${settings.autoSkipCredits ? 'bg-nova-accent' : 'bg-gray-700'}`}>
                                                    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.autoSkipCredits ? 'translate-x-6' : 'translate-x-0'}`} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Subtitles */}
                                        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                            <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                                                <i className="ri-closed-captioning-line text-violet-400"></i> {t('settings.subtitleStyling')}
                                            </h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-xs text-gray-500 mb-2 block">{t('settings.subtitleSize')}</label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {['small', 'medium', 'large'].map((s) => (
                                                            <button
                                                                key={s}
                                                                onClick={() => updateSettings({ subtitleSize: s as 'small' | 'medium' | 'large' })}
                                                                className={`py-2 rounded-lg text-sm font-medium capitalize border ${settings.subtitleSize === s
                                                                    ? 'bg-nova-accent/20 border-nova-accent text-white'
                                                                    : 'bg-black/20 border-transparent text-gray-400 hover:border-white/10'
                                                                    }`}
                                                            >
                                                                {s}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <label className="text-xs text-gray-500 block">{t('settings.subtitleColor')}</label>
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <span className="text-xs text-gray-500 font-medium">{t('settings.subtitleBackground')}</span>
                                                            <button
                                                                onClick={(e) => { e.preventDefault(); updateSettings({ subtitleBackground: !settings.subtitleBackground }); }}
                                                                className={`w-8 h-4 rounded-full transition-colors relative ${settings.subtitleBackground ? 'bg-nova-accent' : 'bg-gray-700'}`}
                                                            >
                                                                <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${settings.subtitleBackground ? 'translate-x-4' : 'translate-x-0'}`} />
                                                            </button>
                                                        </label>
                                                    </div>
                                                    <div className="flex gap-2 flex-wrap">
                                                        {[
                                                            { id: 'white', label: t('settings.colorWhite'), className: 'bg-white' },
                                                            { id: 'yellow', label: t('settings.colorYellow'), className: 'bg-yellow-300' },
                                                            { id: 'cyan', label: t('settings.colorCyan'), className: 'bg-cyan-300' },
                                                            { id: 'lime', label: t('settings.colorLime'), className: 'bg-lime-300' },
                                                        ].map((color) => (
                                                            <button
                                                                key={color.id}
                                                                onClick={() => updateSettings({ subtitleColor: color.id })}
                                                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border ${settings.subtitleColor === color.id
                                                                    ? 'border-nova-accent text-white bg-nova-accent/20'
                                                                    : 'border-white/10 text-gray-400 hover:border-white/20'
                                                                    }`}
                                                            >
                                                                <span className={`w-3 h-3 rounded-full ${color.className}`} />
                                                                {color.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Preview */}
                                            <div className="mt-4 p-6 bg-black/50 rounded-lg flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center">
                                                <span
                                                    className={`px-3 py-1 rounded transition-colors ${settings.subtitleBackground ? 'bg-black/75' : 'bg-transparent drop-shadow-md'}`}
                                                    style={{
                                                        color: settings.subtitleColor,
                                                        fontSize: settings.subtitleSize === 'small' ? '12px' : settings.subtitleSize === 'medium' ? '16px' : '20px',
                                                        textShadow: settings.subtitleBackground ? 'none' : '0px 2px 4px rgba(0,0,0,0.8)'
                                                    }}
                                                >
                                                    {t('settings.subtitlePreview')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* NOTIFICATIONS TAB */}
                            {activeTab === 'notifications' && (
                                <div className="space-y-8 relative z-10 animate-fade-in">
                                    <div>
                                        <h2 className="text-xl font-bold text-white mb-1">{t('settings.notifications')}</h2>
                                        <p className="text-gray-400 text-sm">{t('settings.notificationsSubtitle')}</p>
                                    </div>

                                    <div className="space-y-4 max-w-2xl">
                                        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                            <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                                                <i className="ri-mail-line text-violet-400"></i> {t('settings.notificationChannels')}
                                            </h3>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-white text-sm font-medium">{t('settings.notifyEmail')}</p>
                                                        <p className="text-xs text-gray-500">{t('settings.notifyEmailHint')}</p>
                                                    </div>
                                                    <button onClick={() => updateSettings({ notifyEmail: !settings.notifyEmail })} className={`w-12 h-6 rounded-full transition-colors relative ${settings.notifyEmail ? 'bg-nova-accent' : 'bg-gray-700'}`}>
                                                        <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.notifyEmail ? 'translate-x-6' : 'translate-x-0'}`} />
                                                    </button>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-white text-sm font-medium">{t('settings.notifyPush')}</p>
                                                        <p className="text-xs text-gray-500">{t('settings.notifyPushHint')}</p>
                                                    </div>
                                                    <button onClick={() => updateSettings({ notifyPush: !settings.notifyPush })} className={`w-12 h-6 rounded-full transition-colors relative ${settings.notifyPush ? 'bg-nova-accent' : 'bg-gray-700'}`}>
                                                        <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.notifyPush ? 'translate-x-6' : 'translate-x-0'}`} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                            <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                                                <i className="ri-notification-3-line text-violet-400"></i> {t('settings.notificationTypes')}
                                            </h3>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-white text-sm font-medium">{t('settings.notifyNewEpisodes')}</p>
                                                    <button onClick={() => updateSettings({ notifyNewEpisodes: !settings.notifyNewEpisodes })} className={`w-12 h-6 rounded-full transition-colors relative ${settings.notifyNewEpisodes ? 'bg-nova-accent' : 'bg-gray-700'}`}>
                                                        <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.notifyNewEpisodes ? 'translate-x-6' : 'translate-x-0'}`} />
                                                    </button>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-white text-sm font-medium">{t('settings.notifyRecommendations')}</p>
                                                    <button onClick={() => updateSettings({ notifyRecommendations: !settings.notifyRecommendations })} className={`w-12 h-6 rounded-full transition-colors relative ${settings.notifyRecommendations ? 'bg-nova-accent' : 'bg-gray-700'}`}>
                                                        <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.notifyRecommendations ? 'translate-x-6' : 'translate-x-0'}`} />
                                                    </button>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-white text-sm font-medium">{t('settings.notifyProductUpdates')}</p>
                                                    <button onClick={() => updateSettings({ notifyProductUpdates: !settings.notifyProductUpdates })} className={`w-12 h-6 rounded-full transition-colors relative ${settings.notifyProductUpdates ? 'bg-nova-accent' : 'bg-gray-700'}`}>
                                                        <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.notifyProductUpdates ? 'translate-x-6' : 'translate-x-0'}`} />
                                                    </button>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-white text-sm font-medium">{t('settings.marketingEmails')}</p>
                                                        <p className="text-xs text-gray-500">{t('settings.marketingEmailsHint')}</p>
                                                    </div>
                                                    <button onClick={() => updateSettings({ marketingEmails: !settings.marketingEmails })} className={`w-12 h-6 rounded-full transition-colors relative ${settings.marketingEmails ? 'bg-nova-accent' : 'bg-gray-700'}`}>
                                                        <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.marketingEmails ? 'translate-x-6' : 'translate-x-0'}`} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                                            <div>
                                                <h3 className="text-white font-medium">{t('settings.testNotification')}</h3>
                                                <p className="text-xs text-gray-500">{t('settings.testNotificationHint')}</p>
                                                {testNotifStatus && (
                                                    <p className={`text-xs mt-2 ${testNotifStatus.type === 'error' ? 'text-red-300' : 'text-emerald-300'}`}>
                                                        {testNotifStatus.text}
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                onClick={sendTestNotification}
                                                disabled={!user}
                                                className="px-4 py-2 rounded-lg bg-nova-accent/20 border border-nova-accent/40 text-white text-xs font-bold hover:bg-nova-accent/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {t('settings.sendTest')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* APPEARANCE TAB */}
                            {activeTab === 'appearance' && (
                                <div className="space-y-8 relative z-10 animate-fade-in">
                                    <div>
                                        <h2 className="text-xl font-bold text-white mb-1">{t('settings.appearance')}</h2>
                                        <p className="text-gray-400 text-sm">{t('settings.appearanceSubtitle')}</p>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 max-w-2xl">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                                                <i className="ri-movie-2-line text-xl"></i>
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-white">{t('settings.reduceMotion')}</h3>
                                                <p className="text-xs text-gray-500">{t('settings.reduceMotionHint')}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => updateSettings({ reduceMotion: !settings.reduceMotion })} className={`w-12 h-6 rounded-full transition-colors relative ${settings.reduceMotion ? 'bg-nova-accent' : 'bg-gray-700'}`}>
                                            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.reduceMotion ? 'translate-x-6' : 'translate-x-0'}`} />
                                        </button>
                                    </div>

                                    <div className="p-6 bg-white/5 rounded-xl border border-white/5 max-w-2xl">
                                        <h3 className="font-medium text-white mb-4">{t('settings.accentColor')}</h3>
                                        <div className="flex gap-4 flex-wrap">
                                            {[
                                                { id: 'violet', bg: 'bg-violet-500' },
                                                { id: 'blue', bg: 'bg-blue-500' },
                                                { id: 'cyan', bg: 'bg-cyan-500' },
                                                { id: 'green', bg: 'bg-emerald-500' },
                                                { id: 'rose', bg: 'bg-rose-500' },
                                                { id: 'amber', bg: 'bg-amber-500' },
                                            ].map((color) => (
                                                <button
                                                    key={color.id}
                                                    onClick={() => updateSettings({ accentColor: color.id as 'violet' | 'blue' | 'cyan' | 'green' | 'rose' | 'amber' })}
                                                    className={`w-12 h-12 rounded-full ${color.bg} flex items-center justify-center transition-transform hover:scale-110 ring-2 ring-offset-2 ring-offset-[#0a0a0f] ${settings.accentColor === color.id ? 'ring-white scale-110' : 'ring-transparent'
                                                        }`}
                                                >
                                                    {settings.accentColor === color.id && <i className="ri-check-line text-white"></i>}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-transparent to-transparent border border-white/10 flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold
                                                ${settings.accentColor === 'violet' ? 'bg-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.5)]' : ''}
                                                ${settings.accentColor === 'blue' ? 'bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : ''}
                                                ${settings.accentColor === 'cyan' ? 'bg-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.5)]' : ''}
                                                ${settings.accentColor === 'green' ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]' : ''}
                                                ${settings.accentColor === 'rose' ? 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.5)]' : ''}
                                                ${settings.accentColor === 'amber' ? 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.5)]' : ''}
                                            `}>
                                                {settings.accentColor === 'violet' && <i className="ri-magic-line"></i>}
                                                {settings.accentColor !== 'violet' && <i className="ri-palette-line"></i>}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{t('settings.preview')}</p>
                                                <p className="text-xs text-gray-500">{t('settings.previewHint')}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* DEVICES TAB */}
                            {activeTab === 'devices' && (
                                <div className="space-y-8 relative z-10 animate-fade-in">
                                    <div>
                                        <h2 className="text-xl font-bold text-white mb-1">{t('settings.devices')}</h2>
                                        <p className="text-gray-400 text-sm">{t('settings.devicesSubtitle')}</p>
                                    </div>

                                    <div className="space-y-4 max-w-3xl">
                                        {devices.map((device) => {
                                            const ua = window.navigator.userAgent;
                                            const isPhone = /iPhone|Android/.test(ua) || device.name.includes('iOS') || device.name.includes('Android');
                                            const isMac = device.name.includes('Mac');
                                            const isWindows = device.name.includes('Windows');
                                            const isLinux = device.name.includes('Linux');
                                            const iconClass = isPhone ? 'ri-smartphone-line'
                                                : isMac ? 'ri-mac-line'
                                                : isWindows ? 'ri-computer-line'
                                                : isLinux ? 'ri-terminal-box-line'
                                                : 'ri-tv-line';
                                            return (
                                            <div key={device.id} className="flex items-center justify-between p-5 bg-white/5 rounded-xl border border-white/8 hover:border-white/15 transition-all gap-4">
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                                                        <i className={`text-xl text-violet-300 ${iconClass}`}></i>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="font-semibold text-white flex items-center gap-2 flex-wrap">
                                                            {device.name}
                                                            {device.current && <span className="text-[10px] bg-green-500/20 text-green-300 border border-green-500/30 px-1.5 py-0.5 rounded font-bold uppercase">{t('settings.current')}</span>}
                                                        </h3>
                                                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                            <span className="text-xs text-gray-400">{device.location}</span>
                                                            <span className="text-gray-600 text-xs">•</span>
                                                            <code className={`text-xs font-mono px-1.5 py-0.5 rounded ${device.ip === 'Loading...' ? 'text-gray-500 bg-white/5 animate-pulse' : 'text-cyan-300 bg-cyan-500/10 border border-cyan-500/20'}`}>
                                                                {device.ip}
                                                            </code>
                                                        </div>
                                                    </div>
                                                </div>
                                                {!device.current && (
                                                    <button
                                                        onClick={() => handleRemoveDevice(device.id)}
                                                        className="text-red-400 hover:text-red-300 text-sm font-medium hover:underline flex-shrink-0"
                                                    >
                                                        {t('settings.logOut')}
                                                    </button>
                                                )}
                                            </div>
                                            );
                                        })}
                                    </div>

                                    </div>
                                </div>
                            )}

                            {/* HISTORY TAB */}
                            {activeTab === 'history' && (
                                <div className="space-y-8 relative z-10 animate-fade-in">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-xl font-bold text-white mb-1">{t('settings.history')}</h2>
                                            <p className="text-gray-400 text-sm">{t('settings.historySubtitle')}</p>
                                        </div>
                                        <button onClick={clearHistory} className="text-sm text-gray-400 hover:text-white hover:underline">{t('settings.clearHistory')}</button>
                                    </div>

                                    {historyLoading ? (
                                        <div className="flex items-center justify-center py-10">
                                            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {historyItems.map((item) => (
                                                <div key={item.id} className="group relative aspect-video bg-white/5 rounded-xl overflow-hidden cursor-pointer">
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                                    {item.image && (
                                                        <img
                                                            src={item.image}
                                                            alt={item.title}
                                                            className="absolute inset-0 w-full h-full object-cover opacity-40"
                                                            loading="lazy"
                                                            decoding="async"
                                                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder-poster.svg'; }}
                                                        />
                                                    )}
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/50 transform scale-0 group-hover:scale-100 transition-transform">
                                                            <i className="ri-play-fill text-white text-xl ml-1"></i>
                                                        </div>
                                                    </div>
                                                    <div className="absolute bottom-0 left-0 right-0 p-4">
                                                        <h3 className="text-white font-medium truncate">{item.title}</h3>
                                                        <p className="text-xs text-gray-400 mb-2">{new Date(item.updated_at).toLocaleString()}</p>
                                                        <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                                                            <div className="h-full bg-nova-accent rounded-full" style={{ width: `${item.progress}%` }}></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
