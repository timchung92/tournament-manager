import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import TournamentsPage from './pages/TournamentsPage';
import TournamentDashboard from './pages/TournamentDashboard';
import RegisterTeamPage from './pages/RegisterTeamPage';
import SeedRoundPage from './pages/SeedRoundPage';
import CourtsDashboardPage from './pages/CourtsDashboardPage';
import LeaderboardPage from './pages/LeaderboardPage';
import BracketPage from './pages/BracketPage';
import BracketVisualizationPage from './pages/BracketVisualizationPage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/tournaments" replace />} />
          <Route path="/tournaments" element={<TournamentsPage />} />
          <Route path="/tournament/:tournamentId" element={<TournamentDashboard />} />
          <Route path="/tournament/:tournamentId/register" element={<RegisterTeamPage />} />
          <Route path="/tournament/:tournamentId/seed-round" element={<SeedRoundPage />} />
          <Route path="/tournament/:tournamentId/courts" element={<CourtsDashboardPage />} />
          <Route path="/tournament/:tournamentId/leaderboard" element={<LeaderboardPage />} />
          <Route path="/tournament/:tournamentId/bracket" element={<BracketPage />} />
          <Route path="/tournament/:tournamentId/bracket/view" element={<BracketVisualizationPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;