import { Dayjs } from 'dayjs';
import { useParams } from 'react-router-dom';

import { GameDto, TagDto } from '@biketag/models';
import { Logger } from '@biketag/utils';

import { AddTag } from '../tag/addTag';
import { Tag } from '../tag/tag';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const logger = new Logger({});

interface TagViewProps {
    game: GameDto;
    dateOverride: Dayjs;
    currentRootTag?: TagDto;
    currentTag?: TagDto;
    userCanAddRootTag: boolean;
    userCanAddSubtag: boolean;
    showingAddRootTag: boolean;
    showingAddSubtag: boolean;
    showingPendingTag: boolean;
    createNewTag: ({ imageUrl, isSubtag }: { imageUrl: string; isSubtag: boolean }) => void;
    setAddTagAsActive: (isSubtag: boolean) => void;
    selectTag: (tag: TagDto) => void;
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
        selectThisTag = (tag: TagDto) => selectTag(tag);
    }
    return <Tag key={tagKey} tag={tag} isActive={isActive} selectTag={selectThisTag} knownUserCanAddTag={knownUserCanAddTag} />;
};

type RouteParams = {
    tagId: string;
};

export const TagScroller: React.FC<TagViewProps> = ({
    game,
    dateOverride,
    currentRootTag,
    currentTag,
    userCanAddRootTag,
    userCanAddSubtag,
    showingAddRootTag,
    showingAddSubtag,
    showingPendingTag,
    createNewTag,
    setAddTagAsActive,
    selectTag,
}: TagViewProps): React.ReactNode => {
    let centerTagElement: React.ReactNode | undefined = undefined;
    let leftTagElement: React.ReactNode | undefined = undefined;
    let rightTagElement: React.ReactNode | undefined = undefined;
    let topTagElement: React.ReactNode | undefined = undefined;
    let bottomTagElement: React.ReactNode | undefined = undefined;

    // const { tagId } = useParams() as RouteParams;

    const addRootTag = (
        <AddTag
            key="add-root-tag"
            saveTag={({ imageUrl: string }) => createNewTag({ imageUrl: string, isSubtag: false })}
            setAddTagAsActive={() => setAddTagAsActive(false)}
            isSubtag={false}
            dateOverride={dateOverride}
            isActive={showingAddRootTag}
            isFirstTag={!game.latestRootTag}
        />
    );

    const addSubtag = (
        <AddTag
            key="add-subtag"
            saveTag={({ imageUrl: string }) => createNewTag({ imageUrl: string, isSubtag: true })}
            setAddTagAsActive={() => setAddTagAsActive(true)}
            isSubtag={true}
            dateOverride={dateOverride}
            isActive={showingAddSubtag}
            isFirstTag={!currentRootTag?.nextTagId}
        />
    );

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
    } else if (showingPendingTag) {
        centerTagElement = getTagComponent({ tag: game.pendingRootTag!, isActive: true, selectTag });
        if (currentTag) {
            leftTagElement = getTagComponent({ tag: currentTag, isActive: false, selectTag, knownUserCanAddTag: userCanAddSubtag });
        }
    } else if (currentTag) {
        // showing an actual tag - this will always be true, but we have a type assertion now
        centerTagElement = getTagComponent({ tag: currentTag, isActive: true, selectTag });
        if (currentTag.isRoot) {
            if (currentTag.previousRootTagId) {
                leftTagElement = getTagComponent({ tag: currentTag.previousRootTagId, isActive: false, selectTag });
            }
            if (currentTag.id === game.latestRootTag!.id) {
                if (game.pendingRootTag) {
                    rightTagElement = getTagComponent({ tag: game.pendingRootTag, isActive: false, selectTag });
                } else if (userCanAddRootTag) {
                    rightTagElement = addRootTag;
                }
            } else if (currentTag.nextRootTagId) {
                rightTagElement = getTagComponent({ tag: currentTag.nextRootTagId, isActive: false, selectTag });
            }
            if (currentTag.nextTagId) {
                bottomTagElement = getTagComponent({ tag: currentTag.nextTagId, isActive: false, selectTag });
            } else if (userCanAddSubtag) {
                bottomTagElement = addSubtag;
            }
        } else {
            if (currentTag.parentTagId) {
                // knownUserCanAddTag will be set if the parent tag is the root tag
                topTagElement = getTagComponent({ tag: currentTag.parentTagId, isActive: false, selectTag, knownUserCanAddTag: userCanAddSubtag });
            }
            if (currentTag.nextTagId) {
                bottomTagElement = getTagComponent({ tag: currentTag.nextTagId, isActive: false, selectTag });
            } else if (userCanAddSubtag) {
                bottomTagElement = addSubtag;
            }
        }
    }

    // let topTagClass = 'top-tag';

    // if (!topTagElement) {
    //     // this should not be a card going off the top
    //     topTagElement = <GameHeader game={game} />;
    //     topTagClass = 'top-tag top-tag-header';
    // }

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
