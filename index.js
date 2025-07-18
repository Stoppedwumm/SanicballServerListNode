const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const path = require("path")
const checkIfUserAgentIsBrowser = require('./UserAgentManager');

app.use(bodyParser.urlencoded({ extended: true }));
app.use("/www", express.static(path.join(__dirname, 'public')));
app.use("/bootstrap", express.static(path.join(__dirname, "node_modules", "bootstrap", "dist", "css")));

const PORT = 8000;

// In-memory server list (DB replacement)
let serverEntries = [];

// Remove servers that haven't pinged in the last 15 minutes
function purgeOldServers() {
    const FIFTEEN_MINUTES = 15 * 60 * 1000;
    const now = new Date();

    serverEntries = serverEntries.filter(entry => {
        return now - entry.last_ping < FIFTEEN_MINUTES;
    });
}

// List all active servers (one per line, IP:port)
app.get('/', (req, res) => {
    if (checkIfUserAgentIsBrowser(req)) {
        res.redirect("/www")
        return
    }

    console.log('Received request for server list');
    purgeOldServers();

    const responseText = serverEntries.map(entry => `${entry.ip}:${entry.port}<br>`).join('');
    res.set('Content-Type', 'text/html');
    res.send(responseText);
});

app.get('/list', (req, res) => {
    console.log('Received request for server list');
    purgeOldServers();

    const responseText = serverEntries.map(entry => `${entry.ip}:${entry.port}<br>`).join('');
    res.set('Content-Type', 'text/html');
    res.send(responseText);
});

// Add or refresh a server
app.post('/add', (req, res) => {
    console.log('Received request to add or refresh server');
    // log body
    console.log('Request body:', req.body);

    const { ip, port } = req.body;

    if (!ip || !port) {
        return res.status(400).send('Invalid arguments.');
    }

    const existingEntry = serverEntries.find(entry => entry.ip === ip && entry.port === parseInt(port));

    if (existingEntry) {
        existingEntry.last_ping = new Date();
        return res.send('Your server has been registered.');
    } else {
        if (serverEntries.length >= 1000000000) {
            return res.status(429).send('Too many servers.');
        }

        serverEntries.push({
            ip,
            port: parseInt(port),
            last_ping: new Date()
        });

        return res.send('Your server has been registered.');
    }
});

// Fallback 404 for non-POST /add requests
app.all('/add', (req, res) => {
    res.redirect("/www/addServer");
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

module.exports = app; // Export for testing purposes