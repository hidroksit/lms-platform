// Generate SEB Config for an exam
exports.getSEBConfig = async (req, res) => {
    try {
        const examId = req.params.examId;

        const sebConfig = {
            examId: examId,
            startURL: `http://localhost:3000/dashboard/exams/${examId}`,
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
            blockedProcesses: ["chrome.exe", "firefox.exe", "msedge.exe"]
        };

        res.setHeader('Content-Type', 'application/x-seb-config');
        res.setHeader('Content-Disposition', `attachment; filename="exam_${examId}.seb"`);
        res.send(JSON.stringify(sebConfig, null, 2));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
