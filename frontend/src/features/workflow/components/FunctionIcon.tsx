import React from 'react';
import {
    Zap,
    Settings,
    Database,
    Cpu,
    Layers,
    Globe,
    Code,
    Box,
    LayoutGrid
} from 'lucide-react';

export type IconType = 'API' | 'SDK' | 'Bundle' | 'Database' | 'Logic' | 'Trigger' | 'Output' | 'Cloud';

interface FunctionIconProps {
    type: IconType;
    className?: string;
}

export const FunctionIcon: React.FC<FunctionIconProps> = ({ type, className = "w-5 h-5" }) => {
    switch (type) {
        case 'API':
            return <Globe className={`${className} text-blue-400`} />;
        case 'SDK':
            return <Code className={`${className} text-purple-400`} />;
        case 'Bundle':
            return <Box className={`${className} text-orange-400`} />;
        case 'Database':
            return <Database className={`${className} text-green-400`} />;
        case 'Logic':
            return <Cpu className={`${className} text-pink-400`} />;
        case 'Trigger':
            return <Zap className={`${className} text-yellow-400`} />;
        case 'Output':
            return <LayoutGrid className={`${className} text-indigo-400`} />;
        case 'Cloud':
            return <Layers className={`${className} text-cyan-400`} />;
        default:
            return <Settings className={`${className} text-gray-400`} />;
    }
};
