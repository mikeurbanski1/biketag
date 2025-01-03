import { TagStreamChannel, TagStreamServer } from '@biketag/models';

import { AbstractApi } from './abstractApi';

export class IntegrationApi extends AbstractApi {
    constructor({ clientId }: { clientId: string }) {
        super({ clientId, logPrefix: '[IntegrationApi]' });
    }

    public async getDiscordGuilds(): Promise<TagStreamServer[]> {
        try {
            const resp = await this.axiosInstance.request<TagStreamServer[]>({
                method: 'get',
                url: `/integrations/discord/guilds`,
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
                url: `/integrations/discord/guilds/${guildId}/channels`,
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
