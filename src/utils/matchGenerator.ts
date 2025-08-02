import { Team } from '../types';

export function generateSeedMatches(teams: Team[], matchesPerTeam: number) {
  const matches = [];
  const teamIds = teams.map(t => t.id);
  
  // Track matches played by each team
  const teamMatchCount = new Map<string, number>();
  const playedPairs = new Set<string>();
  
  teamIds.forEach(id => teamMatchCount.set(id, 0));
  
  // Try to generate matches where each team plays the desired number
  for (let round = 0; round < matchesPerTeam; round++) {
    const availableTeams = [...teamIds].filter(
      id => (teamMatchCount.get(id) || 0) < matchesPerTeam
    );
    
    while (availableTeams.length >= 2) {
      let teamA: string | null = null;
      let teamB: string | null = null;
      let attempts = 0;
      
      // Try to find a valid pairing
      while (attempts < 100 && (!teamA || !teamB)) {
        const indexA = Math.floor(Math.random() * availableTeams.length);
        const potentialTeamA = availableTeams[indexA];
        
        const remainingTeams = availableTeams.filter((_, i) => i !== indexA);
        if (remainingTeams.length === 0) break;
        
        const indexB = Math.floor(Math.random() * remainingTeams.length);
        const potentialTeamB = remainingTeams[indexB];
        
        const pairKey = [potentialTeamA, potentialTeamB].sort().join('-');
        
        if (!playedPairs.has(pairKey)) {
          teamA = potentialTeamA;
          teamB = potentialTeamB;
          playedPairs.add(pairKey);
        }
        
        attempts++;
      }
      
      if (teamA && teamB) {
        matches.push({ teamAId: teamA, teamBId: teamB });
        
        // Update match counts
        teamMatchCount.set(teamA, (teamMatchCount.get(teamA) || 0) + 1);
        teamMatchCount.set(teamB, (teamMatchCount.get(teamB) || 0) + 1);
        
        // Remove teams that have played enough matches
        const indexA = availableTeams.indexOf(teamA);
        if (indexA > -1) availableTeams.splice(indexA, 1);
        
        const indexB = availableTeams.indexOf(teamB);
        if (indexB > -1) availableTeams.splice(indexB, 1);
      } else {
        // If we can't find valid pairings, break out
        break;
      }
    }
  }
  
  return matches;
}