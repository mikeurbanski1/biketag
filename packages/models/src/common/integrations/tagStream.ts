import { IntegrationServer } from './common';
import { IntegrationSource } from './enum';

export interface TagStreamIntegration {
    source: IntegrationSource;
    serverId: string;
    channelId: string;
}

export interface TagStreamChannel {
    id: string;
    name: string;
    serverId: string;
}

export interface TagStreamMessage {
    id: string;
    content: string;
    channelId: string;
    replyTo?: string;
}
