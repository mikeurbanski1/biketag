import React from 'react';

// import { Logger } from '@biketag/utils';

interface TableProps<T extends Record<string, string | number>> {
    data: T[];
    // type attributes to 0-based column index
    columnMapping: { attribute: keyof T; header: string; defaultDescending?: boolean }[];
    initialSort: { column: keyof T; ascending: boolean };
    tableClassName?: string;
    numericColumns: number[];
}

// const logger = new Logger({ prefix: '[Table]' });

interface Sort {
    column: number;
    ascending: boolean;
}

export const Table: React.FC<TableProps<Record<string, string | number>>> = (props) => {
    const numColumns = Object.keys(props.columnMapping).length;
    const [sort, setSort] = React.useState<Sort>({
        column: props.columnMapping.findIndex((column) => column.attribute === props.initialSort.column),
        ascending: props.initialSort.ascending,
    });

    const tableData = props.data.map((row) => {
        const newRow = new Array<string | number>(numColumns);
        props.columnMapping.forEach((column, i) => {
            newRow[i] = row[column.attribute];
        });
        return newRow;
    });

    return (
        <div className={props.tableClassName}>
            <div className="row header">
                {Object.values(props.columnMapping).map((column, index) => (
                    <div
                        key={column.attribute.toString()}
                        className={`clickable-text cell ${sort.column === index ? 'sorted' : ''}`}
                        onClick={() => {
                            if (sort.column === index) {
                                setSort({ ...sort, ascending: !sort.ascending });
                            } else {
                                setSort({ column: index, ascending: column.defaultDescending ? false : true });
                            }
                        }}
                    >
                        <span>{column.header}</span>
                        <span>{sort.column === index ? (sort.ascending ? '▲' : '▼') : ''}</span>
                    </div>
                ))}
            </div>
            {tableData
                .sort((a, b) => {
                    const aVal = a[sort.column];
                    const bVal = b[sort.column];
                    if (typeof aVal === 'string' && typeof bVal === 'string') {
                        return sort.ascending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                    } else if (typeof aVal === 'number' && typeof bVal === 'number') {
                        return sort.ascending ? aVal - bVal : bVal - aVal;
                    } else {
                        throw new Error('sorting a mixed type column');
                    }
                })
                .map((row, rowIndex) => (
                    <div key={rowIndex} className="row">
                        {row.map((cell, colIndex) => (
                            <div key={colIndex} className="cell">
                                {cell}
                            </div>
                        ))}
                    </div>
                ))}
        </div>
    );
};
