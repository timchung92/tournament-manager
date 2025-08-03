import { PrismaClient } from '@prisma/client';
import { generateSeedMatches } from '../src/utils/matchGenerator';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create a tournament
  const tournament = await prisma.tournament.create({
    data: {
      name: "Summer Pickleball Championship 2024",
      seedMatchesPerTeam: 3,
      totalCourts: 6,
    },
  });

  console.log(`Created tournament: ${tournament.name}`);

  // Create teams with players (team names auto-generated from player names)
  const teamPlayers = [
    [{ name: "John Smith", gender: "male" }, { name: "Sarah Johnson", gender: "female" }],
    [{ name: "Mike Davis", gender: "male" }, { name: "Emily Wilson", gender: "female" }],
    [{ name: "Chris Brown", gender: "male" }, { name: "Jessica Lee", gender: "female" }],
    [{ name: "David Martinez", gender: "male" }, { name: "Lisa Anderson", gender: "female" }],
    [{ name: "James Taylor", gender: "male" }, { name: "Maria Garcia", gender: "female" }],
    [{ name: "Robert White", gender: "male" }, { name: "Jennifer Thomas", gender: "female" }],
    [{ name: "William Harris", gender: "male" }, { name: "Patricia Clark", gender: "female" }],
    [{ name: "Richard Lewis", gender: "male" }, { name: "Susan Walker", gender: "female" }],
    [{ name: "Joseph Hall", gender: "male" }, { name: "Karen Allen", gender: "female" }],
    [{ name: "Thomas Young", gender: "male" }, { name: "Nancy King", gender: "female" }],
  ];

  // Helper function to generate team name from player names
  const generateTeamName = (player1Name: string, player2Name: string) => {
    return `${player1Name.trim()} & ${player2Name.trim()}`;
  };

  for (const players of teamPlayers) {
    const [player1, player2] = players;
    const teamName = generateTeamName(player1.name, player2.name);
    
    const team = await prisma.team.create({
      data: {
        name: teamName,
        tournamentId: tournament.id,
        players: {
          create: players.map((player) => ({
            name: player.name,
            email: null, // Optional field left empty
            gender: player.gender,
            age: null, // Optional field left empty
            paymentStatus: Math.random() > 0.2 ? 'paid' : 'unpaid',
          })),
        },
      },
      include: {
        players: true,
      },
    });
    console.log(`Created team: ${team.name} with ${team.players.length} players`);
  }

  // Generate seed matches
  const allTeams = await prisma.team.findMany({
    where: { tournamentId: tournament.id },
  });

  const matchesPerTeam = tournament.seedMatchesPerTeam;
  
  // Use proper match generation to avoid duplicates
  const generatedMatches = generateSeedMatches(allTeams, matchesPerTeam);
  
  const matches = generatedMatches.map(match => ({
    tournamentId: tournament.id,
    teamAId: match.teamAId,
    teamBId: match.teamBId,
    roundType: 'seed' as const,
  }));

  // Create all matches
  await prisma.match.createMany({
    data: matches,
  });

  console.log(`Created ${matches.length} seed matches`);

  // Simulate some completed matches with scores
  const createdMatches = await prisma.match.findMany({
    where: { tournamentId: tournament.id },
    take: 12, // Complete first 12 matches
  });

  for (const match of createdMatches) {
    const teamAScore = Math.floor(Math.random() * 6) + 6; // 6-11
    const teamBScore = Math.floor(Math.random() * 6) + 6; // 6-11
    
    // Ensure one team wins
    if (teamAScore === teamBScore) {
      if (Math.random() > 0.5) {
        await prisma.match.update({
          where: { id: match.id },
          data: {
            teamAScore: 11,
            teamBScore: teamBScore - 2,
            completedAt: new Date(),
          },
        });
      } else {
        await prisma.match.update({
          where: { id: match.id },
          data: {
            teamAScore: teamAScore - 2,
            teamBScore: 11,
            completedAt: new Date(),
          },
        });
      }
    } else {
      await prisma.match.update({
        where: { id: match.id },
        data: {
          teamAScore,
          teamBScore,
          completedAt: new Date(),
        },
      });
    }
  }

  console.log('Completed 12 matches with scores');

  // Assign some matches to courts
  const uncompletedMatches = await prisma.match.findMany({
    where: {
      tournamentId: tournament.id,
      completedAt: null,
    },
    take: 4,
  });

  for (let i = 0; i < uncompletedMatches.length; i++) {
    await prisma.match.update({
      where: { id: uncompletedMatches[i].id },
      data: {
        scheduledCourt: i + 1,
        startTime: new Date(),
      },
    });
  }

  console.log('Assigned 4 matches to courts');
  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });