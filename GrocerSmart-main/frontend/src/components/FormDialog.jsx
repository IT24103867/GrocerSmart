import React from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';

export default function FormDialog({
    open,
    onClose,
    onSubmit,
    title,
    subtitle,
    children,
    submitText = 'Save Changes',
    cancelText = 'Cancel',
    loading = false,
    submitDisabled = false,
    maxWidth = 'max-w-xl',
}) {
    const handleSubmit = (e) => {
        e.preventDefault();
        if (onSubmit) onSubmit(e);
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={title}
            subtitle={subtitle}
            maxWidth={maxWidth}
            loading={loading}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        {cancelText}
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        form="dialog-form"
                        disabled={loading || submitDisabled}
                        loading={loading}
                    >
                        {submitText}
                    </Button>
                </>
            }
        >
            <form id="dialog-form" onSubmit={handleSubmit} className="space-y-4">
                {children}
                {/* Hidden submit button to allow Enter key submission */}
                <button type="submit" className="hidden" />
            </form>
        </Modal>
    );
}
