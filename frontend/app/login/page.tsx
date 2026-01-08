'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('http://localhost:3001/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('token', data.token);
                router.push('/dashboard');
            } else {
                setError(data.message || 'Giriş yapılamadı. Bilgilerinizi kontrol edin.');
            }
        } catch (err) {
            setError('Sunucu hatası. Lütfen daha sonra tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gray-900">
            {/* Background Image & Overlay */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/lms_login_background.png"
                    alt="Background"
                    fill
                    className="object-cover opacity-60"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-purple-900/80 to-black/80 backdrop-blur-sm" />
            </div>

            {/* Login Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-md p-6"
            >
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
                    <div className="p-8 sm:p-10">
                        {/* Header */}
                        <div className="text-center mb-10">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="inline-block p-4 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 mb-4 shadow-lg shadow-blue-500/30"
                            >
                                <LogIn className="w-8 h-8 text-white" />
                            </motion.div>
                            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Hoş Geldiniz</h1>
                            <p className="text-gray-300">LMS Platformuna giriş yapın</p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center gap-3 text-red-200 text-sm"
                            >
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p>{error}</p>
                            </motion.div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300 ml-1">E-posta Adresi</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-11 pr-4 py-4 bg-gray-900/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 transition-all outline-none"
                                        placeholder="ornek@email.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300 ml-1">Şifre</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-purple-400 transition-colors" />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-11 pr-4 py-4 bg-gray-900/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 transition-all outline-none"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Giriş Yapılıyor...</span>
                                    </>
                                ) : (
                                    'Giriş Yap'
                                )}
                            </button>
                        </form>

                        {/* Demo Accounts */}
                        <div className="mt-8 pt-6 border-t border-white/10 text-center">
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Demo Hesaplar</p>
                            <div className="grid grid-cols-1 gap-2 text-xs text-gray-300">
                                <div className="bg-white/5 py-2 px-3 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                                    onClick={() => { setEmail('ogrenci1@lms.com'); setPassword('123456'); }}
                                >
                                    <span className="font-semibold text-blue-400">Öğrenci:</span> ogrenci1@lms.com / 123456
                                </div>
                                <div className="bg-white/5 py-2 px-3 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                                    onClick={() => { setEmail('admin@lms.com'); setPassword('123456'); }}
                                >
                                    <span className="font-semibold text-purple-400">Admin:</span> admin@lms.com / 123456
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-gray-400 text-sm mt-8">
                    &copy; 2026 LMS Platform. Tüm hakları saklıdır.
                </p>
            </motion.div>
        </div>
    );
}
