import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { GameSummary } from '@biketag/models';

import { ApiManager } from '../../api';
import { UserContext } from '../common/context';
import { GameCard } from './gameCard';

interface GameListProps {
    selectGame: (game: GameSummary) => void;
    starredGames?: string[];
    setUserStarredGame: (args: { gameId: string; isStarred: boolean }) => void;
}

export const GameList: React.FC<GameListProps> = ({ selectGame, starredGames, setUserStarredGame }: GameListProps) => {
    const user = useContext(UserContext)!;

    const [games, setGames] = useState<GameSummary[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    // const [refreshKey, setRefreshKey] = useState<number>(0);
    // const [error, setError] = useState<string | null>(null);

    const starredGameLookup = useMemo(() => new Set(starredGames), [starredGames]);

    useEffect(() => {
        ApiManager.gameApi.getGameSummaryForPlayer({ userId: user.id }).then((games) => {
            games.sort((a, b) => {
                if (starredGameLookup.has(a.id) !== starredGameLookup.has(b.id)) {
                    return starredGameLookup.has(a.id) ? -1 : 1;
                }
                return b.lastActivityDate.localeCompare(a.lastActivityDate);
            });
            setGames(games);
            setLoading(false);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const setStarredGame = useCallback(
        ({ gameId, isStarred }: { gameId: string; isStarred: boolean }) => {
            const sortedGames = games.slice().sort((a, b) => {
                const aIsStarred = gameId === a.id ? isStarred : starredGameLookup.has(a.id);
                const bIsStarred = gameId === b.id ? isStarred : starredGameLookup.has(b.id);
                if (aIsStarred !== bIsStarred) {
                    return aIsStarred ? -1 : 1;
                }
                return b.lastActivityDate.localeCompare(a.lastActivityDate);
            });
            setGames(sortedGames);
            setUserStarredGame({ gameId, isStarred });
        },
        [games, setUserStarredGame, starredGameLookup]
    );

    return loading ? (
        <div className="game-card-view">Loading games...</div>
    ) : (
        <div className="game-card-view">
            {games.map((game) => {
                const isStarred = starredGameLookup.has(game.id);
                return (
                    <GameCard key={game.id} game={game} selectGame={() => selectGame(game)} setStarredGame={() => setStarredGame({ gameId: game.id, isStarred: !isStarred })} isStarred={isStarred} />
                );
            })}
        </div>
    );
};
