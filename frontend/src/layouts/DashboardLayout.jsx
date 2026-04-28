import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ColorModeContext } from '../theme/ThemeProvider';
import { 
  Menu as MenuIcon, X, ChevronLeft, LayoutDashboard, Users, 
  Package, Repeat, CreditCard, Landmark,
  Truck, ShoppingCart, Sun, Moon, LogOut, 
  Bell, Settings, User, Trash2, LineChart, FileBarChart, ChevronRight
} from 'lucide-react';
import { useNavigate, useLocation, Outlet, Link } from 'react-router-dom';
import Dropdown, { DropdownItem } from '../components/ui/Dropdown';
import { canAccessMenuItem, normalizeRole } from '../utils/roleAccess';

const drawerWidth = 280;

export default function DashboardLayout() {
  const colorMode = useContext(ColorModeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [permissions, setPermissions] = useState(JSON.parse(localStorage.getItem('permissions') || '{}'));

  // Robust role fetching
  const role = normalizeRole(localStorage.getItem('role'));
  const username = localStorage.getItem('username') || 'User';
  const fullName = localStorage.getItem('fullName') || username;

  const menuItems = [
    { text: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { text: 'Users', icon: Users, path: '/users', roles: ['ADMIN'] },
    { text: 'Products', icon: Package, path: '/products', roles: ['ADMIN', 'MANAGER', 'CASHIER'], moduleKey: 'PRODUCTS' },
    { text: 'Convert Stock', icon: Repeat, path: '/inventory/convert', roles: ['ADMIN', 'MANAGER', 'CASHIER'], moduleKey: 'INVENTORY_CONVERT' },
    { text: 'Credit Customers', icon: CreditCard, path: '/credit-customers', roles: ['ADMIN', 'MANAGER', 'CASHIER'], moduleKey: 'CREDIT_CUSTOMERS' },
    { text: 'Cheques', icon: Landmark, path: '/cheques', roles: ['ADMIN', 'MANAGER', 'CASHIER'], moduleKey: 'CHEQUES' },
    { text: 'POS', icon: LineChart, path: '/pos', roles: ['ADMIN', 'MANAGER', 'CASHIER'], moduleKey: 'SALES' },
    { text: 'Reports', icon: FileBarChart, path: '/reports', roles: ['ADMIN', 'MANAGER', 'CASHIER'], moduleKey: 'REPORTS' },
    { text: 'Suppliers', icon: Truck, path: '/suppliers', roles: ['ADMIN', 'MANAGER', 'CASHIER'], moduleKey: 'SUPPLIERS' },
    { text: 'Purchase Orders', icon: ShoppingCart, path: '/purchase-orders', roles: ['ADMIN', 'MANAGER', 'CASHIER'], moduleKey: 'PURCHASE_ORDERS' },
    { text: 'Trash', icon: Trash2, path: '/trash', roles: ['ADMIN', 'CASHIER'], moduleKey: 'TRASH' },
    { text: 'Settings', icon: Settings, path: '/settings', roles: ['ADMIN'] },
  ];

  useEffect(() => {
    if (role !== 'CASHIER') return;
    const updatePermissions = async () => {
      try {
        const { getCashierPermissions } = await import('../api/permissionsApi');
        const { data } = await getCashierPermissions();
        const newPerms = data?.permissions || {};
        localStorage.setItem('permissions', JSON.stringify(newPerms));
        setPermissions(newPerms);
      } catch (error) {
        console.error("Auto-sync permissions failed", error);
      }
    };
    const interval = setInterval(updatePermissions, 10000);
    return () => clearInterval(interval);
  }, [role]);

  const filteredMenuItems = menuItems.filter((item) => canAccessMenuItem({ item, role, permissions }));

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        animate={{ 
          width: isSidebarOpen ? drawerWidth : 0,
          x: isMobile ? (isSidebarOpen ? 0 : -drawerWidth) : 0
        }}
        className={`
          fixed md:relative z-50 h-full flex flex-col
          bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
          shadow-xl md:shadow-none overflow-hidden
        `}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary to-brand-primary-dark flex items-center justify-center shadow-lg shadow-brand-primary/20">
              <span className="text-xl font-bold text-white">G</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-800 dark:text-slate-100 leading-none">GrocerSmart</span>
              <span className="text-[10px] font-bold text-brand-primary tracking-wider uppercase">Admin Portal</span>
            </div>
          </div>
          {isMobile && (
            <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <ChevronLeft size={20} className="text-slate-500" />
            </button>
          )}
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
          {filteredMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.text}
                to={item.path}
                onClick={() => isMobile && setIsSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group relative
                  ${isActive 
                    ? 'bg-brand-primary/10 text-brand-primary' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'}
                `}
              >
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-brand-primary rounded-r-full"
                  />
                )}
                <Icon size={20} className={isActive ? 'text-brand-primary' : 'text-slate-400 group-hover:text-brand-primary transition-colors'} />
                <span className="flex-1 text-sm">{item.text}</span>
                {isActive && <ChevronRight size={14} className="text-brand-primary opacity-50" />}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={20} />
            <span className="text-sm">Log Out</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500"
            >
              {isSidebarOpen ? <X size={20} /> : <MenuIcon size={20} />}
            </button>
            <h1 className="text-lg font-bold bg-gradient-to-r from-brand-primary-dark to-brand-primary bg-clip-text text-transparent hidden sm:block">
              GrocerSmart AI
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={colorMode.toggleColorMode}
              className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-300 text-slate-500 hover:rotate-12"
            >
              <div className="dark:hidden"><Moon size={20} /></div>
              <div className="hidden dark:block"><Sun size={20} /></div>
            </button>

            <button className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500 relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
            </button>

            <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-800 mx-2" />

            {/* Profile Dropdown */}
            <Dropdown
              trigger={
                <button className="flex items-center gap-3 p-1 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                  <div className="hidden md:flex md:flex-col md:items-end">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{fullName}</span>
                    <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">{role}</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center shadow-lg shadow-brand-primary/20 group-hover:scale-105 transition-transform overflow-hidden">
                    <span className="text-lg font-bold text-white uppercase">{fullName[0]}</span>
                  </div>
                </button>
              }
            >
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{fullName}</p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{role}</p>
              </div>
              <div className="py-2">
                <DropdownItem icon={User} onClick={() => navigate('/profile')}>My Profile</DropdownItem>
                {role === 'ADMIN' && <DropdownItem icon={Settings} onClick={() => navigate('/settings')}>Settings</DropdownItem>}
                <DropdownItem icon={LogOut} onClick={handleLogout} danger>Logout</DropdownItem>
              </div>
            </Dropdown>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
           <Outlet />
        </main>
      </div>
    </div>
  );
}
