// Rubric System Routes - Assessment rubrics for open-ended questions
const express = require('express');
const router = express.Router();

// In-memory storage (use database in production)
const rubrics = [];

/**
 * Create a new rubric
 */
router.post('/', async (req, res) => {
    try {
        const { title, description, criteria, maxScore, courseId, questionId } = req.body;

        if (!criteria || !Array.isArray(criteria)) {
            return res.status(400).json({ error: 'Criteria array is required' });
        }

        const rubric = {
            id: Date.now().toString(),
            title,
            description: description || '',
            criteria: criteria.map((c, index) => ({
                id: `crit-${index}`,
                name: c.name,
                description: c.description,
                weight: c.weight || 1,
                levels: c.levels || [
                    { score: 4, label: 'Mükemmel', description: 'Tüm beklentileri karşılıyor' },
                    { score: 3, label: 'İyi', description: 'Beklentilerin çoğunu karşılıyor' },
                    { score: 2, label: 'Orta', description: 'Bazı beklentileri karşılıyor' },
                    { score: 1, label: 'Zayıf', description: 'Beklentilerin altında' },
                    { score: 0, label: 'Yetersiz', description: 'Hiçbir beklentiyi karşılamıyor' }
                ]
            })),
            maxScore: maxScore || calculateMaxScore(criteria),
            courseId: courseId || null,
            questionId: questionId || null,
            createdAt: new Date().toISOString(),
            createdBy: req.user?.id || 'system'
        };

        rubrics.push(rubric);

        res.status(201).json({
            success: true,
            rubric
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get all rubrics
 */
router.get('/', async (req, res) => {
    try {
        const { courseId, questionId } = req.query;

        let filtered = rubrics;

        if (courseId) {
            filtered = filtered.filter(r => r.courseId === courseId);
        }

        if (questionId) {
            filtered = filtered.filter(r => r.questionId === questionId);
        }

        res.json({
            success: true,
            count: filtered.length,
            rubrics: filtered
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get single rubric
 */
router.get('/:id', async (req, res) => {
    try {
        const rubric = rubrics.find(r => r.id === req.params.id);

        if (!rubric) {
            return res.status(404).json({ error: 'Rubric not found' });
        }

        res.json({ success: true, rubric });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Grade submission with rubric
 */
router.post('/:rubricId/grade', async (req, res) => {
    try {
        const { rubricId } = req.params;
        const { submissionId, studentId, criteriaScores, feedback } = req.body;

        const rubric = rubrics.find(r => r.id === rubricId);

        if (!rubric) {
            return res.status(404).json({ error: 'Rubric not found' });
        }

        if (!criteriaScores || !Array.isArray(criteriaScores)) {
            return res.status(400).json({ error: 'Criteria scores required' });
        }

        // Calculate total score
        let totalScore = 0;
        let totalWeight = 0;
        const gradedCriteria = [];

        for (const criterion of rubric.criteria) {
            const score = criteriaScores.find(s => s.criterionId === criterion.id);

            if (score) {
                totalScore += score.score * criterion.weight;
                totalWeight += criterion.weight;

                gradedCriteria.push({
                    criterionId: criterion.id,
                    criterionName: criterion.name,
                    score: score.score,
                    weight: criterion.weight,
                    weightedScore: score.score * criterion.weight,
                    comment: score.comment || ''
                });
            }
        }

        const percentage = totalWeight > 0 ? Math.round((totalScore / (totalWeight * 4)) * 100) : 0;

        const grade = {
            id: Date.now().toString(),
            rubricId,
            submissionId,
            studentId,
            criteria: gradedCriteria,
            totalScore,
            maxPossibleScore: totalWeight * 4,
            percentage,
            letterGrade: getLetterGrade(percentage),
            feedback: feedback || '',
            gradedAt: new Date().toISOString(),
            gradedBy: req.user?.id || 'instructor'
        };

        res.json({
            success: true,
            grade
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Update rubric
 */
router.put('/:id', async (req, res) => {
    try {
        const index = rubrics.findIndex(r => r.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ error: 'Rubric not found' });
        }

        const { title, description, criteria } = req.body;

        if (title) rubrics[index].title = title;
        if (description) rubrics[index].description = description;
        if (criteria) {
            rubrics[index].criteria = criteria;
            rubrics[index].maxScore = calculateMaxScore(criteria);
        }

        rubrics[index].updatedAt = new Date().toISOString();

        res.json({
            success: true,
            rubric: rubrics[index]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Delete rubric
 */
router.delete('/:id', async (req, res) => {
    try {
        const index = rubrics.findIndex(r => r.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ error: 'Rubric not found' });
        }

        rubrics.splice(index, 1);

        res.json({ success: true, message: 'Rubric deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get predefined rubric templates
 */
router.get('/templates/all', async (req, res) => {
    try {
        const templates = [
            {
                id: 'essay-template',
                title: 'Makale Değerlendirme Rubriği',
                criteria: [
                    { name: 'İçerik', description: 'Konunun kapsamlı işlenmesi', weight: 2 },
                    { name: 'Organizasyon', description: 'Mantıksal akış ve yapı', weight: 1.5 },
                    { name: 'Dil Kullanımı', description: 'Gramer ve kelime hazinesi', weight: 1 },
                    { name: 'Alıntı ve Kaynak', description: 'Doğru kaynak gösterimi', weight: 0.5 }
                ]
            },
            {
                id: 'presentation-template',
                title: 'Sunum Değerlendirme Rubriği',
                criteria: [
                    { name: 'İçerik Kalitesi', description: 'Bilginin doğruluğu ve derinliği', weight: 2 },
                    { name: 'Görsel Tasarım', description: 'Slayt düzeni ve görsellik', weight: 1 },
                    { name: 'Sunum Becerileri', description: 'Göz teması, ses tonu', weight: 1.5 },
                    { name: 'Zaman Yönetimi', description: 'Süreye uygunluk', weight: 0.5 }
                ]
            },
            {
                id: 'code-template',
                title: 'Kod Projesi Değerlendirme Rubriği',
                criteria: [
                    { name: 'Doğruluk', description: 'Kodun çalışması', weight: 2 },
                    { name: 'Kod Kalitesi', description: 'Okunabilirlik ve best practices', weight: 1.5 },
                    { name: 'Dokümantasyon', description: 'Yorum ve README', weight: 0.5 },
                    { name: 'Test', description: 'Unit test kapsamı', weight: 1 }
                ]
            }
        ];

        res.json({ success: true, templates });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper functions
function calculateMaxScore(criteria) {
    return criteria.reduce((sum, c) => sum + (c.weight || 1) * 4, 0);
}

function getLetterGrade(percentage) {
    if (percentage >= 90) return 'AA';
    if (percentage >= 85) return 'BA';
    if (percentage >= 80) return 'BB';
    if (percentage >= 75) return 'CB';
    if (percentage >= 70) return 'CC';
    if (percentage >= 65) return 'DC';
    if (percentage >= 60) return 'DD';
    if (percentage >= 50) return 'FD';
    return 'FF';
}

module.exports = router;
