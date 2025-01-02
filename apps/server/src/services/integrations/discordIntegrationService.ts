import { ChannelType, Client, Collection, Events, GuildBasedChannel, NonThreadGuildBasedChannel, OAuth2Guild, Snowflake, TextChannel } from 'discord.js';
import { O } from 'vitest/dist/chunks/environment.LoooBwUu';

import { DiscordChannelDto, DiscordGuildDto } from '@biketag/models';
import { Logger } from '@biketag/utils';

export class DiscordIntegrationService {
    private static instance: DiscordIntegrationService | undefined;
    private readonly logger = new Logger({ prefix: '[DiscordIntegration]' });
    private readonly client: Client;
    private readonly token: string;

    constructor() {
        this.client = new Client({ intents: ['Guilds'] });
        this.token = process.env.DISCORD_APP_TOKEN!;
        this.client.once(Events.ClientReady, (readyClient) => {
            console.log(`Ready! Logged in as ${readyClient.user.tag}`);
        });
    }

    public static async getInstance(): Promise<DiscordIntegrationService> {
        if (!DiscordIntegrationService.instance) {
            const logger = new Logger({ prefix: '[DiscordIntegration]' });
            logger.info(`[getInstance] - initializing new instance`);
            DiscordIntegrationService.instance = new DiscordIntegrationService();
            await DiscordIntegrationService.instance.init();
        }
        return DiscordIntegrationService.instance;
    }

    public async init(): Promise<void> {
        this.logger.info(`[init]`);
        await this.client.login(this.token);
    }

    public async getGuilds(): Promise<DiscordGuildDto[]> {
        const guilds = await this.client.guilds.fetch();
        this.logger.info(`[getGuilds]`, { guilds: guilds });
        return guilds.map((guild) => ({
            id: guild.id,
            name: guild.name,
        }));
    }

    public async getChannels({ guildId }: { guildId: string }): Promise<DiscordChannelDto[]> {
        const guild = await this.client.guilds.fetch(guildId);
        const channels = await guild.channels.fetch();
        this.logger.info(`[getChannels]`, { channels });
        return channels
            .filter((channel) => channel && channel.type === ChannelType.GuildText)
            .map((channel) => ({
                id: channel!.id,
                name: channel!.name,
            }));
    }

    public async sendMessage({ message, channelId }: { message: string; channelId: string }) {
        const channel = (await this.client.channels.fetch(channelId)) as TextChannel;
        await channel.send(message);
    }
}
