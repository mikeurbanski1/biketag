import { describe, expect, it } from 'vitest';

import { addIfMissing, copyDefinedProperties, deleteArrayPrimitive, isNumeric, mapToRecord, parseIfInteger } from '../src';

describe('utils tests', () => {
    it('should convert a map to a record', () => {
        expect(
            mapToRecord(
                new Map([
                    ['a', 1],
                    ['b', 2],
                ])
            )
        ).toEqual({ a: 1, b: 2 });
    });

    it('should parse an integer or return undefined', async () => {
        expect(parseIfInteger('1')).toBe(1);
        expect(parseIfInteger('1.1')).toBe(undefined);
        expect(parseIfInteger('a')).toBe(undefined);
    });

    it('delete an item from an array', async () => {
        const arr = [1, 2, 3];
        expect(deleteArrayPrimitive(arr, 2)).toBe(true);
        expect(arr).toEqual([1, 3]);
        expect(deleteArrayPrimitive(arr, 2)).toBe(false);
        expect(arr).toEqual([1, 3]);
    });

    it('should add an item to an array if it is not contained', async () => {
        const arr = [1, 2, 3];
        expect(addIfMissing(arr, 2)).toBe(false);
        expect(arr).toEqual([1, 2, 3]);
        expect(addIfMissing(arr, 4)).toBe(true);
        expect(arr).toEqual([1, 2, 3, 4]);
    });

    it('should copy the defined properties of the object', async () => {
        const obj = { a: 1, b: 2, c: undefined };
        expect(copyDefinedProperties(obj)).toEqual({ a: 1, b: 2 });
        expect(copyDefinedProperties(obj, ['a'])).toEqual({ a: 1 });
        expect(copyDefinedProperties(obj, ['a', 'c'])).toEqual({ a: 1 });
    });

    it('should test if a value is numeric', async () => {
        expect(isNumeric('1')).toBe(true);
        expect(isNumeric(1)).toBe(true);
        expect(isNumeric('1.1')).toBe(true);
        expect(isNumeric('a')).toBe(false);
        expect(isNumeric('1a')).toBe(false);
    });
});
