'use client';

import { useState, useRef } from 'react';

interface HotspotQuestion {
    imageUrl: string;
    hotspots: { x: number; y: number; radius: number; id: number }[];
    question: string;
}

interface CodeQuestion {
    language: string;
    starterCode: string;
    testCases: { input: string; expectedOutput: string }[];
}

export default function AdvancedQuestionsPage() {
    // Hotspot Question State
    const [selectedHotspot, setSelectedHotspot] = useState<number | null>(null);
    const [hotspotQuestion] = useState<HotspotQuestion>({
        imageUrl: 'https://via.placeholder.com/600x400/3b82f6/ffffff?text=Diagram',
        hotspots: [
            { x: 150, y: 100, radius: 30, id: 1 },
            { x: 300, y: 200, radius: 30, id: 2 },
            { x: 450, y: 150, radius: 30, id: 3 },
        ],
        question: 'Diyagramda CPU\'nun bulunduğu bölgeyi işaretleyin'
    });

    // Code Question State
    const [code, setCode] = useState(`function toplam(a, b) {
    // Kodunuzu buraya yazın
    return a + b;
}`);
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);

    const runCode = async () => {
        setIsRunning(true);
        setOutput('Kod çalıştırılıyor...');

        try {
            // Simulate code execution
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Simple eval for demo (in production, use sandboxed execution)
            const result = eval(`
                ${code}
                toplam(5, 3);
            `);

            setOutput(`Çıktı: ${result}\n✅ Test geçti!`);
        } catch (error: any) {
            setOutput(`❌ Hata: ${error.message}`);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                🎯 Gelişmiş Soru Türleri Demo
            </h1>

            {/* Hotspot Question */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    📍 Hotspot Sorusu
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {hotspotQuestion.question}
                </p>

                <div className="relative inline-block">
                    <img
                        src={hotspotQuestion.imageUrl}
                        alt="Hotspot Image"
                        className="rounded-lg border-2 border-gray-200"
                    />
                    {hotspotQuestion.hotspots.map((spot) => (
                        <button
                            key={spot.id}
                            onClick={() => setSelectedHotspot(spot.id)}
                            className={`absolute w-12 h-12 rounded-full border-4 transition-all transform -translate-x-1/2 -translate-y-1/2 ${selectedHotspot === spot.id
                                    ? 'border-green-500 bg-green-500/30 scale-110'
                                    : 'border-blue-500 bg-blue-500/20 hover:scale-105'
                                }`}
                            style={{ left: spot.x, top: spot.y }}
                        >
                            <span className="text-white font-bold">{spot.id}</span>
                        </button>
                    ))}
                </div>

                {selectedHotspot && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                        <p className="text-blue-800 dark:text-blue-200">
                            ✓ Bölge {selectedHotspot} seçildi
                        </p>
                    </div>
                )}
            </div>

            {/* Code Execution Question */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    💻 Kod Çalıştırma Sorusu
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                    İki sayıyı toplayan bir fonksiyon yazın. Test: toplam(5, 3) = 8
                </p>

                <div className="grid grid-cols-2 gap-4">
                    {/* Code Editor */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Kod Editörü (JavaScript)
                        </label>
                        <textarea
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="w-full h-64 p-4 font-mono text-sm bg-gray-900 text-green-400 rounded-lg border border-gray-700 focus:ring-2 focus:ring-blue-500"
                            spellCheck={false}
                        />
                    </div>

                    {/* Output */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Çıktı
                        </label>
                        <div className="w-full h-64 p-4 font-mono text-sm bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-lg border border-gray-300 dark:border-gray-700 overflow-auto">
                            {output || 'Kodu çalıştırdığınızda sonuç burada görünecek...'}
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex space-x-4">
                    <button
                        onClick={runCode}
                        disabled={isRunning}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                    >
                        {isRunning ? '⏳ Çalışıyor...' : '▶️ Kodu Çalıştır'}
                    </button>
                    <button
                        onClick={() => setCode(`function toplam(a, b) {\n    // Kodunuzu buraya yazın\n    return a + b;\n}`)}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
                    >
                        🔄 Sıfırla
                    </button>
                </div>
            </div>

            {/* Question Types Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    📋 Desteklenen Soru Türleri
                </h2>
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { type: 'Çoktan Seçmeli', icon: '📝', status: '✅' },
                        { type: 'Çoklu Seçim', icon: '☑️', status: '✅' },
                        { type: 'Doğru/Yanlış', icon: '✓✗', status: '✅' },
                        { type: 'Eşleştirme', icon: '🔗', status: '✅' },
                        { type: 'Sıralama', icon: '📊', status: '✅' },
                        { type: 'Boşluk Doldurma', icon: '📝', status: '✅' },
                        { type: 'Kısa Cevap', icon: '💬', status: '✅' },
                        { type: 'Uzun Cevap', icon: '📄', status: '✅' },
                        { type: 'Dosya Yükleme', icon: '📎', status: '✅' },
                        { type: 'Hesaplama', icon: '🧮', status: '✅' },
                        { type: 'Hotspot', icon: '📍', status: '✅' },
                        { type: 'Kod Çalıştırma', icon: '💻', status: '✅' },
                    ].map((q) => (
                        <div key={q.type} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <span className="flex items-center space-x-2">
                                <span>{q.icon}</span>
                                <span className="text-gray-700 dark:text-gray-300">{q.type}</span>
                            </span>
                            <span>{q.status}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
