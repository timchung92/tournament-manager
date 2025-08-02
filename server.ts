import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Tournaments
app.get('/api/tournaments', async (req, res) => {
  try {
    const tournaments = await prisma.tournament.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tournaments' });
  }
});

app.post('/api/tournaments', async (req, res) => {
  try {
    const { name } = req.body;
    const tournament = await prisma.tournament.create({
      data: { name },
    });
    res.json(tournament);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create tournament' });
  }
});

app.get('/api/tournaments/:id', async (req, res) => {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: req.params.id },
      include: {
        teams: {
          include: {
            players: true,
          },
        },
        matches: true,
      },
    });
    res.json(tournament);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tournament' });
  }
});

// Teams
app.get('/api/tournaments/:tournamentId/teams', async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      where: { tournamentId: req.params.tournamentId },
      include: { players: true },
    });
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

app.post('/api/tournaments/:tournamentId/teams', async (req, res) => {
  try {
    const { name, players } = req.body;
    const team = await prisma.team.create({
      data: {
        name,
        tournamentId: req.params.tournamentId,
        players: {
          create: players,
        },
      },
      include: { players: true },
    });
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create team' });
  }
});

app.put('/api/teams/:teamId', async (req, res) => {
  try {
    const { name, players } = req.body;
    const teamId = req.params.teamId;

    // Update team and replace players
    const team = await prisma.team.update({
      where: { id: teamId },
      data: {
        name,
        players: {
          deleteMany: {},
          create: players,
        },
      },
      include: { players: true },
    });
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update team' });
  }
});

app.delete('/api/teams/:teamId', async (req, res) => {
  try {
    const teamId = req.params.teamId;
    
    // Check if team is in any matches
    const matchesAsTeamA = await prisma.match.findMany({
      where: { teamAId: teamId },
    });
    
    const matchesAsTeamB = await prisma.match.findMany({
      where: { teamBId: teamId },
    });
    
    const totalMatches = matchesAsTeamA.length + matchesAsTeamB.length;
    
    if (totalMatches > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete team that is participating in matches',
        friendlyMessage: `This team cannot be deleted because it is scheduled for ${totalMatches} match${totalMatches === 1 ? '' : 'es'}. Please remove the team from all matches first.`
      });
    }
    
    // Delete the team (cascade will delete players automatically)
    await prisma.team.delete({
      where: { id: teamId },
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete team' });
  }
});

// Matches
app.get('/api/tournaments/:tournamentId/matches', async (req, res) => {
  try {
    const matches = await prisma.match.findMany({
      where: { tournamentId: req.params.tournamentId },
      include: {
        teamA: { include: { players: true } },
        teamB: { include: { players: true } },
      },
    });
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

app.post('/api/tournaments/:tournamentId/matches/generate-seed', async (req, res) => {
  try {
    const tournamentId = req.params.tournamentId;
    const { matchesPerTeam: requestedMatchesPerTeam } = req.body;
    
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { teams: true, matches: { where: { roundType: 'seed' } } },
    });

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    // Delete existing seed matches
    await prisma.match.deleteMany({
      where: {
        tournamentId,
        roundType: 'seed',
      },
    });

    const teams = tournament.teams;
    const matchesPerTeam = requestedMatchesPerTeam || tournament.seedMatchesPerTeam;
    const matches = [];

    // Update tournament with new matchesPerTeam if provided
    if (requestedMatchesPerTeam && requestedMatchesPerTeam !== tournament.seedMatchesPerTeam) {
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: { seedMatchesPerTeam: requestedMatchesPerTeam },
      });
    }

    // Generate round-robin style matches
    for (let round = 0; round < matchesPerTeam; round++) {
      const availableTeams = [...teams];
      
      while (availableTeams.length >= 2) {
        const teamAIndex = Math.floor(Math.random() * availableTeams.length);
        const teamA = availableTeams[teamAIndex];
        availableTeams.splice(teamAIndex, 1);
        
        const teamBIndex = Math.floor(Math.random() * availableTeams.length);
        const teamB = availableTeams[teamBIndex];
        availableTeams.splice(teamBIndex, 1);
        
        matches.push({
          tournamentId,
          teamAId: teamA.id,
          teamBId: teamB.id,
          roundType: 'seed',
        });
      }
    }

    const createdMatches = await prisma.match.createMany({
      data: matches,
    });

    res.json({ message: 'Seed matches generated', count: matches.length, matchesPerTeam });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate seed matches' });
  }
});

app.delete('/api/tournaments/:tournamentId/matches/clear-seed', async (req, res) => {
  try {
    const tournamentId = req.params.tournamentId;
    
    // Delete all seed matches for this tournament
    await prisma.match.deleteMany({
      where: {
        tournamentId,
        roundType: 'seed',
      },
    });

    res.json({ message: 'Seed round cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear seed round' });
  }
});

app.put('/api/matches/:id/assign-court', async (req, res) => {
  try {
    const { courtNumber } = req.body;
    const match = await prisma.match.update({
      where: { id: req.params.id },
      data: {
        scheduledCourt: courtNumber,
        startTime: new Date(),
      },
      include: {
        teamA: { include: { players: true } },
        teamB: { include: { players: true } },
      },
    });
    res.json(match);
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign court' });
  }
});

app.put('/api/matches/:id/score', async (req, res) => {
  try {
    const { teamAScore, teamBScore } = req.body;
    const match = await prisma.match.update({
      where: { id: req.params.id },
      data: {
        teamAScore,
        teamBScore,
        completedAt: new Date(),
        scheduledCourt: null,
      },
    });
    res.json(match);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update score' });
  }
});

// Court Management
app.put('/api/tournaments/:tournamentId/courts/add', async (req, res) => {
  try {
    const tournamentId = req.params.tournamentId;
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const updatedTournament = await prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        totalCourts: tournament.totalCourts + 1,
      },
    });

    res.json(updatedTournament);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add court' });
  }
});

app.put('/api/tournaments/:tournamentId/courts/remove', async (req, res) => {
  try {
    const tournamentId = req.params.tournamentId;
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        matches: {
          where: {
            scheduledCourt: { not: null },
            completedAt: null,
          },
        },
      },
    });

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    if (tournament.totalCourts <= 1) {
      return res.status(400).json({ error: 'Cannot remove the last court' });
    }

    // Check if the highest numbered court is in use
    const highestCourtNumber = tournament.totalCourts;
    const courtInUse = tournament.matches.some(
      match => match.scheduledCourt === highestCourtNumber
    );

    if (courtInUse) {
      return res.status(400).json({ 
        error: `Court ${highestCourtNumber} is currently in use and cannot be removed` 
      });
    }

    const updatedTournament = await prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        totalCourts: tournament.totalCourts - 1,
      },
    });

    res.json(updatedTournament);
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove court' });
  }
});

// Leaderboard
app.get('/api/tournaments/:tournamentId/leaderboard', async (req, res) => {
  try {
    const matches = await prisma.match.findMany({
      where: {
        tournamentId: req.params.tournamentId,
        roundType: 'seed',
        completedAt: { not: null },
      },
      include: {
        teamA: true,
        teamB: true,
      },
    });

    const teamStats = new Map();
    const teams = await prisma.team.findMany({
      where: { tournamentId: req.params.tournamentId },
    });

    teams.forEach(team => {
      teamStats.set(team.id, {
        teamId: team.id,
        teamName: team.name,
        matchesPlayed: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        pointDifferential: 0,
      });
    });

    matches.forEach(match => {
      if (match.teamAScore !== null && match.teamBScore !== null) {
        const teamAStats = teamStats.get(match.teamAId);
        const teamBStats = teamStats.get(match.teamBId);

        teamAStats.matchesPlayed++;
        teamAStats.pointsFor += match.teamAScore;
        teamAStats.pointsAgainst += match.teamBScore;
        teamAStats.pointDifferential = teamAStats.pointsFor - teamAStats.pointsAgainst;

        teamBStats.matchesPlayed++;
        teamBStats.pointsFor += match.teamBScore;
        teamBStats.pointsAgainst += match.teamAScore;
        teamBStats.pointDifferential = teamBStats.pointsFor - teamBStats.pointsAgainst;
      }
    });

    const leaderboard = Array.from(teamStats.values())
      .sort((a, b) => b.pointDifferential - a.pointDifferential);

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});