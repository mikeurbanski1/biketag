import { useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';

// thanks to https://www.react-graph-gallery.com/histogram
// and https://stackoverflow.com/questions/13576906/d3-tick-marks-on-integers-only/56821215#56821215

const MARGIN = { top: 30, right: 30, bottom: 40, left: 50 };
const BUCKET_NUMBER = 11;
const BUCKET_PADDING = 1;

type HistogramProps = {
    width: number;
    height: number;
    data: number[];
};

export const Histogram = ({ width, height, data }: HistogramProps) => {
    console.log(data);
    const axesRef = useRef(null);
    const boundsWidth = width - MARGIN.right - MARGIN.left;
    const boundsHeight = height - MARGIN.top - MARGIN.bottom;

    const xScale = useMemo(() => {
        return d3.scaleLinear().domain([-5, 5]).range([0, boundsWidth]);
    }, [data, width]);

    console.log('xScale.ticks(BUCKET_NUMBER)');
    console.log(xScale.ticks(BUCKET_NUMBER));

    const buckets = useMemo(() => {
        const bucketGenerator = d3
            .bin()
            .value((d) => d)
            .domain(xScale.domain() as [number, number])
            .thresholds(xScale.ticks(BUCKET_NUMBER));
        return bucketGenerator(data);
    }, [xScale]);

    console.log('buckets');
    console.log(buckets);
    const max = Math.max(...buckets.map((bucket) => bucket?.length));

    const yScale = useMemo(() => {
        return d3.scaleLinear().domain([max, 0]).range([0, boundsHeight]).nice();
    }, [data, height]);

    console.log('yScale');
    console.log(yScale);

    // Render the X axis using d3.js, not react
    useEffect(() => {
        const svgElement = d3.select(axesRef.current);
        svgElement.selectAll('*').remove();

        const xAxisGenerator = d3.axisBottom(xScale);
        svgElement
            .append('g')
            .attr('transform', 'translate(15,' + boundsHeight + ')')
            .call(xAxisGenerator);

        const yAxisTicks = yScale.ticks().filter((tick) => Number.isInteger(tick));

        const yAxisGenerator = d3.axisLeft(yScale).tickValues(yAxisTicks).tickFormat(d3.format('d'));
        svgElement.append('g').call(yAxisGenerator);

        svgElement.selectAll('path,line').remove();
    }, [xScale, yScale, boundsHeight]);

    const allRects = buckets.map((bucket, i) => {
        return (
            <rect
                key={i}
                fill="#69b3a2"
                x={xScale(bucket.x0!) + BUCKET_PADDING / 2}
                width={xScale(bucket.x1!) - xScale(bucket.x0!) - BUCKET_PADDING}
                y={yScale(bucket.length)}
                height={boundsHeight - yScale(bucket.length)}
            />
        );
    });

    console.log(allRects);

    return (
        <svg width={width} height={height}>
            <g width={boundsWidth} height={boundsHeight} transform={`translate(${[MARGIN.left, MARGIN.top].join(',')})`}>
                {allRects}
            </g>
            <g width={boundsWidth} height={boundsHeight} ref={axesRef} transform={`translate(${[MARGIN.left, MARGIN.top].join(',')})`} />
        </svg>
    );
};
