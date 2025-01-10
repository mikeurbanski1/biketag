import { BaseDto } from '.';
import { TagStats } from '../common';
import { PublicUserDto } from './user';

// export interface MinimalTag extends BaseDto {
//     // name: string;
//     creator: Pick<UserDto, 'id' | 'name'>;
//     imageUrl: string;
//     postedDate: string;
// }

// export interface PendingTag extends BaseDto {
//     creator: Pick<UserDto, 'id' | 'name'>;
//     imageUrl: string; // only populated if the request is from the creator
//     imageData: string; // obfuscated image for all others
//     isPending: true;
// }

export interface TagDto extends BaseDto {
    // name: string;
    creator: PublicUserDto;
    gameId: string;
    parentTagId?: string;
    nextTagId?: string;
    rootTagId?: string;
    lastTagInChainId?: string; // only on root tag and only if there is a child
    isRoot: boolean;
    previousRootTagId?: string;
    nextRootTagId?: string;
    postedDate: string;
    forDate: string;
    imageUrl?: string; // only populated if the request is from the creator
    stats: TagStats;
    isPending: boolean;
    imageData?: string; // obfuscated image for all others
}
export type TagWithImage = Omit<TagDto, 'imageData'> & { imageUrl: string };
export type TagWithImageData = Omit<TagDto, 'imageUrl'> & { imageData: string };

export interface EnrichedTagDto extends TagDto {
    userCanAddSubtag: boolean;
}

export interface CreateTagDto {
    // name: string;
    gameId: string;
    rootTagId?: string;
    isRoot: boolean;
    imageUrl: string;
    postedDate?: string; // used for bootstrapping
}

export interface CreateTagParams extends CreateTagDto {
    creatorId: string;
}

export const tagFields = ['parentTagId', 'nextTagId', 'rootTagId', 'previousRootTagId', 'nextRootTagId', 'lastTagInChainId'] as const;
