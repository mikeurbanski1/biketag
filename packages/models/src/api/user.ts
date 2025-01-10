import { BaseDto } from '.';

export interface PublicUserDto extends BaseDto {
    name: string;
}

export interface PrivateUserDto extends PublicUserDto {
    lastSeenGames: { [gameId: string]: string };
}

export type CreateUserParams = {
    name: string;
};
