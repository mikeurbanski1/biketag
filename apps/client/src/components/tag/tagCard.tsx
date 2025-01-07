import React, { useContext } from 'react';

import { TagDto } from '@biketag/models';

import { UserContext } from '../common/context';

interface TagCardProps {
    tag: TagDto | 'addTag';
    selectTag: () => void;
    knownCanAddTag?: boolean;
}

export const TagCard: React.FC<TagCardProps> = (props) => {
    const { tag, selectTag } = props;
    const user = useContext(UserContext)!;
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

    const outerClasses = ['tag', 'tag-card', 'clickable-tag'];
    if (tag === 'addTag' || tag.creator.id === user.id) {
        outerClasses.push('tag-creator');
    } else if (props.knownCanAddTag || tag.isPending) {
        outerClasses.push('tag-incomplete');
    } else {
        outerClasses.push('tag-complete');
    }

    return (
        <div className={outerClasses.join(' ')} onClick={selectTag}>
            <div className={imageContainerClass}>{tagContents}</div>
        </div>
    );
};
