
// Authentication Service

interface User {
    username: string;
    email: string;
}

interface AuthResponse {
    success: boolean;
    token?: string;
    user?: User;
    message?: string;
}

const API_BASE = '/api/auth';

export const authService = {
    async login(username: string, password: string): Promise<AuthResponse> {
        try {
            const response = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();

            if (data.success && data.token) {
                localStorage.setItem('nova_token', data.token);
                localStorage.setItem('nova_user', JSON.stringify(data.user));
            }

            return data;
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Network error' };
        }
    },

    async register(username: string, email: string, password: string): Promise<AuthResponse> {
        try {
            const response = await fetch(`${API_BASE}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const data = await response.json();

            if (data.success && data.token) {
                localStorage.setItem('nova_token', data.token);
                localStorage.setItem('nova_user', JSON.stringify(data.user));
            }

            return data;
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, message: 'Network error' };
        }
    },

    logout() {
        localStorage.removeItem('nova_token');
        localStorage.removeItem('nova_user');
        window.location.reload();
    },

    getCurrentUser(): User | null {
        try {
            const userStr = localStorage.getItem('nova_user');
            return userStr ? JSON.parse(userStr) : null;
        } catch {
            return null;
        }
    },

    isAuthenticated(): boolean {
        return !!localStorage.getItem('nova_token');
    }
};
