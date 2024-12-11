const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3001;

app.use(express.static(path.join(__dirname, 'publ1c')));
app.use(bodyParser.json());

const logFilePath = path.join(__dirname, 'events_log.txt');

app.post('/api/saveEvent', (req, res) => {
    const event = req.body;

    const serverTime = new Date().toISOString();
    const eventWithServerTime = {
        ...event,
        serverTime,
    };

    fs.appendFile(logFilePath, JSON.stringify(eventWithServerTime) + '\n', (err) => {
        if (err) {
            console.error('Error saving event to file:', err);
            return res.status(500).json({ error: 'Failed to save event' });
        }

        res.json({ serverTime });
    });
});

app.get('/api/getEvents', (req, res) => {
    if (!fs.existsSync(logFilePath)) {
        return res.json([]); 
    }

    fs.readFile(logFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading events from file:', err);
            return res.status(500).json({ error: 'Failed to read events' });
        }

        const events = data
            .split('\n') 
            .filter(line => line.trim()) 
            .map(line => JSON.parse(line)); 

        res.json(events); 
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
