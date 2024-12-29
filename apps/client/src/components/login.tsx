import React, { ChangeEvent } from 'react';

import { ApiManager } from '../api';

interface LoginProps {
    setUser: ({ name, id }: { name: string; id: string }) => void;
}

export const Login: React.FC<LoginProps> = ({ setUser }: LoginProps) => {
    const [name, setName] = React.useState('');
    const [canLogin, setCanLogin] = React.useState(false);
    const [canSignup, setCanSignup] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState<string | undefined>(undefined);

    const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
        setName(event.target.value);
        setCanLogin(event.target.value !== '');
        setCanSignup(event.target.value !== '');
    };

    const login = async () => {
        try {
            const { id } = await ApiManager.userApi.login({ name });
            setUser({ name, id });
        } catch (err) {
            if (err instanceof Error) {
                setErrorMessage(err.message);
            }
        }
    };

    const signUp = async () => {
        try {
            const { id } = await ApiManager.userApi.signup({ name });
            setUser({ name, id });
        } catch (err) {
            if (err instanceof Error) {
                setErrorMessage(err.message);
            }
        }
    };

    return (
        <div className="flex-column moderate-gap">
            <input className="login-text" placeholder="Name" type="text" onChange={(event) => handleNameChange(event)} value={name}></input>
            <div className="button-pair">
                <button className="login-button" type="button" onClick={async () => await login()} disabled={!canLogin}>
                    Login
                </button>
                <button className="login-button" type="button" onClick={async () => await signUp()} disabled={!canSignup}>
                    Sign up
                </button>
            </div>
            <h3>{errorMessage || ''}</h3>
        </div>
    );
};
