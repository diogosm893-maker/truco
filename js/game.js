/**
 * Truco de Elite - Lógica do Jogo Completa
 */

const SUITS = ['clubs', 'hearts', 'spades', 'diamonds'];
const VALUES = ['4', '5', '6', '7', 'Q', 'J', 'K', 'A', '2', '3'];

const BASE_STRENGTH = { '4': 1, '5': 2, '6': 3, '7': 4, 'Q': 5, 'J': 6, 'K': 7, 'A': 8, '2': 9, '3': 10 };
const MANILHA_STRENGTH = { 'diamonds': 11, 'spades': 12, 'hearts': 13, 'clubs': 14 };

let deck = [];
let players = [[], [], [], []];
let vira = null;
let currentManilhaValue = null;
let score = { teamUs: 0, teamThem: 0 };

const gameState = {
    activePlayer: 0,
    playedInRound: [], // Cartas na mesa nesta vaza
    trickResults: [], // Quem ganhou cada uma das 3 vazas
    currentTrick: 0,
    turnStarter: 0,
    trucoState: {
        value: 1,
        pending: false,
        challenger: -1,
        lastChallengerTeam: -1
    },
    handWins: [0, 0], // Vitoria por dupla na rodada atual
    gameOver: false,
    waitingForResponse: false
};

// UI Elements
let radioText, roundStatus, challengeOverlay, btnTruco, overlay;

function updateRadio(msg) {
    if (radioText) radioText.textContent = msg;
}

function updateScore() {
    document.getElementById('score-us').textContent = score.teamUs.toString().padStart(2, '0');
    document.getElementById('score-them').textContent = score.teamThem.toString().padStart(2, '0');
}

function initDeck() {
    deck = [];
    for (const suit of SUITS) {
        for (const val of VALUES) deck.push({ value: val, suit: suit });
    }
}

function deal() {
    // Escondendo overlays
    overlay.classList.add('hidden');
    challengeOverlay.classList.add('hidden');
    gameState.waitingForResponse = false;
    gameState.gameOver = false;

    initDeck();
    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    players = [[], [], [], []];
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 4; j++) players[j].push(deck.pop());
    }

    vira = deck.pop();
    const viraIdx = VALUES.indexOf(vira.value);
    currentManilhaValue = VALUES[(viraIdx + 1) % VALUES.length];

    gameState.playedInRound = [];
    gameState.trickResults = [];
    gameState.currentTrick = 0;
    gameState.handWins = [0, 0];
    gameState.trucoState = { value: 1, pending: false, challenger: -1, lastChallengerTeam: -1 };
    
    updateRoundStatus();
    renderDeck();
    
    if (gameState.turnStarter !== 0) {
        gameState.activePlayer = gameState.turnStarter;
        botPlayManager(gameState.activePlayer);
    } else {
        gameState.activePlayer = 0;
        updateRadio("Sua vez, soldado. Escolha uma carta.");
    }
}

function getCardStrength(card) {
    if (card.value === currentManilhaValue) return MANILHA_STRENGTH[card.suit];
    return BASE_STRENGTH[card.value];
}

function createCardElement(card, hidden = false) {
    const el = document.createElement('div');
    if (hidden) {
        el.className = 'card back';
        return el;
    }
    const suitSymbol = { clubs: '♣', hearts: '♥', spades: '♠', diamonds: '♦' }[card.suit];
    el.className = `card suit-${card.suit}`;
    el.innerHTML = `<div class="card-value">${card.value}</div><div class="card-suit">${suitSymbol}</div>`;
    return el;
}

function renderDeck() {
    document.getElementById('vira-card').innerHTML = '';
    document.getElementById('vira-card').appendChild(createCardElement(vira));

    const myCardsContainer = document.getElementById('my-cards');
    myCardsContainer.innerHTML = '';
    players[0].forEach((card, idx) => {
        const el = createCardElement(card);
        el.onclick = () => { if (!gameState.waitingForResponse && gameState.activePlayer === 0) playCard(0, idx); };
        myCardsContainer.appendChild(el);
    });

    for (let i = 1; i < 4; i++) {
        const container = document.querySelector(`#p${i+1} .card-area`);
        container.innerHTML = '';
        players[i].forEach(() => container.appendChild(createCardElement(null, true)));
    }
}

function playCard(playerIdx, cardIdx) {
    const card = players[playerIdx].splice(cardIdx, 1)[0];
    gameState.playedInRound.push({ player: playerIdx, card: card });

    const container = document.getElementById('played-cards');
    container.appendChild(createCardElement(card));
    
    renderDeck();
    
    gameState.activePlayer = (gameState.activePlayer + 1) % 4;
    
    if (gameState.playedInRound.length === 4) {
        setTimeout(evaluateTrick, 1000);
    } else {
        if (gameState.activePlayer !== 0) botPlayManager(gameState.activePlayer);
    }
}

function evaluateTrick() {
    let winner = -1;
    let maxStr = -1;
    let empate = false;

    gameState.playedInRound.forEach(p => {
        const str = getCardStrength(p.card);
        if (str > maxStr) {
            maxStr = str;
            winner = p.player;
            empate = false;
        } else if (str === maxStr) {
            empate = true;
        }
    });

    document.getElementById('played-cards').innerHTML = '';
    
    const teamWon = empate ? -1 : (winner % 2); // 0: Us, 1: Them
    gameState.trickResults.push(teamWon);
    
    if (teamWon !== -1) gameState.handWins[teamWon]++;

    if (checkRoundEnd()) return;

    gameState.currentTrick++;
    gameState.playedInRound = [];
    gameState.activePlayer = empate ? gameState.turnStarter : winner;
    
    if (gameState.activePlayer !== 0) botPlayManager(gameState.activePlayer);
    else updateRadio("Sua vez na rodada.");
}

function checkRoundEnd() {
    const res = gameState.trickResults;
    let winningTeam = -1;

    if (gameState.handWins[0] === 2) winningTeam = 0;
    else if (gameState.handWins[1] === 2) winningTeam = 1;
    else if (res.length === 3) {
        if (gameState.handWins[0] > gameState.handWins[1]) winningTeam = 0;
        else if (gameState.handWins[1] > gameState.handWins[0]) winningTeam = 1;
    }
    
    if (res[0] === -1 && res.length === 1) { /* amarrado na primeira */ }
    else if (res[0] !== -1 && res[1] === -1) { winningTeam = res[0]; }
    else if (res[0] === -1 && res[1] !== -1) { winningTeam = res[1]; }

    if (winningTeam !== -1) {
        const pts = gameState.trucoState.value;
        if (winningTeam === 0) score.teamUs += pts;
        else score.teamThem += pts;
        
        updateScore();
        if (score.teamUs >= 12 || score.teamThem >= 12) {
            endMatch(winningTeam === 0);
        } else {
            gameState.turnStarter = (gameState.turnStarter + 1) % 4;
            setTimeout(deal, 1500);
        }
        return true;
    }
    return false;
}

function askTruco(playerIdx) {
    const nextValue = { 1: 3, 3: 6, 6: 9, 9: 12 }[gameState.trucoState.value];
    gameState.trucoState.pending = true;
    gameState.trucoState.challenger = playerIdx;
    gameState.trucoState.lastChallengerTeam = playerIdx % 2;

    updateRadio(`P${playerIdx+1} PEDIU ${nextValue}! QSL?`);
    
    if ((playerIdx % 2) === 0) {
        botPlayManager(1);
    } else {
        showChallengeUI(nextValue);
    }
}

function showChallengeUI(val) {
    gameState.waitingForResponse = true;
    challengeOverlay.classList.remove('hidden');
    document.getElementById('challenge-title').textContent = val === 3 ? "TRUCO!" : `VEM ${val}!`;
    const raiseBtn = document.getElementById('btn-challenge-raise');
    if (val === 12) {
        raiseBtn.classList.add('hidden');
    } else {
        raiseBtn.classList.remove('hidden');
        raiseBtn.textContent = `PEDIR ${val === 3 ? 6 : val+3}`;
    }
}

function handleChallengeResponse(action, responderIdx) {
    challengeOverlay.classList.add('hidden');
    gameState.waitingForResponse = false;
    gameState.trucoState.pending = false;

    if (action === 'ACCEPT') {
        gameState.trucoState.value = { 1: 3, 3: 6, 6: 9, 9: 12 }[gameState.trucoState.value];
        updateRoundStatus();
        updateRadio("Desafio aceito. Prossiga.");
        if (gameState.activePlayer !== 0) botPlayManager(gameState.activePlayer);
    } else if (action === 'FOLD') {
        const winnerTeam = (gameState.trucoState.lastChallengerTeam === 0) ? 0 : 1;
        updateRadio("Inimigo recuou. Ponto para a ROTA.");
        score[winnerTeam === 0 ? 'teamUs' : 'teamThem'] += (gameState.trucoState.value === 1 ? 1 : gameState.trucoState.value);
        updateScore();
        gameState.turnStarter = (gameState.turnStarter + 1) % 4;
        setTimeout(deal, 1500);
    } else if (action === 'RAISE') {
        gameState.trucoState.value = { 1: 3, 3: 6, 6: 9, 9: 12 }[gameState.trucoState.value];
        askTruco(responderIdx);
    }
}

function updateRoundStatus() {
    const v = gameState.trucoState.value;
    roundStatus.textContent = v === 1 ? "PARTIDA NORMAL" : `DESAFIO: ${v} PONTOS`;
}

function endMatch(won) {
    gameState.gameOver = true;
    overlay.classList.remove('hidden');
    document.getElementById('overlay-title').textContent = won ? "MISSÃO CUMPRIDA" : "BAIXA NO BATALHÃO";
    document.getElementById('overlay-msg').textContent = won ? "A ROTA limpou a mesa." : "Os oponentes levaram a melhor.";
}

// Event Listeners e Inicialização
document.addEventListener('DOMContentLoaded', () => {
    radioText = document.getElementById('radio-text');
    roundStatus = document.getElementById('round-status');
    challengeOverlay = document.getElementById('challenge-overlay');
    btnTruco = document.getElementById('btn-truco');
    overlay = document.getElementById('overlay');
    const btnRestart = document.getElementById('btn-restart');

    if (btnTruco) btnTruco.onclick = () => { 
        if (!gameState.trucoState.pending && gameState.trucoState.lastChallengerTeam !== 0) askTruco(0); 
    };
    if (btnRestart) btnRestart.onclick = () => deal();
    
    const btnAccept = document.getElementById('btn-challenge-accept');
    const btnFold = document.getElementById('btn-challenge-fold');
    const btnRaise = document.getElementById('btn-challenge-raise');

    if (btnAccept) btnAccept.onclick = () => handleChallengeResponse('ACCEPT', 0);
    if (btnFold) btnFold.onclick = () => handleChallengeResponse('FOLD', 0);
    if (btnRaise) btnRaise.onclick = () => handleChallengeResponse('RAISE', 0);

    // Começar missão
    deal();
});
