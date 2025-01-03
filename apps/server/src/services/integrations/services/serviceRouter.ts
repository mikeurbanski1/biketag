import { IntegrationSource, IntegrationType } from '@biketag/models';

import { IntegrationInterface } from '../interfaces/commonIntegrationInterface';
import { TagStreamIntegrationInterface } from '../interfaces/tagStreamIntegrationInterface';
import { DiscordIntegrationService } from './discordIntegrationService';

export const getIntegrationService = async ({ integrationType, source }: { integrationType: IntegrationType; source: IntegrationSource }): Promise<IntegrationInterface> => {
    return await integrationTypeToGetterMap[integrationType](source);
};

export const getTagStreamIntegrationService = async (source: IntegrationSource): Promise<TagStreamIntegrationInterface> => {
    switch (source) {
        case IntegrationSource.DISCORD:
            return await DiscordIntegrationService.getInstance();
        default:
            throw new Error('Invalid integration source');
    }
};

export const getIntegrationSourcesByType = async (integrationType: IntegrationType): Promise<IntegrationSource[]> => {
    return integrationTypeToSourcesMap[integrationType];
};

const integrationTypeToGetterMap: Record<IntegrationType, (source: IntegrationSource) => Promise<IntegrationInterface>> = {
    [IntegrationType.TAG_STREAM]: getTagStreamIntegrationService,
};

const integrationTypeToSourcesMap: Record<IntegrationType, IntegrationSource[]> = {
    [IntegrationType.TAG_STREAM]: [IntegrationSource.DISCORD],
};
