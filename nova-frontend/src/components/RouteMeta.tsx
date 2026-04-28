import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

type MetaDefinition = {
    prefix: string;
    title: string;
    description: string;
};

const defaultMeta = {
    title: 'Nova Streaming | Películas, Series, Anime y Deportes en Vivo',
    description: 'Nova Streaming — la mejor plataforma de streaming en español. Mira películas, series, anime y deportes en vivo.',
};

const routeMeta: MetaDefinition[] = [
    { prefix: '/anime/watch', title: 'Nova Streaming | Ver Anime Online', description: 'Mira episodios de anime en Full HD con reproductor optimizado en Nova Streaming.' },
    { prefix: '/anime', title: 'Nova Streaming | Anime Online', description: 'Catálogo completo de anime en Nova Streaming. Sub y doblado en español.' },
    { prefix: '/peliculas', title: 'Nova Streaming | Películas Online', description: 'Mira películas en HD. Estrenos, clásicos y tendencias en Nova Streaming.' },
    { prefix: '/series', title: 'Nova Streaming | Series Online', description: 'Las mejores series en streaming. Populares, trending y top rating en Nova.' },
    { prefix: '/deportes', title: 'Nova Streaming | Deportes en Vivo', description: 'Streaming de deportes en vivo. Fútbol, baloncesto y más en Nova Streaming.' },
    { prefix: '/plans', title: 'Nova Streaming | Planes y Precios', description: 'Compara los planes de Nova Streaming: Free, Standard y Nova+. Empieza gratis.' },
    { prefix: '/search', title: 'Nova Streaming | Buscar Contenido', description: 'Busca películas, series, anime y más en Nova Streaming.' },
    { prefix: '/login', title: 'Nova Streaming | Iniciar Sesión', description: 'Accede a tu cuenta de Nova Streaming.' },
    { prefix: '/signup', title: 'Nova Streaming | Crear Cuenta Gratis', description: 'Regístrate gratis en Nova Streaming y empieza a ver contenido hoy.' },
    { prefix: '/about', title: 'Nova Streaming | Sobre Nosotros', description: 'Conoce al equipo detrás de Nova Streaming: Adam, Owais y Jampier.' },
    { prefix: '/privacy', title: 'Nova Streaming | Política de Privacidad', description: 'Consulta cómo Nova Streaming protege tu información.' },
    { prefix: '/terms', title: 'Nova Streaming | Términos de Servicio', description: 'Revisa los términos de uso de Nova Streaming.' },
];

function setMetaTag(attr: 'name' | 'property', key: string, content: string) {
    const selector = `meta[${attr}="${key}"]`;
    let tag = document.querySelector(selector) as HTMLMetaElement | null;
    if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, key);
        document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
}

function setCanonical(url: string) {
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
    }
    canonical.href = url;
}

export default function RouteMeta() {
    const location = useLocation();

    useEffect(() => {
        const meta = routeMeta.find((item) => location.pathname.startsWith(item.prefix)) || defaultMeta;
        const canonicalUrl = `${window.location.origin}${location.pathname}${location.search}`;

        document.title = meta.title;
        document.documentElement.lang = 'es';
        setMetaTag('name', 'description', meta.description);
        setMetaTag('name', 'keywords', 'nova streaming, nova stream, streaming anime, peliculas online, series streaming, deportes en vivo');
        setMetaTag('property', 'og:site_name', 'Nova Streaming');
        setMetaTag('property', 'og:type', 'website');
        setMetaTag('property', 'og:title', meta.title);
        setMetaTag('property', 'og:description', meta.description);
        setMetaTag('property', 'og:url', canonicalUrl);
        setMetaTag('property', 'og:image', `${window.location.origin}/og-image.png`);
        setMetaTag('name', 'twitter:card', 'summary_large_image');
        setMetaTag('name', 'twitter:title', meta.title);
        setMetaTag('name', 'twitter:description', meta.description);
        setMetaTag('name', 'twitter:image', `${window.location.origin}/og-image.png`);
        setCanonical(canonicalUrl);
    }, [location.pathname, location.search]);

    return null;
}
