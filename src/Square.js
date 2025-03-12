import React from 'react';
import './Square.css';

function Square({ value, onClick, isWinning }) {
    return (
        <button 
            className={`square ${value === 'X' ? 'x' : value === 'O' ? 'o' : ''} ${isWinning ? 'winning' : ''}`} 
            onClick={onClick}
            data-value={value}
        >
            {/* Empty button - content shown via CSS */}
        </button>
    );
}

export default Square;
