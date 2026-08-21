const fs = require('fs');
const { execSync } = require('child_process');

try {
  const diff = execSync('git diff HEAD~5 GameBoard.jsx', { cwd: 'c:/game-theory2/client/src/pages/Game', encoding: 'utf8' });
  fs.writeFileSync('c:/game-theory2/diff.txt', diff);
} catch (e) {
  // Maybe there are no commits? 
  fs.writeFileSync('c:/game-theory2/diff.txt', 'Error: ' + e.message);
}
