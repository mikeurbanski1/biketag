import { BaseDto } from '.';

export interface UserSettingsDto extends BaseDto {
    starredGames: string[];
}

export type CreateUserSettingsParams = Omit<UserSettingsDto, 'id'>;
