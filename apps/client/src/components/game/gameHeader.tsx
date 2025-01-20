import React from 'react';
import { Link } from 'react-router-dom';

import { GameDto } from '@biketag/models';
import { Logger } from '@biketag/utils';

import { GameHeaderParentView } from '../../models/game';

const logger = new Logger({ prefix: '' });

interface GameHeaderProps {
    game: GameDto;
    parentView: GameHeaderParentView;
    collapsed: boolean;
}

const viewToClassMap: Record<GameHeaderParentView, string> = {
    [GameHeaderParentView.CARDS]: '',
    [GameHeaderParentView.SCROLLER]: 'top-tag-header',
    [GameHeaderParentView.DETAILS]: '',
};

export const GameHeader: React.FC<GameHeaderProps> = ({ game, parentView, collapsed }: GameHeaderProps) => {
    const className = viewToClassMap[parentView];
    logger.info(`[GameHeader]`, { parentView, collapsed, className });

    const viewDetails =
        parentView !== GameHeaderParentView.DETAILS ? (
            <div className="game-header-link">
                <Link to={`/home/game/${game.id}/details`}>Details</Link>
            </div>
        ) : undefined;

    // const viewScroller =
    //     parentView !== GameHeaderParentView.SCROLLER ? (
    //         <div className="clickable-text game-header-link" onClick={() => setView(GameHeaderParentView.SCROLLER)}>
    //             <Link to={`/home/game/${game.id}/scroller`}>Scroller</Link>
    //         </div>
    //     ) : undefined;

    const viewCards =
        parentView !== GameHeaderParentView.CARDS ? (
            <div className="clickable-text game-header-link">
                <Link to={`/home/game/${game.id}`}>Cards</Link>
            </div>
        ) : undefined;

    if (collapsed) {
        // it will only ever be collapsed in the scroller view
        return (
            <div className="top-tag-header game-header collapsed">
                {viewDetails}
                {viewCards}
            </div>
        );
    } else {
        return (
            <div className={`${className} game-header`}>
                <div className="game-header-title">{game.name}</div>
                {viewDetails}
                {viewCards}
            </div>
        );
    }
};
