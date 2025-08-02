import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Match, Team, Tournament } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function SeedRoundPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [matchesPerTeam, setMatchesPerTeam] = useState(3);

  useEffect(() => {
    if (tournamentId) {
      fetchData();
    }
  }, [tournamentId]);

  const fetchData = async () => {
    try {
      const [tournamentRes, matchesRes, teamsRes] = await Promise.all([
        fetch(`/api/tournaments/${tournamentId}`),
        fetch(`/api/tournaments/${tournamentId}/matches`),
        fetch(`/api/tournaments/${tournamentId}/teams`),
      ]);

      if (tournamentRes.ok && matchesRes.ok && teamsRes.ok) {
        const tournamentData = await tournamentRes.json();
        const matchesData = await matchesRes.json();
        const teamsData = await teamsRes.json();
        setTournament(tournamentData);
        setMatches(matchesData.filter((m: Match) => m.roundType === 'seed'));
        setTeams(teamsData);
        setMatchesPerTeam(tournamentData.seedMatchesPerTeam);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateClick = () => {
    if (teams.length < 2) {
      alert('Need at least 2 teams to generate matches');
      return;
    }
    setShowGenerateDialog(true);
  };

  const generateSeedMatches = async () => {
    setGenerating(true);
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/matches/generate-seed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchesPerTeam }),
      });

      if (response.ok) {
        await fetchData();
        setShowGenerateDialog(false);
      } else {
        alert('Failed to generate seed matches');
      }
    } catch (error) {
      console.error('Error generating matches:', error);
      alert('Failed to generate seed matches');
    } finally {
      setGenerating(false);
    }
  };

  const clearSeedRound = async () => {
    setClearing(true);
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/matches/clear-seed`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchData();
        setShowClearDialog(false);
      } else {
        alert('Failed to clear seed round');
      }
    } catch (error) {
      console.error('Error clearing seed round:', error);
      alert('Failed to clear seed round');
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const hasMatches = matches.length > 0;
  const hasStartedMatches = matches.some(m => m.scheduledCourt || m.completedAt);
  const completedMatches = matches.filter(m => m.completedAt);
  const inProgressMatches = matches.filter(m => m.scheduledCourt && !m.completedAt);
  const pendingMatches = matches.filter(m => !m.scheduledCourt && !m.completedAt);

  const getMatchStatus = (match: any) => {
    if (match.completedAt) {
      return <Badge variant="success">Completed</Badge>;
    } else if (match.scheduledCourt) {
      return <Badge variant="warning">In Progress</Badge>;
    } else {
      return <Badge variant="secondary">Pending</Badge>;
    }
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Seed Round</h1>
          <p className="text-muted-foreground">
            {teams.length} teams registered • {matches.length} seed matches
          </p>
        </div>
        <div className="flex gap-2">
          {!hasMatches && (
            <Button
              onClick={handleGenerateClick}
              disabled={generating || teams.length < 2}
              size="lg"
            >
              Generate Seed Matches
            </Button>
          )}
          {hasMatches && (
            <Button
              variant="destructive"
              onClick={() => setShowClearDialog(true)}
              disabled={clearing}
              size="lg"
            >
              Clear Seed Round
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {hasMatches && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Matches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{matches.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedMatches.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{inProgressMatches.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{pendingMatches.length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {!hasMatches ? (
        <Card>
          <CardHeader>
            <CardTitle>No Seed Matches Generated</CardTitle>
            <CardDescription>
              Generate seed matches to begin the tournament. Each team will play the configured number of matches.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {teams.length < 2 ? (
              <p className="text-muted-foreground">Register at least 2 teams before generating matches.</p>
            ) : (
              <p className="text-muted-foreground">Click "Generate Seed Matches" to create random pairings.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Seed Matches</CardTitle>
            <CardDescription>
              All seed round matches for the tournament
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Match</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Court</TableHead>
                  <TableHead>Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map((match: any) => (
                  <TableRow key={match.id}>
                    <TableCell className="font-medium">
                      {match.teamA?.name} vs {match.teamB?.name}
                    </TableCell>
                    <TableCell>
                      {getMatchStatus(match)}
                    </TableCell>
                    <TableCell>
                      {match.scheduledCourt ? (
                        <Badge variant="outline">Court {match.scheduledCourt}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {match.teamAScore !== null && match.teamBScore !== null ? (
                        <span className="font-mono">{match.teamAScore} - {match.teamBScore}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Generate Seed Matches Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Seed Matches</DialogTitle>
            <DialogDescription>
              Configure how many matches each team should play in the seed round.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="matches-per-team">Matches per team</Label>
              <Input
                id="matches-per-team"
                type="number"
                min="1"
                max="10"
                value={matchesPerTeam}
                onChange={(e) => setMatchesPerTeam(parseInt(e.target.value) || 1)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Each team will play approximately {matchesPerTeam} matches against different opponents.
                With {teams.length} teams, this will generate approximately {Math.floor((teams.length * matchesPerTeam) / 2)} total matches.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowGenerateDialog(false)}
              disabled={generating}
            >
              Cancel
            </Button>
            <Button
              onClick={generateSeedMatches}
              disabled={generating}
            >
              {generating ? 'Generating...' : 'Generate Matches'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Confirmation Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear Seed Round</DialogTitle>
            <DialogDescription>
              Are you sure you want to clear all seed round matches? This action cannot be undone.
              {hasStartedMatches && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: Some matches have already started or been completed. All progress will be lost.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowClearDialog(false)}
              disabled={clearing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={clearSeedRound}
              disabled={clearing}
            >
              {clearing ? 'Clearing...' : 'Clear Seed Round'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SeedRoundPage;