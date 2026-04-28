import React from 'react';
import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';

export default function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    severity = 'warning',
    loading = false,
}) {
    const icons = {
        warning: <AlertTriangle size={32} className="text-amber-500" />,
        error: <ShieldAlert size={32} className="text-red-500" />,
        info: <Info size={32} className="text-blue-500" />,
    };

    const colors = {
        warning: 'bg-amber-500/10 border-amber-500/20',
        error: 'bg-red-500/10 border-red-500/20',
        info: 'bg-blue-500/10 border-blue-500/20',
    };

    const colorClass = colors[severity] || colors.warning;

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={title}
            maxWidth="max-w-md"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        {cancelText}
                    </Button>
                    <Button
                        variant={severity === 'error' ? 'danger' : 'primary'}
                        onClick={onConfirm}
                        disabled={loading}
                        loading={loading}
                    >
                        {confirmText}
                    </Button>
                </>
            }
        >
            <div className="flex flex-col items-center text-center py-4">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 border ${colorClass}`}>
                    {icons[severity]}
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                    {message}
                </p>
            </div>
        </Modal>
    );
}
