import { CreateUserSettingsParams, UserSettingsDto, UserSettingsEntity } from '@biketag/models';

import { userSettingsServiceErrors } from '../../common/errors';
import { UserSettingsDalService } from '../../dal/services/userSettingsDalService';
import { BaseService } from '../baseService';

export class UserSettingsService extends BaseService<UserSettingsDto, CreateUserSettingsParams, CreateUserSettingsParams, UserSettingsEntity, UserSettingsDalService> {
    constructor() {
        super({ prefix: 'UserSettingsService', dalService: new UserSettingsDalService(), serviceErrors: userSettingsServiceErrors });
    }

    protected convertToUpsertEntity(dto: CreateUserSettingsParams): Promise<Partial<Pick<UserSettingsEntity, 'starredGames'>>> {
        return Promise.resolve({ starredGames: dto.starredGames });
    }
    protected convertToNewEntity(dto: UserSettingsDto): Promise<Pick<UserSettingsEntity, 'starredGames'>> {
        return Promise.resolve({ starredGames: dto.starredGames });
    }
    protected convertToDto(entity: UserSettingsEntity | null, overrides?: Partial<UserSettingsDto> | undefined): Promise<UserSettingsDto | null> {
        if (!entity) {
            return Promise.resolve(null);
        }
        return Promise.resolve({
            id: entity.id,
            starredGames: entity.starredGames,
            ...overrides,
        });
    }

    public createDefault({ userId }: { userId: string }): Promise<UserSettingsDto> {
        return this.createWithId({ id: userId, starredGames: [] });
    }
}
