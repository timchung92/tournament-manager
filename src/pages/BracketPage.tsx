import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BracketMatch, TeamStats, Tournament } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';

function BracketPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [bracketMatches, setBracketMatches] = useState<BracketMatch[]>([]);
  const [leaderboard, setLeaderboard] = useState<TeamStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamsToAdvance, setTeamsToAdvance] = useState<number | null>(null);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<BracketMatch | null>(null);
  const [teamAScore, setTeamAScore] = useState('');
  const [teamBScore, setTeamBScore] = useState('');

  useEffect(() => {
    if (tournamentId) {
      fetchData();
    }
  }, [tournamentId]);

  const fetchData = async () => {
    try {
      // Fetch tournament details
      const tournamentRes = await fetch(`/api/tournaments/${tournamentId}`);
      if (tournamentRes.ok) {
        const tournamentData = await tournamentRes.json();
        setTournament(tournamentData);
        setTeamsToAdvance(tournamentData.teamsToAdvance);
      }

      // Fetch leaderboard
      const leaderboardRes = await fetch(`/api/tournaments/${tournamentId}/leaderboard`);
      if (leaderboardRes.ok) {
        const data = await leaderboardRes.json();
        setLeaderboard(data);
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

  const generateBracket = async () => {
    const teamsWithMatches = leaderboard.filter(t => t.matchesPlayed > 0).length;
    if (teamsWithMatches < 2) {
      alert('Need at least 2 teams with completed matches to generate bracket');
      return;
    }

    // Set default teams to advance
    if (teamsToAdvance === null) {
      setTeamsToAdvance(teamsWithMatches);
    }

    setShowGenerateDialog(true);
  };

  const confirmGenerateBracket = async () => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/bracket/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamsToAdvance }),
      });

      if (response.ok) {
        setShowGenerateDialog(false);
        fetchData(); // Refresh data
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Error generating bracket:', error);
      alert('Failed to generate bracket');
    }
  };

  const clearBracket = async () => {
    if (!confirm('Are you sure you want to clear the bracket? This will delete all playoff matches.')) {
      return;
    }

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/bracket`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setBracketMatches([]);
        fetchData();
      }
    } catch (error) {
      console.error('Error clearing bracket:', error);
    }
  };

  const openScoreDialog = (match: BracketMatch) => {
    setSelectedMatch(match);
    setTeamAScore(match.teamAScore?.toString() || '');
    setTeamBScore(match.teamBScore?.toString() || '');
    setShowScoreDialog(true);
  };

  const submitScore = async () => {
    if (!selectedMatch || !teamAScore || !teamBScore) return;

    try {
      const response = await fetch(`/api/bracket-matches/${selectedMatch.id}/score`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamAScore: parseInt(teamAScore),
          teamBScore: parseInt(teamBScore),
        }),
      });

      if (response.ok) {
        setShowScoreDialog(false);
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error submitting score:', error);
    }
  };

  const getRoundName = (round: number, totalRounds: number) => {
    const roundsFromFinal = totalRounds - round;
    switch (roundsFromFinal) {
      case 0: return 'Finals';
      case 1: return 'Semifinals';
      case 2: return 'Quarterfinals';
      case 3: return 'Round of 16';
      case 4: return 'Round of 32';
      default: return `Round ${round}`;
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const teamsWithMatches = leaderboard.filter(t => t.matchesPlayed > 0);
  const hasEnoughTeams = teamsWithMatches.length >= 2;
  const maxRounds = bracketMatches.length > 0 ? Math.max(...bracketMatches.map(m => m.round)) : 0;

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <Button
          variant="ghost"
          onClick={() => navigate(`/tournament/${tournamentId}`)}
        >
          ← Back to Dashboard
        </Button>
      </div>

      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-bold text-gray-900">Playoff Bracket</h1>
          <p className="mt-2 text-sm text-gray-700">
            Single elimination tournament bracket
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-3">
          {bracketMatches.length > 0 && (
            <>
              <button
                onClick={() => navigate(`/tournament/${tournamentId}/bracket/view`)}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                View Bracket
              </button>
              <button
                onClick={clearBracket}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Clear Bracket
              </button>
            </>
          )}
          <button
            onClick={generateBracket}
            disabled={!hasEnoughTeams}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {bracketMatches.length > 0 ? 'Regenerate Bracket' : 'Generate Bracket'}
          </button>
        </div>
      </div>

      {!hasEnoughTeams ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">
            Complete seed round matches for at least 2 teams to generate playoff bracket
          </p>
        </div>
      ) : bracketMatches.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">
            Bracket not generated yet. Click "Generate Bracket" to create the playoff bracket.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            {teamsWithMatches.length} teams with completed matches available
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Bracket Rounds */}
          {Array.from({ length: maxRounds }, (_, i) => i + 1).map(round => {
            const roundMatches = bracketMatches.filter(m => m.round === round);
            return (
              <div key={round}>
                <h2 className="text-xl font-semibold mb-4">
                  {getRoundName(round, maxRounds)}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {roundMatches.map(match => (
                    <Card key={match.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-500">
                          Match {match.matchNumber + 1}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <span className="font-medium">
                                {match.teamA ? match.teamA.name : 'TBD'}
                              </span>
                              {match.teamA && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  Seed {teamsWithMatches.findIndex(t => t.teamId === match.teamAId) + 1}
                                </Badge>
                              )}
                            </div>
                            {match.completedAt && (
                              <span className="text-lg font-bold">
                                {match.teamAScore}
                              </span>
                            )}
                          </div>
                          <div className="border-t pt-3">
                            <div className="flex justify-between items-center">
                              <div className="flex-1">
                                <span className="font-medium">
                                  {match.teamB ? match.teamB.name : 'TBD'}
                                </span>
                                {match.teamB && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    Seed {teamsWithMatches.findIndex(t => t.teamId === match.teamBId) + 1}
                                  </Badge>
                                )}
                              </div>
                              {match.completedAt && (
                                <span className="text-lg font-bold">
                                  {match.teamBScore}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {match.teamA && match.teamB && !match.completedAt && (
                          <Button
                            onClick={() => openScoreDialog(match)}
                            size="sm"
                            className="w-full mt-4"
                          >
                            Enter Score
                          </Button>
                        )}
                        {/* Show BYE status for first round matches with only one team */}
                        {match.round === 1 && ((match.teamA && !match.teamB) || (!match.teamA && match.teamB)) && (
                          <div className="mt-3 text-center">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              BYE - Advances Automatically
                            </Badge>
                          </div>
                        )}
                        {match.completedAt && (
                          <div className="mt-3 text-center">
                            <Badge variant="default" className="bg-green-600">
                              Completed
                            </Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Generate Bracket Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Playoff Bracket</DialogTitle>
            <DialogDescription>
              Configure how many teams advance to the playoff bracket
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="teams-to-advance">
                Number of teams to advance
              </Label>
              <Input
                id="teams-to-advance"
                type="number"
                min="2"
                max={teamsWithMatches.length}
                value={teamsToAdvance || teamsWithMatches.length}
                onChange={(e) => setTeamsToAdvance(parseInt(e.target.value))}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Top {teamsToAdvance || teamsWithMatches.length} teams from seed round will advance
              </p>
            </div>
            {bracketMatches.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-sm text-yellow-800">
                  Warning: Generating a new bracket will delete all existing playoff matches and scores.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmGenerateBracket}>
              Generate Bracket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Score Entry Dialog */}
      <Dialog open={showScoreDialog} onOpenChange={setShowScoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Match Score</DialogTitle>
          </DialogHeader>
          {selectedMatch && (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="team-a-score">
                  {selectedMatch.teamA?.name} Score
                </Label>
                <Input
                  id="team-a-score"
                  type="number"
                  min="0"
                  value={teamAScore}
                  onChange={(e) => setTeamAScore(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="team-b-score">
                  {selectedMatch.teamB?.name} Score
                </Label>
                <Input
                  id="team-b-score"
                  type="number"
                  min="0"
                  value={teamBScore}
                  onChange={(e) => setTeamBScore(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScoreDialog(false)}>
              Cancel
            </Button>
            <Button onClick={submitScore}>
              Submit Score
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

export default BracketPage;