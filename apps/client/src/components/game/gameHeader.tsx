import React from 'react';

import { GameDto } from '@biketag/models';

import { GameHeaderParentView } from '../../models/game';

interface GameHeaderProps {
    game: GameDto;
    parentView: GameHeaderParentView;
    collapsed: boolean;
    setView: (view: GameHeaderParentView) => void;
}

const viewToClassMap: Record<GameHeaderParentView, string> = {
    [GameHeaderParentView.CARDS]: 'cards-header',
    [GameHeaderParentView.SCROLLER]: 'top-tag-header',
    [GameHeaderParentView.DETAILS]: '',
};

export const GameHeader: React.FC<GameHeaderProps> = (props: GameHeaderProps) => {
    const { parentView } = props;
    const className = viewToClassMap[parentView];

    return (
        <div className={`${className} game-header ${props.collapsed ? 'collapsed' : ''}`}>
            <div className="game-header-title">{props.game.name}</div>
            {parentView !== GameHeaderParentView.DETAILS && (
                <div className="clickable-text" onClick={() => props.setView(GameHeaderParentView.DETAILS)}>
                    View details
                </div>
            )}
            {parentView !== GameHeaderParentView.SCROLLER && (
                <div className="clickable-text" onClick={() => props.setView(GameHeaderParentView.SCROLLER)}>
                    View scroller
                </div>
            )}
            {parentView !== GameHeaderParentView.CARDS && (
                <div className="clickable-text" onClick={() => props.setView(GameHeaderParentView.CARDS)}>
                    View cards
                </div>
            )}
        </div>
    );
};
