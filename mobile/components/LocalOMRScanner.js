
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    Alert,
    ActivityIndicator,
    Dimensions,
    PanResponder,
    Animated,
    SafeAreaView
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Buffer } from 'buffer';
import jpeg from 'jpeg-js';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// --- CONSTANTS ---
const OPTIONS = ['A', 'B', 'C', 'D', 'E']; // Updated to 5 options based on project requirements

// --- MATH ENGINE ---
function b64ToU8(b64) {
    const buf = Buffer.from(b64, 'base64');
    return new Uint8Array(buf);
}

function grayAt(rgba, w, h, x, y) {
    const xx = Math.floor(Math.max(0, Math.min(w - 1, x)));
    const yy = Math.floor(Math.max(0, Math.min(h - 1, y)));
    const i = (yy * w + xx) * 4;
    return 0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2];
}

function regionMeanGray(rgba, w, h, cx, cy, r) {
    let sum = 0, cnt = 0;
    const rr = r * r;
    const x0 = Math.floor(cx - r), x1 = Math.ceil(cx + r);
    const y0 = Math.floor(cy - r), y1 = Math.ceil(cy + r);

    for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
            if ((x - cx) ** 2 + (y - cy) ** 2 <= rr) {
                sum += grayAt(rgba, w, h, x, y);
                cnt++;
            }
        }
    }
    return cnt ? sum / cnt : 255;
}

function getProjectedPoint(corners, u, v) {
    const { tl, tr, bl, br } = corners;
    const topX = tl.x + (tr.x - tl.x) * u;
    const topY = tl.y + (tr.y - tl.y) * u;
    const botX = bl.x + (br.x - bl.x) * u;
    const botY = bl.y + (br.y - bl.y) * u;
    const x = topX + (botX - topX) * v;
    const y = topY + (botY - topY) * v;
    return { x, y };
}

// --- AUTO CORNER DETECTION ---
function findSmartCorner(rgba, w, h, corner) {
    const W2 = Math.floor(w / 2);
    const H2 = Math.floor(h / 2);

    let startX = 0, endX = W2, startY = 0, endY = H2;
    if (corner === 'tr') { startX = W2; endX = w; }
    if (corner === 'bl') { startY = H2; endY = h; }
    if (corner === 'br') { startX = W2; endX = w; startY = H2; endY = h; }

    const step = 4;
    const threshold = 100;

    let bestX = 0, bestY = 0, maxScore = 0;

    for (let y = startY; y < endY; y += step) {
        for (let x = startX; x < endX; x += step) {
            if (grayAt(rgba, w, h, x, y) < threshold) {
                let boxScore = 0;
                const boxSize = 10;
                for (let by = -boxSize; by <= boxSize; by += 5) {
                    for (let bx = -boxSize; bx <= boxSize; bx += 5) {
                        if (grayAt(rgba, w, h, x + bx, y + by) < threshold) boxScore++;
                    }
                }
                if (boxScore > maxScore) {
                    maxScore = boxScore;
                    bestX = x;
                    bestY = y;
                }
            }
        }
    }

    if (maxScore < 5) return null;
    return { x: bestX, y: bestY };
}

// --- DRAGGABLE POINT COMPONENT ---
const DraggablePoint = ({ initialPos, onDrag, color = '#F59E0B' }) => {
    const pan = useRef(new Animated.ValueXY({ x: initialPos.x, y: initialPos.y })).current;

    useEffect(() => {
        pan.setValue({ x: initialPos.x, y: initialPos.y });
    }, [initialPos]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                pan.setOffset({
                    x: pan.x._value,
                    y: pan.y._value,
                });
                pan.setValue({ x: 0, y: 0 });
            },
            onPanResponderMove: (e, gesture) => {
                Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false })(e, gesture);
                onDrag({
                    x: pan.x._offset + gesture.dx,
                    y: pan.y._offset + gesture.dy
                });
            },
            onPanResponderRelease: () => {
                pan.flattenOffset();
            },
        })
    ).current;

    return (
        <Animated.View
            style={{
                transform: [{ translateX: pan.x }, { translateY: pan.y }],
                position: 'absolute',
                top: -30, left: -30,
                width: 60, height: 60, // Larger hit area
                justifyContent: 'center', alignItems: 'center',
                zIndex: 999
            }}
            {...panResponder.panHandlers}
        >
            <View style={{
                width: 28, height: 28, borderRadius: 14,
                backgroundColor: color, borderWidth: 3, borderColor: '#fff',
                shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.5, shadowRadius: 4
            }} />
        </Animated.View>
    );
};

// --- MAIN COMPONENT ---
const LocalOMRScanner = ({ onScanComplete, onCancel, answerKey = {}, qCount = 20 }) => {
    // Determine actual qCount based on answerKey if provided
    const actualQCount = Object.keys(answerKey).length > 0 ? Object.keys(answerKey).length : qCount;

    if (typeof globalThis !== 'undefined') {
        globalThis.Buffer = globalThis.Buffer ?? Buffer;
    }

    const [permission, requestPermission] = useCameraPermissions();
    const [cameraRef, setCameraRef] = useState(null);

    const [step, setStep] = useState('camera'); // camera | crop | result
    const [imageUri, setImageUri] = useState(null);
    const [imgDims, setImgDims] = useState(null);
    const [viewDims, setViewDims] = useState(null);
    const [corners, setCorners] = useState(null);
    const [imageData, setImageData] = useState(null);
    const [answers, setAnswers] = useState(null);
    const [score, setScore] = useState(null);
    const [loading, setLoading] = useState(false);
    const [flashMode, setFlashMode] = useState('off');

    useEffect(() => {
        if (!permission) requestPermission();
    }, [permission]);

    const handleImage = async (uri) => {
        setLoading(true);
        try {
            const manip = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width: 800 } }],
                { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
            );

            const screenW = SCREEN_WIDTH;
            const scale = screenW / manip.width;
            const viewH = manip.height * scale;

            setImageUri(manip.uri);
            setImgDims({ w: manip.width, h: manip.height });
            setViewDims({ w: screenW, h: viewH });

            const bytes = b64ToU8(manip.base64);
            const decoded = jpeg.decode(bytes, { useTArray: true });
            setImageData({ data: decoded.data, w: decoded.width, h: decoded.height });

            const tl = findSmartCorner(decoded.data, decoded.width, decoded.height, 'tl');
            const tr = findSmartCorner(decoded.data, decoded.width, decoded.height, 'tr');
            const bl = findSmartCorner(decoded.data, decoded.width, decoded.height, 'bl');
            const br = findSmartCorner(decoded.data, decoded.width, decoded.height, 'br');

            if (tl && tr && bl && br) {
                setCorners({
                    tl: { x: tl.x * scale, y: tl.y * scale },
                    tr: { x: tr.x * scale, y: tr.y * scale },
                    bl: { x: bl.x * scale, y: bl.y * scale },
                    br: { x: br.x * scale, y: br.y * scale }
                });
            } else {
                const margin = 40;
                setCorners({
                    tl: { x: margin, y: margin },
                    tr: { x: screenW - margin, y: margin },
                    bl: { x: margin, y: viewH - margin },
                    br: { x: screenW - margin, y: viewH - margin }
                });
            }

            setStep('crop');
        } catch (e) {
            Alert.alert('Hata', 'Görüntü işlenemedi: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const takePhoto = async () => {
        if (cameraRef) {
            const p = await cameraRef.takePictureAsync({ quality: 0.8 });
            handleImage(p.uri);
        }
    };

    const pickImage = async () => {
        const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
        if (!r.canceled) handleImage(r.assets[0].uri);
    };

    const runAnalysis = () => {
        if (!imageData || !corners || !viewDims || !imgDims) return;
        setLoading(true);

        setTimeout(() => {
            try {
                const scale = imgDims.w / viewDims.w;
                const pixelCorners = {
                    tl: { x: corners.tl.x * scale, y: corners.tl.y * scale },
                    tr: { x: corners.tr.x * scale, y: corners.tr.y * scale },
                    bl: { x: corners.bl.x * scale, y: corners.bl.y * scale },
                    br: { x: corners.br.x * scale, y: corners.br.y * scale }
                };

                const result = analyzeOMR(imageData.data, imageData.w, imageData.h, pixelCorners, actualQCount);

                setAnswers(result.answers);

                // If answer key exists, calculate score
                if (Object.keys(answerKey).length > 0) {
                    calculateScore(result.answers);
                }

                setStep('result');

            } catch (e) {
                Alert.alert('Analiz Hatası', e.message);
            } finally {
                setLoading(false);
            }
        }, 100);
    };

    const analyzeOMR = (rgba, w, h, c, qCount) => {
        const answers = {};
        // 5 OPTIONS: A, B, C, D, E. Positions adjusted to spread across width
        const colPositions = [0.18, 0.34, 0.50, 0.66, 0.82];
        const rowStart = 0.10;
        const rowEnd = 0.95;
        const rowHeight = (rowEnd - rowStart) / (qCount - 1);

        const markerW = Math.abs(c.tr.x - c.tl.x);
        const radius = markerW * 0.02; // Slightly smaller radius for 5 cols

        for (let q = 0; q < qCount; q++) {
            const v = rowStart + (q * rowHeight);
            let minVal = 255;
            let minIdx = -1;
            let vals = [];

            OPTIONS.forEach((opt, idx) => {
                const u = colPositions[idx];
                const pt = getProjectedPoint(c, u, v);
                const val = regionMeanGray(rgba, w, h, pt.x, pt.y, radius);
                vals.push(val);
                if (val < minVal) { minVal = val; minIdx = idx; }
            });

            const sorted = [...vals].sort((a, b) => a - b);
            // Dynamic thresholding
            if (sorted[0] < 180 && (sorted[1] - sorted[0] > 15)) {
                answers[(q + 1).toString()] = OPTIONS[minIdx];
            } else {
                answers[(q + 1).toString()] = null;
            }
        }
        return { answers };
    };

    const calculateScore = (userAns) => {
        let c = 0, w = 0, e = 0;
        Object.keys(answerKey).forEach(k => {
            const u = userAns[k];
            const r = answerKey[k];
            if (!u) e++; else if (u === r) c++; else w++;
        });
        setScore({ correct: c, wrong: w, empty: e });
    };

    const handleComplete = () => {
        if (onScanComplete && answers) {
            onScanComplete({
                answers,
                score,
                imageUri
            });
        }
    };

    const renderGridPreview = () => {
        if (!corners || !viewDims) return null;
        const dots = [];
        // 5 OPTIONS
        const colPositions = [0.18, 0.34, 0.50, 0.66, 0.82];
        const rowStart = 0.10;
        const rowEnd = 0.95;
        const rowHeight = (rowEnd - rowStart) / (actualQCount - 1);

        for (let q = 0; q < actualQCount; q++) {
            const v = rowStart + (q * rowHeight);
            for (let i = 0; i < OPTIONS.length; i++) {
                const u = colPositions[i];
                const pt = getProjectedPoint(corners, u, v);
                dots.push(
                    <View key={`${q}-${i}`} style={{
                        position: 'absolute',
                        left: pt.x - 1.5, top: pt.y - 1.5,
                        width: 3, height: 3, borderRadius: 1.5,
                        backgroundColor: 'rgba(52, 211, 153, 0.6)'
                    }} />
                );
            }
        }
        return dots;
    };

    // === CAMERA SCREEN ===
    if (step === 'camera') {
        if (!permission?.granted) {
            return (
                <View style={[styles.container, { justifyContent: 'center' }]}>
                    <Text style={styles.permissionText}>Kamera izni gerekli</Text>
                    <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
                        <Text style={styles.buttonText}>İzin Ver</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#0f0f23' }}>
                <CameraView ref={setCameraRef} style={{ flex: 1 }} facing="back" flash={flashMode}>
                    <View style={styles.headerBar}>
                        <TouchableOpacity onPress={onCancel} style={styles.iconButton}>
                            <Text style={styles.iconText}>✕</Text>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Optik Tarama</Text>
                        <TouchableOpacity onPress={() => setFlashMode(flashMode === 'off' ? 'on' : 'off')} style={styles.iconButton}>
                            <Text style={styles.iconText}>{flashMode === 'off' ? '⚡' : '🔦'}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.scanOverlay}>
                        <View style={styles.scanBorder} />
                        <Text style={styles.scanInstruction}>Formu çerçevenin içine hizalayın</Text>
                    </View>

                    <View style={styles.footerBar}>
                        <TouchableOpacity style={styles.secondaryButton} onPress={pickImage}>
                            <Text style={styles.secondaryButtonText}>🖼️ Galeri</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={takePhoto} style={styles.captureButton}>
                            <View style={styles.captureInner} />
                        </TouchableOpacity>

                        <View style={{ width: 60 }} />
                    </View>
                </CameraView>

                {loading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#6366f1" />
                        <Text style={styles.loadingText}>İşleniyor...</Text>
                    </View>
                )}
            </SafeAreaView>
        );
    }

    // === CROP SCREEN ===
    if (step === 'crop' && imageUri) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#0f0f23' }}>
                <View style={styles.headerBar}>
                    <TouchableOpacity onPress={() => setStep('camera')} style={styles.iconButton}>
                        <Text style={styles.iconText}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Köşe Ayarı</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.cropContainer}>
                    <View style={{ width: viewDims.w, height: viewDims.h, position: 'relative' }}>
                        <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%', borderRadius: 8 }} />

                        {renderGridPreview()}

                        <DraggablePoint initialPos={corners.tl} color="#F59E0B" onDrag={(p) => setCorners(prev => ({ ...prev, tl: p }))} />
                        <DraggablePoint initialPos={corners.tr} color="#F59E0B" onDrag={(p) => setCorners(prev => ({ ...prev, tr: p }))} />
                        <DraggablePoint initialPos={corners.bl} color="#F59E0B" onDrag={(p) => setCorners(prev => ({ ...prev, bl: p }))} />
                        <DraggablePoint initialPos={corners.br} color="#F59E0B" onDrag={(p) => setCorners(prev => ({ ...prev, br: p }))} />
                    </View>
                </View>

                <View style={styles.footerSingleParams}>
                    <Text style={styles.instructionSmall}>Köşeleri formun siyah karelerine sürükleyin</Text>
                    <TouchableOpacity style={styles.primaryButton} onPress={runAnalysis} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>✓ Onayla ve Tara</Text>}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // === RESULTS SCREEN ===
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0f0f23' }}>
            <View style={styles.headerBar}>
                <Text style={styles.headerTitle}>Sonuçlar</Text>
            </View>

            <ScrollView contentContainerStyle={styles.resultContent}>
                {score && (
                    <View style={styles.scoreContainer}>
                        <View style={[styles.scoreBox, { borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                            <Text style={[styles.scoreValue, { color: '#10b981' }]}>{score.correct}</Text>
                            <Text style={styles.scoreLabel}>Doğru</Text>
                        </View>
                        <View style={[styles.scoreBox, { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                            <Text style={[styles.scoreValue, { color: '#ef4444' }]}>{score.wrong}</Text>
                            <Text style={styles.scoreLabel}>Yanlış</Text>
                        </View>
                        <View style={[styles.scoreBox, { borderColor: '#6b7280', backgroundColor: 'rgba(107, 114, 128, 0.1)' }]}>
                            <Text style={[styles.scoreValue, { color: '#9ca3af' }]}>{score.empty}</Text>
                            <Text style={styles.scoreLabel}>Boş</Text>
                        </View>
                    </View>
                )}

                <View style={styles.answersCard}>
                    <Text style={styles.cardTitle}>📝 Cevap Anahtarı</Text>
                    <View style={styles.gridContainer}>
                        {Object.entries(answers).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).map(([q, ans]) => {
                            const realAns = answerKey[q];
                            const isCorrect = ans && ans === realAns;
                            const isWrong = ans && ans !== realAns;

                            return (
                                <View key={q} style={styles.answerRow}>
                                    <Text style={styles.qNum}>{q}.</Text>
                                    <View style={[
                                        styles.bubble,
                                        isCorrect && styles.bubbleCorrect,
                                        isWrong && styles.bubbleWrong,
                                        !ans && styles.bubbleEmpty
                                    ]}>
                                        <Text style={[styles.bubbleText, !ans && { color: '#6b7280' }]}>{ans || '-'}</Text>
                                    </View>
                                    {isWrong && realAns && (
                                        <Text style={styles.correction}>→ {realAns}</Text>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                </View>

                <View style={styles.actionButtons}>
                    <TouchableOpacity style={[styles.secondaryButton, { flex: 1 }]} onPress={() => setStep('camera')}>
                        <Text style={styles.secondaryButtonText}>🔄 Yeni Tara</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.primaryButton, { flex: 1 }]} onPress={handleComplete}>
                        <Text style={styles.buttonText}>💾 Kaydet</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f0f23' },
    // Header
    headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#181829', zIndex: 10 },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    iconButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2a2a3d', borderRadius: 20 },
    iconText: { color: '#fff', fontSize: 18 },

    // Permission
    permissionText: { color: '#fff', fontSize: 18, marginBottom: 20, textAlign: 'center' },

    // Camera
    scanOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scanBorder: { width: '85%', height: '70%', borderWidth: 2, borderColor: '#6366f1', borderRadius: 16, borderStyle: 'dashed' },
    scanInstruction: { color: '#e0e7ff', marginTop: 20, fontSize: 16, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 8 },
    footerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 40, backgroundColor: '#181829' },
    captureButton: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#6366f1', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(99, 102, 241, 0.2)' },
    captureInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#6366f1' },

    // Loading
    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,15,35,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
    loadingText: { color: '#fff', marginTop: 16, fontSize: 16 },

    // Crop
    cropContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    footerSingleParams: { padding: 20, backgroundColor: '#181829', alignItems: 'center' },
    instructionSmall: { color: '#9ca3af', marginBottom: 16, fontSize: 14 },

    // Results
    resultContent: { padding: 20 },
    scoreContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    scoreBox: { flex: 1, alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginHorizontal: 4 },
    scoreValue: { fontSize: 28, fontWeight: 'bold' },
    scoreLabel: { fontSize: 12, color: '#9ca3af', marginTop: 4, textTransform: 'uppercase' },

    answersCard: { backgroundColor: '#1e1e32', borderRadius: 16, padding: 16, marginBottom: 24 },
    cardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    answerRow: { width: '18%', alignItems: 'center', marginBottom: 16 },
    qNum: { color: '#6b7280', fontSize: 12, marginBottom: 4 },
    bubble: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#374151', backgroundColor: '#111827' },
    bubbleText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    bubbleCorrect: { borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.2)' },
    bubbleWrong: { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.2)' },
    bubbleEmpty: { borderColor: '#374151', backgroundColor: '#1f2937' },
    correction: { color: '#10b981', fontSize: 10, marginTop: 2, fontWeight: 'bold' },

    actionButtons: { flexDirection: 'row', gap: 16, marginBottom: 40 },

    // Common Buttons
    primaryButton: { backgroundColor: '#6366f1', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    secondaryButton: { backgroundColor: '#2a2a3d', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#3f3f46' },
    secondaryButtonText: { color: '#e0e7ff', fontWeight: '600', fontSize: 15 }
});

export default LocalOMRScanner;
