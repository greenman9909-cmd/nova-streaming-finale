import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    /** Optional custom fallback UI */
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({ errorInfo });
        // Log to console in all envs; swap for Sentry/LogRocket in prod
        console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            const isDev = import.meta.env.DEV;

            return (
                <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6">
                    {/* Background glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-rose-500 opacity-[0.05] blur-[100px] pointer-events-none" />

                    <div className="relative z-10 max-w-lg w-full text-center">
                        {/* Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                                <i className="ri-error-warning-line text-4xl text-rose-400" />
                            </div>
                        </div>

                        <h1 className="text-2xl font-bold text-white mb-2">
                            Something went wrong
                        </h1>
                        <p className="text-white/50 mb-8 text-sm leading-relaxed">
                            An unexpected error occurred. We're sorry for the inconvenience.
                            Please try reloading the page.
                        </p>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
                            <button
                                onClick={this.handleReset}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105"
                                style={{
                                    background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
                                    boxShadow: '0 0 24px rgba(244,63,94,0.3)',
                                }}
                            >
                                <i className="ri-home-4-line" />
                                Back to Home
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white/70 border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-all duration-300"
                            >
                                <i className="ri-refresh-line" />
                                Reload Page
                            </button>
                        </div>

                        {/* Dev-only error details */}
                        {isDev && this.state.error && (
                            <details className="text-left bg-white/5 border border-white/10 rounded-xl p-4 mt-4">
                                <summary className="text-white/50 text-xs font-mono cursor-pointer mb-2 select-none">
                                    Error details (dev only)
                                </summary>
                                <pre className="text-rose-400 text-xs font-mono whitespace-pre-wrap break-all mt-2">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
