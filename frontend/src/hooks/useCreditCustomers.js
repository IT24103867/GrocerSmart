import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import * as creditApi from '../api/creditCustomersApi';
import { getApiErrorMessage } from '../utils/apiError';

export const CREDIT_CUSTOMER_KEYS = {
    all: ['creditCustomers'],
    detail: (id) => ['creditCustomers', id],
    payments: (id) => ['creditCustomers', id, 'payments'],
};

export const useCreditCustomers = () => {
    return useQuery({
        queryKey: CREDIT_CUSTOMER_KEYS.all,
        queryFn: creditApi.getCustomers,
    });
};

export const useCreditCustomer = (id) => {
    return useQuery({
        queryKey: CREDIT_CUSTOMER_KEYS.detail(id),
        queryFn: () => creditApi.getCustomer(id),
        enabled: !!id,
    });
};

export const useCreateCreditCustomer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: creditApi.createCustomer,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: CREDIT_CUSTOMER_KEYS.all });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            toast.success(data.message || 'Credit customer created successfully');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Failed to create credit customer'));
        },
    });
};

export const useUpdateCreditCustomer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => creditApi.updateCustomer(id, data),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: CREDIT_CUSTOMER_KEYS.all });
            queryClient.invalidateQueries({ queryKey: CREDIT_CUSTOMER_KEYS.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            toast.success(data.message || 'Credit customer updated successfully');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Failed to update credit customer'));
        },
    });
};

export const useDeleteCreditCustomer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: creditApi.deleteCustomer,
        onMutate: async (customerId) => {
            await queryClient.cancelQueries({ queryKey: CREDIT_CUSTOMER_KEYS.all });
            const previousCustomers = queryClient.getQueryData(CREDIT_CUSTOMER_KEYS.all);
            queryClient.setQueryData(CREDIT_CUSTOMER_KEYS.all, (old) => {
                if (!old?.data) return old;
                return {
                    ...old,
                    data: old.data.filter((customer) => customer.id !== customerId),
                };
            });
            return { previousCustomers };
        },
        onError: (error, customerId, context) => {
            queryClient.setQueryData(CREDIT_CUSTOMER_KEYS.all, context.previousCustomers);
            toast.error(getApiErrorMessage(error, 'Failed to delete credit customer'));
        },
        onSuccess: (data) => {
            toast.success(data.message || 'Credit customer deleted successfully');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: CREDIT_CUSTOMER_KEYS.all });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
};
