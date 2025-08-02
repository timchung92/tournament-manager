import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Resetting database...');

  // Delete all data in reverse order of dependencies
  await prisma.bracketMatch.deleteMany();
  console.log('Deleted all bracket matches');

  await prisma.match.deleteMany();
  console.log('Deleted all matches');

  await prisma.player.deleteMany();
  console.log('Deleted all players');

  await prisma.team.deleteMany();
  console.log('Deleted all teams');

  await prisma.tournament.deleteMany();
  console.log('Deleted all tournaments');

  console.log('Database reset complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });