import React, { useContext, useState } from 'react';

import { UserContext } from './context';

interface NavBarProps {
    handleLogout: () => void;
    backToHome: () => void;
    doneViewingGame: () => void;
    startCreateGame: () => void;
}

const MainMenu: React.FC<NavBarProps> = ({ handleLogout, startCreateGame, doneViewingGame }) => {
    const [showingMenu, setShowingMenu] = useState(false);
    const user = useContext(UserContext);
    return (
        <div className="clickable-nav-item dropdown-header" onClick={() => setShowingMenu(!showingMenu)}>
            {/* {userName.charAt(0)} */}🚲
            <div className="dropdown-content" style={{ display: showingMenu ? 'block' : 'none' }}>
                <div className="dropdown-title">{user ? `Logged in as ${user.name}` : 'Not logged in'}</div>
                {user && (
                    <div className="clickable-text" onClick={handleLogout}>
                        Log out
                    </div>
                )}
                <div className="clickable-text" onClick={doneViewingGame}>
                    View games
                </div>
                <div className="clickable-text" onClick={startCreateGame}>
                    Create game
                </div>
            </div>
        </div>
    );
};

export const NavBar: React.FC<NavBarProps> = (props) => {
    return (
        <div className="nav-bar">
            <div className="bike-tag-title clickable-text" onClick={props.backToHome}>
                Bike Tag!
            </div>
            <MainMenu {...props} />
        </div>
    );
};
