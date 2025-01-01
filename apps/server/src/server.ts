import * as dotenv from 'dotenv';

import { Logger } from '@biketag/utils';

import { app } from './app';
import { initializePersistence } from './dal/persistenceService';
import { DiscordIntegration } from './integrations/photoStream/discordIntegration';
import { QueueManager } from './queue/manager';

// import { UsersService } from './users/usersService';
// import { GamesService } from './games/gamesService';
// import { GameRoles } from '@biketag/models';

const port = process.env.PORT || 3001;

const logger = new Logger({ prefix: '[Server]' });

dotenv.config();

logger.info(`Starting server`);

initializePersistence().then(() => {
    logger.info('Initialized persistence');
    app.listen(port, () => {
        logger.info(`Example app listening at http://localhost:${port}`);
        QueueManager.getInstance();
        logger.info(`Initialized queue manager`);
        DiscordIntegration.getInstance({ guildId: '1324105214868983839', channelName: 'general' }).then(() => {
            logger.info(`Initialized discord integration`);
        });
    });
});
