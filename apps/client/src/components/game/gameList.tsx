import React, { useEffect, useState } from 'react';

import { GameSummary, UserDto } from '@biketag/models';

import { ApiManager } from '../../api';
import { NavHeader } from '../common/navHeader';

interface GameListProps {
    user: UserDto;
    selectGame: (game: GameSummary) => void;
    startCreateGame: () => void;
}

const GameList: React.FC<GameListProps> = ({ user, selectGame, startCreateGame }: GameListProps) => {
    const [games, setGames] = useState<GameSummary[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshKey, setRefreshKey] = useState<number>(0);
    // const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        ApiManager.gameApi.getGameSummaryForPlayer({ userId: user.id }).then((games) => {
            setGames(games);
            setLoading(false);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshKey]);

    return (
        <div className="landing">
            <NavHeader centerText="Your games  ↻" centerOnClick={() => setRefreshKey(refreshKey + 1)} rightText="Create game →" rightOnClick={startCreateGame} />
            {loading ? (
                <div>Loading games...</div>
            ) : (
                <div className="game-list">
                    {games.map((game) => (
                        <div className="clickable-text" key={'a' + game.id} onClick={() => selectGame(game)}>
                            {game.name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GameList;
