'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://lms-platform-8tmc.onrender.com';

// Mock questions for each exam
const MOCK_QUESTIONS: Record<string, any[]> = {
    '1': [ // Matematik Ara Sınav
        { id: 1, text: '5 + 7 = ?', optionA: '10', optionB: '11', optionC: '12', optionD: '13', correctOption: 'C', points: 10 },
        { id: 2, text: '15 - 8 = ?', optionA: '5', optionB: '6', optionC: '7', optionD: '8', correctOption: 'C', points: 10 },
        { id: 3, text: '6 × 7 = ?', optionA: '40', optionB: '42', optionC: '44', optionD: '48', correctOption: 'B', points: 10 },
        { id: 4, text: '81 ÷ 9 = ?', optionA: '7', optionB: '8', optionC: '9', optionD: '10', correctOption: 'C', points: 10 },
        { id: 5, text: 'x + 5 = 12 ise x = ?', optionA: '5', optionB: '6', optionC: '7', optionD: '8', correctOption: 'C', points: 10 },
    ],
    '2': [ // Matematik Final
        { id: 6, text: 'lim(x→0) sin(x)/x = ?', optionA: '0', optionB: '1', optionC: '∞', optionD: 'Tanımsız', correctOption: 'B', points: 15 },
        { id: 7, text: 'd/dx(x²) = ?', optionA: 'x', optionB: '2x', optionC: 'x²', optionD: '2', correctOption: 'B', points: 15 },
        { id: 8, text: '∫x dx = ?', optionA: 'x', optionB: 'x²', optionC: 'x²/2 + C', optionD: '2x', correctOption: 'C', points: 15 },
    ],
    '3': [ // Fizik Quiz 1
        { id: 9, text: 'Hız birimi nedir?', optionA: 'm', optionB: 'm/s', optionC: 'm/s²', optionD: 'kg', correctOption: 'B', points: 20 },
        { id: 10, text: 'İvme birimi nedir?', optionA: 'm', optionB: 'm/s', optionC: 'm/s²', optionD: 'N', correctOption: 'C', points: 20 },
        { id: 11, text: 'Serbest düşmede g yaklaşık kaçtır?', optionA: '5 m/s²', optionB: '10 m/s²', optionC: '15 m/s²', optionD: '20 m/s²', correctOption: 'B', points: 20 },
    ],
    '4': [ // Fizik Ara Sınav
        { id: 12, text: 'F = m × a formülü hangi kanunu ifade eder?', optionA: 'Newton 1', optionB: 'Newton 2', optionC: 'Newton 3', optionD: 'Kepler', correctOption: 'B', points: 10 },
        { id: 13, text: 'Kuvvet birimi nedir?', optionA: 'Joule', optionB: 'Watt', optionC: 'Newton', optionD: 'Pascal', correctOption: 'C', points: 10 },
        { id: 14, text: 'Kinetik enerji formülü nedir?', optionA: 'mgh', optionB: '½mv²', optionC: 'Fd', optionD: 'Pt', correctOption: 'B', points: 10 },
    ],
    '5': [ // Programlama Quiz
        { id: 15, text: 'JavaScript\'te değişken tanımlamak için hangisi kullanılmaz?', optionA: 'var', optionB: 'let', optionC: 'const', optionD: 'int', correctOption: 'D', points: 20 },
        { id: 16, text: 'Python\'da yorum satırı nasıl başlar?', optionA: '//', optionB: '#', optionC: '/*', optionD: '--', correctOption: 'B', points: 20 },
        { id: 17, text: 'Array index nereden başlar?', optionA: '-1', optionB: '0', optionC: '1', optionD: '2', correctOption: 'B', points: 20 },
    ],
    '6': [ // Programlama Ara Sınav
        { id: 18, text: 'for döngüsü hangi durumda kullanılır?', optionA: 'Koşul doğru olduğu sürece', optionB: 'Belirli sayıda tekrar', optionC: 'Sadece bir kez', optionD: 'Hiçbir zaman', correctOption: 'B', points: 10 },
        { id: 19, text: 'Stack veri yapısı hangi prensiple çalışır?', optionA: 'FIFO', optionB: 'LIFO', optionC: 'Random', optionD: 'Priority', correctOption: 'B', points: 10 },
        { id: 20, text: 'Binary Search zaman karmaşıklığı?', optionA: 'O(1)', optionB: 'O(n)', optionC: 'O(log n)', optionD: 'O(n²)', correctOption: 'C', points: 10 },
    ],
    '7': [ // Web Geliştirme
        { id: 21, text: 'HTML ne anlama gelir?', optionA: 'Hyper Text Markup Language', optionB: 'High Tech Modern Language', optionC: 'Hyper Transfer Markup Language', optionD: 'Home Tool Markup Language', correctOption: 'A', points: 10 },
        { id: 22, text: 'CSS ne için kullanılır?', optionA: 'Veritabanı', optionB: 'Stil ve tasarım', optionC: 'Sunucu programlama', optionD: 'Güvenlik', correctOption: 'B', points: 10 },
        { id: 23, text: 'React nedir?', optionA: 'CSS framework', optionB: 'Database', optionC: 'JavaScript library', optionD: 'Programming language', correctOption: 'C', points: 10 },
        { id: 24, text: 'HTTP status code 404 ne anlama gelir?', optionA: 'Başarılı', optionB: 'Sunucu hatası', optionC: 'Sayfa bulunamadı', optionD: 'Yetki hatası', correctOption: 'C', points: 10 },
    ],
};

const MOCK_EXAMS: Record<string, any> = {
    '1': { id: 1, title: 'Matematik Ara Sınav', description: 'Temel matematik işlemleri', duration: 60, isProctored: false },
    '2': { id: 2, title: 'Matematik Final Sınavı', description: 'Final sınavı', duration: 90, isProctored: true },
    '3': { id: 3, title: 'Fizik Quiz 1', description: 'Hareket ve hız', duration: 30, isProctored: false },
    '4': { id: 4, title: 'Fizik Ara Sınav', description: 'Newton kanunları', duration: 60, isProctored: false },
    '5': { id: 5, title: 'Programlama Quiz', description: 'Değişkenler ve veri tipleri', duration: 30, isProctored: false },
    '6': { id: 6, title: 'Programlama Ara Sınav', description: 'Algoritmalar', duration: 60, isProctored: true },
    '7': { id: 7, title: 'Web Geliştirme Ara Sınav', description: 'HTML, CSS, JavaScript', duration: 45, isProctored: false },
};

export default function TakeExamPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [exam, setExam] = useState<any>(null);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [usingMockData, setUsingMockData] = useState(false);

    useEffect(() => {
        const fetchExam = async () => {
            try {
                const token = localStorage.getItem('token');

                if (!token) {
                    // Use mock data
                    const mockExam = MOCK_EXAMS[params.id];
                    if (mockExam) {
                        setExam({ ...mockExam, Questions: MOCK_QUESTIONS[params.id] || [] });
                        setUsingMockData(true);
                    }
                    setLoading(false);
                    return;
                }

                const response = await fetch(`${API_URL}/api/exams/${params.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) {
                    throw new Error(`API Error: ${response.status}`);
                }

                const data = await response.json();
                console.log('Exam data:', data);

                if (data && (data.Questions?.length > 0 || data.questions?.length > 0)) {
                    setExam(data);
                    if (data.isProctored) {
                        router.push(`/dashboard/exams/${params.id}/proctored`);
                    }
                } else {
                    // Use mock data
                    const mockExam = MOCK_EXAMS[params.id];
                    if (mockExam) {
                        setExam({ ...mockExam, Questions: MOCK_QUESTIONS[params.id] || [] });
                        setUsingMockData(true);
                    }
                }
            } catch (err) {
                console.error('Error fetching exam:', err);
                // Use mock data
                const mockExam = MOCK_EXAMS[params.id];
                if (mockExam) {
                    setExam({ ...mockExam, Questions: MOCK_QUESTIONS[params.id] || [] });
                    setUsingMockData(true);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchExam();
    }, [params.id, router]);

    const handleOptionSelect = (questionId: number, option: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: option }));
    };

    const handleSubmit = async () => {
        const questions = exam?.Questions || exam?.questions || [];
        let earnedPoints = 0;
        let totalPoints = 0;

        questions.forEach((q: any) => {
            totalPoints += q.points || 10;
            if (answers[q.id] === q.correctOption) {
                earnedPoints += q.points || 10;
            }
        });

        const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
        setResult({ score, earnedPoints, totalPoints });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Sınav Yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (!exam) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sınav Bulunamadı</h2>
                    <button onClick={() => router.push('/dashboard/exams')} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                        Sınavlara Dön
                    </button>
                </div>
            </div>
        );
    }

    if (result) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow text-center max-w-md w-full">
                    <div className="text-6xl mb-4">🎉</div>
                    <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Sınav Tamamlandı!</h2>
                    <div className="text-6xl font-extrabold text-blue-600 mb-2">{result.score}</div>
                    <p className="text-gray-500 mb-6">Puan (100 üzerinden)</p>
                    <p className="text-sm text-gray-400 mb-6">Doğru: {result.earnedPoints}/{result.totalPoints} puan</p>
                    <button onClick={() => router.push('/dashboard/exams')} className="bg-gray-800 text-white px-6 py-2 rounded hover:bg-gray-900 w-full">
                        Sınavlara Dön
                    </button>
                </div>
            </div>
        );
    }

    const questions = exam.Questions || exam.questions || [];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{exam.title}</h1>
                            <p className="text-sm text-gray-500 mt-1">{exam.description}</p>
                            {usingMockData && (
                                <span className="mt-2 inline-block text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded">
                                    Demo modu
                                </span>
                            )}
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-500">Süre</div>
                            <div className="text-xl font-bold text-blue-600">{exam.duration} dk</div>
                        </div>
                    </div>
                </div>

                <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                    Toplam {questions.length} soru • Cevaplanmış: {Object.keys(answers).length}/{questions.length}
                </div>

                <div className="space-y-6">
                    {questions.map((q: any, index: number) => (
                        <div key={q.id} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 rounded-full mr-3 text-sm font-bold">
                                    {index + 1}
                                </span>
                                {q.text}
                            </h3>
                            <div className="space-y-2 ml-11">
                                {['A', 'B', 'C', 'D'].map((opt) => (
                                    <label
                                        key={opt}
                                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${answers[q.id] === opt
                                                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 ring-2 ring-blue-500'
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name={`question-${q.id}`}
                                            value={opt}
                                            checked={answers[q.id] === opt}
                                            onChange={() => handleOptionSelect(q.id, opt)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                        />
                                        <span className="ml-3 text-gray-700 dark:text-gray-300">
                                            <span className="font-bold text-gray-500 mr-2">{opt})</span>
                                            {q[`option${opt}`]}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex justify-between items-center">
                    <button onClick={() => router.push('/dashboard/exams')} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                        ← Sınavlara Dön
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={Object.keys(answers).length === 0}
                        className="bg-green-600 text-white text-lg px-8 py-3 rounded-lg shadow hover:bg-green-700 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ✅ Sınavı Bitir
                    </button>
                </div>
            </div>
        </div>
    );
}
