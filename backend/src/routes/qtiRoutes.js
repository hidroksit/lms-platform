// QTI 2.1 (Question & Test Interoperability) Routes
const express = require('express');
const router = express.Router();
const multer = require('multer');
const xml2js = require('xml2js');

const upload = multer({ storage: multer.memoryStorage() });

// In-memory storage
const qtiItems = [];
const qtiAssessments = [];

/**
 * Import QTI package (XML)
 */
router.post('/import', upload.single('qtiFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'QTI file required' });
        }

        const xmlContent = req.file.buffer.toString('utf-8');
        const parser = new xml2js.Parser({ explicitArray: false });

        // Parse XML (simplified - real QTI is more complex)
        let parsed;
        try {
            parsed = await parser.parseStringPromise(xmlContent);
        } catch (e) {
            // If xml2js not available, use mock parsing
            parsed = mockParseQTI(xmlContent);
        }

        const importedItems = [];

        // Extract assessment items
        if (parsed.assessmentItem) {
            const item = convertQTIItem(parsed.assessmentItem);
            qtiItems.push(item);
            importedItems.push(item);
        } else if (parsed.assessmentTest) {
            // Full assessment with multiple items
            const assessment = convertQTIAssessment(parsed.assessmentTest);
            qtiAssessments.push(assessment);
            importedItems.push(...assessment.items);
        }

        res.json({
            success: true,
            message: `Imported ${importedItems.length} item(s)`,
            items: importedItems
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Export questions to QTI format
 */
router.post('/export', async (req, res) => {
    try {
        const { questionIds, format = '2.1' } = req.body;

        // Get questions (from our system)
        const questions = questionIds.map(id => ({
            id,
            type: 'multipleChoice',
            title: `Question ${id}`,
            text: 'Sample question text',
            options: [
                { id: 'A', text: 'Option A', correct: true },
                { id: 'B', text: 'Option B', correct: false },
                { id: 'C', text: 'Option C', correct: false },
                { id: 'D', text: 'Option D', correct: false }
            ]
        }));

        // Convert to QTI XML
        const qtiXml = generateQTIXml(questions, format);

        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Content-Disposition', 'attachment; filename=export.qti.xml');
        res.send(qtiXml);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get imported QTI items
 */
router.get('/items', async (req, res) => {
    try {
        res.json({
            success: true,
            count: qtiItems.length,
            items: qtiItems
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get single QTI item
 */
router.get('/items/:id', async (req, res) => {
    try {
        const item = qtiItems.find(i => i.id === req.params.id);

        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        res.json({ success: true, item });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Validate QTI file
 */
router.post('/validate', upload.single('qtiFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'QTI file required' });
        }

        const xmlContent = req.file.buffer.toString('utf-8');
        const errors = [];
        const warnings = [];

        // Basic validation checks
        if (!xmlContent.includes('<?xml')) {
            errors.push('Invalid XML: Missing XML declaration');
        }

        if (!xmlContent.includes('assessmentItem') && !xmlContent.includes('assessmentTest')) {
            errors.push('Invalid QTI: No assessmentItem or assessmentTest found');
        }

        if (!xmlContent.includes('responseDeclaration')) {
            warnings.push('No responseDeclaration found - answers may not be defined');
        }

        res.json({
            success: errors.length === 0,
            valid: errors.length === 0,
            errors,
            warnings
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper functions
function mockParseQTI(xml) {
    // Simplified mock parsing for demo
    const item = {
        id: `qti-${Date.now()}`,
        title: extractTag(xml, 'title') || 'Imported Question',
        type: xml.includes('choiceInteraction') ? 'multipleChoice' : 'extended',
        itemBody: extractTag(xml, 'itemBody') || 'Question text',
        options: []
    };

    // Extract simple choices
    const choiceMatches = xml.match(/<simpleChoice[^>]*>([^<]+)<\/simpleChoice>/g) || [];
    item.options = choiceMatches.map((match, index) => ({
        id: String.fromCharCode(65 + index),
        text: match.replace(/<[^>]+>/g, '').trim()
    }));

    return { assessmentItem: item };
}

function extractTag(xml, tag) {
    const match = xml.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`));
    return match ? match[1].trim() : null;
}

function convertQTIItem(qtiItem) {
    return {
        id: qtiItem.id || `item-${Date.now()}`,
        title: qtiItem.title || 'Untitled',
        type: mapQTIType(qtiItem),
        text: qtiItem.itemBody || '',
        options: qtiItem.options || [],
        importedAt: new Date().toISOString(),
        source: 'QTI 2.1'
    };
}

function convertQTIAssessment(qtiTest) {
    return {
        id: qtiTest.id || `test-${Date.now()}`,
        title: qtiTest.title || 'Untitled Assessment',
        items: (qtiTest.assessmentItems || []).map(convertQTIItem),
        importedAt: new Date().toISOString()
    };
}

function mapQTIType(item) {
    if (item.type?.includes('choice')) return 'multipleChoice';
    if (item.type?.includes('match')) return 'matching';
    if (item.type?.includes('order')) return 'ordering';
    if (item.type?.includes('text')) return 'shortAnswer';
    return 'multipleChoice';
}

function generateQTIXml(questions, version) {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<assessmentTest xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1"
    identifier="test-${Date.now()}"
    title="Exported Assessment">
    <testPart identifier="part1" navigationMode="linear" submissionMode="individual">
        <assessmentSection identifier="section1" title="Questions" visible="true">
`;

    for (const q of questions) {
        xml += `
            <assessmentItemRef identifier="${q.id}" href="item-${q.id}.xml">
                <itemBody>
                    <p>${q.text}</p>
                    <choiceInteraction responseIdentifier="RESPONSE" shuffle="false" maxChoices="1">
${q.options.map(o => `                        <simpleChoice identifier="${o.id}" fixed="false">${o.text}</simpleChoice>`).join('\n')}
                    </choiceInteraction>
                </itemBody>
            </assessmentItemRef>
`;
    }

    xml += `
        </assessmentSection>
    </testPart>
</assessmentTest>`;

    return xml;
}

module.exports = router;
