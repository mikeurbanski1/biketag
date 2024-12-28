import React, { useEffect } from 'react';

import { GameDto, TagDto } from '@biketag/models';

import { ApiManager } from '../../api';
import { TagCard } from '../tag/tagCard';

interface TagCardProps {
    game: GameDto;
    selectTag: (tag: TagDto) => void;
}

export const TagCardView: React.FC<TagCardProps> = (props) => {
    const { game } = props;
    const { latestRootTag, firstRootTag } = game;

    // if there are two or fewer tags, then we know all of them
    // we do not have to load anything if there is no latest tag, or if the latest tag is the first tag, or if the latest tag is the next tag of the first tag
    const [loading, setLoading] = React.useState(!(!latestRootTag || (latestRootTag.id === firstRootTag!.id && latestRootTag.id === firstRootTag!.nextTagId)));
    const [tags, setTags] = React.useState<TagDto[]>([]);
    const [refreshKey] = React.useState(0);

    useEffect(() => {
        if (!loading) {
            return;
        }
        ApiManager.tagApi.getRootTagsForGame({ gameId: game.id }).then((tags) => {
            setLoading(false);
            setTags(tags);
        });
    }, [refreshKey, game.id, loading]);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="tag-card-view">
            {tags.map((tag) => (
                <TagCard key={tag.id} tag={tag} selectTag={() => props.selectTag(tag)} />
            ))}
        </div>
    );
};
