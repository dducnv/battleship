import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { createGameHandler } from './game-handler';
import { RoomManager } from './room-manager';

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const roomManager = new RoomManager();

io.on('connection', (socket) => {
  console.log(`[✓] Player connected: ${socket.id}`);
  createGameHandler(io, socket, roomManager);

  socket.on('disconnect', () => {
    console.log(`[✗] Player disconnected: ${socket.id}`);
    const room = roomManager.findRoomByPlayer(socket.id);
    if (room) {
      // Notify remaining player
      socket.to(room.roomId).emit('player_disconnected', {
        message: 'Opponent disconnected',
      });
      roomManager.deleteRoom(room.roomId);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`\n🚀 Battleship server running on http://localhost:${PORT}\n`);
});
