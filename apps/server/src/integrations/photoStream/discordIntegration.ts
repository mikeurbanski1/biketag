import { Client, Events, Guild, TextChannel } from 'discord.js';

import { Logger } from '@biketag/utils';

import { DiscordConfig } from './models';

export class DiscordIntegration {
    private static instance: DiscordIntegration | undefined;
    private readonly logger = new Logger({ prefix: '[DiscordIntegration]' });
    private readonly client: Client;
    private readonly token: string;
    private readonly config: DiscordConfig;
    private guild: Guild | undefined;
    private channel: TextChannel | undefined;

    constructor({ config }: { config: DiscordConfig }) {
        this.client = new Client({ intents: ['Guilds'] });
        this.token = process.env.DISCORD_APP_TOKEN!;
        this.config = config;
        this.client.once(Events.ClientReady, (readyClient) => {
            console.log(`Ready! Logged in as ${readyClient.user.tag}`);
        });
    }

    public static async getInstance(config?: DiscordConfig): Promise<DiscordIntegration> {
        if (!DiscordIntegration.instance) {
            if (!config) {
                throw new Error('Config must be provided on first call to getInstance');
            }
            const logger = new Logger({ prefix: '[DiscordIntegration]' });
            logger.info(`[getInstance] - initializing new instance`);
            DiscordIntegration.instance = new DiscordIntegration({ config });
            await DiscordIntegration.instance.init();
        }
        return DiscordIntegration.instance;
    }

    public async init(): Promise<void> {
        this.client.login(this.token);
        this.guild = await this.client.guilds.fetch(this.config.guildId);
        const channels = await this.guild.channels.fetch();
        const channel = channels.find((c) => c?.name === this.config.channelName);
        if (!channel) {
            throw new Error(`Channel ${this.config.channelName} not found`);
        }
        this.channel = channel as TextChannel;

        this.logger.info(`[init]`, { guild: this.guild, channel: this.channel });
    }

    public async sendMessage({ message }: { message: string }) {
        await this.channel!.send(message);
    }
}
