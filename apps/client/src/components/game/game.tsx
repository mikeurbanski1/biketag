import { Dayjs } from 'dayjs';
import React, { useCallback, useContext, useEffect } from 'react';

import { GameDto, GameRoles, PlayerScores, TagDto, tagHasRealImage } from '@biketag/models';
import { Logger } from '@biketag/utils';

import { ApiManager } from '../../api';

import '../../styles/game.css';

import { GameHeaderParentView } from '../../models/game';
import { UserContext } from '../common/context';
import { CreateEditGame } from './createEditGame';
import { GameDetails } from './gameDetails';
import { GameHeader } from './gameHeader';
import { TagCardView } from './tagCardView';
import { TagScroller } from './tagScroller';

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
    gameId: string;
    gameName: string;
    doneViewingGame: () => void;
    deleteGame: () => void;
    dateOverride: Dayjs;
}

const getPlayerDetailsTable = (game: GameDto): PlayerDetailsTableRow[] => {
    return [{ id: game.creator.id, name: game.creator.name, role: 'OWNER' as PlayerTableRole, ...game.gameScore.playerScores[game.creator.id] }].concat(
        game.players.map((player) => {
            return { id: player.user.id, name: player.user.name, role: player.role, ...game.gameScore.playerScores[player.user.id] };
        })
    );
};

export const Game: React.FC<ViewGameProps> = (props: ViewGameProps) => {
    const user = useContext(UserContext)!;

    const [game, setGame] = React.useState<GameDto | undefined>(undefined);
    const [editingGame, setEditingGame] = React.useState(false);
    const [loadingGame, setLoadingGame] = React.useState(true);
    const [playerDetailsTable, setPlayerDetailsTable] = React.useState<PlayerDetailsTableRow[]>([]);
    const [currentView, setCurrentView] = React.useState<GameHeaderParentView>(GameHeaderParentView.CARDS);
    const [userCanAddRootTag, setUserCanAddRootTag] = React.useState(false);
    const [userCanAddSubtag, setUserCanAddSubtag] = React.useState(false);
    const [showingPendingTag, setShowingPendingTag] = React.useState(false);
    const [showingAddRootTag, setShowingAddRootTag] = React.useState(false);
    const [showingAddSubtag, setShowingAddSubtag] = React.useState(false);
    const [currentRootTag, setCurrentRootTag] = React.useState<TagDto | undefined>(undefined);
    const [currentTag, setCurrentTag] = React.useState<TagDto | undefined>(undefined);
    const [canAddRootTagRefreshKey, setCanAddRootTagRefreshKey] = React.useState(0);

    useEffect(() => {
        if (!loadingGame) {
            return;
        }

        ApiManager.gameApi.getGame({ id: props.gameId, convertPendingTagForOwner: true }).then((game) => {
            setGame(game);
            setLoadingGame(false);
            setPlayerDetailsTable(getPlayerDetailsTable(game));

            const { latestRootTag } = game;
            if (currentView === GameHeaderParentView.SCROLLER) {
                setCurrentRootTag(latestRootTag);
                setCurrentTag(latestRootTag);
                setShowingAddRootTag(latestRootTag === undefined);
            } else if (currentView === GameHeaderParentView.CARDS && !latestRootTag) {
                // when starting the view, if there is no tag, go straight to add tag in tag scroller
                setCurrentView(GameHeaderParentView.SCROLLER);
                setShowingAddRootTag(true);
            }
        });
    }, [loadingGame, props.gameId, game?.latestRootTag, currentView]);

    useEffect(() => {
        const tagToUse = currentRootTag ?? game?.latestRootTag;
        if (tagToUse) {
            ApiManager.tagApi.canUserAddTag({ userId: user.id, gameId: props.gameId, dateOverride: props.dateOverride }).then(({ result }) => {
                setUserCanAddRootTag(result);
            });
        } else if (!loadingGame) {
            setUserCanAddRootTag(true);
        }
    }, [game?.latestRootTag, canAddRootTagRefreshKey, currentRootTag, user.id, props.gameId, props.dateOverride, loadingGame]);

    useEffect(() => {
        if (currentRootTag) {
            ApiManager.tagApi.canUserAddSubtag({ userId: user.id, tagId: currentRootTag.id }).then(({ result }) => {
                setUserCanAddSubtag(result);
            });
        } else {
            setUserCanAddSubtag(false);
        }
    }, [currentRootTag, user.id]);

    const createNewSubtag = useCallback(
        ({ imageUrl }: { imageUrl: string }) => {
            ApiManager.tagApi.createTag({ imageUrl, gameId: game!.id, isRoot: false, rootTagId: currentRootTag!.id }).then((newTag) => {
                setUserCanAddSubtag(false);
                setCurrentTag(newTag);
                setShowingAddSubtag(false);

                if (newTag.rootTagId === game!.latestRootTag!.id) {
                    setCanAddRootTagRefreshKey(canAddRootTagRefreshKey + 1);
                }
            });
        },
        [game, canAddRootTagRefreshKey, currentRootTag]
    );

    const createNewRootTag = useCallback(
        ({ imageUrl }: { imageUrl: string }) => {
            ApiManager.tagApi.createTag({ imageUrl, gameId: game!.id, isRoot: true }).then((newTag) => {
                setUserCanAddRootTag(false);
                setUserCanAddSubtag(false);
                setShowingAddRootTag(false);

                if (newTag.isPending) {
                    setShowingPendingTag(true);
                    setGame({ ...game!, pendingRootTag: newTag });
                } else {
                    setCurrentRootTag(newTag);
                    setCurrentTag(newTag);
                    setGame({ ...game!, latestRootTag: newTag });
                }
            });
        },
        [game]
    );

    // handles when an actual tag in the scroller is selected, as well as when any tag or fake tag in the card view is selected
    const selectTag = useCallback(
        (tag: 'addTag' | TagDto) => {
            if (tag === 'addTag') {
                setShowingAddRootTag(true);
                if (currentView === GameHeaderParentView.CARDS) {
                    // if we jumped straight from the cards to the add tag, we need to initialize the "current" tag
                    setCurrentRootTag(game!.latestRootTag);
                    setCurrentTag(game!.latestRootTag);
                }
            } else if (tagHasRealImage(tag)) {
                if (tag.id === currentTag?.id) {
                    // we switched back to the current tag from pending tag or add tag
                    setShowingPendingTag(false);
                } else {
                    setCurrentTag(tag);
                    if (tag.isRoot) {
                        setCurrentRootTag(tag);
                    }
                }
            } else {
                setShowingPendingTag(true);
                if (currentView === GameHeaderParentView.CARDS) {
                    // switched from card view
                    setCurrentRootTag(game!.latestRootTag);
                    setCurrentTag(game!.latestRootTag);
                }
            }
            if (tag !== 'addTag') {
                setShowingAddRootTag(false);
                setShowingAddSubtag(false);
            }
            setCurrentView(GameHeaderParentView.SCROLLER);
        },
        [game, currentTag, currentView]
    );

    const setNewView = useCallback(
        (view: GameHeaderParentView) => {
            setCurrentView(view);
            // switching to tag scroller for the first time via the menu, not clicking a card - show latest root tag
            // otherwise we will keep the card we were looking at
            if (!currentTag && view === GameHeaderParentView.SCROLLER) {
                setCurrentRootTag(game!.latestRootTag);
                setCurrentTag(game!.latestRootTag);
                setShowingAddRootTag(game!.latestRootTag === undefined);
            }
        },
        [currentTag, game]
    );

    if (editingGame) {
        return <CreateEditGame doneCreatingGame={() => setEditingGame(false)} game={game!} />;
    }

    let innerDiv: React.ReactNode;
    if (!game || loadingGame) {
        innerDiv = <div className="game-details">Loading...</div>;
    } else if (currentView === GameHeaderParentView.DETAILS) {
        innerDiv = <GameDetails game={game} playerDetailsTable={playerDetailsTable} setEditingGame={() => setEditingGame(true)} deleteGame={() => props.deleteGame()} />;
    } else if (currentView === GameHeaderParentView.SCROLLER) {
        innerDiv = (
            <TagScroller
                game={game}
                dateOverride={props.dateOverride}
                currentRootTag={currentRootTag}
                currentTag={currentTag}
                userCanAddRootTag={userCanAddRootTag}
                userCanAddSubtag={userCanAddSubtag}
                showingAddRootTag={showingAddRootTag}
                showingAddSubtag={showingAddSubtag}
                showingPendingTag={showingPendingTag}
                createNewTag={({ imageUrl, isSubtag }: { imageUrl: string; isSubtag: boolean }) => (isSubtag ? createNewSubtag({ imageUrl }) : createNewRootTag({ imageUrl }))}
                setAddTagAsActive={(isSubtag: boolean) => (isSubtag ? setShowingAddSubtag(true) : setShowingAddRootTag(true))}
                selectTag={selectTag}
            />
        );
    } else {
        innerDiv = <TagCardView game={game} selectTag={selectTag} userCanAddRootTag={userCanAddRootTag} />;
    }

    return (
        <div className="game-view">
            {game && (
                <GameHeader game={game} setView={setNewView} parentView={currentView} collapsed={currentView === GameHeaderParentView.SCROLLER && currentTag !== undefined && !currentTag.isRoot} />
            )}
            {game && <div className="game-view-star-icon">star</div>}
            {innerDiv}
        </div>
    );
};
