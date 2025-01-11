import { Dayjs } from 'dayjs';
import { useCallback } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';

import { GameDto, GameSummary, UserSettingsDto } from '@biketag/models';
import { Logger } from '@biketag/utils';

import { ApiManager } from '../../api';
import { CreateEditGame } from '../game/createEditGame';
import { Game } from '../game/game';
import { GameList } from '../game/gameList';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const logger = new Logger({});

interface HomeProps {
    userSettings?: UserSettingsDto;
    setUserStarredGame: ({ gameId, isStarred }: { gameId: string; isStarred: boolean }) => void;
    dateOverride: Dayjs;
}

interface UserDefinedHomeProps {
    userSettings: UserSettingsDto;
}

const userProvided = (props: HomeProps): props is HomeProps & UserDefinedHomeProps => props.userSettings !== undefined;

export const Home: React.FC<HomeProps> = (props: HomeProps) => {
    const navigate = useNavigate();

    const doneCreatingGame = useCallback(
        (game?: GameDto): void => {
            if (game) {
                navigate(`/home/game/${game.id}`);
            } else {
                navigate(-1);
            }
        },
        [navigate]
    );

    const setGameCallback = useCallback(
        (game: GameSummary) => {
            navigate(`/home/game/${game.id}`);
        },
        [navigate]
    );

    const deleteGame = useCallback(
        (gameId: string) => {
            ApiManager.gameApi.deleteGame({ gameId }).then(() => {
                navigate('/home/my-games');
            });
        },
        [navigate]
    );

    if (userProvided(props)) {
        const { userSettings, setUserStarredGame, dateOverride } = props;
        return (
            <Routes>
                <Route path="create-game" element={<CreateEditGame doneCreatingGame={doneCreatingGame} />}></Route>
                <Route path="my-games" element={<GameList selectGame={setGameCallback} starredGames={userSettings.starredGames} setUserStarredGame={setUserStarredGame} />}></Route>
                <Route
                    path="game/:gameId/*"
                    element={<Game deleteGame={deleteGame} dateOverride={dateOverride} setUserStarredGame={setUserStarredGame} userStarredGames={userSettings.starredGames} />}
                ></Route>
            </Routes>
        );
    } else {
        return <Navigate to="/" />;
    }
};
