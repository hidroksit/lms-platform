'use client';

import { useRouter } from 'next/navigation';
import ThemeToggle from '../../components/ThemeToggle';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { TranslationProvider } from '../../components/TranslationProvider';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    const menuItems = [
        { label: 'Derslerim', path: '/dashboard' },
        { label: 'Soru Bankası', path: '/dashboard/question-bank' },
        { label: 'Not Defteri', path: '/dashboard/gradebook' },
        { label: 'Analitik', path: '/dashboard/analytics' },
        { label: 'Konferans', path: '/dashboard/conference' },
        { label: 'Profil', path: '/dashboard/profile' },
    ];

    return (
        <TranslationProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                {/* Header / Sidebar */}
                <nav className="bg-white dark:bg-gray-800 shadow p-4 flex justify-between items-center">
                    <div className="flex items-center space-x-6">
                        <h1 className="text-xl font-bold text-gray-800 dark:text-white">LMS Öğrenci Paneli</h1>
                        <div className="hidden md:flex space-x-4">
                            {menuItems.map(item => (
                                <button
                                    key={item.path}
                                    onClick={() => router.push(item.path)}
                                    className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <LanguageSwitcher />
                        <ThemeToggle />
                        <button
                            onClick={() => {
                                localStorage.removeItem('token');
                                router.push('/login');
                            }}
                            className="text-red-500 hover:text-red-700 font-medium"
                        >
                            Çıkış
                        </button>
                    </div>
                </nav>

                <main className="p-4 sm:p-6 lg:p-8 text-gray-900 dark:text-gray-100">
                    {children}
                </main>
            </div>
        </TranslationProvider>
    );
}
