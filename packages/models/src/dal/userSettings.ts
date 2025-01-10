import { BaseEntity } from '.';

export interface UserSettingsEntity extends BaseEntity {
    starredGames: string[];
}
