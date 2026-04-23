import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { supabase } from '../lib/supabase';

export default function Settings() {
    const { user, updateProfile } = useAuth();
    const { settings, updateSettings, t } = useSettings();
    const [activeTab, setActiveTab] = useState<'account' | 'web' | 'playback' | 'appearance' | 'devices' | 'history'>('account');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Account State
    const [email, setEmail] = useState(user?.email || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [historyItems, setHistoryItems] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Mock Devices Data
    const [devices, setDevices] = useState([
        { id: 1, name: 'Windows PC (Chrome)', location: 'New York, USA', current: true, ip: '192.168.1.1' },
        { id: 2, name: 'iPhone 13 (Safari)', location: 'New York, USA', current: false, ip: '192.168.1.5' },
        { id: 3, name: 'Smart TV (Samsung)', location: 'New York, USA', current: false, ip: '192.168.1.12' },
    ]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            const updates: any = {};
            if (email !== user?.email) updates.email = email;
            if (password) {
                if (password !== confirmPassword) throw new Error("Passwords do not match");
                updates.password = password;
            }

            if (Object.keys(updates).length === 0) return;

            const { success, error } = await updateProfile(updates);
            if (!success) throw error;

            setMessage({ type: 'success', text: 'Profile updated successfully' });
            setPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
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
            .select('media_id,title,progress,image,updated_at')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(24);

        if (!error) {
            setHistoryItems(data || []);
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

    useEffect(() => {
        if (activeTab === 'history') {
            loadHistory();
        }
    }, [activeTab, user]);

    const tabs = [
        { id: 'account', label: t('settings.account'), icon: 'ri-user-line' },
        { id: 'web', label: t('settings.web'), icon: 'ri-settings-line' },
        { id: 'playback', label: t('settings.playback'), icon: 'ri-film-line' },
        { id: 'appearance', label: t('settings.appearance'), icon: 'ri-palette-line' },
        { id: 'devices', label: t('settings.devices'), icon: 'ri-computer-line' },
        { id: 'history', label: t('settings.history'), icon: 'ri-history-line' },
    ] as const;

    return (
        <div className="min-h-screen pt-24 px-[5%] pb-10">
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
                                        <p className="text-gray-400 text-sm">Update your personal details and security.</p>
                                    </div>

                                    <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-lg">
                                        {message && (
                                            <div className={`p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                                {message.text}
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">New Password (Optional)</label>
                                            <input
                                                type="password"
                                                placeholder="Leave blank to keep current"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                                            />
                                        </div>

                                        {password && (
                                            <div className="animate-fade-in">
                                                <label className="block text-sm font-medium text-gray-400 mb-2">Confirm New Password</label>
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
                                            Save Changes
                                        </button>
                                    </form>

                                    <div className="pt-8 border-t border-white/10">
                                        <h3 className="text-lg font-bold text-white mb-4">Subscription Plan</h3>
                                        <div className="bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <i className="ri-vip-crown-fill text-yellow-400"></i>
                                                    <span className="font-bold text-white">Free Plan</span>
                                                </div>
                                                <p className="text-gray-400 text-sm">Upgrade to NOVA+ for 4K streaming and no ads.</p>
                                            </div>
                                            <button className="px-6 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-violet-500/25 transition-all">
                                                Upgrade Plan
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* WEB SETTINGS TAB */}
                            {activeTab === 'web' && (
                                <div className="space-y-8 relative z-10 animate-fade-in">
                                    <div>
                                        <h2 className="text-xl font-bold text-white mb-1">{t('settings.web')}</h2>
                                        <p className="text-gray-400 text-sm">Customize your viewing experience.</p>
                                    </div>

                                    <div className="space-y-4 max-w-2xl">
                                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                                    <i className="ri-play-circle-line text-xl"></i>
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-white">{t('settings.autoplay')}</h3>
                                                    <p className="text-xs text-gray-500">Automatically play the next episode.</p>
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
                                                    <p className="text-xs text-gray-500">Hide 18+ content from search.</p>
                                                </div>
                                            </div>
                                            <button onClick={() => updateSettings({ contentFilter: !settings.contentFilter })} className={`w-12 h-6 rounded-full transition-colors relative ${settings.contentFilter ? 'bg-nova-accent' : 'bg-gray-700'}`}>
                                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.contentFilter ? 'translate-x-6' : 'translate-x-0'}`} />
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
                                                        onClick={() => updateSettings({ language: lang })}
                                                        className={`py-2 rounded-lg text-sm font-medium border ${settings.language === lang
                                                            ? 'bg-nova-accent/20 border-nova-accent text-white'
                                                            : 'bg-black/20 border-transparent text-gray-400 hover:border-white/10'
                                                            }`}
                                                    >
                                                        {lang === 'en' && 'English'}
                                                        {lang === 'es' && 'Español'}
                                                        {lang === 'fr' && 'Français'}
                                                        {lang === 'pt' && 'Português'}
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
                                        <p className="text-gray-400 text-sm">Control video quality and subtitles.</p>
                                    </div>

                                    <div className="space-y-6 max-w-2xl">
                                        {/* Quality */}
                                        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                            <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                                                <i className="ri-hd-line text-violet-400"></i> Default Quality
                                            </h3>
                                            <div className="grid grid-cols-4 gap-2">
                                                {['4K', '1080p', '720p', 'Auto'].map((q) => (
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

                                        {/* Subtitles */}
                                        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                            <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                                                <i className="ri-closed-captioning-line text-violet-400"></i> Subtitle Styling
                                            </h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-xs text-gray-500 mb-2 block">Size</label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {['small', 'medium', 'large'].map((s) => (
                                                            <button
                                                                key={s}
                                                                onClick={() => updateSettings({ subtitleSize: s as any })}
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
                                            </div>
                                            {/* Preview */}
                                            <div className="mt-4 p-6 bg-black/50 rounded-lg flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center">
                                                <span
                                                    className="bg-black/75 px-3 py-1 rounded"
                                                    style={{
                                                        color: settings.subtitleColor,
                                                        fontSize: settings.subtitleSize === 'small' ? '12px' : settings.subtitleSize === 'medium' ? '16px' : '20px'
                                                    }}
                                                >
                                                    Hello, this is a subtitle preview.
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* APPEARANCE TAB */}
                            {activeTab === 'appearance' && (
                                <div className="space-y-8 relative z-10 animate-fade-in">
                                    <div>
                                        <h2 className="text-xl font-bold text-white mb-1">{t('settings.appearance')}</h2>
                                        <p className="text-gray-400 text-sm">Customize the look and feel of Nova.</p>
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
                                                    onClick={() => updateSettings({ accentColor: color.id as any })}
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
                                                <p className="text-xs text-gray-500">This is how your accent color will glow.</p>
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
                                        <p className="text-gray-400 text-sm">Manage where you are logged in.</p>
                                    </div>

                                    <div className="space-y-4 max-w-3xl">
                                        {devices.map((device) => (
                                            <div key={device.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                                                        <i className={`text-xl text-gray-300 ${device.name.includes('iPhone') ? 'ri-smartphone-line' : device.name.includes('PC') ? 'ri-computer-line' : 'ri-tv-line'}`}></i>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-medium text-white flex items-center gap-2">
                                                            {device.name}
                                                            {device.current && <span className="text-[10px] bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded font-bold uppercase">Current</span>}
                                                        </h3>
                                                        <p className="text-xs text-gray-500">{device.location} • {device.ip}</p>
                                                    </div>
                                                </div>
                                                {!device.current && (
                                                    <button
                                                        onClick={() => handleRemoveDevice(device.id)}
                                                        className="text-red-400 hover:text-red-300 text-sm font-medium hover:underline"
                                                    >
                                                        Log Out
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* HISTORY TAB */}
                            {activeTab === 'history' && (
                                <div className="space-y-8 relative z-10 animate-fade-in">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-xl font-bold text-white mb-1">{t('settings.history')}</h2>
                                            <p className="text-gray-400 text-sm">Resume where you left off.</p>
                                        </div>
                                        <button onClick={clearHistory} className="text-sm text-gray-400 hover:text-white hover:underline">Clear History</button>
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
                                                    <img src={item.image} alt={item.title} className="absolute inset-0 w-full h-full object-cover opacity-40" />
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
