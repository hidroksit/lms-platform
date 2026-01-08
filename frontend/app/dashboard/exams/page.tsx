'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://lms-platform-8tmc.onrender.com';

interface Exam {
    id: number;
    title: string;
    description: string;
    duration: number;
    isProctored: boolean;
    startTime: string;
    endTime: string;
    Course?: {
        title: string;
        code: string;
    };
}

export default function ExamsPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        fetch(`${API_URL}/api/exams`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log('Exams data:', data);
                setExams(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching exams:', err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">📝 Sınavlarım</h1>
                <p className="text-gray-500 mt-2">Aktif sınavlarınızı görüntüleyin ve sınava girin</p>
            </div>

            {exams.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-xl font-semibold text-gray-700">Henüz sınav yok</h3>
                    <p className="text-gray-500 mt-2">Aktif sınavlarınız burada görünecek</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {exams.map((exam) => (
                        <div key={exam.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
                            <div className={`h-2 ${exam.isProctored ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">{exam.title}</h3>
                                    {exam.isProctored && (
                                        <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium">
                                            🎥 Kameralı
                                        </span>
                                    )}
                                </div>

                                <p className="text-gray-500 text-sm mb-4 line-clamp-2">{exam.description}</p>

                                {exam.Course && (
                                    <div className="text-xs text-gray-400 mb-3">
                                        📚 {exam.Course.code} - {exam.Course.title}
                                    </div>
                                )}

                                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                                    <span>⏱️ {exam.duration} dakika</span>
                                </div>

                                <Link
                                    href={`/dashboard/exams/${exam.id}`}
                                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-lg font-medium transition-colors"
                                >
                                    Sınava Gir →
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
