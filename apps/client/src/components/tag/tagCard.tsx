import React from 'react';

import { isFullTag, PendingTag, TagDto } from '@biketag/models';

interface TagCardProps {
    tag: TagDto | PendingTag | 'addTag';
    selectTag: () => void;
}

export const TagCard: React.FC<TagCardProps> = (props) => {
    const { tag, selectTag } = props;
    let tagContents: React.ReactNode;
    if (tag === 'addTag') {
        tagContents = <div className="pending-tag-card">Post the next tag!</div>;
    } else if (isFullTag(tag)) {
        tagContents = <img src={tag.imageUrl} className="tag-image" />;
    } else {
        tagContents = (
            <div className="pending-tag-card">
                Tomorrow's tag<br></br>by {tag.creator.name}
            </div>
        );
    }

    return (
        <div className="tag tag-card clickable-tag" onClick={selectTag}>
            <div className="tag-image-container">{tagContents}</div>
        </div>
    );
};
