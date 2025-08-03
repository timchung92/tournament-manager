import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Helper function to generate proper bracket pairings
function generateBracketPairings(bracketSize: number): [number, number][] {
  const pairings: [number, number][] = [];
  const rounds = Math.log2(bracketSize);
  
  // For a proper single elimination bracket, we need to pair teams so that
  // the top seeds meet in later rounds
  // This uses the standard tournament bracket seeding algorithm
  
  function generatePairingsRecursive(seeds: number[]): number[][] {
    if (seeds.length === 2) {
      return [[seeds[0], seeds[1]]];
    }
    
    const half = seeds.length / 2;
    const top: number[] = [];
    const bottom: number[] = [];
    
    // Split seeds alternating between top and bottom halves
    for (let i = 0; i < seeds.length; i++) {
      if (i % 4 < 2) {
        top.push(seeds[i]);
      } else {
        bottom.push(seeds[i]);
      }
    }
    
    // Reverse bottom half to create proper matchups
    bottom.reverse();
    
    // Create matches for this round
    const matches: number[][] = [];
    for (let i = 0; i < half; i++) {
      matches.push([top[i], bottom[i]]);
    }
    
    return matches;
  }
  
  // Generate seed positions 1 through bracketSize
  const seeds = Array.from({ length: bracketSize }, (_, i) => i + 1);
  const matches = generatePairingsRecursive(seeds);
  
  return matches.map(match => [match[0], match[1]] as [number, number]);
}

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
    const { name, seedMatchesPerTeam = 3, totalCourts = 6 } = req.body;
    const tournament = await prisma.tournament.create({
      data: { 
        name,
        seedMatchesPerTeam,
        totalCourts,
      },
    });

    // Create default courts
    const courtData = Array.from({ length: totalCourts }, (_, i) => ({
      number: i + 1,
      tournamentId: tournament.id,
    }));

    await prisma.court.createMany({
      data: courtData,
    });

    const tournamentWithCourts = await prisma.tournament.findUnique({
      where: { id: tournament.id },
      include: { courts: { orderBy: { number: 'asc' } } },
    });

    res.json(tournamentWithCourts);
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
        courts: { orderBy: { number: 'asc' } },
      },
    });
    
    // Create courts if they don't exist (for backward compatibility)
    if (tournament && tournament.courts.length === 0) {
      const courtData = Array.from({ length: tournament.totalCourts }, (_, i) => ({
        number: i + 1,
        tournamentId: tournament.id,
      }));

      await prisma.court.createMany({
        data: courtData,
      });

      const updatedTournament = await prisma.tournament.findUnique({
        where: { id: req.params.id },
        include: {
          teams: {
            include: {
              players: true,
            },
          },
          matches: true,
          courts: { orderBy: { number: 'asc' } },
        },
      });
      
      return res.json(updatedTournament);
    }
    
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

app.put('/api/matches/:id/unassign-court', async (req, res) => {
  try {
    const match = await prisma.match.update({
      where: { id: req.params.id },
      data: {
        scheduledCourt: null,
        startTime: null,
      },
      include: {
        teamA: { include: { players: true } },
        teamB: { include: { players: true } },
      },
    });
    res.json(match);
  } catch (error) {
    res.status(500).json({ error: 'Failed to unassign court' });
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
      include: { courts: { orderBy: { number: 'desc' } } },
    });

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const newCourtNumber = tournament.totalCourts + 1;

    // Create new court
    await prisma.court.create({
      data: {
        number: newCourtNumber,
        tournamentId,
      },
    });

    const updatedTournament = await prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        totalCourts: tournament.totalCourts + 1,
      },
      include: { courts: { orderBy: { number: 'asc' } } },
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
        courts: { orderBy: { number: 'asc' } },
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

    // Remove the highest numbered court from database
    await prisma.court.deleteMany({
      where: {
        tournamentId,
        number: highestCourtNumber,
      },
    });

    const updatedTournament = await prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        totalCourts: tournament.totalCourts - 1,
      },
      include: { courts: { orderBy: { number: 'asc' } } },
    });

    res.json(updatedTournament);
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove court' });
  }
});

// Court name update endpoint
app.put('/api/courts/:courtId/name', async (req, res) => {
  try {
    const { name } = req.body;
    const court = await prisma.court.update({
      where: { id: req.params.courtId },
      data: { name: name || null },
    });
    res.json(court);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update court name' });
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

// Bracket Management
app.post('/api/tournaments/:tournamentId/bracket/generate', async (req, res) => {
  try {
    const tournamentId = req.params.tournamentId;
    const { teamsToAdvance } = req.body;

    // Get tournament and leaderboard
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { teams: true }
    });

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    // Get leaderboard to determine seeding
    const matches = await prisma.match.findMany({
      where: {
        tournamentId,
        roundType: 'seed',
        completedAt: { not: null },
      },
      include: {
        teamA: true,
        teamB: true,
      },
    });

    const teamStats = new Map();
    tournament.teams.forEach(team => {
      teamStats.set(team.id, {
        teamId: team.id,
        teamName: team.name,
        matchesPlayed: 0,
        pointDifferential: 0,
      });
    });

    matches.forEach(match => {
      if (match.teamAScore !== null && match.teamBScore !== null) {
        const teamAStats = teamStats.get(match.teamAId);
        const teamBStats = teamStats.get(match.teamBId);

        teamAStats.matchesPlayed++;
        teamAStats.pointDifferential += (match.teamAScore - match.teamBScore);

        teamBStats.matchesPlayed++;
        teamBStats.pointDifferential += (match.teamBScore - match.teamAScore);
      }
    });

    const leaderboard = Array.from(teamStats.values())
      .filter(team => team.matchesPlayed > 0)
      .sort((a, b) => b.pointDifferential - a.pointDifferential);

    // Determine number of teams advancing
    const numTeamsToAdvance = teamsToAdvance || leaderboard.length;
    
    if (numTeamsToAdvance < 2) {
      return res.status(400).json({ error: 'Need at least 2 teams to generate bracket' });
    }

    if (numTeamsToAdvance > leaderboard.length) {
      return res.status(400).json({ 
        error: `Only ${leaderboard.length} teams have completed matches. Cannot advance ${numTeamsToAdvance} teams.` 
      });
    }

    // Clear existing bracket matches
    await prisma.bracketMatch.deleteMany({
      where: { tournamentId }
    });

    // Take top N teams
    const qualifiedTeams = leaderboard.slice(0, numTeamsToAdvance);
    
    // Calculate bracket size (next power of 2)
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(numTeamsToAdvance)));
    const rounds = Math.log2(bracketSize);
    const byeCount = bracketSize - numTeamsToAdvance;

    // Create bracket matches
    const bracketMatches = [];
    
    // Create a seeding array with nulls for byes
    const seededTeams = [];
    for (let i = 0; i < bracketSize; i++) {
      if (i < qualifiedTeams.length) {
        seededTeams.push(qualifiedTeams[i].teamId);
      } else {
        seededTeams.push(null);
      }
    }

    // Generate matches for each round
    for (let round = 1; round <= rounds; round++) {
      const matchesInRound = Math.pow(2, rounds - round);
      
      for (let matchNum = 0; matchNum < matchesInRound; matchNum++) {
        const match = {
          id: `${tournamentId}-${round}-${matchNum}`,
          tournamentId,
          round,
          matchNumber: matchNum,
          teamAId: null,
          teamBId: null,
        };

        // For first round, assign teams based on seeding with proper bracket pairing
        if (round === 1) {
          // In a proper bracket, matches are paired so top seeds play bottom seeds
          // For match 0: seed 1 vs seed 16 (for 16-team bracket)
          // For match 1: seed 8 vs seed 9
          // For match 2: seed 4 vs seed 13
          // etc.
          const pairings = generateBracketPairings(bracketSize);
          const [topSeedPos, bottomSeedPos] = pairings[matchNum];
          
          match.teamAId = seededTeams[topSeedPos - 1]; // -1 because seeds are 1-based
          match.teamBId = seededTeams[bottomSeedPos - 1];
        }

        // Set up advancement path
        if (round < rounds) {
          const nextRoundMatchNumber = Math.floor(matchNum / 2);
          match.winnerAdvancesToMatchId = `${tournamentId}-${round + 1}-${nextRoundMatchNumber}`;
        }

        bracketMatches.push(match);
      }
    }

    // After creating all matches, handle byes by advancing teams automatically
    for (const match of bracketMatches) {
      if (match.round === 1 && match.teamAId && !match.teamBId) {
        // Team A gets a bye, advance to next round
        if (match.winnerAdvancesToMatchId) {
          const nextMatch = bracketMatches.find(m => m.id === match.winnerAdvancesToMatchId);
          if (nextMatch) {
            const isTeamAPosition = match.matchNumber % 2 === 0;
            if (isTeamAPosition) {
              nextMatch.teamAId = match.teamAId;
            } else {
              nextMatch.teamBId = match.teamAId;
            }
          }
        }
      } else if (match.round === 1 && !match.teamAId && match.teamBId) {
        // Team B gets a bye, advance to next round
        if (match.winnerAdvancesToMatchId) {
          const nextMatch = bracketMatches.find(m => m.id === match.winnerAdvancesToMatchId);
          if (nextMatch) {
            const isTeamAPosition = match.matchNumber % 2 === 0;
            if (isTeamAPosition) {
              nextMatch.teamAId = match.teamBId;
            } else {
              nextMatch.teamBId = match.teamBId;
            }
          }
        }
      }
    }

    // Create all bracket matches
    await prisma.bracketMatch.createMany({
      data: bracketMatches
    });

    // Update tournament settings
    if (teamsToAdvance !== undefined) {
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: { teamsToAdvance }
      });
    }

    res.json({
      message: 'Bracket generated successfully',
      teamsAdvancing: numTeamsToAdvance,
      bracketSize,
      rounds,
      byeCount
    });
  } catch (error) {
    console.error('Error generating bracket:', error);
    res.status(500).json({ error: 'Failed to generate bracket' });
  }
});

app.get('/api/tournaments/:tournamentId/bracket', async (req, res) => {
  try {
    const bracketMatches = await prisma.bracketMatch.findMany({
      where: { tournamentId: req.params.tournamentId },
      orderBy: [
        { round: 'asc' },
        { matchNumber: 'asc' }
      ],
    });

    // Get team details for matches
    const teamIds = new Set();
    bracketMatches.forEach(match => {
      if (match.teamAId) teamIds.add(match.teamAId);
      if (match.teamBId) teamIds.add(match.teamBId);
    });

    const teams = await prisma.team.findMany({
      where: { id: { in: Array.from(teamIds) } }
    });

    const teamMap = new Map(teams.map(team => [team.id, team]));

    // Enhance matches with team data
    const enhancedMatches = bracketMatches.map(match => ({
      ...match,
      teamA: match.teamAId ? teamMap.get(match.teamAId) : null,
      teamB: match.teamBId ? teamMap.get(match.teamBId) : null,
    }));

    res.json(enhancedMatches);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bracket' });
  }
});

app.put('/api/bracket-matches/:id/score', async (req, res) => {
  try {
    const { teamAScore, teamBScore } = req.body;
    const matchId = req.params.id;

    const match = await prisma.bracketMatch.findUnique({
      where: { id: matchId }
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Update the match score
    const updatedMatch = await prisma.bracketMatch.update({
      where: { id: matchId },
      data: {
        teamAScore,
        teamBScore,
        completedAt: new Date(),
      }
    });

    // Determine winner and advance to next match if applicable
    if (match.winnerAdvancesToMatchId) {
      const winnerId = teamAScore > teamBScore ? match.teamAId : match.teamBId;
      
      // Find which position in next match (A or B)
      const nextMatch = await prisma.bracketMatch.findUnique({
        where: { id: match.winnerAdvancesToMatchId }
      });

      if (nextMatch) {
        // Determine if this match feeds into teamA or teamB of next match
        const isTeamAPosition = match.matchNumber % 2 === 0;
        
        await prisma.bracketMatch.update({
          where: { id: match.winnerAdvancesToMatchId },
          data: {
            [isTeamAPosition ? 'teamAId' : 'teamBId']: winnerId
          }
        });
      }
    }

    res.json(updatedMatch);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update bracket match score' });
  }
});

app.delete('/api/tournaments/:tournamentId/bracket', async (req, res) => {
  try {
    await prisma.bracketMatch.deleteMany({
      where: { tournamentId: req.params.tournamentId }
    });

    res.json({ message: 'Bracket cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear bracket' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});