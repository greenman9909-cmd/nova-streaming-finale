import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
    fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

describe('Source guards for critical regressions', () => {
    it('keeps only one AvatarSelectionModal mount in Navbar', () => {
        const source = read('src/components/Navbar.tsx');
        const matches = source.match(/<AvatarSelectionModal/g) || [];
        expect(matches).toHaveLength(1);
    });

    it('keeps EmailPopup behind env flag in App', () => {
        const source = read('src/App.tsx');
        expect(source).toContain("VITE_ENABLE_EMAIL_POPUP === 'true'");
        expect(source).toContain('{showEmailPopup && <EmailPopup />}');
    });

    it('routes TMDB traffic through backend proxy', () => {
        const source = read('src/services/api.ts');
        expect(source).toContain("const TMDB_PROXY_BASE_URL = '/api/tmdb';");
        expect(source).not.toContain('api.themoviedb.org/3');
    });
});
