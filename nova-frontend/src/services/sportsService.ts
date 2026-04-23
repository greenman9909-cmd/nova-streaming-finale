import axios from 'axios';

// Streamed.pk API Configuration
// Streamed.pk API Configuration
const STREAMED_BASE_URL = '/api/sports';

// Create Axios instance
const streamedApi = axios.create({
    baseURL: STREAMED_BASE_URL,
    timeout: 8000,
});

let sportsBackendDownUntil = 0;
const sportsBackendBackoffMs = 45 * 1000; // 45 seconds — enough to avoid hammering, fast enough to recover

export const isSportsBackendDown = () => Date.now() < sportsBackendDownUntil;

const safeGet = async <T>(path: string, fallback: T): Promise<T> => {
    if (Date.now() < sportsBackendDownUntil) return fallback;
    try {
        const response = await streamedApi.get(path);
        return response.data || fallback;
    } catch (error) {
        sportsBackendDownUntil = Date.now() + sportsBackendBackoffMs;
        if (!path.includes('/matches/live')) {
            console.error(`Sports API failed for ${path}:`, error);
        }
        return fallback;
    }
};

// Types from Documentation
export interface MatchTeam {
    name: string;
    badge?: string;
}

export interface MatchSource {
    source: string;
    id: string;
}

export interface Match {
    id: string;
    title: string;
    category: string;
    date: number; // Unix timestamp in ms
    poster?: string;
    popular?: boolean;
    teams?: {
        home?: MatchTeam;
        away?: MatchTeam;
    };
    sources: MatchSource[];
}

export interface Stream {
    id: string;
    streamNo: number;
    language: string;
    hd: boolean;
    embedUrl: string;
    source: string;
    viewers?: number;
}

export interface Sport {
    id: string;
    name: string;
}

// Image URL helpers
export const getTeamBadgeUrl = (badge: string | undefined): string => {
    if (!badge) return '';
    if (badge.startsWith('http')) return badge;
    // Append .webp because the source requires it
    return `/api/sports/images/badge/${badge}.webp`;
};

export const getMatchPosterUrl = (poster: string | undefined): string => {
    // If poster field is provided and starts with a path (e.g. /images/...), construct full URL
    if (poster) {
        if (poster.startsWith('http')) return poster;
        if (poster.startsWith('/')) return `https://streamed.pk${poster}`;
        // Use proxy for these specific IDs too if needed, but usually badge logic above covers most
        return `/api/sports/images/poster/${poster}`;
    }

    // No generic fallbacks — only real match posters from API
    return '';
};

// Sport icon mapping
export const getSportIcon = (category: string): string => {
    const iconMap: Record<string, string> = {
        football: 'ri-football-line',
        basketball: 'ri-basketball-line',
        tennis: 'ri-ping-pong-line',
        cricket: 'ri-cricket-line',
        baseball: 'ri-baseball-line',
        hockey: 'ri-hockey-line',
        golf: 'ri-golf-line',
        boxing: 'ri-boxing-line',
        mma: 'ri-boxing-line',
        ufc: 'ri-boxing-line',
        motorsport: 'ri-speed-line',
        f1: 'ri-speed-line',
        rugby: 'ri-football-line',
        volleyball: 'ri-volleyball-line',
        handball: 'ri-hand-line',
        afl: 'ri-football-line',
        darts: 'ri-focus-3-line',
        fighting: 'ri-boxing-line',
        default: 'ri-trophy-line',
    };
    return iconMap[category.toLowerCase()] || iconMap.default;
};

// Sport color gradient mapping
export const getSportGradient = (category: string): string => {
    const gradientMap: Record<string, string> = {
        football: 'from-emerald-600 to-lime-600',
        basketball: 'from-orange-600 to-amber-600',
        tennis: 'from-lime-600 to-green-600',
        cricket: 'from-blue-600 to-cyan-600',
        baseball: 'from-red-600 to-rose-600',
        hockey: 'from-sky-600 to-blue-600',
        f1: 'from-red-600 to-orange-600',
        motorsport: 'from-red-600 to-orange-600',
        boxing: 'from-red-700 to-rose-700',
        mma: 'from-red-700 to-rose-700',
        ufc: 'from-red-700 to-rose-700',
        rugby: 'from-green-700 to-emerald-700',
        golf: 'from-green-600 to-lime-600',
        default: 'from-violet-600 to-fuchsia-600',
    };
    return gradientMap[category.toLowerCase()] || gradientMap.default;
};

const normalizeMatches = (matches: Match[]): Match[] => {
    const byId = new Map<string, Match>();
    for (const m of matches || []) {
        if (!m || !m.id) continue;
        const existing = byId.get(m.id);
        if (!existing) {
            byId.set(m.id, { ...m, sources: Array.isArray(m.sources) ? m.sources : [] });
            continue;
        }
        const mergedSources = [...(existing.sources || []), ...(m.sources || [])];
        const seen = new Set<string>();
        existing.sources = mergedSources.filter((s) => {
            if (!s || !s.source || !s.id) return false;
            const key = `${s.source}:${s.id}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
        if (!existing.poster && m.poster) existing.poster = m.poster;
        if (!existing.teams && m.teams) existing.teams = m.teams;
        if (!existing.title && m.title) existing.title = m.title;
        if (!existing.category && m.category) existing.category = m.category;
        if (!existing.date && m.date) existing.date = m.date;
        if (!existing.popular && m.popular) existing.popular = m.popular;
    }
    return Array.from(byId.values());
};

/**
 * Get currently live matches
 */
export const getLiveMatches = async (): Promise<Match[]> => {
    const data = await safeGet<Match[]>('/matches/live', []);
    return normalizeMatches(data);
};

/**
 * Get today's matches
 */
export const getTodaysMatches = async (): Promise<Match[]> => {
    const data = await safeGet<Match[]>('/matches/all-today', []);
    return normalizeMatches(data);
};

/**
 * Get popular matches across all sports
 */
export const getPopularMatches = async (): Promise<Match[]> => {
    const data = await safeGet<Match[]>('/matches/all/popular', []);
    return normalizeMatches(data);
};

/**
 * Get matches for a specific sport
 */
export const getMatchesBySport = async (sport: string): Promise<Match[]> => {
    const data = await safeGet<Match[]>(`/matches/${sport}`, []);
    return normalizeMatches(data);
};

/**
 * Get stream links for a specific match source
 */
const normalizeStreams = (streams: Stream[]): Stream[] => {
    const seen = new Set<string>();
    return streams.map((s, idx) => ({
        ...s,
        streamNo: s.streamNo || idx + 1,
        language: s.language || 'Unknown',
        source: s.source || 'stream',
        hd: Boolean(s.hd),
    })).filter((s) => {
        if (!s || !s.embedUrl) return false;
        const key = `${s.source}:${s.id}:${s.embedUrl}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

export const getStreams = async (source: string, id: string): Promise<Stream[]> => {
    const data = await safeGet<any>(`/stream/${source}/${id}`, []);
    if (Array.isArray(data)) return normalizeStreams(data);
    if (data && Array.isArray(data.streams)) return normalizeStreams(data.streams);
    if (data && Array.isArray(data.data)) return normalizeStreams(data.data);
    return [];
};

/**
 * Get all available sport categories
 */
export const getSportCategories = async (): Promise<Sport[]> => {
    return await safeGet<Sport[]>('/sports', []);
};

/**
 * Transform match to content row format for Home page
 */
export const matchToContent = (match: Match) => {
    const isLive = match.date <= Date.now();
    const matchTime = new Date(match.date);

    return {
        id: match.id,
        title: { english: match.title },
        image: getMatchPosterUrl(match.poster),
        rating: match.popular ? 95 : 80,
        type: 'Sports',
        releaseDate: isLive ? 'LIVE' : formatMatchTime(matchTime),
        isLive,
        category: match.category,
        teams: match.teams,
        sources: match.sources,
    };
};

/**
 * Format match time for display
 */
export const formatMatchTime = (date: Date): string => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (diff < 0) return 'LIVE';
    if (hours < 1) return `${minutes}m`;
    if (hours < 24) return `${hours}h ${minutes}m`;

    return date.toLocaleDateString('es-ES', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export default streamedApi;
