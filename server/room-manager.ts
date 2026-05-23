import { nanoid } from './utils';
import type { Board, GamePhase, PlacedShip } from '../src/game/types';
import { createEmptyBoard } from '../src/game/board';

export interface ServerPlayer {
  socketId: string;
  ready: boolean;
  board: Board;
  shipsPlaced: PlacedShip[];
  totalHitsReceived: number;
}

export interface ServerRoom {
  roomId: string;
  players: Map<string, ServerPlayer>;
  turn: string;
  gameState: GamePhase;
  winnerId: string | null;
}

export class RoomManager {
  private rooms = new Map<string, ServerRoom>();

  createRoom(): string {
    const roomId = nanoid(6);
    this.rooms.set(roomId, {
      roomId,
      players: new Map(),
      turn: '',
      gameState: 'waiting',
      winnerId: null,
    });
    return roomId;
  }

  getRoom(roomId: string): ServerRoom | undefined {
    return this.rooms.get(roomId);
  }

  addPlayer(roomId: string, socketId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    if (room.players.size >= 2) return false;

    room.players.set(socketId, {
      socketId,
      ready: false,
      board: createEmptyBoard(),
      shipsPlaced: [],
      totalHitsReceived: 0,
    });

    return true;
  }

  setPlayerReady(
    roomId: string,
    socketId: string,
    board: Board,
    shipsPlaced: PlacedShip[]
  ): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const player = room.players.get(socketId);
    if (!player) return false;

    player.ready = true;
    player.board = board;
    player.shipsPlaced = shipsPlaced;

    return true;
  }

  areBothPlayersReady(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.players.size < 2) return false;
    return Array.from(room.players.values()).every(p => p.ready);
  }

  getPlayerIds(roomId: string): string[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return Array.from(room.players.keys());
  }

  getOpponentId(roomId: string, socketId: string): string | undefined {
    const playerIds = this.getPlayerIds(roomId);
    return playerIds.find(id => id !== socketId);
  }

  findRoomByPlayer(socketId: string): ServerRoom | undefined {
    for (const room of this.rooms.values()) {
      if (room.players.has(socketId)) return room;
    }
    return undefined;
  }

  deleteRoom(roomId: string): void {
    this.rooms.delete(roomId);
  }

  resetRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.gameState = 'placing';
    room.turn = '';
    room.winnerId = null;

    for (const player of room.players.values()) {
      player.ready = false;
      player.board = createEmptyBoard();
      player.shipsPlaced = [];
      player.totalHitsReceived = 0;
    }
  }
}
