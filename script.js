// Elementos do jogo
const gameContainer = document.getElementById('game-container');
const playerCar = document.getElementById('player-car');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const roadElement = document.getElementById('road');

// Variáveis do jogo
let gameRunning = true;
let score = 0;
let baseGameSpeed = 4; // Velocidade base dos carros
let gameSpeed = baseGameSpeed;
const playerSpeed = 8; // Velocidade de movimento horizontal do jogador
const playerYBottom = 100; // Posição Y fixa do jogador (distância do fundo)
let playerX = 175;
let opponents = [];
let gameLoop;
let opponentInterval;
let opponentCreationRate = 2000; // Inicialmente, cria um a cada 2000ms (2s)

// Tamanhos
const containerWidth = gameContainer.offsetWidth;
const playerWidth = playerCar.offsetWidth;
const playerHeight = playerCar.offsetHeight;

// Controles
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
};

// Posições X (pistas) no container (400px de largura)
const lanes = [
    containerWidth * 0.25 - playerWidth / 2, // Pista esquerda (centralizado)
    containerWidth * 0.5 - playerWidth / 2,  // Pista central
    containerWidth * 0.75 - playerWidth / 2  // Pista direita
];

// Eventos de teclado
document.addEventListener('keydown', function(e) {
    if (['ArrowLeft', 'ArrowRight'].includes(e.code)) {
        keys[e.code] = true;
        e.preventDefault(); // Evita rolagem da página
    }
    
    // Reiniciar com espaço
    if (e.code === 'Space' && !gameRunning) {
        startGame();
    }
});

document.addEventListener('keyup', function(e) {
    if (['ArrowLeft', 'ArrowRight'].includes(e.code)) {
        keys[e.code] = false;
    }
});

// Mover o player para a posição X
function movePlayer() {
    if (keys.ArrowLeft) {
        playerX -= playerSpeed;
    }
    if (keys.ArrowRight) {
        playerX += playerSpeed;
    }

    // Limitar o movimento dentro da área jogável (entre as faixas laterais)
    const minX = containerWidth * 0.15; // Largura da faixa lateral esquerda
    const maxX = containerWidth * 0.85 - playerWidth; // Largura do container - largura da faixa lateral direita - largura do carro
    
    playerX = Math.max(minX, Math.min(playerX, maxX));
    
    playerCar.style.left = `${playerX}px`;
}

// Criar um carro oponente
function createOpponent() {
    if (!gameRunning) return;

    const opponent = document.createElement('div');
    opponent.className = 'opponent-car';
    
    const width = 50;
    const height = 80;
    
    opponent.style.width = `${width}px`;
    opponent.style.height = `${height}px`;
    
    // Escolhe uma das 3 pistas aleatoriamente
    const x = lanes[Math.floor(Math.random() * lanes.length)];
    
    opponent.style.left = `${x}px`;
    opponent.style.top = `-${height}px`;
    
    gameContainer.appendChild(opponent);
    
    // Adiciona o novo oponente com uma velocidade variável
    opponents.push({
        element: opponent,
        x: x,
        y: -height,
        width: width,
        height: height,
        // Velocidade do oponente é a velocidade do jogo + um pouco de variação
        speed: gameSpeed + Math.random() * 0.5 
    });
}

// Verificar colisões
function checkCollision(opponent) {
    // A posição Y do carro do jogador é fixa: Altura do container - playerYBottom
    const playerY = gameContainer.offsetHeight - playerYBottom - playerHeight;
    
    return playerX < opponent.x + opponent.width &&
           playerX + playerWidth > opponent.x &&
           playerY < opponent.y + opponent.height &&
           playerY + playerHeight > opponent.y;
}

// Atualizar o jogo
function updateGame() {
    if (!gameRunning) return;
    
    movePlayer(); // Mover o jogador com base nas teclas
    
    // Mover oponentes
    for (let i = opponents.length - 1; i >= 0; i--) {
        const opponent = opponents[i];
        opponent.y += opponent.speed;
        opponent.element.style.top = `${opponent.y}px`;
        
        // Verificar colisão
        if (checkCollision(opponent)) {
            gameOver();
            return;
        }
        
        // Remover oponentes que saíram da tela e atualizar score
        if (opponent.y > gameContainer.offsetHeight) {
            gameContainer.removeChild(opponent.element);
            opponents.splice(i, 1);
            score++;
            scoreElement.textContent = `Pontos: ${score}`;
            
            // Aumentar dificuldade a cada 5 pontos
            if (score % 5 === 0) {
                gameSpeed += 0.5; // Aumenta a velocidade
                // Diminui o intervalo de criação (min de 500ms)
                opponentCreationRate = Math.max(500, opponentCreationRate - 100); 
                
                // Recria o intervalo com a nova taxa
                clearInterval(opponentInterval);
                opponentInterval = setInterval(createOpponent, opponentCreationRate);
                
                // Ajusta a velocidade da animação da estrada
                const roadAnimationDuration = 1.5 - ((gameSpeed - baseGameSpeed) * 0.1);
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
    
    finalScoreElement.textContent = `Pontos: ${score}`;
    gameOverElement.style.display = 'block';
}

// Iniciar jogo
function startGame() {
    gameRunning = true;
    score = 0;
    gameSpeed = baseGameSpeed;
    opponentCreationRate = 2000;
    playerX = lanes[1]; // Começa na pista do meio
    
    scoreElement.textContent = `Pontos: ${score}`;
    gameOverElement.style.display = 'none';
    playerCar.style.left = `${playerX}px`;
    
    // Resetar a animação da estrada
    roadElement.style.animationDuration = '1.5s';
    
    // Remover todos os oponentes
    opponents.forEach(opponent => {
        gameContainer.removeChild(opponent.element);
    });
    opponents = [];
    
    // Inicia o loop de criação de oponentes
    opponentInterval = setInterval(createOpponent, opponentCreationRate);
    updateGame(); // Inicia o loop principal do jogo
}

// Botão de reiniciar
restartBtn.addEventListener('click', startGame);

// Iniciar o jogo na primeira vez
startGame();