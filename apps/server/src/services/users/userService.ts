import { CreateUserParams, UserDto, UserEntity } from '@biketag/models';

import { userServiceErrors } from '../../common/errors';
import { UserDalService } from '../../dal/services/userDalService';
import { BaseService } from '../baseService';
import { UserSettingsService } from '../userSettings/userSettingsService';

export class UserService extends BaseService<UserDto, CreateUserParams, UserEntity, UserDalService> {
    private readonly userSettingsService: UserSettingsService;
    constructor() {
        super({ prefix: 'UserService', dalService: new UserDalService(), serviceErrors: userServiceErrors });
        this.userSettingsService = new UserSettingsService();
    }

    protected convertToUpsertEntity(dto: CreateUserParams): Promise<CreateUserParams> {
        return Promise.resolve(dto);
    }

    protected convertToNewEntity(dto: CreateUserParams): Promise<CreateUserParams> {
        return Promise.resolve(dto);
    }

    protected async convertToDtoList(entity: UserEntity[]): Promise<UserDto[]> {
        return (await Promise.all(entity.map((e) => this.convertToDto(e)))) as UserDto[];
    }

    protected async convertToDto(entity: UserEntity | null): Promise<UserDto | null> {
        if (!entity) {
            return null;
        }
        return {
            id: entity.id,
            name: entity.name,
        };
    }

    public override async create({ name }: CreateUserParams): Promise<UserDto> {
        const resp = await super.create({ name });
        await this.userSettingsService.createDefault({ userId: resp.id });
        return resp;
    }

    public async getUserByName({ name }: { name: string }): Promise<UserEntity | null> {
        const res = await this.dalService.findOne({ filter: { name } });
        this.logger.info(`[getUserByName] result`, { res });
        return res;
    }
}
