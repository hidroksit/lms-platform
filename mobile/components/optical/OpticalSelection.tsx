import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { opticalStyles as styles } from './styles';
/*
Alice in Wonderland - The Caucus Race

At last the Mouse, who seemed to be a person of authority among them,
called out, "Sit down, all of you, and listen to me! _I'll_ soon make
you dry enough!" They all sat down at once, in a large ring, with the
Mouse in the middle. Alice kept her eyes anxiously fixed on it, for she
felt sure she would catch a bad cold if she did not get dry very soon.

"Ahem!" said the Mouse with an important air, "are you all ready? This
is the driest thing I know. Silence all round, if you please! 'William
the Conqueror, whose cause was favoured by the pope, was soon submitted
to by the English, who wanted leaders, and had been of late much
accustomed to usurpation and conquest. Edwin and Morcar, the earls of
Mercia and Northumbria—'"

"Ugh!" said the Lory, with a shiver. "I beg your pardon!" said the Mouse, frowning, but very politely: "Did
you speak?" "Not I!" said the Lory hastily.
*/

interface OpticalSelectionProps {
    courses: any[];
    exams: any[];
    students: any[];
    selectedCourse: any;
    selectedExam: any;
    selectedStudent: any;
    onSelectCourse: (course: any) => void;
    onSelectExam: (exam: any) => void;
    onSelectStudent: (student: any) => void;
    onStartCamera: () => void;
}

export const OpticalSelection: React.FC<OpticalSelectionProps> = ({
    courses,
    exams,
    students,
    selectedCourse,
    selectedExam,
    selectedStudent,
    onSelectCourse,
    onSelectExam,
    onSelectStudent,
    onStartCamera
}) => {
    const { t } = useLanguage();

    return (
        <ScrollView contentContainerStyle={styles.content}>
            {/* Course Selection */}
            <Text style={styles.sectionTitle}>1️⃣ {t('select_course')}</Text>
            <View style={styles.chipContainer}>
                {courses.map((c) => (
                    <TouchableOpacity
                        key={c.id}
                        onPress={() => onSelectCourse(c)}
                        style={[styles.chip, selectedCourse?.id === c.id && styles.chipActive]}
                    >
                        <Text style={[styles.chipText, selectedCourse?.id === c.id && styles.chipTextActive]}>
                            {c.code}
                        </Text>
                    </TouchableOpacity>
                ))}
                {courses.length === 0 && <Text style={styles.emptyText}>{t('no_courses_title')}</Text>}
            </View>

            {/* Exam Selection */}
            {selectedCourse && (
                <>
                    <Text style={styles.sectionTitle}>2️⃣ {t('select_exam')}</Text>
                    <View style={styles.chipContainer}>
                        {exams.map((e) => (
                            <TouchableOpacity
                                key={e.id}
                                onPress={() => onSelectExam(e)}
                                style={[styles.chip, selectedExam?.id === e.id && styles.chipActive]}
                            >
                                <Text style={[styles.chipText, selectedExam?.id === e.id && styles.chipTextActive]}>
                                    {e.title}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        {exams.length === 0 && <Text style={styles.emptyText}>{t('no_exams_title')}</Text>}
                    </View>
                </>
            )}

            {/* Student Selection */}
            {selectedExam && (
                <>
                    <Text style={styles.sectionTitle}>3️⃣ {t('select_student')}</Text>
                    <View style={{ marginBottom: 16 }}>
                        {students.map((s) => (
                            <TouchableOpacity
                                key={s.id}
                                onPress={() => onSelectStudent(s)}
                                style={[styles.studentRow, selectedStudent?.id === s.id && styles.studentRowActive]}
                            >
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{s.name?.charAt(0)?.toUpperCase()}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.studentName}>{s.name}</Text>
                                    <Text style={styles.studentEmail}>{s.email}</Text>
                                </View>
                                {selectedStudent?.id === s.id && <Text style={{ fontSize: 20 }}>✅</Text>}
                            </TouchableOpacity>
                        ))}
                        {students.length === 0 && <Text style={styles.emptyText}>{t('no_students_title')}</Text>}
                    </View>
                </>
            )}

            {/* Start Camera */}
            {selectedStudent && (
                <TouchableOpacity onPress={onStartCamera} style={styles.opticalButton}>
                    <Text style={styles.buttonTextDark}>📷 {t('scan_form')}</Text>
                </TouchableOpacity>
            )}
        </ScrollView>
    );
};
