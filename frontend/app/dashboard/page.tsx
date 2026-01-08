'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CoursesPage from './courses';

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<{ firstName: string; lastName: string; role: string } | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (!token || !storedUser) {
            router.push('/');
            return;
        }

        setUser(JSON.parse(storedUser));
    }, [router]);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <span className="text-xl font-bold text-blue-600">LMS Platform</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-500">
                                {user.firstName} {user.lastName} <span className="text-xs bg-gray-200 px-2 py-1 rounded uppercase">{user.role}</span>
                            </span>
                            <button
                                onClick={() => {
                                    localStorage.clear();
                                    router.push('/');
                                }}
                                className="text-red-500 hover:text-red-700 text-sm font-medium"
                            >
                                Çıkış
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <CoursesPage />
                {(user?.role === 'admin' || user?.role === 'instructor') && (
                    <div className="mt-6 text-right px-4 flex gap-3 justify-end">
                        {user?.role === 'admin' && (
                            <button
                                type="button"
                                onClick={() => router.push('/dashboard/admin')}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                            >
                                📊 Admin Panel
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => router.push('/dashboard/create-course')}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-2"
                        >
                            Yeni Ders Oluştur
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push('/dashboard/create-exam')}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            Sınav Oluştur
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
