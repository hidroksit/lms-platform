'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function ProctoredExamPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [webcamEnabled, setWebcamEnabled] = useState(false);
    const [warnings, setWarnings] = useState<string[]>([]);
    const [exam, setExam] = useState<any>(null);
    const [answers, setAnswers] = useState<Record<number, string>>({});

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        // Request webcam access for proctoring
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                setWebcamEnabled(true);
            })
            .catch(err => {
                alert('⚠️ WEBCAM ERİŞİMİ ZORUNLUDUR!\n\nGözetimli sınavlara girebilmek için kamera iznini vermelisiniz.');
                router.push('/dashboard');
                return;
            });

        // Detect tab/window change
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setWarnings(prev => [...prev, `⚠️ Sekme değiştirme tespit edildi! (${new Date().toLocaleTimeString()})`]);
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Detect right-click
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            setWarnings(prev => [...prev, '⚠️ Sağ tıklama engellendi!']);
        };
        document.addEventListener('contextmenu', handleContextMenu);

        // Detect copy/paste
        const handleCopy = (e: ClipboardEvent) => {
            e.preventDefault();
            setWarnings(prev => [...prev, '⚠️ Kopyalama engellendi!']);
        };
        document.addEventListener('copy', handleCopy);

        // Fetch exam with Authorization
        fetch(`http://localhost:3001/api/exams/${params.id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => {
                if (!res.ok) throw new Error('Sınav yüklenemedi');
                return res.json();
            })
            .then(data => {
                console.log('Proctored Exam Data:', data);
                setExam(data);
            })
            .catch(err => {
                console.error(err);
                alert('Sınav yüklenirken hata oluştu');
                router.push('/dashboard');
            });

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('copy', handleCopy);
        };
    }, [params.id, router]);

    const handleSubmit = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:3001/api/exams/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ examId: params.id, answers, proctorWarnings: warnings }),
            });
            const data = await res.json();
            alert(`Sınav tamamlandı! Puanınız: ${data.score}`);
            router.push('/dashboard');
        } catch (err) {
            alert('Gönderim hatası!');
        }
    };

    if (!exam) return <div className="p-8 text-center">Sınav Yükleniyor...</div>;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4">
            {/* Proctoring Header */}
            <div className="bg-red-900 p-4 rounded-lg mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold">🔒 Gözetimli Sınav Modu</h2>
                    <p className="text-sm opacity-80">Webcam aktif, tüm hareketler kaydediliyor.</p>
                </div>
                <div className="flex items-center gap-4">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        className="w-32 h-24 rounded border-2 border-red-500"
                    />
                    <div className={`w-4 h-4 rounded-full ${webcamEnabled ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                </div>
            </div>

            {/* Warnings Panel */}
            {warnings.length > 0 && (
                <div className="bg-yellow-900 p-4 rounded-lg mb-6">
                    <h3 className="font-bold mb-2">⚠️ Uyarılar ({warnings.length})</h3>
                    <ul className="text-sm space-y-1 max-h-32 overflow-y-auto">
                        {warnings.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                </div>
            )}

            {/* Exam Content */}
            <div className="bg-gray-800 p-6 rounded-lg">
                <h1 className="text-2xl font-bold mb-6">{exam.title}</h1>

                {exam.Questions?.map((q: any, index: number) => (
                    <div key={q.id} className="mb-6 p-4 bg-gray-700 rounded">
                        <h4 className="font-bold mb-3">{index + 1}. {q.text}</h4>
                        <div className="space-y-2">
                            {['A', 'B', 'C', 'D'].map((opt) => (
                                <label key={opt} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name={`q-${q.id}`}
                                        value={opt}
                                        checked={answers[q.id] === opt}
                                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                                    />
                                    <span>{opt}) {q[`option${opt}`]}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}

                <button
                    onClick={handleSubmit}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700"
                >
                    Sınavı Bitir ve Gönder
                </button>
            </div>
        </div>
    );
}
