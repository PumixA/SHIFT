'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { socket } from '@/services/socket';

// Types
interface Player {
  id: string;
  name?: string;
  color: 'cyan' | 'violet' | 'orange' | 'green';
  position: number;
  score: number;
  effects?: TemporaryEffect[];
  userId?: string;
  avatarPreset?: string;
  isConnected?: boolean;
}

interface TemporaryEffect {
  id: string;
  type: string;
  value: number;
  turnsRemaining: number;
  source: string;
}

interface Rule {
  id: string;
  title: string;
  trigger: { type: string; value?: any };
  tileIndex?: number;
  conditions?: any[];
  effects: { type: string; value: number; target: string }[];
  priority?: number;
}

interface Tile {
  id: string;
  index: number;
  type: 'start' | 'end' | 'special' | 'normal';
}

interface GameAction {
  id: string;
  type: string;
  playerId: string;
  playerName?: string;
  description: string;
  timestamp: Date;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'emoji' | 'system';
  createdAt: Date;
}

interface GameState {
  roomId: string | null;
  roomName?: string;
  tiles: Tile[];
  players: Player[];
  currentTurn: string;
  status: 'waiting' | 'playing' | 'paused' | 'finished';
  winnerId: string | null;
  activeRules: Rule[];
  turnCount: number;
  actionHistory: GameAction[];
  chatMessages: ChatMessage[];
  typingUsers: string[];
  isConnected: boolean;
  myPlayerId: string | null;
  lastDiceValue: number | null;
  lastLogs: string[];
}

type GameActionType =
  | { type: 'SET_ROOM'; roomId: string }
  | { type: 'SET_CONNECTED'; isConnected: boolean }
  | { type: 'SET_MY_PLAYER_ID'; playerId: string }
  | { type: 'SYNC_STATE'; state: Partial<GameState> }
  | { type: 'ADD_PLAYER'; player: Player }
  | { type: 'REMOVE_PLAYER'; playerId: string }
  | { type: 'UPDATE_PLAYER'; playerId: string; updates: Partial<Player> }
  | { type: 'ADD_RULE'; rule: Rule }
  | { type: 'REMOVE_RULE'; ruleId: string }
  | { type: 'SET_RULES'; rules: Rule[] }
  | { type: 'DICE_RESULT'; diceValue: number; players: Player[]; currentTurn: string; logs: string[] }
  | { type: 'GAME_OVER'; winnerId: string }
  | { type: 'RESET_GAME' }
  | { type: 'ADD_ACTION'; action: GameAction }
  | { type: 'SET_ACTION_HISTORY'; actions: GameAction[] }
  | { type: 'ADD_CHAT_MESSAGE'; message: ChatMessage }
  | { type: 'SET_CHAT_MESSAGES'; messages: ChatMessage[] }
  | { type: 'SET_TYPING_USERS'; users: string[] };

const initialState: GameState = {
  roomId: null,
  tiles: [],
  players: [],
  currentTurn: '',
  status: 'waiting',
  winnerId: null,
  activeRules: [],
  turnCount: 0,
  actionHistory: [],
  chatMessages: [],
  typingUsers: [],
  isConnected: false,
  myPlayerId: null,
  lastDiceValue: null,
  lastLogs: []
};

function gameReducer(state: GameState, action: GameActionType): GameState {
  switch (action.type) {
    case 'SET_ROOM':
      return { ...state, roomId: action.roomId };

    case 'SET_CONNECTED':
      return { ...state, isConnected: action.isConnected };

    case 'SET_MY_PLAYER_ID':
      return { ...state, myPlayerId: action.playerId };

    case 'SYNC_STATE':
      return {
        ...state,
        ...action.state,
        tiles: action.state.tiles || state.tiles,
        players: action.state.players || state.players,
        activeRules: action.state.activeRules || state.activeRules
      };

    case 'ADD_PLAYER':
      if (state.players.find(p => p.id === action.player.id)) {
        return state;
      }
      return { ...state, players: [...state.players, action.player] };

    case 'REMOVE_PLAYER':
      return { ...state, players: state.players.filter(p => p.id !== action.playerId) };

    case 'UPDATE_PLAYER':
      return {
        ...state,
        players: state.players.map(p =>
          p.id === action.playerId ? { ...p, ...action.updates } : p
        )
      };

    case 'ADD_RULE':
      return { ...state, activeRules: [...state.activeRules, action.rule] };

    case 'REMOVE_RULE':
      return { ...state, activeRules: state.activeRules.filter(r => r.id !== action.ruleId) };

    case 'SET_RULES':
      return { ...state, activeRules: action.rules };

    case 'DICE_RESULT':
      return {
        ...state,
        lastDiceValue: action.diceValue,
        players: action.players,
        currentTurn: action.currentTurn,
        lastLogs: action.logs,
        turnCount: state.turnCount + 1
      };

    case 'GAME_OVER':
      return { ...state, status: 'finished', winnerId: action.winnerId };

    case 'RESET_GAME':
      return {
        ...state,
        status: 'waiting',
        winnerId: null,
        turnCount: 0,
        lastDiceValue: null,
        lastLogs: [],
        actionHistory: [],
        players: state.players.map(p => ({ ...p, position: 0, score: 0, effects: [] }))
      };

    case 'ADD_ACTION':
      return {
        ...state,
        actionHistory: [...state.actionHistory.slice(-99), action.action]
      };

    case 'SET_ACTION_HISTORY':
      return { ...state, actionHistory: action.actions };

    case 'ADD_CHAT_MESSAGE':
      return {
        ...state,
        chatMessages: [...state.chatMessages.slice(-99), action.message]
      };

    case 'SET_CHAT_MESSAGES':
      return { ...state, chatMessages: action.messages };

    case 'SET_TYPING_USERS':
      return { ...state, typingUsers: action.users };

    default:
      return state;
  }
}

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameActionType>;
  // Actions
  joinRoom: (roomId: string, playerData?: { name?: string; userId?: string; avatarPreset?: string }) => void;
  leaveRoom: () => void;
  rollDice: () => void;
  createRule: (rule: Omit<Rule, 'id'>) => void;
  deleteRule: (ruleId: string) => void;
  requestRematch: () => void;
  sendChatMessage: (content: string, senderName: string) => void;
  sendEmojiReaction: (emoji: string, senderName: string) => void;
  setTyping: (isTyping: boolean) => void;
  loadRulePack: (packId: string) => void;
  saveGame: (userId: string) => void;
  // Computed
  isMyTurn: boolean;
  myPlayer: Player | null;
  currentPlayer: Player | null;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Socket event listeners
  useEffect(() => {
    socket.on('connect', () => {
      dispatch({ type: 'SET_CONNECTED', isConnected: true });
      dispatch({ type: 'SET_MY_PLAYER_ID', playerId: socket.id || '' });
    });

    socket.on('disconnect', () => {
      dispatch({ type: 'SET_CONNECTED', isConnected: false });
    });

    socket.on('game_state_sync', (gameState: any) => {
      dispatch({ type: 'SYNC_STATE', state: gameState });
    });

    socket.on('player_joined_room', (data: { id: string; name?: string }) => {
      dispatch({
        type: 'ADD_ACTION',
        action: {
          id: crypto.randomUUID(),
          type: 'join',
          playerId: data.id,
          playerName: data.name,
          description: `${data.name || 'Player'} joined`,
          timestamp: new Date()
        }
      });
    });

    socket.on('player_disconnected', (data: { playerId: string; playerName?: string }) => {
      dispatch({ type: 'UPDATE_PLAYER', playerId: data.playerId, updates: { isConnected: false } });
    });

    socket.on('dice_result', (data: { diceValue: number; players: Player[]; currentTurn: string; logs: string[] }) => {
      dispatch({
        type: 'DICE_RESULT',
        diceValue: data.diceValue,
        players: data.players,
        currentTurn: data.currentTurn,
        logs: data.logs
      });
    });

    socket.on('game_over', (data: { winnerId: string }) => {
      dispatch({ type: 'GAME_OVER', winnerId: data.winnerId });
    });

    socket.on('rematch_started', (gameState: any) => {
      dispatch({ type: 'RESET_GAME' });
      dispatch({ type: 'SYNC_STATE', state: gameState });
    });

    socket.on('rule_added', (rule: Rule) => {
      dispatch({ type: 'ADD_RULE', rule });
    });

    socket.on('rule_deleted', (data: { ruleId: string }) => {
      dispatch({ type: 'REMOVE_RULE', ruleId: data.ruleId });
    });

    socket.on('rule_pack_loaded', (data: { packId: string; packName: string; rulesCount: number }) => {
      dispatch({
        type: 'ADD_ACTION',
        action: {
          id: crypto.randomUUID(),
          type: 'rule_triggered',
          playerId: 'system',
          description: `Rule pack "${data.packName}" loaded (${data.rulesCount} rules)`,
          timestamp: new Date()
        }
      });
    });

    socket.on('chat_message', (message: ChatMessage) => {
      dispatch({ type: 'ADD_CHAT_MESSAGE', message });
    });

    socket.on('chat_history', (messages: ChatMessage[]) => {
      dispatch({ type: 'SET_CHAT_MESSAGES', messages });
    });

    socket.on('typing_update', (data: { typingUsers: string[] }) => {
      dispatch({ type: 'SET_TYPING_USERS', users: data.typingUsers });
    });

    socket.on('action_history', (actions: GameAction[]) => {
      dispatch({ type: 'SET_ACTION_HISTORY', actions });
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('game_state_sync');
      socket.off('player_joined_room');
      socket.off('player_disconnected');
      socket.off('dice_result');
      socket.off('game_over');
      socket.off('rematch_started');
      socket.off('rule_added');
      socket.off('rule_deleted');
      socket.off('rule_pack_loaded');
      socket.off('chat_message');
      socket.off('chat_history');
      socket.off('typing_update');
      socket.off('action_history');
    };
  }, []);

  // Actions
  const joinRoom = useCallback((roomId: string, playerData?: { name?: string; userId?: string; avatarPreset?: string }) => {
    socket.emit('join_room', roomId, playerData);
    dispatch({ type: 'SET_ROOM', roomId });
  }, []);

  const leaveRoom = useCallback(() => {
    if (state.roomId) {
      socket.emit('leave_room', { roomId: state.roomId });
      dispatch({ type: 'SET_ROOM', roomId: '' });
    }
  }, [state.roomId]);

  const rollDice = useCallback(() => {
    if (state.roomId) {
      socket.emit('roll_dice', { roomId: state.roomId });
    }
  }, [state.roomId]);

  const createRule = useCallback((rule: Omit<Rule, 'id'>) => {
    socket.emit('create_rule', { ...rule, id: crypto.randomUUID() });
  }, []);

  const deleteRule = useCallback((ruleId: string) => {
    socket.emit('delete_rule', { ruleId });
  }, []);

  const requestRematch = useCallback(() => {
    if (state.roomId) {
      socket.emit('request_rematch', { roomId: state.roomId });
    }
  }, [state.roomId]);

  const sendChatMessage = useCallback((content: string, senderName: string) => {
    if (state.roomId) {
      socket.emit('chat_message', { roomId: state.roomId, content, senderName });
    }
  }, [state.roomId]);

  const sendEmojiReaction = useCallback((emoji: string, senderName: string) => {
    if (state.roomId) {
      socket.emit('chat_emoji_reaction', { roomId: state.roomId, emoji, senderName });
    }
  }, [state.roomId]);

  const setTyping = useCallback((isTyping: boolean) => {
    if (state.roomId) {
      socket.emit('typing_indicator', { roomId: state.roomId, isTyping });
    }
  }, [state.roomId]);

  const loadRulePack = useCallback((packId: string) => {
    socket.emit('load_rule_pack', { packId });
  }, []);

  const saveGame = useCallback((userId: string) => {
    if (state.roomId) {
      socket.emit('save_game_request', { userId, roomId: state.roomId });
    }
  }, [state.roomId]);

  // Computed values
  const isMyTurn = state.currentTurn === state.myPlayerId;
  const myPlayer = state.players.find(p => p.id === state.myPlayerId) || null;
  const currentPlayer = state.players.find(p => p.id === state.currentTurn) || null;

  return (
    <GameContext.Provider
      value={{
        state,
        dispatch,
        joinRoom,
        leaveRoom,
        rollDice,
        createRule,
        deleteRule,
        requestRematch,
        sendChatMessage,
        sendEmojiReaction,
        setTyping,
        loadRulePack,
        saveGame,
        isMyTurn,
        myPlayer,
        currentPlayer
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
}

export default GameContext;
