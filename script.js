

JavaScript

// Elementos do jogo
const gameContainer = document.getElementById('game-container');
const playerCar = document.getElementById('player-car');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const roadElement = document.getElementById('road');

// Elementos de Dificuldade e Menu
const difficultyMenu = document.getElementById('difficulty-menu');
const rankingElement = document.getElementById('ranking');
const easyBtn = document.getElementById('easy-btn');
const mediumBtn = document.getElementById('medium-btn');
const hardBtn = document.getElementById('hard-btn');

// Variáveis do jogo
let gameRunning = false;
let score = 0;
let currentDifficulty = 'medium';
let baseGameSpeed = 4;
let gameSpeed = baseGameSpeed;
const playerSpeed = 8;
const playerYBottom = 100;
let playerX = 175;
let opponents = [];
let gameLoop;
let opponentInterval;
let opponentCreationRate = 2000;

// Ranking (usando Local Storage)
let highScores = JSON.parse(localStorage.getItem('carRaceHighScores')) || [];

// Tamanhos
const containerWidth = gameContainer.offsetWidth;
const playerWidth = playerCar.offsetWidth;
const playerHeight = playerCar.offsetHeight;

// Controles
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
};

// Posições X (pistas)
const lanes = [
    containerWidth * 0.25 - playerWidth / 2,
    containerWidth * 0.5 - playerWidth / 2,
    containerWidth * 0.75 - playerWidth / 2
];

// Funções de Gerenciamento de Ranking
function saveScore(newScore, difficulty) {
    highScores.push({ score: newScore, difficulty: difficulty, date: new Date().toLocaleString() });
    
    // Filtra e classifica os 5 melhores por dificuldade (para manter o ranking limpo)
    highScores.sort((a, b) => b.score - a.score); 
    
    // Armazena no Local Storage
    localStorage.setItem('carRaceHighScores', JSON.stringify(highScores));
}

function displayRanking() {
    rankingElement.innerHTML = '<h3>Ranking</h3>';
    
    // Agrupa e exibe os 3 melhores de cada dificuldade
    const difficulties = ['easy', 'medium', 'hard'];
    
    difficulties.forEach(diff => {
        const topScores = highScores
            .filter(s => s.difficulty === diff)
            .slice(0, 3);

        const diffTitle = diff === 'easy' ? 'Fácil' : diff === 'medium' ? 'Médio' : 'Difícil';
        let html = `<h4>${diffTitle}</h4><ol>`;

        if (topScores.length === 0) {
            html += '<li>Nenhuma pontuação ainda.</li>';
        } else {
            topScores.forEach(s => {
                html += `<li>${s.score} pontos</li>`;
            });
        }
        html += '</ol>';
        rankingElement.innerHTML += html;
    });

    rankingElement.style.display = 'block'; // Garante que o ranking está visível
}

// Funções de Dificuldade
function setDifficulty(difficulty) {
    currentDifficulty = difficulty;
    
    switch (difficulty) {
        case 'easy':
            baseGameSpeed = 3.5; // Velocidade base um pouco maior que 3
            opponentCreationRate = 2200; // Intervalo um pouco menor que 2500
            break;
        case 'medium':
            baseGameSpeed = 4.5; // Velocidade base
            opponentCreationRate = 1800; // Intervalo
            break;
        case 'hard':
            baseGameSpeed = 6;
            opponentCreationRate = 1000;
            break;
    }
    
    gameSpeed = baseGameSpeed;
    startGame(); // Inicia o jogo imediatamente após a seleção
}

// Lógica de Controles e Movimento
document.addEventListener('keydown', function(e) {
    if (['ArrowLeft', 'ArrowRight'].includes(e.code)) {
        keys[e.code] = true;
        e.preventDefault();
    }
    // Permite iniciar o jogo com a barra de espaço se o menu estiver aberto
    if (e.code === 'Space' && !gameRunning) {
        if (difficultyMenu.style.display !== 'none') {
             setDifficulty(currentDifficulty); // Usa a dificuldade atual (padrão é 'medium')
        } else if (gameOverElement.style.display !== 'none') {
             showMenu(); // Volta para o menu inicial
        }
    }
});

document.addEventListener('keyup', function(e) {
    if (['ArrowLeft', 'ArrowRight'].includes(e.code)) {
        keys[e.code] = false;
    }
});

function movePlayer() {
    if (keys.ArrowLeft) {
        playerX -= playerSpeed;
    }
    if (keys.ArrowRight) {
        playerX += playerSpeed;
    }

    const minX = containerWidth * 0.15;
    const maxX = containerWidth * 0.85 - playerWidth;
    
    playerX = Math.max(minX, Math.min(playerX, maxX));
    playerCar.style.left = `${playerX}px`;
}

// Criação de Oponente
function createOpponent() {
    if (!gameRunning) return;

    const opponent = document.createElement('div');
    opponent.className = 'opponent-car';
    
    const width = 50;
    const height = 80;
    
    opponent.style.width = `${width}px`;
    opponent.style.height = `${height}px`;
    
    const x = lanes[Math.floor(Math.random() * lanes.length)];
    
    opponent.style.left = `${x}px`;
    opponent.style.top = `-${height}px`;
    
    gameContainer.appendChild(opponent);
    
    opponents.push({
        element: opponent,
        x: x,
        y: -height,
        width: width,
        height: height,
        speed: gameSpeed + Math.random() * 0.5 
    });
}

// Colisão e Update
function checkCollision(opponent) {
    const playerY = gameContainer.offsetHeight - playerYBottom - playerHeight;
    
    return playerX < opponent.x + opponent.width &&
           playerX + playerWidth > opponent.x &&
           playerY < opponent.y + opponent.height &&
           playerY + playerHeight > opponent.y;
}

function updateGame() {
    if (!gameRunning) return;
    
    movePlayer();
    
    for (let i = opponents.length - 1; i >= 0; i--) {
        const opponent = opponents[i];
        opponent.y += opponent.speed;
        opponent.element.style.top = `${opponent.y}px`;
        
        if (checkCollision(opponent)) {
            gameOver();
            return;
        }
        
        if (opponent.y > gameContainer.offsetHeight) {
            gameContainer.removeChild(opponent.element);
            opponents.splice(i, 1);
            score++;
            scoreElement.textContent = `Pontos: ${score}`;
            
            // Aceleração progressiva, independente do nível de dificuldade
            if (score % 5 === 0) {
                gameSpeed += 0.2; 
                
                // Ajusta a velocidade da animação da estrada
                const roadAnimationDuration = 1.5 / (gameSpeed / baseGameSpeed); // Fórmula para ligar velocidade do jogo e da animação
                roadElement.style.animationDuration = `${roadAnimationDuration}s`;
            }
        }
    }
    
    gameLoop = requestAnimationFrame(updateGame);
}

// Fim de jogo
function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(gameLoop);
    clearInterval(opponentInterval);
    
    // Salva a pontuação
    saveScore(score, currentDifficulty);

    finalScoreElement.textContent = `Pontos: ${score} (${currentDifficulty.toUpperCase()})`;
    gameOverElement.style.display = 'block';
}

function showMenu() {
    // Para garantir que o jogo pare
    gameRunning = false;
    cancelAnimationFrame(gameLoop);
    clearInterval(opponentInterval);

    // Limpa a tela para mostrar o menu
    gameOverElement.style.display = 'none';
    
    // Remove todos os carros que sobraram
    opponents.forEach(opponent => {
        gameContainer.removeChild(opponent.element);
    });
    opponents = [];
    
    // Exibe os menus
    difficultyMenu.style.display = 'block';
    displayRanking();

    // Reinicia o estado para o padrão
    gameSpeed = baseGameSpeed;
    playerX = lanes[1];
    playerCar.style.left = `${playerX}px`;
    roadElement.style.animationDuration = '1.5s';
}


function startGame() {
    gameRunning = true;
    score = 0;
    
    // Reseta a velocidade para a base do nível selecionado
    gameSpeed = baseGameSpeed; 
    
    scoreElement.textContent = `Pontos: ${score}`;
    gameOverElement.style.display = 'none';
    difficultyMenu.style.display = 'none'; // Esconde o menu de dificuldade
    rankingElement.style.display = 'none'; // Esconde o ranking
    
    playerX = lanes[1];
    playerCar.style.left = `${playerX}px`;
    roadElement.style.animationDuration = '1.5s'; // Reseta a animação

    opponents.forEach(opponent => {
        gameContainer.removeChild(opponent.element);
    });
    opponents = [];
    
    // Inicia o loop de criação de oponentes com base na dificuldade
    clearInterval(opponentInterval);
    opponentInterval = setInterval(createOpponent, opponentCreationRate);
    updateGame(); // Inicia o loop principal do jogo
}

// Event Listeners
easyBtn.addEventListener('click', () => setDifficulty('easy'));
mediumBtn.addEventListener('click', () => setDifficulty('medium'));
hardBtn.addEventListener('click', () => setDifficulty('hard'));
restartBtn.addEventListener('click', showMenu); // O botão de Game Over agora volta para o Menu

// Inicialização: Exibe o menu de dificuldade e o ranking ao carregar
showMenu();