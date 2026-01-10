import React, { createContext, useContext } from 'react';

const LanguageContext = createContext({
    t: (key) => key // Default safe implementation
});

const translations = {
    // Camera
    camera_permission_title: 'Kamera İzni Gerekli',
    camera_permission_text: 'Optik form taramak için kamera erişimine izin verin.',
    allow: 'İzin Ver',
    go_back: 'Geri Dön',
    optical_reader_title: 'Optik Form Tarama',

    // Selection
    select_course: 'Ders Seçin',
    select_exam: 'Sınav Seçin',
    select_student: 'Öğrenci Seçin',
    scan_form: 'Formu Tara',
    no_courses_title: 'Kayıtlı ders bulunamadı',
    no_exams_title: 'Aktif sınav bulunamadı',
    no_students_title: 'Öğrenci bulunamadı',

    // Result
    scan_result: 'Tarama Sonucu',
    student: 'Öğrenci',
    exam_name: 'Sınav',
    detected: 'Tespit Edilen',
    bubbles_found: 'işaretleme',
    analysis_results: 'Analiz Sonuçları',
    correct: 'Doğru',
    wrong: 'Yanlış',
    empty: 'Boş',
    manual_score_entry: 'Manuel Puan Girişi',
    save_score: 'Notu Kaydet',
    retake: 'Yeniden Çek',
    analyzing_form: 'Form Analiz Ediliyor...',
    please_wait: 'Lütfen bekleyin',
    server_processing: 'Sunucuda İşleniyor',
    python_analysis: 'Görüntü işleniyor...',
    export_success: 'Veri başarıyla dışa aktarıldı',
    copy: 'Kopyala',
    understood: 'Anladım',
    student: 'Öğrenci',
    exam: 'Sınav',
    detected_score: 'Tespit Edilen Puan',
    detected_answers: 'Tespit Edilen Cevaplar',
    save_grade: 'Notu Kaydet',
    export_json: 'JSON Kaydet',
    retake_photo: 'Yeniden Çek'
};

export const LanguageProvider = ({ children }) => {
    const t = (key) => translations[key] || key;

    return (
        <LanguageContext.Provider value={{ t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
