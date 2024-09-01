import React, { ChangeEvent, ReactNode } from 'react';
import { ClientPoll } from '@biketag/models';

interface VotePanelProps {
    poll: ClientPoll;
    name?: string;
    voteValue?: number;
    vote: (props: { value: number; name: string }) => void;
    changeVoteMax: (newVoteMax: number) => void;
    endPoll: () => void;
}
interface VotePanelState {
    name: string;
    canVote: boolean;
    sentVote: boolean;
    value?: number;
    newVoteMax: string;
    canChangeVoteMax: boolean;
    secondsRemaining?: number;
}

export class VotePanel extends React.Component<VotePanelProps, VotePanelState> {
    constructor(props: VotePanelProps) {
        super(props);
        console.log(props);

        const secondsRemaining = props.poll.endTime ? (props.poll.endTime - new Date().getTime()) / 1000 : undefined;
        console.log('secondsRemaining', secondsRemaining);

        this.state = {
            name: props.name || '',
            canVote: !!props.name,
            sentVote: props.voteValue !== undefined,
            value: props.voteValue,
            newVoteMax: '',
            canChangeVoteMax: false,
            secondsRemaining
        };

        if (secondsRemaining) {
            this.setCounter.bind(this)();
        }
        this.handleNameChange = this.handleNameChange.bind(this);
        this.getChangeVoteMax = this.getChangeVoteMax.bind(this);
        this.handleNewVoteMaxChange = this.handleNewVoteMaxChange.bind(this);
        this.setNewMaxVotes = this.setNewMaxVotes.bind(this);
        this.vote = this.vote.bind(this);
    }

    private setCounter() {
        setTimeout(() => {
            this.setState({
                secondsRemaining: this.props.poll.endTime ? (this.props.poll.endTime - new Date().getTime()) / 1000 : undefined
            });
            this.setCounter.bind(this)();
        }, 250);
    }

    private vote(value: number) {
        console.log('voted ' + value);
        this.props.vote({ value, name: this.state.name });
        this.setState({
            sentVote: true,
            value
        });
    }

    private handleNameChange(event: ChangeEvent<HTMLInputElement>) {
        this.setState({
            name: event.target.value,
            canVote: event.target.value !== ''
        });
    }

    private getChangeVoteMax(newMax: number): { newVoteMax: string; canChangeVoteMax: boolean } {
        if (newMax < this.props.poll.numVotes) {
            return {
                newVoteMax: this.props.poll.numVotes.toString(),
                canChangeVoteMax: true
            };
        }

        if (newMax < 1) {
            return {
                newVoteMax: '',
                canChangeVoteMax: false
            };
        }

        return {
            newVoteMax: newMax.toString(),
            canChangeVoteMax: true
        };
    }

    private handleNewVoteMaxChange(event: ChangeEvent<HTMLInputElement>) {
        const value = event.target.value;
        const asNum = parseInt(value);
        if (isNaN(asNum)) {
            this.setState({
                newVoteMax: '',
                canChangeVoteMax: false
            });
        } else {
            this.setState(this.getChangeVoteMax(asNum));
        }
    }

    private setNewMaxVotes() {
        const newVoteMax = parseInt(this.state.newVoteMax);
        this.props.changeVoteMax(newVoteMax);
    }

    render(): ReactNode {
        const hostPanel = (
            <div>
                <h3>You are the host</h3>
                <br></br>
                <label htmlFor="set-max">Set new max:</label>
                <input type="text" name="set-max" onChange={this.handleNewVoteMaxChange} value={this.state.newVoteMax}></input>
                <input type="button" name="set-max-button" value="Set new max votes" onClick={this.setNewMaxVotes} disabled={!this.state.canChangeVoteMax}></input>
                <br></br>
                <input type="button" name="set-max-button" value="End poll now" onClick={this.props.endPoll} disabled={this.props.poll.numVotes < 1}></input>
            </div>
        );

        const status = (
            <div>
                {this.props.poll.isHost ? hostPanel : null}
                <h3>{this.props.poll.maxVotes ? `${this.props.poll.numVotes} of ${this.props.poll.maxVotes} votes in` : `${this.props.poll.numVotes} votes in`}</h3>
                <br></br>
                {this.props.poll.connectedClients} users connected{this.props.poll.hostPresent ? '' : ' (host is currently missing :/)'}
                {this.state.secondsRemaining ? [<br></br>, `Ends in ${Math.ceil(this.state.secondsRemaining)} seconds`] : ''}
            </div>
        );

        if (this.state.sentVote) {
            return (
                <div>
                    <h1>Sent vote {this.state.value!}</h1>
                    <br></br>
                    <h1>Awaiting result...</h1>
                    <br></br>
                    <h3>Prompt: {this.props.poll.prompt}</h3>
                    <br></br>
                    <h3>Poll ID: {this.props.poll.pollId}</h3>
                    <br></br>
                    {status}
                </div>
            );
        }

        let buttons = [];
        for (let i = -5; i <= 5; i++) {
            buttons.push(
                <input
                    type="button"
                    name={'vote' + i}
                    value={i}
                    key={i}
                    disabled={!this.state.canVote}
                    onClick={() => {
                        this.vote(i);
                    }}
                ></input>
            );
        }

        return (
            <div>
                <h2>New poll started by: {this.props.poll.startedByName}</h2>
                <br></br>
                <h3>Poll ID: {this.props.poll.pollId}</h3>
                <br></br>
                <h1>{this.props.poll.prompt}</h1>
                <br></br>
                <label htmlFor="name">Your name: </label>
                <input type="text" name="name" onChange={this.handleNameChange} value={this.state.name}></input>
                <br></br>
                Enter vote:
                <br></br>
                {buttons}
                <br></br>
                {status}
            </div>
        );
    }
}
