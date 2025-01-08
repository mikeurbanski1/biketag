import React, { useContext, useEffect, useState } from 'react';

import { GameSummary } from '@biketag/models';

import { ApiManager } from '../../api';
import { UserContext } from '../common/context';
import { GameCard } from './gameCard';

interface GameListProps {
    selectGame: (game: GameSummary) => void;
}

export const GameList: React.FC<GameListProps> = ({ selectGame }: GameListProps) => {
    const user = useContext(UserContext)!;

    const [games, setGames] = useState<GameSummary[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    // const [refreshKey, setRefreshKey] = useState<number>(0);
    // const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        ApiManager.gameApi.getGameSummaryForPlayer({ userId: user.id }).then((games) => {
            games.sort((a, b) => b.lastActivityDate.localeCompare(a.lastActivityDate));
            setGames(games);
            setLoading(false);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return loading ? (
        <div className="game-card-view">Loading games...</div>
    ) : (
        <div className="game-card-view">
            {games.map((game) => (
                <GameCard key={game.id} game={game} selectGame={() => selectGame(game)} />
            ))}
        </div>
    );
};
