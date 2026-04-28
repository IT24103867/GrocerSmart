export const ROLES = {
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    CASHIER: 'CASHIER'
};

export const MANAGER_ALLOWED_MODULES = new Set([
    'PRODUCTS',
    'INVENTORY_CONVERT',
    'CREDIT_CUSTOMERS',
    'CHEQUES',
    'SALES',
    'REPORTS',
    'SUPPLIERS',
    'PURCHASE_ORDERS'
]);

// Cashier is limited to POS operations and core receivables workflow.
export const CASHIER_ALLOWED_MODULES = new Set([
    'SALES',
    'CREDIT_CUSTOMERS',
    'CHEQUES'
]);

export const normalizeRole = (role) => String(role || ROLES.CASHIER).toUpperCase();

export const canAccessModule = ({ role, moduleKey, permissions = {} }) => {
    const normalizedRole = normalizeRole(role);

    if (!moduleKey) return true;
    if (normalizedRole === ROLES.ADMIN) return true;
    if (normalizedRole === ROLES.MANAGER) return MANAGER_ALLOWED_MODULES.has(moduleKey);
    if (normalizedRole === ROLES.CASHIER) {
        // Keep dynamic permission as an additional gate, but never exceed cashier baseline scope.
        if (!CASHIER_ALLOWED_MODULES.has(moduleKey)) return false;
        if (Object.prototype.hasOwnProperty.call(permissions || {}, moduleKey)) {
            return permissions?.[moduleKey] === true;
        }
        return true;
    }

    return false;
};

export const canAccessMenuItem = ({ item, role, permissions = {} }) => {
    const normalizedRole = normalizeRole(role);

    if (!item?.roles?.includes(normalizedRole)) return false;
    if (!item.moduleKey) return true;

    return canAccessModule({ role: normalizedRole, moduleKey: item.moduleKey, permissions });
};

export const canManageSuppliers = (role) => {
    const normalizedRole = normalizeRole(role);
    return normalizedRole === ROLES.ADMIN || normalizedRole === ROLES.MANAGER;
};
