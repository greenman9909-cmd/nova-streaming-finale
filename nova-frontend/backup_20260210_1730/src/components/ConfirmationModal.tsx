import { useEffect, useState } from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    email: string;
}

export default function ConfirmationModal({ isOpen, onClose, email }: ConfirmationModalProps) {
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setAnimate(true);
        } else {
            setAnimate(false);
        }
    }, [isOpen]);

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
                    {/* Icon Assembly Animation */}
                    <div className="w-20 h-20 mb-6 relative flex items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-tr from-violet-500 to-fuchsia-500 rounded-2xl blur-xl opacity-40 animate-spin-slow"></div>
                        <div className="relative w-16 h-16 bg-gradient-to-tr from-violet-600 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 border border-white/20">
                            <i className="ri-mail-send-line text-3xl text-white animate-bounce"></i>
                        </div>
                        {/* Orbiting Particles */}
                        <div className="absolute inset-0 border border-white/10 rounded-full w-24 h-24 -m-2 animate-spin-reverse-slow border-t-transparent border-b-transparent"></div>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
                        Check Your Inbox
                    </h2>

                    <p className="text-nova-muted text-sm md:text-base leading-relaxed mb-6">
                        We've sent a verification link to <br />
                        <span className="text-white font-bold bg-white/5 px-2 py-0.5 rounded border border-white/10">{email}</span>
                    </p>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8 text-left w-full">
                        <div className="flex items-start gap-3">
                            <i className="ri-information-line text-nova-accent mt-0.5"></i>
                            <div className="text-xs text-gray-400">
                                <p className="mb-2">Click the link in the email to activate your account and start streaming.</p>
                                <p>Can't find it? Check your spam folder.</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-3.5 rounded-xl gradient-accent text-white font-bold hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        Got it, thanks!
                    </button>

                    <button className="mt-4 text-xs text-nova-dim hover:text-white transition-colors">
                        Resend Email
                    </button>
                </div>
            </div>
        </div>
    );
}
