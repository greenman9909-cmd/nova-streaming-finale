# Movie Streams SOP

## Goal
Provide a 100% ad-free and popup-free viewing experience for TMDB Movies by bypassing third-party HTML `iframe` embeds completely. This is achieved by scraping direct `.m3u8` streaming links using the `@consumet/extensions` library (FlixHQ provider) on the backend, and playing them natively using `hls.js` on the frontend.

## Inputs
- TMDB Movie ID (string or number)
- Movie Title (string, fetched via TMDB if needed)

## Tool Logic
1. **Frontend Request:** `MovieWatch.tsx` calls `GET /api/movies/:id` on the backend.
2. **Backend Resolver (`server/routes/movies.ts`):** 
   - Receives the TMDB ID.
   - Fetches the movie title from TMDB.
   - Uses `MOVIES.FlixHQ().search(title)` to find the internal FlixHQ ID.
   - Uses `fetchMediaInfo(flixHqId)` to retrieve the episode list (movies have 1 episode).
   - Uses `fetchEpisodeSources(episodeId, flixHqId)` to get the direct `.m3u8` stream URLs and subtitles.
3. **Response Payload:** Returns the validated JSON schema defined in `gemini.md`.
4. **Frontend Playback:** `MovieWatch.tsx` feeds the `.m3u8` URL directly into `EnhancedPlayer.tsx`, which uses native HTML5 `<video>` and `hls.js`. No `iframe`, no sandbox issues, no popups.

## Edge Cases
- **No Results Found:** If FlixHQ does not have the movie, the backend returns a 404 or empty source array. The frontend should display a user-friendly error or fallback.
- **FlixHQ Rate Limits/Bans:** If the provider goes down, the backend should catch the exception and return a clean error payload rather than crashing.
