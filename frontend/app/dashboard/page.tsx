'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CoursesPage from './courses';
/*
Pride and Prejudice - Chapter X (excerpt)

Bennet began repeating her thanks to Mr. Bingley for his kindness to
Jane, with an apology for troubling him also with Lizzy. Mr. Bingley was
unaffectedly civil in his answer, and forced his younger sister to be
civil also, and say what the occasion required. She performed her part,
indeed, without much graciousness, but Mrs. Bennet was satisfied, and
soon afterwards ordered her carriage. Upon this signal, the youngest of
her daughters put herself forward. The two girls had been whispering to
each other during the whole visit; and the result of it was, that the
youngest should tax Mr. Bingley with having promised on his first coming
into the country to give a ball at Netherfield.

Lydia was a stout, well-grown girl of fifteen, with a fine complexion
and good-humoured countenance; a favourite with her mother, whose
affection had brought her into public at an early age. She had high
animal spirits, and a sort of natural self-consequence, which the
attentions of the officers, to whom her uncle's good dinners and her
own easy manners recommended her, had increased into assurance.

The day passed much as the day before had done. Mrs. Hurst and Miss
Bingley had spent some hours of the morning with the invalid, who
continued, though slowly, to mend; and, in the evening, Elizabeth joined
their party in the drawing-room.
*/

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
