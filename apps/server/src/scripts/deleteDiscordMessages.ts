import * as dotenv from 'dotenv';

import { Logger } from '@biketag/utils';

import { DiscordIntegrationService } from '../services/integrations/services/discordIntegrationService';

const logger = new Logger({ prefix: '[DeleteDiscordMessages]' });

dotenv.config();

const run = async () => {
    const discordService = await DiscordIntegrationService.getInstance();
    const guildId = '1324105214868983839';
    const channelNames = ['general', 'bike-tag-jenny', 'bike-tag-mike', 'bike-tag-katie'];

    const channels = await discordService.getChannels({ serverId: guildId });
    for (const channel of channels) {
        logger.info(`[run] processing channel ${channel.name}`);
        if (channelNames.includes(channel.name)) {
            const messages = await discordService.getMessages({ channelId: channel.id });
            logger.info(`[run] got messages`, { count: messages.length });
            for (const message of messages) {
                await discordService.deleteMessage({ channelId: channel.id, messageId: message.id });
            }
        }
    }
};

run()
    .then(() => {
        logger.info('Finished');
    })
    .catch((err) => {
        logger.error(`An error occurred deleting messages ${err}`);
    })
    .finally(() => {
        DiscordIntegrationService.close();
    });
