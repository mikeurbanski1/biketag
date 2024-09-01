// src/server.ts
import { app } from './app';
import { WebSocket } from 'ws';
import {
    GreetingMessage,
    JoinPollMessage,
    NewPollServerToClientMessage,
    NewPollStartedMessage,
    ServerPoll,
    PollInvalidMessage,
    PollCompletedMessage,
    PollUpdatedMessage,
    VoteMessage,
    WebsocketMessage,
    WebsocketMessageType,
    ChangeMaxVotesMessage,
    ChangeMaxVotesClientMessage,
    EndPollMessage
} from '@biketag/models';
import { mapToRecord, shuffleArray } from '@biketag/utils';
import { IncomingMessage } from 'http';

const port = process.env.PORT || 3001;

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));

const wss = new WebSocket.Server({ host: 'localhost', port: 3002 }, () => console.log('Websocket server listening'));

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWZYX0123456789';
const POLL_ID_LEN = 3;

const clients: Map<string, WebSocket> = new Map();
const polls: Map<string, ServerPoll> = new Map();
const pollClients: Map<string, Map<string, WebSocket>> = new Map();
const clientPolls: Map<string, ServerPoll> = new Map();

const generatePollId = (): string => {
    let id = CHARS.charAt(Math.floor(Math.random() * CHARS.length));

    while (id.length < POLL_ID_LEN) {
        id += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
    }

    while (polls.has(id)) {
        console.log('Hit a poll ID clash:', id);
        id = generatePollId();
    }

    return id;
};

const checkClientId = (actual: string, expected: string): void => {
    if (actual !== expected) {
        throw Error(`Got mismatched client IDs in request. Actual: ${actual}; expected: ${expected}`);
    }
};

const checkSocket = (clientId: string): void => {
    if (!clients.has(clientId)) {
        throw Error(`Client ID ${clientId} does not exist in clients map`);
    }
};

const setEndPollTimer = (poll: ServerPoll, waitTime: number) => {
    const endTimeForLog = new Date(new Date().getTime() + waitTime);
    console.log(`Ending poll ${poll.pollId} in ${waitTime} ms - absolute: ${endTimeForLog}`);
    setTimeout(() => {
        endPoll(poll, pollClients.get(poll.pollId)!);
    }, waitTime);
};

const handleNewPollMessage = (message: NewPollStartedMessage, clientId: string) => {
    console.log(`Got a new poll message started by ${message.name} (${clientId}): ${message.prompt}`);
    checkClientId(message.clientId, clientId);
    checkSocket(clientId);

    const socket = clients.get(clientId);
    if (!socket) {
        throw new Error(`Could not find socket for client ID ${clientId}`);
    }

    const pollId = generatePollId();
    console.log('New poll ID:', pollId);

    const poll: ServerPoll = {
        pollId,
        startedByClientId: clientId,
        startedByName: message.name,
        prompt: message.prompt,
        maxVotes: message.maxVotes,
        votes: [],
        hostPresent: true,
        endTime: message.endTime
    };

    console.log('Created new poll:', poll);
    polls.set(pollId, poll);

    const pollClientMap: Map<string, WebSocket> = new Map();
    pollClientMap.set(clientId, socket);

    pollClients.set(pollId, pollClientMap);
    clientPolls.set(clientId, poll);

    console.log('Saved poll for client', JSON.stringify(mapToRecord(clientPolls)));

    if (poll.endTime) {
        console.log('Triggering end poll timer', poll.endTime);
        setEndPollTimer(poll, poll.endTime - new Date().getTime());
    }

    const messageToSend: NewPollServerToClientMessage = {
        messageType: WebsocketMessageType.NEW_POLL_SERVER_TO_CLIENT,
        pollId,
        name: message.name,
        prompt: message.prompt,
        currentVotes: 0,
        connectedClients: 1,
        maxVotes: poll.maxVotes,
        isHost: true,
        hostPresent: true,
        endTime: message.endTime
    };
    const messageStr = JSON.stringify(messageToSend);
    socket.send(messageStr);
    console.log('Started poll and sent to initiator');
};

const handleJoinPollMessage = (message: JoinPollMessage, clientId: string) => {
    console.log(`Got a join poll message started from ${message.name} (${clientId}): ${message.pollId}`);
    checkClientId(message.clientId, clientId);
    checkSocket(clientId);

    const poll = polls.get(message.pollId);
    const socket = clients.get(clientId)!;

    if (!poll) {
        console.log(`Poll ${message.pollId} does not exist`);
        const messageToSend: PollInvalidMessage = {
            messageType: WebsocketMessageType.POLL_INVALID,
            pollId: message.pollId
        };
        const messageStr = JSON.stringify(messageToSend);
        clients.get(clientId)!.send(messageStr);
    } else {
        const thisPollClients = pollClients.get(poll.pollId)!;
        thisPollClients.set(clientId, socket);
        clientPolls.set(clientId, poll);
        console.log('Saved poll for client', JSON.stringify(mapToRecord(clientPolls)));
        const messageToSend: PollUpdatedMessage = {
            messageType: WebsocketMessageType.POLL_UPDATED,
            pollId: message.pollId,
            connectedClients: thisPollClients.size,
            hostPresent: poll.hostPresent
        };
        const messageStr = JSON.stringify(messageToSend);

        const messageForJoiner: NewPollServerToClientMessage = {
            messageType: WebsocketMessageType.NEW_POLL_SERVER_TO_CLIENT,
            pollId: poll.pollId,
            name: poll.startedByName,
            prompt: poll.prompt,
            currentVotes: poll.votes.length,
            connectedClients: thisPollClients.size,
            maxVotes: poll.maxVotes,
            isHost: false,
            hostPresent: poll.hostPresent,
            endTime: poll.endTime
        };
        const messageForJoinerStr = JSON.stringify(messageForJoiner);

        thisPollClients.forEach((client) => (client === socket ? client.send(messageForJoinerStr) : client.send(messageStr)));
    }
};

const endPoll = (poll: ServerPoll, pollClients: Map<string, WebSocket>) => {
    const result = poll.votes.reduce((sum, cur) => sum + cur.value, 0) / poll.votes.length;
    const messageToSend: PollCompletedMessage = {
        messageType: WebsocketMessageType.POLL_COMPLETED,
        pollId: poll.pollId,
        prompt: poll.prompt,
        result,
        votes: shuffleArray(poll.votes.map((v) => v.value))
    };
    const messageStr = JSON.stringify(messageToSend);
    pollClients.forEach((client) => client.send(messageStr));
    console.log('Sent result to clients');

    polls.delete(poll.pollId);
    pollClients.forEach((_, clientId) => clientPolls.delete(clientId));
    pollClients.delete(poll.pollId);
    console.log('Removed saved poll and all client sessions');
};

const handleVoteMessage = (message: VoteMessage, clientId: string) => {
    console.log(`Got a vote from ${message.name} (${clientId}): ${message.value}`);
    checkClientId(message.clientId, clientId);
    checkSocket(clientId);

    const poll = polls.get(message.pollId)!;
    poll.votes.push({
        value: message.value,
        voterClientId: clientId,
        voterName: message.name
    });
    console.log(`${poll.votes.length}${poll.maxVotes ? ` of ${poll.maxVotes}` : ''} votes so far`);

    const thisPollClients = pollClients.get(poll.pollId)!;

    if (poll.maxVotes && poll.votes.length === poll.maxVotes) {
        endPoll(poll, thisPollClients);
    } else {
        const messageToSend: PollUpdatedMessage = {
            messageType: WebsocketMessageType.POLL_UPDATED,
            pollId: message.pollId,
            currentVotes: poll.votes.length,
            hostPresent: poll.hostPresent
        };
        const messageStr = JSON.stringify(messageToSend);
        thisPollClients.forEach((client) => client.send(messageStr));
    }
};

const handleChangeMaxVotesMessage = (message: ChangeMaxVotesMessage, clientId: string) => {
    console.log(`Got request from host of ${message.pollId} to change vote max to ${message.newVoteMax}`);
    checkClientId(message.clientId, clientId);
    checkSocket(clientId);
    const poll = polls.get(message.pollId);

    if (!poll) {
        throw new Error(`Poll ID not found: ${message.pollId}`);
    }

    if (poll.startedByClientId !== clientId) {
        throw new Error(`Poll ID ${message.pollId} was started by client ${poll.startedByClientId}, not request client ${clientId}`);
    }

    const thisPollClients = pollClients.get(poll.pollId)!;
    poll.maxVotes = message.newVoteMax;

    const messageToSend: ChangeMaxVotesClientMessage = {
        messageType: WebsocketMessageType.CHANGE_MAX_VOTES_CLIENT,
        pollId: poll.pollId,
        newVoteMax: message.newVoteMax
    };
    const messageStr = JSON.stringify(messageToSend);
    thisPollClients.forEach((client) => client.send(messageStr));

    if (poll.votes.length >= message.newVoteMax) {
        endPoll(poll, thisPollClients);
    }
};

const handleEndPollMessage = (message: EndPollMessage, clientId: string) => {
    console.log(`Got request from host of ${message.pollId} to end poll`);
    checkClientId(message.clientId, clientId);
    checkSocket(clientId);

    const poll = polls.get(message.pollId);

    if (!poll) {
        throw new Error(`Poll ID not found: ${message.pollId}`);
    }

    if (poll.startedByClientId !== clientId) {
        throw new Error(`Poll ID ${message.pollId} was started by client ${poll.startedByClientId}, not request client ${clientId}`);
    }

    const thisPollClients = pollClients.get(poll.pollId)!;
    endPoll(poll, thisPollClients);
};

const handleNewClientMessage = (message: GreetingMessage, socket: WebSocket): string => {
    if (clients.has(message.clientId)) {
        console.log('New client with the same ID as an existing client:', message.clientId);
    }
    clients.set(message.clientId, socket);
    console.log('Total clients in map:', clients.size);

    const pollForClient = clientPolls.get(message.clientId);
    if (pollForClient) {
        const isHost = pollForClient.startedByClientId === message.clientId;
        pollForClient.hostPresent = pollForClient.hostPresent || isHost; // carry over unless this is the host returning
        console.log(`Client is ${isHost ? 'host' : 'member'} of pollId ${pollForClient.pollId}`);

        const previousVote = pollForClient.votes.find((vote) => vote.voterClientId === message.clientId);
        console.log(`Previous client vote: ${previousVote}`);

        const thisPollClients = pollClients.get(pollForClient.pollId)!;
        thisPollClients.set(message.clientId, socket);

        console.log('Added client back to poll clients - total count:', thisPollClients.size);

        const messageToSend: PollUpdatedMessage = {
            messageType: WebsocketMessageType.POLL_UPDATED,
            pollId: pollForClient.pollId,
            connectedClients: thisPollClients.size,
            hostPresent: pollForClient.hostPresent
        };
        const messageStr = JSON.stringify(messageToSend);

        const messageForJoiner: NewPollServerToClientMessage = {
            messageType: WebsocketMessageType.NEW_POLL_SERVER_TO_CLIENT,
            pollId: pollForClient.pollId,
            name: pollForClient.startedByName,
            prompt: pollForClient.prompt,
            currentVotes: pollForClient.votes.length,
            connectedClients: thisPollClients.size,
            maxVotes: pollForClient.maxVotes,
            isHost,
            previousVote: previousVote?.value,
            hostPresent: pollForClient.hostPresent,
            endTime: pollForClient.endTime
        };
        const messageForJoinerStr = JSON.stringify(messageForJoiner);

        thisPollClients.forEach((client) => (client === socket ? client.send(messageForJoinerStr) : client.send(messageStr)));
    }

    return message.clientId;
};

const removeDisconnectedClient = (clientId: string, socket: WebSocket) => {
    console.log(`Removing disconnected client ${clientId} - current clients map size:`, clients.size);
    const savedClient = clients.get(clientId);
    if (savedClient === socket) {
        console.log('Saved socket matches expected socket');
        clients.delete(clientId);
    } else {
        console.log('No entry found for client ID or client does not match expected socket - attempting to remove by value');
        for (const [id, s] of clients.entries()) {
            if (s === socket) {
                console.log('Found a matching socket with client ID', id);
                clients.delete(id);
                break;
            }
        }
    }

    const pollForClient = clientPolls.get(clientId);
    if (pollForClient) {
        const isHost = pollForClient.startedByClientId === clientId;
        console.log(`Client is ${isHost ? 'host' : 'member'} of pollId ${pollForClient.pollId}`);
        pollForClient.hostPresent = !isHost && pollForClient.hostPresent; // host is present carries forward unless this is the host
        const thisPollClients = pollClients.get(pollForClient.pollId)!;

        thisPollClients.delete(clientId);

        const messageToSend: PollUpdatedMessage = {
            messageType: WebsocketMessageType.POLL_UPDATED,
            pollId: pollForClient.pollId,
            connectedClients: thisPollClients.size,
            hostPresent: pollForClient.hostPresent
        };
        const messageStr = JSON.stringify(messageToSend);
        thisPollClients.forEach((client) => client.send(messageStr));

        console.log('Updated remaining poll clients');
    } else {
        console.log('Client was not a participant in any polls');
    }

    console.log(`Finished removing disconnected client ${clientId} - new clients map size:`, clients.size);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
wss.on('connection', (socket: WebSocket, request: IncomingMessage) => {
    let clientId: string;
    // console.log('New client connected:', JSON.stringify(socket, null, 2));
    // console.log('Request:', JSON.stringify(request, null, 2));
    console.log('New client connected - total clients by WSS server:', wss.clients.size);

    socket.on('error', console.error);
    socket.on('message', (data) => {
        const obj: WebsocketMessage = JSON.parse(data.toString());
        console.log('Got a message:', JSON.stringify(obj, null, 2));
        if (obj.messageType === WebsocketMessageType.GREETING) {
            clientId = handleNewClientMessage(obj as GreetingMessage, socket);
        } else if (obj.messageType === WebsocketMessageType.NEW_POLL_STARTED) {
            handleNewPollMessage(obj as NewPollStartedMessage, clientId);
        } else if (obj.messageType === WebsocketMessageType.VOTE) {
            handleVoteMessage(obj as VoteMessage, clientId);
        } else if (obj.messageType === WebsocketMessageType.JOIN_POLL) {
            handleJoinPollMessage(obj as JoinPollMessage, clientId);
        } else if (obj.messageType === WebsocketMessageType.CHANGE_MAX_VOTES) {
            handleChangeMaxVotesMessage(obj as ChangeMaxVotesMessage, clientId);
        } else if (obj.messageType === WebsocketMessageType.END_POLL) {
            handleEndPollMessage(obj as EndPollMessage, clientId);
        } else {
            const v = JSON.parse(data.toString());
            console.log('received unknown message', v);
        }
    });
    socket.on('close', (code: number, reason: Buffer) => {
        console.log('client disconnected', clientId, code, reason.toString());
        removeDisconnectedClient(clientId, socket);
    });
});
