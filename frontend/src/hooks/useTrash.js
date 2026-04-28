import { useState, useEffect, useCallback } from 'react';
import * as api from '../api/trash';

const normalizeItemId = (item) => {
    if (!item || typeof item !== 'object') return item;
    if (item.id) return item;
    if (item._id) return { ...item, id: String(item._id) };
    return item;
};

// Helper for data fetching
const useFetch = (fetchFunction) => {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetchFunction();
            const payload = response.data;
            setData(Array.isArray(payload) ? payload.map(normalizeItemId) : payload);
            setError(null);
        } catch (err) {
            setError(err);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [fetchFunction]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, isLoading, error, refetch: fetchData };
};

// Helper for mutations
const useMutation = (mutationFunction, eventName) => {
    const [isLoading, setIsLoading] = useState(false);

    const mutateAsync = async (id) => {
        setIsLoading(true);
        try {
            await mutationFunction(id);
            if (eventName) {
                window.dispatchEvent(new Event(eventName));
            }
            return true;
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return { mutateAsync, isLoading };
};

// Users
export const useDeletedUsers = () => useFetch(api.getDeletedUsers);
export const useRestoreUser = () => useMutation(api.restoreUser, 'userRestored');
export const useDeleteUserPermanent = () => useMutation(api.deleteUserPermanent);

// Products
export const useDeletedProducts = () => useFetch(api.getDeletedProducts);
export const useRestoreProduct = () => useMutation(api.restoreProduct, 'productRestored');
export const useDeleteProductPermanent = () => useMutation(api.deleteProductPermanent);

// Suppliers
export const useDeletedSuppliers = () => useFetch(api.getDeletedSuppliers);
export const useRestoreSupplier = () => useMutation(api.restoreSupplier, 'supplierRestored');
export const useDeleteSupplierPermanent = () => useMutation(api.deleteSupplierPermanent);

// Credit Customers
export const useDeletedCustomers = () => useFetch(api.getDeletedCustomers);
export const useRestoreCustomer = () => useMutation(api.restoreCustomer, 'creditCustomerRestored');
export const useDeleteCustomerPermanent = () => useMutation(api.deleteCustomerPermanent);

// Orders
export const useDeletedOrders = () => useFetch(api.getDeletedOrders);
export const useRestoreOrder = () => useMutation(api.restoreOrder, 'orderRestored');
export const useDeleteOrderPermanent = () => useMutation(api.deleteOrderPermanent);

// Sales
export const useDeletedSales = () => useFetch(api.getDeletedSales);
export const useRestoreSale = () => useMutation(api.restoreSale, 'saleRestored');
export const useDeleteSalePermanent = () => useMutation(api.deleteSalePermanent);

// Cheques
export const useDeletedCheques = () => useFetch(api.getDeletedCheques);
export const useRestoreCheque = () => useMutation(api.restoreCheque, 'chequeRestored');
export const useDeleteChequePermanent = () => useMutation(api.deleteChequePermanent);
