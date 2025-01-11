import { BaseEntityWithoutId, CreateUserSettingsParams, UserSettingsDto, UserSettingsEntity } from '@biketag/models';

import { userSettingsServiceErrors } from '../../common/errors';
import { UserSettingsDalService } from '../../dal/services/userSettingsDalService';
import { BaseService } from '../baseService';

export class UserSettingsService extends BaseService<UserSettingsDto, CreateUserSettingsParams, UserSettingsEntity, UserSettingsDalService> {
    constructor() {
        super({ prefix: 'UserSettingsService', dalService: new UserSettingsDalService(), serviceErrors: userSettingsServiceErrors });
    }

    protected convertToUpsertEntity(dto: CreateUserSettingsParams): Promise<Partial<BaseEntityWithoutId<UserSettingsEntity>>> {
        return Promise.resolve(dto);
    }
    protected convertToNewEntity(dto: UserSettingsDto & { id?: string }): Promise<UserSettingsEntity> {
        return Promise.resolve(dto);
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
        return this.create({ id: userId, starredGames: [] });
    }
}
