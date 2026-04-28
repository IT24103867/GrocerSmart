import React, { useState, useMemo } from 'react';
import { Search, UserPlus, Filter, FileBarChart, Edit, Trash2, Eye, X, Shield, Phone, Mail, UserCheck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'react-toastify';

import { getUsers, createUser, updateUser, deleteUser, activateUser, deactivateUser } from '../api/usersApi';
import { getUserReportPdf, downloadBlob } from '../api/reportsApi';
import { getApiErrorMessage } from '../utils/apiError';

import { PageHeader, DataTable, FormDialog, ConfirmDialog, StatusChip, DashboardCard, AnimatedContainer, GenericDetailsDialog } from '../components';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Toggle from '../components/ui/Toggle';
import Badge from '../components/ui/Badge';

const initialFormData = {
    fullName: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    role: 'CASHIER',
};

const NAME_REGEX = /^[a-zA-Z\s]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{3,30}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(?:0(?:70|71|72|74|75|76|77|78)\d{7}|\+94(?:70|71|72|74|75|76|77|78)\d{7})$/;

export default function Users() {
    const role = localStorage.getItem('role') || 'CASHIER';
    const isAdmin = role === 'ADMIN';
    const queryClient = useQueryClient();

    // Table & Filter State
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [orderBy, setOrderBy] = useState('id');
    const [orderDirection, setOrderDirection] = useState('desc');

    // Dialog State
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [editId, setEditId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [formData, setFormData] = useState(initialFormData);

    // Data Fetching
    const { data, isLoading } = useQuery({
        queryKey: ['users', page, rowsPerPage, search, filterRole, filterStatus, orderBy, orderDirection],
        queryFn: async () => {
            const params = {
                page,
                size: rowsPerPage,
                search: search || undefined,
                role: filterRole || undefined,
                status: filterStatus || undefined,
                sort: `${orderBy},${orderDirection}`
            };
            const response = await getUsers(params);
            return response.data || response;
        },
        placeholderData: keepPreviousData,
        staleTime: 5000
    });

    const users = data?.content || [];
    const totalCount = data?.totalElements || 0;

    // Mutations
    const mutationOptions = {
        onSuccess: () => {
            queryClient.invalidateQueries(['users']);
            setDialogOpen(false);
            setDeleteDialogOpen(false);
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Operation failed'));
        }
    };

    const createMutation = useMutation({ mutationFn: createUser, ...mutationOptions, onSuccess: () => { toast.success('User created'); mutationOptions.onSuccess(); } });
    const updateMutation = useMutation({ mutationFn: (data) => updateUser(editId, data), ...mutationOptions, onSuccess: () => { toast.success('User updated'); mutationOptions.onSuccess(); } });
    const deleteMutation = useMutation({ mutationFn: deleteUser, ...mutationOptions, onSuccess: () => { toast.success('User deleted'); mutationOptions.onSuccess(); } });
    const activateMutation = useMutation({ mutationFn: activateUser, ...mutationOptions, onSuccess: () => { toast.success('User activated'); mutationOptions.onSuccess(); } });
    const deactivateMutation = useMutation({ mutationFn: deactivateUser, ...mutationOptions, onSuccess: () => { toast.success('User deactivated'); mutationOptions.onSuccess(); } });

    const getUserId = (user) => user?.id || user?._id;

    const handleOpenDialog = (user = null) => {
        if (!isAdmin) return toast.error('Access Denied');
        if (user) {
            setEditId(getUserId(user));
            setFormData({
                fullName: user.fullName,
                username: user.username,
                email: user.email || '',
                password: '',
                phone: user.phone || '',
                role: user.role,
            });
        } else {
            setEditId(null);
            setFormData(initialFormData);
        }
        setDialogOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const fullName = String(formData.fullName || '').trim();
        const username = String(formData.username || '').trim();
        const email = String(formData.email || '').trim();
        const phone = String(formData.phone || '').trim();
        const password = String(formData.password || '');
        const normalizedRole = String(formData.role || '').trim().toUpperCase();

        if (!fullName) return toast.error('Full name is required');
        if (!NAME_REGEX.test(fullName)) return toast.error('Full name must contain only letters');
        if (!username) return toast.error('Username is required');
        if (!USERNAME_REGEX.test(username)) return toast.error('Username must be 3-30 characters (letters, numbers, _, -, . only)');
        if (!email) return toast.error('Email is required');
        if (!EMAIL_REGEX.test(email)) return toast.error('Please enter a valid email address');
        if (!phone) return toast.error('Phone number is required');
        if (!PHONE_REGEX.test(phone)) return toast.error('Phone number must be 070-078 format with 0 or +94');
        if (!normalizedRole || !['ADMIN', 'MANAGER', 'CASHIER'].includes(normalizedRole)) return toast.error('Please select a valid role');
        if (!editId && !password.trim()) return toast.error('Password is required');
        if (!editId && password.trim().length < 8) return toast.error('Password must be at least 8 characters');
        if (editId && password.trim() && password.trim().length < 8) return toast.error('Password must be at least 8 characters');

        const payload = {
            ...formData,
            fullName,
            username,
            email,
            phone,
            role: normalizedRole,
            password
        };

        if (editId) updateMutation.mutate(payload);
        else createMutation.mutate(payload);
    };

    const handleToggleStatus = (user) => {
        if (!isAdmin) return toast.error('Access Denied');
        const userId = getUserId(user);
        if (!userId) return toast.error('Invalid user identifier');
        if (user.status === 'ACTIVE') deactivateMutation.mutate(userId);
        else activateMutation.mutate(userId);
    };

    const handleSort = (property) => {
        const isAsc = orderBy === property && orderDirection === 'asc';
        setOrderDirection(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleExportUserReport = async () => {
        if (!isAdmin) return toast.error('Access Denied');
        try {
            const { data } = await getUserReportPdf();
            downloadBlob(data, `Users_Report_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success("User report downloaded");
        } catch (error) { toast.error("Failed to generate report"); }
    };

    const columns = useMemo(() => [
        { 
            id: 'fullName', label: 'User Details', minWidth: '220px', sortable: true, 
            render: (val, row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold">
                        {val.charAt(0)}
                    </div>
                    <div>
                        <p className="font-black text-slate-900 dark:text-slate-100 leading-tight">{val}</p>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{row.username}</p>
                    </div>
                </div>
            ) 
        },
        { id: 'phone', label: 'Phone', minWidth: '120px', sortable: true, render: (val) => <span className="font-bold text-slate-500 dark:text-slate-400">{val || '—'}</span> },
        { 
            id: 'role', label: 'Privileges', minWidth: '100px', sortable: true, 
            render: (val) => (
                <Badge variant={val === 'ADMIN' ? 'brand' : 'secondary'}>
                    <Shield size={10} className="mr-1 inline-block -mt-0.5" /> {val}
                </Badge>
            ) 
        },
        {
            id: 'activeToggle', label: 'Access', align: 'center',
            render: (_, row) => (
                <Toggle 
                    enabled={row.status === 'ACTIVE'} 
                    onChange={() => handleToggleStatus(row)} 
                    disabled={!isAdmin || activateMutation.isPending || deactivateMutation.isPending}
                />
            )
        },
        { id: 'lastLogin', label: 'Last Login', minWidth: '150px', sortable: true, render: (val) => val ? new Date(val).toLocaleString() : '—' },
        { id: 'createdAt', label: 'Join Date', minWidth: '150px', sortable: true, render: (val) => val ? new Date(val).toLocaleDateString() : '—' },
    ], [isAdmin, activateMutation.isPending, deactivateMutation.isPending]);

    return (
        <AnimatedContainer>
            <PageHeader
                title="Staff Management" 
                subtitle="Manage system operators and security roles"
                icon={<UserCheck size={24} className="text-white" />}
                actions={
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="md" onClick={handleExportUserReport} disabled={!isAdmin}>
                            <FileBarChart size={18} className="mr-2" /> Export Staff List
                        </Button>
                        <Button variant="primary" size="md" onClick={() => handleOpenDialog()} disabled={!isAdmin}>
                            <UserPlus size={18} className="mr-2" /> New Operator
                        </Button>
                    </div>
                }
            />

            <DashboardCard title="User Directory" className="mt-8">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8 items-end">
                    <div className="md:col-span-4">
                        <Input
                            label="Search Directory"
                            placeholder="Name, Username, ID..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                            className="bg-slate-50 dark:bg-slate-800/50 border-none"
                        />
                    </div>
                    <div className="md:col-span-3">
                         <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1">Role Filter</label>
                            <select 
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/20"
                                value={filterRole}
                                onChange={(e) => { setFilterRole(e.target.value); setPage(0); }}
                            >
                                <option value="">All Roles</option>
                                <option value="ADMIN">Administrator</option>
                                <option value="MANAGER">Manager</option>
                                <option value="CASHIER">Cashier</option>
                            </select>
                        </div>
                    </div>
                    <div className="md:col-span-3">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1">Account Status</label>
                            <select 
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/20"
                                value={filterStatus}
                                onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
                            >
                                <option value="">All Status</option>
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                            </select>
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <Button 
                            variant="secondary" 
                            className="w-full text-[10px]" 
                            disabled={!search && !filterRole && !filterStatus}
                            onClick={() => { setSearch(''); setFilterRole(''); setFilterStatus(''); setPage(0); }}
                        >
                            <X size={14} className="mr-1" /> Reset
                        </Button>
                    </div>
                </div>

                <DataTable
                    serverSide columns={columns} data={users} loading={isLoading}
                    totalCount={totalCount} page={page} rowsPerPage={rowsPerPage}
                    onPageChange={setPage} onRowsPerPageChange={setRowsPerPage}
                    orderBy={orderBy} orderDirection={orderDirection} onSortChange={handleSort}
                    actions={(row) => (
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedUser(row); setDetailsOpen(true); }} className="text-blue-500 hover:bg-blue-50">
                                <Eye size={16} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(row)} disabled={!isAdmin} className="text-emerald-500 hover:bg-emerald-50 disabled:opacity-30">
                                <Edit size={16} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => { setDeleteId(getUserId(row)); setDeleteDialogOpen(true); }} disabled={!isAdmin} className="text-red-500 hover:bg-red-50 disabled:opacity-30">
                                <Trash2 size={16} />
                            </Button>
                        </div>
                    )}
                />
            </DashboardCard>

            <FormDialog
                open={dialogOpen} onClose={() => setDialogOpen(false)} onSubmit={handleSubmit}
                title={editId ? 'Modify Operator' : 'Register Operator'} 
                subtitle={editId ? `Updating role for ${formData.username}` : 'Create a new system user profile'}
                loading={createMutation.isPending || updateMutation.isPending} 
            >
                <div className="space-y-6 p-1">
                    <Input label="Full Name" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} required />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="Username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
                        <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="user@store.com" required />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input 
                            label="Password" 
                            type="password" 
                            value={formData.password} 
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                            required={!editId} 
                            placeholder={editId ? 'Leave blank to keep current' : '••••••••'} 
                        />
                        <Input label="Phone Number" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1">Access Role</label>
                        <select 
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/20"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="ADMIN">Administrator</option>
                            <option value="MANAGER">Manager</option>
                            <option value="CASHIER">Cashier</option>
                        </select>
                    </div>
                </div>
            </FormDialog>

            <ConfirmDialog
                open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} onConfirm={() => {
                    if (!deleteId) return toast.error('Invalid user identifier');
                    deleteMutation.mutate(deleteId);
                }}
                title="Terminate User Account" 
                message="Are you sure you want to permanently delete this user account? This action will revoke all system access immediately." 
                loading={deleteMutation.isPending} severity="error"
            />

            <GenericDetailsDialog open={detailsOpen} onClose={() => setDetailsOpen(false)} data={selectedUser} title="User Details" />
        </AnimatedContainer>
    );
}
