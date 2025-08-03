import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Match, Tournament, Court } from "../types";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
// import { Plus, Minus } from "lucide-react";

function CourtsDashboardPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingCourt, setAddingCourt] = useState(false);
  const [removingCourt, setRemovingCourt] = useState(false);
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

  useEffect(() => {
    if (tournamentId) {
      fetchData();
    }
  }, [tournamentId]);

  const fetchData = async () => {
    try {
      const [tournamentRes, matchesRes] = await Promise.all([
        fetch(`/api/tournaments/${tournamentId}`),
        fetch(`/api/tournaments/${tournamentId}/matches`),
      ]);

      if (tournamentRes.ok && matchesRes.ok) {
        const tournamentData = await tournamentRes.json();
        const matchesData = await matchesRes.json();
        setTournament(tournamentData);
        setMatches(matchesData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
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

  const removeCourt = async () => {
    setRemovingCourt(true);
    try {
      const response = await fetch(
        `/api/tournaments/${tournamentId}/courts/remove`,
        {
          method: "PUT",
        }
      );

      if (response.ok) {
        await fetchData();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to remove court");
      }
    } catch (error) {
      console.error("Error removing court:", error);
      alert("Failed to remove court");
    } finally {
      setRemovingCourt(false);
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

  if (loading || !tournament) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Active matches: assigned to court and not completed
  const activeMatches = matches.filter(
    (m) => m.scheduledCourt && !m.completedAt
  );

  // Completed matches: have a completion timestamp
  const completedMatches = matches.filter((m) => m.completedAt);

  // Seed round matches
  const seedMatches = matches.filter((m) => m.roundType === 'seed');
  const seedRoundCompleted = seedMatches.length > 0 && seedMatches.every((m) => m.completedAt);

  // Teams currently playing (in active matches)
  const teamsCurrentlyPlaying = new Set(
    activeMatches.flatMap((m) => [m.teamAId, m.teamBId])
  );

  // All pending matches: not assigned to court and not completed
  const allIncompleteMatches = matches.filter(
    (m) => !m.scheduledCourt && !m.completedAt
  );

  // Matches that can be assigned: pending matches where both teams are free
  const availableMatches = allIncompleteMatches.filter(
    (m) =>
      !teamsCurrentlyPlaying.has(m.teamAId) &&
      !teamsCurrentlyPlaying.has(m.teamBId)
  );

  const courts = tournament.courts || [];
  const occupiedCourts = activeMatches.map((m) => m.scheduledCourt).filter(c => c !== null && c !== undefined);
  const availableCourtNumbers = courts
    .map((c) => c.number)
    .filter((c) => !occupiedCourts.includes(c));

  const highestCourtInUse = occupiedCourts.length > 0 ? Math.max(...occupiedCourts) : 0;
  const canRemoveCourt =
    tournament.totalCourts > 1 && highestCourtInUse < tournament.totalCourts;

  return (
    <div className="space-y-6">
      <div className="mb-4 flex gap-2">
        <Button
          variant="ghost"
          onClick={() => navigate(`/tournament/${tournamentId}`)}
        >
          ← Back to Dashboard
        </Button>
        {!seedRoundCompleted && (
          <Button
            variant="outline"
            onClick={() => navigate(`/tournament/${tournamentId}/seed-round`)}
          >
            Seed Round
          </Button>
        )}
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Courts Dashboard
          </h1>
          <p className="text-muted-foreground">
            {tournament.totalCourts} courts • {activeMatches.length} active
            matches • {availableMatches.length} ready •{" "}
            {allIncompleteMatches.length - availableMatches.length} waiting
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={addCourt}
            disabled={addingCourt}
            variant="outline"
            size="sm"
          >
            + {addingCourt ? "Adding..." : "Add Court"}
          </Button>
          <Button
            onClick={removeCourt}
            disabled={removingCourt || !canRemoveCourt}
            variant="outline"
            size="sm"
          >
            - {removingCourt ? "Removing..." : "Remove Court"}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Courts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tournament.totalCourts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {completedMatches.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Courts in Use
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {activeMatches.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {allIncompleteMatches.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Court Status */}
        <Card>
          <CardHeader>
            <CardTitle>Court Status</CardTitle>
            <CardDescription>Real-time status of all courts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {courts.map((court) => {
                const match = activeMatches.find(
                  (m) => m.scheduledCourt === court.number
                );
                const isEditing = editingCourtId === court.id;
                return (
                  <div
                    key={court.id}
                    className={`p-4 rounded-lg text-center border-2 ${
                      match
                        ? "border-red-200 bg-red-50"
                        : "border-green-200 bg-green-50"
                    }`}
                  >
                    <div className="font-semibold mb-2">
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            value={editingCourtName}
                            onChange={(e) => setEditingCourtName(e.target.value)}
                            placeholder={`Court ${court.number}`}
                            className="text-center text-sm"
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
                              className="text-xs px-2 py-1 h-6"
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEditingCourt}
                              className="text-xs px-2 py-1 h-6"
                            >
                              Cancel
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
                      <div className="text-sm space-y-1">
                        <div className="text-gray-700 font-medium">
                          {(match as any).teamA?.name}
                        </div>
                        <div className="text-xs text-gray-500">vs</div>
                        <div className="text-gray-700 font-medium">
                          {(match as any).teamB?.name}
                        </div>
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
                          className="mt-2 text-xs"
                        >
                          Enter Score
                        </Button>
                      </div>
                    ) : !isEditing ? (
                      <Badge variant="secondary">Available</Badge>
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
              All matches that haven't been completed or assigned. Teams
              currently playing are highlighted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {allIncompleteMatches.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No pending matches
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {allIncompleteMatches.map((match: any) => {
                  const isTeamABusy = teamsCurrentlyPlaying.has(match.teamAId);
                  const isTeamBBusy = teamsCurrentlyPlaying.has(match.teamBId);
                  const canAssign = !isTeamABusy && !isTeamBBusy;

                  return (
                    <div
                      key={match.id}
                      className={`flex items-center justify-between p-3 border rounded-lg ${
                        !canAssign ? "bg-gray-50 opacity-75" : ""
                      }`}
                    >
                      <div className="text-sm">
                        <div
                          className={`font-medium ${
                            isTeamABusy ? "text-gray-600" : ""
                          }`}
                        >
                          {match.teamA?.name}
                          {isTeamABusy && (
                            <span className="ml-1 text-xs">(Playing)</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">vs</div>
                        <div
                          className={`font-medium ${
                            isTeamBBusy ? "text-gray-600" : ""
                          }`}
                        >
                          {match.teamB?.name}
                          {isTeamBBusy && (
                            <span className="ml-1 text-xs">(Playing)</span>
                          )}
                        </div>
                      </div>
                      {!canAssign ? (
                        <Badge
                          variant="outline"
                          className="bg-red-50 text-red-700 border-red-200"
                        >
                          Teams Busy
                        </Badge>
                      ) : availableCourtNumbers.length > 0 ? (
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
                        <Badge variant="secondary">No courts available</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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

export default CourtsDashboardPage;
