import { Dayjs } from 'dayjs';
import React, { useCallback, useContext, useEffect, useState } from 'react';

import { GameDto, GameRoles, PlayerScores, TagDto } from '@biketag/models';
import { Logger } from '@biketag/utils';

import { ApiManager } from '../../api';

import '../../styles/game.css';

import { Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';

import { GameHeaderParentView } from '../../models/game';
import { ClickableIcon } from '../common/clickableIcon';
import { UserContext } from '../common/context';
import { CreateEditGame } from './createEditGame';
import { GameDetails } from './gameDetails';
import { GameHeader } from './gameHeader';
import { TagCardView } from './tagCardView';
import { TagScroller } from './tagScroller';

const logger = new Logger({ prefix: '[ViewGame]' });

type PlayerTableRole = GameRoles | 'OWNER';

type PlayerDetailsTableRow = PlayerScores & {
    id: string;
    name: string;
    role: string;
    [key: string]: string | number;
};

interface ViewGameProps {
    deleteGame: (gameId: string) => void;
    dateOverride: Dayjs;
    setUserStarredGame: ({ gameId, isStarred }: { gameId: string; isStarred: boolean }) => void;
    userStarredGames?: string[];
}

const getPlayerDetailsTable = (game: GameDto): PlayerDetailsTableRow[] => {
    return [{ id: game.creator.id, name: game.creator.name, role: 'OWNER' as PlayerTableRole, ...game.gameScore.playerScores[game.creator.id] }].concat(
        game.players.map((player) => {
            return { id: player.user.id, name: player.user.name, role: player.role, ...game.gameScore.playerScores[player.user.id] };
        })
    );
};

// matches viewing a subtag in the scroller
const inSubtagRegex = /^\/home\/game\/[a-zA-Z0-9-]+\/scroller\/[a-zA-Z0-9-]+\/[a-zA-Z0-9-]+$/;

const getViewFromPath = (pathname: string): GameHeaderParentView => {
    if (pathname.includes('details')) {
        return GameHeaderParentView.DETAILS;
    } else if (pathname.includes('scroller')) {
        return GameHeaderParentView.SCROLLER;
    } else {
        return GameHeaderParentView.CARDS;
    }
};

export const Game: React.FC<ViewGameProps> = ({ deleteGame, dateOverride, setUserStarredGame, userStarredGames }: ViewGameProps) => {
    logger.info(`[Game] in game render`);
    const user = useContext(UserContext)!;

    const { pathname } = useLocation();
    logger.info(`[Game] pathname`, { pathname });

    const [game, setGame] = useState<GameDto | undefined>(undefined);
    const [editingGame, setEditingGame] = useState(false);
    const [loadingGame, setLoadingGame] = useState(true);
    const [playerDetailsTable, setPlayerDetailsTable] = useState<PlayerDetailsTableRow[]>([]);
    const [userCanAddRootTag, setUserCanAddRootTag] = useState(false);
    const [canAddRootTagRefreshKey, setCanAddRootTagRefreshKey] = useState(0);

    const { gameId } = useParams() as { gameId: string };

    const currentView = getViewFromPath(pathname);

    const navigate = useNavigate();

    useEffect(() => {
        if (!loadingGame || (game && game.id === gameId)) {
            return;
        }

        ApiManager.gameApi.getGame({ id: gameId, convertPendingTagForOwner: true }).then((game) => {
            setGame(game);
            const { latestRootTag, firstRootTag } = game;
            if (!latestRootTag) {
                setUserCanAddRootTag(true);
            } else {
                // load this initially so we know whether to jump to the scroller
                ApiManager.tagApi.canUserAddTag({ userId: user.id, gameId, dateOverride: dateOverride }).then(({ result }) => {
                    setUserCanAddRootTag(result);
                    setLoadingGame(false);
                    setPlayerDetailsTable(getPlayerDetailsTable(game));

                    // the second condition will be true if we came here via direct URL
                    if (currentView === GameHeaderParentView.CARDS && (!latestRootTag || (!result && latestRootTag.id === firstRootTag!.id))) {
                        navigate(`/home/game/${game.id}/scroller/${latestRootTag?.id ?? 'addTag'}`);
                    }
                });
            }
        });
    }, [loadingGame, gameId, currentView, navigate, pathname, user.id, dateOverride, game]);

    useEffect(() => {
        const tagToUse = game?.latestRootTag;
        if (tagToUse) {
            ApiManager.tagApi.canUserAddTag({ userId: user.id, gameId, dateOverride: dateOverride }).then(({ result }) => {
                setUserCanAddRootTag(result);
            });
        }
    }, [game?.latestRootTag, canAddRootTagRefreshKey, user.id, gameId, dateOverride, loadingGame]);

    const refreshUserCanAddTag = useCallback(() => setCanAddRootTagRefreshKey(canAddRootTagRefreshKey + 1), [canAddRootTagRefreshKey]);

    const createNewRootTag = useCallback(
        (newTag: TagDto) => {
            if (newTag.isPending) {
                setGame({ ...game!, pendingRootTag: newTag });
            } else {
                setGame({ ...game!, latestRootTag: newTag });
            }
            refreshUserCanAddTag();
        },
        [game, refreshUserCanAddTag]
    );

    // Select a tag from the card view
    const selectTag = useCallback(
        (tag: 'addTag' | TagDto) => {
            navigate(`/home/game/${game!.id}/scroller/${tag === 'addTag' ? 'addTag' : tag.id}`);
        },
        [navigate, game]
    );

    if (editingGame) {
        return <CreateEditGame doneCreatingGame={() => setEditingGame(false)} game={game!} />;
    }

    const isStarred = userStarredGames !== undefined && userStarredGames.includes(gameId);

    return (
        <div className="game-view">
            {game && (
                <>
                    <GameHeader game={game} parentView={currentView} collapsed={inSubtagRegex.test(pathname)} />
                    <ClickableIcon selectedIcon="★" unselectedIcon="☆" isSelected={isStarred} className="game-view-star-icon" onClick={() => setUserStarredGame({ gameId, isStarred: !isStarred })} />
                    <Routes>
                        <Route index element={<TagCardView game={game} selectTag={selectTag} userCanAddRootTag={userCanAddRootTag} />}></Route>
                        <Route
                            path="details"
                            element={<GameDetails game={game} playerDetailsTable={playerDetailsTable} setEditingGame={() => setEditingGame(true)} deleteGame={() => deleteGame(game.id)} />}
                        ></Route>
                        <Route
                            path="scroller/:rootTagId"
                            element={
                                <TagScroller
                                    game={game}
                                    dateOverride={dateOverride}
                                    userCanAddRootTag={userCanAddRootTag}
                                    refreshUserCanAddTag={refreshUserCanAddTag}
                                    createNewRootTagInGame={createNewRootTag}
                                />
                            }
                        ></Route>
                        <Route
                            path="scroller/:rootTagId/:subtagId"
                            element={
                                <TagScroller
                                    game={game}
                                    dateOverride={dateOverride}
                                    userCanAddRootTag={userCanAddRootTag}
                                    refreshUserCanAddTag={refreshUserCanAddTag}
                                    createNewRootTagInGame={createNewRootTag}
                                />
                            }
                        ></Route>
                    </Routes>
                </>
            )}
        </div>
    );
};
