import { PublicUserDto, UserEntity } from '@biketag/models';

import { userServiceErrors } from '../../common/errors';
import { UserDalService } from '../../dal/services/userDalService';
import { ReadOnlyBaseService } from '../baseService';

export class PublicUserService extends ReadOnlyBaseService<PublicUserDto, UserEntity, UserDalService> {
    constructor() {
        super({ prefix: 'UserService', dalService: new UserDalService(), serviceErrors: userServiceErrors });
    }

    protected async convertToDto(entity: UserEntity | null): Promise<PublicUserDto | null> {
        return entity;
    }

    public async getUserByName({ name: nameToSearch }: { name: string }): Promise<PublicUserDto | null> {
        const res = await this.dalService.findOne({ filter: { nameToSearch } });
        this.logger.info(`[getUserByName] result`, { res });
        return res ? { id: res.id, name: res.name } : null;
    }
}
