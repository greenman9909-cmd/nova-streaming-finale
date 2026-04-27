import { Link, useLocation } from 'react-router-dom';
import NovaLogo from './NovaLogo';
import { useSettings } from '../context/SettingsContext';

const HIDDEN_PREFIXES = ['/watch/', '/anime/watch/', '/deportes/watch/'];
const HIDDEN_EXACT = new Set(['/login', '/signup', '/update-password', '/profiles']);

const isVisibleRoute = (pathname: string): boolean => {
    if (HIDDEN_EXACT.has(pathname)) return false;
    return !HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
};

export default function Footer() {
    const location = useLocation();
    const { t } = useSettings();

    if (!isVisibleRoute(location.pathname)) {
        return null;
    }

    return (
        <footer className="border-t border-white/5 bg-[#0a0a0f] mt-14">
            <div className="w-full page-gutter pt-8 pb-24 md:pb-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <NovaLogo className="w-8 h-8" />
                        <span className="font-display font-bold text-xl text-white">NOVA</span>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-400">
                        <Link to="/anime" className="hover:text-white transition-colors">{t('nav.anime')}</Link>
                        <Link to="/peliculas" className="hover:text-white transition-colors">{t('nav.movies')}</Link>
                        <Link to="/series" className="hover:text-white transition-colors">{t('nav.series')}</Link>
                        <Link to="/deportes" className="hover:text-white transition-colors">{t('nav.sports')}</Link>
                    </div>

                    <div className="flex items-center gap-4 text-gray-500 text-sm">
                        <Link to="/about" className="hover:text-white transition-colors">Nosotros</Link>
                        <Link to="/privacy" className="hover:text-white transition-colors">Privacidad</Link>
                        <Link to="/terms" className="hover:text-white transition-colors">Terminos</Link>
                        <a href="mailto:support@nova.com" className="hover:text-white transition-colors">{t('footer.support')}</a>
                        <span>(c) {new Date().getFullYear()} NOVA. {t('footer.rights')}</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
