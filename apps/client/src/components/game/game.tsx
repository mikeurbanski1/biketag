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

// export class Game2 extends React.Component<ViewGameProps, ViewGameState> {
//     constructor(props: ViewGameProps) {
//         super(props);
//         this.state = {
//             isCreator: false,
//             editingGame: false,
//             loadingGame: true,
//             playerDetailsTable: [],
//             showingGameAdminButtons: false,
//             viewingGameDetails: false,
//             showingPendingTag: false,
//             userCanAddRootTag: false,
//             userCanAddSubtag: false,
//             showingAddRootTag: false,
//             showingAddSubtag: false,
//             viewingTagScroller: false,
//         };
//     }

//     public componentDidMount(): void {
//         // this.fetchAndSetUserCanAddRootTag(); do not need to until we look at the tag scroller
//         this.fetchAndSetGame({});
//     }

//     private getInitialTagScrollerViewState(currentTagOverride?: TagDto): Partial<ViewGameState> {
//         const { latestRootTag } = this.state.game ?? {};
//         const state: Partial<ViewGameState> = {
//             showingAddRootTag: (currentTagOverride ?? latestRootTag) === undefined,
//             showingAddSubtag: false,
//             showingPendingTag: false,
//         };

//         return state;
//     }

//     private async fetchAndSetGame(): Promise<Partial<ViewGameState>> {
//         let { game } = this.state;
//         if (!game || game.id !== this.props.gameId) {
//             game = await ApiManager.gameApi.getGame({ id: this.props.gameId, convertPendingTagForOwner: true });
//         }
//         logger.info(`[fetchAndSetGame] for game`, { game });
//         const { latestRootTag } = game;
//         const playerDetailsTable = this.getPlayerDetailsTable(game);
//         const stateUpdate: Partial<ViewGameState> = {
//             game,
//             loadingGame: false,
//             isCreator: game.creator.id === this.props.user.id,
//             playerDetailsTable,
//         };

//         if (this.state.viewingTagScroller || !latestRootTag) {
//             stateUpdate.currentRootTag = latestRootTag;
//             stateUpdate.currentTag = latestRootTag;
//             stateUpdate.showingAddRootTag = latestRootTag === undefined;

//             if (!latestRootTag) {
//                 stateUpdate.viewingTagScroller = true;
//             }
//         }

//         if (setState) {
//             logger.info(`[fetchAndSetGame] in setState true`);
//             this.setState(stateUpdate as ViewGameState);
//             this.fetchAndSetUserCanAddRootTag(game);
//             if (latestRootTag && setState) {
//                 logger.info(`[fetchAndSetGame]`, { latestRootTag });
//                 this.fetchAndSetUserCanAddSubtag(latestRootTag);
//             }
//         }

//         return stateUpdate;
//     }

//     private refreshPlayerScores(): void {
//         const { game } = this.state;
//         if (!game) {
//             return;
//         }
//         ApiManager.gameApi.getGame({ id: game.id, convertPendingTagForOwner: true }).then((game) => {
//             const playerDetailsTable = this.getPlayerDetailsTable(game);
//             this.setState({ playerDetailsTable });
//         });
//     }

//     private fetchAndSetUserCanAddRootTag(gameOverride?: GameDto): void {
//         if ((gameOverride ?? this.state.game)?.latestRootTag) {
//             ApiManager.tagApi.canUserAddTag({ userId: this.props.user.id, gameId: this.props.gameId, dateOverride: this.props.dateOverride }).then((userCanAddRootTag) => {
//                 this.setState({ userCanAddRootTag });
//             });
//         } else {
//             logger.info(`[fetchAndSetUserCanAddRootTag] set true`);
//             this.setState({ userCanAddRootTag: true });
//         }
//     }

//     private fetchAndSetUserCanAddSubtag(tagOverride?: TagDto): void {
//         if (!tagOverride && !this.state.currentRootTag) {
//             this.setState({ userCanAddSubtag: false });
//         } else {
//             ApiManager.tagApi.canUserAddSubtag({ userId: this.props.user.id, tagId: tagOverride?.id ?? this.state.currentRootTag!.id }).then((userCanAddSubtag) => {
//                 this.setState({ userCanAddSubtag });
//             });
//         }
//     }

//     private setAddTagAsActive(isSubtag: boolean): void {
//         if (isSubtag) {
//             this.setState({ showingAddSubtag: true });
//         } else {
//             this.setState({ showingAddRootTag: true });
//         }
//     }

//     // select a root tag from the card view
//     private selectRootTag(tag: TagDto | PendingTag): void {
//         if (isFullTag(tag)) {
//             // only case we for sure know is true
//             const userCanAddSubtag = tag.isRoot && !tag.nextTagId && tag.creator.id !== this.props.user.id;
//             this.setState({ currentRootTag: tag, currentTag: tag, viewingTagScroller: true, userCanAddSubtag, userCanAddRootTag: false });
//             if (!userCanAddSubtag) {
//                 this.fetchAndSetUserCanAddSubtag(tag);
//             }
//             this.fetchAndSetUserCanAddRootTag();
//         } else {
//             // set this up as if we clicked over to the game's pending tag
//             const latestRootTag = this.state.game!.latestRootTag!;
//             this.setState({ showingPendingTag: true, viewingTagScroller: true, currentRootTag: latestRootTag, currentTag: latestRootTag, userCanAddRootTag: false, userCanAddSubtag: false });
//         }
//     }

//     private async createNewTag({ imageUrl, isSubtag }: { imageUrl: string; isSubtag: boolean }): Promise<void> {
//         if (isSubtag) {
//             await this.createNewSubtag({ imageUrl });
//         } else {
//             await this.createNewRootTag({ imageUrl });
//         }
//         this.refreshPlayerScores();
//     }

//     private async createNewRootTag({ imageUrl }: { imageUrl: string }): Promise<void> {
//         const tag = await ApiManager.tagApi.createTag({ imageUrl, gameId: this.props.gameId, isRoot: true });
//         // const latestRootTag = tag;
//         // const updateParams = { latestRootTag };
//         // this.props.updateGame(updateParams);
//         const stateUpdate: Partial<ViewGameState> = {
//             userCanAddRootTag: false,
//             userCanAddSubtag: false,
//             showingAddRootTag: false,
//             game: { ...this.state.game!, latestRootTag: tag },
//         };

//         if (tag.isPending) {
//             stateUpdate.showingPendingTag = true;
//             stateUpdate.game = { ...this.state.game!, pendingRootTag: tag };
//         } else {
//             stateUpdate.currentRootTag = tag;
//             stateUpdate.currentTag = tag;
//             ApiManager.tagApi.updateTagInCache({
//                 tagId: tag.previousRootTagId,
//                 update: { nextRootTagId: tag.id },
//             });
//         }

//         this.setState(stateUpdate as ViewGameState);
//     }

//     private async createNewSubtag({ imageUrl }: { imageUrl: string }): Promise<void> {
//         const tag = await ApiManager.tagApi.createTag({ imageUrl, gameId: this.props.gameId, isRoot: false, rootTagId: this.state.currentRootTag!.id });

//         const updateParams = {
//             userCanAddSubtag: false,
//             currentTag: tag,
//             showingAddSubtag: false,
//         };
//         if (tag.rootTagId! === this.state.game!.latestRootTag!.id) {
//             this.fetchAndSetUserCanAddRootTag();
//         }
//         this.setState(updateParams as ViewGameState);
//         ApiManager.tagApi.updateTagInCache({
//             tagId: tag.parentTagId,
//             update: { nextTagId: tag.id },
//         });
//         ApiManager.tagApi.updateTagInCache({
//             tagId: tag.rootTagId,
//             update: { lastTagInChainId: tag.id },
//         });
//     }

//     private getPlayerDetailsTable(game?: GameDto): PlayerDetailsTableRow[] {
//         if (!game) {
//             game = this.state.game!;
//         }
//         logger.info(`[getPlayerDetailsTable]`, { game });
//         return [{ id: game.creator.id, name: game.creator.name, role: 'OWNER' as PlayerTableRole, ...game.gameScore.playerScores[game.creator.id] }].concat(
//             game.players.map((player) => {
//                 return { id: player.user.id, name: player.user.name, role: player.role, ...game.gameScore.playerScores[player.user.id] };
//             })
//         );
//     }

//     private refreshGame(): void {
//         this.setState({
//             loadingGame: true,
//             userCanAddRootTag: false,
//             userCanAddSubtag: false,
//         });
//         this.fetchAndSetGame({});
//         this.fetchAndSetUserCanAddRootTag();
//     }

//     private extendCurrentTagStateFromLatestTag(stateUpdate: Partial<ViewGameState>): void {
//         const latestRootTag = this.state.game!.latestRootTag!;

//         stateUpdate.currentRootTag = latestRootTag;
//         stateUpdate.currentTag = latestRootTag;
//     }

//     private setCurrentTag(tag: TagDto | PendingTag | 'addTag'): void {
//         const stateUpdate: Partial<ViewGameState> = { showingAddRootTag: false, showingAddSubtag: false, viewingTagScroller: true };
//         if (tag === 'addTag') {
//             stateUpdate.showingAddRootTag = true;
//             if (!this.state.viewingTagScroller) {
//                 // if we jumped straight from the cards to the add tag, we need to initialize the "current" tag
//                 this.extendCurrentTagStateFromLatestTag(stateUpdate);
//             }
//         } else if (isFullTag(tag)) {
//             if (tag.id === this.state.currentTag?.id) {
//                 // we switched back to the latest tag from pending tag or root tag
//                 stateUpdate.showingPendingTag = false;
//             } else {
//                 stateUpdate.currentTag = tag;
//                 if (tag.isRoot) {
//                     stateUpdate.currentRootTag = tag;
//                     this.fetchAndSetUserCanAddSubtag(tag);
//                 }
//             }
//         } else {
//             stateUpdate.showingPendingTag = true;
//             if (!this.state.viewingTagScroller) {
//                 // if we jumped straight from the cards to the pending tag, we need to initialize the "current" tag
//                 this.extendCurrentTagStateFromLatestTag(stateUpdate);
//             }
//         }
//         this.setState(stateUpdate as ViewGameState);
//     }

//     public render() {
//         const { game } = this.state;

//         if (this.state.editingGame) {
//             return <CreateEditGame user={this.props.user} doneCreatingGame={() => this.setState({ editingGame: false })} game={this.state.game!} />;
//         }

//         let innerDiv: React.ReactNode;
//         if (!game || this.state.loadingGame) {
//             innerDiv = <div className="game-details">Loading...</div>;
//         } else if (this.state.viewingGameDetails) {
//             innerDiv = (
//                 <GameDetails
//                     game={game}
//                     user={this.props.user}
//                     playerDetailsTable={this.state.playerDetailsTable}
//                     showingGameAdminButtons={this.state.showingGameAdminButtons}
//                     setShowingGameAdminButtons={(value) => this.setState({ showingGameAdminButtons: value })}
//                     setEditingGame={() => this.setState({ editingGame: true })}
//                     deleteGame={() => this.props.deleteGame()}
//                 />
//             );
//         } else if (this.state.viewingTagScroller) {
//             innerDiv = (
//                 <TagScroller
//                     game={game}
//                     dateOverride={this.props.dateOverride}
//                     currentRootTag={this.state.currentRootTag}
//                     currentTag={this.state.currentTag}
//                     userCanAddRootTag={this.state.userCanAddRootTag}
//                     userCanAddSubtag={this.state.userCanAddSubtag}
//                     showingAddRootTag={this.state.showingAddRootTag}
//                     showingAddSubtag={this.state.showingAddSubtag}
//                     showingPendingTag={this.state.showingPendingTag}
//                     createNewTag={({ imageUrl, isSubtag }: { imageUrl: string; isSubtag: boolean }) => this.createNewTag({ imageUrl, isSubtag })}
//                     setAddTagAsActive={(isSubtag: boolean) => this.setAddTagAsActive(isSubtag)}
//                     selectTag={(tag: TagDto | PendingTag) => this.setCurrentTag(tag)}
//                 />
//             );
//         } else {
//             innerDiv = <TagCardView game={game} selectTag={(tag: TagDto | PendingTag | 'addTag') => this.setCurrentTag(tag)} userCanAddRootTag={this.state.userCanAddRootTag} />;
//         }

//         // const backText = this.state.viewingGameDetails ? '← Back to tags' : '← Back to games';
//         // const backOnClick = this.state.viewingGameDetails ? () => this.setState({ viewingGameDetails: false }) : () => this.props.doneViewingGame();

//         return (
//             <div className="game-view">
//                 {/* <NavHeader
//                     leftText={backText}
//                     leftOnClick={backOnClick}
//                     centerText={`${this.props.gameName} ↻`}
//                     centerOnClick={() => this.refreshGame()}
//                     rightText={!this.state.viewingGameDetails && !this.state.loadingGame ? 'Game details →' : undefined}
//                     rightOnClick={() => this.setState({ viewingGameDetails: true })}
//                 /> */}
//                 {innerDiv}
//             </div>
//         );
//     }
// }
