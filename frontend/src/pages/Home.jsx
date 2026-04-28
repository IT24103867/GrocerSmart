import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShoppingCart, ShieldCheck, Zap, Layers, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedContainer } from '../components';
import Button from '../components/ui/Button';

export default function Home() {
    const navigate = useNavigate();

    useEffect(() => {
        // Auto-redirect to dashboard if logged in
        const loggedIn = localStorage.getItem('loggedIn') === 'true';
        if (loggedIn) {
            navigate('/dashboard');
        }
    }, [navigate]);

    return (
        <AnimatedContainer delay={0.1}>
            <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 relative overflow-hidden font-sans">
                {/* Dynamic Background Elements */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-primary/5 rounded-full translate-x-1/3 -translate-y-1/3 blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full -translate-x-1/3 translate-y-1/3 blur-[100px] pointer-events-none" />
                
                <div className="max-w-4xl w-full relative z-10">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl p-10 sm:p-20 rounded-[4rem] border border-white dark:border-slate-800 shadow-2xl text-center relative overflow-hidden group"
                    >
                        {/* Decorative internal elements */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-primary via-emerald-500 to-indigo-500" />
                        
                        <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[10px] font-black uppercase tracking-[0.2em] mb-10 mx-auto">
                            <Zap size={14} className="animate-pulse" />
                            Next-Generation Retail Intelligence
                        </div>

                        <h1 className="text-5xl sm:text-7xl font-black text-slate-900 dark:text-slate-100 tracking-tighter mb-8 italic">
                            Grocer<span className="text-brand-primary">Smart</span> AI
                        </h1>

                        <p className="text-lg sm:text-xl font-medium text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed italic">
                            Autonomous operations, real-time inventory synchronization, and advanced financial telemetry for the modern merchant.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-16 px-4">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-brand-primary transition-colors mb-4 border border-slate-100 dark:border-slate-700">
                                    <Cpu size={20} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Core Engine</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors mb-4 border border-slate-100 dark:border-slate-700">
                                    <Layers size={20} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Distributed Sync</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors mb-4 border border-slate-100 dark:border-slate-700">
                                    <ShieldCheck size={20} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Secure Protocol</span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <Button
                                variant="primary"
                                size="lg"
                                className="w-full sm:w-auto h-16 px-12 text-lg font-black italic tracking-tight shadow-2xl shadow-brand-primary/20 group"
                                onClick={() => navigate('/login')}
                            >
                                <span className="mr-3">INITIALIZE SYSTEM</span>
                                <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                            </Button>
                            
                            <button 
                                className="text-sm font-black text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 uppercase tracking-[0.2em] transition-colors py-4 px-8 border-b-2 border-transparent hover:border-slate-900/10"
                                onClick={() => window.open('https://github.com', '_blank')}
                            >
                                Repository Access
                            </button>
                        </div>
                        
                        <div className="mt-16 pt-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all">
                            {/* Placeholders for partner logos or trust signals */}
                            <div className="flex items-center gap-2 font-black italic text-slate-400 text-sm">
                                <ShoppingCart size={18} /> SMART_POS
                            </div>
                            <div className="w-px h-4 bg-slate-300" />
                            <div className="flex items-center gap-2 font-black italic text-slate-400 text-sm">
                                <ShieldCheck size={18} /> SOCII_COMPLIANT
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </AnimatedContainer>
    );
}
