import React from 'react';
import { motion } from 'framer-motion';

export default function AnimatedContainer({
    children,
    delay = 0,
    direction = 'up',
    className = '',
    ...props
}) {
    const directions = {
        up: { y: 20 },
        down: { y: -20 },
        left: { x: 20 },
        right: { x: -20 },
    };

    return (
        <motion.div
            initial={{ opacity: 0, ...directions[direction] }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{
                duration: 0.5,
                delay,
                ease: [0.4, 0, 0.2, 1],
            }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
}
