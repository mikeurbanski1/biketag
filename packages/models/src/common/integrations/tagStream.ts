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
