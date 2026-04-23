import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getLiveMatches,
    getTodaysMatches,
    getSportCategories,
    getMatchPosterUrl,
    getTeamBadgeUrl,
    formatMatchTime,
    Match,
    Sport
} from '../services/sportsService';

const fallbackPoster = 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=2069&auto=format&fit=crop';

const SportsHero = ({ feature, onWatch }: { feature: Match | null; onWatch: (m: Match) => void }) => {
    if (!feature) return null;

    const isLive = feature.date <= Date.now();
    const heroPoster = getMatchPosterUrl(feature.poster, feature) || fallbackPoster;

    return (
        <section className="sports-hero">
            <div className="sports-hero-media">
                <img
                    src={heroPoster}
                    alt={feature.title}
                    className="sports-hero-img"
                />
            </div>
            <div className="sports-hero-glass" />
            <div className="sports-hero-content">
                <div className="sports-hero-meta">
                    <span className={`sports-pill ${isLive ? 'sports-pill-live' : 'sports-pill-upcoming'}`}>
                        {isLive ? 'LIVE' : 'UPCOMING'}
                    </span>
                    <span className="sports-meta-text">{feature.category}</span>
                </div>

                <h1 className="sports-hero-title">
                    {feature.title}
                </h1>

                <div className="sports-hero-sub">
                    <span>{isLive ? 'Live now' : formatMatchTime(new Date(feature.date))}</span>
                    <span className="sports-dot" />
                    <span className="uppercase tracking-[0.35em] text-[11px] text-white/70">Watch on Nova</span>
                </div>

                <div className="sports-hero-actions">
                    <button onClick={() => onWatch(feature)} className="sports-btn sports-btn-primary">
                        <i className="ri-play-fill text-lg"></i>
                        Watch Now
                    </button>
                    <button className="sports-btn sports-btn-ghost">
                        <i className="ri-notification-3-line text-lg"></i>
                        Remind Me
                    </button>
                </div>
            </div>
        </section>
    );
};

const SportsCard = ({ match, onWatch }: { match: Match; onWatch: (m: Match) => void }) => {
    const isLive = match.date <= Date.now();
    const poster = getMatchPosterUrl(match.poster, match) || fallbackPoster;
    const timeLabel = isLive ? 'LIVE' : formatMatchTime(new Date(match.date));
    const badgeClass = isLive ? 'sports-pill-live' : 'sports-pill-upcoming';

    return (
        <button
            onClick={() => onWatch(match)}
            className="sports-card"
        >
            <div className="sports-card-media">
                <img
                    src={poster}
                    alt={match.title}
                    className="sports-card-img"
                />
                <div className="sports-card-sheen" />
                <span className={`sports-pill ${badgeClass}`}>
                    {isLive ? 'LIVE' : 'UPCOMING'}
                </span>
            </div>

            <div className="sports-card-body">
                <div className="sports-card-meta">
                    <span className="uppercase tracking-[0.25em] text-[10px]">{match.category}</span>
                    <span className={isLive ? 'text-red-400' : 'text-white/60'}>{timeLabel}</span>
                </div>
                <div className="sports-card-title">{match.title}</div>
                {(match.teams?.home || match.teams?.away) && (
                    <div className="sports-card-teams">
                        {match.teams?.home?.badge && (
                            <img
                                src={getTeamBadgeUrl(match.teams.home.badge)}
                                alt={match.teams.home.name}
                                className="h-5 w-5 object-contain"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                        )}
                        <span className="truncate">{match.teams?.home?.name || ''}</span>
                        <span className="text-white/40">vs</span>
                        {match.teams?.away?.badge && (
                            <img
                                src={getTeamBadgeUrl(match.teams.away.badge)}
                                alt={match.teams.away.name}
                                className="h-5 w-5 object-contain"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                        )}
                        <span className="truncate">{match.teams?.away?.name || ''}</span>
                    </div>
                )}
            </div>
        </button>
    );
};

const SportsRail = ({
    title,
    subtitle,
    matches,
    onWatch,
    accentClass,
    accent,
}: {
    title: string;
    subtitle?: string;
    matches: Match[];
    onWatch: (m: Match) => void;
    accentClass?: string;
    accent?: { from: string; to: string };
}) => {
    if (matches.length === 0) return null;

    return (
        <section className={`sports-section ${accentClass || ''}`}>
            <div
                className="sports-section-panel"
                style={accent ? {
                    background: `linear-gradient(120deg, ${accent.from}22 0%, transparent 55%), linear-gradient(240deg, ${accent.to}22 0%, transparent 60%), rgba(255,255,255,0.03)`
                } : undefined}
            >
                <div className="sports-section-head">
                    <div>
                        <h2 className="sports-section-title">{title}</h2>
                        {subtitle && <p className="sports-section-sub">{subtitle}</p>}
                    </div>
                    <button className="sports-section-action">See all</button>
                </div>
                <div className="sports-rail">
                    {matches.map((match) => (
                        <SportsCard key={match.id} match={match} onWatch={onWatch} />
                    ))}
                </div>
            </div>
        </section>
    );
};

const Deportes = () => {
    const navigate = useNavigate();
    const [liveMatches, setLiveMatches] = useState<Match[]>([]);
    const [allMatches, setAllMatches] = useState<Match[]>([]);
    const [categories, setCategories] = useState<Sport[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const init = async () => {
        setIsLoading(true);
        try {
            const results = await Promise.allSettled([
                getLiveMatches(),
                getTodaysMatches(),
                getSportCategories()
            ]);

            const live = results[0].status === 'fulfilled' ? results[0].value : [];
            const today = results[1].status === 'fulfilled' ? results[1].value : [];
            const cats = results[2].status === 'fulfilled' ? results[2].value : [];

            setLiveMatches(live);
            setAllMatches([...live, ...today]);
            setCategories(cats);
        } catch (err: any) {
            console.error('Data load failed', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        init();
    }, []);

    const handleWatch = (match: Match) => {
        if (match.sources && match.sources.length > 0) {
            const source = match.sources[0];
            navigate(`/deportes/watch/${source.source}/${source.id}?title=${encodeURIComponent(match.title)}&category=${match.category}`);
        }
    };

    const getMatchesForCategory = (catId: string) => {
        const catIdLower = catId.toLowerCase();
        if (catIdLower === 'mma') {
            return allMatches.filter(m => {
                const c = m.category.toLowerCase();
                return c === 'mma' || c === 'ufc' || c === 'fighting';
            });
        }
        return allMatches.filter(m => m.category.toLowerCase() === catIdLower);
    };

    const coreCats = [
        { id: 'football', title: 'Football Arena', subtitle: 'Live derbies and league clashes', accent: 'sports-accent-emerald', gradient: { from: '#10b981', to: '#22c55e' } },
        { id: 'basketball', title: 'Basketball Circuit', subtitle: 'Fast breaks and buzzer beaters', accent: 'sports-accent-amber', gradient: { from: '#f59e0b', to: '#f97316' } },
        { id: 'tennis', title: 'Tennis Court', subtitle: 'Grand slams and rallies', accent: 'sports-accent-lime', gradient: { from: '#84cc16', to: '#22c55e' } },
        { id: 'f1', title: 'Formula 1', subtitle: 'Qualifiers and race day', accent: 'sports-accent-red', gradient: { from: '#ef4444', to: '#f97316' } },
        { id: 'mma', title: 'Fight Night', subtitle: 'Main cards and undercards', accent: 'sports-accent-violet', gradient: { from: '#8b5cf6', to: '#6366f1' } },
        { id: 'cricket', title: 'Cricket Grounds', subtitle: 'ODI and T20 specials', accent: 'sports-accent-cyan', gradient: { from: '#06b6d4', to: '#3b82f6' } },
    ];

    const featuredMatch = liveMatches.length > 0 ? liveMatches[0] : allMatches.find(m => m.popular) || allMatches[0];
    const fallbackMatches: Match[] = [
        {
            id: 'fx-1',
            title: 'Nova United vs Eclipse FC',
            category: 'football',
            date: Date.now() + 1000 * 60 * 45,
            poster: '',
            popular: true,
            teams: {
                home: { name: 'Nova United' },
                away: { name: 'Eclipse FC' }
            },
            sources: []
        },
        {
            id: 'fx-2',
            title: 'Skyline Hoops vs Metro Stars',
            category: 'basketball',
            date: Date.now() + 1000 * 60 * 90,
            poster: '',
            popular: true,
            teams: {
                home: { name: 'Skyline Hoops' },
                away: { name: 'Metro Stars' }
            },
            sources: []
        },
        {
            id: 'fx-3',
            title: 'Night Circuit: Grand Prix',
            category: 'f1',
            date: Date.now() + 1000 * 60 * 120,
            poster: '',
            popular: true,
            sources: []
        }
    ];

    const heroMatch = featuredMatch || fallbackMatches[0];
    const liveAndUpcoming = [...liveMatches, ...allMatches.filter(m => !liveMatches.find(l => l.id === m.id))];
    const safeLiveUpcoming = liveAndUpcoming.length > 0 ? liveAndUpcoming : fallbackMatches;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0b1117] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-t-white border-white/20 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <main className="sports-shell">
            <div className="sports-backdrop" />
            <SportsHero feature={heroMatch} onWatch={handleWatch} />

            <div className="sports-body">
                <SportsRail
                    title="Live + Upcoming"
                    subtitle="Stream live matches and upcoming fixtures"
                    matches={safeLiveUpcoming.slice(0, 16)}
                    onWatch={handleWatch}
                    accentClass="sports-accent-blue"
                    accent={{ from: '#3b82f6', to: '#22d3ee' }}
                />

                {coreCats.map((cat) => {
                    const matches = getMatchesForCategory(cat.id);
                    if (matches.length === 0) return null;
                    return (
                        <SportsRail
                            key={cat.id}
                            title={cat.title}
                            subtitle={cat.subtitle}
                            matches={matches.slice(0, 16)}
                            onWatch={handleWatch}
                            accentClass={cat.accent}
                            accent={cat.gradient}
                        />
                    );
                })}

                {categories.length > 0 && (
                    <section className="sports-section sports-accent-neutral">
                        <div className="sports-section-panel">
                            <div className="sports-section-head">
                                <div>
                                    <h2 className="sports-section-title">All Sports</h2>
                                    <p className="sports-section-sub">Browse every category at a glance</p>
                                </div>
                            </div>
                            <div className="sports-grid">
                                {categories.map((cat) => (
                                    <div key={cat.id} className="sports-chip">
                                        <i className="ri-trophy-line"></i>
                                        <span className="capitalize">{cat.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
};

export default Deportes;
