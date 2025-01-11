import { AxiosError } from 'axios';
import { Dayjs } from 'dayjs';

import { CreateTagDto, EnrichedTagDto, PrimitiveResponse, TagDto } from '@biketag/models';

import { AbstractApi } from './abstractApi';

export class TagNotFoundError extends Error {}

export class TagApi extends AbstractApi {
    private tagCache: Record<string, TagDto> = {};
    //userId to gameId to result
    private userCanAddRootTagCache: Record<string, Record<string, boolean>> = {};
    // userId to tagId (root tag) to result
    private userCanAddSubtagCache: Record<string, Record<string, boolean>> = {};

    constructor() {
        super({ logPrefix: '[TagApi]' });
    }

    public clearCache(): void {
        this.tagCache = {};
    }

    public getTagFromCache({ id }: { id: string }): TagDto | undefined {
        return this.tagCache[id];
    }

    public updateTagInCache({ tagId, update }: { tagId?: string; update: Partial<TagDto> }): void {
        if (!tagId) {
            return;
        }
        const tag = this.tagCache[tagId];
        if (!tag) {
            return;
        }
        this.tagCache[tag.id] = { ...tag, ...update };
    }

    public async getTag({ id }: { id?: string }): Promise<TagDto | undefined> {
        if (!id) {
            return undefined;
        }

        const cachedTag = this.tagCache[id];
        this.logger.info(`[getTag] cached tag`, { cachedTag });

        // get from the cache if tag links are already set;
        // if not, they might be updated, so we will re-fetch it
        if (cachedTag) {
            return this.tagCache[id];
        }

        try {
            const resp = await this.axiosInstance.request<TagDto>({
                method: 'get',
                url: `/tags/${id}`,
            });
            if (resp.status !== 200) {
                throw new Error(`Unexpected response: ${resp.status} - ${resp.statusText}`);
            }
            this.logger.info('[getTag] got tag', { data: resp.data });
            const tag = resp.data;
            this.tagCache[id] = tag;
            return tag;
        } catch (err) {
            this.logger.error(`[getTag] got an error response`, { err });
            if (err instanceof AxiosError) {
                if (err.status === 404) {
                    throw new TagNotFoundError(err.message);
                }
            }
            throw err;
        }
    }

    public async canUserAddTag({ userId, gameId, dateOverride }: { userId: string; gameId: string; dateOverride?: Dayjs }): Promise<PrimitiveResponse<boolean>> {
        if (userId in this.userCanAddRootTagCache && gameId in this.userCanAddRootTagCache[userId]) {
            return { result: this.userCanAddRootTagCache[userId][gameId] };
        }
        try {
            const resp = await this.axiosInstance.request<{ result: boolean }>({
                method: 'get',
                url: `/tags/user/${userId}/game/${gameId}/can-post-new-tag`,
                params: dateOverride ? { dateOverride: dateOverride.toISOString() } : {},
            });
            if (resp.status !== 200) {
                throw new Error(`Unexpected response: ${resp.status} - ${resp.statusText}`);
            }
            const { result } = resp.data;
            if (userId in this.userCanAddRootTagCache) {
                this.userCanAddRootTagCache[userId][gameId] = result;
            } else {
                this.userCanAddRootTagCache[userId] = { [gameId]: result };
            }
            this.logger.info('[canUserAddTag] got response', { data: resp.data });
            return { result };
        } catch (err) {
            this.logger.error(`[canUserAddTag] got an error response`, { err });
            throw err;
        }
    }

    public async canUserAddSubtag({ userId, tagId }: { userId: string; tagId: string }): Promise<PrimitiveResponse<boolean>> {
        if (userId in this.userCanAddSubtagCache && tagId in this.userCanAddSubtagCache[userId]) {
            return { result: this.userCanAddSubtagCache[userId][tagId] };
        }
        try {
            const resp = await this.axiosInstance.request<{ result: boolean }>({
                method: 'get',
                url: `/tags/user/${userId}/can-add-subtag/${tagId}`,
            });
            if (resp.status !== 200) {
                throw new Error(`Unexpected response: ${resp.status} - ${resp.statusText}`);
            }
            const { result } = resp.data;
            if (userId in this.userCanAddSubtagCache) {
                this.userCanAddSubtagCache[userId][tagId] = result;
            } else {
                this.userCanAddSubtagCache[userId] = { [tagId]: result };
            }
            this.logger.info('[canUserAddSubtag] got response', { data: resp.data });
            return { result };
        } catch (err) {
            this.logger.error(`[canUserAddSubtag] got an error response`, { err });
            throw err;
        }
    }

    public async createTag(params: CreateTagDto): Promise<TagDto> {
        try {
            const resp = await this.axiosInstance.request<TagDto>({
                method: 'post',
                url: '/tags',
                data: params,
            });
            if (resp.status !== 201) {
                throw new Error(`Unexpected response: ${resp.status} - ${resp.statusText}`);
            }
            this.logger.info('[createTag] got 201 response', { data: resp.data });
            const newTag = resp.data;
            this.tagCache[newTag.id] = newTag;

            if (newTag.isRoot) {
                this.updateTagInCache({
                    tagId: newTag.previousRootTagId,
                    update: { nextRootTagId: newTag.id },
                });
                this.userCanAddRootTagCache[newTag.creator.id] = { [newTag.gameId]: false };
            } else {
                this.updateTagInCache({
                    tagId: newTag.parentTagId,
                    update: { nextTagId: newTag.id },
                });
                this.updateTagInCache({
                    tagId: newTag.rootTagId,
                    update: { lastTagInChainId: newTag.id },
                });
                this.userCanAddSubtagCache[newTag.creator.id] = { [newTag.rootTagId!]: false };
            }

            return resp.data;
        } catch (err) {
            this.logger.error(`[createTag] got an error response`, { err });
            throw err;
        }
    }

    public async getRootTagsForGame({ gameId }: { gameId: string }): Promise<EnrichedTagDto[]> {
        try {
            const tags = await this.getWithPaging<EnrichedTagDto>({
                config: {
                    method: 'get',
                    url: `/tags/game/${gameId}/root-tags?enrich=true`,
                },
            });
            tags.forEach((tag) => {
                this.tagCache[tag.id] = tag;
            });
            return tags;
        } catch (err) {
            this.logger.error(`[getTagsForGame] got an error response`, { err });
            throw err;
        }
    }
}
