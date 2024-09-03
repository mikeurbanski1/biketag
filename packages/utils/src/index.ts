import { Logger, LogLevel } from './logger';

export const mapToRecord = <T>(map: Map<string, T>): Record<string, T> => {
    const retVal: Record<string, T> = {};

    for (const [key, val] of map.entries()) {
        retVal[key] = val;
    }

    return retVal;
};

export const shuffleArray = <E>(array: E[]): E[] => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
};

export const parseIfInteger = (n: string) => (parseInt(n).toString() === n ? parseInt(n) : undefined);

export { Logger, LogLevel };
