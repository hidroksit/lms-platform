'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TakeExamPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [exam, setExam] = useState<any>(null);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        fetch(`http://localhost:3001/api/exams/${params.id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log('Exam data:', data); // Debug log
                setExam(data);
                if (data.isProctored) {
                    router.push(`/dashboard/exams/${params.id}/proctored`);
                }
            })
            .catch(err => console.error(err));
    }, [params.id, router]);

    const handleOptionSelect = (questionId: number, option: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: option }));
    };

    const handleSubmit = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:3001/api/exams/submit', {
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
            alert('Error submitting exam');
        }
    };

    if (!exam) return <div className="p-8">Sınav Yükleniyor...</div>;

    if (result) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow text-center max-w-md w-full">
                    <h2 className="text-3xl font-bold mb-4 text-gray-900">Sınav Tamamlandı!</h2>
                    <div className="text-6xl font-extrabold text-blue-600 mb-4">{result.score}</div>
                    <p className="text-gray-500 mb-6">Puan Aldınız</p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="bg-gray-800 text-white px-6 py-2 rounded hover:bg-gray-900 w-full"
                    >
                        Panele Dön
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>
                    <p className="text-sm text-gray-500 mt-1">Lütfen tüm soruları cevaplayınız.</p>
                </div>

                <div className="space-y-6">
                    {(exam.Questions || exam.questions)?.map((q: any, index: number) => (
                        <div key={q.id} className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                <span className="font-bold text-gray-400 mr-2">{index + 1}.</span>
                                {q.text}
                            </h3>
                            <div className="space-y-2">
                                {['A', 'B', 'C', 'D'].map((opt) => (
                                    <label
                                        key={opt}
                                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${answers[q.id] === opt ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'hover:bg-gray-50'
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
                                            <span className="font-bold mr-2">{opt})</span>
                                            {q[`option${opt}`]}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleSubmit}
                        className="bg-green-600 text-white text-lg px-8 py-3 rounded-lg shadow hover:bg-green-700 font-bold"
                    >
                        Sınavı Bitir
                    </button>
                </div>
            </div>
        </div>
    );
}
