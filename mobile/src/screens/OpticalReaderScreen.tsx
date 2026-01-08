import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
    ScrollView,
    Modal,
} from 'react-native';

interface BubbleAnswer {
    questionNumber: number;
    selectedOption: string;
    confidence: number;
}

interface ScanResult {
    formId: string;
    studentId?: string;
    answers: BubbleAnswer[];
    totalQuestions: number;
    timestamp: string;
    imageUri: string;
}

export default function OpticalReaderScreen() {
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [showResultModal, setShowResultModal] = useState(false);

    // Simulated camera capture (in production, use react-native-vision-camera)
    const handleOpenCamera = async () => {
        try {
            // Placeholder for camera functionality
            Alert.alert(
                'Kamera',
                'Optik formu kameranın görüş alanına alın.\n\n4 köşe otomatik algılanacaktır.',
                [
                    { text: 'İptal', style: 'cancel' },
                    {
                        text: 'Fotoğraf Çek',
                        onPress: () => simulateCapture()
                    }
                ]
            );
        } catch (error) {
            Alert.alert('Hata', 'Kamera açılamadı');
        }
    };

    const simulateCapture = () => {
        // Simulating image capture
        const mockImageUri = 'https://via.placeholder.com/400x600/e0e0e0/333?text=Optik+Form';
        setCapturedImage(mockImageUri);
        processImage(mockImageUri);
    };

    const processImage = async (imageUri: string) => {
        setIsProcessing(true);

        try {
            // Simulate image processing delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Mock OMR processing results
            const mockResults: ScanResult = {
                formId: 'EXAM_MTH_001',
                studentId: '123456',
                answers: [
                    { questionNumber: 1, selectedOption: 'A', confidence: 0.98 },
                    { questionNumber: 2, selectedOption: 'C', confidence: 0.95 },
                    { questionNumber: 3, selectedOption: 'B', confidence: 0.92 },
                    { questionNumber: 4, selectedOption: 'D', confidence: 0.99 },
                    { questionNumber: 5, selectedOption: 'A', confidence: 0.87 },
                    { questionNumber: 6, selectedOption: 'C', confidence: 0.94 },
                    { questionNumber: 7, selectedOption: 'B', confidence: 0.96 },
                    { questionNumber: 8, selectedOption: 'A', confidence: 0.91 },
                    { questionNumber: 9, selectedOption: 'D', confidence: 0.88 },
                    { questionNumber: 10, selectedOption: 'C', confidence: 0.93 },
                ],
                totalQuestions: 10,
                timestamp: new Date().toISOString(),
                imageUri: imageUri
            };

            setScanResult(mockResults);
            setShowResultModal(true);
        } catch (error) {
            Alert.alert('Hata', 'Form işlenirken hata oluştu');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirmResults = async () => {
        if (!scanResult) return;

        try {
            // Send results to backend
            const response = await fetch('http://localhost:3001/api/optical-reader/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(scanResult)
            });

            if (response.ok) {
                Alert.alert('Başarılı', 'Sonuçlar kaydedildi!');
                resetScan();
            } else {
                throw new Error('Sunucu hatası');
            }
        } catch (error) {
            Alert.alert('Hata', 'Sonuçlar gönderilemedi');
        }
    };

    const resetScan = () => {
        setCapturedImage(null);
        setScanResult(null);
        setShowResultModal(false);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>📷 Optik Okuyucu</Text>
                <Text style={styles.subtitle}>Optik formları tarayın ve otomatik değerlendirin</Text>
            </View>

            {!capturedImage ? (
                <View style={styles.cameraPlaceholder}>
                    <View style={styles.placeholderIcon}>
                        <Text style={styles.placeholderIconText}>📄</Text>
                    </View>
                    <Text style={styles.placeholderText}>
                        Optik formu kameranın görüş alanına alın
                    </Text>
                    <Text style={styles.instructionText}>
                        • Form düz bir yüzeyde olmalı{'\n'}
                        • 4 köşe görünür olmalı{'\n'}
                        • İyi aydınlatma kullanın
                    </Text>

                    <TouchableOpacity
                        style={styles.captureButton}
                        onPress={handleOpenCamera}
                    >
                        <Text style={styles.captureButtonText}>📸 Kamerayı Aç</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: capturedImage }}
                        style={styles.capturedImage}
                        resizeMode="contain"
                    />
                    {isProcessing && (
                        <View style={styles.processingOverlay}>
                            <ActivityIndicator size="large" color="#fff" />
                            <Text style={styles.processingText}>Form işleniyor...</Text>
                            <Text style={styles.processingSubtext}>
                                • Köşeler algılanıyor{'\n'}
                                • Perspektif düzeltiliyor{'\n'}
                                • Bubble'lar okunuyor
                            </Text>
                        </View>
                    )}

                    {!isProcessing && (
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={styles.retakeButton}
                                onPress={resetScan}
                            >
                                <Text style={styles.retakeButtonText}>🔄 Yeniden Çek</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}

            {/* Results Modal */}
            <Modal
                visible={showResultModal}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>✅ Tarama Sonuçları</Text>

                        <View style={styles.resultHeader}>
                            <Text style={styles.resultInfo}>
                                Form ID: {scanResult?.formId}
                            </Text>
                            <Text style={styles.resultInfo}>
                                Öğrenci: {scanResult?.studentId || 'Belirtilmedi'}
                            </Text>
                            <Text style={styles.resultInfo}>
                                Toplam Soru: {scanResult?.totalQuestions}
                            </Text>
                        </View>

                        <ScrollView style={styles.answersContainer}>
                            {scanResult?.answers.map((answer) => (
                                <View key={answer.questionNumber} style={styles.answerRow}>
                                    <Text style={styles.questionNumber}>
                                        S{answer.questionNumber}
                                    </Text>
                                    <Text style={styles.selectedOption}>
                                        {answer.selectedOption}
                                    </Text>
                                    <View style={styles.confidenceBadge}>
                                        <Text style={styles.confidenceText}>
                                            {Math.round(answer.confidence * 100)}%
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={resetScan}
                            >
                                <Text style={styles.cancelButtonText}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={handleConfirmResults}
                            >
                                <Text style={styles.confirmButtonText}>✓ Onayla ve Kaydet</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        padding: 20,
        backgroundColor: '#2196F3',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    subtitle: {
        fontSize: 14,
        color: '#e3f2fd',
        marginTop: 5,
    },
    cameraPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    placeholderIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#e3f2fd',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    placeholderIconText: {
        fontSize: 60,
    },
    placeholderText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        marginBottom: 15,
    },
    instructionText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
    },
    captureButton: {
        backgroundColor: '#2196F3',
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 25,
    },
    captureButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    imageContainer: {
        flex: 1,
        position: 'relative',
    },
    capturedImage: {
        width: '100%',
        height: '100%',
    },
    processingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    processingText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 15,
    },
    processingSubtext: {
        color: '#ccc',
        fontSize: 14,
        marginTop: 10,
        textAlign: 'center',
        lineHeight: 22,
    },
    actionButtons: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
    },
    retakeButton: {
        backgroundColor: '#ff9800',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    retakeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    resultHeader: {
        backgroundColor: '#e3f2fd',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
    },
    resultInfo: {
        fontSize: 14,
        color: '#333',
        marginBottom: 5,
    },
    answersContainer: {
        maxHeight: 300,
    },
    answerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    questionNumber: {
        width: 50,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    selectedOption: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2196F3',
    },
    confidenceBadge: {
        backgroundColor: '#4caf50',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    confidenceText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    modalActions: {
        flexDirection: 'row',
        marginTop: 20,
        gap: 10,
    },
    cancelButton: {
        flex: 1,
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#666',
    },
    confirmButton: {
        flex: 2,
        padding: 15,
        borderRadius: 10,
        backgroundColor: '#4caf50',
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
});
