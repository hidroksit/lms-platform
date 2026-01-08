import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, StatusBar } from 'react-native';

export default function App() {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#16213e" />

            <View style={styles.header}>
                <Text style={styles.logo}>📚</Text>
                <Text style={styles.title}>LMS Platform</Text>
                <Text style={styles.subtitle}>Öğrenim Yönetim Sistemi</Text>
            </View>

            <ScrollView style={styles.content}>
                <Text style={styles.welcome}>Hoş Geldiniz!</Text>
                <Text style={styles.desc}>Mobil uygulama başarıyla çalışıyor.</Text>

                <View style={styles.menuGrid}>
                    <TouchableOpacity style={styles.menuCard}>
                        <Text style={styles.menuIcon}>📖</Text>
                        <Text style={styles.menuText}>Derslerim</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuCard}>
                        <Text style={styles.menuIcon}>📝</Text>
                        <Text style={styles.menuText}>Sınavlar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuCard}>
                        <Text style={styles.menuIcon}>📷</Text>
                        <Text style={styles.menuText}>Optik Okuyucu</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuCard}>
                        <Text style={styles.menuIcon}>📊</Text>
                        <Text style={styles.menuText}>Notlarım</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuCard}>
                        <Text style={styles.menuIcon}>👤</Text>
                        <Text style={styles.menuText}>Profil</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuCard}>
                        <Text style={styles.menuIcon}>⚙️</Text>
                        <Text style={styles.menuText}>Ayarlar</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <Text style={styles.footerText}>LMS Platform v1.0</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    header: {
        padding: 30,
        alignItems: 'center',
        backgroundColor: '#16213e',
        borderBottomWidth: 1,
        borderBottomColor: '#0f3460',
    },
    logo: {
        fontSize: 48,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 10,
    },
    subtitle: {
        fontSize: 14,
        color: '#4cc9f0',
        marginTop: 5,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    welcome: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#4cc9f0',
        textAlign: 'center',
        marginBottom: 10,
    },
    desc: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginBottom: 30,
    },
    menuGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    menuCard: {
        width: '48%',
        backgroundColor: '#16213e',
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#0f3460',
    },
    menuIcon: {
        fontSize: 36,
        marginBottom: 10,
    },
    menuText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    footer: {
        padding: 15,
        alignItems: 'center',
        backgroundColor: '#16213e',
    },
    footerText: {
        color: '#666',
        fontSize: 12,
    },
});
