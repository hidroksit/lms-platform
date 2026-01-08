import React, { useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  TextInput,
  Platform
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

// ==================== OPTICAL READER COMPONENTS ====================

// Optical Selection Component
const OpticalSelection = ({
  courses, exams, students,
  selectedCourse, selectedExam, selectedStudent,
  onSelectCourse, onSelectExam, onSelectStudent,
  onStartCamera
}) => (
  <ScrollView contentContainerStyle={opticalStyles.content}>
    {/* Course Selection */}
    <Text style={opticalStyles.sectionTitle}>1️⃣ Ders Seçin</Text>
    <View style={opticalStyles.chipContainer}>
      {courses.map((c) => (
        <TouchableOpacity
          key={c.id}
          onPress={() => onSelectCourse(c)}
          style={[opticalStyles.chip, selectedCourse?.id === c.id && opticalStyles.chipActive]}
        >
          <Text style={[opticalStyles.chipText, selectedCourse?.id === c.id && opticalStyles.chipTextActive]}>
            {c.code}
          </Text>
        </TouchableOpacity>
      ))}
    </View>

    {/* Exam Selection */}
    {selectedCourse && (
      <>
        <Text style={opticalStyles.sectionTitle}>2️⃣ Sınav Seçin</Text>
        <View style={opticalStyles.chipContainer}>
          {exams.filter(e => e.courseId === selectedCourse.id).map((e) => (
            <TouchableOpacity
              key={e.id}
              onPress={() => onSelectExam(e)}
              style={[opticalStyles.chip, selectedExam?.id === e.id && opticalStyles.chipActive]}
            >
              <Text style={[opticalStyles.chipText, selectedExam?.id === e.id && opticalStyles.chipTextActive]}>
                {e.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </>
    )}

    {/* Student Selection */}
    {selectedExam && (
      <>
        <Text style={opticalStyles.sectionTitle}>3️⃣ Öğrenci Seçin</Text>
        <View style={{ marginBottom: 16 }}>
          {students.map((s) => (
            <TouchableOpacity
              key={s.id}
              onPress={() => onSelectStudent(s)}
              style={[opticalStyles.studentRow, selectedStudent?.id === s.id && opticalStyles.studentRowActive]}
            >
              <View style={opticalStyles.avatar}>
                <Text style={opticalStyles.avatarText}>{s.name?.charAt(0)?.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={opticalStyles.studentName}>{s.name}</Text>
                <Text style={opticalStyles.studentEmail}>{s.email}</Text>
              </View>
              {selectedStudent?.id === s.id && <Text style={{ fontSize: 20 }}>✅</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </>
    )}

    {/* Start Camera Button */}
    {selectedStudent && (
      <TouchableOpacity onPress={onStartCamera} style={opticalStyles.opticalButton}>
        <Text style={opticalStyles.buttonTextDark}>📷 Formu Tara</Text>
      </TouchableOpacity>
    )}
  </ScrollView>
);

// Optical Camera Component
const OpticalCamera = ({
  cameraRef, selectedStudent, onBack, onCapture, permission, requestPermission
}) => {
  if (!permission?.granted) {
    return (
      <View style={[opticalStyles.centerContent, { flex: 1, backgroundColor: '#0f172a' }]}>
        <Text style={opticalStyles.bigEmoji}>📷</Text>
        <Text style={opticalStyles.bigTitle}>Kamera İzni Gerekli</Text>
        <Text style={opticalStyles.instructionText}>Optik form taramak için kamera erişimine izin verin.</Text>
        <TouchableOpacity onPress={requestPermission} style={opticalStyles.primaryButton}>
          <Text style={opticalStyles.buttonText}>İzin Ver</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onBack} style={{ marginTop: 15 }}>
          <Text style={{ color: '#94a3b8' }}>← Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center' }}>
      {/* Camera View Container - 3:4 ratio */}
      <View style={{ width: '100%', aspectRatio: 3 / 4, overflow: 'hidden', borderRadius: 12 }}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

        {/* Overlay */}
        <View style={[StyleSheet.absoluteFill, { justifyContent: 'space-between', padding: 20 }]}>
          <TouchableOpacity onPress={onBack} style={opticalStyles.cameraBackBtn}>
            <Text style={opticalStyles.cameraBackText}>←</Text>
          </TouchableOpacity>

          <View style={opticalStyles.scanGuide}>
            <Text style={opticalStyles.scanGuideTitle}>📄 Optik Form Tarama</Text>
            <Text style={opticalStyles.scanGuideText}>{selectedStudent?.name}</Text>
          </View>

          {/* Alignment Grid */}
          <View style={[StyleSheet.absoluteFill, { zIndex: 1 }]} pointerEvents="none">
            <View style={{
              position: 'absolute', left: '33.3%', top: '25%',
              width: '30%', height: '67.5%',
              flexDirection: 'column', justifyContent: 'space-between'
            }}>
              {[...Array(10)].map((_, rowIndex) => (
                <View key={rowIndex} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  {[...Array(5)].map((_, colIndex) => (
                    <View key={colIndex} style={{
                      width: 20, height: 20, borderRadius: 10,
                      borderWidth: 2, borderColor: 'red',
                      backgroundColor: 'rgba(255,0,0,0.2)'
                    }} />
                  ))}
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity onPress={onCapture} style={opticalStyles.captureButton}>
            <View style={opticalStyles.captureButtonInner} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Instructions */}
      <View style={{ position: 'absolute', bottom: 40, width: '100%', alignItems: 'center' }}>
        <Text style={{ color: '#94a3b8', fontSize: 12 }}>🔴 Kırmızı yuvarlakları kağıttaki şıklara denk getirin</Text>
      </View>
    </View>
  );
};

// Optical Analyzing Component
const OpticalAnalyzing = () => (
  <View style={[opticalStyles.centerContent, { flex: 1, backgroundColor: '#0f172a' }]}>
    <ActivityIndicator size="large" color="#3b82f6" />
    <Text style={opticalStyles.analyzingText}>Form Analiz Ediliyor...</Text>
    <Text style={{ color: '#64748b', marginTop: 8 }}>Lütfen bekleyin</Text>
  </View>
);

// Optical Result Component
const OpticalResult = ({
  capturedImage, selectedStudent, selectedExam,
  detectedScore, detectedAnswers, manualScore,
  loading, onManualScoreChange, onSubmit, onRetake, onExportJson
}) => {
  const handleExportJson = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      student: { id: selectedStudent?.id, name: selectedStudent?.name, email: selectedStudent?.email },
      exam: { id: selectedExam?.id, title: selectedExam?.title },
      result: {
        detectedScore, detectedAnswers,
        manualScore: manualScore ? parseInt(manualScore) : null,
        finalScore: manualScore ? parseInt(manualScore) : detectedScore
      }
    };

    Alert.alert(
      '📤 JSON Export',
      `Veri dışa aktarıldı!\n\n${JSON.stringify(exportData, null, 2).substring(0, 300)}...`,
      [
        { text: 'Kopyala', onPress: () => console.log('Export Data:', JSON.stringify(exportData)) },
        { text: 'Tamam' }
      ]
    );
    if (onExportJson) onExportJson();
  };

  return (
    <ScrollView contentContainerStyle={opticalStyles.content}>
      {capturedImage && (
        <Image source={{ uri: capturedImage }} style={opticalStyles.resultImage} resizeMode="contain" />
      )}

      <View style={opticalStyles.resultCard}>
        <Text style={opticalStyles.resultLabel}>Öğrenci</Text>
        <Text style={opticalStyles.resultValue}>{selectedStudent?.name}</Text>
      </View>

      <View style={opticalStyles.resultCard}>
        <Text style={opticalStyles.resultLabel}>Sınav</Text>
        <Text style={opticalStyles.resultValue}>{selectedExam?.title}</Text>
      </View>

      <View style={[opticalStyles.resultCard, { backgroundColor: '#1e4d3d' }]}>
        <Text style={opticalStyles.resultLabel}>Tespit Edilen Puan</Text>
        <Text style={[opticalStyles.resultValue, { fontSize: 36 }]}>{detectedScore}/100</Text>
      </View>

      {detectedAnswers && (
        <View style={opticalStyles.resultCard}>
          <Text style={[opticalStyles.resultLabel, { marginBottom: 12 }]}>Tespit Edilen Cevaplar</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {Object.entries(detectedAnswers).map(([key, value]) => (
              <View key={key} style={{
                width: '18%', aspectRatio: 1,
                backgroundColor: '#f1f5f9', borderRadius: 8,
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 1, borderColor: '#e2e8f0'
              }}>
                <Text style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>S{key}</Text>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0f172a' }}>{value || '-'}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <Text style={opticalStyles.manualLabel}>Manuel Puan Girişi</Text>
      <TextInput
        style={opticalStyles.scoreInput}
        keyboardType="numeric"
        value={manualScore}
        onChangeText={onManualScoreChange}
        placeholder="0-100"
        placeholderTextColor="#64748b"
      />

      <TouchableOpacity onPress={onSubmit} disabled={loading} style={opticalStyles.primaryButton}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={opticalStyles.buttonText}>✅ Notu Kaydet</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={handleExportJson} style={[opticalStyles.primaryButton, { backgroundColor: '#6366f1', marginTop: 12 }]}>
        <Text style={opticalStyles.buttonText}>📤 JSON Olarak Kaydet</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onRetake} style={{ marginTop: 16 }}>
        <Text style={{ color: '#f59e0b', textAlign: 'center' }}>🔄 Yeniden Çek</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// ==================== MAIN OPTICAL READER SCREEN ====================
const OpticalReaderScreen = ({ onBack }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  const [step, setStep] = useState('selection'); // selection, camera, analyzing, result
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [capturedImage, setCapturedImage] = useState(null);
  const [detectedScore, setDetectedScore] = useState(null);
  const [detectedAnswers, setDetectedAnswers] = useState(null);
  const [manualScore, setManualScore] = useState('');
  const [loading, setLoading] = useState(false);

  // Mock Data
  const courses = [
    { id: 1, code: 'MAT101' },
    { id: 2, code: 'FIZ101' },
    { id: 3, code: 'PRG101' },
  ];

  const exams = [
    { id: 1, courseId: 1, title: 'Ara Sınav' },
    { id: 2, courseId: 1, title: 'Final' },
    { id: 3, courseId: 2, title: 'Quiz 1' },
    { id: 4, courseId: 3, title: 'Proje' },
  ];

  const students = [
    { id: 1, name: 'Ahmet Yılmaz', email: 'ahmet@example.com' },
    { id: 2, name: 'Ayşe Demir', email: 'ayse@example.com' },
    { id: 3, name: 'Mehmet Kaya', email: 'mehmet@example.com' },
  ];

  const handleCapture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
        setCapturedImage(photo.uri);
        setStep('analyzing');

        // Simulate OMR processing
        setTimeout(() => {
          const mockAnswers = {};
          const options = ['A', 'B', 'C', 'D', 'E'];
          for (let i = 1; i <= 10; i++) {
            mockAnswers[i] = options[Math.floor(Math.random() * options.length)];
          }
          setDetectedAnswers(mockAnswers);
          setDetectedScore(Math.floor(Math.random() * 40) + 60); // 60-100
          setStep('result');
        }, 2000);
      } catch (error) {
        Alert.alert('Hata', 'Fotoğraf çekilemedi');
        setStep('selection');
      }
    }
  };

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Başarılı', `${selectedStudent?.name} için not kaydedildi!`);
      resetAll();
    }, 1500);
  };

  const resetAll = () => {
    setStep('selection');
    setSelectedCourse(null);
    setSelectedExam(null);
    setSelectedStudent(null);
    setCapturedImage(null);
    setDetectedScore(null);
    setDetectedAnswers(null);
    setManualScore('');
  };

  if (step === 'camera') {
    return (
      <OpticalCamera
        cameraRef={cameraRef}
        selectedStudent={selectedStudent}
        onBack={() => setStep('selection')}
        onCapture={handleCapture}
        permission={permission}
        requestPermission={requestPermission}
      />
    );
  }

  if (step === 'analyzing') {
    return <OpticalAnalyzing />;
  }

  if (step === 'result') {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={resetAll}>
            <Text style={styles.backButtonText}>← Geri</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tarama Sonucu</Text>
        </View>
        <OpticalResult
          capturedImage={capturedImage}
          selectedStudent={selectedStudent}
          selectedExam={selectedExam}
          detectedScore={detectedScore}
          detectedAnswers={detectedAnswers}
          manualScore={manualScore}
          loading={loading}
          onManualScoreChange={setManualScore}
          onSubmit={handleSubmit}
          onRetake={() => setStep('camera')}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <OpticalSelection
        courses={courses}
        exams={exams}
        students={students}
        selectedCourse={selectedCourse}
        selectedExam={selectedExam}
        selectedStudent={selectedStudent}
        onSelectCourse={(c) => { setSelectedCourse(c); setSelectedExam(null); setSelectedStudent(null); }}
        onSelectExam={(e) => { setSelectedExam(e); setSelectedStudent(null); }}
        onSelectStudent={setSelectedStudent}
        onStartCamera={() => setStep('camera')}
      />
    </View>
  );
};

// ==================== OTHER SCREENS ====================

const HomeScreen = ({ onNavigate }) => (
  <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
    <Text style={styles.welcome}>Hoş Geldiniz!</Text>
    <Text style={styles.desc}>LMS Mobil Uygulaması</Text>

    <View style={styles.menuGrid}>
      <TouchableOpacity style={styles.menuCard} onPress={() => onNavigate('courses')}>
        <Text style={styles.menuIcon}>📖</Text>
        <Text style={styles.menuText}>Derslerim</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuCard} onPress={() => onNavigate('exams')}>
        <Text style={styles.menuIcon}>📝</Text>
        <Text style={styles.menuText}>Sınavlar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuCard} onPress={() => onNavigate('optical')}>
        <Text style={styles.menuIcon}>📷</Text>
        <Text style={styles.menuText}>Optik Okuyucu</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuCard} onPress={() => onNavigate('grades')}>
        <Text style={styles.menuIcon}>📊</Text>
        <Text style={styles.menuText}>Notlarım</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuCard} onPress={() => onNavigate('profile')}>
        <Text style={styles.menuIcon}>👤</Text>
        <Text style={styles.menuText}>Profil</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuCard} onPress={() => onNavigate('settings')}>
        <Text style={styles.menuIcon}>⚙️</Text>
        <Text style={styles.menuText}>Ayarlar</Text>
      </TouchableOpacity>
    </View>
  </ScrollView>
);

const CoursesScreen = () => (
  <ScrollView style={styles.screenContent}>
    <Text style={styles.screenTitle}>📖 Derslerim</Text>
    {[
      { title: 'Matematik 101', progress: 75, instructor: 'Prof. Ahmet Yılmaz' },
      { title: 'Fizik 101', progress: 45, instructor: 'Dr. Mehmet Kaya' },
      { title: 'Programlama', progress: 90, instructor: 'Dr. Ayşe Demir' },
    ].map((course, index) => (
      <View key={index} style={styles.courseCard}>
        <Text style={styles.courseTitle}>{course.title}</Text>
        <Text style={styles.courseInstructor}>{course.instructor}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${course.progress}%` }]} />
        </View>
        <Text style={styles.progressText}>%{course.progress} tamamlandı</Text>
      </View>
    ))}
  </ScrollView>
);

const ExamsScreen = () => (
  <ScrollView style={styles.screenContent}>
    <Text style={styles.screenTitle}>📝 Sınavlarım</Text>
    {[
      { title: 'Matematik Ara Sınav', date: '15 Ocak 2026', status: 'Bekliyor', color: '#f39c12' },
      { title: 'Fizik Quiz 3', date: '10 Ocak 2026', status: 'Tamamlandı', color: '#27ae60' },
      { title: 'Programlama Final', date: '20 Ocak 2026', status: 'Yaklaşıyor', color: '#e74c3c' },
    ].map((exam, index) => (
      <View key={index} style={styles.examCard}>
        <View style={styles.examHeader}>
          <Text style={styles.examTitle}>{exam.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: exam.color }]}>
            <Text style={styles.statusText}>{exam.status}</Text>
          </View>
        </View>
        <Text style={styles.examDate}>📅 {exam.date}</Text>
      </View>
    ))}
  </ScrollView>
);

const GradesScreen = () => (
  <ScrollView style={styles.screenContent}>
    <Text style={styles.screenTitle}>📊 Notlarım</Text>
    <View style={styles.gpaCard}>
      <Text style={styles.gpaLabel}>Genel Ortalama</Text>
      <Text style={styles.gpaValue}>3.45</Text>
      <Text style={styles.gpaSubtext}>/ 4.00</Text>
    </View>
    {[
      { course: 'Matematik 101', grade: 'AA', score: 92 },
      { course: 'Fizik 101', grade: 'BA', score: 85 },
      { course: 'Programlama', grade: 'AA', score: 95 },
    ].map((item, index) => (
      <View key={index} style={styles.gradeCard}>
        <Text style={styles.gradeCourse}>{item.course}</Text>
        <View style={styles.gradeRight}>
          <Text style={styles.gradeScore}>{item.score}</Text>
          <Text style={styles.gradeLetter}>{item.grade}</Text>
        </View>
      </View>
    ))}
  </ScrollView>
);

const ProfileScreen = () => (
  <ScrollView style={styles.screenContent}>
    <Text style={styles.screenTitle}>👤 Profil</Text>
    <View style={styles.profileCard}>
      <View style={styles.profileAvatar}>
        <Text style={styles.profileAvatarText}>AY</Text>
      </View>
      <Text style={styles.profileName}>Ahmet Yılmaz</Text>
      <Text style={styles.profileEmail}>ahmet.yilmaz@example.com</Text>
      <Text style={styles.profileId}>Öğrenci No: 20261234</Text>
    </View>
    <View style={styles.statsGrid}>
      <View style={styles.statItem}><Text style={styles.statValue}>12</Text><Text style={styles.statLabel}>Ders</Text></View>
      <View style={styles.statItem}><Text style={styles.statValue}>8</Text><Text style={styles.statLabel}>Sınav</Text></View>
      <View style={styles.statItem}><Text style={styles.statValue}>3.45</Text><Text style={styles.statLabel}>GPA</Text></View>
    </View>
  </ScrollView>
);

const SettingsScreen = () => (
  <ScrollView style={styles.screenContent}>
    <Text style={styles.screenTitle}>⚙️ Ayarlar</Text>
    {[
      { icon: '🔔', title: 'Bildirimler', subtitle: 'Push bildirimleri yönet' },
      { icon: '🌙', title: 'Karanlık Mod', subtitle: 'Aktif' },
      { icon: '🌍', title: 'Dil', subtitle: 'Türkçe' },
      { icon: '🔒', title: 'Gizlilik', subtitle: 'Hesap güvenliği' },
      { icon: '❓', title: 'Yardım', subtitle: 'SSS ve destek' },
      { icon: '📄', title: 'Hakkında', subtitle: 'Versiyon 1.0.0' },
    ].map((item, index) => (
      <TouchableOpacity key={index} style={styles.settingItem}>
        <Text style={styles.settingIcon}>{item.icon}</Text>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>{item.title}</Text>
          <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
        </View>
        <Text style={styles.settingArrow}>›</Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
);

// ==================== MAIN APP ====================
export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'courses': return <CoursesScreen />;
      case 'exams': return <ExamsScreen />;
      case 'optical': return <OpticalReaderScreen onBack={() => setCurrentScreen('home')} />;
      case 'grades': return <GradesScreen />;
      case 'profile': return <ProfileScreen />;
      case 'settings': return <SettingsScreen />;
      default: return <HomeScreen onNavigate={setCurrentScreen} />;
    }
  };

  const getTitle = () => {
    const titles = { home: 'LMS Platform', courses: 'Derslerim', exams: 'Sınavlarım', optical: 'Optik Okuyucu', grades: 'Notlarım', profile: 'Profil', settings: 'Ayarlar' };
    return titles[currentScreen] || 'LMS Platform';
  };

  // Optical reader has its own header
  if (currentScreen === 'optical') {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('home')}>
            <Text style={styles.backButtonText}>← Geri</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Optik Okuyucu</Text>
        </View>
        <OpticalReaderScreen onBack={() => setCurrentScreen('home')} />
        <View style={styles.footer}>
          <TouchableOpacity style={styles.footerTab} onPress={() => setCurrentScreen('home')}><Text style={styles.footerIcon}>🏠</Text></TouchableOpacity>
          <TouchableOpacity style={styles.footerTab} onPress={() => setCurrentScreen('courses')}><Text style={styles.footerIcon}>📖</Text></TouchableOpacity>
          <TouchableOpacity style={styles.footerTab} onPress={() => setCurrentScreen('optical')}><Text style={[styles.footerIcon, styles.footerIconLarge]}>📷</Text></TouchableOpacity>
          <TouchableOpacity style={styles.footerTab} onPress={() => setCurrentScreen('grades')}><Text style={styles.footerIcon}>📊</Text></TouchableOpacity>
          <TouchableOpacity style={styles.footerTab} onPress={() => setCurrentScreen('profile')}><Text style={styles.footerIcon}>👤</Text></TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        {currentScreen !== 'home' && (
          <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('home')}>
            <Text style={styles.backButtonText}>← Geri</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>{getTitle()}</Text>
        {currentScreen === 'home' && <Text style={styles.subtitle}>Öğrenim Yönetim Sistemi</Text>}
      </View>
      {renderScreen()}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerTab} onPress={() => setCurrentScreen('home')}><Text style={styles.footerIcon}>🏠</Text></TouchableOpacity>
        <TouchableOpacity style={styles.footerTab} onPress={() => setCurrentScreen('courses')}><Text style={styles.footerIcon}>📖</Text></TouchableOpacity>
        <TouchableOpacity style={styles.footerTab} onPress={() => setCurrentScreen('optical')}><Text style={[styles.footerIcon, styles.footerIconLarge]}>📷</Text></TouchableOpacity>
        <TouchableOpacity style={styles.footerTab} onPress={() => setCurrentScreen('grades')}><Text style={styles.footerIcon}>📊</Text></TouchableOpacity>
        <TouchableOpacity style={styles.footerTab} onPress={() => setCurrentScreen('profile')}><Text style={styles.footerIcon}>👤</Text></TouchableOpacity>
      </View>
    </View>
  );
}

// ==================== OPTICAL STYLES ====================
const opticalStyles = StyleSheet.create({
  centerContent: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 12, marginTop: 8 },
  bigEmoji: { fontSize: 80 },
  bigTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 20, marginBottom: 10 },
  instructionText: { color: '#94a3b8', textAlign: 'center', paddingHorizontal: 20 },
  analyzingText: { color: '#fff', fontSize: 16, marginTop: 16 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { backgroundColor: '#334155', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 2, borderColor: 'transparent' },
  chipActive: { backgroundColor: '#3b82f620', borderColor: '#3b82f6' },
  chipText: { color: '#94a3b8', fontWeight: '500' },
  chipTextActive: { color: '#3b82f6' },
  studentRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 2, borderColor: 'transparent' },
  studentRowActive: { borderColor: '#3b82f6' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  studentName: { color: '#fff', fontWeight: '600', fontSize: 15 },
  studentEmail: { color: '#64748b', fontSize: 12, marginTop: 2 },
  primaryButton: { backgroundColor: '#3b82f6', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  opticalButton: { backgroundColor: '#f59e0b', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  buttonTextDark: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  cameraBackBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  cameraBackText: { color: '#fff', fontSize: 24 },
  scanGuide: { alignItems: 'center' },
  scanGuideTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  scanGuideText: { color: '#94a3b8', marginTop: 4 },
  captureButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', alignSelf: 'center' },
  captureButtonInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' },
  resultImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 20 },
  resultCard: { backgroundColor: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 12 },
  resultLabel: { color: '#64748b', fontSize: 12, marginBottom: 4 },
  resultValue: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  manualLabel: { color: '#94a3b8', marginTop: 16, marginBottom: 8 },
  scoreInput: { backgroundColor: '#0f172a', color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center', padding: 16, borderRadius: 12, borderWidth: 2, borderColor: '#334155' },
});

// ==================== MAIN STYLES ====================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: { padding: 20, paddingTop: 50, backgroundColor: '#16213e', borderBottomWidth: 1, borderBottomColor: '#0f3460', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 12, color: '#4cc9f0', marginTop: 5 },
  backButton: { position: 'absolute', left: 15, top: 50 },
  backButtonText: { color: '#4cc9f0', fontSize: 16 },
  content: { flex: 1 },
  contentContainer: { padding: 20 },
  welcome: { fontSize: 24, fontWeight: 'bold', color: '#4cc9f0', textAlign: 'center', marginBottom: 5 },
  desc: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 25 },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  menuCard: { width: '48%', backgroundColor: '#16213e', borderRadius: 15, padding: 20, alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#0f3460' },
  menuIcon: { fontSize: 32, marginBottom: 8 },
  menuText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  footer: { flexDirection: 'row', backgroundColor: '#16213e', borderTopWidth: 1, borderTopColor: '#0f3460', paddingVertical: 10, paddingBottom: 25 },
  footerTab: { flex: 1, alignItems: 'center', paddingVertical: 5 },
  footerIcon: { fontSize: 22 },
  footerIconLarge: { fontSize: 28 },
  screenContent: { flex: 1, padding: 20 },
  screenTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  courseCard: { backgroundColor: '#16213e', borderRadius: 12, padding: 15, marginBottom: 15 },
  courseTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  courseInstructor: { fontSize: 12, color: '#888', marginTop: 5 },
  progressBar: { height: 6, backgroundColor: '#0f3460', borderRadius: 3, marginTop: 10 },
  progressFill: { height: 6, backgroundColor: '#4cc9f0', borderRadius: 3 },
  progressText: { fontSize: 11, color: '#4cc9f0', marginTop: 5 },
  examCard: { backgroundColor: '#16213e', borderRadius: 12, padding: 15, marginBottom: 15 },
  examHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  examTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  examDate: { fontSize: 12, color: '#888', marginTop: 8 },
  gpaCard: { backgroundColor: '#16213e', borderRadius: 15, padding: 25, alignItems: 'center', marginBottom: 20 },
  gpaLabel: { color: '#888', fontSize: 14 },
  gpaValue: { color: '#4cc9f0', fontSize: 48, fontWeight: 'bold' },
  gpaSubtext: { color: '#888', fontSize: 16 },
  gradeCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#16213e', borderRadius: 12, padding: 15, marginBottom: 10 },
  gradeCourse: { color: '#fff', fontSize: 15 },
  gradeRight: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  gradeScore: { color: '#888', fontSize: 14 },
  gradeLetter: { color: '#4cc9f0', fontSize: 18, fontWeight: 'bold' },
  profileCard: { backgroundColor: '#16213e', borderRadius: 15, padding: 25, alignItems: 'center', marginBottom: 20 },
  profileAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#4cc9f0', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  profileAvatarText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  profileName: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  profileEmail: { color: '#888', fontSize: 14, marginTop: 5 },
  profileId: { color: '#4cc9f0', fontSize: 12, marginTop: 10 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  statItem: { alignItems: 'center' },
  statValue: { color: '#4cc9f0', fontSize: 24, fontWeight: 'bold' },
  statLabel: { color: '#888', fontSize: 12 },
  settingItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16213e', borderRadius: 12, padding: 15, marginBottom: 10 },
  settingIcon: { fontSize: 24, marginRight: 15 },
  settingInfo: { flex: 1 },
  settingTitle: { color: '#fff', fontSize: 15 },
  settingSubtitle: { color: '#888', fontSize: 12 },
  settingArrow: { color: '#888', fontSize: 24 },
});
