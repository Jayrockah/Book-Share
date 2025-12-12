import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('❌ Error Boundary caught an error:', error, errorInfo);
        this.setState({
            error,
            errorInfo
        });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    padding: '20px',
                    textAlign: 'center',
                    backgroundColor: '#f8fafc'
                }}>
                    <div style={{
                        maxWidth: '500px',
                        padding: '32px',
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{
                            fontSize: '48px',
                            marginBottom: '16px'
                        }}>⚠️</div>
                        <h1 style={{
                            fontSize: '24px',
                            marginBottom: '12px',
                            color: '#1f2937'
                        }}>Something went wrong</h1>
                        <p style={{
                            color: '#6b7280',
                            marginBottom: '24px',
                            lineHeight: '1.6'
                        }}>
                            The application encountered an unexpected error. This could be due to a network issue or a temporary problem.
                        </p>

                        {this.state.error && (
                            <details style={{
                                marginBottom: '24px',
                                padding: '12px',
                                backgroundColor: '#fef2f2',
                                borderRadius: '8px',
                                textAlign: 'left',
                                cursor: 'pointer'
                            }}>
                                <summary style={{ color: '#dc2626', fontWeight: '600', marginBottom: '8px' }}>
                                    Error Details
                                </summary>
                                <pre style={{
                                    fontSize: '12px',
                                    overflow: 'auto',
                                    color: '#991b1b',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word'
                                }}>
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}

                        <button
                            onClick={this.handleReset}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: '#667eea',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#5568d3'}
                            onMouseOut={(e) => e.target.style.backgroundColor = '#667eea'}
                        >
                            Go to Home Page
                        </button>

                        <p style={{
                            marginTop: '24px',
                            fontSize: '14px',
                            color: '#9ca3af'
                        }}>
                            If this problem persists, try:
                            <br />
                            • Clearing your browser cache
                            <br />
                            • Checking your internet connection
                            <br />
                            • Refreshing the page
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
