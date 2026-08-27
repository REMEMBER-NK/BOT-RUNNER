const { cmd } = require("../command");

// Game storage
const games = {};

// 1. TIC-TAC-TOE GAME (.ttt)
cmd(
  {
    pattern: "ttt",
    alias: ["tictactoe"],
    react: "🎮",
    desc: "Play Tic-Tac-Toe Game",
    category: "games",
    filename: __filename
  },
  async (remember, mek, m, { from, reply, args }) => {
    let text = args[0];
    
    // Start or Reset Game
    if (!games[from] || text === "start" || text === "reset") {
      games[from] = {
        board: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
        turn: "❌"
      };
      return reply(`🎮 *TIC-TAC-TOE GAME STARTED!*\n\n` +
                   ` ${games[from].board[0]} | ${games[from].board[1]} | ${games[from].board[2]} \n` +
                   `---|---|---\n` +
                   ` ${games[from].board[3]} | ${games[from].board[4]} | ${games[from].board[5]} \n` +
                   `---|---|---\n` +
                   ` ${games[from].board[6]} | ${games[from].board[7]} | ${games[from].board[8]} \n\n` +
                   `👉 සෙල්ලම් කරන්න \`.ttt 1-9\` දක්වා අංකයක් ගහන්න! (Current Turn: ❌)`);
    }

    let pos = parseInt(text) - 1;
    let game = games[from];

    if (isNaN(pos) || pos < 0 || pos > 8 || game.board[pos] === "❌" || game.board[pos] === "⭕") {
      return reply("❌ කරුණාකර 1 සිට 9 දක්වා හිස් කොටුවක අංකයක් ලබාදෙන්න!");
    }

    // Place Move
    game.board[pos] = game.turn;

    // Check Win Patterns
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    let hasWon = winPatterns.some(p => game.board[p[0]] === game.turn && game.board[p[1]] === game.turn && game.board[p[2]] === game.turn);

    let boardDisplay = ` ${game.board[0]} | ${game.board[1]} | ${game.board[2]} \n` +
                       `---|---|---\n` +
                       ` ${game.board[3]} | ${game.board[4]} | ${game.board[5]} \n` +
                       `---|---|---\n` +
                       ` ${game.board[6]} | ${game.board[7]} | ${game.board[8]} `;

    if (hasWon) {
      delete games[from];
      return reply(`🎉 *GAME OVER! ${game.turn} DINEUWA!* 🎉\n\n${boardDisplay}`);
    }

    if (game.board.every(cell => cell === "❌" || cell === "⭕")) {
      delete games[from];
      return reply(`🤝 *DRAW WUNA! (දෙන්නම සමයි)* 🤝\n\n${boardDisplay}`);
    }

    // Switch Turn
    game.turn = game.turn === "❌" ? "⭕" : "❌";
    return reply(`🎮 *TIC-TAC-TOE*\n\n${boardDisplay}\n\n👉 Next Turn: ${game.turn} (\`.ttt <1-9>\`)`);
  }
);

// 2. NUMBER GUESSING GAME (.guess)
const guessGames = {};

cmd(
  {
    pattern: "guess",
    react: "🎲",
    desc: "Number Guessing Game",
    category: "games",
    filename: __filename
  },
  async (remember, mek, m, { from, reply, args }) => {
    let num = parseInt(args[0]);

    if (!guessGames[from]) {
      guessGames[from] = Math.floor(Math.random() * 10) + 1; // 1 to 10
      return reply("🎲 *1 සිට 10 දක්වා අංකයක් අනුමාන කරන්න!*\n\nඋදාහරණ: `.guess 5` කියලා ටයිප් කරන්න.");
    }

    if (isNaN(num)) return reply("❌ කරුණාකර අංකයක් ලබාදෙන්න! (Ex: `.guess 7`)");

    if (num === guessGames[from]) {
      delete guessGames[from];
      return reply("🎉 *හරියටම හරි! ඔයා අංකය නිවැරදිව අනුමාන කළා!* 🏆");
    } else if (num < guessGames[from]) {
      return reply("📉 *තව ටිකක් වැඩි අංකයක්!* (Try again with `.guess`)");
    } else {
      return reply("📈 *තව ටිකක් අඩු අංකයක්!* (Try again with `.guess`)");
    }
  }
);
