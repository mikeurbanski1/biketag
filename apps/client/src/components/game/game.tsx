import { Dayjs } from 'dayjs';
import React, { useCallback, useContext, useEffect, useState } from 'react';

import { GameDto, GameRoles, PlayerScores, TagDto, tagHasRealImage } from '@biketag/models';
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
import { NewTagScroller } from './newTagScroller';
import { TagCardView } from './tagCardView';

// import { TagScroller } from './tagScroller';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

export const Game: React.FC<ViewGameProps> = ({ deleteGame, dateOverride, setUserStarredGame, userStarredGames }: ViewGameProps) => {
    logger.info(`[Game] in game render`);
    const user = useContext(UserContext)!;

    const [game, setGame] = useState<GameDto | undefined>(undefined);
    const [editingGame, setEditingGame] = useState(false);
    const [loadingGame, setLoadingGame] = useState(true);
    const [playerDetailsTable, setPlayerDetailsTable] = useState<PlayerDetailsTableRow[]>([]);
    const [currentView, setCurrentView] = useState<GameHeaderParentView>(GameHeaderParentView.CARDS);
    const [userCanAddRootTag, setUserCanAddRootTag] = useState(false);
    // const [userCanAddSubtag, setUserCanAddSubtag] = useState(false);
    // const [showingPendingTag, setShowingPendingTag] = useState(false);
    // const [showingAddRootTag, setShowingAddRootTag] = useState(false);
    // const [showingAddSubtag, setShowingAddSubtag] = useState(false);
    const [currentRootTag, setCurrentRootTag] = useState<TagDto | undefined>(undefined);
    const [currentTag, setCurrentTag] = useState<TagDto | undefined>(undefined);
    const [canAddRootTagRefreshKey, setCanAddRootTagRefreshKey] = useState(0);

    const { gameId } = useParams() as { gameId: string };

    const navigate = useNavigate();

    const { pathname } = useLocation();
    logger.info(`[Game] in game rende pathnamer`, { pathname });

    useEffect(() => {
        if (!loadingGame) {
            return;
        }

        ApiManager.gameApi.getGame({ id: gameId, convertPendingTagForOwner: true }).then((game) => {
            setGame(game);
            setLoadingGame(false);
            setPlayerDetailsTable(getPlayerDetailsTable(game));

            const { latestRootTag } = game;
            // the second condition will be true if we came here via direct URL
            if (currentView === GameHeaderParentView.SCROLLER || pathname.includes('scroller')) {
                setCurrentRootTag(latestRootTag);
                setCurrentTag(latestRootTag);
                // setShowingAddRootTag(latestRootTag === undefined);
                if (currentView !== GameHeaderParentView.SCROLLER) {
                    setCurrentView(GameHeaderParentView.SCROLLER);
                }
            } else if (currentView === GameHeaderParentView.CARDS && !latestRootTag) {
                // when starting the view, if there is no tag, go straight to add tag in tag scroller
                navigate(`/home/game/${game.id}/scroller`);
                // setShowingAddRootTag(true);
                setCurrentView(GameHeaderParentView.SCROLLER);
            } else {
                logger.info('we are here');
            }
        });
    }, [loadingGame, gameId, game?.latestRootTag, currentView, navigate, pathname]);

    useEffect(() => {
        const tagToUse = currentRootTag ?? game?.latestRootTag;
        if (tagToUse) {
            ApiManager.tagApi.canUserAddTag({ userId: user.id, gameId, dateOverride: dateOverride }).then(({ result }) => {
                setUserCanAddRootTag(result);
            });
        } else if (!loadingGame) {
            setUserCanAddRootTag(true);
        }
    }, [game?.latestRootTag, canAddRootTagRefreshKey, currentRootTag, user.id, gameId, dateOverride, loadingGame]);

    // useEffect(() => {
    //     if (currentRootTag) {
    //         ApiManager.tagApi.canUserAddSubtag({ userId: user.id, tagId: currentRootTag.id }).then(({ result }) => {
    //             setUserCanAddSubtag(result);
    //         });
    //     } else {
    //         setUserCanAddSubtag(false);
    //     }
    // }, [currentRootTag, user.id]);

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
            if (tag === 'addTag') {
                // setShowingAddRootTag(true);
                if (currentView === GameHeaderParentView.CARDS) {
                    // if we jumped straight from the cards to the add tag, we need to initialize the "current" tag
                    setCurrentRootTag(game!.latestRootTag);
                    setCurrentTag(game!.latestRootTag);
                }
            } else if (tagHasRealImage(tag)) {
                if (tag.id === currentTag?.id) {
                    // we switched back to the current tag from pending tag or add tag
                    // setShowingPendingTag(false);
                } else {
                    setCurrentTag(tag);
                    if (tag.isRoot) {
                        setCurrentRootTag(tag);
                    }
                }
            } else {
                // setShowingPendingTag(true);
                if (currentView === GameHeaderParentView.CARDS) {
                    // switched from card view
                    setCurrentRootTag(game!.latestRootTag);
                    setCurrentTag(game!.latestRootTag);
                }
            }
            if (tag !== 'addTag') {
                // setShowingAddRootTag(false);
                // setShowingAddSubtag(false);
            }
            setCurrentView(GameHeaderParentView.SCROLLER);
            navigate(`/home/game/${game!.id}/scroller/${tag === 'addTag' ? 'addTag' : tag.id}`);
        },
        [navigate, currentView, game, currentTag?.id]
    );

    const setNewView = useCallback(
        (view: GameHeaderParentView) => {
            setCurrentView(view);
            // switching to tag scroller for the first time via the menu, not clicking a card - show latest root tag
            // otherwise we will keep the card we were looking at
            if (!currentTag && view === GameHeaderParentView.SCROLLER) {
                setCurrentRootTag(game!.latestRootTag);
                setCurrentTag(game!.latestRootTag);
                // setShowingAddRootTag(game!.latestRootTag === undefined);
            }
        },
        [currentTag, game]
    );

    if (editingGame) {
        return <CreateEditGame doneCreatingGame={() => setEditingGame(false)} game={game!} />;
    }

    const isStarred = userStarredGames !== undefined && userStarredGames.includes(gameId);

    return (
        <div className="game-view">
            {game && (
                <>
                    <GameHeader game={game} setView={setNewView} parentView={currentView} collapsed={currentView === GameHeaderParentView.SCROLLER && currentTag !== undefined && !currentTag.isRoot} />
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
                                <NewTagScroller
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
                                <NewTagScroller
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
