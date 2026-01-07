# Tetris Deployment

This project is a web-based Tetris game with a leaderboard. It consists of a frontend (in the `webgame` directory) and a backend (in the `server` directory).

## Deploying with Netlify

[Netlify](https://www.netlify.com/) is a great platform for deploying this project. It can host the static frontend and the serverless backend.

### 1. Create a Git Repository

Create a new Git repository for this project and push your code to it.

### 2. Configure Your Site on Netlify

1.  Go to your Netlify dashboard and click "New site from Git".
2.  Choose your Git provider and select your repository.
3.  Netlify will automatically detect the `netlify.toml` file and configure the build settings.

### 3. Build Configuration (`netlify.toml`)

The `netlify.toml` file configures the build and deployment settings for Netlify.

```toml
[build]
  # This is the directory where the static files for your site are located.
  publish = "webgame"
  # This is the command to build your site. Since we don't have a build step, this is empty.
  command = ""

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/server/:splat"
  status = 200

[functions]
  directory = "server"
```

### 4. Create a Netlify Function

The backend server needs to be converted to a Netlify serverless function. To do this, you need to modify the `server/server.js` file.

Instead of starting an Express server with `app.listen`, you'll export a handler for the serverless function. You'll need to install `serverless-http`.

```bash
npm install serverless-http
```

Then, modify `server/server.js` like this:

```javascript
const express = require('express');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const serverless = require('serverless-http');

const adapter = new FileSync('/tmp/db.json'); // Use /tmp for serverless environment
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

```

### 5. Update Frontend API Calls

In `webgame/script.js`, you need to update the `fetch` URLs to use the Netlify function endpoint. Change `http://localhost:3000` to `/api`.

For example:

```javascript
await fetch('/api/leaderboard', {
    // ...
});
```

### 6. Deploy

Once you have pushed all these changes to your Git repository, Netlify will automatically build and deploy your site. You'll get a unique URL for your game.

Good luck!
