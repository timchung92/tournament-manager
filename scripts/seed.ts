import { PrismaClient } from '@prisma/client';

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

  // Create teams with players
  const teams = [
    { name: "Thunder Strikers", players: [{ name: "John Smith", age: 35 }, { name: "Sarah Johnson", age: 32 }] },
    { name: "Court Kings", players: [{ name: "Mike Davis", age: 42 }, { name: "Emily Wilson", age: 38 }] },
    { name: "Net Ninjas", players: [{ name: "Chris Brown", age: 28 }, { name: "Jessica Lee", age: 30 }] },
    { name: "Pickle Power", players: [{ name: "David Martinez", age: 45 }, { name: "Lisa Anderson", age: 41 }] },
    { name: "Slam Squad", players: [{ name: "James Taylor", age: 33 }, { name: "Maria Garcia", age: 29 }] },
    { name: "Rally Rebels", players: [{ name: "Robert White", age: 37 }, { name: "Jennifer Thomas", age: 34 }] },
    { name: "Ace Avengers", players: [{ name: "William Harris", age: 40 }, { name: "Patricia Clark", age: 36 }] },
    { name: "Dink Dynasty", players: [{ name: "Richard Lewis", age: 31 }, { name: "Susan Walker", age: 33 }] },
    { name: "Spin Masters", players: [{ name: "Joseph Hall", age: 39 }, { name: "Karen Allen", age: 35 }] },
    { name: "Baseline Bandits", players: [{ name: "Thomas Young", age: 44 }, { name: "Nancy King", age: 40 }] },
  ];

  for (const teamData of teams) {
    const team = await prisma.team.create({
      data: {
        name: teamData.name,
        tournamentId: tournament.id,
        players: {
          create: teamData.players.map((player, index) => ({
            name: player.name,
            email: `${player.name.toLowerCase().replace(' ', '.')}@example.com`,
            gender: index === 0 ? 'male' : 'female',
            age: player.age,
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

  const matches = [];
  const matchesPerTeam = tournament.seedMatchesPerTeam;
  
  // Simple round-robin style generation
  for (let round = 0; round < matchesPerTeam; round++) {
    const shuffledTeams = [...allTeams].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < shuffledTeams.length - 1; i += 2) {
      matches.push({
        tournamentId: tournament.id,
        teamAId: shuffledTeams[i].id,
        teamBId: shuffledTeams[i + 1].id,
        roundType: 'seed',
      });
    }
  }

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