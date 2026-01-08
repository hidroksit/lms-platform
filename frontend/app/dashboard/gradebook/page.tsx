'use client';

import { useEffect, useState } from 'react';

interface Grade {
    id: number;
    examTitle: string;
    courseTitle: string;
    score: number;
    maxScore: number;
    date: string;
    status: 'passed' | 'failed' | 'pending';
}

export default function GradebookPage() {
    const [grades, setGrades] = useState<Grade[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all');

    useEffect(() => {
        // Fetch grades from API
        const fetchGrades = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('http://localhost:3001/api/grades', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setGrades(data);
                } else {
                    // Use mock data if API not available
                    setGrades([
                        { id: 1, examTitle: 'Final Sınavı', courseTitle: 'Web Programlama', score: 85, maxScore: 100, date: '2026-01-05', status: 'passed' },
                        { id: 2, examTitle: 'Vize Sınavı', courseTitle: 'Veritabanı Sistemleri', score: 72, maxScore: 100, date: '2026-01-03', status: 'passed' },
                        { id: 3, examTitle: 'Quiz 1', courseTitle: 'Algoritma Analizi', score: 45, maxScore: 100, date: '2026-01-01', status: 'failed' },
                        { id: 4, examTitle: 'Ödev 1', courseTitle: 'Web Programlama', score: 90, maxScore: 100, date: '2025-12-28', status: 'passed' },
                    ]);
                }
            } catch (error) {
                // Mock data on error
                setGrades([
                    { id: 1, examTitle: 'Final Sınavı', courseTitle: 'Web Programlama', score: 85, maxScore: 100, date: '2026-01-05', status: 'passed' },
                    { id: 2, examTitle: 'Vize Sınavı', courseTitle: 'Veritabanı Sistemleri', score: 72, maxScore: 100, date: '2026-01-03', status: 'passed' },
                    { id: 3, examTitle: 'Quiz 1', courseTitle: 'Algoritma Analizi', score: 45, maxScore: 100, date: '2026-01-01', status: 'failed' },
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchGrades();
    }, []);

    const filteredGrades = grades.filter(g =>
        filter === 'all' || g.status === filter
    );

    const averageScore = grades.length > 0
        ? Math.round(grades.reduce((sum, g) => sum + (g.score / g.maxScore * 100), 0) / grades.length)
        : 0;

    const passedCount = grades.filter(g => g.status === 'passed').length;
    const failedCount = grades.filter(g => g.status === 'failed').length;

    if (loading) {
        return <div className="p-8 text-center">Notlar yükleniyor...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📊 Not Defteri</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Tüm sınav ve değerlendirme sonuçlarınız</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <div className="text-3xl font-bold text-blue-600">{averageScore}%</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Genel Ortalama</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{grades.length}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Toplam Değerlendirme</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <div className="text-3xl font-bold text-green-600">{passedCount}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Geçilen</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <div className="text-3xl font-bold text-red-600">{failedCount}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Kalınan</div>
                </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex space-x-2 mb-4">
                {(['all', 'passed', 'failed'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${filter === f
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                    >
                        {f === 'all' ? 'Tümü' : f === 'passed' ? 'Geçilen' : 'Kalınan'}
                    </button>
                ))}
            </div>

            {/* Grades Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sınav</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ders</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Puan</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tarih</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Durum</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredGrades.map((grade) => (
                            <tr key={grade.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                    {grade.examTitle}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {grade.courseTitle}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <div className="flex items-center">
                                        <span className="font-bold text-gray-900 dark:text-white">{grade.score}</span>
                                        <span className="text-gray-400 ml-1">/ {grade.maxScore}</span>
                                        <div className="ml-3 w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${grade.status === 'passed' ? 'bg-green-500' : 'bg-red-500'
                                                    }`}
                                                style={{ width: `${(grade.score / grade.maxScore) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {new Date(grade.date).toLocaleDateString('tr-TR')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${grade.status === 'passed'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                            : grade.status === 'failed'
                                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                        }`}>
                                        {grade.status === 'passed' ? 'Geçti' : grade.status === 'failed' ? 'Kaldı' : 'Beklemede'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredGrades.length === 0 && (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        Bu kategoride not bulunmuyor.
                    </div>
                )}
            </div>
        </div>
    );
}
