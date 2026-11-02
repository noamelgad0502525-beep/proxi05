const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// רשימת הקודים הפעילים (נשמרת בזיכרון של השרת כל עוד הוא רץ)
let activeCodes = new Set();

// דף הבית (האתר שלכם)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🔒 מערכת פיקוח: הפקת קוד חדש על ידי המנהל
app.post('/api/generate-code', (req, res) => {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    activeCodes.add(newCode);
    res.json({ success: true, code: newCode });
});

// 🔑 רישום תלמיד: בדיקה ומחיקה של קוד חד-פעמי
app.post('/api/verify-code', (req, res) => {
    const { code, name } = req.body;
    
    if (activeCodes.has(code)) {
        activeCodes.delete(code); // מחיקה מיידית - הופך לחד-פעמי!
        res.json({ success: true, message: `שלום ${name}, הגישה לפרוקסי נפתחה!` });
    } else {
        res.status(400).json({ success: false, message: "קוד שגוי או שכבר השתמשו בו!" });
    }
});

// 🏖 שרת הפרוקסי: מביא את האתר החסום דרך השרת של Render ועוקף חסימות
app.get('/proxy', async (req, res) => {
    let targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('נא להזין כתובת אתר');

    // הוספת http אם התלמיד שכח לרשום
    if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = 'https://' + targetUrl;
    }

    try {
        const response = await fetch(targetUrl);
        const body = await response.text();
        res.send(body); 
    } catch (error) {
        res.status(500).send('שגיאה בטעינת האתר דרך הפרוקסי: ' + error.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`הפרוקסי של נועם ונהוראי באוויר בפורט ${PORT}`);
});