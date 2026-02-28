import React from 'react';
import { BaseEdge, EdgeProps, getBezierPath } from '@xyflow/react';
import './turbo-style.css';

const TurboEdge = ({
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
    data,
}: EdgeProps) => {
    const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    // Support for custom logic colors (e.g. True/False branches)
    const edgeColor = (data as any)?.color || 'url(#turbo-edge-gradient)';
    const glowColor = (data as any)?.color ? `${(data as any).color}4D` : 'rgba(139, 92, 246, 0.3)';

    return (
        <>
            {/* Glow Effect Underlying Line */}
            <BaseEdge
                id={id + '-glow'}
                path={edgePath}
                style={{
                    stroke: selected ? glowColor : 'transparent',
                    strokeWidth: 10,
                    strokeLinecap: 'round',
                    filter: 'blur(5px)'
                }}
            />

            {/* Definition for the Gradient (Invisible SVG) */}
            <svg style={{ position: 'absolute', width: 0, height: 0 }}>
                <defs>
                    <linearGradient id="turbo-edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="50%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                </defs>
            </svg>

            {/* Actual Edge Line */}
            <BaseEdge
                id={id}
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    strokeWidth: selected ? 3 : 2,
                    stroke: edgeColor,
                    opacity: selected ? 1 : 0.6,
                    ...style,
                }}
                className={selected ? 'turbo-edge-path' : ''}
            />
        </>
    );
};

export default TurboEdge;
