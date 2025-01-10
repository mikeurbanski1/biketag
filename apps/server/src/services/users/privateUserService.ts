import { BaseEntityWithoutId, CreateUserParams, PrivateUserDto, UserEntity } from '@biketag/models';

import { userServiceErrors } from '../../common/errors';
import { UserDalService } from '../../dal/services/userDalService';
import { BaseService } from '../baseService';
import { UserSettingsService } from '../userSettings/userSettingsService';

export class PrivateUserService extends BaseService<PrivateUserDto, BaseEntityWithoutId<UserEntity>, BaseEntityWithoutId<UserEntity>, UserEntity, UserDalService> {
    private readonly userSettingsService: UserSettingsService;
    constructor() {
        super({ prefix: 'UserService', dalService: new UserDalService(), serviceErrors: userServiceErrors });
        this.userSettingsService = new UserSettingsService();
    }

    protected convertToUpsertEntity(dto: CreateUserParams): Promise<CreateUserParams> {
        return Promise.resolve(dto);
    }

    protected convertToNewEntity(dto: CreateUserParams): Promise<BaseEntityWithoutId<UserEntity>> {
        return Promise.resolve({ ...dto, lastSeenGames: {} });
    }

    protected async convertToDto(entity: UserEntity | null): Promise<PrivateUserDto | null> {
        return entity;
    }

    public override async create({ name }: CreateUserParams): Promise<PrivateUserDto> {
        const resp = await super.create({ name, lastSeenGames: {} });
        await this.userSettingsService.createDefault({ userId: resp.id });
        return resp as PrivateUserDto;
    }

    public override async update({ id, updateParams }: { id: string; updateParams: BaseEntityWithoutId<UserEntity> }): Promise<PrivateUserDto> {
        throw new Error('Must use individual attribute update methods');
    }

    public async getUserByName({ name }: { name: string }): Promise<PrivateUserDto | null> {
        const res = await this.dalService.findOne({ filter: { name } });
        this.logger.info(`[getUserByName] result`, { res });
        return res;
    }
}
