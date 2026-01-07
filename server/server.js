const express = require('express');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const serverless = require('serverless-http');

const adapter = new FileSync('/tmp/db.json');
const db = low(adapter);

// Set some defaults
db.defaults({ scores: [] }).write();

const app = express();
app.use(express.json());

// CORS Middleware
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.get('/leaderboard', (req, res) => {
    const scores = db.get('scores').orderBy('score', 'desc').take(10).value();
    res.json(scores);
});

app.post('/leaderboard', (req, res) => {
    const { name, score } = req.body;
    if (name && typeof name === 'string' && name.trim().length > 0 && typeof score === 'number') {
        db.get('scores').push({ name: name.trim(), score }).write();
        res.status(201).send();
    } else {
        res.status(400).send('Invalid data');
    }
});

module.exports.handler = serverless(app);
