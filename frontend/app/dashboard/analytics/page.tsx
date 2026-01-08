'use client';

import { useState, useEffect } from 'react';

interface AnalyticsData {
    totalStudents: number;
    activeCourses: number;
    completedExams: number;
    averageScore: number;
    courseCompletionRate: number;
    weeklyActivity: { day: string; logins: number; exams: number }[];
    topCourses: { title: string; students: number; completion: number }[];
    recentActivity: { action: string; user: string; time: string }[];
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('week');

    useEffect(() => {
        // Mock analytics data
        setData({
            totalStudents: 1250,
            activeCourses: 48,
            completedExams: 3420,
            averageScore: 78.5,
            courseCompletionRate: 72,
            weeklyActivity: [
                { day: 'Pzt', logins: 420, exams: 85 },
                { day: 'Sal', logins: 380, exams: 72 },
                { day: 'Çar', logins: 450, exams: 90 },
                { day: 'Per', logins: 520, exams: 110 },
                { day: 'Cum', logins: 480, exams: 95 },
                { day: 'Cmt', logins: 280, exams: 45 },
                { day: 'Paz', logins: 220, exams: 30 },
            ],
            topCourses: [
                { title: 'Web Programlama', students: 320, completion: 85 },
                { title: 'Veritabanı Sistemleri', students: 280, completion: 72 },
                { title: 'Algoritma Analizi', students: 245, completion: 68 },
                { title: 'Yapay Zeka', students: 210, completion: 55 },
            ],
            recentActivity: [
                { action: 'Sınav tamamlandı', user: 'Ahmet Y.', time: '5 dk önce' },
                { action: 'Derse kayıt', user: 'Mehmet K.', time: '12 dk önce' },
                { action: 'Video izlendi', user: 'Ayşe S.', time: '18 dk önce' },
                { action: 'Ödev yüklendi', user: 'Fatma D.', time: '25 dk önce' },
                { action: 'Quiz başlatıldı', user: 'Ali R.', time: '32 dk önce' },
            ]
        });
        setLoading(false);
    }, [dateRange]);

    if (loading || !data) {
        return <div className="p-8 text-center">Analitik verileri yükleniyor...</div>;
    }

    const maxLogins = Math.max(...data.weeklyActivity.map(d => d.logins));

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📊 Raporlama ve Analitik</h1>
                    <p className="text-gray-500 dark:text-gray-400">Platform performans metrikleri</p>
                </div>
                <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                    <option value="week">Son 7 Gün</option>
                    <option value="month">Son 30 Gün</option>
                    <option value="year">Son 1 Yıl</option>
                </select>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Toplam Öğrenci</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{data.totalStudents.toLocaleString()}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-2xl">
                            👥
                        </div>
                    </div>
                    <p className="text-sm text-green-600 mt-2">↑ 12% geçen haftaya göre</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Aktif Dersler</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{data.activeCourses}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-2xl">
                            📚
                        </div>
                    </div>
                    <p className="text-sm text-green-600 mt-2">↑ 5 yeni ders eklendi</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Tamamlanan Sınavlar</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{data.completedExams.toLocaleString()}</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-2xl">
                            📝
                        </div>
                    </div>
                    <p className="text-sm text-green-600 mt-2">↑ 8% geçen aya göre</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Ortalama Puan</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{data.averageScore}%</p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center text-2xl">
                            ⭐
                        </div>
                    </div>
                    <p className="text-sm text-green-600 mt-2">↑ 2.3% iyileşme</p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Activity Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Haftalık Aktivite</h3>
                    <div className="flex items-end justify-between h-48 space-x-2">
                        {data.weeklyActivity.map((day, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center">
                                <div
                                    className="w-full bg-blue-500 rounded-t"
                                    style={{ height: `${(day.logins / maxLogins) * 100}%` }}
                                />
                                <p className="text-xs text-gray-500 mt-2">{day.day}</p>
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{day.logins}</p>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center justify-center mt-4 space-x-4 text-sm">
                        <span className="flex items-center"><span className="w-3 h-3 bg-blue-500 rounded mr-1" /> Giriş Sayısı</span>
                    </div>
                </div>

                {/* Course Completion */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">En Popüler Dersler</h3>
                    <div className="space-y-4">
                        {data.topCourses.map((course, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-700 dark:text-gray-300">{course.title}</span>
                                    <span className="text-gray-500">{course.students} öğrenci</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                    <div
                                        className="bg-green-500 h-2 rounded-full"
                                        style={{ width: `${course.completion}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Son Aktiviteler</h3>
                <div className="space-y-3">
                    {data.recentActivity.map((activity, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                    {activity.action.includes('Sınav') ? '📝' :
                                        activity.action.includes('Video') ? '🎬' :
                                            activity.action.includes('Ödev') ? '📋' : '📚'}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.action}</p>
                                    <p className="text-xs text-gray-500">{activity.user}</p>
                                </div>
                            </div>
                            <span className="text-xs text-gray-400">{activity.time}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
