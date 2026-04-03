import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Here you could log the error to an error reporting service
        console.error('Uncaught error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">عذراً، حدث خطأ غير متوقع</h1>
                        <p className="text-gray-600 mb-8">
                            واجه التطبيق مشكلة تقنية مفاجئة. يرجى محاولة إعادة تحميل الصفحة.
                        </p>
                        <button
                            onClick={this.handleReset}
                            className="w-full flex items-center justify-center space-x-2 space-x-reverse bg-primary-600 text-white py-3 px-4 rounded-xl hover:bg-primary-700 transition-colors font-bold shadow-lg shadow-primary-200"
                        >
                            <RefreshCw className="w-5 h-5" />
                            <span>إعادة تحميل التطبيق</span>
                        </button>
                        {process.env.NODE_ENV === 'development' && (
                            <div className="mt-8 text-right bg-gray-100 p-4 rounded-lg overflow-auto max-h-40">
                                <p className="text-xs font-mono text-red-600">{this.state.error?.toString()}</p>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
