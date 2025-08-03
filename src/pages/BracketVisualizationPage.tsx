import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BracketMatch, TeamStats } from '../types';
import { Button } from '../components/ui/button';
import { BracketVisualization } from '../components/BracketVisualization';

function BracketVisualizationPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
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
      // Fetch leaderboard
      const leaderboardRes = await fetch(`/api/tournaments/${tournamentId}/leaderboard`);
      if (leaderboardRes.ok) {
        const data = await leaderboardRes.json();
        setLeaderboard(data.filter((t: TeamStats) => t.matchesPlayed > 0));
      }

      // Fetch bracket matches
      const bracketRes = await fetch(`/api/tournaments/${tournamentId}/bracket`);
      if (bracketRes.ok) {
        const bracketData = await bracketRes.json();
        setBracketMatches(bracketData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4">
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tournament Bracket</h1>
            <p className="mt-1 text-sm text-gray-600">
              Visual representation of the playoff bracket
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate(`/tournament/${tournamentId}/bracket`)}
          >
            ← Back to Bracket Management
          </Button>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <BracketVisualization 
            matches={bracketMatches} 
            leaderboard={leaderboard}
          />
        </div>
      </div>
    </div>
  );
}

export default BracketVisualizationPage;