import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Match, Team, Tournament, TeamStats, Court } from "../types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";

function SeedRoundPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [leaderboard, setLeaderboard] = useState<TeamStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [addingCourt, setAddingCourt] = useState(false);
  const [removingCourt, setRemovingCourt] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [matchesPerTeam, setMatchesPerTeam] = useState(3);
  const [viewMode, setViewMode] = useState<'matches' | 'leaderboard'>('matches');
  const [editScoreModal, setEditScoreModal] = useState<{
    match: Match | null;
    teamAScore: string;
    teamBScore: string;
  }>({
    match: null,
    teamAScore: "",
    teamBScore: "",
  });
  const [scoreModal, setScoreModal] = useState<{
    match: Match | null;
    teamAScore: string;
    teamBScore: string;
  }>({
    match: null,
    teamAScore: "",
    teamBScore: "",
  });
  const [editingCourtId, setEditingCourtId] = useState<string | null>(null);
  const [editingCourtName, setEditingCourtName] = useState("");
  const [removeMode, setRemoveMode] = useState(false);

  useEffect(() => {
    if (tournamentId) {
      fetchData();
    }
  }, [tournamentId]);

  // Exit remove mode when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (removeMode && !(event.target as Element)?.closest('.court-status-card')) {
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
      const [tournamentRes, matchesRes, teamsRes, leaderboardRes] = await Promise.all([
        fetch(`/api/tournaments/${tournamentId}`),
        fetch(`/api/tournaments/${tournamentId}/matches`),
        fetch(`/api/tournaments/${tournamentId}/teams`),
        fetch(`/api/tournaments/${tournamentId}/leaderboard`),
      ]);

      if (tournamentRes.ok && matchesRes.ok && teamsRes.ok) {
        const tournamentData = await tournamentRes.json();
        const matchesData = await matchesRes.json();
        const teamsData = await teamsRes.json();
        setTournament(tournamentData);
        setMatches(matchesData);
        setTeams(teamsData);
        setMatchesPerTeam(tournamentData.seedMatchesPerTeam);
        
        if (leaderboardRes.ok) {
          const leaderboardData = await leaderboardRes.json();
          setLeaderboard(leaderboardData);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateClick = () => {
    if (teams.length < 2) {
      alert("Need at least 2 teams to generate matches");
      return;
    }
    setShowGenerateDialog(true);
  };

  const generateSeedMatches = async () => {
    setGenerating(true);
    try {
      const response = await fetch(
        `/api/tournaments/${tournamentId}/matches/generate-seed`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchesPerTeam }),
        }
      );

      if (response.ok) {
        await fetchData();
        setShowGenerateDialog(false);
      } else {
        alert("Failed to generate seed matches");
      }
    } catch (error) {
      console.error("Error generating matches:", error);
      alert("Failed to generate seed matches");
    } finally {
      setGenerating(false);
    }
  };

  const clearSeedRound = async () => {
    setClearing(true);
    try {
      const response = await fetch(
        `/api/tournaments/${tournamentId}/matches/clear-seed`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        await fetchData();
        setShowClearDialog(false);
      } else {
        alert("Failed to clear seed round");
      }
    } catch (error) {
      console.error("Error clearing seed round:", error);
      alert("Failed to clear seed round");
    } finally {
      setClearing(false);
    }
  };

  const updateMatchScore = async () => {
    if (!editScoreModal.match) return;

    try {
      const response = await fetch(
        `/api/matches/${editScoreModal.match.id}/score`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamAScore: parseInt(editScoreModal.teamAScore),
            teamBScore: parseInt(editScoreModal.teamBScore),
          }),
        }
      );

      if (response.ok) {
        setEditScoreModal({ match: null, teamAScore: "", teamBScore: "" });
        await fetchData();
      } else {
        alert("Failed to update score");
      }
    } catch (error) {
      console.error("Error updating score:", error);
      alert("Failed to update score");
    }
  };

  const openEditScoreModal = (match: any) => {
    setEditScoreModal({
      match,
      teamAScore: match.teamAScore?.toString() || "",
      teamBScore: match.teamBScore?.toString() || "",
    });
  };

  const assignCourt = async (matchId: string, courtNumber: number) => {
    try {
      const response = await fetch(`/api/matches/${matchId}/assign-court`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courtNumber }),
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error("Error assigning court:", error);
    }
  };

  const unassignCourt = async (matchId: string) => {
    try {
      const response = await fetch(`/api/matches/${matchId}/unassign-court`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error("Error unassigning court:", error);
    }
  };

  const addCourt = async () => {
    setAddingCourt(true);
    try {
      const response = await fetch(
        `/api/tournaments/${tournamentId}/courts/add`,
        {
          method: "PUT",
        }
      );

      if (response.ok) {
        await fetchData();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to add court");
      }
    } catch (error) {
      console.error("Error adding court:", error);
      alert("Failed to add court");
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
      if (!confirm("Are you sure you want to remove this court?")) {
        return;
      }
      
      try {
        const response = await fetch(`/api/courts/${courtId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          await fetchData();
          setRemoveMode(false); // Exit remove mode after deletion
        } else {
          const error = await response.json();
          alert(error.error || "Failed to remove court");
        }
      } catch (error) {
        console.error("Error removing court:", error);
        alert("Failed to remove court");
      }
    }
  };

  const submitScore = async () => {
    if (!scoreModal.match) return;

    try {
      const response = await fetch(
        `/api/matches/${scoreModal.match.id}/score`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamAScore: parseInt(scoreModal.teamAScore),
            teamBScore: parseInt(scoreModal.teamBScore),
          }),
        }
      );

      if (response.ok) {
        setScoreModal({ match: null, teamAScore: "", teamBScore: "" });
        await fetchData();
      }
    } catch (error) {
      console.error("Error submitting score:", error);
    }
  };

  const updateCourtName = async (courtId: string, name: string) => {
    try {
      const response = await fetch(`/api/courts/${courtId}/name`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || null }),
      });

      if (response.ok) {
        setEditingCourtId(null);
        setEditingCourtName("");
        await fetchData();
      }
    } catch (error) {
      console.error("Error updating court name:", error);
    }
  };

  const startEditingCourt = (court: Court) => {
    setEditingCourtId(court.id);
    setEditingCourtName(court.name || "");
  };

  const cancelEditingCourt = () => {
    setEditingCourtId(null);
    setEditingCourtName("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Filter seed round matches only
  const seedMatches = matches.filter((m) => m.roundType === "seed");
  const hasMatches = seedMatches.length > 0;
  const hasStartedMatches = seedMatches.some(
    (m) => m.scheduledCourt || m.completedAt
  );
  const completedMatches = matches.filter((m) => m.completedAt);
  const pendingMatches = matches.filter((m) => !m.scheduledCourt && !m.completedAt);
  const activeMatches = matches.filter((m) => m.scheduledCourt && !m.completedAt);
  const courtsAvailable = tournament?.totalCourts ? tournament.totalCourts - activeMatches.length : 0;
  
  // Court management logic
  const courts = tournament?.courts || [];
  const occupiedCourts = activeMatches.map((m) => m.scheduledCourt).filter(c => c !== null && c !== undefined);
  const availableCourtNumbers = courts
    .map((c) => c.number)
    .filter((c) => !occupiedCourts.includes(c));
  
  const teamsCurrentlyPlaying = new Set(
    activeMatches.flatMap((m) => [m.teamAId, m.teamBId])
  );
  
  const allIncompleteMatches = matches.filter(
    (m) => !m.scheduledCourt && !m.completedAt
  );
  
  const availableMatches = allIncompleteMatches.filter(
    (m) =>
      !teamsCurrentlyPlaying.has(m.teamAId) &&
      !teamsCurrentlyPlaying.has(m.teamBId)
  );
  
  const highestCourtInUse = occupiedCourts.length > 0 ? Math.max(...occupiedCourts) : 0;
  const canRemoveCourt =
    tournament && tournament.totalCourts > 1 && highestCourtInUse < tournament.totalCourts;

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
            {teams.length} teams registered • {seedMatches.length} seed matches
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

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Completed Matches
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-lg font-bold text-green-600">
              {completedMatches.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Pending Matches
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-lg font-bold text-yellow-600">
              {pendingMatches.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Courts Available
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-lg font-bold text-blue-600">
              {courtsAvailable}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Games in Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-lg font-bold text-red-600">
              {activeMatches.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Court Status and Pending Matches */}
      {hasMatches && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Court Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Court Status</CardTitle>
                  <CardDescription>Real-time status of all courts</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={addCourt}
                    disabled={addingCourt}
                    variant="outline"
                    size="sm"
                  >
                    {addingCourt ? "Adding..." : "+ Court"}
                  </Button>
                  <Button
                    onClick={() => removeCourt()}
                    disabled={removingCourt}
                    variant={removeMode ? "default" : "outline"}
                    size="sm"
                  >
                    {removingCourt ? "Removing..." : removeMode ? "Cancel Remove" : "- Court"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {courts.map((court) => {
                  const match = activeMatches.find(
                    (m) => m.scheduledCourt === court.number
                  );
                  const isEditing = editingCourtId === court.id;
                  return (
                    <div
                      key={court.id}
                      className={`p-3 rounded-lg text-center border-2 text-sm court-status-card ${
                        match
                          ? "border-red-200 bg-red-50"
                          : "border-green-200 bg-green-50"
                      }`}
                    >
                      <div className="font-semibold mb-2">
                        {isEditing ? (
                          <div className="space-y-1">
                            <Input
                              value={editingCourtName}
                              onChange={(e) => setEditingCourtName(e.target.value)}
                              placeholder={`Court ${court.number}`}
                              className="text-center text-xs h-6"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  updateCourtName(court.id, editingCourtName);
                                } else if (e.key === "Escape") {
                                  cancelEditingCourt();
                                }
                              }}
                              autoFocus
                            />
                            <div className="flex gap-1 justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateCourtName(court.id, editingCourtName)}
                                className="text-xs px-1 py-0 h-4"
                              >
                                ✓
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={cancelEditingCourt}
                                className="text-xs px-1 py-0 h-4"
                              >
                                ✕
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="cursor-pointer hover:text-blue-600"
                            onClick={() => startEditingCourt(court)}
                            title="Click to edit court name"
                          >
                            {court.name || `Court ${court.number}`}
                          </div>
                        )}
                      </div>
                      {!isEditing && match ? (
                        <div className="text-xs space-y-1">
                          <div className="text-gray-700 font-medium">
                            {(match as any).teamA?.name}
                          </div>
                          <div className="text-xs text-gray-500">vs</div>
                          <div className="text-gray-700 font-medium">
                            {(match as any).teamB?.name}
                          </div>
                          <div className="flex gap-1 mt-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setScoreModal({
                                  match,
                                  teamAScore: "",
                                  teamBScore: "",
                                })
                              }
                              className="text-xs h-6 flex-1"
                            >
                              Enter Score
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => unassignCourt(match.id)}
                              className="text-xs h-6 px-2"
                              title="Unassign from court"
                            >
                              ✕
                            </Button>
                          </div>
                        </div>
                      ) : !isEditing ? (
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">Available</Badge>
                          {removeMode && courts.length > 1 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeCourt(court.id)}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              title="Delete this court"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Pending Matches */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Matches</CardTitle>
              <CardDescription>
                Matches ready to be assigned to courts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {availableMatches.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No matches ready for assignment
                </p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {availableMatches.map((match: any) => (
                    <div
                      key={match.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="text-sm">
                        <div className="font-medium">{match.teamA?.name}</div>
                        <div className="text-xs text-muted-foreground">vs</div>
                        <div className="font-medium">{match.teamB?.name}</div>
                      </div>
                      {availableCourtNumbers.length > 0 ? (
                        <select
                          onChange={(e) => {
                            const courtNumber = parseInt(e.target.value);
                            if (courtNumber) assignCourt(match.id, courtNumber);
                          }}
                          className="text-sm rounded border-input bg-background px-2 py-1 hover:cursor-pointer"
                          defaultValue=""
                        >
                          <option value="">Assign to court...</option>
                          {availableCourtNumbers.map((courtNumber) => {
                            const court = courts.find(c => c.number === courtNumber);
                            return (
                              <option key={courtNumber} value={courtNumber}>
                                {court?.name || `Court ${courtNumber}`}
                              </option>
                            );
                          })}
                        </select>
                      ) : (
                        <Badge variant="secondary" className="text-xs">No courts available</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Toggle between Seed Round Matches and Leaderboard */}
      {hasMatches ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {viewMode === 'matches' ? 'Seed Round Matches' : 'Leaderboard'}
                </CardTitle>
                <CardDescription>
                  {viewMode === 'matches'
                    ? 'All seed round matches for the tournament'
                    : 'Team rankings based on completed matches'}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'matches' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('matches')}
                >
                  Matches
                </Button>
                <Button
                  variant={viewMode === 'leaderboard' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('leaderboard')}
                >
                  Leaderboard
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === 'matches' ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Match</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Court</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {seedMatches.map((match: any) => (
                    <TableRow key={match.id}>
                      <TableCell>
                        <div className="font-medium">{match.teamA?.name}</div>
                        <div className="text-xs text-muted-foreground">vs</div>
                        <div className="font-medium">{match.teamB?.name}</div>
                      </TableCell>
                      <TableCell>{getMatchStatus(match)}</TableCell>
                      <TableCell>
                        {match.scheduledCourt ? (
                          <Badge variant="outline">
                            Court {match.scheduledCourt}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {match.teamAScore !== null &&
                        match.teamBScore !== null ? (
                          <span className="font-mono">
                            {match.teamAScore} - {match.teamBScore}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {match.completedAt && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditScoreModal(match)}
                            className="text-xs"
                          >
                            Edit Score
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              leaderboard.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No completed matches yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead className="text-center">Matches</TableHead>
                      <TableHead className="text-center">Points For</TableHead>
                      <TableHead className="text-center">Points Against</TableHead>
                      <TableHead className="text-center">Point Differential</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.slice(0, 15).map((team, index) => (
                      <TableRow key={team.teamId}>
                        <TableCell className="font-medium">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          {team.teamName}
                        </TableCell>
                        <TableCell className="text-center">
                          {team.matchesPlayed}
                        </TableCell>
                        <TableCell className="text-center">
                          {team.pointsFor}
                        </TableCell>
                        <TableCell className="text-center">
                          {team.pointsAgainst}
                        </TableCell>
                        <TableCell className="text-center font-medium">
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Seed Matches Generated</CardTitle>
            <CardDescription>
              Generate seed matches to begin the tournament. Each team will play
              the configured number of matches.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {teams.length < 2 ? (
              <p className="text-muted-foreground">
                Register at least 2 teams before generating matches.
              </p>
            ) : (
              <p className="text-muted-foreground">
                Click "Generate Seed Matches" to create random pairings.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Generate Seed Matches Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Seed Matches</DialogTitle>
            <DialogDescription>
              Configure how many matches each team should play in the seed
              round.
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
                onChange={(e) =>
                  setMatchesPerTeam(parseInt(e.target.value) || 1)
                }
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Each team will play approximately {matchesPerTeam} matches
                against different opponents. With {teams.length} teams, this
                will generate approximately{" "}
                {Math.floor((teams.length * matchesPerTeam) / 2)} total matches.
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
            <Button onClick={generateSeedMatches} disabled={generating}>
              {generating ? "Generating..." : "Generate Matches"}
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
              Are you sure you want to clear all seed round matches? This action
              cannot be undone.
              {hasStartedMatches && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: Some matches have already started or been completed.
                  All progress will be lost.
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
              {clearing ? "Clearing..." : "Clear Seed Round"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Score Dialog */}
      <Dialog
        open={!!editScoreModal.match}
        onOpenChange={(open: boolean) =>
          !open &&
          setEditScoreModal({ match: null, teamAScore: "", teamBScore: "" })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Match Score</DialogTitle>
            <DialogDescription>
              Update the final score for this completed match
            </DialogDescription>
          </DialogHeader>
          {editScoreModal.match && (
            <div className="space-y-4 py-4">
              <div className="text-center text-sm text-muted-foreground mb-4">
                {(editScoreModal.match as any).teamA?.name} vs {(editScoreModal.match as any).teamB?.name}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-team-a-score">
                  {(editScoreModal.match as any).teamA?.name} Score
                </Label>
                <Input
                  id="edit-team-a-score"
                  type="number"
                  min="0"
                  value={editScoreModal.teamAScore}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditScoreModal({ ...editScoreModal, teamAScore: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-team-b-score">
                  {(editScoreModal.match as any).teamB?.name} Score
                </Label>
                <Input
                  id="edit-team-b-score"
                  type="number"
                  min="0"
                  value={editScoreModal.teamBScore}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditScoreModal({ ...editScoreModal, teamBScore: e.target.value })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setEditScoreModal({ match: null, teamAScore: "", teamBScore: "" })
              }
            >
              Cancel
            </Button>
            <Button
              onClick={updateMatchScore}
              disabled={!editScoreModal.teamAScore || !editScoreModal.teamBScore}
            >
              Update Score
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Score Entry Dialog */}
      <Dialog
        open={!!scoreModal.match}
        onOpenChange={(open: boolean) =>
          !open &&
          setScoreModal({ match: null, teamAScore: "", teamBScore: "" })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Match Score</DialogTitle>
            <DialogDescription>
              Record the final score for this match
            </DialogDescription>
          </DialogHeader>
          {scoreModal.match && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="team-a-score">
                  {(scoreModal.match as any).teamA?.name} Score
                </Label>
                <Input
                  id="team-a-score"
                  type="number"
                  min="0"
                  value={scoreModal.teamAScore}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setScoreModal({ ...scoreModal, teamAScore: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team-b-score">
                  {(scoreModal.match as any).teamB?.name} Score
                </Label>
                <Input
                  id="team-b-score"
                  type="number"
                  min="0"
                  value={scoreModal.teamBScore}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setScoreModal({ ...scoreModal, teamBScore: e.target.value })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setScoreModal({ match: null, teamAScore: "", teamBScore: "" })
              }
            >
              Cancel
            </Button>
            <Button
              onClick={submitScore}
              disabled={!scoreModal.teamAScore || !scoreModal.teamBScore}
            >
              Submit Score
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SeedRoundPage;