import React, { useState } from 'react';

import { GameSummary } from '@biketag/models';
import { convertDateToRelativeDate, Logger } from '@biketag/utils';

const logger = new Logger({ prefix: '' });

interface GameCardProps {
    game: GameSummary;
    isStarred: boolean;
    selectGame: () => void;
    setStarredGame: () => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, isStarred, selectGame, setStarredGame }: GameCardProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const [showAsStarred, setShowAsStarred] = useState(isStarred);
    const [clickedSinceEntered, setClickedSinceEntered] = useState(false);

    let innerElement: React.ReactNode;
    if (game.latestRootTagImageUrl) {
        innerElement = <img src={game.latestRootTagImageUrl} className="game-card-image" />;
    } else {
        innerElement = <div className="game-card-image-placeholder">No tags yet!</div>;
    }

    const gameCreatedDate = convertDateToRelativeDate(game.createdDate, false);
    const lastTagDate = game.latestRootTagImageUrl ? `\nLatest tag: ${convertDateToRelativeDate(game.lastActivityDate)}` : '';

    // take the opposite state of the *current* showAsStarred state when we are processing a click
    const defaultIcon = clickedSinceEntered !== showAsStarred ? '★' : '☆';
    const hoverIcon = clickedSinceEntered !== showAsStarred ? '☆' : '★';

    logger.info(`[GameCard] `, { isHovered, showAsStarred, clickedSinceEntered, isStarred });

    return (
        <div className="game-card" onClick={selectGame} title={`Created ${gameCreatedDate}${lastTagDate}`}>
            <div className="game-card-image-container">{innerElement}</div>
            <div className="game-card-footer">{game.name}</div>
            <div
                className="game-favorite-icon"
                onMouseEnter={() => !clickedSinceEntered && setIsHovered(true)}
                onMouseLeave={() => {
                    setIsHovered(false);
                    setClickedSinceEntered(false);
                }}
                onClick={(event) => {
                    setClickedSinceEntered(true);
                    setStarredGame();
                    setShowAsStarred(!isStarred);
                    event.stopPropagation();
                }}
            >
                {isHovered ? hoverIcon : defaultIcon}
            </div>
        </div>
    );
};
