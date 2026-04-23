
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatService, ChatAction } from '../services/chatbotService';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    actions?: ChatAction[];
    mood?: string;
}

export default function FloatingChatbot() {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Initialize with greeting
    useEffect(() => {
        const greeting = chatService.getInitialGreetings();
        setMessages([{
            role: 'assistant',
            content: greeting.text,
            timestamp: new Date(),
            actions: greeting.actions,
            mood: greeting.mood
        }]);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [messages, isTyping, isOpen]);

    const handleAction = (action: ChatAction) => {
        if (action.type === 'link') {
            navigate(action.payload);
            setIsOpen(false);
        } else if (action.type === 'quick_reply') {
            handleSend(action.payload); // Send as message
        }
    };

    const handleSend = (text?: string) => {
        const messageText = text || inputValue.trim();
        if (!messageText) return;

        // User Message
        const userMessage: Message = {
            role: 'user',
            content: messageText,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsTyping(true);

        // API Response Simulation
        const thinkTime = Math.random() * 800 + 600;

        setTimeout(() => {
            const response = chatService.getResponse(messageText);

            const assistantMessage: Message = {
                role: 'assistant',
                content: response.text,
                timestamp: new Date(),
                actions: response.actions,
                mood: response.mood
            };

            setMessages(prev => [...prev, assistantMessage]);
            setIsTyping(false);
        }, thinkTime);
    };

    const handleClearChat = () => {
        const greeting = chatService.getInitialGreetings();
        setMessages([{
            role: 'assistant',
            content: "✨ Chat reiniciado. ¿Empezamos de nuevo?",
            timestamp: new Date(),
            actions: greeting.actions
        }]);
    };

    return (
        <>
            {/* Floating Button */}
            <div className="fixed bottom-6 right-6 z-[200]">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="uiverse-trigger group relative outline-none transition-transform active:scale-95"
                    aria-label="Toggle AI Assistant"
                >
                    <div className={`loader ${isOpen ? 'active-chat' : ''}`}>
                        <div className="box"></div>
                        <svg width="100" height="100" viewBox="0 0 100 100">
                            <defs>
                                <mask id="clipping">
                                    <polygon points="0,0 100,0 100,100 0,100" fill="black"></polygon>
                                    <polygon points="25,25 75,25 50,75" fill="white"></polygon>
                                    <polygon points="50,25 75,75 25,75" fill="white"></polygon>
                                    <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                                    <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                                    <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                                    <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                                </mask>
                            </defs>
                        </svg>

                        <div className="absolute inset-0 flex items-center justify-center z-20 transition-transform duration-500 group-hover:scale-110">
                            {isOpen ? (
                                <i className="ri-close-line text-2xl text-white drop-shadow-md"></i>
                            ) : (
                                <i className="ri-sparkling-2-fill text-3xl text-white drop-shadow-[0_0_15px_rgba(139,92,246,0.8)] animate-pulse"></i>
                            )}
                        </div>
                    </div>
                </button>
            </div>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 z-[200] w-[380px] md:w-[420px] max-h-[80vh] flex flex-col glass-premium rounded-[32px] overflow-hidden animate-scale-in shadow-2xl shadow-violet-500/10 border border-white/10 origin-bottom-right transition-all duration-300">

                    {/* Header */}
                    <div className="relative overflow-hidden bg-[#0B0D12]/80 p-5 border-b border-white/5 backdrop-blur-xl z-20">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-violet-600/30 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 animate-pulse-glow" />

                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/20 animate-float-slow">
                                    <i className="ri-openai-fill text-white text-2xl"></i>
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="text-white font-bold text-lg leading-tight tracking-wide font-display">
                                        NOVA AI
                                    </h3>
                                    <p className="text-xs text-violet-200 font-medium flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                        Neural Engine Active
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleClearChat}
                                className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                            >
                                <i className="ri-refresh-line text-lg"></i>
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20 bg-[#020204]/95">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-pop-in`}
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <div className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {msg.role === 'assistant' && (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-white/5 flex items-center justify-center flex-shrink-0 mt-1">
                                            <i className="ri-sparkling-fill text-xs text-cyan-300"></i>
                                        </div>
                                    )}

                                    <div
                                        className={`rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed shadow-lg ${msg.role === 'user'
                                            ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-none shadow-violet-500/20'
                                            : 'bg-[#1a1a20]/80 border border-white/5 text-gray-100 rounded-bl-none backdrop-blur-md shadow-black/20'
                                            }`}
                                    >
                                        <div className="whitespace-pre-wrap font-medium">{msg.content}</div>
                                    </div>
                                </div>

                                {/* Smart Actions */}
                                {msg.actions && (
                                    <div className="flex flex-wrap gap-2 mt-3 ml-11 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                                        {msg.actions.map((action, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleAction(action)}
                                                className={`
                                                    px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 border
                                                    ${action.type === 'link'
                                                        ? 'bg-violet-500/10 border-violet-500/30 text-violet-200 hover:bg-violet-500/20 hover:scale-105'
                                                        : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10 hover:text-white'}
                                                `}
                                            >
                                                {action.icon && <i className={action.icon}></i>}
                                                {action.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex items-center gap-2 animate-fade-in ml-11">
                                <div className="bg-[#1a1a20] border border-white/5 rounded-2xl rounded-bl-none px-4 py-3.5 flex items-center gap-1.5 shadow-lg">
                                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-[#0B0D12]/90 border-t border-white/5 backdrop-blur-xl z-20">
                        <div className="relative flex items-center gap-2 bg-[#020204] border border-white/10 rounded-2xl p-1.5 pl-5 focus-within:border-violet-500/50 focus-within:shadow-[0_0_20px_rgba(139,92,246,0.15)] transition-all">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Escribe tu mensaje..."
                                className="flex-1 bg-transparent text-white text-sm placeholder:text-gray-500 focus:outline-none py-2 font-medium"
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={!inputValue.trim()}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${inputValue.trim()
                                    ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-lg shadow-violet-500/30 hover:scale-105 active:scale-95'
                                    : 'bg-white/5 text-gray-600 cursor-not-allowed'
                                    }`}
                            >
                                <i className="ri-send-plane-fill text-lg"></i>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <style>{`
                 /* Keep existing loader styles */
                 .loader {
                    --color-one: #8b5cf6; 
                    --color-two: #22d3ee; 
                    --color-three: rgba(139, 92, 246, 0.5);
                    --color-four: rgba(34, 211, 238, 0.5);
                    --color-five: rgba(139, 92, 246, 0.2);
                    --time-animation: 2s;
                    --size: 0.65;
                    position: relative;
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    transform: scale(var(--size));
                    box-shadow: 0 0 25px 0 var(--color-three);
                    animation: colorize calc(var(--time-animation) * 4) ease-in-out infinite;
                    transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
                    background: rgba(11, 13, 18, 0.6);
                    backdrop-filter: blur(12px);
                }

                .loader.active-chat {
                    --size: 0.55;
                    box-shadow: none;
                    transform: scale(var(--size)) rotate(45deg); /* Subtle twist when active */
                }
                
                .loader.active-chat .box {
                    opacity: 0; /* Hide internal box when active for cleaner look */
                    transition: opacity 0.3s;
                }

                .loader::before {
                    content: "";
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    border-top: solid 1px var(--color-one);
                    border-bottom: solid 1px var(--color-two);
                    background: linear-gradient(180deg, var(--color-five), var(--color-four));
                    box-shadow:
                        inset 0 10px 10px 0 var(--color-three),
                        inset 0 -10px 10px 0 var(--color-four);
                }

                .loader .box {
                    width: 100px;
                    height: 100px;
                    background: linear-gradient(
                        180deg,
                        var(--color-one) 30%,
                        var(--color-two) 70%
                    );
                    mask: url(#clipping);
                    -webkit-mask: url(#clipping);
                }

                .loader svg {
                    position: absolute;
                    visibility: hidden;
                    width: 0;
                    height: 0;
                }

                .loader svg #clipping {
                    filter: contrast(15);
                    animation: roundness calc(var(--time-animation) / 2) linear infinite;
                }

                .loader svg #clipping polygon {
                    filter: blur(7px);
                }

                @keyframes rotation {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                @keyframes roundness {
                    0%, 100% { filter: contrast(15); }
                    20%, 40% { filter: contrast(3); }
                    60% { filter: contrast(15); }
                }

                @keyframes colorize {
                    0%, 100% { filter: hue-rotate(0deg); }
                    50% { filter: hue-rotate(30deg); }
                }

            `}</style>
        </>
    );
}
