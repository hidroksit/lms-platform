'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VideoConferencePage() {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [participants, setParticipants] = useState([
        { id: 1, name: 'Eğitmen', isHost: true, isMuted: false },
        { id: 2, name: 'Öğrenci 1', isHost: false, isMuted: true },
        { id: 3, name: 'Öğrenci 2', isHost: false, isMuted: false },
    ]);
    const [messages, setMessages] = useState([
        { id: 1, sender: 'Eğitmen', text: 'Herkese merhaba! Derse başlıyoruz.', time: '10:00' },
        { id: 2, sender: 'Öğrenci 1', text: 'Merhaba hocam!', time: '10:01' },
    ]);
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        // Start webcam
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                .then(stream => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                    setIsConnected(true);
                })
                .catch(err => {
                    console.error('Kamera erişimi reddedildi:', err);
                });
        }

        return () => {
            // Cleanup
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const toggleMute = () => setIsMuted(!isMuted);
    const toggleVideo = () => setIsVideoOn(!isVideoOn);

    const shareScreen = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setIsScreenSharing(true);
        } catch (err) {
            console.error('Ekran paylaşımı başarısız:', err);
        }
    };

    const sendMessage = () => {
        if (newMessage.trim()) {
            setMessages([...messages, {
                id: messages.length + 1,
                sender: 'Ben',
                text: newMessage,
                time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
            }]);
            setNewMessage('');
        }
    };

    const endCall = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
        router.push('/dashboard');
    };

    return (
        <div className="h-screen bg-gray-900 flex">
            {/* Main Video Area */}
            <div className="flex-1 flex flex-col">
                {/* Video Grid */}
                <div className="flex-1 p-4 grid grid-cols-2 gap-4">
                    {/* Main Video */}
                    <div className="col-span-2 bg-gray-800 rounded-lg overflow-hidden relative">
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className={`w-full h-full object-cover ${!isVideoOn ? 'hidden' : ''}`}
                        />
                        {!isVideoOn && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                                    B
                                </div>
                            </div>
                        )}
                        <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded text-white text-sm">
                            Ben {isMuted && '🔇'}
                        </div>
                        {isScreenSharing && (
                            <div className="absolute top-4 left-4 bg-red-600 px-3 py-1 rounded text-white text-sm">
                                📺 Ekran Paylaşılıyor
                            </div>
                        )}
                    </div>

                    {/* Participant Thumbnails */}
                    {participants.slice(0, 4).map(p => (
                        <div key={p.id} className="bg-gray-800 rounded-lg flex items-center justify-center relative">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold ${p.isHost ? 'bg-purple-600' : 'bg-green-600'
                                }`}>
                                {p.name.charAt(0)}
                            </div>
                            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-xs">
                                {p.name} {p.isHost && '👑'} {p.isMuted && '🔇'}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Controls */}
                <div className="bg-gray-800 p-4 flex items-center justify-center space-x-4">
                    <button
                        onClick={toggleMute}
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${isMuted ? 'bg-red-600' : 'bg-gray-600 hover:bg-gray-500'
                            }`}
                    >
                        {isMuted ? '🔇' : '🎤'}
                    </button>
                    <button
                        onClick={toggleVideo}
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${!isVideoOn ? 'bg-red-600' : 'bg-gray-600 hover:bg-gray-500'
                            }`}
                    >
                        {isVideoOn ? '📹' : '📷'}
                    </button>
                    <button
                        onClick={shareScreen}
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${isScreenSharing ? 'bg-green-600' : 'bg-gray-600 hover:bg-gray-500'
                            }`}
                    >
                        📺
                    </button>
                    <button
                        onClick={endCall}
                        className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center"
                    >
                        📞
                    </button>
                </div>
            </div>

            {/* Sidebar - Chat & Participants */}
            <div className="w-80 bg-gray-800 flex flex-col">
                {/* Participants */}
                <div className="p-4 border-b border-gray-700">
                    <h3 className="text-white font-semibold mb-3">👥 Katılımcılar ({participants.length})</h3>
                    <div className="space-y-2">
                        {participants.map(p => (
                            <div key={p.id} className="flex items-center justify-between text-sm">
                                <span className="text-gray-300">
                                    {p.name} {p.isHost && <span className="text-yellow-500">👑</span>}
                                </span>
                                <span>{p.isMuted ? '🔇' : '🎤'}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat */}
                <div className="flex-1 flex flex-col">
                    <div className="p-4 border-b border-gray-700">
                        <h3 className="text-white font-semibold">💬 Sohbet</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.map(msg => (
                            <div key={msg.id} className="text-sm">
                                <div className="flex items-center space-x-2">
                                    <span className="font-semibold text-blue-400">{msg.sender}</span>
                                    <span className="text-gray-500 text-xs">{msg.time}</span>
                                </div>
                                <p className="text-gray-300">{msg.text}</p>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 border-t border-gray-700">
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                placeholder="Mesaj yazın..."
                                className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={sendMessage}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                ➤
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
