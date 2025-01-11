export function createAttributeMap<E>(items: E[], keyAttribute: keyof E): Record<string | number, E>;
export function createAttributeMap<E>(items: E[], keyAttribute: keyof E, valueAttributeFilter: (keyof E)[]): Record<string | number, Partial<E>>;
export function createAttributeMap<E>(items: E[], keyAttribute: keyof E, valueAttributeFilter?: (keyof E)[]): Record<string | number, E> | Record<string | number, Partial<E>> {
    return items.reduce(
        (acc, item) => {
            const valueToSet = valueAttributeFilter ? valueAttributeFilter.reduce((acc, key) => ({ ...acc, [key]: item[key] }), {}) : item;
            if (typeof item[keyAttribute] !== 'string' && typeof item[keyAttribute] !== 'number') {
                throw new Error(`Key attribute is not a string or number: ${item[keyAttribute]}`);
            }
            acc[item[keyAttribute] as unknown as string | number] = valueToSet;
            const i = item[keyAttribute];
            return acc;
        },
        {} as Record<string | number, E> | Record<string | number, Partial<E>>
    );
}
