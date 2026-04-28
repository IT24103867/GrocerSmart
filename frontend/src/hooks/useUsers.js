import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import * as usersApi from '../api/usersApi';
import { getApiErrorMessage } from '../utils/apiError';

// Query Keys
export const USER_KEYS = {
    all: ['users'],
    detail: (id) => ['users', id],
};

// Fetch all users
export const useUsers = () => {
    return useQuery({
        queryKey: USER_KEYS.all,
        queryFn: usersApi.getUsers,
    });
};

// Fetch single user
export const useUser = (id) => {
    return useQuery({
        queryKey: USER_KEYS.detail(id),
        queryFn: () => usersApi.getUser(id),
        enabled: !!id,
    });
};

// Create user mutation
export const useCreateUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: usersApi.createUser,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
            toast.success(data.message || 'User created successfully');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Failed to create user'));
        },
    });
};

// Update user mutation
export const useUpdateUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => usersApi.updateUser(id, data),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
            queryClient.invalidateQueries({ queryKey: USER_KEYS.detail(variables.id) });
            toast.success(data.message || 'User updated successfully');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Failed to update user'));
        },
    });
};

// Delete user mutation
export const useDeleteUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: usersApi.deleteUser,
        onMutate: async (userId) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: USER_KEYS.all });

            // Snapshot previous value
            const previousUsers = queryClient.getQueryData(USER_KEYS.all);

            // Optimistically update to remove user
            queryClient.setQueryData(USER_KEYS.all, (old) => {
                if (!old?.data) return old;
                return {
                    ...old,
                    data: old.data.filter((user) => user.id !== userId),
                };
            });

            return { previousUsers };
        },
        onError: (error, userId, context) => {
            // Rollback on error
            queryClient.setQueryData(USER_KEYS.all, context.previousUsers);
            toast.error(getApiErrorMessage(error, 'Failed to delete user'));
        },
        onSuccess: (data) => {
            toast.success(data.message || 'User deleted successfully');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
        },
    });
};

// Activate user mutation
export const useActivateUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: usersApi.activateUser,
        onSuccess: (data, userId) => {
            queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
            queryClient.invalidateQueries({ queryKey: USER_KEYS.detail(userId) });
            toast.success(data.message || 'User activated successfully');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Failed to activate user'));
        },
    });
};

// Deactivate user mutation
export const useDeactivateUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: usersApi.deactivateUser,
        onSuccess: (data, userId) => {
            queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
            queryClient.invalidateQueries({ queryKey: USER_KEYS.detail(userId) });
            toast.success(data.message || 'User deactivated successfully');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Failed to deactivate user'));
        },
    });
};
