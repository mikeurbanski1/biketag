import { useLocalStorage } from '@uidotdev/usehooks';
import dayjs, { Dayjs } from 'dayjs';
import React, { useCallback, useEffect, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import { UserDto, UserSettingsDto } from '@biketag/models';
import { Logger } from '@biketag/utils';

import { ApiManager } from '../../api';
import { LOCAL_STORAGE_CLIENT_ID_KEY, LOCAL_STORAGE_USER_KEY } from '../../utils/consts';
import { UserContext } from '../common/context';
import { Login } from '../login';
import { Home } from './home';
import { NavBar } from './navBar';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const logger = new Logger({});

const localStorageClientIdString = localStorage.getItem(LOCAL_STORAGE_CLIENT_ID_KEY);
const localStorageClientId = localStorageClientIdString ? JSON.parse(localStorageClientIdString) : undefined;
const localStorageUserString = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
const localStorageUser = localStorageUserString ? JSON.parse(localStorageUserString) : undefined;

// we need to do this before we start react - but we can manage them the proper way
if (localStorageClientId) {
    ApiManager.initialize({ clientId: localStorageClientId, userId: localStorageUser?.id });
}

export const App: React.FC = () => {
    const [storedUser, setStoredUser] = useLocalStorage<UserDto | undefined>('user', undefined);
    const [clientId] = useLocalStorage<string>('clientId', uuidv4());

    const [user, setUser] = useState<UserDto | undefined>(storedUser);
    const [userSettings, setUserSettings] = useState<UserSettingsDto | undefined>(undefined);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [dateOverride, setDateOverride] = useState<Dayjs>(dayjs());

    const navigate = useNavigate();

    useEffect(() => {
        ApiManager.initialize({ clientId, userId: storedUser?.id });
    }, [clientId, storedUser?.id]);

    const setUserCallback = useCallback(
        (user: UserDto) => {
            ApiManager.setUser({ userId: user.id });
            setStoredUser(user);
            logger.info(`[App] set logged in user to`, { user });
            setUser(user);
            ApiManager.userSettingsApi.getUserSettings().then((settings) => {
                setUserSettings(settings);
                navigate('/home/my-games');
            });
        },
        [navigate, setStoredUser]
    );

    useEffect(() => {
        if (storedUser && !user) {
            ApiManager.setUser({ userId: storedUser.id });
        }
    }, [setUserCallback, user, storedUser]);

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
        setStoredUser(undefined);
        ApiManager.setUser({ userId: null });
        navigate('/');
    };

    return (
        <div className="App">
            <UserContext.Provider value={user}>
                <NavBar backToHome={doneViewingGame} handleLogout={handleLogout} doneViewingGame={doneViewingGame} startCreateGame={startCreateGame}></NavBar>

                <div className="main">
                    <Routes>
                        <Route path="/" element={!storedUser && <Login key="login" setUser={setUserCallback} />}></Route>
                        <Route path="home/*" element={<Home userSettings={userSettings} setUserStarredGame={setUserStarredGame} dateOverride={dayjs()} />}></Route>
                    </Routes>
                </div>
            </UserContext.Provider>
            {/* <input type="button" name="reset-client-button" value="Reset local client ID" onClick={this.handleResetClient}></input> */}
        </div>
    );
};
