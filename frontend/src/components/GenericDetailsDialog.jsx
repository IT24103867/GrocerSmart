import React from 'react';
import { Info } from 'lucide-react';
import Modal from './ui/Modal';
import Badge from './ui/Badge';
import Button from './ui/Button';

const HIDDEN_KEYS = new Set([
    '_id',
    '__v',
    'id',
    'password',
    'passwordHash',
    'snapshotJson',
    'imagePath',
    'isDeleted',
    'deletedAt',
    'activityLogs',
    'ledger',
    'items'
]);

const LABEL_MAP = {
    publicId: 'Reference ID',
    fullName: 'Full Name',
    username: 'Username',
    email: 'Email Address',
    phone: 'Phone Number',
    role: 'Role',
    status: 'Status',
    lastLogin: 'Last Login',
    createdAt: 'Created On',
    updatedAt: 'Updated On',
    name: 'Name',
    contactPerson: 'Contact Person',
    address: 'Address',
    category: 'Category',
    unitPrice: 'Unit Price',
    bulkPrice: 'Bulk Price',
    purchasePrice: 'Purchase Price',
    reorderPoint: 'Reorder Point',
    totalInRetailUnits: 'Stock (Retail Units)',
    bankName: 'Bank Name',
    chequeNumber: 'Cheque Number',
    chequeType: 'Cheque Type',
    issueDate: 'Issue Date',
    dueDate: 'Due Date',
    note: 'Notes',
};

const isDateField = (key) => /(date|at)$/i.test(key);
const isMoneyField = (key) => /(price|balance|limit|amount|revenue|payable|total)/i.test(key);

const formatKey = (key) => {
    if (LABEL_MAP[key]) return LABEL_MAP[key];
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase());
};

const formatValue = (key, value) => {
    if (value === null || value === undefined || value === '') return '—';

    if (typeof value === 'boolean') return value ? 'Yes' : 'No';

    if (isDateField(key)) {
        const dt = new Date(value);
        if (!Number.isNaN(dt.getTime())) {
            return dt.toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    if (typeof value === 'number' && isMoneyField(key)) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'LKR',
            maximumFractionDigits: 2,
        }).format(value);
    }

    if (Array.isArray(value)) {
        if (value.length === 0) return '—';
        if (value.every((entry) => ['string', 'number'].includes(typeof entry))) {
            return value.join(', ');
        }
        return `${value.length} records`;
    }

    if (typeof value === 'object') {
        return 'Available';
    }

    return String(value);
};

const getStatusVariant = (status) => {
    const normalized = String(status || '').toUpperCase();
    if (['ACTIVE', 'CLEARED', 'PAID', 'CONFIRMED', 'DELIVERED', 'RECEIVED'].includes(normalized)) return 'success';
    if (['PENDING', 'PARTIAL', 'DRAFT', 'DEPOSITED'].includes(normalized)) return 'amber';
    if (['INACTIVE', 'BOUNCED', 'CANCELLED', 'ERROR', 'DISCONTINUED'].includes(normalized)) return 'error';
    return 'brand';
};

export default function GenericDetailsDialog({ open, onClose, data, title = 'Details' }) {
    if (!data || typeof data !== 'object') return null;

    const displayData = Object.entries(data).filter(([key, value]) =>
        !HIDDEN_KEYS.has(key) && value !== undefined
    );

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                        <Info size={20} />
                    </div>
                    <div>
                        <span className="text-lg font-black text-slate-900 dark:text-slate-100">{title}</span>
                        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Summary view</p>
                    </div>
                </div>
            }
            maxWidth="max-w-xl"
        >
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
                {displayData.length === 0 && (
                    <div className="col-span-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                        No details available.
                    </div>
                )}

                {displayData.map(([key, value]) => (
                    <div key={key} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">{formatKey(key)}</p>

                        {key === 'status' ? (
                            <Badge variant={getStatusVariant(value)}>
                                {String(value || '—').toUpperCase()}
                            </Badge>
                        ) : (
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 break-words">
                                {formatValue(key, value)}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-6 flex justify-end">
                <Button variant="primary" size="md" onClick={onClose} className="px-8">
                    Close
                </Button>
            </div>
        </Modal>
    );
}
