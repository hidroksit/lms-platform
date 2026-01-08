'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ExamListPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [exams, setExams] = useState<any[]>([]);

    useEffect(() => {
        fetch(`http://localhost:3001/api/exams/course/${params.id}`)
            .then(res => res.json())
            .then(data => setExams(data))
            .catch(err => console.error(err));
    }, [params.id]);

    return (
        <div className="mt-8">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Sınavlar</h3>
            {exams.length === 0 ? (
                <p className="text-gray-500 italic">Bu ders için henüz sınav oluşturulmamış.</p>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {exams.map((exam) => (
                        <div key={exam.id} className="border rounded-lg p-4 bg-white shadow-sm flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-gray-800">{exam.title}</h4>
                                <p className="text-xs text-gray-500">{exam.Questions?.length || 0} Soru</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => window.location.href = `seb://localhost:3000/dashboard/exams/${exam.id}`}
                                    className="bg-gray-800 text-white text-xs px-3 py-1.5 rounded hover:bg-black border border-gray-600"
                                    title="Bilgisayarınızda SEB Yüklü ise açar"
                                >
                                    💾 SEB ile Başlat
                                </button>
                                <button
                                    onClick={() => router.push(`/dashboard/exams/${exam.id}`)}
                                    className="bg-purple-600 text-white text-xs px-3 py-1.5 rounded hover:bg-purple-700"
                                    title="Demo Modu (Normal Tarayıcı)"
                                >
                                    🌐 Web'den Gir (Demo)
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
