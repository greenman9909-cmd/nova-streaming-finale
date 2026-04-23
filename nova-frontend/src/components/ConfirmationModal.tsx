import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import NovaLogo from './NovaLogo';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    email: string;
}

export default function ConfirmationModal({ isOpen, onClose, email }: ConfirmationModalProps) {
    const [animate, setAnimate] = useState(false);
    const [resending, setResending] = useState(false);
    const [resendStatus, setResendStatus] = useState<'idle' | 'sent' | 'error'>('idle');

    useEffect(() => {
        if (isOpen) {
            setAnimate(true);
            setResendStatus('idle');
        } else {
            setAnimate(false);
        }
    }, [isOpen]);

    const handleResend = async () => {
        setResending(true);
        setResendStatus('idle');
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email,
            });
            setResendStatus(error ? 'error' : 'sent');
        } catch {
            setResendStatus('error');
        } finally {
            setResending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with Blur */}
            <div
                className={`absolute inset-0 bg-black/60 backdrop-blur-xl transition-opacity duration-500 ${animate ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className={`relative w-full max-w-md bg-[#0f0f13] border border-white/10 rounded-3xl p-8 overflow-hidden transition-all duration-700 transform ${animate ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-10'}`}>

                {/* Orbital Background Effects */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-nova-accent/20 rounded-full blur-[80px] animate-pulse-slow"></div>
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-[40px]"></div>
                </div>

                <div className="relative z-10 flex flex-col items-center text-center">
                    {/* Nova Logo Animation */}
                    <div className="w-20 h-20 mb-6 relative flex items-center justify-center">
                        <NovaLogo className="w-20 h-20" />
                    </div>

                    <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
                        Revisa tu bandeja
                    </h2>

                    <p className="text-nova-muted text-sm md:text-base leading-relaxed mb-6">
                        Hemos enviado un enlace de verificación a <br />
                        <span className="text-white font-bold bg-white/5 px-2 py-0.5 rounded border border-white/10">{email}</span>
                    </p>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8 text-left w-full">
                        <div className="flex items-start gap-3">
                            <i className="ri-information-line text-nova-accent mt-0.5"></i>
                            <div className="text-xs text-gray-400">
                                <p className="mb-2">Haz clic en el enlace del correo para activar tu cuenta y empezar a ver.</p>
                                <p>¿No lo encuentras? Revisa tu carpeta de spam.</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-3.5 rounded-xl gradient-accent text-white font-bold hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        Entendido
                    </button>

                    <button
                        onClick={handleResend}
                        disabled={resending || resendStatus === 'sent'}
                        className="mt-4 text-xs text-nova-dim hover:text-white transition-colors disabled:opacity-50"
                    >
                        {resending ? 'Enviando...' : resendStatus === 'sent' ? '✓ Correo enviado' : resendStatus === 'error' ? 'Error — Reintentar' : 'Reenviar correo'}
                    </button>
                </div>
            </div>
        </div>
    );
}
