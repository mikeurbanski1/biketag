import React, { useEffect } from 'react';

import { EnrichedTagDto, GameDto, TagDto } from '@biketag/models';
import { Logger } from '@biketag/utils';

import { ApiManager } from '../../api';
import { TagCard } from '../tag/tagCard';

const logger = new Logger({ prefix: '' });

type TagCardType = TagDto | EnrichedTagDto | 'addTag';

interface TagCardProps {
    game: GameDto;
    userCanAddRootTag?: boolean;
    selectTag: (tag: TagCardType) => void;
}

const isEnrichedTag = (tag: TagCardType): tag is EnrichedTagDto => Object.prototype.hasOwnProperty.call(tag, 'userCanAddSubtag');

export const TagCardView: React.FC<TagCardProps> = (props) => {
    const { game, userCanAddRootTag } = props;
    const { pendingRootTag } = game;

    // let initLoading = true;
    // const initTags: TagCardType[] = [];

    // // if there are two or fewer tags (ignoring pending tag), then we know all of them from the game itself and do not need to load
    // // otherwise we will load everything and display it together later
    // if (!gameHasTag(game) || game.latestRootTag.id === game.firstRootTag.id || game.latestRootTag.id === game.firstRootTag.nextRootTagId) {
    //     initLoading = false;

    //     if (gameHasTag(game)) {
    //         const { firstRootTag, latestRootTag } = game;
    //         initTags.push(latestRootTag);
    //         if (firstRootTag && firstRootTag.id !== latestRootTag.id) {
    //             initTags.push(firstRootTag);
    //         }
    //     }
    // }

    // skip loading a game that has no tags
    const [loading, setLoading] = React.useState(game.latestRootTag !== undefined);
    const [tags, setTags] = React.useState<TagCardType[]>([]);

    useEffect(() => {
        if (!loading) {
            return;
        }
        ApiManager.tagApi.getRootTagsForGame({ gameId: game.id }).then((gameTags) => {
            // logger.info(`[TagCardView][useEffect] got gameTags`, { instanceId, gameTags });
            setLoading(false);
            // const tagsToSet: (TagDto | PendingTag | 'addTag')[] = gameTags;
            // logger.info(`[TagCardView][useEffect] setting tags`, { instanceId, tagsToSet });
            setTags(gameTags);
        });
    }, [game.id, loading]);

    // return this here so that we are outside of the grid and the loading text does not move from the game loading screen
    if (loading) {
        return <div>Loading...</div>;
    }

    let fakeFirstTag: TagCardType | undefined;
    if (userCanAddRootTag) {
        fakeFirstTag = 'addTag';
    } else if (pendingRootTag) {
        fakeFirstTag = pendingRootTag;
    }

    const tagsToRender = fakeFirstTag ? [fakeFirstTag, ...tags] : tags;

    return (
        <div className="tag-card-view">
            {tagsToRender.map((tag) => (
                <TagCard key={tag === 'addTag' ? 'addTag' : tag.id} tag={tag} knownCanAddTag={isEnrichedTag(tag) ? tag.userCanAddSubtag : undefined} selectTag={() => props.selectTag(tag)} />
            ))}
        </div>
    );
};
