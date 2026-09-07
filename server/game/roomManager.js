import { v4 as uuidv4 } from 'uuid';
import { resolveMarket } from './marketLogic.js';

export const PHASES = {
  LOBBY: 'LOBBY',
  SUMMIT: 'SUMMIT', // 60s
  SECRET_DISPATCH: 'SECRET_DISPATCH', // 20s
  MARKET_REVEAL: 'MARKET_REVEAL', // 15s
  GAME_OVER: 'GAME_OVER'
};

const PHASE_DURATIONS = {
  [PHASES.SUMMIT]: 15,
  [PHASES.SECRET_DISPATCH]: 20,
  [PHASES.MARKET_REVEAL]: 5
};

const BOT_EASTER_EGGS = [
  "Gabababababa",
  "Wi-hahaha",
  "Dereshishishi",
  "Absolute Cinema!",
  "Holy Peak",
  "Ratio"
];

export class RoomManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // roomId -> room data
    this.playerRooms = new Map(); // socket.id -> roomId
  }

  joinRoom(socket, roomId, playerName) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        hostId: socket.id,
        players: new Map(), // id -> player object
        currentPhase: PHASES.LOBBY,
        currentRound: 0,
        maxRounds: 5,
        cartelAgreedPrice: null,
        cartelProposals: [],
        secretSubmissions: new Map(), // id -> { price, quantity, auditTarget, sabotageType, sabotageTarget }
        priceHistory: [],
        currentEvent: null,
        heatLevel: 0,
        timer: null,
        timeRemaining: 0
      });
    }

    const room = this.rooms.get(roomId);
    
    if (room.currentPhase !== PHASES.LOBBY) {
      socket.emit('error', 'Game has already started');
      return;
    }
    
    if (room.players.size >= 6) {
      socket.emit('error', 'Room is full (max 6 players)');
      return;
    }

    const existingNames = Array.from(room.players.values()).map(p => p.name.toLowerCase());
    if (existingNames.includes(playerName.toLowerCase())) {
      socket.emit('error', 'Name already taken in this room');
      return;
    }

    const isHost = room.hostId === socket.id;

    // Random avatar
    const avatars = ['👨‍🌾', '👩‍🌾', '🍅', '🦊', '🦝', '🐮', '🐷', '🐔', '🚜', '🎩', '🧑‍🍳', '🐻'];
    const assignedAvatar = avatars[room.players.size % avatars.length];

    const player = {
      id: socket.id,
      name: playerName,
      balance: 5000,
      inventory: 100,
      isHost,
      avatar: assignedAvatar,
      isBot: false
    };

    room.players.set(socket.id, player);
    this.playerRooms.set(socket.id, roomId);
    socket.join(roomId);

    this.broadcastRoomState(roomId);
  }

  addBot(socket, roomId) {
    const room = this.rooms.get(roomId);
    if (!room || room.hostId !== socket.id || room.currentPhase !== PHASES.LOBBY) return;
    
    if (room.players.size >= 6) {
      socket.emit('error', 'Room is full');
      return;
    }

    const botNames = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo'];
    const botId = `bot_${uuidv4()}`;
    const botName = botNames[room.players.size - 1] || 'Omega';

    const avatars = ['🤖', '🦊', '🦝', '🐻', '🎩', '🍅'];
    const botAvatar = avatars[(room.players.size - 1) % avatars.length];

    const bot = {
      id: botId,
      name: botName,
      balance: 5000,
      inventory: 100,
      isHost: false,
      avatar: botAvatar,
      isBot: true
    };

    room.players.set(botId, bot);
    this.broadcastRoomState(roomId);
  }
  
  handleChatMessage(socket, { roomId, message }) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    
    const player = room.players.get(socket.id);
    if (!player) return;
    
    this.io.to(roomId).emit('chat_message', {
      id: uuidv4(),
      playerId: socket.id,
      playerName: player.name,
      message,
      timestamp: Date.now()
    });

    // Occasional bot reaction when humans chat
    if (!player.isBot && room.currentPhase === PHASES.SUMMIT) {
      const bots = Array.from(room.players.values()).filter(p => p.isBot);
      if (bots.length > 0 && Math.random() < 0.25) {
        const respondingBot = bots[Math.floor(Math.random() * bots.length)];
        const replyDelay = Math.floor(Math.random() * 1600) + 900; // 0.9s to 2.5s
        setTimeout(() => {
          const currentRoom = this.rooms.get(roomId);
          if (currentRoom && currentRoom.currentPhase === PHASES.SUMMIT) {
            // Only 6% chance for easter egg on chat reply
            if (Math.random() < 0.06) {
              const egg = BOT_EASTER_EGGS[Math.floor(Math.random() * BOT_EASTER_EGGS.length)];
              this.handleChatMessage({ id: respondingBot.id }, { roomId, message: egg });
            } else {
              const replies = [
                "Agreed!",
                "Sounds solid to me.",
                "Let's stick to the price.",
                "Watch out for undercuts.",
                "I'm keeping my price fair."
              ];
              const reply = replies[Math.floor(Math.random() * replies.length)];
              this.handleChatMessage({ id: respondingBot.id }, { roomId, message: reply });
            }
          }
        }, replyDelay);
      }
    }
  }

  startGame(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room || room.hostId !== socketId || room.players.size < 2) return; // For testing allow 2+, realistically 4+

    room.currentRound = 1;
    this.startPhase(roomId, PHASES.SUMMIT);
  }

  restartGame(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room || room.hostId !== socketId) return;

    // Reset room state
    room.currentRound = 1;
    room.heatLevel = 0;
    room.priceHistory = [];
    room.cartelProposals = [];
    room.cartelAgreedPrice = null;
    room.secretSubmissions.clear();
    
    // Reset players
    for (let player of room.players.values()) {
      player.balance = 5000;
      player.inventory = 100;
    }

    this.startPhase(roomId, PHASES.SUMMIT);
  }

  startPhase(roomId, phase) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    if (room.timer) clearInterval(room.timer);

    room.currentPhase = phase;
    room.timeRemaining = PHASE_DURATIONS[phase] || 0;
    
    // Reset phase specific state
    if (phase === PHASES.SUMMIT) {
      room.cartelProposals = [];
      room.cartelAgreedPrice = null;
      
      const numPlayers = Math.max(1, room.players.size);
      const normalDemand = numPlayers * 50;
      const festivalDemand = Math.floor(numPlayers * 75);

      // Roll Event
      const events = [
        { type: 'NORMAL', name: 'Normal Market', desc: `Standard trading day (${normalDemand} crates demand).` },
        { type: 'STIMULUS', name: 'Tomato Festival!', desc: `Buyer demand surges to ${festivalDemand} crates (+50%)!` },
        { type: 'CRACKDOWN', name: 'Strict Storage Inspection!', desc: 'Spoiled tomato storage fees double to 400.' },
        { type: 'CRISIS', name: 'Tomato Shortage!', desc: 'Tomato deliveries limited to 50 crates.' }
      ];
      room.currentEvent = events[Math.floor(Math.random() * events.length)];
      
      const startingInventory = room.currentEvent.type === 'CRISIS' ? 50 : 100;

      // Add inventory for new round
      for (let player of room.players.values()) {
        player.inventory = startingInventory;
      }

      // Make bots talk, propose prices, or drop easter eggs
      for (let player of room.players.values()) {
        if (player.isBot) {
          const delay = Math.floor(Math.random() * 8000) + 1500; // 1.5s to 9.5s
          setTimeout(() => {
            const roomCheck = this.rooms.get(roomId);
            if (roomCheck && roomCheck.currentPhase === PHASES.SUMMIT) {
              const suggestedPrice = Math.floor(Math.random() * (80 - 40 + 1) + 40);
              const roll = Math.random();
              
              if (roll < 0.50) {
                // Propose a price + system chat
                this.proposeCartelPrice({ id: player.id }, { roomId, price: suggestedPrice });
                const msgs = [
                  `[SYSTEM] Proposes target price: ${suggestedPrice}`,
                  `Let's all sell crates at ${suggestedPrice} this round.`,
                  `${suggestedPrice} per crate is fair. Nobody dump lower!`,
                  `If all sellers hold at ${suggestedPrice}, we make max profit.`
                ];
                const msg = msgs[Math.floor(Math.random() * msgs.length)];
                this.handleChatMessage({ id: player.id }, { roomId, message: msg });
              } else if (roll < 0.94) {
                // Strategic banter
                const msgs = [
                  "Don't undercut our crate agreement guys...",
                  "Lost too much on rotten tomatoes last round.",
                  "Who's gonna dump cheap crates this time?",
                  "I'm keeping my prices steady.",
                  "We need to keep tomato prices high."
                ];
                const msg = msgs[Math.floor(Math.random() * msgs.length)];
                this.handleChatMessage({ id: player.id }, { roomId, message: msg });
              } else {
                // Bot Easter Eggs (rare: 6% chance)
                const easterEgg = BOT_EASTER_EGGS[Math.floor(Math.random() * BOT_EASTER_EGGS.length)];
                this.handleChatMessage({ id: player.id }, { roomId, message: easterEgg });
              }
            }
          }, delay);
        }
      }

    } else if (phase === PHASES.SECRET_DISPATCH) {
      room.secretSubmissions.clear();
      
      // Auto-generate submissions for bots
      for (let player of room.players.values()) {
        if (player.isBot) {
          const basePrice = room.cartelAgreedPrice || Math.floor(Math.random() * (80 - 30 + 1) + 30);
          let submitPrice = basePrice;
          const rand = Math.random();
          
          if (rand < 0.20) { // 20% dump
             submitPrice = 15;
          } else if (rand < 0.50) { // 30% undercut (0.20 to 0.50)
             submitPrice = Math.max(10, basePrice - 5);
          }
          // else 50% follow (0.50 to 1.0)
          
          room.secretSubmissions.set(player.id, {
             price: submitPrice,
             quantity: player.inventory,
             auditTarget: null,
             sabotageType: null,
             sabotageTarget: null
          });
        }
      }
      
      // If ONLY bots are left to submit (e.g., human submitted very fast or it's an all-bot game)
      if (room.secretSubmissions.size === room.players.size) {
        if (room.timer) clearInterval(room.timer);
        setTimeout(() => this.advancePhase(roomId), 1000); // small delay to let clients see it started
      }
    } else if (phase === PHASES.MARKET_REVEAL) {
      this.resolveRound(roomId);
    } else if (phase === PHASES.GAME_OVER) {
      this.broadcastRoomState(roomId);
      return;
    }

    this.broadcastRoomState(roomId);

    if (room.timeRemaining > 0) {
      room.timer = setInterval(() => {
        room.timeRemaining -= 1;
        this.io.to(roomId).emit('phase_timer_tick', room.timeRemaining);

        if (room.timeRemaining <= 0) {
          clearInterval(room.timer);
          this.advancePhase(roomId);
        }
      }, 1000);
    }
  }

  advancePhase(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    switch (room.currentPhase) {
      case PHASES.SUMMIT:
        this.startPhase(roomId, PHASES.SECRET_DISPATCH);
        break;
      case PHASES.SECRET_DISPATCH:
        this.startPhase(roomId, PHASES.MARKET_REVEAL);
        break;
      case PHASES.MARKET_REVEAL:
        if (room.currentRound >= room.maxRounds) {
          this.startPhase(roomId, PHASES.GAME_OVER);
        } else {
          room.currentRound += 1;
          this.startPhase(roomId, PHASES.SUMMIT);
        }
        break;
    }
  }

  proposeCartelPrice(socket, { roomId, price }) {
    const room = this.rooms.get(roomId);
    if (!room || room.currentPhase !== PHASES.SUMMIT) return;

    const proposal = { playerId: socket.id, price };
    room.cartelProposals.push(proposal);
    // Simple logic: last proposal is the current "agreed" one if no voting implemented yet
    room.cartelAgreedPrice = price;
    
    this.broadcastRoomState(roomId);
  }

  submitSecretOrder(socket, { roomId, price, quantity, auditTarget, sabotageType, sabotageTarget }) {
    const room = this.rooms.get(roomId);
    if (!room || room.currentPhase !== PHASES.SECRET_DISPATCH) return;

    const player = room.players.get(socket.id);
    if (!player) return;
    
    const validQty = Math.min(Math.max(0, quantity), player.inventory);
    
    let cost = 0;
    if (auditTarget && auditTarget !== socket.id) cost += 300;
    if (sabotageType === 'Thugs') cost += 800;
    if (sabotageType === 'Bribe') cost += 1200;

    if (player.balance < cost) {
       // Cannot afford all actions, strip them
       auditTarget = null;
       sabotageType = null;
       sabotageTarget = null;
    } else {
       player.balance -= cost;
    }

    room.secretSubmissions.set(socket.id, { 
      price, 
      quantity: validQty, 
      auditTarget, 
      sabotageType, 
      sabotageTarget 
    });

    // Send individual confirmation
    socket.emit('order_confirmed', { success: true });
    
    // Broadcast how many have submitted (but not what)
    this.io.to(roomId).emit('submissions_update', Array.from(room.secretSubmissions.keys()));

    // If everyone submitted, early advance
    if (room.secretSubmissions.size === room.players.size) {
      if (room.timer) clearInterval(room.timer);
      this.advancePhase(roomId);
    }
  }

  resolveRound(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const numPlayers = Math.max(1, room.players.size);
    let marketDemand = numPlayers * 50; 
    let holdingCost = 200;
    if (room.currentEvent?.type === 'STIMULUS') marketDemand = Math.floor(numPlayers * 75);
    if (room.currentEvent?.type === 'CRACKDOWN') holdingCost = 400;
    
    const submissions = Array.from(room.secretSubmissions.entries()).map(([id, sub]) => ({
      playerId: id,
      price: sub.price,
      quantity: sub.quantity,
      auditTarget: sub.auditTarget,
      sabotageType: sub.sabotageType,
      sabotageTarget: sub.sabotageTarget
    }));

    const result = resolveMarket(Array.from(room.players.values()), submissions, {
      totalDemand: marketDemand,
      holdingCost: holdingCost,
      heatLevel: room.heatLevel
    });
    
    room.heatLevel = result.newHeatLevel;

    // Apply results to players
    for (let res of result.playerResults) {
      const player = room.players.get(res.playerId);
      if (player) {
        player.balance += res.revenue - res.holdingCost;
        if (res.raided) {
          player.balance -= res.seizedAmount; // Deduct seized amount
        }
        player.inventory -= (res.soldQuantity + res.inventoryDestroyed);
      }
    }

    room.priceHistory.push({
      round: room.currentRound,
      agreedPrice: room.cartelAgreedPrice,
      event: room.currentEvent,
      results: result.playerResults,
      marketCrashed: result.marketCrashed,
      policeRaid: result.policeRaid,
      totalDemand: result.totalDemand || marketDemand,
      totalSold: result.totalSold !== undefined ? result.totalSold : result.playerResults.reduce((s, r) => s + (r.soldQuantity || 0), 0)
    });

    this.broadcastRoomState(roomId);
  }

  handleDisconnect(socket) {
    const roomId = this.playerRooms.get(socket.id);
    if (roomId) {
      const room = this.rooms.get(roomId);
      if (room) {
        room.players.delete(socket.id);
        this.playerRooms.delete(socket.id);
        
        if (room.players.size === 0) {
          this.rooms.delete(roomId);
        } else if (room.hostId === socket.id) {
          // Reassign host
          room.hostId = Array.from(room.players.keys())[0];
          const newHost = room.players.get(room.hostId);
          if (newHost) newHost.isHost = true;
          this.broadcastRoomState(roomId);
        } else {
          this.broadcastRoomState(roomId);
        }
      }
    }
  }

  broadcastRoomState(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const numPlayers = Math.max(1, room.players.size);
    const currentDemand = room.currentEvent?.type === 'STIMULUS' 
      ? Math.floor(numPlayers * 75) 
      : numPlayers * 50;

    const publicState = {
      id: room.id,
      currentPhase: room.currentPhase,
      currentRound: room.currentRound,
      maxRounds: room.maxRounds,
      marketDemand: currentDemand,
      cartelAgreedPrice: room.cartelAgreedPrice,
      currentEvent: room.currentEvent,
      heatLevel: room.heatLevel,
      priceHistory: room.priceHistory,
      timeRemaining: room.timeRemaining,
      submissions: Array.from(room.secretSubmissions.keys()),
      players: Array.from(room.players.values()).map(p => ({
        id: p.id,
        name: p.name,
        balance: p.balance,
        inventory: p.inventory,
        isHost: p.isHost,
        isBot: p.isBot
      }))
    };

    this.io.to(roomId).emit('room_state_update', publicState);
  }
}
