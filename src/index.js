import express from 'express';
import { matchesRouter } from './routes/matches.js';
import http from 'http';
import { attachWebSocketServer } from './ws/server.js';
import { securityMiddleware } from './arcjet.js';

const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || '0.0.0.0';

const app = express();
const server = http.createServer(app);

// JSON middleware
app.use(express.json());

// Root GET route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Sportz API!' });
});

app.use(securityMiddleware());
app.use('/matches', matchesRouter);

const { broadcastMatchCreated } = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;

// Start server
server.listen(PORT, HOST, () => {
  const baseUrl = HOST === '0.0.0.0' ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
  console.log(`Server running at ${baseUrl}`);
  console.log(`Websocket server running at ${baseUrl.replace('http', 'ws')}/ws`);
});
