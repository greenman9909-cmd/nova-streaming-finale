import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

export default function Terms() {
    const { t } = useSettings();

    return (
        <main className="min-h-screen bg-nova-bg pt-24 pb-16">
            <div className="max-w-3xl mx-auto px-4 lg:px-6">
                <h1 className="text-3xl font-display font-bold text-white mb-6">{t('legal.termsTitle')}</h1>
                <div className="glass-dark rounded-2xl p-6 space-y-4 text-sm text-nova-muted leading-relaxed">
                    <p>Al usar NOVA, aceptas utilizar el servicio de manera legal y responsable.</p>
                    <p>La disponibilidad del contenido puede cambiar sin aviso por proveedores o restricciones regionales.</p>
                    <p>Las cuentas son personales. Compartir credenciales puede causar suspension de cuenta.</p>
                    <p>NOVA puede actualizar estos terminos. El uso continuo implica aceptacion de cambios.</p>
                    <p>Si tienes dudas, escribe a support@nova.com.</p>
                </div>
                <div className="mt-6">
                    <Link to="/" className="text-nova-accent hover:underline">{t('legal.backHome')}</Link>
                </div>
            </div>
        </main>
    );
}
