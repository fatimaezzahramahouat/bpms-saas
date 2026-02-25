import { Link } from 'react-router-dom';

/**
 * Recruitment Button Component
 * 
 * Simple button/link to the recruitment page.
 */
export function Navbar() {
  return (
    <Link 
      to="/recrutement"
      className="bg-h1-blue hover:bg-h1-blue/90 text-white px-4 py-2 rounded-md font-medium transition-colors"
    >
      Recrutement
    </Link>
  );
}
