import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export function isSameDate(date1: Dayjs, date2: Dayjs): boolean;
export function isSameDate(date1: string, date2: string): boolean;
export function isSameDate(date1: Dayjs, date2: string): boolean;
export function isSameDate(date1: string, date2: Dayjs): boolean;
export function isSameDate(date1: Dayjs | string, date2: Dayjs | string): boolean {
    if (typeof date1 === 'string') {
        date1 = dayjs(date1);
    }
    if (typeof date2 === 'string') {
        date2 = dayjs(date2);
    }
    return date1.format('YYYY-MM-DD') === date2.format('YYYY-MM-DD');
}

export function isEarlierDate(date1: Dayjs, date2: Dayjs): boolean;
export function isEarlierDate(date1: string, date2: string): boolean;
export function isEarlierDate(date1: Dayjs, date2: string): boolean;
export function isEarlierDate(date1: string, date2: Dayjs): boolean;
export function isEarlierDate(date1: Dayjs | string, date2: Dayjs | string): boolean {
    if (typeof date1 === 'string') {
        date1 = dayjs(date1);
    }
    if (typeof date2 === 'string') {
        date2 = dayjs(date2);
    }
    return date1.format('YYYY-MM-DD') < date2.format('YYYY-MM-DD');
}

export function isLaterDate(date1: Dayjs, date2: Dayjs): boolean;
export function isLaterDate(date1: string, date2: string): boolean;
export function isLaterDate(date1: Dayjs, date2: string): boolean;
export function isLaterDate(date1: string, date2: Dayjs): boolean;
export function isLaterDate(date1: Dayjs | string, date2: Dayjs | string): boolean {
    if (typeof date1 === 'string') {
        date1 = dayjs(date1);
    }
    if (typeof date2 === 'string') {
        date2 = dayjs(date2);
    }
    return date1.format('YYYY-MM-DD') > date2.format('YYYY-MM-DD');
}

export function getDateOnly(date: Dayjs): Dayjs;
export function getDateOnly(date: string): Dayjs;
export function getDateOnly(date: string | Dayjs): Dayjs {
    return (typeof date === 'string' ? dayjs(date) : date).startOf('day');
}

export function convertDateToRelativeDate(date: string): string;
export function convertDateToRelativeDate(date: Dayjs): string;
export function convertDateToRelativeDate(date: Dayjs | string): string {
    if (typeof date === 'string') {
        date = dayjs(date);
    }
    const now = dayjs().set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0);
    const dateDay = dayjs(date).set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0);
    const diff = now.diff(date, 'day');

    if (diff === -1) {
        return 'Tomorrow';
    } else if (diff === 0) {
        return 'Today';
    } else if (diff === 1) {
        return 'Yesterday';
    } else if (diff < 5) {
        return date.format('dddd');
    } else {
        return date.format('MM/DD/YYYY');
    }
}
