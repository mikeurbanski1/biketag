import { BaseEntity } from '.';

export interface UserEntity extends BaseEntity {
    name: string;
    lastSeenGames: { [gameId: string]: string };
}
