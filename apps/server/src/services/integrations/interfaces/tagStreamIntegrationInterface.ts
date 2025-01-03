import { IntegrationServer, TagStreamChannel, TagStreamMessage } from '@biketag/models';

import { IntegrationInterface } from './commonIntegrationInterface';

export interface TagStreamIntegrationInterface extends IntegrationInterface {
    init(): Promise<void>;
    getChannels({ serverId }: { serverId: string }): Promise<TagStreamChannel[]>;
    sendMessage({ content, channelId, replyTo }: { content: string; channelId: string; replyTo?: string }): Promise<string>;
    getMessages({ channelId }: { channelId: string }): Promise<TagStreamMessage[]>;
    deleteMessage({ channelId, messageId }: { channelId: string; messageId: string }): Promise<void>;
}
