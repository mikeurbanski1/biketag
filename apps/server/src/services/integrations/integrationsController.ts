import { Get, Path, Route, SuccessResponse } from 'tsoa';

import { IntegrationServer, IntegrationSource, IntegrationType, TagStreamChannel } from '@biketag/models';
import { Logger } from '@biketag/utils';

import { DiscordIntegrationService } from './services/discordIntegrationService';
import { getIntegrationService, getIntegrationSourcesByType, getTagStreamIntegrationService } from './services/serviceRouter';

const logger = new Logger({ prefix: '[IntegrationController]' });

@Route('integrations')
export class IntegrationController {
    @Get('/{integrationType}/sources')
    @SuccessResponse('200', 'ok')
    public async getIntegrationSources(@Path() integrationType: IntegrationType): Promise<IntegrationSource[]> {
        logger.info(`[getIntegrationSources]`, { integrationType });
        return getIntegrationSourcesByType(integrationType);
    }

    @Get('/{integrationType}/{source}/servers')
    @SuccessResponse('200', 'ok')
    public async getIntegrationServers(@Path() integrationType: IntegrationType, @Path() source: IntegrationSource): Promise<IntegrationServer[]> {
        logger.info(`[getIntegrationServers]`, { integrationType, source });
        const service = await getIntegrationService({ integrationType, source });
        const servers = await service.getServers();
        logger.info(`[getIntegrationServers] got servers`, { servers });
        return servers;
    }

    @Get('/tag-stream/{source}/servers/{serverId}/channels')
    @SuccessResponse('200', 'ok')
    public async getTagStreamChannels(@Path() source: IntegrationSource, @Path() serverId: string): Promise<TagStreamChannel[]> {
        logger.info(`[getTagStreamChannels]`, { source, serverId });
        const service = await getTagStreamIntegrationService(source);
        const channels = await service.getChannels({ serverId });
        return channels;
    }
}
