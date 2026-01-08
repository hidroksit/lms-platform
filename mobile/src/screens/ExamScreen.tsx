import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    AppState,
    AppStateStatus,
    BackHandler,
} from 'react-native';

interface Question {
    id: number;
    text: string;
    type: 'multiple_choice' | 'true_false' | 'short_answer';
    options?: string[];
    correctAnswer?: string;
}

interface ExamScreenProps {
    examId: string;
    examTitle: string;
    duration: number; // minutes
    questions: Question[];
    onSubmit: (answers: Record<number, string>, violations: string[]) => void;
    onExit: () => void;
}

const ExamScreen: React.FC<ExamScreenProps> = ({
    examId,
    examTitle,
    duration,
    questions,
    onSubmit,
    onExit,
}) => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [timeRemaining, setTimeRemaining] = useState(duration * 60);
    const [violations, setViolations] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const appState = useRef(AppState.currentState);

    // Timer
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleAutoSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // App state monitoring (anti-cheat)
    useEffect(() => {
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
                // User switched away from the app
                const violation = `⚠️ Uygulama değişikliği tespit edildi! (${new Date().toLocaleTimeString()})`;
                setViolations((prev) => [...prev, violation]);

                Alert.alert(
                    '⚠️ Uyarı!',
                    'Sınav sırasında uygulamadan ayrıldınız. Bu durum kaydedildi.',
                    [{ text: 'Tamam' }]
                );
            }
            appState.current = nextAppState;
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription?.remove();
    }, []);

    // Block back button
    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            Alert.alert(
                'Sınavdan Çıkış',
                'Sınavdan çıkmak istediğinize emin misiniz? Cevaplarınız kaydedilmeyecek.',
                [
                    { text: 'İptal', style: 'cancel' },
                    { text: 'Çık', style: 'destructive', onPress: onExit },
                ]
            );
            return true;
        });

        return () => backHandler.remove();
    }, [onExit]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAutoSubmit = () => {
        Alert.alert('⏱️ Süre Doldu!', 'Sınav süreniz doldu. Cevaplarınız gönderiliyor.');
        handleSubmit();
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        const answeredCount = Object.keys(answers).length;
        const totalCount = questions.length;

        if (answeredCount < totalCount) {
            Alert.alert(
                'Eksik Cevaplar',
                `${totalCount - answeredCount} soru cevaplanmadı. Yine de göndermek istiyor musunuz?`,
                [
                    { text: 'İptal', style: 'cancel', onPress: () => setIsSubmitting(false) },
                    { text: 'Gönder', onPress: () => onSubmit(answers, violations) },
                ]
            );
        } else {
            onSubmit(answers, violations);
        }
    };

    const selectAnswer = (questionId: number, answer: string) => {
        setAnswers((prev) => ({ ...prev, [questionId]: answer }));
    };

    const goToQuestion = (index: number) => {
        if (index >= 0 && index < questions.length) {
            setCurrentQuestion(index);
        }
    };

    const question = questions[currentQuestion];
    const isLastQuestion = currentQuestion === questions.length - 1;
    const isTimeWarning = timeRemaining < 300; // Less than 5 minutes

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.examTitle} numberOfLines={1}>{examTitle}</Text>
                    <Text style={styles.questionCount}>
                        Soru {currentQuestion + 1} / {questions.length}
                    </Text>
                </View>
                <View style={[styles.timerContainer, isTimeWarning && styles.timerWarning]}>
                    <Text style={styles.timerIcon}>⏱️</Text>
                    <Text style={[styles.timer, isTimeWarning && styles.timerTextWarning]}>
                        {formatTime(timeRemaining)}
                    </Text>
                </View>
            </View>

            {/* Violation Banner */}
            {violations.length > 0 && (
                <View style={styles.violationBanner}>
                    <Text style={styles.violationText}>
                        ⚠️ {violations.length} uyarı kaydedildi
                    </Text>
                </View>
            )}

            {/* Question Navigation */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.navContainer}>
                {questions.map((_, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.navButton,
                            index === currentQuestion && styles.navButtonActive,
                            answers[questions[index].id] && styles.navButtonAnswered,
                        ]}
                        onPress={() => goToQuestion(index)}
                    >
                        <Text style={[
                            styles.navButtonText,
                            (index === currentQuestion || answers[questions[index].id]) && styles.navButtonTextActive
                        ]}>
                            {index + 1}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Question Content */}
            <ScrollView style={styles.questionContainer}>
                <Text style={styles.questionText}>{question.text}</Text>

                {question.type === 'multiple_choice' && question.options && (
                    <View style={styles.optionsContainer}>
                        {question.options.map((option, index) => {
                            const optionLetter = String.fromCharCode(65 + index);
                            const isSelected = answers[question.id] === optionLetter;

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.option, isSelected && styles.optionSelected]}
                                    onPress={() => selectAnswer(question.id, optionLetter)}
                                >
                                    <View style={[styles.optionCircle, isSelected && styles.optionCircleSelected]}>
                                        <Text style={[styles.optionLetter, isSelected && styles.optionLetterSelected]}>
                                            {optionLetter}
                                        </Text>
                                    </View>
                                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                                        {option}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {question.type === 'true_false' && (
                    <View style={styles.trueFalseContainer}>
                        <TouchableOpacity
                            style={[styles.trueFalseButton, answers[question.id] === 'true' && styles.trueFalseSelected]}
                            onPress={() => selectAnswer(question.id, 'true')}
                        >
                            <Text style={styles.trueFalseText}>✓ Doğru</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.trueFalseButton, answers[question.id] === 'false' && styles.trueFalseSelected]}
                            onPress={() => selectAnswer(question.id, 'false')}
                        >
                            <Text style={styles.trueFalseText}>✗ Yanlış</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* Navigation Buttons */}
            <View style={styles.navButtons}>
                <TouchableOpacity
                    style={[styles.navBtn, currentQuestion === 0 && styles.navBtnDisabled]}
                    onPress={() => goToQuestion(currentQuestion - 1)}
                    disabled={currentQuestion === 0}
                >
                    <Text style={styles.navBtnText}>← Önceki</Text>
                </TouchableOpacity>

                {isLastQuestion ? (
                    <TouchableOpacity
                        style={[styles.navBtn, styles.submitBtn]}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                    >
                        <Text style={styles.submitBtnText}>
                            {isSubmitting ? 'Gönderiliyor...' : '✓ Sınavı Bitir'}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.navBtn}
                        onPress={() => goToQuestion(currentQuestion + 1)}
                    >
                        <Text style={styles.navBtnText}>Sonraki →</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View
                    style={[
                        styles.progressBar,
                        { width: `${(Object.keys(answers).length / questions.length) * 100}%` }
                    ]}
                />
            </View>
            <Text style={styles.progressText}>
                {Object.keys(answers).length} / {questions.length} cevaplandı
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#16213e',
        borderBottomWidth: 1,
        borderBottomColor: '#0f3460',
    },
    headerLeft: {
        flex: 1,
    },
    examTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    questionCount: {
        fontSize: 14,
        color: '#888',
        marginTop: 4,
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f3460',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    timerWarning: {
        backgroundColor: '#e63946',
    },
    timerIcon: {
        fontSize: 16,
        marginRight: 6,
    },
    timer: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4cc9f0',
        fontFamily: 'monospace',
    },
    timerTextWarning: {
        color: '#fff',
    },
    violationBanner: {
        backgroundColor: '#ff6b6b',
        padding: 8,
        alignItems: 'center',
    },
    violationText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    navContainer: {
        maxHeight: 50,
        backgroundColor: '#16213e',
        paddingHorizontal: 8,
    },
    navButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#0f3460',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 4,
        marginVertical: 7,
    },
    navButtonActive: {
        backgroundColor: '#4cc9f0',
    },
    navButtonAnswered: {
        backgroundColor: '#2ecc71',
    },
    navButtonText: {
        color: '#888',
        fontWeight: 'bold',
    },
    navButtonTextActive: {
        color: '#fff',
    },
    questionContainer: {
        flex: 1,
        padding: 20,
    },
    questionText: {
        fontSize: 18,
        color: '#fff',
        lineHeight: 26,
        marginBottom: 24,
    },
    optionsContainer: {
        gap: 12,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#16213e',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    optionSelected: {
        borderColor: '#4cc9f0',
        backgroundColor: '#1a3a5c',
    },
    optionCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#0f3460',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    optionCircleSelected: {
        backgroundColor: '#4cc9f0',
    },
    optionLetter: {
        color: '#888',
        fontWeight: 'bold',
        fontSize: 16,
    },
    optionLetterSelected: {
        color: '#fff',
    },
    optionText: {
        flex: 1,
        color: '#ccc',
        fontSize: 16,
    },
    optionTextSelected: {
        color: '#fff',
    },
    trueFalseContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        gap: 16,
    },
    trueFalseButton: {
        flex: 1,
        backgroundColor: '#16213e',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    trueFalseSelected: {
        borderColor: '#4cc9f0',
        backgroundColor: '#1a3a5c',
    },
    trueFalseText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    navButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#16213e',
    },
    navBtn: {
        paddingHorizontal: 24,
        paddingVertical: 14,
        backgroundColor: '#0f3460',
        borderRadius: 8,
    },
    navBtnDisabled: {
        opacity: 0.5,
    },
    navBtnText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    submitBtn: {
        backgroundColor: '#2ecc71',
    },
    submitBtnText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    progressContainer: {
        height: 4,
        backgroundColor: '#0f3460',
    },
    progressBar: {
        height: 4,
        backgroundColor: '#4cc9f0',
    },
    progressText: {
        textAlign: 'center',
        color: '#888',
        fontSize: 12,
        paddingVertical: 8,
        backgroundColor: '#16213e',
    },
});

export default ExamScreen;
