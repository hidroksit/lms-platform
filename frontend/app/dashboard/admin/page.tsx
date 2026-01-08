'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        if (user.role !== 'admin') {
            alert('Bu sayfaya sadece Admin erişebilir!');
            router.push('/dashboard');
            return;
        }

        fetch('http://localhost:3001/api/admin/dashboard/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => {
                if (!res.ok) throw new Error('API hatası');
                return res.json();
            })
            .then(data => {
                console.log('Admin Stats:', data);
                setStats(data);
            })
            .catch(err => {
                console.error(err);
                setError(err.message);
            });
    }, [router]);

    if (error) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-500">❌ Hata: {error}</p>
                <button onClick={() => router.push('/dashboard')} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">
                    ← Geri Dön
                </button>
            </div>
        );
    }

    if (!stats) return <div className="p-8 text-center text-gray-600">📊 Yükleniyor...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Admin Dashboard 📊
                    </h1>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                    >
                        ← Ana Sayfa
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
                        <div className="text-sm text-gray-500 mb-2">Toplam Kullanıcı</div>
                        <div className="text-4xl font-bold text-blue-600">{stats.totalUsers || 0}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
                        <div className="text-sm text-gray-500 mb-2">Toplam Ders</div>
                        <div className="text-4xl font-bold text-green-600">{stats.totalCourses || 0}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
                        <div className="text-sm text-gray-500 mb-2">Toplam Sınav</div>
                        <div className="text-4xl font-bold text-purple-600">{stats.totalExams || 0}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
                        <div className="text-sm text-gray-500 mb-2">Ortalama Puan</div>
                        <div className="text-4xl font-bold text-orange-600">
                            {Math.round(stats.averageScore || 0)}%
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* User Distribution */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-bold mb-4 text-gray-900">👥 Kullanıcı Dağılımı</h2>
                        <div className="space-y-3">
                            {stats.usersByRole && stats.usersByRole.length > 0 ? (
                                stats.usersByRole.map((item: any) => (
                                    <div key={item.role} className="flex justify-between items-center border-b pb-2">
                                        <span className="text-gray-700 capitalize font-medium">{item.role}</span>
                                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">
                                            {item.count}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 italic">Veri yok</p>
                            )}
                        </div>
                    </div>

                    {/* Top Students */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-bold mb-4 text-gray-900">🏆 En Başarılı Öğrenciler</h2>
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2">
                                    <th className="text-left py-2 text-gray-700">#</th>
                                    <th className="text-left py-2 text-gray-700">Öğrenci</th>
                                    <th className="text-right py-2 text-gray-700">Ortalama</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.topStudents && stats.topStudents.length > 0 ? (
                                    stats.topStudents.map((student: any, idx: number) => (
                                        <tr key={idx} className="border-b hover:bg-gray-50">
                                            <td className="py-2 text-gray-500">{idx + 1}</td>
                                            <td className="py-2 text-gray-900 font-medium">
                                                {student.student?.firstName || 'N/A'} {student.student?.lastName || ''}
                                            </td>
                                            <td className="text-right font-bold text-green-600">
                                                {Math.round(parseFloat(student.avgScore || student.dataValues?.avgScore || 0))}%
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="py-4 text-center text-gray-500 italic">
                                            Henüz sınav sonucu yok
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
