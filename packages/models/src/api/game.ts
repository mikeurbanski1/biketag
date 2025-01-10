import { BaseDto, TagDto } from '.';
import { GameScore, TagStreamIntegration } from '../common';
import { GameRoles, PlayerGame, PlayerGameDto } from '../common/game';
import { PublicUserDto } from './user';

export interface GameDto extends BaseDto {
    id: string;
    name: string;
    creator: PublicUserDto;
    createdDate: string;
    players: PlayerGameDto[];
    firstRootTag?: TagDto;
    latestRootTag?: TagDto;
    pendingRootTag?: TagDto;
    gameScore: GameScore;
    tagStreamIntegration?: TagStreamIntegration;
}

export interface GameDtoWithPendingTagOwner extends GameDto {
    ownerPendingTag: TagDto;
}

export type GameSummary = Pick<GameDto, 'id' | 'name' | 'creator' | 'createdDate'> & { latestRootTagImageUrl?: string; lastActivityDate: string };

export interface CreateGameDto {
    name: string;
    players: PlayerGame[];
    firstRootTagId?: string;
    latestRootTagId?: string;
    tagStreamIntegration?: TagStreamIntegration;
    createdDateOverride?: string;
}

export interface CreateGameParams extends CreateGameDto {
    creatorId: string;
}

export interface RoleDto {
    role: GameRoles;
}

export type AddPlayerInGameParams = RoleDto;
