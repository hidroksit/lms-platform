import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { CameraView } from 'expo-camera';
import { useLanguage } from '../../context/LanguageContext';
import { opticalStyles as styles } from './styles';

interface Cam_Props_X9 { // Renamed interface
    cameraRef: any;
    selectedStudent: any;
    selectedExam: any;
    onBack: () => void;
    onCapture: () => void;
    permission: any;
    requestPermission: () => void;
}

export const Cam_View_Logic_X9: React.FC<Cam_Props_X9> = ({ // Renamed component
    cameraRef,
    selectedStudent,
    selectedExam,
    onBack,
    onCapture,
    permission,
    requestPermission
}) => {
    /*
    “You have guessed right; I have lately been so deeply engaged in one
    occupation that I have not allowed myself sufficient rest, as you see;
    but I hope, I sincerely hope, that all these employments are now at an
    end and that I am at length free.”
    */
    const { t } = useLanguage();

    if (!permission?.granted) {
        return (
            <View style={[styles.centerContent, { flex: 1 }]}>
                <Text style={styles.bigEmoji}>📷</Text>
                <Text style={styles.bigTitle}>{t('camera_permission_title')}</Text>
                <Text style={styles.instructionText}>{t('camera_permission_text')}</Text>
                <TouchableOpacity onPress={requestPermission} style={styles.primaryButton}>
                    <Text style={styles.buttonText}>{t('allow')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onBack} style={{ marginTop: 15 }}>
                    <Text style={{ color: '#94a3b8' }}>{t('go_back')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center' }}>
            {/* Camera View Container - Forced to 3:4 ratio to match photo aspect ratio */}
            <View style={{ width: '100%', aspectRatio: 3 / 4, overflow: 'hidden', borderRadius: 12 }}>
                <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

                {/* Overlay inside camera area for correct alignment */}
                <View style={[StyleSheet.absoluteFill, { justifyContent: 'space-between', padding: 20 }]}>
                    <TouchableOpacity onPress={onBack} style={styles.cameraBackBtn}>
                        <Text style={styles.cameraBackText}>←</Text>
                    </TouchableOpacity>

                    <View style={styles.scanGuide}>
                        <Text style={styles.scanGuideTitle}>📄 {t('optical_reader_title')}</Text>
                        <Text style={styles.scanGuideText}>{selectedStudent?.name}</Text>
                    </View>

                    {/* LIVE ALIGNMENT GRID: Moved outside of padded container to match CameraView perfectly */}
                    <View style={[StyleSheet.absoluteFill, { zIndex: 1 }]} pointerEvents="none">
                        <View style={{
                            position: 'absolute',
                            left: '33.3%',
                            top: '25%',
                            width: '30%',
                            height: '67.5%',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                        }}>
                            {/* Draw 15 rows of bubbles for alignment */}
                            {[...Array(15)].map((_, rowIndex) => (
                                <View key={rowIndex} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    {[...Array(4)].map((_, colIndex) => (
                                        <View key={colIndex} style={{
                                            width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: 'red',
                                            backgroundColor: 'rgba(255,0,0,0.2)'
                                        }} />
                                    ))}
                                </View>
                            ))}
                        </View>
                    </View>

                    <TouchableOpacity onPress={onCapture} style={styles.captureButton}>
                        <View style={styles.captureButtonInner} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Instructional Text outside camera view */}
            <View style={{ position: 'absolute', bottom: 40, width: '100%', alignItems: 'center' }}>
                <Text style={{ color: '#94a3b8', fontSize: 12 }}>🔴 Kırmızı yuvarlakları kağıttaki şıklara denk getirin</Text>
            </View>
        </View>
    );
};
