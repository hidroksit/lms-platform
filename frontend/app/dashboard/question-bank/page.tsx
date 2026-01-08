'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Question {
    id: number;
    text: string;
    type: string;
    category: string;
    difficulty: string;
}

export default function QuestionBankPage() {
    const router = useRouter();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [filter, setFilter] = useState({ type: '', category: '', difficulty: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        if (user.role !== 'admin' && user.role !== 'instructor') {
            router.push('/dashboard');
            return;
        }

        fetch('http://localhost:3001/api/questions/bank', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                setQuestions(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [router]);

    const filteredQuestions = questions.filter(q => {
        if (filter.type && q.type !== filter.type) return false;
        if (filter.category && q.category !== filter.category) return false;
        if (filter.difficulty && q.difficulty !== filter.difficulty) return false;
        return true;
    });

    const questionTypes = [
        { value: 'single_choice', label: 'Çoktan Seçmeli' },
        { value: 'multiple_choice', label: 'Çoklu Seçim' },
        { value: 'true_false', label: 'Doğru/Yanlış' },
        { value: 'fill_blank', label: 'Boşluk Doldurma' },
        { value: 'short_answer', label: 'Kısa Cevap' },
        { value: 'essay', label: 'Uzun Cevap' },
    ];

    if (loading) return <div className="p-8 text-center">Yükleniyor...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">📚 Soru Bankası</h1>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                    >
                        ← Geri
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-lg shadow mb-6 flex gap-4 flex-wrap">
                    <select
                        className="border rounded px-3 py-2"
                        value={filter.type}
                        onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                    >
                        <option value="">Tüm Türler</option>
                        {questionTypes.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>

                    <select
                        className="border rounded px-3 py-2"
                        value={filter.difficulty}
                        onChange={(e) => setFilter({ ...filter, difficulty: e.target.value })}
                    >
                        <option value="">Tüm Zorluklar</option>
                        <option value="easy">Kolay</option>
                        <option value="medium">Orta</option>
                        <option value="hard">Zor</option>
                    </select>

                    <span className="ml-auto text-gray-500">{filteredQuestions.length} soru bulundu</span>
                </div>

                {/* Questions List */}
                <div className="space-y-4">
                    {filteredQuestions.map((q, idx) => (
                        <div key={q.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-sm text-gray-500">#{q.id}</span>
                                    <h3 className="font-medium text-gray-900">{q.text}</h3>
                                </div>
                                <div className="flex gap-2">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                        {questionTypes.find(t => t.value === q.type)?.label || q.type}
                                    </span>
                                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                                        {q.difficulty || 'Orta'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredQuestions.length === 0 && (
                        <div className="text-center text-gray-500 py-12">
                            Kriterlere uygun soru bulunamadı.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
