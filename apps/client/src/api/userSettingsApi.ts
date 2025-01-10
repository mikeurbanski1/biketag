import { CreateUserSettingsParams, UserSettingsDto } from '@biketag/models';

import { AbstractApi } from './abstractApi';

export class UserSettingsApi extends AbstractApi {
    constructor({ clientId }: { clientId: string }) {
        super({ clientId, logPrefix: '[UserSettingsApi]' });
    }

    public async getUserSettings(): Promise<UserSettingsDto> {
        try {
            const resp = await this.axiosInstance.request<UserSettingsDto>({
                method: 'get',
                url: '/settings/user',
            });
            if (resp.status !== 200) {
                throw new Error(`Unexpected response: ${resp.status} - ${resp.statusText}`);
            }
            this.logger.info('[getUserSettings] got user settings', { data: resp.data });
            return resp.data;
        } catch (err) {
            this.logger.error(`[getUserSettings] got an error response`, { err });
            throw err;
        }
    }

    public async updateUserSettings(updateParams: CreateUserSettingsParams): Promise<UserSettingsDto> {
        try {
            const resp = await this.axiosInstance.request<UserSettingsDto>({
                method: 'put',
                url: '/settings/user',
                data: updateParams,
            });
            if (resp.status !== 200) {
                throw new Error(`Unexpected response: ${resp.status} - ${resp.statusText}`);
            }
            this.logger.info('[updateUserSettings] set user settings', { data: resp.data });
            return resp.data;
        } catch (err) {
            this.logger.error(`[updateUserSettings] got an error response`, { err });
            throw err;
        }
    }
}
