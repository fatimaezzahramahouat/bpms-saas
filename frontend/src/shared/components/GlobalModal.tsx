import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, AlertCircle, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type ModalType = 'info' | 'success' | 'warning' | 'error';

interface GlobalModalContextType {
    showModal: (message: string, type?: ModalType, title?: string) => void;
    showConfirm: (options: ConfirmOptions) => void;
    hideModal: () => void;
}

interface ConfirmOptions {
    message: string;
    title?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel?: () => void;
    variant?: 'primary' | 'danger';
}

const GlobalModalContext = createContext<GlobalModalContextType | undefined>(undefined);

export function useGlobalModal() {
    const context = useContext(GlobalModalContext);
    if (!context) {
        throw new Error('useGlobalModal must be used within a GlobalModalProvider');
    }
    return context;
}

interface GlobalModalProviderProps {
    children: ReactNode;
}

export function GlobalModalProvider({ children }: GlobalModalProviderProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [type, setType] = useState<ModalType>('info');
    const [title, setTitle] = useState('');
    const [isConfirm, setIsConfirm] = useState(false);
    const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions | null>(null);

    const showModal = useCallback((msg: string, t: ModalType = 'info', head?: string) => {
        setMessage(msg);
        setType(t);
        setTitle(head || (t.charAt(0).toUpperCase() + t.slice(1)));
        setIsConfirm(false);
        setConfirmOptions(null);
        setIsOpen(true);
    }, []);

    const showConfirm = useCallback((options: ConfirmOptions) => {
        setConfirmOptions(options);
        setMessage(options.message);
        setType('warning');
        setTitle(options.title || 'Confirmation');
        setIsConfirm(true);
        setIsOpen(true);
    }, []);

    const hideModal = useCallback(() => {
        setIsOpen(false);
        if (isConfirm && confirmOptions?.onCancel) {
            confirmOptions.onCancel();
        }
    }, [isConfirm, confirmOptions]);

    const handleConfirm = useCallback(() => {
        setIsOpen(false);
        if (confirmOptions?.onConfirm) {
            confirmOptions.onConfirm();
        }
    }, [confirmOptions]);

    return (
        <GlobalModalContext.Provider value={{ showModal, showConfirm, hideModal }}>
            {children}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <ModalIcon type={type} />
                                        <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                                            {title}
                                        </h3>
                                    </div>
                                    <button
                                        onClick={hideModal}
                                        className="p-1 hover:bg-[var(--bg-hover)] rounded-lg transition-colors text-[var(--text-secondary)]"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="text-[var(--text-secondary)] mb-6 leading-relaxed">
                                    {message}
                                </div>

                                <div className="flex justify-end gap-3">
                                    {isConfirm ? (
                                        <>
                                            <button
                                                onClick={hideModal}
                                                className="px-6 py-2 bg-[var(--bg-hover)] hover:bg-[var(--border-color)] text-[var(--text-primary)] rounded-lg font-medium transition-all active:scale-95"
                                            >
                                                {confirmOptions?.cancelLabel || 'Annuler'}
                                            </button>
                                            <button
                                                onClick={handleConfirm}
                                                className={`px-6 py-2 ${confirmOptions?.variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-[var(--primary-color)] hover:bg-[var(--primary-hover)]'} text-white rounded-lg font-medium transition-all shadow-lg active:scale-95`}
                                            >
                                                {confirmOptions?.confirmLabel || 'Confirmer'}
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={hideModal}
                                            className="px-6 py-2 bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                                        >
                                            D'accord
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </GlobalModalContext.Provider>
    );
}

function ModalIcon({ type }: { type: ModalType }) {
    switch (type) {
        case 'success':
            return <CheckCircle className="w-6 h-6 text-green-500" />;
        case 'error':
            return <AlertCircle className="w-6 h-6 text-red-500" />;
        case 'warning':
            return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
        default:
            return <Info className="w-6 h-6 text-blue-500" />;
    }
}
