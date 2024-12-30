import React, { useEffect } from 'react';

import '../../styles/createEditGame.css';

import { CreateGameDto, GameDto, GameRoles, UserDto } from '@biketag/models';
import { Logger } from '@biketag/utils';

import { ApiManager } from '../../api';
import { UserBeingAdded } from '../../models/user';
import { NavHeader } from '../common/navHeader';
import UserSelection from '../userSelection';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const logger = new Logger({ prefix: '[CreateEditGame]' });

interface CreateEditGameProps {
    user: UserDto;
    game?: GameDto;
    doneCreatingGame: (game?: GameDto) => void;
}

export const CreateEditGame: React.FC<CreateEditGameProps> = (props: CreateEditGameProps) => {
    const [name, setName] = React.useState<string>(props.game?.name ?? '');
    const isNewGame = props.game === undefined;
    const [canSaveGame, setCanSaveGame] = React.useState<boolean>(!isNewGame);
    const [loadingUsers, setLoadingUsers] = React.useState<boolean>(true);
    const [selectedUsers, setSelectedUsers] = React.useState<UserBeingAdded[]>([]);
    // const [refreshKey, setRefreshKey] = React.useState<number>(0);

    useEffect(() => {
        if (!loadingUsers) {
            return;
        }
        ApiManager.userApi.getUsers().then((users) => {
            const selectedUsers = users
                .reduce((arr, user) => {
                    if (user.id !== props.user.id) {
                        const player = props.game?.players.find((playerGame) => playerGame.user.id === user.id);
                        arr.push({
                            user,
                            role: player?.role,
                        });
                    }
                    return arr;
                }, [] as UserBeingAdded[])
                .sort((a, b) => a.user.name.localeCompare(b.user.name));
            setSelectedUsers(selectedUsers);
            setLoadingUsers(false);
        });
    }, [loadingUsers, props.game?.players, props.user.id]);

    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const canCreateGame = event.target.value !== '';
        setCanSaveGame(canCreateGame);
        setName(event.target.value);
    };

    const handleUserSelect = (index: number, user: UserDto, role?: GameRoles): void => {
        const newUsers = selectedUsers;
        newUsers[index] = { user, role };
        setSelectedUsers(newUsers);
    };

    const createOrEditGame = (): void => {
        const game: CreateGameDto = {
            name,
            players: selectedUsers
                .filter((user) => user.role !== undefined)
                .map((user) => ({
                    userId: user.user.id,
                    role: user.role!,
                })),
        };

        const callback = (game: GameDto) => {
            console.log('created game:', game);
            props.doneCreatingGame(game);
        };
        if (!props.game) {
            ApiManager.gameApi.createGame(game).then(callback);
        } else {
            ApiManager.gameApi.updateGame({ id: props.game.id, game }).then(callback);
        }
    };

    const centerText = isNewGame ? 'Create game' : `Editing  ${props.game!.name}`;
    return (
        <div className="flex-column moderate-gap full-width">
            <NavHeader
                leftText="← Cancel"
                leftOnClick={() => props.doneCreatingGame()}
                centerText={centerText}
                centerOnClick={createOrEditGame}
                rightText="Refresh users ↻"
                rightOnClick={() => setLoadingUsers(true)}
            />

            <input type="text" value={name} name="gameName" placeholder="Game name" onChange={handleNameChange}></input>

            {loadingUsers ? (
                <div>Loading users...</div>
            ) : (
                <div className="user-grid">
                    {selectedUsers.map((user, index) => (
                        <UserSelection key={user.user.id} user={user.user} gameRole={user.role} index={index} onSelect={handleUserSelect} />
                    ))}
                </div>
            )}
            <button
                type="button"
                name="createGame"
                value={`${isNewGame ? 'Create' : 'Save'} game`}
                onClick={createOrEditGame}
                disabled={!canSaveGame}
            >{`${isNewGame ? 'Create' : 'Save'} game`}</button>
        </div>
    );
};
