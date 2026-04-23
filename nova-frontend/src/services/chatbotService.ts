export interface ChatAction {
    label: string;
    type: 'link' | 'quick_reply' | 'action';
    payload: string;
    icon?: string;
}

export interface ChatResponse {
    text: string;
    actions?: ChatAction[];
    mood?: 'happy' | 'thinking' | 'confused' | 'neutral';
}

class ChatService {
    private intents = [
        {
            keywords: ['reset', 'password', 'contraseña', 'olvidé', 'login', 'acceso'],
            response: "No te preocupes, el acceso al cosmos a veces es complicado. 🌌\n\nPuedes restablecer tu contraseña aquí mismo:",
            actions: [
                { label: "Restablecer Password", type: 'link', payload: '/update-password', icon: 'ri-key-2-line' }
            ],
            mood: 'neutral'
        },
        {
            keywords: ['anime', 'animación', 'japonés', 'dibujos'],
            response: "¡El universo del Anime es infinito! 🎌\n\nAquí tienes el acceso directo a nuestra colección completa:",
            actions: [
                { label: "Ir a Anime", type: 'link', payload: '/anime', icon: 'ri-sword-line' }
            ],
            mood: 'happy'
        },
        {
            keywords: ['película', 'cine', 'movie', 'film', 'estreno'],
            response: "¿Buscas cine de calidad? 🎬\n\nDesde clásicos en 1080p Full HD hasta los últimos estrenos. ¿Qué te apetece hoy?",
            actions: [
                { label: "Ver Películas", type: 'link', payload: '/peliculas', icon: 'ri-movie-2-line' }
            ],
            mood: 'happy'
        },
        {
            keywords: ['deportes', 'fútbol', 'partido', 'vivo', 'live', 'sports'],
            response: "¡La arena está encendida! 🏟️\n\nNo te pierdas ningún evento en vivo. Revisa la cartelera ahora:",
            actions: [
                { label: "Ir a Deportes", type: 'link', payload: '/deportes', icon: 'ri-football-line' }
            ],
            mood: 'happy'
        },
        {
            keywords: ['series', 'tv', 'show', 'episodio', 'capítulo'],
            response: "Historias que atrapan. 📺\n\nTenemos las series más maratoneables del momento. ¿Listo para la siguiente obsesión?",
            actions: [
                { label: "Explorar Series", type: 'link', payload: '/series', icon: 'ri-tv-line' }
            ],
            mood: 'happy'
        },
        {
            keywords: ['nobuff', 'lento', 'traba', 'carga', 'error', 'no reproduce'],
            response: "Vaya, parece que hay interferencias en la señal. 📡\n\nPrueba estas soluciones rápidas:\n1. Recarga la página\n2. Cambia la calidad del video\n3. Limpia tu caché\n\n¿Persiste el problema?",
            actions: [
                { label: "Reportar Problema", type: 'quick_reply', payload: 'reportar_tecnico', icon: 'ri-tools-line' }
            ],
            mood: 'confused'
        },
        {
            keywords: ['hola', 'hi', 'start', 'inicio', 'buenos días', 'buenas tardes'],
            response: "¡Hola, viajero! 👋\n\nSoy NOVA AI, tu copiloto en esta travesía. ¿En qué puedo ayudarte hoy?\n\n• Puedo recomendarte qué ver\n• Solucionar problemas técnicos\n• Guiarte por la plataforma",
            mood: 'happy'
        }
    ];

    private defaultResponse: ChatResponse = {
        text: "Mmm, mis sensores no captan esa frecuencia. 📡\n\n¿Podrías reformularlo? O prueba con alguna de estas opciones:",
        mood: 'confused',
        actions: [
            { label: "Ver Tendencias", type: 'quick_reply', payload: 'Tendencias', icon: 'ri-fire-line' },
            { label: "Soporte Técnico", type: 'quick_reply', payload: 'soporte', icon: 'ri-customer-service-2-line' }
        ]
    };

    public getResponse(input: string): ChatResponse {
        const lowerInput = input.toLowerCase();

        // 1. Check for Exact Keywords logic
        for (const intent of this.intents) {
            if (intent.keywords.some(keyword => lowerInput.includes(keyword))) {
                return {
                    text: intent.response,
                    actions: intent.actions as ChatAction[],
                    mood: intent.mood as any
                };
            }
        }

        // 2. Fallback to default
        return this.defaultResponse;
    }

    public getInitialGreetings(): ChatResponse {
        return {
            text: "¡Sistemas en línea! 🟢\n\nBienvenido a NOVA. Soy tu asistente personal de IA.\n¿Buscas tu próxima obsesión o necesitas asistencia técnica? 🚀",
            mood: 'happy',
            actions: [
                { label: "Recomiéndame algo", type: 'quick_reply', payload: 'recomendacion', icon: 'ri-magic-line' },
                { label: "Ayuda", type: 'quick_reply', payload: 'ayuda', icon: 'ri-question-line' }
            ]
        };
    }
}

export const chatService = new ChatService();
