import React from 'react';

interface SelectProps<T extends { id: string; name: string } | string> {
    value?: string;
    options?: T[];
    onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    noSelectionText?: string;
    loadingText?: string;
    placeholderText?: string;
    hidden?: boolean;
}

// type SelectProps<T> = (T extends Record<string, unknown>)

export const Select = <T extends { id: string; name: string } | string>(props: SelectProps<T>): React.ReactElement => {
    const { value, onChange, loadingText, placeholderText, hidden, noSelectionText } = props;
    let { options } = props;

    if (options?.length === 0) {
        options = undefined;
    }

    const placeholderOption =
        (!options && loadingText) || (options && placeholderText) ? (
            <option hidden value={undefined}>
                {!options ? loadingText : placeholderText}
            </option>
        ) : undefined;

    const noSelectionOption = noSelectionText ? <option value={undefined}>{noSelectionText}</option> : undefined;

    return (
        <select hidden={hidden ?? false} value={value} onChange={onChange}>
            {placeholderOption}
            {options && noSelectionOption}
            {options &&
                options.map((option) => {
                    const id = typeof option === 'string' ? option : option.id;
                    return (
                        <option key={id} value={id}>
                            {typeof option === 'string' ? option : option.name}
                        </option>
                    );
                })}
        </select>
    );
};
