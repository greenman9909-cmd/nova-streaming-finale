import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

type MetaDefinition = {
    prefix: string;
    title: string;
    description: string;
};

const defaultMeta = {
    title: 'NOVA | Peliculas, Series, Anime y Deportes',
    description: 'NOVA - Streaming de peliculas, series, anime y deportes en vivo.'
};

const routeMeta: MetaDefinition[] = [
    { prefix: '/anime/watch', title: 'NOVA | Ver Anime', description: 'Mira episodios de anime con reproductor optimizado.' },
    { prefix: '/anime', title: 'NOVA | Anime', description: 'Descubre y reproduce anime en NOVA.' },
    { prefix: '/peliculas', title: 'NOVA | Peliculas', description: 'Catalogo de peliculas con estrenos y tendencias.' },
    { prefix: '/series', title: 'NOVA | Series', description: 'Series destacadas, populares y top rating en NOVA.' },
    { prefix: '/deportes', title: 'NOVA | Deportes en Vivo', description: 'Partidos y eventos deportivos en vivo.' },
    { prefix: '/plans', title: 'NOVA | Planes', description: 'Compara planes y elige la mejor suscripcion NOVA.' },
    { prefix: '/search', title: 'NOVA | Buscar', description: 'Busca peliculas, series y anime rapidamente.' },
    { prefix: '/login', title: 'NOVA | Iniciar Sesion', description: 'Accede a tu cuenta NOVA.' },
    { prefix: '/signup', title: 'NOVA | Crear Cuenta', description: 'Registrate en NOVA y comienza a ver contenido.' },
    { prefix: '/privacy', title: 'NOVA | Politica de Privacidad', description: 'Consulta como NOVA protege tu informacion.' },
    { prefix: '/terms', title: 'NOVA | Terminos de Servicio', description: 'Revisa los terminos de uso de NOVA.' }
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
        setMetaTag('property', 'og:title', meta.title);
        setMetaTag('property', 'og:description', meta.description);
        setMetaTag('name', 'twitter:title', meta.title);
        setMetaTag('name', 'twitter:description', meta.description);
        setMetaTag('property', 'og:url', canonicalUrl);
        setCanonical(canonicalUrl);
    }, [location.pathname, location.search]);

    return null;
}
