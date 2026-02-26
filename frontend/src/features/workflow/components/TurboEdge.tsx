import React from 'react';
import {
    BaseEdge,
    EdgeProps,
    getBezierPath,
} from '@xyflow/react';

export const TurboEdge = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    selected,
}: EdgeProps) => {
    const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    return (
        <>
            <BaseEdge
                id={id}
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    ...style,
                    stroke: selected ? 'url(#edge-gradient-selected)' : 'url(#edge-gradient)',
                    strokeWidth: selected ? 4 : 2.5,
                    opacity: selected ? 1 : 0.6,
                    transition: 'all 0.3s ease',
                }}
            />

            {/* Visual node connection points */}
            <circle r="4" fill="#9333ea" cx={sourceX} cy={sourceY} className="pointer-events-none shadow-[0_0_10px_rgba(147,51,234,0.5)]" />
            <circle r="4" fill="#3b82f6" cx={targetX} cy={targetY} className="pointer-events-none shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
        </>
    );
};
