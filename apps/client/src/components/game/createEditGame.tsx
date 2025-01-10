import React, { useContext, useEffect } from 'react';

import '../../styles/createEditGame.css';

import { CreateGameDto, GameDto, GameRoles, IntegrationServer, IntegrationSource, IntegrationType, PublicUserDto, TagStreamChannel } from '@biketag/models';
import { Logger } from '@biketag/utils';

import { ApiManager } from '../../api';
import { UserBeingAdded } from '../../models/user';
import { UserContext } from '../common/context';
import { NavHeader } from '../common/navHeader';
import { Select } from '../common/select';
import UserSelection from '../userSelection';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const logger = new Logger({ prefix: '[CreateEditGame]' });

interface CreateEditGameProps {
    game?: GameDto;
    doneCreatingGame: (game?: GameDto) => void;
}

type IntegrationOrNone = IntegrationSource | 'None';

const noSource = 'None';

const integrationSourceToNameOrId = (source: IntegrationSource): string => source;

const integrationServerToId = (server: IntegrationServer): string => server.id;
const integrationServerToName = (server: IntegrationServer): string => server.name;

const integrationChannelToId = (channel: TagStreamChannel): string => channel.id;
const integrationChannelToName = (channel: TagStreamChannel): string => channel.name;

export const CreateEditGame: React.FC<CreateEditGameProps> = (props: CreateEditGameProps) => {
    const { tagStreamIntegration } = props.game ?? {};
    const user = useContext(UserContext)!;

    const [name, setName] = React.useState<string>(props.game?.name ?? '');

    const [tagStreamIntegrationSource, setTagStreamIntegrationSource] = React.useState<IntegrationSource | undefined>(undefined);
    const [serverId, setServerId] = React.useState<string>(tagStreamIntegration?.serverId ?? '');
    const [channelId, setChannelId] = React.useState<string>(tagStreamIntegration?.channelId ?? '');
    const [integrationSources, setIntegrationSources] = React.useState<IntegrationSource[]>([]);
    const [servers, setServers] = React.useState<IntegrationServer[] | undefined>(undefined);
    const [channels, setChannels] = React.useState<TagStreamChannel[] | undefined>(undefined);
    const [loadingUsers, setLoadingUsers] = React.useState<boolean>(true);
    const [selectedUsers, setSelectedUsers] = React.useState<UserBeingAdded[]>([]);
    // const [refreshKey, setRefreshKey] = React.useState<number>(0);

    const isNewGame = props.game === undefined;

    useEffect(() => {
        if (!loadingUsers) {
            return;
        }
        ApiManager.userApi.getUsers().then((users) => {
            const selectedUsers = users
                .reduce((arr, user) => {
                    if (user.id !== user.id) {
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
    }, [loadingUsers, props.game?.players, user.id]);

    useEffect(() => {
        ApiManager.integrationApi.getIntegrationSources(IntegrationType.TAG_STREAM).then((sources) => {
            setIntegrationSources(sources);
        });
    }, []);

    useEffect(() => {
        if (!tagStreamIntegrationSource) {
            setServers(undefined);
        } else {
            ApiManager.integrationApi.getServers({ integrationType: IntegrationType.TAG_STREAM, source: tagStreamIntegrationSource }).then((guilds) => {
                setServers(guilds);
            });
        }
    }, [tagStreamIntegrationSource]);

    useEffect(() => {
        if (!tagStreamIntegrationSource || !serverId) {
            setChannels(undefined);
            return;
        }
        ApiManager.integrationApi.getTagStreamChannels({ source: tagStreamIntegrationSource, serverId: serverId }).then((channels) => {
            setChannels(channels);
        });
    }, [tagStreamIntegrationSource, serverId]);

    const handleUserSelect = (index: number, user: PublicUserDto, role?: GameRoles): void => {
        const newUsers = selectedUsers;
        newUsers[index] = { user, role };
        setSelectedUsers(newUsers);
    };

    const createOrEditGame = (): void => {
        const tagStreamIntegration = tagStreamIntegrationSource
            ? {
                  source: tagStreamIntegrationSource,
                  serverId,
                  channelId,
              }
            : undefined;

        const game: CreateGameDto = {
            name,
            players: selectedUsers
                .filter((user) => user.role !== undefined)
                .map((user) => ({
                    userId: user.user.id,
                    role: user.role!,
                })),
            tagStreamIntegration,
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

    const changeIntegrationSource = (event: React.ChangeEvent<HTMLSelectElement>): void => {
        const value = event.target.value as IntegrationOrNone;
        const newValue = value === noSource ? undefined : value;
        setTagStreamIntegrationSource(newValue);
    };

    const changeDiscordServer = (event: React.ChangeEvent<HTMLSelectElement>): void => {
        setServerId(event.target.value);
    };

    const changeDiscordChannel = (event: React.ChangeEvent<HTMLSelectElement>): void => {
        setChannelId(event.target.value);
    };

    const centerText = isNewGame ? 'Create game' : `Editing  ${props.game!.name}`;

    const canSaveGame = (name.length > 0 && !tagStreamIntegrationSource) || (tagStreamIntegrationSource && serverId.length > 0 && channelId.length > 0);

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

            <input type="text" value={name} name="gameName" placeholder="Game name" onChange={(event) => setName(event.target.value)}></input>

            <Select<IntegrationSource>
                value={tagStreamIntegrationSource}
                onChange={changeIntegrationSource}
                toId={integrationSourceToNameOrId}
                toName={integrationSourceToNameOrId}
                noSelectionText={noSource}
                options={integrationSources}
                loadingText="Loading tag stream integrations..."
                placeholderText="Select tag stream integration"
            />

            <Select<IntegrationServer>
                value={serverId}
                onChange={changeDiscordServer}
                toId={integrationServerToId}
                toName={integrationServerToName}
                options={servers}
                loadingText="Loading servers..."
                placeholderText="Select a server"
                hidden={tagStreamIntegrationSource === undefined}
            />

            <Select<TagStreamChannel>
                value={channelId}
                onChange={changeDiscordChannel}
                toId={integrationChannelToId}
                toName={integrationChannelToName}
                options={channels}
                loadingText="Loading channels..."
                placeholderText="Select a channel"
                hidden={tagStreamIntegrationSource === undefined || serverId === ''}
            />

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
