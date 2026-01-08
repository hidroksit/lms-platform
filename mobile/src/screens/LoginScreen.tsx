import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from 'react-native';

const API_URL = 'http://172.17.144.1:3001'; // User's Local IP for real device testing

export default function LoginScreen({ navigation }: any) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Hata', 'E-posta ve şifre gereklidir.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // In a real app, store token securely (AsyncStorage/SecureStore)
                Alert.alert('Başarılı', `Hoşgeldin ${data.user.firstName}!`);
                navigation.navigate('Dashboard', { user: data.user, token: data.token });
            } else {
                Alert.alert('Hata', data.message || 'Giriş başarısız.');
            }
        } catch (error) {
            Alert.alert('Bağlantı Hatası', 'Sunucuya bağlanılamadı. Backend çalışıyor mu?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🎓 LMS Platform</Text>
            <Text style={styles.subtitle}>Mobil Giriş</Text>

            <TextInput
                style={styles.input}
                placeholder="E-posta"
                placeholderTextColor="#888"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <TextInput
                style={styles.input}
                placeholder="Şifre"
                placeholderTextColor="#888"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Giriş Yap</Text>
                )}
            </TouchableOpacity>

            <Text style={styles.hint}>Test: admin@lms.com / admin123</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1f2937',
        justifyContent: 'center',
        padding: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#9ca3af',
        textAlign: 'center',
        marginBottom: 32,
    },
    input: {
        backgroundColor: '#374151',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        color: '#fff',
        fontSize: 16,
    },
    button: {
        backgroundColor: '#3b82f6',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#6b7280',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    hint: {
        marginTop: 24,
        color: '#6b7280',
        textAlign: 'center',
        fontSize: 12,
    },
});
