# Yoru Anime Lab

A maintainable React + TypeScript anime discovery/player application used as the God Tree's controlled test subject.

## Runtime
- AniList GraphQL for catalogue/search/details/artwork.
- Supabase Auth + isolated `yoru_*` tables with RLS for library/progress/history/settings.
- HLS.js player.
- Legal public HLS test stream by default; configure `VITE_PLAYBACK_API_BASE` only for an authorized Yoru-compatible resolver.

## Design
Original source informed by the historical extracted ani.pm design evidence: cinematic near-full-height hero, split glass navigation, quiet metadata chips, white Play CTA, dense media shelves, dark canvas, and restrained motion. No extracted production bundle, private endpoint, brand copy, logo, or proprietary asset is shipped.

## Routes
`/`, `/anime`, `/search`, `/genres`, `/latest`, `/anime/:id`, `/watch/:anilistId/:episode`, `/library`, `/settings`.

## Environment
`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, optional `VITE_PLAYBACK_API_BASE`.

This branch is the controlled God Tree test subject. New frontend/backend lessons should be trialed here before promotion into tree-wide rules.