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
import { Logger } from '@biketag/utils';
import './App.css';
import { Login } from './components/login';
import axios, { AxiosError, AxiosInstance } from 'axios';

const logger = new Logger({});

interface AppProps {
    url: string;
}

enum AppState {
    HOME,
    LOGGED_IN,
    POLL_RESULTS
}

interface AppComponentState {
    state: AppState;
    loggedIn: boolean;
    clientId: string;
    userId?: string;
    name?: string;
    loginFailedMessage?: string;
    signupFailedMessage?: string;
}

export default class App extends React.Component<AppProps, AppComponentState> {
    private axios: AxiosInstance;

    constructor(props: AppProps) {
        super(props);

        const { url } = props;
        logger.info('url', { url });
        this.axios = axios.create({
            baseURL: url
        });

        const clientId = localStorage.getItem('clientId');
        const name = localStorage.getItem('userName') || undefined;

        logger.info('clientId and userName from local storage:', { clientId, name });

        this.state = {
            state: AppState.HOME,
            name,
            clientId: clientId || uuidv4(),
            loggedIn: false
        };

        logger.info('Client UUID:', { uuid: this.state.clientId });
        localStorage.setItem('clientId', this.state.clientId);
    }

    // componentDidMount(): void {}

    handleUserDetailsChange({ name, id }: { name: string; id: string }) {
        this.setState({
            name,
            userId: id
        });
    }

    async handleLogin({ name, id }: { name: string; id: string }) {
        try {
            const resp = await this.axios.request({
                method: 'post',
                url: '/users/login',
                data: {
                    id,
                    name
                }
            });
            if (resp.status === 200) {
                this.setState({
                    loginFailedMessage: undefined,
                    signupFailedMessage: undefined,
                    name,
                    userId: id,
                    state: AppState.LOGGED_IN
                });
            } else {
                this.setState({
                    loginFailedMessage: `Unexpected response: ${resp.status} - ${resp.statusText}`
                });
            }
        } catch (err) {
            let errorMessage: string | undefined = undefined;
            if (err instanceof AxiosError) {
                if (err.status === 404) {
                    errorMessage = 'User does not exist';
                } else if (err.status === 400) {
                    logger.info(`[handleSignup] ${err.message} ${err.response?.statusText}`);
                    errorMessage = 'Invalid user details entered';
                } else {
                    errorMessage = err.message;
                }
            }
            if (!errorMessage) {
                errorMessage = 'Unknown error';
            }

            this.setState({
                loginFailedMessage: errorMessage
            });
        }
    }

    async handleSignup({ name, id }: { name: string; id: string }) {
        try {
            const resp = await this.axios.request({
                method: 'post',
                url: '/users',
                data: {
                    name
                }
            });
            if (resp.status === 201) {
                logger.info('[handleSignup] got 201 response', { data: resp.data });
                this.setState({
                    loginFailedMessage: undefined,
                    signupFailedMessage: undefined,
                    name,
                    userId: resp.data.id,
                    state: AppState.LOGGED_IN
                });
            } else {
                this.setState({
                    loginFailedMessage: `Unexpected response: ${resp.status} - ${resp.statusText}`
                });
            }
        } catch (err) {
            logger.info(`[handleSignup]`, { err });
            let errorMessage: string | undefined = undefined;
            if (err instanceof AxiosError) {
                if (err.status === 404) {
                    errorMessage = 'User does not exist';
                } else {
                    errorMessage = err.message;
                }
            }
            if (!errorMessage) {
                errorMessage = 'Unknown error';
            }

            this.setState({
                loginFailedMessage: errorMessage
            });
        }
    }

    handleLoginFailed(message: string) {
        this.setState({
            loginFailedMessage: message,
            signupFailedMessage: undefined
        });
    }

    handleSignupFailed(message: string) {
        this.setState({
            signupFailedMessage: message,
            loginFailedMessage: undefined
        });
    }

    handleResetClient() {
        localStorage.removeItem('clientId');
        window.location.reload();
    }

    render(): ReactNode {
        let inner;

        if (this.state.state === AppState.HOME) {
            inner = [
                <h1 key="h1">Bike Tag</h1>,
                <Login
                    key="landing"
                    handleUserDetailsChange={({ name, id }: { name: string; id: string }) => this.handleUserDetailsChange({ name, id })}
                    login={({ name, id }: { name: string; id: string }) => this.handleLogin({ name, id })}
                    signUp={({ name, id }: { name: string; id: string }) => this.handleSignup({ name, id })}
                    loginFailedMessage={this.state.loginFailedMessage}
                    signupFailedMessage={this.state.signupFailedMessage}
                ></Login>
            ];
        } else if (this.state.state === AppState.LOGGED_IN) {
            inner = (
                <h1 key="k1">
                    Logged in as {this.state.name} ({this.state.userId})
                </h1>
            );
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

