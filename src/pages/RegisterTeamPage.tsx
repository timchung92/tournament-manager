import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';

interface PlayerFormData {
  name: string;
  email: string;
  gender: 'male' | 'female' | 'other';
  age: string;
  paymentStatus: 'paid' | 'unpaid';
}

function RegisterTeamPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const [teamName, setTeamName] = useState('');
  const [player1, setPlayer1] = useState<PlayerFormData>({
    name: '',
    email: '',
    gender: 'male',
    age: '',
    paymentStatus: 'unpaid',
  });
  const [player2, setPlayer2] = useState<PlayerFormData>({
    name: '',
    email: '',
    gender: 'male',
    age: '',
    paymentStatus: 'unpaid',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teamName || !player1.name || !player2.name || !player1.age || !player2.age) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: teamName,
          players: [
            { ...player1, age: parseInt(player1.age) },
            { ...player2, age: parseInt(player2.age) },
          ],
        }),
      });

      if (response.ok) {
        navigate(`/tournament/${tournamentId}`);
      } else {
        alert('Failed to register team');
      }
    } catch (error) {
      console.error('Error registering team:', error);
      alert('Failed to register team');
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

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-4">
        <Button
          variant="ghost"
          onClick={() => navigate(`/tournament/${tournamentId}`)}
        >
          ← Back to Dashboard
        </Button>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Register Team</h1>
      
      <form onSubmit={handleSubmit} className="space-y-8 bg-white shadow rounded-lg p-6">
        <div>
          <label htmlFor="team-name" className="block text-sm font-medium text-gray-700">
            Team Name
          </label>
          <input
            type="text"
            id="team-name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>

        {[
          { player: player1, num: 1 as const },
          { player: player2, num: 2 as const },
        ].map(({ player, num }) => (
          <div key={num} className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Player {num}</h3>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  value={player.name}
                  onChange={(e) => updatePlayer(num, 'name', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={player.email}
                  onChange={(e) => updatePlayer(num, 'email', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Gender
                </label>
                <select
                  value={player.gender}
                  onChange={(e) => updatePlayer(num, 'gender', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Age
                </label>
                <input
                  type="number"
                  value={player.age}
                  onChange={(e) => updatePlayer(num, 'age', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                  min="1"
                  max="100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Payment Status
                </label>
                <select
                  value={player.paymentStatus}
                  onChange={(e) => updatePlayer(num, 'paymentStatus', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>
          </div>
        ))}

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/tournament/${tournamentId}`)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
          >
            {submitting ? 'Registering...' : 'Register Team'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default RegisterTeamPage;