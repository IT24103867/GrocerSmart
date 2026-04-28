const getFirstDetailMessage = (details) => {
    if (!details) return null;

    if (typeof details === 'string') {
        return details.trim() || null;
    }

    if (Array.isArray(details)) {
        const first = details.find((item) => typeof item === 'string' && item.trim());
        return first?.trim() || null;
    }

    if (typeof details === 'object') {
        for (const value of Object.values(details)) {
            const nested = getFirstDetailMessage(value);
            if (nested) return nested;
        }
    }

    return null;
};

export const getApiErrorMessage = (error, fallback = 'Operation failed') => {
    const responseData = error?.response?.data;
    const firstDetailMessage = getFirstDetailMessage(responseData?.details);
    if (firstDetailMessage) return firstDetailMessage;

    if (typeof responseData?.message === 'string' && responseData.message.trim()) {
        return responseData.message.trim();
    }

    if (typeof responseData?.error === 'string' && responseData.error.trim()) {
        return responseData.error.trim();
    }

    if (typeof error?.message === 'string' && error.message.trim()) {
        return error.message.trim();
    }

    return fallback;
};

export default getApiErrorMessage;
