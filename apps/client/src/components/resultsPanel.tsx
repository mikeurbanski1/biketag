import React, { ReactNode } from 'react';
import { PollResults } from '@biketag/models';
import { Histogram } from './histogram';

interface ResultsPanelProps {
    results: PollResults;
}
interface ResultsPanelState {
    name: string;
    canVote: boolean;
}

export class ResultsPanel extends React.Component<ResultsPanelProps, ResultsPanelState> {
    constructor(props: ResultsPanelProps) {
        super(props);
        console.log(props);
        this.state = {
            name: '',
            canVote: false
        };
    }

    render(): ReactNode {
        return (
            <div>
                <h1>{this.props.results.prompt}</h1>
                <br></br>
                Result ({this.props.results.votes.length} votes):
                <br></br>
                <h1>{this.props.results.result}</h1>
                <Histogram width={400} height={400} data={this.props.results.votes} />
            </div>
        );
    }
}
