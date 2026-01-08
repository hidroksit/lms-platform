'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = 'http://localhost:3001';

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
            console.error('Failed to start proctoring session:', error);
        }
    };

    // Report violation to backend
    const reportViolation = async (type: string, description: string) => {
        if (!sessionId) return;

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
            console.error('Failed to report violation:', error);
        }
    };

    // Upload recording chunk
    const uploadRecordingChunk = async (blob: Blob) => {
        if (!sessionId) return;

        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('video', blob, `chunk-${Date.now()}.webm`);

        try {
            await fetch(`${API_URL}/api/proctoring/session/${sessionId}/recording`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
        } catch (error) {
            console.error('Failed to upload recording:', error);
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

                    // Upload every 30 seconds
                    if (recordedChunksRef.current.length >= 3) {
                        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                        uploadRecordingChunk(blob);
                        recordedChunksRef.current = [];
                    }
                }
            };

            mediaRecorder.start(10000); // Record in 10-second chunks
            mediaRecorderRef.current = mediaRecorder;
            setIsRecording(true);
        } catch (error) {
            console.error('Recording error:', error);
        }
    }, [sessionId]);

    // Simulate face detection (in production: use TensorFlow.js face-api)
    const simulateFaceDetection = useCallback(() => {
        // Random face detection simulation
        const detected = Math.random() > 0.1; // 90% chance face detected
        setFaceDetected(detected);

        if (!detected && sessionId) {
            const warning = `⚠️ Yüz algılanamadı! (${new Date().toLocaleTimeString()})`;
            setWarnings(prev => [...prev, warning]);
            reportViolation('no_face', 'Face not detected');
        }
    }, [sessionId]);

    // Identity verification
    const handleIdentityVerification = async () => {
        if (!sessionId) return;

        // In production: capture photo and send to backend
        const canvas = document.createElement('canvas');
        const video = videoRef.current;
        if (video) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d')?.drawImage(video, 0, 0);

            // Convert to blob
            canvas.toBlob(async (blob) => {
                if (blob) {
                    const token = localStorage.getItem('token');
                    const formData = new FormData();
                    formData.append('idPhoto', blob, 'identity.jpg');

                    try {
                        const res = await fetch(`${API_URL}/api/proctoring/session/${sessionId}/verify-identity`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}` },
                            body: formData
                        });
                        const data = await res.json();
                        if (data.verified) {
                            setIdentityVerified(true);
                            setShowIdentityModal(false);
                        }
                    } catch (error) {
                        console.error('Identity verification failed:', error);
                    }
                }
            }, 'image/jpeg');
        }
    };

    // End proctoring session
    const endProctoringSession = async () => {
        if (!sessionId) return;

        // Stop recording
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }

        // Upload remaining chunks
        if (recordedChunksRef.current.length > 0) {
            const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
            await uploadRecordingChunk(blob);
        }

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/proctoring/session/${sessionId}/end`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            console.log('Proctoring session ended:', data);
            return data;
        } catch (error) {
            console.error('Failed to end proctoring session:', error);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        // Request webcam access for proctoring
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                setWebcamEnabled(true);

                // Start proctoring session and recording
                startProctoringSession().then(() => {
                    startRecording(stream);
                });
            })
            .catch(err => {
                alert('⚠️ WEBCAM ERİŞİMİ ZORUNLUDUR!\n\nGözetimli sınavlara girebilmek için kamera iznini vermelisiniz.');
                router.push('/dashboard');
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

        // Detect print screen (window blur on print)
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

        // Fetch exam with Authorization
        fetch(`${API_URL}/api/exams/${params.id}`, {
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
                // Set timer if exam has duration
                if (data.duration) {
                    setTimeRemaining(data.duration * 60);
                }
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
            document.removeEventListener('keydown', handleKeyDown);
            clearInterval(faceDetectionInterval);

            // Stop webcam stream
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
        const token = localStorage.getItem('token');

        // End proctoring session first
        const proctoringResult = await endProctoringSession();

        try {
            const res = await fetch(`${API_URL}/api/exams/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    examId: params.id,
                    answers,
                    proctorWarnings: warnings,
                    proctorSessionId: sessionId,
                    trustScore: proctoringResult?.session?.trustScore
                }),
            });
            const data = await res.json();

            const trustMessage = proctoringResult?.session?.trustScore
                ? `\nGüven Skoru: ${proctoringResult.session.trustScore}/100`
                : '';

            alert(`Sınav tamamlandı! Puanınız: ${data.score}${trustMessage}`);
            router.push('/dashboard');
        } catch (err) {
            alert('Gönderim hatası!');
        }
    };

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
        <div className="min-h-screen bg-gray-900 text-white p-4">
            {/* Identity Verification Modal */}
            {showIdentityModal && !identityVerified && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full">
                        <h2 className="text-2xl font-bold mb-4 text-center">📸 Kimlik Doğrulama</h2>
                        <p className="text-gray-300 mb-6 text-center">
                            Sınava başlamadan önce kimliğinizi doğrulamanız gerekmektedir.
                            Lütfen yüzünüzü kameraya gösterin.
                        </p>

                        <div className="relative mb-6">
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                className="w-full rounded-lg border-2 border-blue-500"
                            />
                            <div className="absolute inset-0 border-4 border-dashed border-blue-400 rounded-lg pointer-events-none flex items-center justify-center">
                                <div className="w-48 h-48 border-2 border-blue-400 rounded-full"></div>
                            </div>
                        </div>

                        <button
                            onClick={handleIdentityVerification}
                            className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-bold transition-colors"
                        >
                            📷 Fotoğraf Çek ve Doğrula
                        </button>

                        <p className="text-xs text-gray-400 mt-4 text-center">
                            Fotoğrafınız güvenli sunucularımızda saklanacaktır.
                        </p>
                    </div>
                </div>
            )}

            {/* Proctoring Header */}
            <div className="bg-gradient-to-r from-red-900 to-red-800 p-4 rounded-lg mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        🔒 Gözetimli Sınav Modu
                        {isRecording && (
                            <span className="text-sm bg-red-600 px-2 py-1 rounded flex items-center gap-1">
                                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                KAYIT
                            </span>
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
                            className="w-40 h-30 rounded border-2 border-red-500"
                        />
                        {/* Face detection indicator */}
                        <div className={`absolute top-1 right-1 w-3 h-3 rounded-full ${faceDetected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
                        {/* Recording indicator */}
                        {isRecording && (
                            <div className="absolute bottom-1 left-1 flex items-center gap-1 bg-black/50 px-1 rounded text-xs">
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                REC
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-center gap-1">
                        <div className={`w-4 h-4 rounded-full ${webcamEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-xs">{webcamEnabled ? 'Aktif' : 'Kapalı'}</span>
                    </div>
                </div>
            </div>

            {/* Status Bar */}
            <div className="flex gap-4 mb-6">
                <div className={`flex-1 p-3 rounded-lg ${faceDetected ? 'bg-green-900' : 'bg-red-900'}`}>
                    <span className="text-sm">{faceDetected ? '✅ Yüz Algılandı' : '❌ Yüz Algılanamıyor!'}</span>
                </div>
                <div className={`flex-1 p-3 rounded-lg ${identityVerified ? 'bg-green-900' : 'bg-yellow-900'}`}>
                    <span className="text-sm">{identityVerified ? '✅ Kimlik Doğrulandı' : '⏳ Kimlik Bekleniyor'}</span>
                </div>
                <div className="flex-1 p-3 rounded-lg bg-gray-700">
                    <span className="text-sm">⚠️ Uyarı: {warnings.length}</span>
                </div>
            </div>

            {/* Warnings Panel */}
            {warnings.length > 0 && (
                <div className="bg-yellow-900/50 border border-yellow-600 p-4 rounded-lg mb-6">
                    <h3 className="font-bold mb-2 flex items-center gap-2">
                        ⚠️ Uyarılar ({warnings.length})
                        {warnings.length >= 5 && <span className="text-xs bg-red-600 px-2 py-0.5 rounded">DİKKAT!</span>}
                    </h3>
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
                                <label key={opt} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-600 p-2 rounded transition-colors">
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
                    className="w-full bg-green-600 text-white py-4 rounded-lg font-bold hover:bg-green-700 transition-colors text-lg"
                >
                    ✅ Sınavı Bitir ve Gönder
                </button>
            </div>
        </div>
    );
}
