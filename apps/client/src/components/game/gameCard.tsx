import React from 'react';

import { GameSummary } from '@biketag/models';
import { convertDateToRelativeDate } from '@biketag/utils';

interface GameCardProps {
    game: GameSummary;
    selectGame: () => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, selectGame }: GameCardProps) => {
    let innerElement: React.ReactNode;
    if (game.latestRootTagImageUrl) {
        innerElement = <img src={game.latestRootTagImageUrl} className="game-card-image" />;
    } else {
        innerElement = <div className="game-card-image-placeholder">No tags yet!</div>;
    }

    const gameCreatedDate = convertDateToRelativeDate(game.createdDate, false);
    const lastTagDate = game.latestRootTagImageUrl ? `\nLatest tag: ${convertDateToRelativeDate(game.lastActivityDate)}` : '';

    return (
        <div className="game-card" onClick={selectGame} title={`Created ${gameCreatedDate}${lastTagDate}`}>
            <div className="game-card-image-container">{innerElement}</div>
            <div className="game-card-footer">{game.name}</div>
        </div>
    );
};
