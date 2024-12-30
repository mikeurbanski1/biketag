import { Dayjs } from 'dayjs';
import React, { useCallback, useEffect } from 'react';

import { GameDto, GameRoles, isFullTag, PendingTag, PlayerScores, TagDto, UserDto } from '@biketag/models';
import { Logger } from '@biketag/utils';

import { ApiManager } from '../../api';

import '../../styles/game.css';

import { CreateEditGame } from './createEditGame';
import { GameDetails } from './gameDetails';
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
    user: UserDto;
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
    const [game, setGame] = React.useState<GameDto | undefined>(undefined);
    const [editingGame, setEditingGame] = React.useState(false);
    const [loadingGame, setLoadingGame] = React.useState(true);
    const [playerDetailsTable, setPlayerDetailsTable] = React.useState<PlayerDetailsTableRow[]>([]);
    const [viewingGameDetails, setViewingGameDetails] = React.useState(false);
    const [viewingTagScroller, setViewingTagScroller] = React.useState(false);
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
            if (viewingTagScroller) {
                setCurrentRootTag(latestRootTag);
                setCurrentTag(latestRootTag);
                setShowingAddRootTag(latestRootTag === undefined);
            } else if (!viewingTagScroller && !latestRootTag) {
                // when starting the view, if there is no tag, go straight to add tag in tag scroller
                setViewingTagScroller(true);
                setShowingAddRootTag(true);
            }
        });
    }, [loadingGame, props.gameId, game?.latestRootTag, viewingTagScroller]);

    useEffect(() => {
        const tagToUse = currentRootTag ?? game?.latestRootTag;
        if (tagToUse) {
            ApiManager.tagApi.canUserAddTag({ userId: props.user.id, gameId: props.gameId, dateOverride: props.dateOverride }).then((userCanAddRootTag) => {
                setUserCanAddRootTag(userCanAddRootTag);
            });
        } else if (!loadingGame) {
            setUserCanAddRootTag(true);
        }
    }, [game?.latestRootTag, canAddRootTagRefreshKey, currentRootTag, props.user.id, props.gameId, props.dateOverride, loadingGame]);

    useEffect(() => {
        if (currentRootTag) {
            ApiManager.tagApi.canUserAddSubtag({ userId: props.user.id, tagId: currentRootTag.id }).then((userCanAddSubtag) => {
                setUserCanAddSubtag(userCanAddSubtag);
            });
        } else {
            setUserCanAddSubtag(false);
        }
    }, [currentRootTag, props.user.id]);

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
        (tag: 'addTag' | TagDto | PendingTag) => {
            if (tag === 'addTag') {
                setShowingAddRootTag(true);
                if (!viewingTagScroller) {
                    // if we jumped straight from the cards to the add tag, we need to initialize the "current" tag
                    setCurrentRootTag(game!.latestRootTag);
                    setCurrentTag(game!.latestRootTag);
                }
            } else if (isFullTag(tag)) {
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
                if (!viewingTagScroller) {
                    // switched from card view
                    setCurrentRootTag(game!.latestRootTag);
                    setCurrentTag(game!.latestRootTag);
                }
            }
            if (tag !== 'addTag') {
                setShowingAddRootTag(false);
                setShowingAddSubtag(false);
            }
            setViewingTagScroller(true);
        },
        [game, currentTag, viewingTagScroller]
    );

    if (editingGame) {
        return <CreateEditGame user={props.user} doneCreatingGame={() => setEditingGame(false)} game={game!} />;
    }

    let innerDiv: React.ReactNode;
    if (!game || loadingGame) {
        innerDiv = <div className="game-details">Loading...</div>;
    } else if (viewingGameDetails) {
        innerDiv = <GameDetails game={game} user={props.user} playerDetailsTable={playerDetailsTable} setEditingGame={() => setEditingGame(true)} deleteGame={() => props.deleteGame()} />;
    } else if (viewingTagScroller) {
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

    return <div className="game-view">{innerDiv}</div>;
};
