import dayjs, { Dayjs } from 'dayjs';
import React, { ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { GameDto, GameSummary, UserDto } from '@biketag/models';
import { Logger } from '@biketag/utils';

import { ApiManager } from './api';
import { NavBar } from './components/common/navBar';
import { CreateEditGame } from './components/game/createEditGame';
import { Game } from './components/game/game';
import { GameList } from './components/game/gameList';
import { Login } from './components/login';

const logger = new Logger({});

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface AppProps {}

enum AppState {
    LOGGED_OUT,
    HOME,
    VIEWING_GAME,
    CREATING_GAME,
}

interface AppComponentState {
    state: AppState;
    previousState?: AppState;
    name?: string;
    loggedIn: boolean;
    clientId: string;
    userId?: string;
    user?: UserDto;
    game?: GameSummary;
    dateOverride: Dayjs;
}

export default class App extends React.Component<AppProps, AppComponentState> {
    constructor(props: AppProps) {
        super(props);

        const clientId = localStorage.getItem('clientId');
        const name = localStorage.getItem('userName') || undefined;

        logger.info('clientId and userName from local storage:', { clientId, name });

        this.state = {
            state: AppState.LOGGED_OUT,
            name,
            clientId: clientId || uuidv4(),
            loggedIn: false,
            dateOverride: dayjs(),
        };

        ApiManager.initialize({ clientId: this.state.clientId });

        logger.info('Client UUID:', { uuid: this.state.clientId });
        localStorage.setItem('clientId', this.state.clientId);
    }

    async setUser({ name, id }: { name: string; id: string }) {
        this.setState({
            user: { name, id },
            userId: id,
            state: AppState.HOME,
        });
        ApiManager.setUser({ userId: id });
    }

    // private handleResetClient() {
    //     localStorage.removeItem('clientId');
    //     window.location.reload();
    // }

    private handleLogout() {
        this.setState({
            state: AppState.LOGGED_OUT,
            userId: undefined,
            loggedIn: false,
            user: undefined,
        });
        ApiManager.setUser({ userId: null });
    }

    private startCreateGame() {
        this.setState({ state: AppState.CREATING_GAME, previousState: this.state.state });
    }

    private doneCreatingGame(game?: GameDto): void {
        const newState = game ? AppState.VIEWING_GAME : this.state.previousState!;
        const stateUpdate: Partial<AppComponentState> = { state: newState, previousState: undefined };
        // set the created game as the game being viewed, otherwise do not change anything
        if (game) {
            stateUpdate.game = game;
        }
        this.setState(stateUpdate as AppComponentState);
    }

    private setGame(game: GameSummary) {
        this.setState({ game, state: AppState.VIEWING_GAME, previousState: this.state.state });
    }

    private doneViewingGame() {
        this.setState({ state: AppState.HOME, previousState: undefined, game: undefined });
    }

    // private handleDateChange(event: React.ChangeEvent<HTMLInputElement>) {
    //     if (!event.target['validity'].valid || !dayjs(event.target.value).isValid()) return;
    //     this.setState({ dateOverride: dayjs(event.target.value) });
    // }

    private async deleteGame() {
        if (this.state.game) {
            ApiManager.gameApi.deleteGame({ gameId: this.state.game.id }).then(() => {
                this.setState({ state: AppState.HOME, game: undefined });
            });
        }
    }

    private isCreatingGame(state: AppComponentState): state is AppComponentState & { user: UserDto } {
        return state.state === AppState.CREATING_GAME;
    }

    private isViewingGame(state: AppComponentState): state is AppComponentState & { game: GameSummary; user: UserDto } {
        return state.state === AppState.VIEWING_GAME;
    }

    /*
    <div hidden={true}>
                        Date override: <input aria-label="Date" type="date" defaultValue={this.state.dateOverride.format('YYYY-MM-DD')} onChange={(event) => this.handleDateChange(event)} />
                    </div>
                    */

    public render(): ReactNode {
        let inner: ReactNode;

        if (this.state.state === AppState.LOGGED_OUT) {
            inner = <Login key="login" setUser={({ name, id }: { name: string; id: string }) => this.setUser({ name, id })}></Login>;
        } else if (this.isCreatingGame(this.state)) {
            inner = <CreateEditGame user={this.state.user} doneCreatingGame={(game?: GameDto) => this.doneCreatingGame(game)} />;
        } else if (this.state.state === AppState.HOME) {
            inner = <GameList user={this.state.user!} selectGame={(game: GameSummary) => this.setGame(game)} startCreateGame={() => this.startCreateGame()} />;
        } else if (this.isViewingGame(this.state)) {
            inner = (
                <Game
                    gameId={this.state.game.id}
                    gameName={this.state.game.name}
                    user={this.state.user}
                    deleteGame={() => this.deleteGame()}
                    doneViewingGame={() => this.doneViewingGame()}
                    dateOverride={this.state.dateOverride}
                />
            );
        }

        return (
            <div className="App">
                <NavBar
                    user={this.state.user}
                    backToHome={() => this.doneViewingGame()}
                    handleLogout={() => this.handleLogout()}
                    doneViewingGame={() => this.doneViewingGame()}
                    startCreateGame={() => this.startCreateGame()}
                ></NavBar>
                <div className="main">{inner}</div>
                {/* <input type="button" name="reset-client-button" value="Reset local client ID" onClick={this.handleResetClient}></input> */}
            </div>
        );
    }
}
