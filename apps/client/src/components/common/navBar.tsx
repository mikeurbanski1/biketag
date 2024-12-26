import React from 'react';

import { GameDto, UserDto } from '@biketag/models';

interface NavBarProps {
    user?: UserDto;
    game?: GameDto;
    handleLogout: () => void;
}

interface UserMenuProps {
    user: UserDto;
    handleLogout: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ user, handleLogout }) => {
    const userName = user.name;
    const userNameClassName = 'clickable-text clickable-nav-item dropdown-header user-dropdown-header';
    return (
        <span className={userNameClassName}>
            {userName.charAt(0)}
            <div className="dropdown-content user-dropdown-content">
                <span className="clickable-text" onClick={handleLogout}>
                    Log out
                </span>
            </div>
        </span>
    );
};

const MainMenu: React.FC = () => {
    return (
        <span className="clickable-text clickable-nav-item menu-dropdown-header dropdown-header">
            🚲<div className="dropdown-content menu-dropdown-content">View games</div>
        </span>
    );
};

const NavBar: React.FC<NavBarProps> = ({ user, game, handleLogout }) => {
    return (
        <div className="nav-bar">
            <span className="bike-tag-title">Bike Tag!</span>
            {user ? <UserMenu user={user} handleLogout={handleLogout} /> : <span></span>}
            <MainMenu />
        </div>
    );
};

export default NavBar;
