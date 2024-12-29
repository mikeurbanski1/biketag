import React, { useEffect } from 'react';

import { GameDto, PendingTag, TagDto } from '@biketag/models';
import { gameHasTag, Logger } from '@biketag/utils';

import { ApiManager } from '../../api';
import { TagCard } from '../tag/tagCard';

const logger = new Logger({ prefix: '' });

type TagCardType = TagDto | PendingTag | 'addTag';

interface TagCardProps {
    game: GameDto;
    userCanAddRootTag?: boolean;
    selectTag: (tag: TagCardType) => void;
}

export const TagCardView: React.FC<TagCardProps> = (props) => {
    const instanceId = Math.random();
    logger.info(`[TagCardView] start`, { instanceId, props });
    const { game, userCanAddRootTag } = props;
    const { pendingRootTag } = game;

    let initLoading = true;
    const initTags: TagCardType[] = [];

    // if there are two or fewer tags (ignoring pending tag), then we know all of them from the game itself and do not need to load
    // otherwise we will load everything and display it together later
    if (!gameHasTag(game) || game.latestRootTag.id === game.firstRootTag.id || game.latestRootTag.id === game.firstRootTag.nextRootTagId) {
        logger.info(`[TagCardView] in skip loading`, { instanceId });
        initLoading = false;

        if (gameHasTag(game)) {
            const { firstRootTag, latestRootTag } = game;
            initTags.push(latestRootTag);
            if (firstRootTag && firstRootTag.id !== latestRootTag.id) {
                initTags.push(firstRootTag);
            }
        }
    }

    const [loading, setLoading] = React.useState(initLoading);
    const [tags, setTags] = React.useState<TagCardType[]>(initTags);
    const [refreshKey] = React.useState(0);

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
    }, [refreshKey, game.id, game.pendingRootTag, loading]);

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
                <TagCard key={tag === 'addTag' ? 'addTag' : tag.id} tag={tag} selectTag={() => props.selectTag(tag)} />
            ))}
        </div>
    );
};
