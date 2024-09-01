import React, { ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
    GreetingMessage,
    JoinPollMessage,
    NewPollServerToClientMessage,
    NewPollStartedMessage,
    ClientPoll,
    PollCompletedMessage,
    PollUpdatedMessage,
    VoteMessage,
    WebsocketMessage,
    WebsocketMessageType,
    PollResults,
    ChangeMaxVotesMessage,
    ChangeMaxVotesClientMessage,
    EndPollMessage
} from '@biketag/models';
import './App.css';
import { Landing } from './components/landing';
import { VotePanel } from './components/votePanel';
import { ResultsPanel } from './components/resultsPanel';
import ReconnectingWebSocket from 'reconnecting-websocket';

interface AppProps {
    url: string;
}

enum AppState {
    NEW,
    POLL_STARTED,
    POLL_RESULTS
}

interface AppComponentState {
    state: AppState;
    clientId: string;
    name?: string;
    poll?: ClientPoll;
    pollResults?: PollResults;
    invalidPoll: boolean;
    voteValue?: number;
}

export default class App extends React.Component<AppProps, AppComponentState> {
    private websocket!: ReconnectingWebSocket;

    constructor(props: AppProps) {
        super(props);
        const { url } = props;
        console.log('url', url);

        const clientId = localStorage.getItem('clientId');
        const name = localStorage.getItem('userName') || undefined;

        console.log('clientId and userName from local storage:', clientId, name);

        this.state = {
            state: AppState.NEW,
            name,
            clientId: clientId || uuidv4(),
            invalidPoll: false
        };

        console.log('Client UUID:', this.state.clientId);
        localStorage.setItem('clientId', this.state.clientId);

        this.send = this.send.bind(this);
        this.startPoll = this.startPoll.bind(this);
        this.joinPoll = this.joinPoll.bind(this);
        this.handleStartedPoll = this.handleStartedPoll.bind(this);
        this.handleSendVote = this.handleSendVote.bind(this);
        this.handleNameChange = this.handleNameChange.bind(this);
        this.handlePollInvalid = this.handlePollInvalid.bind(this);
        this.handleChangeVoteMax = this.handleChangeVoteMax.bind(this);
        this.handleChangeVoteMaxMessage = this.handleChangeVoteMaxMessage.bind(this);
        this.handleEndPoll = this.handleEndPoll.bind(this);
    }

    componentDidMount(): void {
        this.websocket = new ReconnectingWebSocket(this.props.url + '/?test=true');
        this.websocket.onopen = () => {
            console.log('opened websocket connection');
            const messageToSend: GreetingMessage = {
                messageType: WebsocketMessageType.GREETING,
                clientId: this.state.clientId
            };
            this.send(messageToSend);
        };

        this.websocket.onclose = () => {
            console.log('websocket connection closed');
        };

        this.websocket.onmessage = (event) => {
            const message = JSON.parse(event.data) as WebsocketMessage;
            console.log('got websocket message', message);
            if (message.messageType === WebsocketMessageType.NEW_POLL_SERVER_TO_CLIENT) {
                this.handleStartedPoll(message as NewPollServerToClientMessage);
            } else if (message.messageType === WebsocketMessageType.POLL_COMPLETED) {
                this.handleCompletedPoll(message as PollCompletedMessage);
            } else if (message.messageType === WebsocketMessageType.POLL_UPDATED) {
                this.handleUpdatedPoll(message as PollUpdatedMessage);
            } else if (message.messageType === WebsocketMessageType.CHANGE_MAX_VOTES_CLIENT) {
                this.handleChangeVoteMaxMessage(message as ChangeMaxVotesClientMessage);
            } else if (message.messageType === WebsocketMessageType.POLL_INVALID) {
                this.handlePollInvalid();
            }

            // this.setState({ state: AppState.POLL_RESULTS });
        };
    }

    send(message: WebsocketMessage) {
        this.websocket.send(JSON.stringify(message));
    }

    startPoll({ name, prompt, maxVotes, time }: { name: string; prompt: string; maxVotes?: number; time?: number }) {
        this.setState({
            name
        });
        localStorage.setItem('userName', name);

        const endTime = time ? new Date().getTime() + time * 1000 : undefined;

        const message: NewPollStartedMessage = {
            messageType: WebsocketMessageType.NEW_POLL_STARTED,
            name,
            clientId: this.state.clientId,
            prompt,
            maxVotes,
            endTime
        };

        this.send(message);
    }

    joinPoll({ name, pollId }: { name: string; pollId: string }) {
        this.setState({
            name
        });

        localStorage.setItem('userName', name);

        const message: JoinPollMessage = {
            messageType: WebsocketMessageType.JOIN_POLL,
            pollId,
            clientId: this.state.clientId,
            name
        };

        this.send(message);
    }

    handleUpdatedPoll(message: PollUpdatedMessage) {
        const newPoll = {
            ...this.state.poll!
        };

        if (message.connectedClients) {
            newPoll.connectedClients = message.connectedClients;
        }
        if (message.currentVotes) {
            newPoll.numVotes = message.currentVotes;
        }
        if (message.maxVotes) {
            newPoll.maxVotes = message.maxVotes;
        }
        newPoll.hostPresent = message.hostPresent;

        this.setState({
            poll: newPoll
        });
    }

    handleStartedPoll(message: NewPollServerToClientMessage) {
        this.setState({
            state: AppState.POLL_STARTED,
            poll: {
                pollId: message.pollId,
                prompt: message.prompt,
                startedByName: message.name,
                numVotes: message.currentVotes,
                maxVotes: message.maxVotes,
                connectedClients: message.connectedClients,
                isHost: message.isHost,
                hostPresent: message.hostPresent,
                endTime: message.endTime
            },
            voteValue: message.previousVote
        });
    }

    handleCompletedPoll(message: PollCompletedMessage) {
        this.setState({
            state: AppState.POLL_RESULTS,
            pollResults: {
                pollId: message.pollId,
                prompt: message.prompt,
                result: message.result,
                votes: message.votes
            }
        });
    }

    handleSendVote({ value, name }: { value: number; name: string }) {
        const message: VoteMessage = {
            messageType: WebsocketMessageType.VOTE,
            value,
            name,
            clientId: this.state.clientId,
            pollId: this.state.poll!.pollId
        };
        this.send(message);
        this.setState({
            voteValue: value
        });
    }

    handleChangeVoteMax(newVoteMax: number) {
        const message: ChangeMaxVotesMessage = {
            messageType: WebsocketMessageType.CHANGE_MAX_VOTES,
            pollId: this.state.poll!.pollId,
            clientId: this.state.clientId,
            newVoteMax
        };
        this.send(message);
    }

    handleChangeVoteMaxMessage(message: ChangeMaxVotesClientMessage) {
        this.setState({
            poll: {
                ...this.state.poll!,
                maxVotes: message.newVoteMax
            }
        });
    }

    handleEndPoll() {
        const message: EndPollMessage = {
            messageType: WebsocketMessageType.END_POLL,
            pollId: this.state.poll!.pollId,
            clientId: this.state.clientId
        };
        this.send(message);
    }

    handleNameChange(name: string) {
        this.setState({
            name
        });
    }

    handlePollInvalid() {
        this.setState({
            invalidPoll: true
        });
    }

    handleResetClient() {
        localStorage.removeItem('clientId');
        window.location.reload();
    }

    render(): ReactNode {
        let inner;

        if (this.state.state === AppState.NEW) {
            inner = [
                <h1 key="h1">The Joseph Voting App</h1>,
                <Landing
                    key="landing"
                    name={this.state.name}
                    startPoll={this.startPoll}
                    handleNameChange={this.handleNameChange}
                    joinPoll={this.joinPoll}
                    invalidPoll={this.state.invalidPoll}
                ></Landing>
            ];
        } else if (this.state.state === AppState.POLL_STARTED) {
            inner = (
                <VotePanel
                    name={this.state.name}
                    poll={this.state.poll!}
                    voteValue={this.state.voteValue}
                    vote={(props: { value: number; name: string }) => this.handleSendVote(props)}
                    changeVoteMax={this.handleChangeVoteMax}
                    endPoll={this.handleEndPoll}
                ></VotePanel>
            );
        } else if (this.state.state === AppState.POLL_RESULTS) {
            inner = <ResultsPanel results={this.state.pollResults!}></ResultsPanel>;
        }

        return (
            <div className="App">
                <header className="App-header">
                    {inner}
                    <input type="button" name="reset-client-button" value="Reset local client ID" onClick={this.handleResetClient}></input>
                </header>
            </div>
        );
    }
}

// interface TheThingProps {
//     text: string;
//     sendMessage: (val: string) => void;
// }

// interface TheThingState {
//     buttonValues?: string[];
// }

// type Message = {
//     text: string;
// };

// class TheThing extends React.Component<TheThingProps, TheThingState> {
//     constructor(props: TheThingProps) {
//         super(props);
//         this.state = {};
//     }

//     componentDidMount(): void {
//         console.log('componentDidMount');
//         axios
//             .get('http://localhost:3001/buttons')
//             .then((response: AxiosResponse) => {
//                 console.log(response);
//                 this.setState({
//                     buttonValues: response.data
//                 });
//             })
//             .catch(function (error) {
//                 console.log(error);
//             });
//     }

//     buttonClick(text: string): void {
//         this.props.sendMessage(text);
//     }

//     render(): ReactNode {
//         const buttons: JSX.Element[] = [];

//         if (this.state.buttonValues) {
//             for (let v of this.state.buttonValues) {
//                 buttons.push(<input type="button" value={v} key={v} onClick={() => this.buttonClick(v)}></input>);
//             }
//         }

//         return (
//             <div>
//                 <h1>{this.props.text || 'hi'}</h1>
//                 {buttons}
//             </div>
//         );
//     }
// }

