import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notification, setNotification] = useState({
        open: false,
        message: '',
        severity: 'success', // 'success' | 'error' | 'info' | 'warning'
    });

    const showNotification = useCallback((message, severity = 'success') => {
        setNotification({
            open: true,
            message,
            severity,
        });
    }, []);

    const handleClose = useCallback(() => {
        setNotification((prev) => ({ ...prev, open: false }));
    }, []);

    // Auto-hide
    useEffect(() => {
        if (notification.open) {
            const timer = setTimeout(() => {
                handleClose();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification.open, handleClose]);

    const getIcon = (severity) => {
        switch (severity) {
            case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
            case 'warning': return <AlertCircle className="w-5 h-5 text-orange-500" />;
            case 'info': return <Info className="w-5 h-5 text-blue-500" />;
            default: return null;
        }
    };

    const getStyles = (severity) => {
        switch (severity) {
            case 'success': return 'bg-green-50 border-green-200 text-green-800';
            case 'error': return 'bg-red-50 border-red-200 text-red-800';
            case 'warning': return 'bg-orange-50 border-orange-200 text-orange-800';
            case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
            default: return 'bg-white border-gray-200 text-gray-800';
        }
    };

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}

            {/* Global Snackbar UI (Tailwind based) */}
            <div
                className={`fixed bottom-6 right-6 z-[9999] transition-all duration-300 transform font-arabic ${notification.open ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'
                    }`}
                dir="rtl"
            >
                <div className={`flex items-center space-x-3 space-x-reverse min-w-[320px] max-w-md p-5 rounded-2xl shadow-2xl border backdrop-blur-md ${getStyles(notification.severity)}`}>
                    <div className="flex-shrink-0">
                        {getIcon(notification.severity)}
                    </div>
                    <div className="flex-1 font-bold text-sm">
                        {notification.message}
                    </div>
                    <button
                        onClick={handleClose}
                        className="flex-shrink-0 p-1.5 rounded-xl hover:bg-black/5 transition-all opacity-40 hover:opacity-100"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </NotificationContext.Provider>
    );
};
