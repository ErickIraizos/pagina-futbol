$(document).ready(function() {
    let currentPlayer = 1;
    let board = ['', '', '', '', '', '', '', '', ''];
    let gameActive = false;
    let scores = JSON.parse(localStorage.getItem('tictactoeScores')) || [0, 0];
    let isAIMode = false;
    
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // horizontales
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // verticales
        [0, 4, 8], [2, 4, 6]             // diagonales
    ];

    // Añadir variables para el historial de movimientos
    let moveHistory = [];
    let currentMove = -1;

    // Iniciar juego
    $('#start-game').click(function() {
        gameActive = true;
        resetBoard();
        updateStatus();
        $('.current-turn').show();
    });

    // Reiniciar juego
    $('#reset-game').click(function() {
        gameActive = false;
        scores = [0, 0];
        localStorage.setItem('tictactoeScores', JSON.stringify(scores));
        updateScore();
        resetBoard();
        $('#current-player').text('Presiona "Comenzar Juego" para iniciar');
        updateHistoryDisplay();
    });

    // Agregar botón para activar/desactivar IA
    $('#toggle-ai').click(function() {
        isAIMode = !isAIMode;
        $(this).html(isAIMode ? 
            '🤖 Modo actual: Jugador vs IA <small>(Click para cambiar)</small>' : 
            '👥 Modo actual: Jugador vs Jugador <small>(Click para cambiar)</small>'
        );
        resetBoard();
        if (isAIMode) {
            $('#player2-controls').hide();
            $('#ai-message').show();
        } else {
            $('#player2-controls').show();
            $('#ai-message').hide();
        }
    });

    // Click en celda
    $('.cell').click(function() {
        if (!gameActive) return;
        if (isAIMode && currentPlayer === 2) return; // No permitir clicks cuando es turno de la IA
        
        const index = $(this).data('index');
        if (board[index] !== '') return;

        makeMove(index);

        if (gameActive && isAIMode && currentPlayer === 2) {
            setTimeout(makeAIMove, 500);
        }
    });

    function makeMove(index) {
        saveMove();
        
        const symbol = getPlayerSymbol(currentPlayer);
        const color = getPlayerColor(currentPlayer);

        $(`.cell[data-index="${index}"]`)
            .addClass(symbol)
            .css('color', color);

        board[index] = symbol;
        updateMovesList();

        if (checkWinner()) {
            scores[currentPlayer - 1]++;
            localStorage.setItem('tictactoeScores', JSON.stringify(scores));
            updateScore();
            gameActive = false;
            alert(`¡${getCurrentPlayerName()} ha ganado!`);
            return;
        }

        if (board.every(cell => cell !== '')) {
            gameActive = false;
            alert('¡Empate!');
            return;
        }

        currentPlayer = getNextPlayer();
        updateStatus();
    }

    function makeAIMove() {
        const bestMove = findBestMove(board);
        if (bestMove !== -1) {
            makeMove(bestMove);
        }
    }

    function getPlayerSymbol(player) {
        return player === 1 ? 'x' : 'o';
    }

    function getPlayerColor(player) {
        return player === 1 ? 
            $('#color1').val() : 
            (isAIMode ? '#ff0000' : $('#color2').val());
    }

    function getNextPlayer() {
        return currentPlayer === 1 ? 2 : 1;
    }

    function findBestMove(board) {
        let bestScore = -Infinity;
        let bestMove = -1;

        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = getPlayerSymbol(3);
                let score = minimax(board, 0, false);
                board[i] = '';
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }
        return bestMove;
    }

    function minimax(board, depth, isMaximizing) {
        const result = evaluateBoard(board);
        if (result !== null) {
            return result;
        }

        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = getPlayerSymbol(3);
                    let score = minimax(board, depth + 1, false);
                    board[i] = '';
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = getPlayerSymbol(1);
                    let score = minimax(board, depth + 1, true);
                    board[i] = '';
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    }

    function evaluateBoard(board) {
        for (let pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (board[a] && board[a] === board[b] && board[b] === board[c]) {
                if (board[a] === getPlayerSymbol(3)) return 10;
                if (board[a] === getPlayerSymbol(1)) return -10;
            }
        }
        
        if (!board.includes('')) return 0;
        return null;
    }

    function saveMove() {
        // Eliminar movimientos futuros si estamos en un punto intermedio
        moveHistory = moveHistory.slice(0, currentMove + 1);
        
        moveHistory.push({
            board: [...board],
            currentPlayer: currentPlayer,
            scores: [...scores]
        });
        currentMove++;
        
        updateMovesList();
    }

    function updateMovesList() {
        const $movesList = $('#moves-list');
        $movesList.empty();
        
        $movesList.append(`
            <button class="move-button ${currentMove === -1 ? 'active' : ''}" 
                    data-move="start">
                🔄 Reiniciar al inicio
            </button>
        `);

        moveHistory.forEach((move, index) => {
            const playerName = move.currentPlayer === 1 ? 
                $('#player1').val() : 
                (isAIMode ? 'IA' : $('#player2').val());
            
            $movesList.append(`
                <button class="move-button ${currentMove === index ? 'active' : ''}" 
                        data-move="${index}">
                    #${index + 1}: Jugada de ${playerName}
                </button>
            `);
        });
    }

    // Manejar clicks en los botones de viaje en el tiempo
    $(document).on('click', '.move-button', function() {
        const moveIndex = $(this).data('move');
        
        if (moveIndex === 'start') {
            currentMove = -1;
            board = ['', '', '', '', '', '', '', '', ''];
            currentPlayer = 1;
        } else {
            currentMove = parseInt(moveIndex);
            const move = moveHistory[currentMove];
            board = [...move.board];
            currentPlayer = move.currentPlayer;
        }
        
        // Actualizar visualización del tablero
        $('.cell').removeClass('x o').css('color', '');
        board.forEach((symbol, index) => {
            if (symbol) {
                const color = symbol === 'x' ? 
                    $('#color1').val() : 
                    (isAIMode ? '#ff0000' : $('#color2').val());
                $(`.cell[data-index="${index}"]`)
                    .addClass(symbol)
                    .css('color', color);
            }
        });
        
        updateMovesList();
        updateStatus();
    });

    function getCurrentPlayerName() {
        if (isAIMode && currentPlayer === 2) return 'IA';
        return currentPlayer === 1 ? 
            $('#player1').val() : 
            $('#player2').val();
    }

    function updateStatus() {
        const currentPlayerName = getCurrentPlayerName();
        $('#current-player').text(`Turno de: ${currentPlayerName}`);
        $('#current-player-name').text(currentPlayerName);
        
        $('.current-turn')
            .hide()
            .fadeIn(300);
    }

    function updateScore() {
        $('#score1').text(scores[0]);
        $('#score2').text(scores[1]);
    }

    function resetBoard() {
        board = ['', '', '', '', '', '', '', '', ''];
        $('.cell')
            .removeClass('x o')
            .css('color', '');
        currentPlayer = 1;
        moveHistory = [];
        currentMove = -1;
        updateMovesList();
        
        $('#current-player-name').text('');
        $('.current-turn').hide();
    }

    function checkWinner() {
        const hasWinner = winPatterns.some(pattern => {
            const [a, b, c] = pattern;
            return board[a] !== '' && 
                   board[a] === board[b] && 
                   board[b] === board[c];
        });

        if (hasWinner) {
            scores[currentPlayer - 1]++;
            localStorage.setItem('tictactoeScores', JSON.stringify(scores));
            updateScore();
            const winnerName = getCurrentPlayerName();
            saveGameToHistory(`¡${winnerName} ha ganado!`);
        } else if (board.every(cell => cell !== '')) {
            saveGameToHistory('¡Empate!');
        }

        return hasWinner;
    }

    // Función para guardar partida en el historial
    function saveGameToHistory(winner) {
        const gameHistory = JSON.parse(localStorage.getItem('tictactoeHistory') || '[]');
        const gameData = {
            date: new Date().toLocaleString(),
            winner: winner,
            player1: $('#player1').val(),
            player2: isAIMode ? 'IA' : $('#player2').val(),
            score: `${scores[0]} - ${scores[1]}`
        };
        
        gameHistory.unshift(gameData);
        
        if (gameHistory.length > 10) {
            gameHistory.pop();
        }
        
        localStorage.setItem('tictactoeHistory', JSON.stringify(gameHistory));
        updateHistoryDisplay();
    }

    // Función para mostrar el historial
    function updateHistoryDisplay() {
        const gameHistory = JSON.parse(localStorage.getItem('tictactoeHistory') || '[]');
        const $historyList = $('#history-list');
        $historyList.empty();

        gameHistory.forEach(game => {
            const historyItem = `
                <div class="history-item">
                    <div class="game-info">
                        <span class="winner">${game.winner}</span>
                        <br>
                        <small>${game.player1} vs ${game.player2}</small>
                        <br>
                        <small>Puntuación: ${game.score}</small>
                    </div>
                    <div class="date">${game.date}</div>
                </div>
            `;
            $historyList.append(historyItem);
        });
    }

    // Cargar historial al iniciar
    updateHistoryDisplay();

    // Efectos visuales
    $('.cell').hover(
        function() {
            if (gameActive && $(this).text() === '') {
                const color = currentPlayer === 1 ? 
                    $('#color1').val() : 
                    $('#color2').val();
                $(this).css('box-shadow', `0 0 15px ${color}`);
            }
        },
        function() {
            $(this).css('box-shadow', 'none');
        }
    );
}); 