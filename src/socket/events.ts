// Type-safe event name constants
// Change one place → TypeScript catches all usages

export const CLIENT_EVENTS = {
  CREATE_ROOM:     'create_room',
  JOIN_ROOM:       'join_room',
  PLAYER_READY:    'player_ready',
  FIRE_SHOT:       'fire_shot',
  REQUEST_RESTART: 'request_restart',
} as const;

export const SERVER_EVENTS = {
  ROOM_CREATED:    'room_created',
  ROOM_JOINED:     'room_joined',
  ERROR:           'error_message',
  START_PLACEMENT: 'start_placement',
  GAME_START:      'game_start',
  SHOT_RESULT:     'shot_result',
  GAME_OVER:       'game_over',
  ROOM_RESET:      'room_reset',
  PLAYER_DISCONNECTED: 'player_disconnected',
} as const;
