'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Fallback mock exams when API is not available
const MOCK_EXAMS = [
    { id: 1, title: 'Matematik Ara Sınav', description: 'Temel matematik işlemleri ve denklemler', duration: 60, isProctored: false, Course: { code: 'MAT101', title: 'Matematik 101' } },
    { id: 2, title: 'Matematik Final Sınavı', description: 'Tüm konuları kapsayan final sınavı', duration: 90, isProctored: true, Course: { code: 'MAT101', title: 'Matematik 101' } },
    { id: 3, title: 'Fizik Quiz 1', description: 'Hareket ve hız konuları', duration: 30, isProctored: false, Course: { code: 'FIZ101', title: 'Fizik 101' } },
    { id: 4, title: 'Fizik Ara Sınav', description: 'Newton kanunları ve enerji', duration: 60, isProctored: false, Course: { code: 'FIZ101', title: 'Fizik 101' } },
    { id: 5, title: 'Programlama Quiz', description: 'Değişkenler ve veri tipleri', duration: 30, isProctored: false, Course: { code: 'PRG101', title: 'Programlama 101' } },
    { id: 6, title: 'Programlama Ara Sınav', description: 'Algoritmalar ve döngüler', duration: 60, isProctored: true, Course: { code: 'PRG101', title: 'Programlama 101' } },
    { id: 7, title: 'Web Geliştirme Ara Sınav', description: 'HTML, CSS ve JavaScript temelleri', duration: 45, isProctored: false, Course: { code: 'WEB201', title: 'Web Geliştirme' } },
];

interface Exam {
    id: number;
    title: string;
    description: string;
    duration: number;
    isProctored: boolean;
    startTime?: string;
    endTime?: string;
    Course?: {
        title: string;
        code: string;
    };
}

export default function ExamsPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [usingMockData, setUsingMockData] = useState(false);

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const token = localStorage.getItem('token');

                if (!token) {
                    console.log('No token found, using mock data');
                    setExams(MOCK_EXAMS);
                    setUsingMockData(true);
                    setLoading(false);
                    return;
                }

                const response = await fetch(`${API_URL}/api/exams`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`API Error: ${response.status}`);
                }

                const data = await response.json();
                console.log('Exams data:', data);

                if (Array.isArray(data) && data.length > 0) {
                    setExams(data);
                } else {
                    console.log('No exams from API, using mock data');
                    setExams(MOCK_EXAMS);
                    setUsingMockData(true);
                }
            } catch (err) {
                console.error('Error fetching exams:', err);
                setExams(MOCK_EXAMS);
                setUsingMockData(true);
            } finally {
                setLoading(false);
            }
        };

        fetchExams();
    }, []);

    const downloadSEBConfig = async (examId: number) => {
        try {
            const response = await fetch(`${API_URL}/api/exams/${examId}/seb-config`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `exam_${examId}.seb`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            alert('SEB config dosyası indirildi! Dosyayı açarak SEB uygulamasından sınava girin.');
        } catch (err) {
            console.error('Error downloading SEB config:', err);
            alert('SEB config dosyası indirilemedi. Lütfen SEB uygulamasının yüklü olduğundan emin olun.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Sınavlar yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📝 Sınavlarım</h1>
                <p className="text-gray-500 mt-2">Aktif sınavlarınızı görüntüleyin ve sınava girin</p>
                {usingMockData && (
                    <div className="mt-2 text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 rounded inline-block">
                        ⚠️ Demo modu - örnek sınavlar gösteriliyor
                    </div>
                )}
            </div>

            {/* SEB Info Banner */}
            <div className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 p-4 mb-6">
                <p className="text-purple-900 dark:text-purple-200 text-sm">
                    ℹ️ <strong>Kameralı Sınavlar:</strong> Desktop uygulamasından kameralı sınavlara doğrudan giriş yapabilirsiniz.
                    Sınav sırasında kameranız otomatik olarak açılacaktır.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {exams.map((exam) => (
                    <div key={exam.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
                        <div className={`h-2 ${exam.isProctored ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{exam.title}</h3>
                                {exam.isProctored && (
                                    <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs px-2 py-1 rounded-full font-medium">
                                        🎥 Kameralı
                                    </span>
                                )}
                            </div>

                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2">{exam.description}</p>

                            {exam.Course && (
                                <div className="text-xs text-gray-400 mb-3">
                                    📚 {exam.Course.code} - {exam.Course.title}
                                </div>
                            )}

                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                                <span>⏱️ {exam.duration} dakika</span>
                            </div>

                            {/* Buttons */}
                            <div className="space-y-2">
                                {/* Direct Entry Button */}
                                <Link
                                    href={exam.isProctored ? `/dashboard/exams/${exam.id}/proctored` : `/dashboard/exams/${exam.id}`}
                                    className={`block w-full ${exam.isProctored ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white text-center py-3 rounded-lg font-medium transition-colors`}
                                >
                                    {exam.isProctored ? '📷 Kameralı Sınava Gir' : 'Sınava Gir'} →
                                </Link>

                                {/* SEB Direct Entry Button - Opens proctored exam directly */}
                                {exam.isProctored && (
                                    <Link
                                        href={`/dashboard/exams/${exam.id}/proctored`}
                                        className="block w-full bg-purple-600 hover:bg-purple-700 text-white text-center py-3 rounded-lg font-medium transition-colors"
                                    >
                                        🔒 SEB'den Gir (Kiosk Mode)
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
