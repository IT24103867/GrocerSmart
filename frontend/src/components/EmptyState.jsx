import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './ui/Button';

export default function EmptyState({
    icon: Icon = Inbox,
    title = 'No data available',
    description,
    action,
    actionLabel,
    onAction
}) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
                <Icon size={40} className="text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                {title}
            </h3>
            {description && (
                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mb-6 leading-relaxed">
                    {description}
                </p>
            )}
            {(action || (actionLabel && onAction)) && (
                action || (
                    <Button
                        onClick={onAction}
                        variant="primary"
                        className="px-8"
                    >
                        {actionLabel}
                    </Button>
                )
            )}
        </div>
    );
}
