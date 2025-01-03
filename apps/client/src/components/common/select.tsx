import React from 'react';

interface SelectProps<T> {
    value?: string;
    options?: T[];
    onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    toId: (value: T) => string;
    toName: (value: T) => string;
    noSelectionText?: string;
    loadingText?: string;
    placeholderText?: string;
    hidden?: boolean;
}

export const Select = <T,>(props: SelectProps<T>): React.ReactElement => {
    const { value, onChange, loadingText, placeholderText, toId, toName, hidden, noSelectionText } = props;
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
                    const id = toId(option);
                    return (
                        <option key={id} value={id}>
                            {toName(option)}
                        </option>
                    );
                })}
        </select>
    );
};
