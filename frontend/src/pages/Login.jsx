import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Lock, AlertCircle } from 'lucide-react';
import { login } from '../api/usersApi';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

export default function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data } = await login(formData);

            localStorage.setItem('loggedIn', 'true');
            localStorage.setItem('username', data.user.username);
            localStorage.setItem('fullName', data.user.fullName || data.user.username);
            localStorage.setItem('role', data.user.role);
            localStorage.setItem('token', data.token);

            if (data.user.role === 'CASHIER') {
                try {
                    const { getCashierPermissions } = await import('../api/permissionsApi');
                    const permRes = await getCashierPermissions();
                    localStorage.setItem('permissions', JSON.stringify(permRes.data?.permissions || {}));
                } catch (e) {
                    console.error("Failed to fetch permissions during login", e);
                }
            }

            toast.success('Welcome back to GrocerSmart AI!');
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid username or password');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-brand-primary to-brand-primary-dark dark:from-slate-950 dark:to-slate-900 overflow-hidden font-sans">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl pointer-events-none" />

            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, type: "spring", damping: 20 }}
                className="w-full max-w-md relative z-10"
            >
                <Card glass={true} className="shadow-2xl border-white/20">
                        <div className="text-center mb-10">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-primary to-emerald-700 flex items-center justify-center shadow-lg shadow-brand-primary/20 mx-auto mb-6 transform -rotate-6 hover:rotate-0 transition-transform duration-500">
                                <Lock className="text-white" size={40} />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none uppercase">
                                Welcome Back
                            </h2>
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-widest">
                                Sign in to GrocerSmart AI
                            </p>
                        </div>

                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-bold"
                            >
                                <AlertCircle size={18} />
                                {error}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <Input
                                label="Username"
                                placeholder="Enter your username"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                required
                                disabled={loading}
                            />

                            <div className="relative">
                                <Input
                                    label="Password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 bottom-2.5 text-slate-400 hover:text-brand-primary transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            <Button
                                type="submit"
                                className="w-full mt-4 h-12"
                                loading={loading}
                                variant="primary"
                            >
                                <LogIn className="mr-2" size={20} />
                                Sign In
                            </Button>
                        </form>
                </Card>

                <p className="mt-8 text-center text-xs font-bold text-white/60 dark:text-slate-500 uppercase tracking-widest">
                    © 2026 GrocerSmart AI • All rights reserved.
                </p>
            </motion.div>
        </div>
    );
}
