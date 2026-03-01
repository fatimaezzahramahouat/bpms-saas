import { Outlet } from 'react-router-dom';
import { Checkerboard } from './Checkerboard';

/**
 * PublicRouteWrapper
 * 
 * Wraps public routes to provide the checkerboard transition.
 * Transitions are ONLY triggered when navigating within these routes.
 */
export const PublicRouteWrapper = () => {
    return (
        <>
            <Checkerboard />
            <Outlet />
        </>
    );
};
