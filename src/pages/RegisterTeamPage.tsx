import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "../components/ui/sheet";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import { Trash2, ChevronDown } from "lucide-react";

interface Player {
  id: string;
  name: string;
  email: string | null;
  gender: "male" | "female" | "other";
  age: number | null;
  paymentStatus: "paid" | "unpaid";
}

interface Team {
  id: string;
  name: string;
  players: Player[];
}

interface PlayerFormData {
  name: string;
  email: string;
  gender: "male" | "female" | "other";
  age: string;
  paymentStatus: "paid" | "unpaid";
}

function RegisterTeamPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  // Form state
  const [teamName, setTeamName] = useState("");
  const [player1, setPlayer1] = useState<PlayerFormData>({
    name: "",
    email: "",
    gender: "male",
    age: "",
    paymentStatus: "unpaid",
  });
  const [player2, setPlayer2] = useState<PlayerFormData>({
    name: "",
    email: "",
    gender: "male",
    age: "",
    paymentStatus: "unpaid",
  });

  useEffect(() => {
    fetchTeams();
  }, [tournamentId]);

  const fetchTeams = async () => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/teams`);
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateTeamName = (p1Name: string, p2Name: string) => {
    if (!p1Name && !p2Name) return "";
    if (!p1Name) return p2Name.trim();
    if (!p2Name) return p1Name.trim();

    return `${p1Name.trim()} & ${p2Name.trim()}`;
  };

  const resetForm = () => {
    setTeamName("");
    setPlayer1({
      name: "",
      email: "",
      gender: "male",
      age: "",
      paymentStatus: "unpaid",
    });
    setPlayer2({
      name: "",
      email: "",
      gender: "male",
      age: "",
      paymentStatus: "unpaid",
    });
  };

  const openAddSheet = () => {
    setEditingTeam(null);
    resetForm();
    setShowOptionalFields(false);
    setSheetOpen(true);
  };

  const openEditSheet = (team: Team) => {
    setEditingTeam(team);
    setTeamName(team.name);
    const [p1, p2] = team.players;
    setPlayer1({
      name: p1.name,
      email: p1.email || "",
      gender: p1.gender,
      age: p1.age ? p1.age.toString() : "",
      paymentStatus: p1.paymentStatus,
    });
    setPlayer2({
      name: p2.name,
      email: p2.email || "",
      gender: p2.gender,
      age: p2.age ? p2.age.toString() : "",
      paymentStatus: p2.paymentStatus,
    });
    
    // Show optional fields if any player has email or age data
    const hasOptionalData = 
      p1.email || p1.age || p2.email || p2.age;
    setShowOptionalFields(hasOptionalData);
    
    setSheetOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!player1.name || !player2.name) {
      alert("Please fill in player names for both players");
      return;
    }

    const generatedTeamName = generateTeamName(player1.name, player2.name);

    setSubmitting(true);
    try {
      const teamData = {
        name: generatedTeamName,
        players: [
          {
            ...player1,
            email: player1.email || null,
            age: player1.age ? parseInt(player1.age) : null,
          },
          {
            ...player2,
            email: player2.email || null,
            age: player2.age ? parseInt(player2.age) : null,
          },
        ],
      };

      const response = editingTeam
        ? await fetch(`/api/teams/${editingTeam.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(teamData),
          })
        : await fetch(`/api/tournaments/${tournamentId}/teams`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(teamData),
          });

      if (response.ok) {
        setSheetOpen(false);
        resetForm();
        fetchTeams();
      } else {
        alert(`Failed to ${editingTeam ? "update" : "create"} team`);
      }
    } catch (error) {
      console.error("Error saving team:", error);
      alert(`Failed to ${editingTeam ? "update" : "create"} team`);
    } finally {
      setSubmitting(false);
    }
  };

  const updatePlayer = (
    playerNum: 1 | 2,
    field: keyof PlayerFormData,
    value: string
  ) => {
    const setter = playerNum === 1 ? setPlayer1 : setPlayer2;
    setter((prev) => ({ ...prev, [field]: value }));
  };

  const openDeleteDialog = (team: Team) => {
    setTeamToDelete(team);
    setDeleteDialogOpen(true);
  };

  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/teams/${teamToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setDeleteDialogOpen(false);
        setTeamToDelete(null);
        fetchTeams();
      } else {
        const errorData = await response.json();
        const message =
          errorData.friendlyMessage ||
          errorData.error ||
          "Failed to delete team";
        alert(message);
      }
    } catch (error) {
      console.error("Error deleting team:", error);
      alert("Failed to delete team");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">Loading...</div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-4">
        <Button
          variant="ghost"
          onClick={() => navigate(`/tournament/${tournamentId}`)}
        >
          ← Back to Dashboard
        </Button>
      </div>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
        <Button onClick={openAddSheet}>Add Team</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <Card key={team.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{team.name}</CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditSheet(team)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openDeleteDialog(team)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {team.players.map((player, index) => (
                  <div
                    key={player.id}
                    className="border-b pb-3 last:border-b-0"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{player.name}</p>
                        {player.email && (
                          <p className="text-sm text-gray-600">
                            {player.email}
                          </p>
                        )}
                      </div>
                      <Badge
                        className={
                          player.paymentStatus === "paid"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                        }
                      >
                        {player.paymentStatus}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      {player.gender}
                      {player.age && ` • Age ${player.age}`}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {teams.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No teams registered yet</p>
          <Button onClick={openAddSheet}>Register First Team</Button>
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {editingTeam ? "Edit Team" : "Add New Team"}
            </SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {(player1.name || player2.name) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team Name (Auto-generated)
                </label>
                <div className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                  {generateTeamName(player1.name, player2.name) ||
                    "Enter player names to see team name"}
                </div>
              </div>
            )}

            {[
              { player: player1, num: 1 as const },
              { player: player2, num: 2 as const },
            ].map(({ player, num }) => (
              <div
                key={num}
                className="space-y-4 p-4 border border-gray-200 rounded-lg"
              >
                <h3 className="text-sm font-medium text-gray-900">
                  Player {num}
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => updatePlayer(num, "name", e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={player.gender}
                    onChange={(e) =>
                      updatePlayer(num, "gender", e.target.value)
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={player.paymentStatus}
                    onChange={(e) =>
                      updatePlayer(num, "paymentStatus", e.target.value)
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>

                {/* Collapsible optional fields */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowOptionalFields(!showOptionalFields)}
                    className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        showOptionalFields ? "rotate-180" : ""
                      }`}
                    />
                    <span>
                      {showOptionalFields ? "Hide" : "Show"} optional fields
                    </span>
                  </button>

                  {showOptionalFields && (
                    <div className="mt-4 space-y-4 pt-4 border-t border-gray-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email (Optional)
                        </label>
                        <input
                          type="email"
                          value={player.email}
                          onChange={(e) =>
                            updatePlayer(num, "email", e.target.value)
                          }
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Age (Optional)
                        </label>
                        <input
                          type="number"
                          value={player.age}
                          onChange={(e) =>
                            updatePlayer(num, "age", e.target.value)
                          }
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                          min="1"
                          max="100"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSheetOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? editingTeam
                    ? "Updating..."
                    : "Creating..."
                  : editingTeam
                  ? "Update Team"
                  : "Create Team"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Delete Team</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the team "{teamToDelete?.name}"?
              This action cannot be undone and will remove both players from the
              tournament.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTeam}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete Team"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RegisterTeamPage;
