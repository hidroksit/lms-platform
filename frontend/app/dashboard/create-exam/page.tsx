'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateExamPage() {
    const router = useRouter();
    const [courses, setCourses] = useState<any[]>([]);
    const [title, setTitle] = useState('');
    const [courseId, setCourseId] = useState('');
    const [questions, setQuestions] = useState<any[]>([
        { text: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A' }
    ]);

    useEffect(() => {
        fetch('http://localhost:3001/api/courses')
            .then(res => res.json())
            .then(data => setCourses(data));
    }, []);

    const handleAddQuestion = () => {
        setQuestions([...questions, { text: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A' }]);
    };

    const handleQuestionChange = (index: number, field: string, value: string) => {
        const newQuestions = [...questions];
        newQuestions[index][field] = value;
        setQuestions(newQuestions);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            const res = await fetch('http://localhost:3001/api/exams', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title,
                    courseId,
                    questions
                }),
            });

            if (!res.ok) throw new Error('Failed to create exam');
            router.push('/dashboard');
        } catch (err) {
            alert('Error creating exam');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-8">
                <h2 className="text-2xl font-bold mb-6">Sınav Oluştur</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Sınav Başlığı</label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Ders Seçin</label>
                            <select
                                required
                                value={courseId}
                                onChange={(e) => setCourseId(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            >
                                <option value="">Seçiniz...</option>
                                {courses.map(c => (
                                    <option key={c.id} value={c.id}>{c.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Sorular</h3>
                        {questions.map((q, index) => (
                            <div key={index} className="border p-4 rounded bg-gray-50">
                                <div className="mb-2">
                                    <label className="block text-xs font-bold uppercase text-gray-500">Soru {index + 1}</label>
                                    <input
                                        type="text"
                                        placeholder="Soru metni..."
                                        value={q.text}
                                        onChange={(e) => handleQuestionChange(index, 'text', e.target.value)}
                                        className="w-full border p-2 rounded"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {['A', 'B', 'C', 'D'].map(opt => (
                                        <div key={opt}>
                                            <label className="text-xs text-gray-500">Seçenek {opt}</label>
                                            <input
                                                type="text"
                                                value={q[`option${opt}`]}
                                                onChange={(e) => handleQuestionChange(index, `option${opt}`, e.target.value)}
                                                className="w-full border p-1 rounded"
                                                required
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-2">
                                    <label className="text-sm font-medium">Doğru Cevap: </label>
                                    <select
                                        value={q.correctOption}
                                        onChange={(e) => handleQuestionChange(index, 'correctOption', e.target.value)}
                                        className="ml-2 border p-1 rounded"
                                    >
                                        {['A', 'B', 'C', 'D'].map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={handleAddQuestion}
                            className="text-blue-600 font-medium hover:text-blue-800"
                        >
                            + Soru Ekle
                        </button>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            className="bg-green-600 text-white px-6 py-2 rounded shadow hover:bg-green-700"
                        >
                            Sınavı Kaydet
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
