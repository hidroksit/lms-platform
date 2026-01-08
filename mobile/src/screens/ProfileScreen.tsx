import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

export default function ProfileScreen({ route, navigation }: any) {
    const { user } = route.params || {};

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {user?.firstName?.charAt(0) || 'U'}
                    </Text>
                </View>
                <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
                <Text style={styles.role}>{user?.role?.toUpperCase() || 'ÖĞRENCİ'}</Text>
                <Text style={styles.email}>{user?.email}</Text>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>5</Text>
                    <Text style={styles.statLabel}>Dersler</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>12</Text>
                    <Text style={styles.statLabel}>Sınavlar</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>78</Text>
                    <Text style={styles.statLabel}>Ortalama</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.editButton}>
                <Text style={styles.editButtonText}>Profili Düzenle</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <Text style={styles.backButtonText}>← Geri</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111827',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 30,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#fff',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    role: {
        fontSize: 14,
        color: '#9ca3af',
        backgroundColor: '#374151',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        color: '#9ca3af',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    statCard: {
        backgroundColor: '#1f2937',
        flex: 1,
        marginHorizontal: 5,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#9ca3af',
    },
    editButton: {
        backgroundColor: '#2563eb',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    editButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    backButton: {
        padding: 15,
        alignItems: 'center',
    },
    backButtonText: {
        color: '#9ca3af',
    },
});
