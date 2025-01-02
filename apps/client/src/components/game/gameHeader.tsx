import React from 'react';

import { GameDto } from '@biketag/models';
import { Logger } from '@biketag/utils';

import { GameHeaderParentView } from '../../models/game';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const logger = new Logger({ prefix: '' });

interface GameHeaderProps {
    game: GameDto;
    parentView: GameHeaderParentView;
    collapsed: boolean;
    setView: (view: GameHeaderParentView) => void;
}

const viewToClassMap: Record<GameHeaderParentView, string> = {
    [GameHeaderParentView.CARDS]: '',
    [GameHeaderParentView.SCROLLER]: 'top-tag-header',
    [GameHeaderParentView.DETAILS]: '',
};

export const GameHeader: React.FC<GameHeaderProps> = (props: GameHeaderProps) => {
    const { parentView } = props;
    const className = viewToClassMap[parentView];

    const viewDetails =
        parentView !== GameHeaderParentView.DETAILS ? (
            <div className="clickable-text game-header-link" onClick={() => props.setView(GameHeaderParentView.DETAILS)}>
                Details
            </div>
        ) : undefined;

    const viewScroller =
        parentView !== GameHeaderParentView.SCROLLER ? (
            <div className="clickable-text game-header-link" onClick={() => props.setView(GameHeaderParentView.SCROLLER)}>
                Scroller
            </div>
        ) : undefined;

    const viewCards =
        parentView !== GameHeaderParentView.CARDS ? (
            <div className="clickable-text game-header-link" onClick={() => props.setView(GameHeaderParentView.CARDS)}>
                Cards
            </div>
        ) : undefined;

    if (props.collapsed) {
        // it will only ever be collapsed in the scroller view
        return (
            <div className="top-tag-header game-header collapsed">
                {viewDetails}
                {viewScroller}
                {viewCards}
            </div>
        );
    } else {
        return (
            <div className={`${className} game-header`}>
                <div className="game-header-title">{props.game.name}</div>
                {viewDetails}
                {viewScroller}
                {viewCards}
            </div>
        );
    }
};
