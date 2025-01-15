import { Dayjs } from 'dayjs';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// import { useParams } from 'react-router-dom';

import { GameDto, TagDto } from '@biketag/models';
import { Logger } from '@biketag/utils';

// import { gameHasTag } from '@biketag/utils';

import { ApiManager } from '../../api';
import { UserContext } from '../common/context';
import { AddTag } from '../tag/addTag';
import { Tag } from '../tag/tag';

const logger = new Logger({ prefix: '' });

export interface NewTagScrollerProps {
    game: GameDto;
    userCanAddRootTag: boolean;
    dateOverride: Dayjs;
    createNewRootTagInGame: (tag: TagDto) => void;
    refreshUserCanAddTag: () => void;
}

const getTagComponent = ({
    tag,
    isActive,
    selectTag,
    activeTagIsLoaded,
    knownUserCanAddTag,
}: {
    tag: TagDto | string;
    isActive: boolean;
    selectTag?: (tag: TagDto) => void;
    activeTagIsLoaded?: (tag: TagDto) => void;
    knownUserCanAddTag?: boolean;
}): React.ReactNode => {
    let tagKey: string;
    if (isTag(tag)) {
        tagKey = tag.id;
    } else {
        tagKey = tag;
    }

    // let selectThisTag: ((tag: TagDto) => void) | undefined;

    // // if the tag is a real, not pending tag, then the callback actually selects it
    // if (!isActive) {
    //     selectThisTag = selectTag;
    // }
    return <Tag key={tagKey} tag={tag} isActive={isActive} selectTag={selectTag} activeTagIsLoaded={activeTagIsLoaded} knownUserCanAddTag={knownUserCanAddTag} />;
};

const getTagFromGame = ({ game, tagId }: { game: GameDto; tagId?: string }): TagDto | undefined => {
    if (!tagId) {
        return undefined;
    }
    return [game.latestRootTag, game.pendingRootTag, game.firstRootTag].find((tag) => tag && tag.id === tagId);
};

const isTag = (tag?: TagDto | string): tag is TagDto => typeof tag === 'object';
const isTagId = (tag: string) => tag !== 'addTag';

// const isSameTag = (tag1?: TagDto | string, tag2?: TagDto | string): boolean => {
//     if (!tag1 || !tag2) {
//         return false;
//     }
//     const tag1Id = isTag(tag1) ? tag1.id : tag1;
//     const tag2Id = isTag(tag2) ? tag2.id : tag2;
//     return tag1Id === tag2Id;
// };

export const NewTagScroller: React.FC<NewTagScrollerProps> = ({ game, dateOverride, userCanAddRootTag, refreshUserCanAddTag, createNewRootTagInGame }: NewTagScrollerProps) => {
    const { rootTagId, subtagId } = useParams() as { rootTagId: string; subtagId: string }; // can also be 'addTag'
    logger.info(`[NewTagScroller]`, { rootTagId, subtagId });

    const user = useContext(UserContext)!;

    const navigate = useNavigate();

    const [currentRootTag, setCurrentRootTag] = useState<TagDto | undefined>(isTagId(rootTagId) ? getTagFromGame({ game, tagId: rootTagId }) : game.latestRootTag);
    logger.info(`[NewTagScroller] currentRootTag`, { currentRootTag });
    const [currentTag, setCurrentTag] = useState<TagDto | string | undefined>(subtagId ?? currentRootTag);
    const [showingAddRootTag, setShowingAddRootTag] = useState(rootTagId === 'addTag');
    const [showingAddSubtag, setShowingAddSubtag] = useState(subtagId === 'addTag');
    const [userCanAddSubtag, setUserCanAddSubtag] = useState(false);

    logger.info(`[NewTagScroller] initialized state`, { currentRootTag, currentTag, showingAddRootTag, showingAddSubtag });

    useEffect(() => {
        if (rootTagId && !currentRootTag) {
            ApiManager.tagApi.getTag({ id: rootTagId }).then((tag) => {
                setCurrentRootTag(tag);
                if (!subtagId) {
                    setCurrentTag(tag);
                }
            });
        }
    }, [rootTagId, currentRootTag, subtagId]);

    useEffect(() => {
        if (currentRootTag && !currentRootTag.isPending) {
            ApiManager.tagApi.canUserAddSubtag({ userId: user.id, tagId: currentRootTag.id }).then(({ result }) => {
                setUserCanAddSubtag(result);
            });
        } else {
            setUserCanAddSubtag(false);
        }
    }, [currentRootTag, user.id]);

    const createNewSubtag = useCallback(
        ({ imageUrl }: { imageUrl: string }) => {
            ApiManager.tagApi.createTag({ imageUrl, gameId: game!.id, isRoot: false, rootTagId: currentRootTag!.id }).then((newTag) => {
                setUserCanAddSubtag(false);
                setCurrentTag(newTag);
                setShowingAddSubtag(false);
                if (newTag.rootTagId === game!.latestRootTag!.id) {
                    refreshUserCanAddTag();
                }
                navigate(`/home/game/${newTag.gameId}/scroller/${newTag.rootTagId!}/${newTag.id}`);
            });
        },
        [game, currentRootTag, navigate, refreshUserCanAddTag]
    );

    const createNewRootTag = useCallback(
        ({ imageUrl }: { imageUrl: string }) => {
            ApiManager.tagApi.createTag({ imageUrl, gameId: game!.id, isRoot: true }).then((newTag) => {
                setUserCanAddSubtag(false);
                setCurrentRootTag(newTag);
                setCurrentTag(newTag);
                createNewRootTagInGame(newTag);
                setShowingAddRootTag(false);
                navigate(`/home/game/${newTag.gameId}/scroller/${newTag.id}`);
            });
        },
        [createNewRootTagInGame, game, navigate]
    );

    const selectTag = useCallback(
        (tag: TagDto) => {
            setCurrentTag(tag);
            setShowingAddRootTag(false);
            setShowingAddSubtag(false);
            if (tag.isRoot) {
                setCurrentRootTag(tag);
                navigate(`/home/game/${tag.gameId}/scroller/${tag.id}`);
            } else {
                navigate(`/home/game/${tag.gameId}/scroller/${tag.rootTagId!}/${tag.id}`);
            }
        },
        [navigate]
    );

    const addRootTag = useMemo(
        () => (
            <AddTag
                key="add-root-tag"
                saveTag={createNewRootTag}
                setAddTagAsActive={() => {
                    setShowingAddRootTag(true);
                    navigate(`/home/game/${game.id}/scroller/addTag`);
                }}
                isSubtag={false}
                dateOverride={dateOverride}
                isActive={showingAddRootTag}
                isFirstTag={!game.latestRootTag}
            />
        ),
        [createNewRootTag, dateOverride, game.id, game.latestRootTag, navigate, showingAddRootTag]
    );

    const addSubtag = useMemo(
        () => (
            <AddTag
                key="add-subtag"
                saveTag={createNewSubtag}
                setAddTagAsActive={() => {
                    setShowingAddSubtag(true);
                    navigate(`/home/game/${game.id}/scroller/${currentRootTag!.id}/addTag`);
                }}
                isSubtag={true}
                dateOverride={dateOverride}
                isActive={showingAddSubtag}
                isFirstTag={!currentRootTag?.nextTagId}
            />
        ),
        [createNewSubtag, currentRootTag, dateOverride, game.id, navigate, showingAddSubtag]
    );

    let centerTagElement: React.ReactNode | undefined = undefined;
    let leftTagElement: React.ReactNode | undefined = undefined;
    let rightTagElement: React.ReactNode | undefined = undefined;
    let topTagElement: React.ReactNode | undefined = undefined;
    let bottomTagElement: React.ReactNode | undefined = undefined;

    if (showingAddRootTag) {
        centerTagElement = addRootTag;
        if (currentTag) {
            leftTagElement = getTagComponent({ tag: currentTag, isActive: false, knownUserCanAddTag: userCanAddSubtag, selectTag });
        }
    } else if (showingAddSubtag) {
        centerTagElement = addSubtag;
        if (currentTag) {
            topTagElement = getTagComponent({ tag: currentTag, isActive: false, knownUserCanAddTag: userCanAddSubtag, selectTag });
        }
    } else if (isTag(currentTag)) {
        logger.info(`[NewTagScroller] isTag`, { currentTag });
        // showing an actual tag - this will always be true, but we have a type assertion now
        centerTagElement = getTagComponent({ tag: currentTag, isActive: true });
        if (currentTag.isRoot) {
            if (currentTag.previousRootTagId) {
                leftTagElement = getTagComponent({ tag: getTagFromGame({ game, tagId: currentTag.previousRootTagId }) ?? currentTag.previousRootTagId, isActive: false, selectTag });
            }

            if (currentTag.nextRootTagId) {
                rightTagElement = getTagComponent({ tag: getTagFromGame({ game, tagId: currentTag.nextRootTagId }) ?? currentTag.nextRootTagId, isActive: false, selectTag });
            } else if (userCanAddRootTag) {
                rightTagElement = addRootTag;
            }
        } else {
            if (currentTag.parentTagId) {
                // knownUserCanAddTag will be set if the parent tag is the root tag
                topTagElement = getTagComponent({
                    tag: getTagFromGame({ game, tagId: currentTag.parentTagId }) ?? currentTag.parentTagId,
                    isActive: false,
                    knownUserCanAddTag: userCanAddSubtag,
                    selectTag,
                });
            }
        }

        if (currentTag.nextTagId) {
            bottomTagElement = getTagComponent({ tag: getTagFromGame({ game, tagId: currentTag.nextTagId }) ?? currentTag.nextTagId, isActive: false, selectTag });
        } else if (userCanAddSubtag) {
            bottomTagElement = addSubtag;
        }
    } else if (currentTag) {
        logger.info(`[NewTagScroller] is tag ID`, { currentTag });
        // load the tag and then we will set the others
        centerTagElement = getTagComponent({ tag: currentTag, isActive: true, activeTagIsLoaded: setCurrentTag });
    }

    return (
        <div className="tag-scroller">
            <div className="tag-scoller-tag top-tag">{topTagElement}</div>
            <div className="tag-scoller-tag left-tag">{leftTagElement}</div>
            <div className="tag-scoller-tag center-tag">{centerTagElement}</div>
            <div className="tag-scoller-tag right-tag">{rightTagElement}</div>
            <div className="tag-scoller-tag bottom-tag">{bottomTagElement}</div>
        </div>
    );
};
