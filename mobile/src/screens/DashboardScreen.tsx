import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';

const API_URL = 'http://172.17.144.1:3001';

export default function DashboardScreen({ route, navigation }: any) {
    const { user, token } = route.params || {};
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchCourses = async () => {
        try {
            const response = await fetch(`${API_URL}/api/courses`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            setCourses(data);
        } catch (error) {
            console.error('Dersler yüklenemedi:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchCourses();
    };

    const renderCourse = ({ item }: any) => (
        <TouchableOpacity style={styles.courseCard}>
            <Text style={styles.courseTitle}>{item.title}</Text>
            <Text style={styles.courseDesc}>{item.description}</Text>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.welcome}>
                    Hoşgeldin, {user?.firstName || 'Kullanıcı'}!
                </Text>
                <Text style={styles.role}>{user?.role?.toUpperCase()}</Text>
            </View>

            <Text style={styles.sectionTitle}>📚 Derslerim</Text>

            <View style={styles.menuContainer}>
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation.navigate('Profile', { user })}
                >
                    <Text style={styles.menuText}>👤 Profil</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation.navigate('Grades')}
                >
                    <Text style={styles.menuText}>📝 Notlarım</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation.navigate('OpticalReader')}
                >
                    <Text style={styles.menuText}>📷 Optik Okuyucu</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={courses}
                keyExtractor={(item: any) => item.id.toString()}
                renderItem={renderCourse}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <Text style={styles.empty}>Henüz ders bulunmuyor.</Text>
                }
            />

            <TouchableOpacity
                style={styles.logoutButton}
                onPress={() => navigation.navigate('Login')}
            >
                <Text style={styles.logoutText}>Çıkış Yap</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111827',
        padding: 16,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#111827',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        paddingTop: 40,
    },
    welcome: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    role: {
        fontSize: 12,
        color: '#9ca3af',
        backgroundColor: '#374151',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 16,
    },
    list: {
        paddingBottom: 80,
    },
    courseCard: {
        backgroundColor: '#1f2937',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    courseTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    courseDesc: {
        fontSize: 14,
        color: '#9ca3af',
    },
    empty: {
        color: '#6b7280',
        textAlign: 'center',
        marginTop: 32,
    },
    logoutButton: {
        position: 'absolute',
        bottom: 24,
        left: 16,
        right: 16,
        backgroundColor: '#dc2626',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    logoutText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    menuContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    menuItem: {
        flex: 1,
        backgroundColor: '#1f2937',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    menuText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});
