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
const radioText = document.getElementById('radio-text');
const roundStatus = document.getElementById('round-status');
const challengeOverlay = document.getElementById('challenge-overlay');
const btnTruco = document.getElementById('btn-truco');

function updateRadio(msg) {
    radioText.textContent = msg;
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
        evaluateTrick();
    } else {
        if (gameState.activePlayer !== 0) {
            setTimeout(() => botPlay(gameState.activePlayer), 800);
        }
    }
}

function botPlay(idx) {
    // Lógica simples do ai.js será chamada aqui
    const cardIdx = 0; // Por enquanto apenas joga a primeira
    playCard(idx, cardIdx);
}

function evaluateTrick() {
    // Lógica de quem levou a vaza
    gameState.playedInRound = [];
    document.getElementById('played-cards').innerHTML = '';
    
    // Próximo turno ou mão
    gameState.currentTurn++;
    if (gameState.currentTurn === 3) {
        // Fim da mão
    }
}

// Iniciar
window.onload = startMission;
