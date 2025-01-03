import { Get, Path, Route, SuccessResponse } from 'tsoa';

import { DiscordGuildDto } from '@biketag/models';
import { Logger } from '@biketag/utils';

import { DiscordIntegrationService } from './services/discordIntegrationService';

const logger = new Logger({ prefix: '[GameController]' });

@Route('integrations')
export class IntegrationController {
    @Get('/discord/guilds')
    @SuccessResponse('200', 'ok')
    public async getDiscordGuilds(): Promise<DiscordGuildDto[]> {
        logger.info(`[getDiscordGuilds]`);
        const discordService = await DiscordIntegrationService.getInstance();
        const guilds = await discordService.getGuilds();
        logger.info(`[getDiscordGuilds] got guilds`, { guilds });
        return guilds.sort((a, b) => a.name.localeCompare(b.name));
    }

    @Get('/discord/guilds/{guildId}/channels')
    @SuccessResponse('200', 'ok')
    public async getDiscordGuildChannels(@Path() guildId: string): Promise<DiscordGuildDto[]> {
        logger.info(`[getDiscordGuildChannels]`);
        const discordService = await DiscordIntegrationService.getInstance();
        const channels = await discordService.getChannels({ guildId });
        return channels.sort((a, b) => a.name.localeCompare(b.name));
    }
}
