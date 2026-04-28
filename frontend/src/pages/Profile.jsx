import { 
    User, Lock, Shield, Settings as SettingsIcon, LogOut, 
    Camera, CheckCircle2, Phone, Badge as BadgeIcon, 
    AtSign, Eye, EyeOff, Save, Key, Palette, Sun, Moon, 
    ChevronRight, ExternalLink, ShieldCheck, Activity, Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { DashboardCard, AnimatedContainer, PageHeader } from '../components';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import { useColorMode } from '../theme/ThemeProvider';

const TabButton = ({ active, onClick, icon: Icon, label }) => (
    <button
        onClick={onClick}
        className={`
            flex items-center gap-3 py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all
            ${active 
                ? 'bg-brand-primary text-white shadow-xl shadow-brand-primary/10' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}
        `}
    >
        <Icon size={16} />
        {label}
    </button>
);

const PasswordStrength = ({ password }) => {
    const getStrength = () => {
        if (!password) return 0;
        let s = 0;
        if (password.length >= 8) s += 25;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) s += 25;
        if (/\d/.test(password)) s += 25;
        if (/[^a-zA-Z\d]/.test(password)) s += 25;
        return s;
    };
    const s = getStrength();
    return (
        <div className="mt-3 space-y-1.5 px-1">
            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                <span>Entropy Rating</span>
                <span className={s > 75 ? 'text-emerald-500' : s > 50 ? 'text-blue-500' : 'text-amber-500'}>
                    {s > 75 ? 'ULTRA SECURE' : s > 50 ? 'STABLE' : 'FRAGILE'}
                </span>
            </div>
            <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${s}%` }}
                    className={`h-full ${s > 75 ? 'bg-emerald-500' : s > 50 ? 'bg-blue-500' : 'bg-amber-500'} transition-all`}
                />
            </div>
        </div>
    );
};

export default function Profile() {
    const navigate = useNavigate();
    const { mode, toggleColorMode } = useColorMode();
    const darkMode = mode === 'dark';
    const [loading, setLoading] = useState(false);
    const [tabValue, setTabValue] = useState(0);
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [formData, setFormData] = useState({
        fullName: localStorage.getItem('fullName') || '',
        username: localStorage.getItem('username') || '',
        phone: localStorage.getItem('phone') || '',
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
        createdAt: '',
        updatedAt: ''
    });

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const { data } = await api.get('/users/profile');
                if (data) {
                    setFormData(prev => ({
                        ...prev,
                        fullName: data.fullName,
                        username: data.username,
                        phone: data.phone || '',
                        createdAt: data.createdAt,
                        updatedAt: data.updatedAt
                    }));
                    localStorage.setItem('fullName', data.fullName);
                    localStorage.setItem('phone', data.phone || '');
                }
            } catch (err) {}
        };
        fetchUserData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            toast.error("Security mismatch: Passwords do not align");
            return;
        }
        if (formData.newPassword && !formData.oldPassword) {
            toast.error("Auth required: Current key needed for update");
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.put('/users/profile', {
                fullName: formData.fullName,
                username: formData.username,
                phone: formData.phone,
                oldPassword: formData.oldPassword,
                newPassword: formData.newPassword
            });
            localStorage.setItem('username', data.username);
            localStorage.setItem('fullName', data.fullName);
            localStorage.setItem('phone', data.phone || '');
            setFormData(prev => ({ ...prev, oldPassword: '', newPassword: '', confirmPassword: '' }));
            toast.success("Identity synchronized successfully");
        } catch (err) {} 
        finally { setLoading(false); }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
        toast.info('Session decommissioned');
    };

    return (
        <AnimatedContainer delay={0.1}>
            <PageHeader 
                title="Identity Hub" 
                subtitle="Personnel records and authentication management"
                icon={<User size={24} className="text-white" />}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-10">
                {/* Left: Summary Panel */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl relative overflow-hidden text-center group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-primary/40 to-transparent"></div>
                        
                        <div className="relative inline-block mb-8">
                            <div className="w-32 h-32 rounded-[2.5rem] bg-brand-primary flex items-center justify-center text-white text-5xl font-black italic shadow-2xl shadow-brand-primary/30 ring-8 ring-slate-50 dark:ring-slate-950 transition-transform group-hover:scale-105 group-hover:rotate-3 duration-500">
                                {formData.fullName ? formData.fullName[0]?.toUpperCase() : '?'}
                            </div>
                            <button className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-slate-900 dark:bg-brand-primary text-white flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all">
                                <Camera size={18} />
                            </button>
                        </div>

                        <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 italic uppercase tracking-tighter leading-none mb-1">{formData.fullName}</h3>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6 italic">@{formData.username}</p>

                        <Badge variant="brand" className="px-6 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] mb-10">
                            {localStorage.getItem('role') || 'CASHIER NODE'}
                        </Badge>
                        
                        <div className="space-y-6 pt-8 border-t border-slate-50 dark:border-slate-800 text-left">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <ShieldCheck size={14} className="text-brand-primary" />
                                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Auth Status</span>
                                </div>
                                <span className="text-[10px] font-black text-emerald-500 uppercase italic">Active Node</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Activity size={14} className="text-slate-300" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enrolled</span>
                                </div>
                                <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 italic">
                                    {formData.createdAt ? format(new Date(formData.createdAt), 'MMM yyyy') : '—'}
                                </span>
                            </div>
                        </div>

                        <Button 
                            variant="ghost" 
                            className="w-full mt-10 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/5 group/logout"
                            onClick={handleLogout}
                        >
                            <LogOut size={16} className="mr-2 group-hover/logout:-translate-x-1 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Terminate Session</span>
                        </Button>
                    </div>
                </div>

                {/* Right: Content Panel */}
                <div className="lg:col-span-8">
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden min-h-[600px] flex flex-col">
                        <div className="flex items-center border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                            <TabButton active={tabValue === 0} onClick={() => setTabValue(0)} icon={User} label="Identity Profile" />
                            <TabButton active={tabValue === 1} onClick={() => setTabValue(1)} icon={Key} label="Auth Protocol" />
                            <TabButton active={tabValue === 2} onClick={() => setTabValue(2)} icon={Palette} label="User Interface" />
                        </div>

                        <div className="p-10 flex-1">
                            <AnimatePresence mode="wait">
                                {tabValue === 0 && (
                                    <motion.form 
                                        key="personal"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        onSubmit={handleSubmit}
                                        className="space-y-8"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <Input 
                                                label="Personnel Name" 
                                                name="fullName" 
                                                value={formData.fullName} 
                                                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                                icon={<BadgeIcon size={16} />}
                                                required
                                            />
                                            <Input 
                                                label="Logon Identifier" 
                                                name="username" 
                                                value={formData.username} 
                                                onChange={(e) => setFormData({...formData, username: e.target.value})}
                                                icon={<AtSign size={16} />}
                                                required
                                            />
                                            <div className="md:col-span-2">
                                                <Input 
                                                    label="Contact Line" 
                                                    name="phone" 
                                                    value={formData.phone} 
                                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                                    icon={<Phone size={16} />}
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="pt-8 border-t border-slate-50 dark:border-slate-800 flex justify-end">
                                            <Button variant="primary" size="md" className="px-10" loading={loading}>
                                                <Save size={18} className="mr-2" />
                                                Synchronize Records
                                            </Button>
                                        </div>
                                    </motion.form>
                                )}

                                {tabValue === 1 && (
                                    <motion.form 
                                        key="security"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        onSubmit={handleSubmit}
                                        className="space-y-8"
                                    >
                                        <div className="p-8 rounded-[2.5rem] bg-indigo-50/30 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 flex items-start gap-4">
                                            <Shield className="text-indigo-400 shrink-0 mt-1" size={24} />
                                            <div>
                                                <h4 className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tight italic">Security Protocol</h4>
                                                <p className="text-[10px] font-black text-indigo-400/60 uppercase tracking-widest mt-1">Updates to the authentication cipher require a full session handshake.</p>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="relative">
                                                <Input 
                                                    type={showOldPassword ? 'text' : 'password'}
                                                    label="Current Authentication Key" 
                                                    name="oldPassword"
                                                    value={formData.oldPassword} 
                                                    onChange={(e) => setFormData({...formData, oldPassword: e.target.value})}
                                                    icon={<ShieldCheck size={16} />}
                                                    placeholder="Validate existing identity"
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={() => setShowOldPassword(!showOldPassword)}
                                                    className="absolute right-4 bottom-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                                >
                                                    {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="relative">
                                                    <Input 
                                                        type={showNewPassword ? 'text' : 'password'}
                                                        label="Evolution Key (New)" 
                                                        name="newPassword"
                                                        value={formData.newPassword} 
                                                        onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                                                        icon={<Key size={16} />}
                                                    />
                                                    <button 
                                                        type="button"
                                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                                        className="absolute right-4 bottom-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                                    >
                                                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </button>
                                                    <PasswordStrength password={formData.newPassword} />
                                                </div>
                                                <Input 
                                                    type="password"
                                                    label="Validate Alignment" 
                                                    name="confirmPassword"
                                                    value={formData.confirmPassword} 
                                                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                                    error={formData.confirmPassword && formData.newPassword !== formData.confirmPassword ? "CYPHER MISMATCH" : ""}
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-8 border-t border-slate-50 dark:border-slate-800 flex justify-end">
                                            <Button variant="primary" size="md" className="px-10" loading={loading}>
                                                <ShieldCheck size={18} className="mr-2" />
                                                Update Auth Layer
                                            </Button>
                                        </div>
                                    </motion.form>
                                )}

                                {tabValue === 2 && (
                                    <motion.div 
                                        key="ui"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-10"
                                    >
                                        <div>
                                            <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-6 flex items-center gap-2">
                                                <Terminal size={14} className="text-brand-primary" /> Visual Core Aesthetics
                                            </h4>
                                            
                                            <button 
                                                onClick={toggleColorMode}
                                                className={`
                                                    w-full p-8 rounded-[2.5rem] border-2 flex items-center justify-between group transition-all
                                                    ${darkMode 
                                                        ? 'bg-slate-950 border-slate-800 hover:border-brand-primary' 
                                                        : 'bg-slate-50 border-transparent hover:border-brand-primary/20 shadow-xl shadow-slate-200/50'}
                                                `}
                                            >
                                                <div className="flex items-center gap-6">
                                                    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-transform group-hover:scale-110 ${darkMode ? 'bg-slate-900 text-brand-primary' : 'bg-white text-brand-primary shadow-lg'}`}>
                                                        {darkMode ? <Moon size={28} /> : <Sun size={28} />}
                                                    </div>
                                                    <div className="text-left">
                                                        <h5 className={`text-lg font-black italic uppercase ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                                            {darkMode ? 'Midnight Protocol' : 'Luminous Engine'}
                                                        </h5>
                                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Toggle global visual synchronization</p>
                                                    </div>
                                                </div>
                                                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${darkMode ? 'bg-brand-primary' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${darkMode ? 'translate-x-[1.5rem]' : 'translate-x-0'}`}></div>
                                                </div>
                                            </button>
                                        </div>

                                        <div className="p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-3 mb-6">
                                                <Activity size={16} className="text-brand-primary" />
                                                <h5 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Deployment Specifications</h5>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                                {[
                                                    { label: 'Latency', value: '14ms', color: 'emerald' },
                                                    { label: 'Uptime', value: '99.9%', color: 'blue' },
                                                    { label: 'Engine', value: 'GS-AIv2', color: 'amber' },
                                                    { label: 'Security', value: 'TLS 1.3', color: 'indigo' }
                                                ].map((stat, i) => (
                                                    <div key={i} className="text-center p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-50 dark:border-slate-800/50">
                                                        <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">{stat.label}</span>
                                                        <span className={`text-xs font-black text-${stat.color}-500 italic`}>{stat.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </AnimatedContainer>
    );
}
