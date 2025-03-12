import React, { useState, useEffect } from 'react';
import Board from './Board';
import Confetti from 'react-confetti';
import './App.css';

function App() {
    const [history, setHistory] = useState([Array(9).fill(null)]);
    const [stepNumber, setStepNumber] = useState(0);
    const [xIsNext, setXIsNext] = useState(true);
    const [winningLine, setWinningLine] = useState(null);
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });
    const [scores, setScores] = useState({
        X: 0,
        O: 0,
        ties: 0
    });
    const [settings, setSettings] = useState({
        soundEnabled: true,
        confettiEnabled: true
    });
    const [showSettings, setShowSettings] = useState(false);
    const [darkTheme, setDarkTheme] = useState(true);
    const [playAgainstAI, setPlayAgainstAI] = useState(false);
    const [aiDifficulty, setAiDifficulty] = useState('easy'); // 'easy', 'medium', 'hard'
    const [showStats, setShowStats] = useState(false);
    const [gameStats, setGameStats] = useState({
        totalGames: 0,
        xWins: 0,
        oWins: 0,
        draws: 0,
        averageMoves: 0,
        totalMoves: 0
    });
    
    // Preload the sound
    useEffect(() => {
        // Create and preload the audio
        const audio = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3');
        audio.load(); // Preload the audio file
        
        // Store the audio in a variable accessible to the component
        window.winSound = audio;
    }, []);

    // Update window size when the window is resized
    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const currentSquares = history[stepNumber];

    const handleClick = (i) => {
        const newHistory = history.slice(0, stepNumber + 1);
        const current = newHistory[newHistory.length - 1].slice();
        
        if (calculateWinner(current) || current[i]) {
            return;
        }

        current[i] = xIsNext ? 'X' : 'O';
        setHistory(newHistory.concat([current]));
        setStepNumber(newHistory.length);
        setXIsNext(!xIsNext);
        
        // Check for winner after the move
        const winner = calculateWinner(current);
        if (winner) {
            setWinningLine(winner.line);
            setScores(prevScores => ({
                ...prevScores,
                [winner.player]: prevScores[winner.player] + 1
            }));
            
            // Play the winning sound with user interaction
            if (settings.soundEnabled && window.winSound) {
                // Reset the audio to the beginning
                window.winSound.currentTime = 0;
                
                // Play the sound with a user gesture
                const playPromise = window.winSound.play();
                
                // Handle potential play() promise rejection
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.log('Error playing sound:', error);
                        
                        // Alternative approach: create a new Audio object and play it
                        const alternativeSound = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3');
                        alternativeSound.play().catch(e => console.log('Alternative sound failed too:', e));
                    });
                }
            }
            
            // Update stats
            setGameStats(prev => ({
                ...prev,
                totalGames: prev.totalGames + 1,
                xWins: winner.player === 'X' ? prev.xWins + 1 : prev.xWins,
                oWins: winner.player === 'O' ? prev.oWins + 1 : prev.oWins,
                totalMoves: prev.totalMoves + stepNumber + 1,
                averageMoves: Math.round((prev.totalMoves + stepNumber + 1) / (prev.totalGames + 1))
            }));
        } else if (current.every(square => square !== null)) {
            // It's a draw
            setScores(prevScores => ({
                ...prevScores,
                ties: prevScores.ties + 1
            }));
            
            // Update stats
            setGameStats(prev => ({
                ...prev,
                totalGames: prev.totalGames + 1,
                draws: prev.draws + 1,
                totalMoves: prev.totalMoves + 9,
                averageMoves: Math.round((prev.totalMoves + 9) / (prev.totalGames + 1))
            }));
        } else {
            setWinningLine(null);
        }
    };

    const jumpTo = (step) => {
        setStepNumber(step);
        setXIsNext(step % 2 === 0);
        setWinningLine(null);
    };

    const winner = calculateWinner(currentSquares);
    let status;
    if (winner) {
        status = 'Winner: ' + winner.player;
    } else if (currentSquares.every(square => square !== null)) {
        status = "It's a Draw!";
    } else {
        status = 'Next player: ' + (xIsNext ? 'X' : 'O');
    }

    // Add AI move logic - add this after the handleClick function
    useEffect(() => {
        // Make AI move after player's move
        if (playAgainstAI && !xIsNext && !calculateWinner(currentSquares) && !currentSquares.every(square => square !== null)) {
            const timer = setTimeout(() => {
                makeAIMove();
            }, 500); // Delay for a more natural feel
            
            return () => clearTimeout(timer);
        }
    }, [currentSquares, xIsNext, playAgainstAI]);

    const makeAIMove = () => {
        const squares = currentSquares.slice();
        let move;
        
        // Different AI strategies based on difficulty
        switch (aiDifficulty) {
            case 'easy':
                move = getRandomMove(squares);
                break;
            case 'medium':
                // 50% chance of making a smart move
                move = Math.random() > 0.5 ? getBestMove(squares, 'O') : getRandomMove(squares);
                break;
            case 'hard':
                move = getBestMove(squares, 'O');
                break;
            default:
                move = getRandomMove(squares);
        }
        
        if (move !== null) {
            handleClick(move);
        }
    };

    const getRandomMove = (squares) => {
        const availableMoves = squares
            .map((square, index) => square === null ? index : null)
            .filter(index => index !== null);
        
        if (availableMoves.length === 0) return null;
        
        const randomIndex = Math.floor(Math.random() * availableMoves.length);
        return availableMoves[randomIndex];
    };

    const getBestMove = (squares, player) => {
        // Check for winning move
        for (let i = 0; i < 9; i++) {
            if (squares[i] === null) {
                const squaresCopy = squares.slice();
                squaresCopy[i] = player;
                if (calculateWinner(squaresCopy)) {
                    return i;
                }
            }
        }
        
        // Check for blocking opponent's winning move
        const opponent = player === 'X' ? 'O' : 'X';
        for (let i = 0; i < 9; i++) {
            if (squares[i] === null) {
                const squaresCopy = squares.slice();
                squaresCopy[i] = opponent;
                if (calculateWinner(squaresCopy)) {
                    return i;
                }
            }
        }
        
        // Take center if available
        if (squares[4] === null) return 4;
        
        // Take corners if available
        const corners = [0, 2, 6, 8];
        const availableCorners = corners.filter(corner => squares[corner] === null);
        if (availableCorners.length > 0) {
            return availableCorners[Math.floor(Math.random() * availableCorners.length)];
        }
        
        // Take any available side
        const sides = [1, 3, 5, 7];
        const availableSides = sides.filter(side => squares[side] === null);
        if (availableSides.length > 0) {
            return availableSides[Math.floor(Math.random() * availableSides.length)];
        }
        
        return null;
    };

    return (
        <div className={`game ${darkTheme ? 'dark-theme' : 'light-theme'}`}>
            {winner && settings.confettiEnabled && (
                <Confetti
                    width={windowSize.width}
                    height={windowSize.height}
                    recycle={false}
                    numberOfPieces={500}
                    gravity={0.2}
                />
            )}
            <div className="game-header">
                <h1 className="game-title">Tic Tac Toe</h1>
                <div className="header-buttons">
                    <button 
                        className="stats-button" 
                        onClick={() => setShowStats(!showStats)}
                        title="Game Statistics"
                    >
                        📊
                    </button>
                    <button 
                        className="settings-button" 
                        onClick={() => setShowSettings(!showSettings)}
                        title="Settings"
                    >
                        ⚙️
                    </button>
                </div>
            </div>
            
            {showSettings && (
                <div className="settings-panel">
                    <h3>Settings</h3>
                    <div className="setting-item">
                        <label>
                            <input 
                                type="checkbox" 
                                checked={settings.soundEnabled}
                                onChange={() => setSettings({...settings, soundEnabled: !settings.soundEnabled})}
                            />
                            Sound Effects
                        </label>
                    </div>
                    <div className="setting-item">
                        <label>
                            <input 
                                type="checkbox" 
                                checked={settings.confettiEnabled}
                                onChange={() => setSettings({...settings, confettiEnabled: !settings.confettiEnabled})}
                            />
                            Confetti Effects
                        </label>
                    </div>
                    <div className="setting-item">
                        <label>
                            <input 
                                type="checkbox" 
                                checked={darkTheme}
                                onChange={() => setDarkTheme(!darkTheme)}
                            />
                            Dark Theme
                        </label>
                    </div>
                    <div className="setting-item">
                        <label>
                            <input 
                                type="checkbox" 
                                checked={playAgainstAI}
                                onChange={() => setPlayAgainstAI(!playAgainstAI)}
                            />
                            Play Against AI
                        </label>
                    </div>
                    {playAgainstAI && (
                        <div className="setting-item">
                            <label>AI Difficulty:</label>
                            <div className="radio-group">
                                <label>
                                    <input 
                                        type="radio" 
                                        name="difficulty" 
                                        value="easy"
                                        checked={aiDifficulty === 'easy'}
                                        onChange={() => setAiDifficulty('easy')}
                                    />
                                    Easy
                                </label>
                                <label>
                                    <input 
                                        type="radio" 
                                        name="difficulty" 
                                        value="medium"
                                        checked={aiDifficulty === 'medium'}
                                        onChange={() => setAiDifficulty('medium')}
                                    />
                                    Medium
                                </label>
                                <label>
                                    <input 
                                        type="radio" 
                                        name="difficulty" 
                                        value="hard"
                                        checked={aiDifficulty === 'hard'}
                                        onChange={() => setAiDifficulty('hard')}
                                    />
                                    Hard
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            {showStats && (
                <div className="stats-panel">
                    <h3>Game Statistics</h3>
                    <div className="stats-grid">
                        <div className="stat-item">
                            <div className="stat-label">Total Games</div>
                            <div className="stat-value">{gameStats.totalGames}</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-label">X Wins</div>
                            <div className="stat-value">{gameStats.xWins}</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-label">O Wins</div>
                            <div className="stat-value">{gameStats.oWins}</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-label">Draws</div>
                            <div className="stat-value">{gameStats.draws}</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-label">Avg. Moves</div>
                            <div className="stat-value">{gameStats.averageMoves}</div>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="scoreboard">
                <div className="score-item">
                    <span className="player x">X</span>
                    <span className="score-value">{scores.X}</span>
                </div>
                <div className="score-item">
                    <span className="ties">Ties</span>
                    <span className="score-value">{scores.ties}</span>
                </div>
                <div className="score-item">
                    <span className="player o">O</span>
                    <span className="score-value">{scores.O}</span>
                </div>
            </div>
            
            <div className="game-status">{status}</div>
            
            <div className="game-content">
                <div className="game-board">
                    <Board squares={currentSquares} onClick={handleClick} winningLine={winningLine} />
                    <button className="new-game-btn" onClick={() => jumpTo(0)}>New Game</button>
                </div>
                
                <div className="move-history">
                    <h3>Move History</h3>
                    <ul>
                        {history.map((_, move) => (
                            <li key={move}>
                                <button 
                                    className={move === stepNumber ? 'active' : ''}
                                    onClick={() => jumpTo(move)}
                                >
                                    {move === 0 ? 'Game Start' : `Move #${move}`}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

function calculateWinner(squares) {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return { player: squares[a], line: lines[i] };
        }
    }
    return null;
}

export default App;
