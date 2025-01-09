import dayjs, { Dayjs } from 'dayjs';
import React, { ReactNode, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { GameDto, GameSummary, UserDto, UserSettingsDto } from '@biketag/models';
import { Logger } from '@biketag/utils';

import { ApiManager } from './api';
import { UserContext } from './components/common/context';
import { NavBar } from './components/common/navBar';
import { CreateEditGame } from './components/game/createEditGame';
import { Game } from './components/game/game';
import { GameList } from './components/game/gameList';
import { Login } from './components/login';

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
    const [userSettings, setUserSettings] = React.useState<UserSettingsDto | undefined>(undefined);
    const [game, setGame] = React.useState<{ id: string; name: string } | undefined>(undefined);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [dateOverride, setDateOverride] = React.useState<Dayjs>(dayjs());

    useEffect(() => {
        ApiManager.initialize({ clientId });
    }, [clientId]);

    const setUserCallback = useCallback((user: UserDto) => {
        ApiManager.setUser({ userId: user.id });
        ApiManager.userSettingsApi.getUserSettings().then((settings) => {
            setUser(user);
            setUserSettings(settings);
            setAppState(AppState.HOME);
        });
    }, []);

    const setUserStarredGame = useCallback(
        ({ gameId, isStarred }: { gameId: string; isStarred: boolean }) => {
            const currentStarredGames = userSettings!.starredGames;
            const newStarredGames = isStarred ? currentStarredGames.concat(gameId) : currentStarredGames.filter((id) => id !== gameId);
            ApiManager.userSettingsApi.updateUserSettings({ starredGames: newStarredGames }).then((settings) => {
                logger.info(`[App] updated starred games to ${newStarredGames}`);
                setUserSettings(settings);
            });
        },
        [userSettings]
    );

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
        setUserSettings(undefined);
        ApiManager.setUser({ userId: null });
    };

    let inner: ReactNode;

    if (appState === AppState.LOGGED_OUT) {
        inner = <Login key="login" setUser={setUserCallback}></Login>;
    } else if (appState === AppState.CREATING_GAME) {
        inner = <CreateEditGame doneCreatingGame={doneCreatingGame} />;
    } else if (appState === AppState.HOME) {
        inner = <GameList selectGame={setGameCallback} starredGames={userSettings!.starredGames} setUserStarredGame={setUserStarredGame} />;
    } else if (appState === AppState.VIEWING_GAME) {
        const gameIsStarred = userSettings!.starredGames.includes(game!.id);
        inner = (
            <Game
                gameId={game!.id}
                gameName={game!.name}
                deleteGame={deleteGame}
                doneViewingGame={doneViewingGame}
                dateOverride={dateOverride}
                isStarred={gameIsStarred}
                setUserStarredGame={() => setUserStarredGame({ gameId: game!.id, isStarred: !gameIsStarred })}
            />
        );
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
