import { TagStreamChannel, TagStreamMessage, TagStreamServer } from '@biketag/models';

export interface TagStreamIntegrationInterface {
    init(): Promise<void>;
    getServers(): Promise<TagStreamServer[]>;
    getChannels({ serverId }: { serverId: string }): Promise<TagStreamChannel[]>;
    sendMessage({ content, channelId, replyTo }: { content: string; channelId: string; replyTo?: string }): Promise<string>;
    getMessages({ channelId }: { channelId: string }): Promise<TagStreamMessage[]>;
    deleteMessage({ channelId, messageId }: { channelId: string; messageId: string }): Promise<void>;
}
