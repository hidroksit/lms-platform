'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UserProfile {
    id: number;
    name: string;
    email: string;
    role: string;
}

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        // Decode JWT to get user info (simple decode, not verification)
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUser({
                id: payload.id,
                name: payload.name || 'Kullanıcı',
                email: payload.email || 'email@example.com',
                role: payload.role || 'student'
            });
        } catch (e) {
            console.error('Token decode error:', e);
        }
        setLoading(false);
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    if (loading) {
        return <div className="p-8">Yükleniyor...</div>;
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8">
                <div className="text-center mb-8">
                    <div className="w-24 h-24 bg-blue-500 rounded-full mx-auto flex items-center justify-center text-white text-4xl font-bold mb-4">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user?.name}</h1>
                    <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${user?.role === 'admin'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : user?.role === 'instructor'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                        {user?.role === 'admin' ? 'Admin' : user?.role === 'instructor' ? 'Eğitmen' : 'Öğrenci'}
                    </span>
                </div>

                <div className="border-t dark:border-gray-700 pt-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Hesap Bilgileri</h2>
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Kullanıcı ID:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{user?.id}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">E-posta:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{user?.email}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Rol:</span>
                            <span className="font-medium text-gray-900 dark:text-white capitalize">{user?.role}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-8 space-y-4">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
                    >
                        Panele Dön
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition"
                    >
                        Çıkış Yap
                    </button>
                </div>
            </div>
        </div>
    );
}
