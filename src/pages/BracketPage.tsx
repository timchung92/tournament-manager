import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BracketMatch, TeamStats, Tournament, Court } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { ChevronDown, ChevronRight, Trash2, CheckCircle, Clock, Circle } from 'lucide-react';

function BracketPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [bracketMatches, setBracketMatches] = useState<BracketMatch[]>([]);
  const [leaderboard, setLeaderboard] = useState<TeamStats[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamsToAdvance, setTeamsToAdvance] = useState<number | null>(null);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<BracketMatch | null>(null);
  const [teamAScore, setTeamAScore] = useState('');
  const [teamBScore, setTeamBScore] = useState('');
  const [showCourtDialog, setShowCourtDialog] = useState(false);
  const [selectedCourtNumber, setSelectedCourtNumber] = useState('1');
  const [editingCourtId, setEditingCourtId] = useState<string | null>(null);
  const [editingCourtName, setEditingCourtName] = useState('');
  const [addingCourt, setAddingCourt] = useState(false);
  const [removingCourt, setRemovingCourt] = useState(false);
  const [showCourtPanel, setShowCourtPanel] = useState(false);
  const [removeMode, setRemoveMode] = useState(false);

  useEffect(() => {
    if (tournamentId) {
      fetchData();
    }
  }, [tournamentId]);

  // Exit remove mode when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (removeMode && !(event.target as Element)?.closest('.court-management-panel')) {
        setRemoveMode(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [removeMode]);

  const fetchData = async () => {
    try {
      // Fetch tournament details
      const tournamentRes = await fetch(`/api/tournaments/${tournamentId}`);
      if (tournamentRes.ok) {
        const tournamentData = await tournamentRes.json();
        setTournament(tournamentData);
        setTeamsToAdvance(tournamentData.teamsToAdvance);
        setCourts(tournamentData.courts || []);
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

  const openCourtDialog = (match: BracketMatch) => {
    setSelectedMatch(match);

    // Get currently available courts (excluding courts occupied by other matches)
    const occupiedCourts = bracketMatches
      .filter(m => m.scheduledCourt && !m.completedAt && m.id !== match.id) // Exclude current match
      .map(m => m.scheduledCourt!.number);
    const availableCourtNumbers = courts
      .map(c => c.number)
      .filter(court => !occupiedCourts.includes(court));

    // Set default selection: current court if available, otherwise first available court
    const currentCourt = match.scheduledCourt?.number.toString();
    const defaultCourt = currentCourt && availableCourtNumbers.includes(parseInt(currentCourt))
      ? currentCourt
      : availableCourtNumbers[0]?.toString() || '1';

    setSelectedCourtNumber(defaultCourt);
    setShowCourtDialog(true);
  };

  const assignCourt = async () => {
    if (!selectedMatch || !selectedCourtNumber) return;

    try {
      const response = await fetch(`/api/bracket-matches/${selectedMatch.id}/assign-court`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtNumber: parseInt(selectedCourtNumber),
        }),
      });

      if (response.ok) {
        setShowCourtDialog(false);
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error assigning court:', error);
    }
  };

  const unassignCourt = async (matchId: string) => {
    try {
      const response = await fetch(`/api/bracket-matches/${matchId}/unassign-court`, {
        method: 'PUT',
      });

      if (response.ok) {
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error unassigning court:', error);
    }
  };

  // Get available courts
  const occupiedCourts = bracketMatches
    .filter(m => m.scheduledCourt && !m.completedAt)
    .map(m => m.scheduledCourt!.number);
  const availableCourts = courts
    .map(c => c.number)
    .filter(court => !occupiedCourts.includes(court));

  const activeMatches = bracketMatches.filter(m => m.scheduledCourt && !m.completedAt);
  const highestCourtInUse = occupiedCourts.length > 0 ? Math.max(...occupiedCourts) : 0;
  const canRemoveCourt = tournament && tournament.totalCourts > 1 && highestCourtInUse < tournament.totalCourts;

  const addCourt = async () => {
    setAddingCourt(true);
    try {
      const response = await fetch(
        `/api/tournaments/${tournamentId}/courts/add`,
        {
          method: 'PUT',
        }
      );

      if (response.ok) {
        await fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add court');
      }
    } catch (error) {
      console.error('Error adding court:', error);
      alert('Failed to add court');
    } finally {
      setAddingCourt(false);
    }
  };

  const removeCourt = async (courtId?: string) => {
    if (!courtId) {
      // Toggle remove mode
      if (!removeMode) {
        setRemoveMode(true);
        return;
      } else {
        // Cancel remove mode
        setRemoveMode(false);
        return;
      }
    } else {
      // New behavior: remove specific court
      if (!confirm('Are you sure you want to remove this court?')) {
        return;
      }

      try {
        const response = await fetch(`/api/courts/${courtId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchData();
          setRemoveMode(false); // Exit remove mode after deletion
        } else {
          const error = await response.json();
          alert(error.error || 'Failed to remove court');
        }
      } catch (error) {
        console.error('Error removing court:', error);
        alert('Failed to remove court');
      }
    }
  };

  const updateCourtName = async (courtId: string, name: string) => {
    try {
      const response = await fetch(`/api/courts/${courtId}/name`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() || null }),
      });

      if (response.ok) {
        setEditingCourtId(null);
        setEditingCourtName('');
        await fetchData();
      }
    } catch (error) {
      console.error('Error updating court name:', error);
    }
  };

  const startEditingCourt = (court: Court) => {
    setEditingCourtId(court.id);
    setEditingCourtName(court.name || '');
  };

  const cancelEditingCourt = () => {
    setEditingCourtId(null);
    setEditingCourtName('');
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

  const getRoundStatus = (round: number) => {
    const roundMatches = bracketMatches.filter(m => m.round === round);
    if (roundMatches.length === 0) return 'not-started';

    const completedMatches = roundMatches.filter(m => m.completedAt);
    const inProgressMatches = roundMatches.filter(m => m.scheduledCourt && !m.completedAt);

    if (completedMatches.length === roundMatches.length) {
      return 'complete';
    } else if (inProgressMatches.length > 0 || completedMatches.length > 0) {
      return 'in-progress';
    } else {
      return 'not-started';
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

      {/* Collapsible Court Management Panel */}
      <div className="bg-gray-50 rounded-lg shadow-sm border border-gray-200 court-management-panel">
        <button
          onClick={() => setShowCourtPanel(!showCourtPanel)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            {showCourtPanel ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            <h2 className="text-lg font-semibold">Court Management</h2>
            <Badge variant="secondary" className="ml-2">
              {courts.filter(c => activeMatches.some(m => m.scheduledCourt?.number === c.number)).length}/{courts.length} in use
            </Badge>
          </div>
          <div className="flex gap-2">
            {showCourtPanel && (
              <>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    addCourt();
                  }}
                  size="sm"
                  variant="outline"
                  disabled={addingCourt}
                >
                  {addingCourt ? 'Adding...' : 'Add Court'}
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeCourt();
                  }}
                  size="sm"
                  variant={removeMode ? 'default' : 'outline'}
                  disabled={!canRemoveCourt || removingCourt}
                >
                  {removingCourt ? 'Removing...' : removeMode ? 'Cancel Remove' : 'Remove Court'}
                </Button>
              </>
            )}
          </div>
        </button>

        {showCourtPanel && (
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courts.map((court: Court) => {
                const match = activeMatches.find(m => m.scheduledCourt?.number === court.number);
                const isOccupied = !!match;

                return (
                  <Card key={court.id} className={isOccupied ? 'border-orange-500' : 'border-green-500'}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        {editingCourtId === court.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              value={editingCourtName}
                              onChange={(e) => setEditingCourtName(e.target.value)}
                              placeholder={`Court ${court.number}`}
                              className="h-8"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  updateCourtName(court.id, editingCourtName);
                                } else if (e.key === 'Escape') {
                                  cancelEditingCourt();
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => updateCourtName(court.id, editingCourtName)}
                            >
                              ✓
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEditingCourt}
                            >
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <CardTitle
                            className="text-lg cursor-pointer hover:text-gray-600"
                            onClick={() => startEditingCourt(court)}
                          >
                            {court.name || `Court ${court.number}`}
                          </CardTitle>
                        )}
                        <div className="flex items-center gap-2">
                          <Badge variant={isOccupied ? 'default' : 'secondary'}>
                            {isOccupied ? 'Occupied' : 'Available'}
                          </Badge>
                          {removeMode && !isOccupied && courts.length > 1 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeCourt(court.id);
                              }}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    {isOccupied && match && (
                      <CardContent>
                        <div className="text-sm space-y-1">
                          <div className="font-medium">{match.teamA?.name}</div>
                          <div className="text-muted-foreground">vs</div>
                          <div className="font-medium">{match.teamB?.name}</div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        )}
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
            const status = getRoundStatus(round);
            const StatusIcon = status === 'complete' ? CheckCircle :
                              status === 'in-progress' ? Clock : Circle;
            return (
              <div key={round} className={`p-4 rounded-lg ${
                status === 'complete' ? 'bg-green-50 border border-green-200' :
                status === 'in-progress' ? 'bg-blue-50 border border-blue-200' :
                'bg-gray-50 border border-gray-200'
              }`}>
                <div className="flex items-center gap-2 mb-4">
                  <StatusIcon className={`h-5 w-5 ${
                    status === 'complete' ? 'text-green-600' :
                    status === 'in-progress' ? 'text-blue-600' :
                    'text-gray-500'
                  }`} />
                  <h2 className="text-xl font-semibold">
                    {getRoundName(round, maxRounds)}
                  </h2>
                </div>
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
                          <div className="space-y-2 mt-4">
                            {match.scheduledCourt ? (
                              <div className="flex items-center justify-between bg-blue-50 rounded p-2">
                                <span className="text-sm font-medium">
                                  {match.scheduledCourt.name || `Court ${match.scheduledCourt.number}`}
                                </span>
                                <Button
                                  onClick={() => unassignCourt(match.id)}
                                  size="sm"
                                  variant="ghost"
                                  className="text-xs"
                                >
                                  Remove
                                </Button>
                              </div>
                            ) : (
                              <Button
                                onClick={() => openCourtDialog(match)}
                                size="sm"
                                variant="outline"
                                className="w-full"
                              >
                                Assign to Court
                              </Button>
                            )}
                            <Button
                              onClick={() => openScoreDialog(match)}
                              size="sm"
                              className="w-full"
                            >
                              Enter Score
                            </Button>
                          </div>
                        )}
                        {/* Show BYE status for first round matches with only one team */}
                        {match.round === 1 && ((match.teamA && !match.teamB) || (!match.teamA && match.teamB)) && (
                          <div className="mt-3 text-center">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              BYE - Advances Automatically
                            </Badge>
                          </div>
                        )}
                        {/* Show court assignment if match is ready but not completed */}
                        {match.teamA && match.teamB && !match.completedAt && match.scheduledCourt && (
                          <div className="mt-2 text-center">
                            <Badge variant="outline" className="bg-gray-50">
                              {match.scheduledCourt.name || `Court ${match.scheduledCourt.number}`}
                            </Badge>
                          </div>
                        )}
                        {match.completedAt && (
                          <div className="mt-3 space-y-2">
                            <div className="text-center">
                              <Badge variant="default" className="bg-green-600">
                                Completed
                              </Badge>
                            </div>
                            <Button
                              onClick={() => openScoreDialog(match)}
                              size="sm"
                              variant="outline"
                              className="w-full text-xs"
                            >
                              Edit Score
                            </Button>
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

      {/* Court Assignment Dialog */}
      <Dialog open={showCourtDialog} onOpenChange={setShowCourtDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Match to Court</DialogTitle>
          </DialogHeader>
          {selectedMatch && (() => {
            // Calculate available courts specifically for this dialog, excluding the current match
            const dialogOccupiedCourts = bracketMatches
              .filter(m => m.scheduledCourt && !m.completedAt && m.id !== selectedMatch.id)
              .map(m => m.scheduledCourt!.number);
            const dialogAvailableCourts = courts
              .map(c => c.number)
              .filter(court => !dialogOccupiedCourts.includes(court));

            return (
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="court-select">
                    Select Court
                  </Label>
                  <select
                    id="court-select"
                    value={selectedCourtNumber}
                    onChange={(e) => setSelectedCourtNumber(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  >
                    {dialogAvailableCourts.map(courtNumber => {
                      const court = courts.find(c => c.number === courtNumber);
                      return (
                        <option key={courtNumber} value={courtNumber}>
                          {court?.name || `Court ${courtNumber}`}
                        </option>
                      );
                    })}
                  </select>
                  {dialogAvailableCourts.length === 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      All courts are currently occupied
                    </p>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  <p>{selectedMatch.teamA?.name} vs {selectedMatch.teamB?.name}</p>
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCourtDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={assignCourt}
              disabled={(() => {
                if (!selectedMatch) return true;
                const dialogOccupiedCourts = bracketMatches
                  .filter(m => m.scheduledCourt && !m.completedAt && m.id !== selectedMatch.id)
                  .map(m => m.scheduledCourt!.number);
                const dialogAvailableCourts = courts
                  .map(c => c.number)
                  .filter(court => !dialogOccupiedCourts.includes(court));
                return dialogAvailableCourts.length === 0;
              })()}
            >
              Assign Court
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

export default BracketPage;