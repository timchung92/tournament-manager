import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tournament } from '../types';

function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [newTournamentName, setNewTournamentName] = useState('');
  const [seedMatchesPerTeam, setSeedMatchesPerTeam] = useState(3);
  const [totalCourts, setTotalCourts] = useState(6);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const response = await fetch('/api/tournaments');
      const data = await response.json();
      setTournaments(data);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    }
  };

  const createTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTournamentName.trim()) return;

    try {
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newTournamentName,
          seedMatchesPerTeam,
          totalCourts
        }),
      });
      
      if (response.ok) {
        setNewTournamentName('');
        setSeedMatchesPerTeam(3);
        setTotalCourts(6);
        setIsCreating(false);
        fetchTournaments();
      }
    } catch (error) {
      console.error('Error creating tournament:', error);
    }
  };

  const deleteTournament = async (tournamentId: string) => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setDeleteConfirmId(null);
        fetchTournaments();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete tournament');
      }
    } catch (error) {
      console.error('Error deleting tournament:', error);
      alert('Failed to delete tournament');
    }
  };

  return (
    <div className="px-4 sm:px-0">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-bold text-gray-900">Tournaments</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your pickleball tournaments
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            Create Tournament
          </button>
        </div>
      </div>

      {isCreating && (
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <form onSubmit={createTournament}>
            <div>
              <label htmlFor="tournament-name" className="block text-sm font-medium text-gray-700">
                Tournament Name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="tournament-name"
                  value={newTournamentName}
                  onChange={(e) => setNewTournamentName(e.target.value)}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="e.g., Women's Division"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label htmlFor="seed-matches" className="block text-sm font-medium text-gray-700">
                Seed Matches Per Team
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  id="seed-matches"
                  min="1"
                  max="10"
                  value={seedMatchesPerTeam}
                  onChange={(e) => setSeedMatchesPerTeam(parseInt(e.target.value))}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label htmlFor="total-courts" className="block text-sm font-medium text-gray-700">
                Number of Courts
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  id="total-courts"
                  min="1"
                  max="20"
                  value={totalCourts}
                  onChange={(e) => setTotalCourts(parseInt(e.target.value))}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div className="mt-4 flex gap-3">
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setNewTournamentName('');
                  setSeedMatchesPerTeam(3);
                  setTotalCourts(6);
                }}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Created
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {tournaments.map((tournament) => (
                    <tr key={tournament.id}>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        {tournament.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(tournament.createdAt).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="flex gap-4">
                          <Link
                            to={`/tournament/${tournament.id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Manage
                          </Link>
                          <button
                            onClick={() => setDeleteConfirmId(tournament.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">
                Delete Tournament
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this tournament? This action cannot be undone and will delete all teams, matches, and scores.
                </p>
              </div>
              <div className="items-center px-4 py-3 flex gap-3 justify-center">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteTournament(deleteConfirmId)}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TournamentsPage;