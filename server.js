const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'inquiry.json');

// Middleware
app.use(cors()); // Allows index.html to talk to this server
app.use(express.json());

// Initialize JSON file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// --- API: Save Inquiry ---
app.post('/save-inquiry', (req, res) => {
    const newData = req.body;
    
    // 1. Read existing file
    fs.readFile(DATA_FILE, 'utf8', (err, fileData) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
        }

        // 2. Parse JSON
        let jsonArray = [];
        try {
            jsonArray = JSON.parse(fileData || '[]');
        } catch (e) {
            jsonArray = [];
        }

        // 3. Add Timestamp & Push
        newData.saved_at = new Date().toLocaleString();
        jsonArray.push(newData);

        // 4. Write back to file
        fs.writeFile(DATA_FILE, JSON.stringify(jsonArray, null, 2), (err) => {
            if (err) {
                console.error('Error writing file:', err);
                return res.status(500).json({ status: 'error', message: 'Failed to save' });
            }
            console.log(`[${new Date().toLocaleTimeString()}] ✅ New Lead Saved: ${newData.name}`);
            res.json({ status: 'success', message: 'Saved successfully' });
        });
    });
});

// --- API: Export (Optional Admin Feature) ---
app.get('/get-inquiries', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).send("Error");
        res.json(JSON.parse(data));
    });
});

app.listen(PORT, () => {
    console.log(`------------------------------------------------`);
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📂 Saving data to: ${DATA_FILE}`);
    console.log(`------------------------------------------------`);
});