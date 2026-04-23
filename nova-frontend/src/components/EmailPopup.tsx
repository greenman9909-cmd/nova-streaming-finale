import { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { supabase } from '../lib/supabase';

export default function EmailPopup() {
    const { t } = useSettings();
    const [isVisible, setIsVisible] = useState(false);
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    useEffect(() => {
        // Check if user has already dismissed or subscribed
        const hasSeenPopup = localStorage.getItem('nova-email-popup-dismissed');
        if (!hasSeenPopup) {
            // Show popup after 2 seconds delay
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem('nova-email-popup-dismissed', 'true');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (email && !isSubmitting) {
            setIsSubmitting(true);
            try {
                // Insert into Supabase leads table
                const { error } = await supabase
                    .from('leads')
                    .insert([{ email, source: 'EmailPopup' }]);
                
                if (error && error.code !== '23505') { // Ignore duplicate emails
                    console.error('Error saving email:', error);
                }
            } catch (err) {
                console.error('Failed to submit email:', err);
            } finally {
                setIsSubmitting(false);
                setIsSubmitted(true);
                localStorage.setItem('nova-email-popup-dismissed', 'true');
                setTimeout(() => setIsVisible(false), 2000);
            }
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="discountForm animate-scale-in">
                {/* Close Button */}
                <button onClick={handleClose} className="exitBtn">
                    ×
                </button>

                {!isSubmitted ? (
                    <>
                        {/* Logo/Icon */}
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-2">
                            <i className="ri-mail-star-line text-3xl text-white"></i>
                        </div>

                        <h2 className="DiscountHeading">{t('emailPopup.title')}</h2>
                        <p className="DiscountSubheading">
                            {t('emailPopup.subtitle')}
                        </p>

                        <form onSubmit={handleSubmit} className="inputContainer">
                            <input
                                type="email"
                                id="email-address"
                                placeholder={t('emailPopup.placeholder')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <button type="submit" disabled={isSubmitting} className="submitButton flex justify-center items-center disabled:opacity-75 disabled:cursor-not-allowed">
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    t('emailPopup.subscribe')
                                )}
                            </button>
                        </form>

                        <p className="text-[10px] text-gray-400 text-center">
                            {t('emailPopup.noSpam')}
                        </p>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center">
                            <i className="ri-check-line text-3xl text-white"></i>
                        </div>
                        <h2 className="DiscountHeading">{t('emailPopup.successTitle')}</h2>
                        <p className="DiscountSubheading">
                            {t('emailPopup.successSubtitle')}
                        </p>
                    </div>
                )}
            </div>

            <style>{`
                .discountForm {
                    width: 280px;
                    background-color: #111827; /* Dark theme fix */
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 30px;
                    gap: 15px;
                    position: relative;
                    box-shadow: 0px 0px 40px rgba(0, 0, 0, 0.2);
                    border-radius: 16px;
                }

                .DiscountHeading {
                    font-size: 1.4em;
                    color: #f8fafc;
                    font-weight: 700;
                    margin: 0;
                }

                .DiscountSubheading {
                    font-size: 0.85em;
                    color: #94a3b8;
                    text-align: center;
                    line-height: 1.4;
                }

                .inputContainer {
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                #email-address {
                    height: 42px;
                    width: 100%;
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    background-color: rgba(255, 255, 255, 0.05);
                    padding: 0px 15px;
                    outline: none;
                    text-align: center;
                    border-radius: 8px;
                    font-size: 14px;
                    color: #f8fafc;
                    transition: border-color 0.2s;
                }

                #email-address:focus {
                    border-color: rgb(139, 92, 246);
                }

                .submitButton {
                    width: 100%;
                    height: 42px;
                    border: none;
                    background: linear-gradient(135deg, rgb(139, 92, 246), rgb(168, 85, 247));
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                    border-radius: 8px;
                    font-size: 14px;
                    transition: transform 0.2s, box-shadow 0.2s;
                }

                .submitButton:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
                }

                .exitBtn {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background-color: rgba(255, 255, 255, 0.1);
                    border-radius: 50%;
                    width: 28px;
                    height: 28px;
                    border: none;
                    color: #cbd5e1;
                    font-size: 1.3em;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background-color 0.2s;
                }

                .exitBtn:hover {
                    background-color: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
}
