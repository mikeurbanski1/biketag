import dayjs from 'dayjs';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { convertDateToRelativeDate, getDateOnly, isEarlierDate, isLaterDate, isSameDate } from '../src';

describe('date utils tests', () => {
    beforeAll(() => {
        vi.useFakeTimers();
    });

    afterAll(() => {
        vi.useRealTimers();
    });

    it('should determine whether two dates are the same day', () => {
        // some basic checks
        expect(isSameDate('2021-01-01', '2021-01-01')).toEqual(true);
        expect(isSameDate('2021-01-01', '2021-01-02')).toEqual(false);
        expect(isSameDate('2021-01-01', '2021-02-01')).toEqual(false);
        expect(isSameDate('2021-01-01', '2022-01-01')).toEqual(false);

        // messing with datetimes
        expect(isSameDate('2021-01-01T12:00:00', '2021-01-01')).toEqual(true);
        expect(isSameDate('2021-01-01T12:00:00', '2021-01-02')).toEqual(false);

        // messing with time zones
        expect(isSameDate('2021-01-01T05:00:00Z', '2021-01-01')).toEqual(false);
        expect(isSameDate('2021-01-01T03:00:00Z', '2021-01-01T00:00:00')).toEqual(false);
        expect(isSameDate('2021-01-01T00:00:00Z', '2021-01-01T00:00:00+00:00')).toEqual(true);
        expect(isSameDate('2021-01-01T00:00:00Z', '2021-01-01T00:00:00+01:00')).toEqual(true);
    });

    it('should determine whether one date is earlier than another', () => {
        // some basic checks
        expect(isEarlierDate('2021-01-01', '2021-01-01')).toEqual(false);
        expect(isEarlierDate('2021-01-01', '2021-01-02')).toEqual(true);

        // datetimes
        expect(isEarlierDate('2021-01-01T03:00:00', '2021-01-01T04:00:00')).toEqual(false);
        expect(isEarlierDate('2021-01-01T12:00:00', '2021-01-01')).toEqual(false);
        expect(isEarlierDate('2021-01-01T12:00:00', '2021-01-02')).toEqual(true);

        // time zones
        expect(isEarlierDate('2021-01-01T05:00:00Z', '2021-01-01')).toEqual(true);
        expect(isEarlierDate('2021-01-01T03:00:00Z', '2021-01-01T00:00:00')).toEqual(true);
        expect(isEarlierDate('2021-01-01T00:00:00Z', '2021-01-01T00:00:00+00:00')).toEqual(false);
        expect(isEarlierDate('2021-01-01T00:00:00Z', '2021-01-01T00:00:00+01:00')).toEqual(false);
    });

    it('should determine whether one date is later than another', () => {
        // some basic checks
        expect(isLaterDate('2021-01-01', '2021-01-01')).toEqual(false);
        expect(isLaterDate('2021-01-03', '2021-01-02')).toEqual(true);

        // datetimes
        expect(isLaterDate('2021-01-01T03:00:00', '2021-01-01T04:00:00')).toEqual(false);
        expect(isLaterDate('2021-01-01T12:00:00', '2021-01-02')).toEqual(false);
        expect(isLaterDate('2021-01-03T12:00:00', '2021-01-02')).toEqual(true);

        // time zones
        expect(isLaterDate('2021-01-01', '2021-01-01T05:00:00Z')).toEqual(true);
        expect(isLaterDate('2021-01-02T03:00:00Z', '2021-01-01T00:00:00')).toEqual(false);
        expect(isLaterDate('2021-01-01T00:00:00Z', '2021-01-01T00:00:00+00:00')).toEqual(false);
        expect(isLaterDate('2021-01-01T00:00:00Z', '2021-01-01T00:00:00+01:00')).toEqual(false);
    });

    it('should get the date only', () => {
        expect(getDateOnly('2021-01-01T12:00:00')).toEqual(dayjs('2021-01-01T00:00:00'));
    });

    it('should generate a friendly string for a relative date', () => {
        vi.setSystemTime('2025-01-01T12:00:00'); // Wednesday
        expect(convertDateToRelativeDate('2025-01-01')).toEqual('Today');
        expect(convertDateToRelativeDate('2025-01-02')).toEqual('Tomorrow');
        expect(convertDateToRelativeDate('2024-12-31')).toEqual('Yesterday');
        expect(convertDateToRelativeDate('2024-12-30')).toEqual('Monday');
        expect(convertDateToRelativeDate('2024-12-29')).toEqual('Sunday');
        expect(convertDateToRelativeDate('2024-12-28')).toEqual('Saturday');
        expect(convertDateToRelativeDate('2024-12-27')).toEqual('12/27/2024');

        expect(convertDateToRelativeDate('2025-01-01', false)).toEqual('today');
        expect(convertDateToRelativeDate('2025-01-02', false)).toEqual('tomorrow');
        expect(convertDateToRelativeDate('2024-12-31', false)).toEqual('yesterday');
        expect(convertDateToRelativeDate('2024-12-30', false)).toEqual('Monday');
        expect(convertDateToRelativeDate('2024-12-29', false)).toEqual('Sunday');
        expect(convertDateToRelativeDate('2024-12-28', false)).toEqual('Saturday');
        expect(convertDateToRelativeDate('2024-12-27', false)).toEqual('12/27/2024');
    });
});
