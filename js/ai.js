/**
 * IA do Truco de Elite
 * Comportamentos: RECRUTA, MEDIANO, ANTIGÃO
 */

const DIFFICULTY = {
    RECRUTA: 'RECRUTA',
    MEDIANO: 'MEDIANO',
    ANTIGAO: 'ANTIGAO'
};

const AI = {
    level: DIFFICULTY.ANTIGAO, // Padrão

    // Avalia a força da mão (0 a 30)
    evaluateHandStrength: function(hand) {
        return hand.reduce((total, card) => total + getCardStrength(card), 0);
    },

    decideAction: function(playerIdx, hand, vira, playedInRound) {
        const handStrength = this.evaluateHandStrength(hand);
        const rand = Math.random();

        // Se alguém pediu truco
        if (gameState.trucoState.pending) {
            return this.decideResponse(playerIdx, hand, handStrength);
        }

        // Decidir se pede Truco (se não estiver no máximo)
        if (gameState.trucoState.value < 12 && gameState.trucoState.lastChallengerTeam !== (playerIdx % 2)) {
            if (this.shouldAskTruco(handStrength)) {
                return { action: 'CHALLENGE' };
            }
        }

        // Decidir qual carta jogar
        return { action: 'PLAY_CARD', cardIdx: this.chooseBestCard(playerIdx, hand, playedInRound) };
    },

    shouldAskTruco: function(strength) {
        if (this.level === DIFFICULTY.RECRUTA) return Math.random() < 0.05;
        if (this.level === DIFFICULTY.MEDIANO) return strength > 22 || Math.random() < 0.1;
        
        // ANTIGÃO: Blefa ou truca com mão boa
        if (strength > 24) return true;
        if (strength < 10 && Math.random() < 0.2) return true; // Blefe
        return false;
    },

    decideResponse: function(playerIdx, hand, strength) {
        const threshold = { RECRUTA: 5, MEDIANO: 15, ANTIGAO: 18 }[this.level];
        const rand = Math.random();

        if (strength > threshold || rand < 0.2) {
            // Aceita ou Aumenta
            if (strength > threshold + 5 && rand < 0.4 && gameState.trucoState.value < 12) {
                return { action: 'RAISE' };
            }
            return { action: 'ACCEPT' };
        }
        return { action: 'FOLD' };
    },

    chooseBestCard: function(playerIdx, hand, playedInRound) {
        if (playedInRound.length === 0) {
            // Primeiro a jogar: Recruta joga aleatório, outros jogam a menor
            if (this.level === DIFFICULTY.RECRUTA) return Math.floor(Math.random() * hand.length);
            return hand.reduce((minIdx, card, idx) => getCardStrength(card) < getCardStrength(hand[minIdx]) ? idx : minIdx, 0);
        }

        // Tentar ganhar a rodada
        const bestOpponentCard = playedInRound.reduce((max, p) => {
            if (p.player % 2 !== playerIdx % 2) {
                const s = getCardStrength(p.card);
                return s > max ? s : max;
            }
            return max;
        }, 0);

        // Encontrar menor carta que ganha
        let bestIdx = 0;
        let foundWinning = false;
        
        for(let i=0; i<hand.length; i++) {
            if (getCardStrength(hand[i]) > bestOpponentCard) {
                if (!foundWinning || getCardStrength(hand[i]) < getCardStrength(hand[bestIdx])) {
                    bestIdx = i;
                    foundWinning = true;
                }
            }
        }

        if (!foundWinning) {
            // Joga a menor se não tem como ganhar
            return hand.reduce((minIdx, card, idx) => getCardStrength(card) < getCardStrength(hand[minIdx]) ? idx : minIdx, 0);
        }

        return bestIdx;
    }
};

window.botPlayManager = function(idx) {
    if (gameState.gameOver) return;
    
    updateRadio(`Aguardando ação do subordinado P${idx+1}...`);
    
    setTimeout(() => {
        const decision = AI.decideAction(idx, players[idx], vira, gameState.playedInRound);
        
        if (decision.action === 'PLAY_CARD') {
            playCard(idx, decision.cardIdx);
        } else if (decision.action === 'CHALLENGE') {
            askTruco(idx);
        } else if (decision.action === 'ACCEPT') {
            handleChallengeResponse('ACCEPT', idx);
        } else if (decision.action === 'FOLD') {
            handleChallengeResponse('FOLD', idx);
        } else if (decision.action === 'RAISE') {
            handleChallengeResponse('RAISE', idx);
        }
    }, 1000);
};
