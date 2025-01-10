export * from './user';
export * from './userSettings';
export * from './game';
export * from './tag';

export interface BaseDto {
    id: string;
}

export type BaseDtoWithoutId<E extends BaseDto> = Omit<E, 'id'>;

export interface PrimitiveResponse<E> {
    result: E;
}
