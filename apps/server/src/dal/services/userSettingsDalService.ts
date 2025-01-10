import { UserEntity, UserSettingsEntity } from '@biketag/models';

import { userServiceErrors } from '../../common/errors';
import { BaseDalService } from './baseDalService';

export class UserSettingsDalService extends BaseDalService<UserSettingsEntity> {
    constructor() {
        super({ prefix: 'UserSettingsDalService', collectionName: 'user_settings', serviceErrors: userServiceErrors });
    }
}
