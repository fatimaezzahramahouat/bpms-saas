import { motion } from 'motion/react';

/**
 * Checkerboard Transition Component
 * 
 * Creates a grid of 10x6 tiles that scale in/out for page transitions.
 * Uses diagonal staggering for a premium feel.
 */

const ROWS = 6;
const COLS = 10;

const tileVariants = {
    initial: {
        scale: 1,
    },
    animate: {
        scale: 0,
        transition: {
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1] as any,
        },
    },
    exit: {
        scale: 1,
        transition: {
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1] as any,
        },
    },
};

export const Checkerboard = () => {
    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                display: 'grid',
                gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                gridTemplateRows: `repeat(${ROWS}, 1fr)`,
                zIndex: 9999,
                pointerEvents: 'none',
            }}
        >
            {[...Array(ROWS)].map((_, rowIndex) =>
                [...Array(COLS)].map((_, colIndex) => (
                    <motion.div
                        key={`${rowIndex}-${colIndex}`}
                        variants={tileVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{
                            delay: (rowIndex + colIndex) * 0.03,
                        }}
                        style={{
                            backgroundColor: '#000', // Black tiles for the checkerboard
                            width: '100%',
                            height: '100%',
                        }}
                    />
                ))
            )}
        </div>
    );
};
