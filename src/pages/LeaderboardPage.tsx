import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { TeamStats } from '../types';

function LeaderboardPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [leaderboard, setLeaderboard] = useState<TeamStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tournamentId) {
      fetchLeaderboard();
    }
  }, [tournamentId]);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/leaderboard`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
      
      {leaderboard.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No completed matches yet</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Matches
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points For
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points Against
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Point Differential
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaderboard.map((team, index) => (
                <tr key={team.teamId} className={index < 8 ? 'bg-green-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {team.teamName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {team.matchesPlayed}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {team.pointsFor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {team.pointsAgainst}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                    <span
                      className={
                        team.pointDifferential > 0
                          ? 'text-green-600'
                          : team.pointDifferential < 0
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }
                    >
                      {team.pointDifferential > 0 ? '+' : ''}
                      {team.pointDifferential}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {leaderboard.length >= 8 && (
            <div className="px-6 py-3 bg-gray-50 text-sm text-gray-600">
              Top 8 teams advance to playoffs
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LeaderboardPage;