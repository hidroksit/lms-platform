'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Simple WYSIWYG Editor Component
function RichTextEditor({
    value,
    onChange
}: {
    value: string;
    onChange: (html: string) => void
}) {
    const editorRef = useRef<HTMLDivElement>(null);

    const execCommand = useCallback((command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    }, [onChange]);

    const toolbarButtons = [
        { command: 'bold', icon: 'B', title: 'Kalın' },
        { command: 'italic', icon: 'I', title: 'İtalik' },
        { command: 'underline', icon: 'U', title: 'Altı Çizili' },
        { command: 'strikeThrough', icon: 'S', title: 'Üstü Çizili' },
        { command: 'insertUnorderedList', icon: '•', title: 'Liste' },
        { command: 'insertOrderedList', icon: '1.', title: 'Numaralı Liste' },
        { command: 'justifyLeft', icon: '◀', title: 'Sola Hizala' },
        { command: 'justifyCenter', icon: '◆', title: 'Ortala' },
        { command: 'justifyRight', icon: '▶', title: 'Sağa Hizala' },
    ];

    return (
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            {/* Toolbar */}
            <div className="bg-gray-100 dark:bg-gray-700 p-2 flex flex-wrap gap-1 border-b border-gray-300 dark:border-gray-600">
                {toolbarButtons.map((btn) => (
                    <button
                        key={btn.command}
                        type="button"
                        onClick={() => execCommand(btn.command)}
                        title={btn.title}
                        className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-600 font-bold text-gray-700 dark:text-gray-200"
                    >
                        {btn.icon}
                    </button>
                ))}
                <select
                    onChange={(e) => execCommand('formatBlock', e.target.value)}
                    className="ml-2 px-2 py-1 text-sm border rounded bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200"
                    defaultValue=""
                >
                    <option value="">Başlık</option>
                    <option value="h1">Başlık 1</option>
                    <option value="h2">Başlık 2</option>
                    <option value="h3">Başlık 3</option>
                    <option value="p">Paragraf</option>
                </select>
                <select
                    onChange={(e) => execCommand('foreColor', e.target.value)}
                    className="ml-2 px-2 py-1 text-sm border rounded bg-white dark:bg-gray-600"
                    defaultValue="#000000"
                >
                    <option value="#000000">⬛ Siyah</option>
                    <option value="#ef4444">🟥 Kırmızı</option>
                    <option value="#3b82f6">🟦 Mavi</option>
                    <option value="#22c55e">🟩 Yeşil</option>
                    <option value="#f97316">🟧 Turuncu</option>
                </select>
            </div>
            {/* Editor */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={() => {
                    if (editorRef.current) {
                        onChange(editorRef.current.innerHTML);
                    }
                }}
                className="min-h-[200px] p-4 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                dangerouslySetInnerHTML={{ __html: value }}
            />
        </div>
    );
}

export default function CreateCoursePage() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'basic' | 'content' | 'settings'>('basic');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
            router.push('/');
            return;
        }

        const user = JSON.parse(userStr);

        try {
            const res = await fetch('http://localhost:3001/api/courses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title,
                    description,
                    content, // HTML content from WYSIWYG
                    instructorId: user.id
                }),
            });

            if (!res.ok) throw new Error('Failed to create course');

            router.push('/dashboard');
        } catch (err) {
            console.error(err);
            alert('Ders oluşturulurken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                {/* Header */}
                <div className="border-b border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">📚 Yeni Ders Oluştur</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Ders bilgilerini ve içeriğini düzenleyin</p>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="flex">
                        {[
                            { id: 'basic', label: 'Temel Bilgiler' },
                            { id: 'content', label: 'İçerik Editörü' },
                            { id: 'settings', label: 'Ayarlar' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-6 py-3 font-medium text-sm border-b-2 transition ${activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="p-6">
                    {activeTab === 'basic' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Ders Başlığı *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Örn: Web Programlama 101"
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Kısa Açıklama *
                                </label>
                                <textarea
                                    required
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    placeholder="Ders hakkında kısa bir açıklama yazın..."
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'content' && (
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Ders İçeriği (WYSIWYG Editör)
                            </label>
                            <RichTextEditor value={content} onChange={setContent} />
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                İpucu: Metin seçip araç çubuğundaki butonları kullanarak biçimlendirebilirsiniz.
                            </p>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-6">
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                <h3 className="font-medium text-gray-900 dark:text-white mb-4">Erişim Ayarları</h3>
                                <div className="space-y-3">
                                    <label className="flex items-center">
                                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Öğrenci kaydına açık</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Sertifika ver</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                        >
                            {loading ? 'Oluşturuluyor...' : '✓ Dersi Oluştur'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
