import { IntegrationServer, TagStreamChannel } from '@biketag/models';

import { AbstractApi } from './abstractApi';

export class IntegrationApi extends AbstractApi {
    constructor({ clientId }: { clientId: string }) {
        super({ clientId, logPrefix: '[IntegrationApi]' });
    }

    public async getDiscordGuilds(): Promise<IntegrationServer[]> {
        try {
            const resp = await this.axiosInstance.request<IntegrationServer[]>({
                method: 'get',
                url: `/integrations/discord/servers`,
            });
            if (resp.status !== 200) {
                throw new Error(`Unexpected response: ${resp.status} - ${resp.statusText}`);
            }
            this.logger.info('[getDiscordGuilds] got guilds', { data: resp.data });
            return resp.data;
        } catch (err) {
            this.logger.error(`[getDiscordGuilds] got an error response`, { err });
            throw err;
        }
    }

    public async getDiscordGuildChannels({ guildId }: { guildId: string }): Promise<TagStreamChannel[]> {
        try {
            const resp = await this.axiosInstance.request<TagStreamChannel[]>({
                method: 'get',
                url: `/integrations/discord/servers/${guildId}/channels`,
            });
            if (resp.status !== 200) {
                throw new Error(`Unexpected response: ${resp.status} - ${resp.statusText}`);
            }
            this.logger.info('[getDiscordGuildChannels] got channels', { data: resp.data });
            return resp.data;
        } catch (err) {
            this.logger.error(`[getDiscordGuildChannels] got an error response`, { err });
            throw err;
        }
    }
}
