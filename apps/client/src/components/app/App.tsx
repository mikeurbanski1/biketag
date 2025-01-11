import dayjs, { Dayjs } from 'dayjs';
import React, { useCallback, useEffect } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import { UserDto, UserSettingsDto } from '@biketag/models';
import { Logger } from '@biketag/utils';

import { ApiManager } from '../../api';
import { UserContext } from '../common/context';
import { Login } from '../login';
import { Home } from './home';
import { NavBar } from './navBar';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const logger = new Logger({});

export const App: React.FC = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [clientId, setClientId] = React.useState<string>(uuidv4());
    const [user, setUser] = React.useState<UserDto | undefined>(undefined);
    const [userSettings, setUserSettings] = React.useState<UserSettingsDto | undefined>(undefined);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [dateOverride, setDateOverride] = React.useState<Dayjs>(dayjs());

    const navigate = useNavigate();

    useEffect(() => {
        ApiManager.initialize({ clientId });
    }, [clientId]);

    const setUserCallback = useCallback(
        (user: UserDto) => {
            ApiManager.setUser({ userId: user.id });
            setUser(user);
            ApiManager.userSettingsApi.getUserSettings().then((settings) => {
                setUserSettings(settings);
                navigate('/home/my-games');
            });
        },
        [navigate]
    );

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

    const startCreateGame = useCallback(() => {
        navigate('/home/create-game');
    }, [navigate]);

    const doneViewingGame = () => {
        navigate(user ? '/home/my-games' : '/');
    };

    const handleLogout = () => {
        setUser(undefined);
        setUserSettings(undefined);
        ApiManager.setUser({ userId: null });
        navigate('/');
    };

    logger.info(`[App] render`);

    return (
        <div className="App">
            <UserContext.Provider value={user}>
                <NavBar backToHome={doneViewingGame} handleLogout={handleLogout} doneViewingGame={doneViewingGame} startCreateGame={startCreateGame}></NavBar>

                <div className="main">
                    <Routes>
                        <Route path="/" element={<Login key="login" setUser={setUserCallback} />}></Route>
                        <Route path="home/*" element={<Home userSettings={userSettings} setUserStarredGame={setUserStarredGame} dateOverride={dayjs()} />}></Route>
                    </Routes>
                </div>
            </UserContext.Provider>
            {/* <input type="button" name="reset-client-button" value="Reset local client ID" onClick={this.handleResetClient}></input> */}
        </div>
    );
};
