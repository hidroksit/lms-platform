'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Module {
    id: number;
    title: string;
    description: string;
    order: number;
    isLocked: boolean;
    prerequisiteId?: number;
    contents: Content[];
}

interface Content {
    id: number;
    type: 'video' | 'pdf' | 'scorm' | 'quiz' | 'assignment';
    title: string;
    duration?: string;
    isCompleted: boolean;
}

export default function CourseModulesPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [modules, setModules] = useState<Module[]>([]);
    const [expandedModule, setExpandedModule] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock data - would fetch from API
        setModules([
            {
                id: 1,
                title: 'Modül 1: Giriş',
                description: 'Kursa giriş ve temel kavramlar',
                order: 1,
                isLocked: false,
                contents: [
                    { id: 1, type: 'video', title: 'Tanıtım Videosu', duration: '10:30', isCompleted: true },
                    { id: 2, type: 'pdf', title: 'Ders Notları', isCompleted: true },
                    { id: 3, type: 'quiz', title: 'Giriş Quizi', isCompleted: false },
                ]
            },
            {
                id: 2,
                title: 'Modül 2: Temel Kavramlar',
                description: 'Temel programlama kavramları',
                order: 2,
                isLocked: false,
                prerequisiteId: 1,
                contents: [
                    { id: 4, type: 'video', title: 'Değişkenler', duration: '15:00', isCompleted: false },
                    { id: 5, type: 'video', title: 'Fonksiyonlar', duration: '20:00', isCompleted: false },
                    { id: 6, type: 'assignment', title: 'Ödev 1', isCompleted: false },
                ]
            },
            {
                id: 3,
                title: 'Modül 3: İleri Konular',
                description: 'Gelişmiş programlama teknikleri',
                order: 3,
                isLocked: true,
                prerequisiteId: 2,
                contents: [
                    { id: 7, type: 'video', title: 'OOP Temelleri', duration: '25:00', isCompleted: false },
                    { id: 8, type: 'scorm', title: 'İnteraktif Simülasyon', isCompleted: false },
                    { id: 9, type: 'quiz', title: 'Final Sınavı', isCompleted: false },
                ]
            },
        ]);
        setLoading(false);
    }, [params.id]);

    const getContentIcon = (type: Content['type']) => {
        switch (type) {
            case 'video': return '🎬';
            case 'pdf': return '📄';
            case 'scorm': return '🎮';
            case 'quiz': return '📝';
            case 'assignment': return '📋';
            default: return '📁';
        }
    };

    const getProgress = (module: Module) => {
        const completed = module.contents.filter(c => c.isCompleted).length;
        return Math.round((completed / module.contents.length) * 100);
    };

    if (loading) return <div className="p-8">Yükleniyor...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <button
                    onClick={() => router.back()}
                    className="text-blue-600 hover:text-blue-800 mb-4"
                >
                    ← Geri
                </button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📚 Ders Modülleri</h1>
                <p className="text-gray-500 dark:text-gray-400">Hiyerarşik ders yapısı ve ön koşullar</p>
            </div>

            <div className="space-y-4">
                {modules.map((module, index) => (
                    <div
                        key={module.id}
                        className={`bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden ${module.isLocked ? 'opacity-60' : ''
                            }`}
                    >
                        {/* Module Header */}
                        <div
                            className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750"
                            onClick={() => !module.isLocked && setExpandedModule(
                                expandedModule === module.id ? null : module.id
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${module.isLocked ? 'bg-gray-400' : 'bg-blue-600'
                                        }`}>
                                        {module.isLocked ? '🔒' : index + 1}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                            {module.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {module.description}
                                        </p>
                                        {module.prerequisiteId && (
                                            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                                                ⚠️ Ön koşul: Modül {module.prerequisiteId} tamamlanmalı
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="text-right">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            {getProgress(module)}%
                                        </div>
                                        <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                            <div
                                                className="bg-green-500 h-2 rounded-full"
                                                style={{ width: `${getProgress(module)}%` }}
                                            />
                                        </div>
                                    </div>
                                    <span className="text-gray-400">
                                        {expandedModule === module.id ? '▼' : '▶'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Module Contents */}
                        {expandedModule === module.id && !module.isLocked && (
                            <div className="border-t border-gray-200 dark:border-gray-700">
                                {module.contents.map((content) => (
                                    <div
                                        key={content.id}
                                        className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-750 border-b border-gray-100 dark:border-gray-700 last:border-0"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <span className="text-xl">{getContentIcon(content.type)}</span>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {content.title}
                                                </p>
                                                {content.duration && (
                                                    <p className="text-xs text-gray-500">{content.duration}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            {content.isCompleted ? (
                                                <span className="text-green-500">✓ Tamamlandı</span>
                                            ) : (
                                                <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                                                    Başla
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
