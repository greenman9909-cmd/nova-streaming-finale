import { supabase } from '../lib/supabase';

const LS_KEY = (userId: string, mediaId: string) => `nova_wp_${userId}_${mediaId}`;

export interface ProgressEntry {
    mediaId: string;
    mediaType: string;
    title: string;
    image: string;
    timestampSeconds: number;
    durationSeconds: number;
    progress: number; // 0-100
    season?: number;
    episode?: number;
    updatedAt: string;
}

/** Save progress to localStorage immediately, then async to Supabase */
export async function saveProgress(
    userId: string,
    entry: ProgressEntry
): Promise<void> {
    // Always write to localStorage first (instant)
    try {
        localStorage.setItem(LS_KEY(userId, entry.mediaId), JSON.stringify(entry));
    } catch {
        // Storage full — ignore
    }

    // Then async to Supabase — try with new columns first, fall back to base columns
    const base = {
        user_id: userId,
        media_id: entry.mediaId,
        media_type: entry.mediaType,
        title: entry.title,
        image: entry.image,
        progress: Math.min(entry.progress, 100),
        updated_at: entry.updatedAt,
    };

    const { error } = await supabase.from('watch_history').upsert({
        ...base,
        timestamp_seconds: entry.timestampSeconds,
        duration_seconds: entry.durationSeconds,
        season: entry.season ?? null,
        episode: entry.episode ?? null,
    }, { onConflict: 'user_id,media_id' });

    // If new columns don't exist yet, fall back to base fields only
    if (error) {
        await supabase.from('watch_history').upsert(base, { onConflict: 'user_id,media_id' });
    }
}

/** Get saved progress for a media item (localStorage first, fast) */
export function getLocalProgress(userId: string, mediaId: string): ProgressEntry | null {
    try {
        const raw = localStorage.getItem(LS_KEY(userId, mediaId));
        return raw ? (JSON.parse(raw) as ProgressEntry) : null;
    } catch {
        return null;
    }
}

/** Format seconds to MM:SS or HH:MM:SS */
export function formatTime(seconds: number): string {
    if (!seconds || seconds < 1) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
}

/** Build vidsrc resume URL with ?t= param */
export function buildResumeUrl(baseUrl: string, timestampSeconds: number): string {
    if (!timestampSeconds || timestampSeconds < 10) return baseUrl;
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}t=${Math.floor(timestampSeconds)}`;
}