import { useState } from 'react';

interface ClickableIconProps {
    selectedIcon: string;
    unselectedIcon: string;
    isSelected: boolean;
    className: string;
    onClick: () => void;
}

export const ClickableIcon: React.FC<ClickableIconProps> = ({ selectedIcon, unselectedIcon, isSelected, className, onClick }: ClickableIconProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const [showAsSelected, setShowAsSelected] = useState(isSelected);
    const [clickedSinceEntered, setClickedSinceEntered] = useState(false);

    // take the opposite state of the *current* showAsSelected state when we are processing a click
    const defaultIcon = clickedSinceEntered !== showAsSelected ? selectedIcon : unselectedIcon;
    const hoverIcon = clickedSinceEntered !== showAsSelected ? unselectedIcon : selectedIcon;

    return (
        <div
            className={className}
            onMouseEnter={() => !clickedSinceEntered && setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false);
                setClickedSinceEntered(false);
            }}
            onClick={(event) => {
                setClickedSinceEntered(true);
                onClick();
                setShowAsSelected(!showAsSelected);
                event.stopPropagation();
            }}
        >
            {isHovered ? hoverIcon : defaultIcon}
        </div>
    );
};
