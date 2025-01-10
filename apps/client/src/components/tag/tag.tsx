import dayjs from 'dayjs';
import React, { useContext, useEffect, useState } from 'react';

import { TagDto, tagHasRealImage } from '@biketag/models';
import { convertDateToRelativeDate, Logger } from '@biketag/utils';

import { DATETIME_FORMAT, TIME_READABLE_FORMAT } from '../../utils/consts';

import '../../styles/tag.css';

import { ApiManager } from '../../api';
import { UserContext } from '../common/context';

const logger = new Logger({});

type TagTypeWithId = TagDto | string;

interface TagProps {
    tag: TagTypeWithId; // string is a tagId
    isActive: boolean;
    selectTag?: (tag: TagDto) => void;
    knownUserCanAddTag?: boolean;
}

interface LoadingTagDefinedProps {
    tag: string;
}

interface RealActiveTagDefinedProps {
    tag: TagDto;
}

interface RealInactiveTagDefinedProps extends RealActiveTagDefinedProps {
    selectTag: (tag: TagDto) => void;
}

const isTagToLoad = (props: TagProps): props is TagProps & LoadingTagDefinedProps => typeof props.tag === 'string';
const isLoadedTag = (tag?: TagTypeWithId): tag is TagDto => typeof tag === 'object';
const isInactiveTag = (props: TagProps): props is TagProps & RealInactiveTagDefinedProps => !props.isActive;

const getTimeString = (tag: TagDto): string => {
    const forDate = dayjs(tag.forDate);
    const relativeDate = convertDateToRelativeDate(forDate);
    const timeFormat = dayjs(tag.postedDate).format(TIME_READABLE_FORMAT);
    const isPending = tag.isPending;
    // root tags just have the day (it is a little difficult to decide what to show for a time,
    // when the tag could be posted the day before or this day - the time is not relevant)
    return isPending ? 'Live at midnight!' : tag.isRoot ? relativeDate : `${relativeDate} — ${timeFormat}`;
};

export const Tag: React.FC<TagProps> = (props: TagProps): React.ReactNode => {
    logger.info(`[Tag] render()`, { props });
    const user = useContext(UserContext)!;
    const { knownUserCanAddTag } = props;

    // we are only displaying loading if we know we are getting a tag
    // if isLoading is true, tagToRender will be undefined, and vice versa
    // if we have a tag ID, we can also skip loading if we have the cached tag
    const tagToUse = isLoadedTag(props.tag) ? props.tag : ApiManager.tagApi.getTagFromCache({ id: props.tag as string });
    const [isLoading, setIsLoading] = useState<boolean>(!tagToUse && isTagToLoad(props));
    const [tagToRender, setTagToRender] = useState<TagTypeWithId | undefined>(tagToUse);
    const [userCanAddTag, setUserCanAddTag] = useState<boolean | undefined>(knownUserCanAddTag ?? undefined);

    useEffect(() => {
        if (isLoading) {
            ApiManager.tagApi.getTag({ id: props.tag as string }).then((tag) => {
                setIsLoading(false);
                setTagToRender(tag);
                if (userCanAddTag === undefined && tag && tag.isRoot) {
                    ApiManager.tagApi.canUserAddSubtag({ tagId: tag.id, userId: user.id }).then(({ result }) => {
                        setUserCanAddTag(result);
                    });
                }
            });
        } else if (userCanAddTag === undefined && isLoadedTag(tagToRender) && tagToRender.isRoot && !tagToRender.isPending) {
            ApiManager.tagApi.canUserAddSubtag({ tagId: tagToRender.id, userId: user.id }).then(({ result }) => {
                setUserCanAddTag(result);
            });
        }
    }, [isLoading, props.tag, tagToRender, user.id, userCanAddTag]);

    if (isLoading || (userCanAddTag === undefined && isLoadedTag(tagToRender) && tagToRender.isRoot && !tagToRender.isPending)) {
        logger.info(`[Tag]`, { userCanAddTag: userCanAddTag ?? 'undefined' });
        return <div className="tag loading">Loading...</div>;
        // } else if (isAddTag(tagToRender)) {
        //     if (!props.selectTag) {
        //         throw new Error('selectTag is required when isActive is false');
        //     }
        //     return <AddTag {...tagToRender} isActive={props.isActive} setAddTagAsActive={() => props.selectTag!(tagToRender)} />;
    } else if (isLoadedTag(tagToRender)) {
        const classes: string[] = ['tag'];
        let onClick: (() => void) | undefined = undefined;

        if (isInactiveTag(props)) {
            onClick = () => props.selectTag(tagToRender);
            classes.push('clickable-tag');
        }

        if (tagHasRealImage(tagToRender) && !tagToRender.isRoot) {
            classes.push('subtag');
        }

        if (tagToRender.creator.id === user.id) {
            classes.push('tag-creator');
        } else if (userCanAddTag || tagToRender.isPending) {
            classes.push('tag-incomplete');
        } else if (userCanAddTag === false) {
            classes.push('tag-complete');
        }

        const className = classes.join(' ');

        // if (!tagToRender.isPending || tagHasRealImage(tagToRender)) {
        // it is a regular tag with an image, or the pending tag but we are the creator of it
        logger.info(`[Tag] isFullTag`, { tagToRender });
        const timeString = getTimeString(tagToRender);

        const footer = (
            <div className="tag-footer">
                <div>{tagToRender.creator.name}</div>
                <div title={`Posted ${dayjs(tagToRender.postedDate).format(DATETIME_FORMAT)}`}>{timeString}</div>
                {/* <div>{tagWinner}</div> */}
            </div>
        );

        return (
            <div className={className} onClick={onClick}>
                <div className={`tag-image-container ${tagToRender.isPending ? 'pending-tag-image' : ''}`}>
                    <img className="tag-image" src={tagToRender.imageUrl ?? tagToRender.imageData}></img>
                </div>
                {footer}
            </div>
        );
    }
};
