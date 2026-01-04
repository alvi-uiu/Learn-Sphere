import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`
              flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md animate-in slide-in-from-right duration-300
              ${toast.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                                toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                    'bg-blue-500/10 border-blue-500/20 text-blue-400'}
            `}
                    >
                        {toast.type === 'success' && <CheckCircle size={18} />}
                        {toast.type === 'error' && <AlertCircle size={18} />}
                        {toast.type === 'info' && <Info size={18} />}
                        <span className="text-sm font-medium">{toast.message}</span>
                        <button onClick={() => removeToast(toast.id)} className="hover:bg-white/10 p-1 rounded-lg transition-colors">
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
