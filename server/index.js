import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './game/roomManager.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Market Tomato Game Server is running!');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const roomManager = new RoomManager(io);

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on('join_room', ({ roomId, playerName }) => {
    roomManager.joinRoom(socket, roomId, playerName);
  });

  socket.on('chat_message', (data) => {
    roomManager.handleChatMessage(socket, data);
  });
  
  socket.on('start_game', ({ roomId }) => {
    roomManager.startGame(roomId, socket.id);
  });
  
  socket.on('restart_game', ({ roomId }) => {
    roomManager.restartGame(roomId, socket.id);
  });
  
  socket.on('add_bot', ({ roomId }) => {
    roomManager.addBot(socket, roomId);
  });

  socket.on('propose_cartel_price', (data) => {
    roomManager.proposeCartelPrice(socket, data);
  });

  socket.on('submit_secret_order', (data) => {
    roomManager.submitSecretOrder(socket, data);
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    roomManager.handleDisconnect(socket);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
