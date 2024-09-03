import React, { ChangeEvent, ReactNode } from 'react';
import { parseIfInteger } from '@biketag/utils';

interface LoginState {
    name: string;
    id: string;
    canLogin: boolean;
    canSignup: boolean;
}

interface LoginProps {
    handleUserDetailsChange: ({ id, name }: { id: string; name: string }) => void;
    login: ({ name, id }: { name: string; id: string }) => void;
    signUp: ({ name, id }: { name: string; id: string }) => void;
    signupFailedMessage?: string;
    loginFailedMessage?: string;
}

export class Login extends React.Component<LoginProps, LoginState> {
    constructor(props: LoginProps) {
        super(props);
        this.state = {
            name: '',
            id: '',
            canLogin: false,
            canSignup: false
        };
        // this.handleNameChange = this.handleNameChange.bind(this);
        // this.handleIdChange = this.handleIdChange.bind(this);
        // this.login = this.login.bind(this);
        // this.signUp = this.signUp.bind(this);
    }

    private handleNameChange(event: ChangeEvent<HTMLInputElement>) {
        const newState: Partial<LoginState> = {
            name: event.target.value
        };
        newState.canLogin = this.canLogin(newState);
        newState.canSignup = this.canSignup(newState);
        this.setState(newState as LoginState);
        this.props.handleUserDetailsChange({ id: this.state.id, name: (newState as LoginState).name });
    }

    private handleIdChange(event: ChangeEvent<HTMLInputElement>) {
        const newState: Partial<LoginState> = {
            id: event.target.value === '' ? '' : parseIfInteger(event.target.value)?.toString() || this.state.id
        };
        newState.canLogin = this.canLogin(newState);
        newState.canSignup = this.canSignup(newState);
        this.setState(newState as LoginState);
        this.props.handleUserDetailsChange({ name: this.state.name, id: (newState as LoginState).id });
    }

    private canLogin(newState: Partial<LoginState>) {
        const merged = Object.assign({}, this.state, newState);
        return merged.name !== '' && merged.id !== '';
    }

    private canSignup(newState: Partial<LoginState>) {
        const merged = Object.assign({}, this.state, newState);
        return merged.name !== '' && merged.id === '';
    }

    login() {
        this.props.login({
            name: this.state.name,
            id: this.state.id
        });
    }

    signUp() {
        this.props.signUp({
            name: this.state.name,
            id: this.state.id
        });
    }

    render(): ReactNode {
        return (
            <div>
                <span>
                    <label htmlFor="id">User ID: </label>
                    <input type="text" name="id" onChange={(event) => this.handleIdChange(event)} value={this.state.id}></input>
                    <label htmlFor="name">Your name: </label>
                    <input type="text" name="name" onChange={(event) => this.handleNameChange(event)} value={this.state.name}></input>
                    <br></br>
                    <input type="button" name="login" value="Login" onClick={async () => await this.login()} disabled={!this.state.canLogin}></input>
                    <input type="button" name="signup" value="Sign Up" onClick={() => this.signUp()} disabled={!this.state.canSignup}></input>
                    <br></br>
                    <h3>{this.props.signupFailedMessage || this.props.loginFailedMessage || ''}</h3>
                </span>
            </div>
        );
    }
}
