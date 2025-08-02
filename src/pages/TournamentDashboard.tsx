import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Tournament, Team } from '../types';

function TournamentDashboard() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tournamentId) {
      fetchTournamentData();
    }
  }, [tournamentId]);

  const fetchTournamentData = async () => {
    try {
      const [tournamentRes, teamsRes] = await Promise.all([
        fetch(`/api/tournaments/${tournamentId}`),
        fetch(`/api/tournaments/${tournamentId}/teams`),
      ]);

      if (tournamentRes.ok && teamsRes.ok) {
        const tournamentData = await tournamentRes.json();
        const teamsData = await teamsRes.json();
        setTournament(tournamentData);
        setTeams(teamsData);
      }
    } catch (error) {
      console.error('Error fetching tournament data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!tournament) {
    return <div className="text-center py-12">Tournament not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{tournament.name}</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded">
            <div className="text-sm text-gray-500">Total Teams</div>
            <div className="text-2xl font-semibold">{teams.length}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <div className="text-sm text-gray-500">Seed Matches per Team</div>
            <div className="text-2xl font-semibold">{tournament.seedMatchesPerTeam}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <div className="text-sm text-gray-500">Total Courts</div>
            <div className="text-2xl font-semibold">{tournament.totalCourts}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          to={`/tournament/${tournamentId}/register`}
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-semibold mb-2">Register Team</h3>
          <p className="text-gray-600">Add new teams to the tournament</p>
        </Link>

        <Link
          to={`/tournament/${tournamentId}/seed-round`}
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-semibold mb-2">Seed Round</h3>
          <p className="text-gray-600">Generate and manage seed matches</p>
        </Link>

        <Link
          to={`/tournament/${tournamentId}/courts`}
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-semibold mb-2">Court Management</h3>
          <p className="text-gray-600">Assign matches to courts</p>
        </Link>

        <Link
          to={`/tournament/${tournamentId}/leaderboard`}
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-semibold mb-2">Leaderboard</h3>
          <p className="text-gray-600">View team rankings</p>
        </Link>

        <Link
          to={`/tournament/${tournamentId}/bracket`}
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-semibold mb-2">Playoff Bracket</h3>
          <p className="text-gray-600">Manage elimination bracket</p>
        </Link>
      </div>
    </div>
  );
}

export default TournamentDashboard;