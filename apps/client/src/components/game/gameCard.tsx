import React from 'react';

import { GameSummary } from '@biketag/models';

interface GameCardProps {
    game: GameSummary;
    selectGame: () => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, selectGame }: GameCardProps) => {
    let innerElement: React.ReactNode;
    if (game.latestRootTagImageUrl) {
        innerElement = <img src={game.latestRootTagImageUrl} className="game-card-image" />;
    } else {
        innerElement = <div className="game-card-image-placeholder">Game is brand new!</div>;
    }
    return (
        <div className="game-card" onClick={selectGame}>
            <div className="game-card-image-container">{innerElement}</div>
            <div className="game-card-footer">{game.name}</div>
        </div>
    );
};
