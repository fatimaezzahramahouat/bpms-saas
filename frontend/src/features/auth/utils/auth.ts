/**
 * Authentication Utilities
 * 
 * Helper functions for managing JWT tokens and user data in localStorage.
 */

/**
 * Decodes a JWT token without validation (for frontend use only).
 */
export const decodeToken = (token: string) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Failed to decode token:', error);
        return null;
    }
};

/**
 * Saves authentication data to localStorage and notifies the application.
 */
export const saveAuthData = (token: string) => {
    // 1. Save token
    localStorage.setItem('token', token);
    
    // 2. Decode and save user information
    const decoded = decodeToken(token);
    if (decoded) {
        // Extract user info from token payload
        const user = {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            firstName: decoded.firstName,
            organisationId: decoded.organisationId,
            isAdmin: decoded.isAdmin,
            // These will be checkable after processing
            profileCompleted: decoded.profileCompleted ?? true 
        };
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('isAuthenticated', 'true');
        
        // 3. Dispatch event for UI components (like Sidebar) to react
        window.dispatchEvent(new CustomEvent('user-data-updated'));
        
        return user;
    }
    return null;
};
