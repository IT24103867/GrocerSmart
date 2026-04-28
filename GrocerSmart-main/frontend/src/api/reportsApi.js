import api from './axios';

export const getSalesReportPdf = (from, to) => {
    return api.get('/reports/sales/pdf', {
        params: { from, to },
        responseType: 'blob'
    });
};

export const getInvoicePdf = (salesId) => {
    return api.get(`/reports/sales/${salesId}/invoice.pdf`, {
        responseType: 'blob'
    });
};

export const getCustomerLedgerPdf = (customerId) => {
    return api.get(`/reports/credit-customers/${customerId}/ledger.pdf`, {
        responseType: 'blob'
    });
};

export const getCustomerProfilePdf = (customerId) => {
    return api.get(`/reports/credit-customers/${customerId}/pdf`, {
        responseType: 'blob'
    });
};

export const getChequeReportPdf = (status) => {
    return api.get('/reports/cheques/pdf', {
        params: { status },
        responseType: 'blob'
    });
};

export const getInventoryReportPdf = (status) => {
    return api.get('/reports/products/pdf', {
        params: { status },
        responseType: 'blob'
    });
};

export const getProductDetailsPdf = (id) => {
    return api.get(`/reports/products/${id}/pdf`, {
        responseType: 'blob'
    });
};

export const getSupplierPurchaseHistoryPdf = (supplierId) => {
    return api.get(`/reports/suppliers/${supplierId}/purchase-history.pdf`, {
        responseType: 'blob'
    });
};

export const getSupplierProfilePdf = (supplierId) => {
    return api.get(`/reports/suppliers/${supplierId}/pdf`, {
        responseType: 'blob'
    });
};

export const getUserReportPdf = () => {
    return api.get('/reports/users/pdf', {
        responseType: 'blob'
    });
};

export const getUserDetailsPdf = (id) => {
    return api.get(`/reports/users/${id}/pdf`, {
        responseType: 'blob'
    });
};

export const getCreditCustomerReportPdf = () => {
    return api.get('/reports/credit-customers/pdf', {
        responseType: 'blob'
    });
};

export const getSupplierListReportPdf = () => {
    return api.get('/reports/suppliers/pdf', {
        responseType: 'blob'
    });
};

export const getPurchaseOrderReportPdf = (from, to) => {
    return api.get('/reports/purchase-orders/pdf', {
        params: { from, to },
        responseType: 'blob'
    });
};

export const getPurchaseOrderPdf = (id) => {
    return api.get(`/reports/purchase-orders/${id}/pdf`, {
        responseType: 'blob'
    });
};

export const downloadBlob = (blob, filename) => {
    try {
        const payload = blob instanceof Blob ? blob : new Blob([blob]);
        const url = window.URL.createObjectURL(payload);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();

        if (link.parentNode) {
            link.parentNode.removeChild(link);
        }

        // Delay revoke to avoid browser timing edge cases during file save.
        setTimeout(() => {
            try {
                window.URL.revokeObjectURL(url);
            } catch (_) {
                // no-op
            }
        }, 1000);

        return true;
    } catch (_) {
        return false;
    }
};
