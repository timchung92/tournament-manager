import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Match, Tournament } from "../types";
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

  if (loading || !tournament) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const activeMatches = matches.filter(
    (m) => m.scheduledCourt && !m.result?.completedAt
  );
  const availableMatches = matches.filter(
    (m) => !m.scheduledCourt && !m.result?.completedAt
  );

  const courts = Array.from(
    { length: tournament.totalCourts },
    (_, i) => i + 1
  );
  const occupiedCourts = activeMatches.map((m) => m.scheduledCourt);
  const availableCourts = courts.filter((c) => !occupiedCourts.includes(c));

  const highestCourtInUse = Math.max(
    ...occupiedCourts.filter((c) => c !== null && c !== undefined),
    0
  );
  const canRemoveCourt =
    tournament.totalCourts > 1 && highestCourtInUse < tournament.totalCourts;

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
          <h1 className="text-3xl font-bold tracking-tight">
            Courts Dashboard
          </h1>
          <p className="text-muted-foreground">
            {tournament.totalCourts} courts • {activeMatches.length} active
            matches • {availableMatches.length} waiting
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
              Active Matches
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
              Available Courts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {availableCourts.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Waiting Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {availableMatches.length}
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
              {courts.map((courtNum) => {
                const match = activeMatches.find(
                  (m) => m.scheduledCourt === courtNum
                );
                return (
                  <div
                    key={courtNum}
                    className={`p-4 rounded-lg text-center border-2 ${
                      match
                        ? "border-red-200 bg-red-50"
                        : "border-green-200 bg-green-50"
                    }`}
                  >
                    <div className="font-semibold mb-2">Court {courtNum}</div>
                    {match ? (
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
                    ) : (
                      <Badge variant="secondary">Available</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Available Matches */}
        <Card>
          <CardHeader>
            <CardTitle>Available Matches</CardTitle>
            <CardDescription>
              Matches ready to be assigned to courts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {availableMatches.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No matches available to assign
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {availableMatches.map((match: any) => (
                  <div
                    key={match.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="text-sm font-medium">
                      {match.teamA?.name} vs {match.teamB?.name}
                    </div>
                    {availableCourts.length > 0 ? (
                      <select
                        onChange={(e) => {
                          const court = parseInt(e.target.value);
                          if (court) assignCourt(match.id, court);
                        }}
                        className="text-sm rounded border-input bg-background px-2 py-1"
                        defaultValue=""
                      >
                        <option value="">Assign to court...</option>
                        {availableCourts.map((court) => (
                          <option key={court} value={court}>
                            Court {court}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Badge variant="secondary">No courts available</Badge>
                    )}
                  </div>
                ))}
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
