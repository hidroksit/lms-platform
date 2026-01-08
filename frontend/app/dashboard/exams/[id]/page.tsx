'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://lms-platform-8tmc.onrender.com';

export default function TakeExamPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [exam, setExam] = useState<any>(null);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        fetch(`${API_URL}/api/exams/${params.id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log('Exam data:', data);
                setExam(data);
                setLoading(false);
                if (data.isProctored) {
                    router.push(`/dashboard/exams/${params.id}/proctored`);
                }
            })
            .catch(err => {
                console.error(err);
                setError('Sınav yüklenirken hata oluştu');
                setLoading(false);
            });
    }, [params.id, router]);

    const handleOptionSelect = (questionId: number, option: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: option }));
    };

    const handleSubmit = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/exams/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    examId: params.id,
                    answers
                }),
            });
            const data = await res.json();
            setResult(data);
        } catch (err) {
            alert('Sınav gönderilirken hata oluştu');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Sınav Yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Hata</h2>
                    <p className="text-gray-500 mb-4">{error}</p>
                    <button
                        onClick={() => router.push('/dashboard/exams')}
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                    >
                        Sınavlara Dön
                    </button>
                </div>
            </div>
        );
    }

    if (!exam) return null;

    if (result) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow text-center max-w-md w-full">
                    <div className="text-6xl mb-4">🎉</div>
                    <h2 className="text-3xl font-bold mb-4 text-gray-900">Sınav Tamamlandı!</h2>
                    <div className="text-6xl font-extrabold text-blue-600 mb-4">{result.score}</div>
                    <p className="text-gray-500 mb-6">Puan Aldınız</p>
                    <button
                        onClick={() => router.push('/dashboard/exams')}
                        className="bg-gray-800 text-white px-6 py-2 rounded hover:bg-gray-900 w-full"
                    >
                        Sınavlara Dön
                    </button>
                </div>
            </div>
        );
    }

    const questions = exam.Questions || exam.questions || [];

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>
                            <p className="text-sm text-gray-500 mt-1">{exam.description}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-500">Süre</div>
                            <div className="text-xl font-bold text-blue-600">{exam.duration} dk</div>
                        </div>
                    </div>
                    {exam.isProctored && (
                        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                            🎥 Bu sınav kamera gözetimli (proctored) sınavdır.
                        </div>
                    )}
                </div>

                {questions.length === 0 ? (
                    <div className="bg-white shadow rounded-lg p-12 text-center">
                        <div className="text-6xl mb-4">📋</div>
                        <h3 className="text-xl font-semibold text-gray-700">Sorular Yükleniyor...</h3>
                        <p className="text-gray-500 mt-2">Henüz soru bulunamadı</p>
                    </div>
                ) : (
                    <>
                        <div className="mb-4 text-sm text-gray-500">
                            Toplam {questions.length} soru • Cevaplanmış: {Object.keys(answers).length}/{questions.length}
                        </div>

                        <div className="space-y-6">
                            {questions.map((q: any, index: number) => (
                                <div key={q.id} className="bg-white shadow rounded-lg p-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                                        <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full mr-3 text-sm font-bold">
                                            {index + 1}
                                        </span>
                                        {q.text}
                                    </h3>
                                    <div className="space-y-2 ml-11">
                                        {['A', 'B', 'C', 'D'].map((opt) => (
                                            <label
                                                key={opt}
                                                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${answers[q.id] === opt
                                                        ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500'
                                                        : 'hover:bg-gray-50 border-gray-200'
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
                                                <span className="ml-3 text-gray-700">
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
                            <button
                                onClick={() => router.push('/dashboard/exams')}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ← Sınavlara Dön
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="bg-green-600 text-white text-lg px-8 py-3 rounded-lg shadow hover:bg-green-700 font-bold"
                            >
                                ✅ Sınavı Bitir
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
