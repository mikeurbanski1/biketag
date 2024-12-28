import React from 'react';

import { TagDto } from '@biketag/models';

interface TagCardProps {
    tag: TagDto;
    selectTag: () => void;
}

export const TagCard: React.FC<TagCardProps> = (props) => {
    return (
        <div className="tag tag-card clickable-tag" onClick={props.selectTag}>
            <div className="tag-image-container">
                <img src={props.tag.imageUrl} className="tag-image" />
            </div>
        </div>
    );
};
