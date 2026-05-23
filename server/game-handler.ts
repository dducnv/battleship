import type { Server, Socket } from 'socket.io';
import type { RoomManager } from './room-manager';
import { processShot, checkGameOver } from '../src/game/shot';
import { validateShot } from '../src/game/validation';

export function createGameHandler(
  io: Server,
  socket: Socket,
  rooms: RoomManager
): void {
  // ── Create Room ──
  socket.on('create_room', () => {
    const roomId = rooms.createRoom();
    rooms.addPlayer(roomId, socket.id);
    socket.join(roomId);
    socket.emit('room_created', { roomId });
    console.log(`[Room] ${socket.id} created room ${roomId}`);
  });

  // ── Join Room ──
  socket.on('join_room', ({ roomId }: { roomId: string }) => {
    const room = rooms.getRoom(roomId);

    if (!room) {
      socket.emit('error_message', { message: 'Room not found' });
      return;
    }

    if (room.players.size >= 2) {
      socket.emit('error_message', { message: 'Room is full' });
      return;
    }

    const added = rooms.addPlayer(roomId, socket.id);
    if (!added) {
      socket.emit('error_message', { message: 'Could not join room' });
      return;
    }

    socket.join(roomId);

    // Notify all players in room
    io.to(roomId).emit('room_joined', {
      roomId,
      totalPlayers: room.players.size,
    });

    console.log(`[Room] ${socket.id} joined room ${roomId} (${room.players.size}/2)`);

    // If 2 players, start placement phase
    if (room.players.size === 2) {
      room.gameState = 'placing';
      io.to(roomId).emit('start_placement', {});
      console.log(`[Game] Room ${roomId} → placing`);
    }
  });

  // ── Player Ready (ships placed) ──
  socket.on('player_ready', ({ roomId, board, shipsPlaced }) => {
    const room = rooms.getRoom(roomId);
    if (!room) return;

    rooms.setPlayerReady(roomId, socket.id, board, shipsPlaced);
    console.log(`[Game] ${socket.id} ready in room ${roomId}`);

    // Notify opponent that this player is ready
    const opponentId = rooms.getOpponentId(roomId, socket.id);
    if (opponentId) {
      io.to(opponentId).emit('opponent_ready', {});
    }

    // If both ready, start game
    if (rooms.areBothPlayersReady(roomId)) {
      const playerIds = rooms.getPlayerIds(roomId);
      const firstTurn = playerIds[Math.floor(Math.random() * 2)];
      room.turn = firstTurn;
      room.gameState = 'playing';

      io.to(roomId).emit('game_start', { activeTurnId: firstTurn });
      console.log(`[Game] Room ${roomId} → playing (first turn: ${firstTurn})`);
    }
  });

  // ── Fire Shot ──
  socket.on('fire_shot', ({ roomId, x, y }: { roomId: string; x: number; y: number }) => {
    const room = rooms.getRoom(roomId);
    if (!room || room.gameState !== 'playing') return;

    // Verify it's this player's turn
    if (room.turn !== socket.id) {
      socket.emit('error_message', { message: 'Not your turn' });
      return;
    }

    const opponentId = rooms.getOpponentId(roomId, socket.id);
    if (!opponentId) return;

    const opponent = room.players.get(opponentId);
    if (!opponent) return;

    // Validate shot
    const validation = validateShot(opponent.board, x, y);
    if (!validation.valid) {
      socket.emit('error_message', { message: validation.reason || 'Invalid shot' });
      return;
    }

    // Process shot on opponent's board
    const result = processShot(opponent.board, opponent.shipsPlaced, x, y);
    opponent.board = result.board;
    opponent.shipsPlaced = result.ships;

    if (result.isHit) {
      opponent.totalHitsReceived++;
    }

    // Determine next turn
    const nextTurnId = opponentId;
    room.turn = nextTurnId;

    // Send result to attacker (for tracking board)
    socket.emit('shot_result', {
      attackerId: socket.id,
      x,
      y,
      isHit: result.isHit,
      isSunk: result.isSunk,
      sunkShipId: result.sunkShipId,
      nextTurnId,
    });

    // Notify opponent their board was hit
    io.to(opponentId).emit('shot_result', {
      attackerId: socket.id,
      x,
      y,
      isHit: result.isHit,
      isSunk: result.isSunk,
      sunkShipId: result.sunkShipId,
      nextTurnId,
    });

    console.log(`[Game] ${socket.id} fires (${x},${y}) → ${result.isHit ? 'HIT' : 'MISS'}${result.isSunk ? ' SUNK!' : ''}`);

    // Check game over
    if (checkGameOver(opponent.shipsPlaced)) {
      room.gameState = 'ended';
      room.winnerId = socket.id;

      // Send game over with opponent boards revealed
      const attacker = room.players.get(socket.id);
      io.to(socket.id).emit('game_over', {
        winnerId: socket.id,
        opponentBoard: opponent.board,
      });
      io.to(opponentId).emit('game_over', {
        winnerId: socket.id,
        opponentBoard: attacker?.board,
      });

      console.log(`[Game] Room ${roomId} → GAME OVER! Winner: ${socket.id}`);
    }
  });

  // ── Request Restart ──
  socket.on('request_restart', ({ roomId }: { roomId: string }) => {
    const room = rooms.getRoom(roomId);
    if (!room) return;

    rooms.resetRoom(roomId);
    io.to(roomId).emit('room_reset', {});
    console.log(`[Game] Room ${roomId} → reset`);
  });
}
