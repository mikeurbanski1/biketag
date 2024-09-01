export interface ServerPoll {
    pollId: string;
    startedByClientId: string;
    startedByName: string;
    prompt: string;
    votes: Vote[];
    hostPresent: boolean;
    maxVotes?: number;
    endTime?: number;
}

export interface ClientPoll {
    pollId: string;
    startedByName: string;
    prompt: string;
    numVotes: number;
    maxVotes?: number;
    endTime?: number;
    connectedClients: number;
    isHost: boolean;
    hostPresent: boolean;
}

export interface PollResults {
    pollId: string;
    prompt: string;
    result: number;
    votes: number[];
}

export interface Vote {
    voterClientId: string;
    voterName: string;
    value: number;
}
