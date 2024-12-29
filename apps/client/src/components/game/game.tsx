import { Dayjs } from 'dayjs';
import React from 'react';

import { GameDto, GameRoles, isFullTag, PendingTag, PlayerScores, TagDto, UserDto } from '@biketag/models';
import { Logger } from '@biketag/utils';

import { ApiManager } from '../../api';

import '../../styles/game.css';

import { CreateEditGame } from './createEditGame';
import { GameDetails } from './gameDetails';
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

interface ViewGameState {
    game?: GameDto;
    editingGame: boolean;
    loadingGame: boolean;
    isCreator: boolean;
    playerDetailsTable: PlayerDetailsTableRow[];
    currentRootTag?: TagDto;
    currentTag?: TagDto;
    showingGameAdminButtons: boolean;
    userCanAddRootTag: boolean;
    userCanAddSubtag: boolean;
    viewingGameDetails: boolean;
    showingPendingTag: boolean;
    showingAddRootTag: boolean;
    showingAddSubtag: boolean;
    viewingTagScroller: boolean;
}

interface ViewGameProps {
    user: UserDto;
    gameId: string;
    gameName: string;
    doneViewingGame: () => void;
    deleteGame: () => void;
    dateOverride: Dayjs;
}

export class Game extends React.Component<ViewGameProps, ViewGameState> {
    constructor(props: ViewGameProps) {
        super(props);
        this.state = {
            isCreator: false,
            editingGame: false,
            loadingGame: true,
            playerDetailsTable: [],
            showingGameAdminButtons: false,
            viewingGameDetails: false,
            showingPendingTag: false,
            userCanAddRootTag: false,
            userCanAddSubtag: false,
            showingAddRootTag: false,
            showingAddSubtag: false,
            viewingTagScroller: false,
        };
    }

    public componentDidMount(): void {
        // this.fetchAndSetUserCanAddRootTag(); do not need to until we look at the tag scroller
        this.fetchAndSetGame();
    }

    private getInitialTagScrollerViewState(currentTagOverride?: TagDto): Partial<ViewGameState> {
        const { latestRootTag } = this.state.game ?? {};
        const state: Partial<ViewGameState> = {
            showingAddRootTag: (currentTagOverride ?? latestRootTag) === undefined,
            showingAddSubtag: false,
            showingPendingTag: false,
        };

        return state;
    }

    private async fetchAndSetGame(setState = true, viewingTagScrollerOverride?: boolean): Promise<Partial<ViewGameState>> {
        let { game } = this.state;
        if (!game || game.id !== this.props.gameId) {
            game = await ApiManager.gameApi.getGame({ id: this.props.gameId, convertPendingTagForOwner: true });
        }
        logger.info(`[fetchAndSetGame] for game`, { game });
        const { latestRootTag } = game;
        const playerDetailsTable = this.getPlayerDetailsTable(game);
        const stateUpdate: Partial<ViewGameState> = {
            game,
            loadingGame: false,
            isCreator: game.creator.id === this.props.user.id,
            playerDetailsTable,
        };

        if (viewingTagScrollerOverride ?? this.state.viewingTagScroller) {
            stateUpdate.currentRootTag = latestRootTag;
            stateUpdate.currentTag = latestRootTag;
            stateUpdate.showingAddRootTag = latestRootTag === undefined;
        }

        if (setState) {
            logger.info(`[fetchAndSetGame] in setState true`);
            this.setState(stateUpdate as ViewGameState);
            this.fetchAndSetUserCanAddRootTag(game);
            if (latestRootTag && setState) {
                logger.info(`[fetchAndSetGame]`, { latestRootTag });
                this.fetchAndSetUserCanAddSubtag(latestRootTag);
            }
        }

        return stateUpdate;
    }

    private refreshPlayerScores(): void {
        const { game } = this.state;
        if (!game) {
            return;
        }
        ApiManager.gameApi.getGame({ id: game.id, convertPendingTagForOwner: true }).then((game) => {
            const playerDetailsTable = this.getPlayerDetailsTable(game);
            this.setState({ playerDetailsTable });
        });
    }

    private fetchAndSetUserCanAddRootTag(gameOverride?: GameDto): void {
        if ((gameOverride ?? this.state.game)?.latestRootTag) {
            ApiManager.tagApi.canUserAddTag({ userId: this.props.user.id, gameId: this.props.gameId, dateOverride: this.props.dateOverride }).then((userCanAddRootTag) => {
                this.setState({ userCanAddRootTag });
            });
        } else {
            logger.info(`[fetchAndSetUserCanAddRootTag] set true`);
            this.setState({ userCanAddRootTag: true });
        }
    }

    private fetchAndSetUserCanAddSubtag(tagOverride?: TagDto): void {
        if (!tagOverride && !this.state.currentRootTag) {
            this.setState({ userCanAddSubtag: false });
        } else {
            ApiManager.tagApi.canUserAddSubtag({ userId: this.props.user.id, tagId: tagOverride?.id ?? this.state.currentRootTag!.id }).then((userCanAddSubtag) => {
                this.setState({ userCanAddSubtag });
            });
        }
    }

    private setAddTagAsActive(isSubtag: boolean): void {
        if (isSubtag) {
            this.setState({ showingAddSubtag: true });
        } else {
            this.setState({ showingAddRootTag: true });
        }
    }

    // select a root tag from the card view
    private selectRootTag(tag: TagDto | PendingTag): void {
        if (isFullTag(tag)) {
            // only case we for sure know is true
            const userCanAddSubtag = tag.isRoot && !tag.nextTagId && tag.creator.id !== this.props.user.id;
            this.setState({ currentRootTag: tag, currentTag: tag, viewingTagScroller: true, userCanAddSubtag, userCanAddRootTag: false });
            if (!userCanAddSubtag) {
                this.fetchAndSetUserCanAddSubtag(tag);
            }
            this.fetchAndSetUserCanAddRootTag();
        } else {
            // set this up as if we clicked over to the game's pending tag
            const latestRootTag = this.state.game!.latestRootTag!;
            this.setState({ showingPendingTag: true, viewingTagScroller: true, currentRootTag: latestRootTag, currentTag: latestRootTag, userCanAddRootTag: false, userCanAddSubtag: false });
        }
    }

    private async createNewTag({ imageUrl, isSubtag }: { imageUrl: string; isSubtag: boolean }): Promise<void> {
        if (isSubtag) {
            await this.createNewSubtag({ imageUrl });
        } else {
            await this.createNewRootTag({ imageUrl });
        }
        this.refreshPlayerScores();
    }

    private async createNewRootTag({ imageUrl }: { imageUrl: string }): Promise<void> {
        const tag = await ApiManager.tagApi.createTag({ imageUrl, gameId: this.props.gameId, isRoot: true });
        // const latestRootTag = tag;
        // const updateParams = { latestRootTag };
        // this.props.updateGame(updateParams);
        const stateUpdate: Partial<ViewGameState> = {
            userCanAddRootTag: false,
            userCanAddSubtag: false,
            showingAddRootTag: false,
            game: { ...this.state.game!, latestRootTag: tag },
        };

        if (tag.isPending) {
            stateUpdate.showingPendingTag = true;
            stateUpdate.game = { ...this.state.game!, pendingRootTag: tag };
        } else {
            stateUpdate.currentRootTag = tag;
            stateUpdate.currentTag = tag;
            ApiManager.tagApi.updateTagInCache({
                tagId: tag.previousRootTagId,
                update: { nextRootTagId: tag.id },
            });
        }

        this.setState(stateUpdate as ViewGameState);
    }

    private async createNewSubtag({ imageUrl }: { imageUrl: string }): Promise<void> {
        const tag = await ApiManager.tagApi.createTag({ imageUrl, gameId: this.props.gameId, isRoot: false, rootTagId: this.state.currentRootTag!.id });

        const updateParams = {
            userCanAddSubtag: false,
            currentTag: tag,
            showingAddSubtag: false,
        };
        if (tag.rootTagId! === this.state.game!.latestRootTag!.id) {
            this.fetchAndSetUserCanAddRootTag();
        }
        this.setState(updateParams as ViewGameState);
        ApiManager.tagApi.updateTagInCache({
            tagId: tag.parentTagId,
            update: { nextTagId: tag.id },
        });
        ApiManager.tagApi.updateTagInCache({
            tagId: tag.rootTagId,
            update: { lastTagInChainId: tag.id },
        });
    }

    private getPlayerDetailsTable(game?: GameDto): PlayerDetailsTableRow[] {
        if (!game) {
            game = this.state.game!;
        }
        logger.info(`[getPlayerDetailsTable]`, { game });
        return [{ id: game.creator.id, name: game.creator.name, role: 'OWNER' as PlayerTableRole, ...game.gameScore.playerScores[game.creator.id] }].concat(
            game.players.map((player) => {
                return { id: player.user.id, name: player.user.name, role: player.role, ...game.gameScore.playerScores[player.user.id] };
            })
        );
    }

    private refreshGame(): void {
        this.setState({
            loadingGame: true,
            userCanAddRootTag: false,
            userCanAddSubtag: false,
        });
        this.fetchAndSetGame();
        this.fetchAndSetUserCanAddRootTag();
    }

    private extendCurrentTagStateFromLatestTag(stateUpdate: Partial<ViewGameState>): void {
        const latestRootTag = this.state.game!.latestRootTag!;

        stateUpdate.currentRootTag = latestRootTag;
        stateUpdate.currentTag = latestRootTag;
    }

    private setCurrentTag(tag: TagDto | PendingTag | 'addTag'): void {
        const stateUpdate: Partial<ViewGameState> = { showingAddRootTag: false, showingAddSubtag: false, viewingTagScroller: true };
        if (tag === 'addTag') {
            stateUpdate.showingAddRootTag = true;
            if (!this.state.viewingTagScroller) {
                // if we jumped straight from the cards to the add tag, we need to initialize the "current" tag
                this.extendCurrentTagStateFromLatestTag(stateUpdate);
            }
        } else if (isFullTag(tag)) {
            if (tag.id === this.state.currentTag?.id) {
                // we switched back to the latest tag from pending tag or root tag
                stateUpdate.showingPendingTag = false;
            } else {
                stateUpdate.currentTag = tag;
                if (tag.isRoot) {
                    stateUpdate.currentRootTag = tag;
                    this.fetchAndSetUserCanAddSubtag(tag);
                }
            }
        } else {
            stateUpdate.showingPendingTag = true;
            if (!this.state.viewingTagScroller) {
                // if we jumped straight from the cards to the pending tag, we need to initialize the "current" tag
                this.extendCurrentTagStateFromLatestTag(stateUpdate);
            }
        }
        this.setState(stateUpdate as ViewGameState);
    }

    public render() {
        const { game } = this.state;

        if (this.state.editingGame) {
            return <CreateEditGame user={this.props.user} doneCreatingGame={() => this.setState({ editingGame: false })} game={this.state.game!} />;
        }

        let innerDiv: React.ReactNode;
        if (!game || this.state.loadingGame) {
            innerDiv = <div className="game-details">Loading...</div>;
        } else if (this.state.viewingGameDetails) {
            innerDiv = (
                <GameDetails
                    game={game}
                    user={this.props.user}
                    playerDetailsTable={this.state.playerDetailsTable}
                    showingGameAdminButtons={this.state.showingGameAdminButtons}
                    setShowingGameAdminButtons={(value) => this.setState({ showingGameAdminButtons: value })}
                    setEditingGame={() => this.setState({ editingGame: true })}
                    deleteGame={() => this.props.deleteGame()}
                />
            );
        } else if (this.state.viewingTagScroller) {
            innerDiv = (
                <TagScroller
                    game={game}
                    dateOverride={this.props.dateOverride}
                    currentRootTag={this.state.currentRootTag}
                    currentTag={this.state.currentTag}
                    userCanAddRootTag={this.state.userCanAddRootTag}
                    userCanAddSubtag={this.state.userCanAddSubtag}
                    showingAddRootTag={this.state.showingAddRootTag}
                    showingAddSubtag={this.state.showingAddSubtag}
                    showingPendingTag={this.state.showingPendingTag}
                    createNewTag={({ imageUrl, isSubtag }: { imageUrl: string; isSubtag: boolean }) => this.createNewTag({ imageUrl, isSubtag })}
                    setAddTagAsActive={(isSubtag: boolean) => this.setAddTagAsActive(isSubtag)}
                    selectTag={(tag: TagDto | PendingTag) => this.setCurrentTag(tag)}
                />
            );
        } else {
            innerDiv = <TagCardView game={game} selectTag={(tag: TagDto | PendingTag | 'addTag') => this.setCurrentTag(tag)} userCanAddRootTag={this.state.userCanAddRootTag} />;
        }

        // const backText = this.state.viewingGameDetails ? '← Back to tags' : '← Back to games';
        // const backOnClick = this.state.viewingGameDetails ? () => this.setState({ viewingGameDetails: false }) : () => this.props.doneViewingGame();

        return (
            <div className="game-view">
                {/* <NavHeader
                    leftText={backText}
                    leftOnClick={backOnClick}
                    centerText={`${this.props.gameName} ↻`}
                    centerOnClick={() => this.refreshGame()}
                    rightText={!this.state.viewingGameDetails && !this.state.loadingGame ? 'Game details →' : undefined}
                    rightOnClick={() => this.setState({ viewingGameDetails: true })}
                /> */}
                {innerDiv}
            </div>
        );
    }
}
