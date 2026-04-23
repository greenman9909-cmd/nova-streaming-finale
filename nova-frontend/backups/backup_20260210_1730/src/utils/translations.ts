export const translations = {
    en: {
        nav: {
            home: 'Home',
            movies: 'Movies',
            series: 'Series',
            anime: 'Anime',
            sports: 'Sports',
            history: 'History',
            settings: 'Settings',
        },
        settings: {
            title: 'Settings',
            account: 'Account',
            web: 'Web Settings',
            playback: 'Playback',
            appearance: 'Appearance',
            devices: 'Devices',
            history: 'History',
            accentColor: 'Accent Color',
            preview: 'Preview Effect',
            language: 'Interface Language',
            autoplay: 'Autoplay Next Episode',
            adultFilter: 'Adult Content Filter',
        }
    },
    es: {
        nav: {
            home: 'Inicio',
            movies: 'Películas',
            series: 'Series',
            anime: 'Anime',
            sports: 'Deportes',
            history: 'Historial',
            settings: 'Configuración',
        },
        settings: {
            title: 'Configuración',
            account: 'Cuenta',
            web: 'Preferencias Web',
            playback: 'Reproducción',
            appearance: 'Apariencia',
            devices: 'Dispositivos',
            history: 'Historial',
            accentColor: 'Color de Acento',
            preview: 'Vista Previa',
            language: 'Idioma de Interfaz',
            autoplay: 'Reproducción Automática',
            adultFilter: 'Filtro de Contenido (+18)',
        }
    },
    fr: {
        nav: {
            home: 'Accueil',
            movies: 'Films',
            series: 'Séries',
            anime: 'Animé',
            sports: 'Sports',
            history: 'Historique',
            settings: 'Paramètres',
        },
        settings: {
            title: 'Paramètres',
            account: 'Compte',
            web: 'Préférences Web',
            playback: 'Lecture',
            appearance: 'Apparence',
            devices: 'Appareils',
            history: 'Historique',
            accentColor: "Couleur d'accentuation",
            preview: 'Effet Aperçu',
            language: "Langue de l'interface",
            autoplay: 'Lecture Automatique',
            adultFilter: 'Filtre Adulte',
        }
    },
    pt: {
        nav: {
            home: 'Início',
            movies: 'Filmes',
            series: 'Séries',
            anime: 'Anime',
            sports: 'Esportes',
            history: 'Histórico',
            settings: 'Configurações',
        },
        settings: {
            title: 'Configurações',
            account: 'Conta',
            web: 'Preferências Web',
            playback: 'Reprodução',
            appearance: 'Aparência',
            devices: 'Dispositivos',
            history: 'Histórico',
            accentColor: 'Cor de Destaque',
            preview: 'Pré-visualização',
            language: 'Idioma da Interface',
            autoplay: 'Reprodução Automática',
            adultFilter: 'Filtro de Conteúdo',
        }
    }
};

export type Language = keyof typeof translations;
