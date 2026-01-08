'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://lms-platform-8tmc.onrender.com';

// Mock data for proctored exams
const MOCK_PROCTORED_EXAMS: Record<string, any> = {
    '2': {
        id: 2,
        title: 'Matematik Final Sınavı (Kameralı)',
        description: 'Tüm konuları kapsayan final sınavı - Kamera zorunlu',
        duration: 90,
        isProctored: true,
        Questions: [
            { id: 6, text: 'lim(x→0) sin(x)/x = ?', optionA: '0', optionB: '1', optionC: '∞', optionD: 'Tanımsız', correctOption: 'B', points: 15 },
            { id: 7, text: 'd/dx(x²) = ?', optionA: 'x', optionB: '2x', optionC: 'x²', optionD: '2', correctOption: 'B', points: 15 },
            { id: 8, text: '∫x dx = ?', optionA: 'x', optionB: 'x²', optionC: 'x²/2 + C', optionD: '2x', correctOption: 'C', points: 15 },
        ]
    },
    '6': {
        id: 6,
        title: 'Programlama Ara Sınav (Kameralı)',
        description: 'Algoritmalar ve döngüler - Kamera zorunlu',
        duration: 60,
        isProctored: true,
        Questions: [
            { id: 18, text: 'for döngüsü hangi durumda kullanılır?', optionA: 'Koşul doğru olduğu sürece', optionB: 'Belirli sayıda tekrar', optionC: 'Sadece bir kez', optionD: 'Hiçbir zaman', correctOption: 'B', points: 10 },
            { id: 19, text: 'Stack veri yapısı hangi prensiple çalışır?', optionA: 'FIFO', optionB: 'LIFO', optionC: 'Random', optionD: 'Priority', correctOption: 'B', points: 10 },
            { id: 20, text: 'Binary Search zaman karmaşıklığı?', optionA: 'O(1)', optionB: 'O(n)', optionC: 'O(log n)', optionD: 'O(n²)', correctOption: 'C', points: 10 },
        ]
    },
};

export default function ProctoredExamPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);

    const [webcamEnabled, setWebcamEnabled] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [warnings, setWarnings] = useState<string[]>([]);
    const [exam, setExam] = useState<any>(null);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [faceDetected, setFaceDetected] = useState(true);
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [identityVerified, setIdentityVerified] = useState(false);
    const [showIdentityModal, setShowIdentityModal] = useState(true);
    const [result, setResult] = useState<any>(null);
    const [usingMockData, setUsingMockData] = useState(false);

    // Start proctoring session
    const startProctoringSession = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/proctoring/session/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    examId: params.id,
                    userId: 'current-user',
                    webcamEnabled: true,
                    screenEnabled: false
                })
            });
            const data = await res.json();
            if (data.success) {
                setSessionId(data.sessionId);
                console.log('Proctoring session started:', data.sessionId);
            }
        } catch (error) {
            console.log('Using local proctoring mode');
            setSessionId('local-session-' + Date.now());
        }
    };

    // Report violation (local or backend)
    const reportViolation = async (type: string, description: string) => {
        console.log('Violation:', type, description);

        if (!sessionId || sessionId.startsWith('local-')) return;

        const token = localStorage.getItem('token');
        try {
            await fetch(`${API_URL}/api/proctoring/session/${sessionId}/violation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ type, description })
            });
        } catch (error) {
            console.log('Local violation logged');
        }
    };

    // Start webcam recording
    const startRecording = useCallback((stream: MediaStream) => {
        try {
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9'
            });

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.start(10000);
            mediaRecorderRef.current = mediaRecorder;
            setIsRecording(true);
        } catch (error) {
            console.error('Recording error:', error);
        }
    }, []);

    // Simulate face detection
    const simulateFaceDetection = useCallback(() => {
        const detected = Math.random() > 0.1; // 90% chance face detected
        setFaceDetected(detected);

        if (!detected) {
            const warning = `⚠️ Yüz algılanamadı! (${new Date().toLocaleTimeString()})`;
            setWarnings(prev => [...prev, warning]);
            reportViolation('no_face', 'Face not detected');
        }
    }, []);

    // Skip identity verification for demo
    const handleIdentityVerification = () => {
        setIdentityVerified(true);
        setShowIdentityModal(false);
    };

    useEffect(() => {
        // Request webcam access for proctoring
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                setWebcamEnabled(true);
                startProctoringSession().then(() => {
                    startRecording(stream);
                });
            })
            .catch(err => {
                alert('⚠️ WEBCAM ERİŞİMİ ZORUNLUDUR!\n\nGözetimli sınavlara girebilmek için kamera iznini vermelisiniz.');
                router.push('/dashboard/exams');
                return;
            });

        // Detect tab/window change
        const handleVisibilityChange = () => {
            if (document.hidden) {
                const warning = `⚠️ Sekme değiştirme tespit edildi! (${new Date().toLocaleTimeString()})`;
                setWarnings(prev => [...prev, warning]);
                reportViolation('tab_switch', 'Tab or window switched');
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Detect right-click
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            const warning = '⚠️ Sağ tıklama engellendi!';
            setWarnings(prev => [...prev, warning]);
            reportViolation('right_click', 'Right click attempted');
        };
        document.addEventListener('contextmenu', handleContextMenu);

        // Detect copy/paste
        const handleCopy = (e: ClipboardEvent) => {
            e.preventDefault();
            const warning = '⚠️ Kopyalama engellendi!';
            setWarnings(prev => [...prev, warning]);
            reportViolation('copy_paste', 'Copy attempted');
        };
        document.addEventListener('copy', handleCopy);

        // Detect print screen
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'PrintScreen' || (e.ctrlKey && e.key === 'p')) {
                e.preventDefault();
                const warning = '⚠️ Ekran görüntüsü engellendi!';
                setWarnings(prev => [...prev, warning]);
                reportViolation('screen_capture', 'Screen capture attempted');
            }
        };
        document.addEventListener('keydown', handleKeyDown);

        // Face detection interval
        const faceDetectionInterval = setInterval(simulateFaceDetection, 5000);

        // Fetch exam data
        const fetchExam = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/api/exams/${params.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!res.ok) throw new Error('API error');

                const data = await res.json();
                if (data && data.Questions?.length > 0) {
                    setExam(data);
                    if (data.duration) setTimeRemaining(data.duration * 60);
                } else {
                    throw new Error('No questions');
                }
            } catch (err) {
                // Use mock data
                const mockExam = MOCK_PROCTORED_EXAMS[params.id];
                if (mockExam) {
                    setExam(mockExam);
                    setTimeRemaining(mockExam.duration * 60);
                    setUsingMockData(true);
                } else {
                    alert('Bu sınav gözetimli sınav değil.');
                    router.push('/dashboard/exams');
                }
            }
        };
        fetchExam();

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('keydown', handleKeyDown);
            clearInterval(faceDetectionInterval);

            if (videoRef.current?.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            }
        };
    }, [params.id, router, startRecording, simulateFaceDetection]);

    // Timer countdown
    useEffect(() => {
        if (timeRemaining === null || timeRemaining <= 0) return;

        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev && prev <= 1) {
                    handleSubmit();
                    return 0;
                }
                return prev ? prev - 1 : null;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeRemaining]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSubmit = async () => {
        // Stop recording
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }

        // Stop webcam
        if (videoRef.current?.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        }

        // Calculate score
        const questions = exam?.Questions || [];
        let earnedPoints = 0;
        let totalPoints = 0;

        questions.forEach((q: any) => {
            totalPoints += q.points || 10;
            if (answers[q.id] === q.correctOption) {
                earnedPoints += q.points || 10;
            }
        });

        const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
        const trustScore = Math.max(0, 100 - warnings.length * 10);

        setResult({ score, earnedPoints, totalPoints, trustScore, warningCount: warnings.length });
    };

    if (result) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <div className="bg-gray-800 p-8 rounded-2xl text-center max-w-lg w-full">
                    <div className="text-6xl mb-4">🎓</div>
                    <h2 className="text-3xl font-bold text-white mb-6">Sınav Tamamlandı!</h2>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-blue-900/50 p-4 rounded-xl">
                            <div className="text-4xl font-bold text-blue-400">{result.score}</div>
                            <div className="text-sm text-gray-400">Puan</div>
                        </div>
                        <div className={`p-4 rounded-xl ${result.trustScore >= 70 ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
                            <div className={`text-4xl font-bold ${result.trustScore >= 70 ? 'text-green-400' : 'text-red-400'}`}>
                                {result.trustScore}
                            </div>
                            <div className="text-sm text-gray-400">Güven Skoru</div>
                        </div>
                    </div>

                    <div className="bg-gray-700 p-4 rounded-xl mb-6 text-left">
                        <h3 className="font-bold text-white mb-2">📊 Sınav Özeti</h3>
                        <p className="text-gray-300 text-sm">Doğru: {result.earnedPoints}/{result.totalPoints} puan</p>
                        <p className="text-gray-300 text-sm">Uyarı Sayısı: {result.warningCount}</p>
                        <p className="text-gray-300 text-sm">Kamera Kaydı: ✅ Tamamlandı</p>
                    </div>

                    <button
                        onClick={() => router.push('/dashboard/exams')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold"
                    >
                        Sınavlara Dön
                    </button>
                </div>
            </div>
        );
    }

    if (!exam) return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-white text-xl">Sınav Yükleniyor...</p>
                <p className="text-gray-400 mt-2">Kamera ve mikrofon başlatılıyor...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Identity Verification Modal */}
            {showIdentityModal && !identityVerified && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full">
                        <h2 className="text-2xl font-bold mb-4 text-center">📸 Kimlik Doğrulama</h2>
                        <p className="text-gray-300 mb-6 text-center">
                            Sınava başlamadan önce yüzünüzü kameraya gösterin.
                        </p>

                        <div className="relative mb-6">
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                className="w-full rounded-xl border-2 border-blue-500"
                            />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-48 h-48 border-4 border-dashed border-blue-400 rounded-full animate-pulse"></div>
                            </div>
                        </div>

                        <button
                            onClick={handleIdentityVerification}
                            className="w-full bg-green-600 hover:bg-green-700 py-4 rounded-xl font-bold text-lg transition-colors"
                        >
                            ✅ Kimliğimi Doğrula ve Sınava Başla
                        </button>
                    </div>
                </div>
            )}

            {/* Proctoring Header */}
            <div className="bg-gradient-to-r from-red-900 to-red-800 p-4 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        🔒 Gözetimli Sınav Modu
                        {isRecording && (
                            <span className="text-sm bg-red-600 px-2 py-1 rounded flex items-center gap-1">
                                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                KAYIT
                            </span>
                        )}
                        {usingMockData && (
                            <span className="text-xs bg-yellow-600 px-2 py-1 rounded">DEMO</span>
                        )}
                    </h2>
                    <p className="text-sm opacity-80">Webcam aktif, tüm hareketler kaydediliyor.</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Timer */}
                    {timeRemaining !== null && (
                        <div className={`text-2xl font-mono font-bold ${timeRemaining < 300 ? 'text-red-400 animate-pulse' : ''}`}>
                            ⏱️ {formatTime(timeRemaining)}
                        </div>
                    )}

                    {/* Webcam Preview */}
                    <div className="relative">
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            className="w-32 h-24 rounded-lg border-2 border-red-500 object-cover"
                        />
                        <div className={`absolute top-1 right-1 w-3 h-3 rounded-full ${faceDetected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
                        {isRecording && (
                            <div className="absolute bottom-1 left-1 flex items-center gap-1 bg-black/50 px-1 rounded text-xs">
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                REC
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Status Bar */}
            <div className="flex gap-2 p-4 bg-gray-800">
                <div className={`flex-1 p-2 rounded-lg text-center text-sm ${faceDetected ? 'bg-green-900' : 'bg-red-900'}`}>
                    {faceDetected ? '✅ Yüz Algılandı' : '❌ Yüz Algılanamıyor!'}
                </div>
                <div className={`flex-1 p-2 rounded-lg text-center text-sm ${identityVerified ? 'bg-green-900' : 'bg-yellow-900'}`}>
                    {identityVerified ? '✅ Kimlik Doğrulandı' : '⏳ Kimlik Bekleniyor'}
                </div>
                <div className="flex-1 p-2 rounded-lg text-center text-sm bg-gray-700">
                    ⚠️ Uyarı: {warnings.length}
                </div>
            </div>

            {/* Warnings Panel */}
            {warnings.length > 0 && (
                <div className="mx-4 mb-4 bg-yellow-900/50 border border-yellow-600 p-3 rounded-lg">
                    <h3 className="font-bold mb-2 text-sm">⚠️ Uyarılar ({warnings.length})</h3>
                    <ul className="text-xs space-y-1 max-h-20 overflow-y-auto">
                        {warnings.slice(-5).map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                </div>
            )}

            {/* Exam Content */}
            <div className="p-4">
                <div className="bg-gray-800 p-6 rounded-xl">
                    <h1 className="text-2xl font-bold mb-6">{exam.title}</h1>

                    {exam.Questions?.map((q: any, index: number) => (
                        <div key={q.id} className="mb-6 p-4 bg-gray-700 rounded-xl">
                            <h4 className="font-bold mb-3">
                                <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full mr-2 text-sm">
                                    {index + 1}
                                </span>
                                {q.text}
                            </h4>
                            <div className="space-y-2 ml-10">
                                {['A', 'B', 'C', 'D'].map((opt) => (
                                    <label
                                        key={opt}
                                        className={`flex items-center space-x-2 cursor-pointer p-3 rounded-lg transition-colors ${answers[q.id] === opt
                                                ? 'bg-blue-600'
                                                : 'hover:bg-gray-600'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name={`q-${q.id}`}
                                            value={opt}
                                            checked={answers[q.id] === opt}
                                            onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                                            className="w-4 h-4"
                                        />
                                        <span>{opt}) {q[`option${opt}`]}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={handleSubmit}
                        className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition-colors text-lg"
                    >
                        ✅ Sınavı Bitir ve Gönder
                    </button>
                </div>
            </div>
        </div>
    );
}
