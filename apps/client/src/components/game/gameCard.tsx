import React from 'react';

import { GameSummary } from '@biketag/models';
import { convertDateToRelativeDate, Logger } from '@biketag/utils';

import { ClickableIcon } from '../common/clickableIcon';

const logger = new Logger({ prefix: '' });

interface GameCardProps {
    game: GameSummary;
    isStarred: boolean;
    selectGame: () => void;
    setStarredGame: () => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, isStarred, selectGame, setStarredGame }: GameCardProps) => {
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
            <ClickableIcon selectedIcon="★" unselectedIcon="☆" isSelected={isStarred} className="game-card-star-icon" onClick={setStarredGame} />
        </div>
    );
};
