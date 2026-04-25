import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getLiveMatches,
    getTodaysMatches,
    getSportCategories,
    getMatchPosterUrl,
    getTeamBadgeUrl,
    formatMatchTime,
    getStreams,
    Match,
    Sport
} from '../services/sportsService';
import PremiumLoader from '../components/PremiumLoader';
import './Deportes.css';

const SPORT_LABEL: Record<string, string> = {
    football: 'Futbol',
    soccer: 'Futbol',
    basketball: 'Baloncesto',
    nfl: 'NFL',
    'american-football': 'Futbol Americano',
    baseball: 'Beisbol',
    hockey: 'Hockey',
    tennis: 'Tenis',
    mma: 'MMA',
    boxing: 'Boxeo',
    rugby: 'Rugby',
    cricket: 'Cricket',
    golf: 'Golf',
    motorsport: 'Motor',
    'motor-sports': 'Motor',
    f1: 'F1',
    darts: 'Dardos',
    fight: 'Pelea',
    default: 'Deportes'
};

const SPORT_ICON: Record<string, string> = {
    football: 'ri-football-line',
    soccer: 'ri-football-line',
    basketball: 'ri-basketball-line',
    tennis: 'ri-ping-pong-line',
    cricket: 'ri-cricket-line',
    baseball: 'ri-baseball-line',
    hockey: 'ri-hockey-line',
    golf: 'ri-golf-line',
    boxing: 'ri-boxing-line',
    mma: 'ri-boxing-line',
    fight: 'ri-boxing-line',
    'motor-sports': 'ri-speed-line',
    motorsport: 'ri-speed-line',
    f1: 'ri-speed-line',
    rugby: 'ri-football-line',
    darts: 'ri-focus-3-line',
    nfl: 'ri-football-line',
    'american-football': 'ri-football-line',
    default: 'ri-trophy-line',
};

const getSportFallbackClass = (category: string) => {
    const key = (category || 'default').toLowerCase();
    return `sp-${key}`;
};

const getSportIconName = (category: string) => {
    const key = (category || '').toLowerCase();
    return SPORT_ICON[key] || SPORT_ICON.default;
};

const Deportes = () => {
    const navigate = useNavigate();
    const [liveMatches, setLiveMatches] = useState<Match[]>([]);
    const [todayMatches, setTodayMatches] = useState<Match[]>([]);
    const [categories, setCategories] = useState<Sport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
    const [verifyingId, setVerifyingId] = useState<string | null>(null);
    const [validSources, setValidSources] = useState<Record<string, { source: string; id: string }>>({});
    const [activeTab, setActiveTab] = useState<'live' | 'today' | 'all'>('live');
    const [activeSport, setActiveSport] = useState('all');
    const [query, setQuery] = useState('');

    const dedupeMatches = (matches: Match[]) => {
        const seen = new Set<string>();
        return matches.filter((m) => {
            if (seen.has(m.id)) return false;
            seen.add(m.id);
            return true;
        });
    };

    const hasSource = (m: Match) => Boolean(m.sources && m.sources.length > 0);

    const validateMatches = async (list: Match[]) => {
        const queue = [...list];
        const validIds = new Set<string>();
        const sources: Record<string, { source: string; id: string }> = {};
        let active = 0;
        const limit = 6;

        const checkMatch = async (match: Match) => {
            const srcs = match.sources || [];
            for (const src of srcs) {
                try {
                    const streams = await getStreams(src.source, src.id);
                    if (streams && streams.length > 0) {
                        validIds.add(match.id);
                        sources[match.id] = { source: src.source, id: src.id };
                        return;
                    }
                } catch {
                    // ignore and try next source
                }
            }
        };

        return new Promise<{ validIds: Set<string>; validSources: Record<string, { source: string; id: string }> }>((resolve) => {
            const next = () => {
                if (queue.length === 0 && active === 0) {
                    resolve({ validIds, validSources: sources });
                    return;
                }
                while (active < limit && queue.length > 0) {
                    const match = queue.shift();
                    if (!match) break;
                    active++;
                    checkMatch(match)
                        .catch(() => null)
                        .finally(() => {
                            active -= 1;
                            next();
                        });
                }
            };
            next();
        });
    };

    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            setErrorMessage(null);
            try {
                const results = await Promise.allSettled([
                    getLiveMatches(),
                    getTodaysMatches(),
                    getSportCategories()
                ]);

                const live = results[0].status === 'fulfilled' ? results[0].value : [];
                const today = results[1].status === 'fulfilled' ? results[1].value : [];
                const cats = results[2].status === 'fulfilled' ? results[2].value : [];

                const safeLive = live.filter((m) => m && m.id && m.title && hasSource(m));
                const safeToday = today.filter((m) => m && m.id && m.title && hasSource(m));

                setLiveMatches(safeLive);
                setTodayMatches(safeToday);
                setCategories(cats);

                // Validate top matches in background to prefer working sources on click
                const candidates = dedupeMatches([...safeLive, ...safeToday]).slice(0, 30);
                if (candidates.length > 0) {
                    validateMatches(candidates).then(({ validSources }) => {
                        setValidSources(validSources);
                    }).catch(() => null);
                }
            } catch (err) {
                console.error('Sports load failed', err);
                setErrorMessage('No pudimos cargar los deportes.');
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, []);

    const baseMatches = useMemo(() => {
        if (activeTab === 'live') return liveMatches;
        if (activeTab === 'today') return todayMatches;
        return dedupeMatches([...liveMatches, ...todayMatches]);
    }, [activeTab, liveMatches, todayMatches]);

    const filteredMatches = useMemo(() => {
        let list = baseMatches;
        if (activeSport !== 'all') {
            const key = activeSport.toLowerCase();
            list = list.filter((m) => (m.category || '').toLowerCase() === key);
        }
        if (query.trim()) {
            const q = query.toLowerCase();
            list = list.filter((m) =>
                m.title.toLowerCase().includes(q) ||
                (m.category || '').toLowerCase().includes(q) ||
                (m.teams?.home?.name || '').toLowerCase().includes(q) ||
                (m.teams?.away?.name || '').toLowerCase().includes(q)
            );
        }
        return list;
    }, [baseMatches, activeSport, query]);

    const grouped = useMemo(() => {
        const groups: Record<string, Match[]> = {};
        filteredMatches.forEach((m) => {
            const cat = (m.category || 'Other').toLowerCase();
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(m);
        });
        return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
    }, [filteredMatches]);

    const heroMatch = filteredMatches[0] || null;

    const removeMatch = (matchId: string) => {
        setLiveMatches((prev) => prev.filter((m) => m.id !== matchId));
        setTodayMatches((prev) => prev.filter((m) => m.id !== matchId));
    };

    const handleWatch = async (match: Match) => {
        if (verifyingId) return;
        if (!match.sources || match.sources.length === 0) {
            removeMatch(match.id);
            return;
        }
        setVerifyingId(match.id);
        setVerifyMessage('Verificando streams activos...');

        const preferred = validSources[match.id];
        const ordered = preferred
            ? [preferred, ...match.sources.filter((s) => !(s.source === preferred.source && s.id === preferred.id))]
            : [...match.sources];

        for (const source of ordered) {
            try {
                const streams = await getStreams(source.source, source.id);
                if (streams && streams.length > 0) {
                    setVerifyingId(null);
                    setVerifyMessage(null);
                    navigate(
                        `/deportes/watch/${source.source}/${source.id}?title=${encodeURIComponent(match.title)}&category=${match.category}`,
                        { state: { sources: match.sources, matchTitle: match.title, category: match.category } }
                    );
                    return;
                }
            } catch (err) {
                console.warn('Source failed, trying next', source, err);
            }
        }

        setVerifyMessage('No hay streams activos. Intenta mas tarde.');
        removeMatch(match.id);
        setTimeout(() => setVerifyMessage(null), 2500);
        setVerifyingId(null);
    };

    if (isLoading) {
        return <PremiumLoader />;
    }

    return (
        <div className="sports-shell">
            {errorMessage && (
                <div className="sports-error">
                    <div className="sports-error-card">
                        <h3>Algo salio mal</h3>
                        <p>{errorMessage}</p>
                        <button onClick={() => window.location.reload()}>Recargar</button>
                    </div>
                </div>
            )}
            {verifyMessage && (
                <div className="verify-toast">
                    <div className="spin-sm" />
                    <span>{verifyMessage}</span>
                </div>
            )}

            {/* Hero */}
            {heroMatch && (
                <section className="hero">
                    {getMatchPosterUrl(heroMatch.poster) ? (
                        <img className="hero-bg" src={getMatchPosterUrl(heroMatch.poster)} alt={heroMatch.title} />
                    ) : (
                        <div className="hero-bg-fallback" />
                    )}
                    <div className="hero-gradient" />
                    <div className="hero-live-stripe" />
                    <div className="hero-content">
                        <div className="hero-cat">
                            <i className={getSportIconName(heroMatch.category)} />
                            {SPORT_LABEL[(heroMatch.category || '').toLowerCase()] || heroMatch.category?.toUpperCase() || 'DEPORTE'}
                            {activeTab === 'live' && <span className="hero-live-badge">LIVE</span>}
                        </div>
                        <div className="hero-title">{heroMatch.title}</div>
                        <div className="hero-teams">
                            {heroMatch.teams?.home?.name && (
                                <div className="hero-team">
                                    <div className="hero-badge">
                                        {heroMatch.teams.home.badge ? (
                                            <img src={getTeamBadgeUrl(heroMatch.teams.home.badge)} alt={heroMatch.teams.home.name} />
                                        ) : (
                                            <span className="abb">{heroMatch.teams.home.name.slice(0, 3).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <span className="hero-team-name">{heroMatch.teams.home.name}</span>
                                </div>
                            )}
                            {heroMatch.teams?.home?.name && heroMatch.teams?.away?.name && <span className="hero-vs">VS</span>}
                            {heroMatch.teams?.away?.name && (
                                <div className="hero-team">
                                    <div className="hero-badge">
                                        {heroMatch.teams.away.badge ? (
                                            <img src={getTeamBadgeUrl(heroMatch.teams.away.badge)} alt={heroMatch.teams.away.name} />
                                        ) : (
                                            <span className="abb">{heroMatch.teams.away.name.slice(0, 3).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <span className="hero-team-name">{heroMatch.teams.away.name}</span>
                                </div>
                            )}
                        </div>
                        <div className="hero-meta">
                            <span><i className="ri-calendar-line" /> {formatMatchTime(new Date(heroMatch.date))}</span>
                            <span><i className="ri-signal-tower-line" /> {heroMatch.sources?.length || 0} señales</span>
                        </div>
                        <div className="hero-actions">
                            <button className="btn-watch" onClick={() => handleWatch(heroMatch)}><i className="ri-play-fill" /> Ver ahora</button>
                            <button className="btn-info" onClick={() => window.scrollTo({ top: window.innerHeight * 0.6, behavior: 'smooth' })}><i className="ri-arrow-down-line" /> Explorar</button>
                        </div>
                    </div>
                </section>
            )}

            {/* Content */}
            <div className="content">
                <div className="sport-tabs">
                    <div className={`sport-tab ${activeSport === 'all' ? 'active' : ''}`} onClick={() => setActiveSport('all')}>
                        <i className="ri-trophy-line" /> Todos
                    </div>
                    {categories.map((c) => (
                        <div
                            key={c.id}
                            className={`sport-tab ${activeSport === c.id ? 'active' : ''}`}
                            onClick={() => setActiveSport(c.id)}
                        >
                            <i className={getSportIconName(c.id)} />
                            {SPORT_LABEL[c.id] || SPORT_LABEL.default}
                        </div>
                    ))}
                </div>

                <div className="sports-controls">
                    <div className="time-tabs">
                        <div className={`sport-tab ${activeTab === 'live' ? 'active' : ''}`} onClick={() => setActiveTab('live')}>
                            <i className="ri-signal-tower-line" /> En Vivo
                        </div>
                        <div className={`sport-tab ${activeTab === 'today' ? 'active' : ''}`} onClick={() => setActiveTab('today')}>
                            <i className="ri-calendar-line" /> Hoy
                        </div>
                        <div className={`sport-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
                            <i className="ri-layout-grid-line" /> Todos
                        </div>
                    </div>
                    <div className="sports-search-wrap">
                        <i className="ri-search-line" />
                        <input
                            className="sports-search"
                            type="text"
                            placeholder="Buscar partido..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="rows">
                    {grouped.length === 0 && (
                        <div className="sports-empty">
                            <i className="ri-trophy-line" />
                            No hay partidos disponibles.
                        </div>
                    )}

                    {grouped.map(([cat, list]) => (
                        <div key={cat} className="row">
                            <div className="row-header">
                                <div className="row-title">
                                    <i className={getSportIconName(cat)} style={{ color: 'var(--sp-accent)', fontSize: '1.1rem' }} />
                                    {SPORT_LABEL[cat] || SPORT_LABEL.default}
                                    <span>{cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                                    <span className="row-count">({list.length})</span>
                                </div>
                                <div className="row-action" onClick={() => setActiveSport(cat)}>Ver más →</div>
                            </div>
                            <div className="row-track">
                                {list.map((m) => {
                                    const posterUrl = getMatchPosterUrl(m.poster);
                                    const isLive = m.date <= Date.now();
                                    return (
                                        <div key={m.id} className={`mcard ${verifyingId === m.id ? 'is-verifying' : ''}`} onClick={() => handleWatch(m)}>
                                            <div className="card-img">
                                                {posterUrl ? (
                                                    <img className="poster" src={posterUrl} alt={m.title} />
                                                ) : (
                                                    <div className={`card-img-fallback ${getSportFallbackClass(m.category)}`}>
                                                        <i className={getSportIconName(m.category)} />
                                                    </div>
                                                )}
                                                <div className="grad" />
                                                {isLive && <div className="chip-live">LIVE</div>}
                                                {m.popular && <div className="chip-hot">HOT</div>}
                                                <div className="chip-streams"><i className="ri-signal-tower-line" /> {m.sources?.length || 0}</div>
                                                {m.teams?.home?.name && m.teams?.away?.name && (
                                                    <div className="card-teams-overlay">
                                                        <div className="card-team-badge">
                                                            {m.teams.home.badge ? (
                                                                <img src={getTeamBadgeUrl(m.teams.home.badge)} alt={m.teams.home.name} />
                                                            ) : (
                                                                <span className="abb">{m.teams.home.name.slice(0, 3).toUpperCase()}</span>
                                                            )}
                                                        </div>
                                                        <span className="card-vs">VS</span>
                                                        <div className="card-team-badge">
                                                            {m.teams.away.badge ? (
                                                                <img src={getTeamBadgeUrl(m.teams.away.badge)} alt={m.teams.away.name} />
                                                            ) : (
                                                                <span className="abb">{m.teams.away.name.slice(0, 3).toUpperCase()}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="card-body">
                                                <div className="card-cat">{SPORT_LABEL[(m.category || '').toLowerCase()] || m.category}</div>
                                                <div className="card-title">{m.title}</div>
                                                <div className="card-time"><i className="ri-time-line" /> {formatMatchTime(new Date(m.date))}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Deportes;
