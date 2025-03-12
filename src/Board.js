import React from 'react';
import Square from './Square';
import './Board.css';

function Board({ squares, onClick, winningLine }) {
    return (
        <div className="board">
            {squares.map((square, i) => (
                <Square 
                    key={i} 
                    value={square} 
                    onClick={() => onClick(i)} 
                    isWinning={winningLine && winningLine.includes(i)}
                />
            ))}
        </div>
    );
}

export default Board;
