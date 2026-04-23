import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function UpdatePassword() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (password.length < 6) {
            setError('Password must have at least 6 characters.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) {
                setError(error.message);
                return;
            }

            setSuccessMessage('Password updated successfully. You can now sign in.');
            setTimeout(() => navigate('/login'), 1200);
        } catch {
            setError('Could not update password. Try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <div className="glass-dark rounded-3xl p-8 md:p-10">
                    <div className="text-center mb-8">
                        <h1 className="font-display font-bold text-3xl text-white mb-2">Update Password</h1>
                        <p className="text-nova-muted">Enter your new password.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="New password"
                            className="w-full px-5 py-4 rounded-xl bg-nova-surface border border-white/10 text-white placeholder:text-nova-dim focus:outline-none focus:border-nova-accent transition-colors"
                            required
                        />
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            className="w-full px-5 py-4 rounded-xl bg-nova-surface border border-white/10 text-white placeholder:text-nova-dim focus:outline-none focus:border-nova-accent transition-colors"
                            required
                        />

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm text-center">
                                {error}
                            </div>
                        )}
                        {successMessage && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-sm text-center">
                                {successMessage}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 rounded-xl gradient-accent text-white font-semibold text-lg hover:opacity-90 transition-opacity glow-accent disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Guardando...' : 'Guardar contraseña'}
                        </button>
                    </form>

                    <p className="text-center mt-8 text-nova-muted">
                        Volver a{' '}
                        <Link to="/login" className="text-nova-accent hover:text-nova-accent-hover transition-colors font-medium">
                            Iniciar sesión
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}
