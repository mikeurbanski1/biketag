import React, { useState } from 'react';

import { GameRoles, PublicUserDto } from '@biketag/models';

interface UserSelectionProps {
    user: PublicUserDto;
    index: number;
    onSelect: (index: number, user: PublicUserDto, role?: GameRoles) => void;
    gameRole?: GameRoles;
}

const UserSelection: React.FC<UserSelectionProps> = ({ user, index, onSelect, gameRole }) => {
    const [isSelected, setIsSelected] = useState(gameRole !== undefined);
    const [role, setRole] = useState<GameRoles | undefined>(gameRole);

    const handleSelectClick = () => {
        setIsSelected(!isSelected);
        const newRole = role || gameRole || GameRoles.PLAYER;
        // if no role set, this is the first time the user is being selected
        if (!role) {
            setRole(newRole); // Default role when selected
        }
        onSelect(index, user, !isSelected ? newRole : undefined);
    };

    const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newRole = event.target.value as GameRoles;
        setRole(newRole);
        onSelect(index, user, newRole);
    };

    return (
        <div className="user-grid-row">
            <div>{user.name}</div>
            <div>
                <button onClick={handleSelectClick}>{isSelected ? 'Remove' : 'Add'}</button>
            </div>
            <div className="button-pair">
                {isSelected && (
                    <select value={role || ''} onChange={handleRoleChange}>
                        <option value={GameRoles.PLAYER}>Player</option>
                        <option value={GameRoles.ADMIN}>Admin</option>
                    </select>
                )}
            </div>
        </div>
    );
};

export default UserSelection;
