import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import * as suppliersApi from '../api/suppliersApi';
import { getApiErrorMessage } from '../utils/apiError';

export const SUPPLIER_KEYS = {
    all: ['suppliers'],
    detail: (id) => ['suppliers', id],
};

export const useSuppliers = () => {
    return useQuery({
        queryKey: SUPPLIER_KEYS.all,
        queryFn: suppliersApi.getSuppliers,
    });
};

export const useSupplier = (id) => {
    return useQuery({
        queryKey: SUPPLIER_KEYS.detail(id),
        queryFn: () => suppliersApi.getSupplierById(id),
        enabled: !!id,
    });
};

export const useCreateSupplier = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: suppliersApi.createSupplier,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: SUPPLIER_KEYS.all });
            toast.success(data.message || 'Supplier created successfully');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Failed to create supplier'));
        },
    });
};

export const useUpdateSupplier = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => suppliersApi.updateSupplier(id, data),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: SUPPLIER_KEYS.all });
            queryClient.invalidateQueries({ queryKey: SUPPLIER_KEYS.detail(variables.id) });
            toast.success(data.message || 'Supplier updated successfully');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Failed to update supplier'));
        },
    });
};

export const useDeleteSupplier = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: suppliersApi.deleteSupplier,
        onMutate: async (supplierId) => {
            await queryClient.cancelQueries({ queryKey: SUPPLIER_KEYS.all });
            const previousSuppliers = queryClient.getQueryData(SUPPLIER_KEYS.all);
            queryClient.setQueryData(SUPPLIER_KEYS.all, (old) => {
                if (!old?.data) return old;
                return {
                    ...old,
                    data: old.data.filter((supplier) => supplier.id !== supplierId),
                };
            });
            return { previousSuppliers };
        },
        onError: (error, supplierId, context) => {
            queryClient.setQueryData(SUPPLIER_KEYS.all, context.previousSuppliers);
            toast.error(getApiErrorMessage(error, 'Failed to delete supplier'));
        },
        onSuccess: (data) => {
            toast.success(data.message || 'Supplier deleted successfully');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: SUPPLIER_KEYS.all });
        },
    });
};
