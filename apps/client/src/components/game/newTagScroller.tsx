import { Dayjs } from 'dayjs';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';

// import { useParams } from 'react-router-dom';

import { GameDto, TagDto } from '@biketag/models';

// import { gameHasTag } from '@biketag/utils';

import { ApiManager } from '../../api';
import { UserContext } from '../common/context';
import { AddTag } from '../tag/addTag';
import { Tag } from '../tag/tag';

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
    knownUserCanAddTag,
}: {
    tag: TagDto | string;
    isActive: boolean;
    selectTag: (tag: TagDto) => void;
    knownUserCanAddTag?: boolean;
}): React.ReactNode => {
    let tagKey: string;
    if (!tag) {
        tagKey = 'undefined';
    } else if (typeof tag === 'object') {
        tagKey = `tag-${tag.id}`;
    } else {
        tagKey = `id-${tag}`;
    }

    let selectThisTag: ((tag: TagDto) => void) | undefined;

    // if the tag is a real, not pending tag, then the callback actually selects it
    if (!isActive) {
        selectThisTag = selectTag;
    }
    return <Tag key={tagKey} tag={tag} isActive={isActive} selectTag={selectThisTag} knownUserCanAddTag={knownUserCanAddTag} />;
};

// const getTagFromGame = ({ game, tagId }: { game: GameDto; tagId?: string }): TagDto | undefined => {
//     if (!tagId) {
//         return undefined;
//     }
//     return [game.latestRootTag, game.pendingRootTag, game.firstRootTag].find((tag) => tag && tag.id === tagId);
// };

// const isTag = (tag?: TagDto | string): tag is TagDto => typeof tag === 'object';

// const isSameTag = (tag1?: TagDto | string, tag2?: TagDto | string): boolean => {
//     if (!tag1 || !tag2) {
//         return false;
//     }
//     const tag1Id = isTag(tag1) ? tag1.id : tag1;
//     const tag2Id = isTag(tag2) ? tag2.id : tag2;
//     return tag1Id === tag2Id;
// };

export const NewTagScroller: React.FC<NewTagScrollerProps> = ({ game, dateOverride, userCanAddRootTag, refreshUserCanAddTag, createNewRootTagInGame }: NewTagScrollerProps) => {
    // const { tagId } = useParams() as { tagId: string };
    const user = useContext(UserContext)!;

    const [currentRootTag, setCurrentRootTag] = useState<TagDto | undefined>(game.latestRootTag);
    const [currentTag, setCurrentTag] = useState<TagDto | undefined>(game.latestRootTag);
    const [showingAddRootTag, setShowingAddRootTag] = useState(game.latestRootTag === undefined);
    const [showingAddSubtag, setShowingAddSubtag] = useState(false);
    const [userCanAddSubtag, setUserCanAddSubtag] = useState(false);

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
            });
        },
        [game, refreshUserCanAddTag, currentRootTag]
    );

    const createNewRootTag = useCallback(
        ({ imageUrl }: { imageUrl: string }) => {
            ApiManager.tagApi.createTag({ imageUrl, gameId: game!.id, isRoot: true }).then((newTag) => {
                setUserCanAddSubtag(false);
                setShowingAddRootTag(false);
                setCurrentRootTag(newTag);
                setCurrentTag(newTag);
                createNewRootTagInGame(newTag);
            });
        },
        [createNewRootTagInGame, game]
    );

    // handles when an actual tag in the scroller is selected
    const selectTag = useCallback(
        (tag: TagDto) => {
            // we are scrolling from an actual tag to another actual tag
            // (otherwise we are coming back from an add tag)
            if (currentTag && tag.id !== currentTag?.id) {
                setCurrentTag(tag);
                if (tag.isRoot) {
                    setCurrentRootTag(tag);
                }
            }

            setShowingAddRootTag(false);
            setShowingAddSubtag(false);
        },
        [currentTag]
    );

    const addRootTag = useMemo(
        () => (
            <AddTag
                key="add-root-tag"
                saveTag={createNewRootTag}
                setAddTagAsActive={() => setShowingAddRootTag(true)}
                isSubtag={false}
                dateOverride={dateOverride}
                isActive={showingAddRootTag}
                isFirstTag={!game.latestRootTag}
            />
        ),
        [createNewRootTag, dateOverride, game.latestRootTag, showingAddRootTag]
    );

    const addSubtag = useMemo(
        () => (
            <AddTag
                key="add-subtag"
                saveTag={createNewSubtag}
                setAddTagAsActive={() => setShowingAddSubtag(true)}
                isSubtag={true}
                dateOverride={dateOverride}
                isActive={showingAddSubtag}
                isFirstTag={!currentRootTag?.nextTagId}
            />
        ),
        [createNewSubtag, currentRootTag, dateOverride, showingAddSubtag]
    );

    let centerTagElement: React.ReactNode | undefined = undefined;
    let leftTagElement: React.ReactNode | undefined = undefined;
    let rightTagElement: React.ReactNode | undefined = undefined;
    let topTagElement: React.ReactNode | undefined = undefined;
    let bottomTagElement: React.ReactNode | undefined = undefined;

    if (showingAddRootTag) {
        centerTagElement = addRootTag;
        if (currentTag) {
            leftTagElement = getTagComponent({ tag: currentTag, isActive: false, selectTag, knownUserCanAddTag: userCanAddSubtag });
        }
    } else if (showingAddSubtag) {
        centerTagElement = addSubtag;
        if (currentTag) {
            topTagElement = getTagComponent({ tag: currentTag, isActive: false, selectTag, knownUserCanAddTag: userCanAddSubtag });
        }
    } else if (currentTag) {
        // showing an actual tag - this will always be true, but we have a type assertion now
        centerTagElement = getTagComponent({ tag: currentTag, isActive: true, selectTag });
        if (currentTag.isRoot) {
            if (currentTag.previousRootTagId) {
                leftTagElement = getTagComponent({ tag: currentTag.previousRootTagId, isActive: false, selectTag });
            }

            if (currentTag.nextRootTagId) {
                rightTagElement = getTagComponent({ tag: currentTag.nextRootTagId, isActive: false, selectTag });
            } else if (userCanAddRootTag) {
                rightTagElement = addRootTag;
            }
        } else {
            if (currentTag.parentTagId) {
                // knownUserCanAddTag will be set if the parent tag is the root tag
                topTagElement = getTagComponent({ tag: currentTag.parentTagId, isActive: false, selectTag, knownUserCanAddTag: userCanAddSubtag });
            }
        }

        if (currentTag.nextTagId) {
            bottomTagElement = getTagComponent({ tag: currentTag.nextTagId, isActive: false, selectTag });
        } else if (userCanAddSubtag) {
            bottomTagElement = addSubtag;
        }
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
