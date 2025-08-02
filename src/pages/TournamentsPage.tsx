import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tournament } from '../types';

function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [newTournamentName, setNewTournamentName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

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
        body: JSON.stringify({ name: newTournamentName }),
      });
      
      if (response.ok) {
        setNewTournamentName('');
        setIsCreating(false);
        fetchTournaments();
      }
    } catch (error) {
      console.error('Error creating tournament:', error);
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
                        <Link
                          to={`/tournament/${tournament.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TournamentsPage;