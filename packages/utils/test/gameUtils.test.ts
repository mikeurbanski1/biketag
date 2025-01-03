import dayjs from 'dayjs';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { GameDto, TagDto } from '@biketag/models';

import { convertDateToRelativeDate, gameHasTag, getDateOnly, isEarlierDate, isLaterDate, isSameDate } from '../src';

describe('game utils tests', () => {
    it('should check if a game has a tag', () => {
        expect(gameHasTag({} as GameDto)).toEqual(false);
        expect(gameHasTag({ latestRootTag: {} as TagDto } as GameDto)).toEqual(true);
    });
});
