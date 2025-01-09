import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { isRootTag, isSubtag, TagDto, tagHasRealImage } from '../src';

describe('type guard tests', () => {
    it('should test if a tag has a real image', async () => {
        expect(tagHasRealImage({ imageUrl: 'test' } as TagDto)).toBe(true);
        expect(tagHasRealImage({ imageData: 'test' } as TagDto)).toBe(false);
    });

    it('should test if a tag is a subtag', async () => {
        expect(isSubtag({ isRoot: false } as TagDto)).toBe(true);
        expect(isSubtag({ isRoot: true } as TagDto)).toBe(false);
    });

    it('should test if a tag is a root tag', async () => {
        expect(isRootTag({ isRoot: false } as TagDto)).toBe(false);
        expect(isRootTag({ isRoot: true } as TagDto)).toBe(true);
    });
});
