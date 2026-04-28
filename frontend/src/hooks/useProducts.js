import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import * as productsApi from '../api/productsApi';
import { getApiErrorMessage } from '../utils/apiError';

export const PRODUCT_KEYS = {
    all: ['products'],
    detail: (id) => ['products', id],
};

export const useProducts = () => {
    return useQuery({
        queryKey: PRODUCT_KEYS.all,
        queryFn: productsApi.getProducts,
    });
};

export const useProduct = (id) => {
    return useQuery({
        queryKey: PRODUCT_KEYS.detail(id),
        queryFn: () => productsApi.getProductById(id),
        enabled: !!id,
    });
};

export const useCreateProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: productsApi.createProduct,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] }); // Update dashboard KPIs
            toast.success(data.message || 'Product created successfully');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Failed to create product'));
        },
    });
};

export const useUpdateProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => productsApi.updateProduct(id, data),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
            queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            toast.success(data.message || 'Product updated successfully');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Failed to update product'));
        },
    });
};

export const useDeleteProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: productsApi.deleteProduct,
        onMutate: async (productId) => {
            await queryClient.cancelQueries({ queryKey: PRODUCT_KEYS.all });
            const previousProducts = queryClient.getQueryData(PRODUCT_KEYS.all);
            queryClient.setQueryData(PRODUCT_KEYS.all, (old) => {
                if (!old?.data) return old;
                return {
                    ...old,
                    data: old.data.filter((product) => product.id !== productId),
                };
            });
            return { previousProducts };
        },
        onError: (error, productId, context) => {
            queryClient.setQueryData(PRODUCT_KEYS.all, context.previousProducts);
            toast.error(getApiErrorMessage(error, 'Failed to delete product'));
        },
        onSuccess: (data) => {
            toast.success(data.message || 'Product deleted successfully');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
};
