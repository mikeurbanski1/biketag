import { IntegrationSource } from '@biketag/models';

import { IntegrationInterface } from '../interfaces/commonIntegrationInterface';
import { TagStreamIntegrationInterface } from '../interfaces/tagStreamIntegrationInterface';
import { DiscordIntegrationService } from './discordIntegrationService';

export const getIntegrationService = async (source: IntegrationSource): Promise<IntegrationInterface> => {
    switch (source) {
        case IntegrationSource.DISCORD:
            return await DiscordIntegrationService.getInstance();
        default:
            throw new Error('Invalid integration source');
    }
};

export const getTagStreamIntegrationService = async (source: IntegrationSource): Promise<TagStreamIntegrationInterface> => {
    switch (source) {
        case IntegrationSource.DISCORD:
            return await DiscordIntegrationService.getInstance();
        default:
            throw new Error('Invalid integration source');
    }
};
