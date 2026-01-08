'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ExamList from './exams';

export default function CourseDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [course, setCourse] = useState<any>(null);

    useEffect(() => {
        fetch(`http://localhost:3001/api/courses/${params.id}`)
            .then(res => res.json())
            .then(data => setCourse(data))
            .catch(err => console.error(err));
    }, [params.id]);

    if (!course) return <div>Yükleniyor...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="text-blue-600 hover:text-blue-800"
                        >
                            &larr; Geri Dön
                        </button>
                    </div>
                    <p className="mt-2 text-gray-500">Eğitmen: {course.User?.firstName} {course.User?.lastName}</p>
                </div>
            </div>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="bg-white shadow sm:rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Ders İçeriği</h3>
                            <div className="mt-2 max-w-xl text-sm text-gray-500">
                                <p>{course.description}</p>
                            </div>
                            <div className="mt-5 border-t border-gray-200 pt-5">
                                <p className="text-gray-400 italic">Henüz video veya döküman eklenmedi.</p>
                                <div className="mt-4">
                                    <button className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700">
                                        + İçerik Ekle
                                    </button>
                                </div>
                            </div>

                            <ExamList params={params} />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
