import { IntegrationServer, IntegrationSource, IntegrationType, TagStreamChannel } from '@biketag/models';

import { AbstractApi } from './abstractApi';

export class IntegrationApi extends AbstractApi {
    constructor({ clientId }: { clientId: string }) {
        super({ clientId, logPrefix: '[IntegrationApi]' });
    }

    public async getIntegrationSources(integrationType: IntegrationType): Promise<IntegrationSource[]> {
        try {
            const resp = await this.axiosInstance.request<IntegrationSource[]>({
                method: 'get',
                url: `/integrations/${integrationType}/sources`,
            });
            if (resp.status !== 200) {
                throw new Error(`Unexpected response: ${resp.status} - ${resp.statusText}`);
            }
            this.logger.info('[getIntegrationSources] got sources', { data: resp.data });
            return resp.data;
        } catch (err) {
            this.logger.error(`[getIntegrationSources] got an error response`, { err });
            throw err;
        }
    }

    public async getServers({ integrationType, source }: { integrationType: IntegrationType; source: IntegrationSource }): Promise<IntegrationServer[]> {
        try {
            const resp = await this.axiosInstance.request<IntegrationServer[]>({
                method: 'get',
                url: `/integrations/${integrationType}/${source}/servers`,
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

    public async getTagStreamChannels({ source, serverId }: { source: IntegrationSource; serverId: string }): Promise<TagStreamChannel[]> {
        try {
            const resp = await this.axiosInstance.request<TagStreamChannel[]>({
                method: 'get',
                url: `/integrations/tag-stream/${source}/servers/${serverId}/channels`,
            });
            if (resp.status !== 200) {
                throw new Error(`Unexpected response: ${resp.status} - ${resp.statusText}`);
            }
            this.logger.info('[getTagStreamChannels] got channels', { data: resp.data });
            return resp.data;
        } catch (err) {
            this.logger.error(`[getTagStreamChannels] got an error response`, { err });
            throw err;
        }
    }
}
