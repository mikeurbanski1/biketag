import React from 'react';

import { isFullTag, PendingTag, TagDto } from '@biketag/models';

interface TagCardProps {
    tag: TagDto | PendingTag;
    selectTag: () => void;
}

export const TagCard: React.FC<TagCardProps> = (props) => {
    let tagContents: React.ReactNode;
    if (isFullTag(props.tag)) {
        tagContents = <img src={props.tag.imageUrl} className="tag-image" />;
    } else {
        tagContents = (
            <div className="pending-tag-card">
                Tomorrow's tag<br></br>by {props.tag.creator.name}
            </div>
        );
    }

    return (
        <div className="tag tag-card clickable-tag" onClick={props.selectTag}>
            <div className="tag-image-container">{tagContents}</div>
        </div>
    );
};
