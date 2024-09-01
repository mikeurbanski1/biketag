export enum WebsocketMessageType {
    GREETING,
    NEW_POLL_STARTED,
    NEW_POLL_SERVER_TO_CLIENT,
    JOIN_POLL,
    POLL_UPDATED,
    POLL_INVALID,
    VOTE,
    POLL_COMPLETED,
    CHANGE_MAX_VOTES,
    CHANGE_MAX_VOTES_CLIENT,
    END_POLL
}

export interface WebsocketMessage {
    messageType: WebsocketMessageType;
}

export interface GreetingMessage extends WebsocketMessage {
    messageType: WebsocketMessageType.GREETING;
    clientId: string;
}

export interface NewPollStartedMessage extends WebsocketMessage {
    messageType: WebsocketMessageType.NEW_POLL_STARTED;
    clientId: string;
    name: string;
    prompt: string;
    maxVotes?: number;
    endTime?: number;
}

export interface ChangeMaxVotesMessage extends WebsocketMessage {
    messageType: WebsocketMessageType.CHANGE_MAX_VOTES;
    pollId: string;
    clientId: string;
    newVoteMax: number;
}

export interface ChangeMaxVotesClientMessage extends WebsocketMessage {
    messageType: WebsocketMessageType.CHANGE_MAX_VOTES_CLIENT;
    pollId: string;
    newVoteMax: number;
}

export interface EndPollMessage extends WebsocketMessage {
    messageType: WebsocketMessageType.END_POLL;
    pollId: string;
    clientId: string;
}

export interface NewPollServerToClientMessage {
    messageType: WebsocketMessageType.NEW_POLL_SERVER_TO_CLIENT;
    pollId: string;
    currentVotes: number;
    connectedClients: number;
    name: string;
    prompt: string;
    maxVotes?: number;
    isHost: boolean;
    hostPresent: boolean;
    previousVote?: number;
    endTime?: number;
}

export interface JoinPollMessage extends WebsocketMessage {
    messageType: WebsocketMessageType.JOIN_POLL;
    clientId: string;
    name: string;
    pollId: string;
}

export interface PollUpdatedMessage extends WebsocketMessage {
    messageType: WebsocketMessageType.POLL_UPDATED;
    pollId?: string;
    currentVotes?: number;
    connectedClients?: number;
    maxVotes?: number;
    hostPresent: boolean;
}

export interface PollInvalidMessage extends WebsocketMessage {
    messageType: WebsocketMessageType.POLL_INVALID;
    pollId: string;
}

export interface VoteMessage extends WebsocketMessage {
    messageType: WebsocketMessageType.VOTE;
    clientId: string;
    pollId: string;
    value: number;
    name: string;
}

export interface PollCompletedMessage extends WebsocketMessage {
    messageType: WebsocketMessageType.POLL_COMPLETED;
    pollId: string;
    prompt: string;
    result: number;
    votes: number[];
}
