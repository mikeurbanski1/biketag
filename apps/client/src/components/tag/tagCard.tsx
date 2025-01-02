import React from 'react';

import { TagDto, tagHasRealImage } from '@biketag/models';

interface TagCardProps {
    tag: TagDto | 'addTag';
    selectTag: () => void;
}

export const TagCard: React.FC<TagCardProps> = (props) => {
    const { tag, selectTag } = props;
    let tagContents: React.ReactNode;
    if (tag === 'addTag') {
        tagContents = <div className="pending-tag-card">Post the next tag!</div>;
    } else {
        tagContents = <img src={tag.imageUrl ?? tag.imageData} className="tag-image" />;
        // } else {
        //     tagContents = (
        //         <div className="pending-tag-card">
        //             Tomorrow's tag<br></br>by {tag.creator.name}
        //         </div>
        //     );
        // }
    }

    const imageContainerClass = `tag-image-container ${tag !== 'addTag' && tag.isPending ? 'pending-tag-image' : ''}`;

    return (
        <div className="tag tag-card clickable-tag" onClick={selectTag}>
            <div className={imageContainerClass}>{tagContents}</div>
        </div>
    );
};
