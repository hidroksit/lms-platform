// Generate SEB Config for an exam
exports.getSEBConfig = async (req, res) => {
    try {
        const examId = req.params.examId;

        // SEB ile açılan tüm sınavlar kameralı (proctored) modda açılacak
        const sebConfig = {
            examId: examId,
            startURL: `http://localhost:3000/dashboard/exams/${examId}/proctored`,
            showTaskBar: false,
            showMenuBar: false,
            enableRightMouse: false,
            allowQuit: false,
            browserExamKey: `seb_${examId}_${Date.now()}`,
            quitURL: "http://localhost:3000/dashboard",
            allowedURLs: [
                "localhost:3000/*",
                "localhost:3001/api/*"
            ],
            blockedProcesses: ["chrome.exe", "firefox.exe", "msedge.exe"],
            enableMediaCapture: true,  // Kamera ve mikrofon erişimi
            allowVideoCapture: true,
            allowAudioCapture: true
        };

        res.setHeader('Content-Type', 'application/x-seb-config');
        res.setHeader('Content-Disposition', `attachment; filename="exam_${examId}.seb"`);
        res.send(JSON.stringify(sebConfig, null, 2));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
