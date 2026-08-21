import { resolveMarket } from '../game/marketLogic.js';

const mockPlayers = [
  { id: 'p1', name: 'Alice', inventory: 100 },
  { id: 'p2', name: 'Bob', inventory: 100 },
  { id: 'p3', name: 'Charlie', inventory: 100 },
  { id: 'p4', name: 'Dave', inventory: 100 }
];

console.log('--- TEST 1: Cartel Holds (Equal Price) ---');
let submissions = [
  { playerId: 'p1', price: 50, quantity: 50 },
  { playerId: 'p2', price: 50, quantity: 50 },
  { playerId: 'p3', price: 50, quantity: 50 },
  { playerId: 'p4', price: 50, quantity: 50 }
];
let result = resolveMarket(mockPlayers, submissions, 200);
console.log(JSON.stringify(result, null, 2));

console.log('\n--- TEST 2: Single Undercut ---');
submissions = [
  { playerId: 'p1', price: 50, quantity: 50 },
  { playerId: 'p2', price: 40, quantity: 100 }, // Bob undercuts and offers full inventory
  { playerId: 'p3', price: 50, quantity: 50 },
  { playerId: 'p4', price: 50, quantity: 50 }
];
result = resolveMarket(mockPlayers, submissions, 200);
console.log(JSON.stringify(result, null, 2));

console.log('\n--- TEST 3: Market Crash (Multiple dumping at cost) ---');
submissions = [
  { playerId: 'p1', price: 15, quantity: 100 },
  { playerId: 'p2', price: 15, quantity: 100 },
  { playerId: 'p3', price: 50, quantity: 50 },
  { playerId: 'p4', price: 50, quantity: 50 }
];
result = resolveMarket(mockPlayers, submissions, 200);
console.log(JSON.stringify(result, null, 2));
