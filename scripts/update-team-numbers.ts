import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateTeamNumbers() {
  try {
    // Get all tournaments
    const tournaments = await prisma.tournament.findMany({
      include: {
        teams: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    // Update team numbers for each tournament
    for (const tournament of tournaments) {
      console.log(`Updating team numbers for tournament: ${tournament.name}`);
      
      for (let i = 0; i < tournament.teams.length; i++) {
        const team = tournament.teams[i];
        await prisma.team.update({
          where: { id: team.id },
          data: { teamNumber: i + 1 }
        });
        console.log(`  Updated ${team.name} to team #${i + 1}`);
      }
    }

    console.log('All team numbers updated successfully!');
  } catch (error) {
    console.error('Error updating team numbers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateTeamNumbers();