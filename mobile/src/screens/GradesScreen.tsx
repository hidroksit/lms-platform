import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const MOCK_GRADES = [
    { id: '1', exam: 'Vize Sınavı', course: 'Web Geliştirme', score: 85, date: '2025-11-10' },
    { id: '2', exam: 'Quiz 1', course: 'Veri Yapıları', score: 60, date: '2025-11-15' },
    { id: '3', exam: 'Final Sınavı', course: 'Yapay Zeka', score: 92, date: '2026-01-10' },
    { id: '4', exam: 'Proje Ödevi', course: 'Mobil Uygulama', score: 45, date: '2026-01-05' },
];

export default function GradesScreen({ navigation }: any) {
    const renderItem = ({ item }: any) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.examTitle}>{item.exam}</Text>
                <Text style={[
                    styles.score,
                    { color: item.score >= 50 ? '#10b981' : '#ef4444' }
                ]}>
                    {item.score}
                </Text>
            </View>
            <Text style={styles.courseName}>{item.course}</Text>
            <Text style={styles.date}>{item.date}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.headerTitle}>Notlarım / Karnem</Text>
            <FlatList
                data={MOCK_GRADES}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111827',
        padding: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 20,
        marginBottom: 20,
        textAlign: 'center',
    },
    list: {
        paddingBottom: 20,
    },
    card: {
        backgroundColor: '#1f2937',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    examTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    score: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    courseName: {
        fontSize: 14,
        color: '#d1d5db',
        marginBottom: 4,
    },
    date: {
        fontSize: 12,
        color: '#6b7280',
    },
});
