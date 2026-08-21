const fs = require('fs');

const files = [
    'c:/game-theory2/client/src/index.css',
    'c:/game-theory2/client/src/App.jsx',
    'c:/game-theory2/client/src/pages/Lobby.jsx',
    'c:/game-theory2/client/src/pages/Game/GameBoard.jsx'
];

files.forEach(filepath => {
    let content = fs.readFileSync(filepath, 'utf8');
    
    // Replace class name parts
    content = content.replace(/emerald/g, 'brand');
    content = content.replace(/glow-green/g, 'glow-brand');
    content = content.replace(/text-glow-green/g, 'text-glow-brand');
    content = content.replace(/flash-green/g, 'flash-brand');
    content = content.replace(/flashGreen/g, 'flashBrand');
    content = content.replace(/gradient-text-green/g, 'gradient-text-brand');
    content = content.replace(/border-gradient-green/g, 'border-gradient-brand');
    
    // Fix text contrast
    content = content.replace(/bg-brand-500 text-black/g, 'bg-brand-500 text-white');
    
    fs.writeFileSync(filepath, content, 'utf8');
});

console.log("Replaced successfully");
