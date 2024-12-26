import React, { useState } from 'react';

import { GameDto, UserDto } from '@biketag/models';

interface NavBarProps {
    user?: UserDto;
    game?: GameDto;
    handleLogout: () => void;
    startCreateGame: () => void;
}

// interface MainMenuProps {
//     user?: UserDto;
//     handleLogout: () => void;
// }

const MainMenu: React.FC<NavBarProps> = ({ user, handleLogout, startCreateGame }) => {
    const [showingMenu, setShowingMenu] = useState(false);
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
                <div className="clickable-text">View games</div>
                <div className="clickable-text" onClick={startCreateGame}>
                    Create game
                </div>
            </div>
        </div>
    );
};

// const MainMenu: React.FC = () => {
//     return (
//         <span className="clickable-text clickable-nav-item menu-dropdown-header dropdown-header">
//             🚲<div className="dropdown-content menu-dropdown-content">View games</div>
//         </span>
//     );
// };

const NavBar: React.FC<NavBarProps> = (props) => {
    return (
        <div className="nav-bar">
            <div className="bike-tag-title">Bike Tag!</div>
            <MainMenu {...props} />
        </div>
    );
};

export default NavBar;
