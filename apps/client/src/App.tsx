import dayjs, { Dayjs } from 'dayjs';
import React, { ReactNode, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { GameDto, GameSummary, UserDto } from '@biketag/models';
import { Logger } from '@biketag/utils';

import { ApiManager } from './api';
import { NavBar } from './components/common/navBar';
import { CreateEditGame } from './components/game/createEditGame';
import { Game } from './components/game/game';
import { GameList } from './components/game/gameList';
import { Login } from './components/login';
import { UserContext } from './components/common/context';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const logger = new Logger({});

enum AppState {
    LOGGED_OUT,
    HOME,
    VIEWING_GAME,
    CREATING_GAME,
}

export const App: React.FC = () => {
    const [appState, setAppState] = React.useState<AppState>(AppState.LOGGED_OUT);
    const [previousState, setPreviousState] = React.useState<AppState | undefined>(undefined);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [clientId, setClientId] = React.useState<string>(uuidv4());
    const [user, setUser] = React.useState<UserDto | undefined>(undefined);
    const [game, setGame] = React.useState<GameSummary | undefined>(undefined);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [dateOverride, setDateOverride] = React.useState<Dayjs>(dayjs());

    useEffect(() => {
        ApiManager.initialize({ clientId });
    }, [clientId]);

    const setUserCallback = useCallback((user: UserDto) => {
        setUser(user);
        setAppState(AppState.HOME);
        ApiManager.setUser({ userId: user.id });
    }, []);

    const doneCreatingGame = useCallback(
        (game?: GameDto): void => {
            const newState = game ? AppState.VIEWING_GAME : previousState!;
            setAppState(newState);
            setPreviousState(undefined);
            // set the created game as the game being viewed, otherwise do not change anything
            if (game) {
                setGame(game);
            }
        },
        [previousState]
    );

    const setGameCallback = useCallback(
        (game: GameSummary) => {
            setGame(game);
            setAppState(AppState.VIEWING_GAME);
            setPreviousState(appState);
        },
        [appState]
    );

    const startCreateGame = useCallback(() => {
        setPreviousState(appState);
        setAppState(AppState.CREATING_GAME);
    }, [appState]);

    const deleteGame = useCallback(() => {
        if (game) {
            ApiManager.gameApi.deleteGame({ gameId: game.id }).then(() => {
                setAppState(AppState.HOME);
                setGame(undefined);
            });
        }
    }, [game]);

    const doneViewingGame = () => {
        setAppState(AppState.HOME);
        setPreviousState(undefined);
        setGame(undefined);
    };

    const handleLogout = () => {
        setAppState(AppState.LOGGED_OUT);
        setUser(undefined);
        ApiManager.setUser({ userId: null });
    };

    let inner: ReactNode;

    if (appState === AppState.LOGGED_OUT) {
        inner = <Login key="login" setUser={setUserCallback}></Login>;
    } else if (appState === AppState.CREATING_GAME) {
        inner = <CreateEditGame doneCreatingGame={doneCreatingGame} />;
    } else if (appState === AppState.HOME) {
        inner = <GameList selectGame={setGameCallback} startCreateGame={startCreateGame} />;
    } else if (appState === AppState.VIEWING_GAME) {
        inner = <Game gameId={game!.id} gameName={game!.name} deleteGame={deleteGame} doneViewingGame={doneViewingGame} dateOverride={dateOverride} />;
    }

    return (
        <div className="App">
            <UserContext.Provider value={user}>
                <NavBar backToHome={doneViewingGame} handleLogout={handleLogout} doneViewingGame={doneViewingGame} startCreateGame={startCreateGame}></NavBar>
                <div className="main">{inner}</div>
            </UserContext.Provider>
            {/* <input type="button" name="reset-client-button" value="Reset local client ID" onClick={this.handleResetClient}></input> */}
        </div>
    );
};
