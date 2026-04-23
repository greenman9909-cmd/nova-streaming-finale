import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

export default function Privacy() {
    const { t } = useSettings();

    return (
        <main className="min-h-screen bg-nova-bg pt-24 pb-16">
            <div className="max-w-3xl mx-auto px-4 lg:px-6">
                <h1 className="text-3xl font-display font-bold text-white mb-6">{t('legal.privacyTitle')}</h1>
                <div className="glass-dark rounded-2xl p-6 space-y-4 text-sm text-nova-muted leading-relaxed">
                    <p>NOVA recopila datos de cuenta para autenticar usuarios y personalizar recomendaciones.</p>
                    <p>El historial y preferencias se usan solo para mejorar tu experiencia en la plataforma.</p>
                    <p>NOVA no vende datos personales a terceros.</p>
                    <p>Puedes solicitar actualizacion o eliminacion de datos escribiendo a soporte.</p>
                    <p>Para consultas de privacidad, contacta a support@nova.com.</p>
                </div>
                <div className="mt-6">
                    <Link to="/" className="text-nova-accent hover:underline">{t('legal.backHome')}</Link>
                </div>
            </div>
        </main>
    );
}
