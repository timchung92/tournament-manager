import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { BracketMatch, TeamStats } from '../types';

function BracketPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [bracketMatches, setBracketMatches] = useState<BracketMatch[]>([]);
  const [leaderboard, setLeaderboard] = useState<TeamStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tournamentId) {
      fetchData();
    }
  }, [tournamentId]);

  const fetchData = async () => {
    try {
      const leaderboardRes = await fetch(`/api/tournaments/${tournamentId}/leaderboard`);
      if (leaderboardRes.ok) {
        const data = await leaderboardRes.json();
        setLeaderboard(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateBracket = async () => {
    if (leaderboard.length < 8) {
      alert('Need at least 8 teams with completed matches to generate bracket');
      return;
    }

    alert('Bracket generation coming soon!');
    // TODO: Implement bracket generation
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const hasEnoughTeams = leaderboard.filter(t => t.matchesPlayed > 0).length >= 8;

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-bold text-gray-900">Playoff Bracket</h1>
          <p className="mt-2 text-sm text-gray-700">
            Single elimination tournament bracket
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={generateBracket}
            disabled={!hasEnoughTeams}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            Generate Bracket
          </button>
        </div>
      </div>

      {!hasEnoughTeams ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">
            Complete seed round matches for at least 8 teams to generate playoff bracket
          </p>
        </div>
      ) : bracketMatches.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">
            Bracket not generated yet. Click "Generate Bracket" to create the playoff bracket.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-500">Bracket visualization coming soon!</p>
        </div>
      )}
    </div>
  );
}

export default BracketPage;