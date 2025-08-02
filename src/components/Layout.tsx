import { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {
  const { tournamentId } = useParams();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link
                to="/tournaments"
                className="flex items-center text-xl font-bold text-gray-800 hover:text-gray-600"
              >
                Pickleball Tournament Manager
              </Link>
            </div>
            {tournamentId && (
              <div className="flex items-center space-x-4">
                <Link
                  to={`/tournament/${tournamentId}`}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  to={`/tournament/${tournamentId}/register`}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Register Team
                </Link>
                <Link
                  to={`/tournament/${tournamentId}/seed-round`}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Seed Round
                </Link>
                <Link
                  to={`/tournament/${tournamentId}/courts`}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Courts
                </Link>
                <Link
                  to={`/tournament/${tournamentId}/leaderboard`}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Leaderboard
                </Link>
                <Link
                  to={`/tournament/${tournamentId}/bracket`}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Bracket
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

export default Layout;