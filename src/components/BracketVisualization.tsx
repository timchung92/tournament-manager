import { BracketMatch, TeamStats } from '../types';
import { Badge } from './ui/badge';
import './BracketVisualization.css';

interface BracketVisualizationProps {
  matches: BracketMatch[];
  leaderboard: TeamStats[];
}

export function BracketVisualization({ matches, leaderboard }: BracketVisualizationProps) {
  if (matches.length === 0) {
    return <div className="text-center py-8 text-gray-500">No bracket data available</div>;
  }

  // Group matches by round
  const roundsMap = new Map<number, BracketMatch[]>();
  matches.forEach(match => {
    if (!roundsMap.has(match.round)) {
      roundsMap.set(match.round, []);
    }
    roundsMap.get(match.round)!.push(match);
  });

  const rounds = Array.from(roundsMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([round, matches]) => ({
      round,
      matches: matches.sort((a, b) => a.matchNumber - b.matchNumber)
    }));

  const maxRounds = Math.max(...rounds.map(r => r.round));

  const getRoundName = (round: number) => {
    const roundsFromFinal = maxRounds - round;
    switch (roundsFromFinal) {
      case 0: return 'Finals';
      case 1: return 'Semifinals';
      case 2: return 'Quarterfinals';
      case 3: return 'Round of 16';
      case 4: return 'Round of 32';
      default: return `Round ${round}`;
    }
  };

  const getTeamSeed = (teamId: string | null | undefined) => {
    if (!teamId) return null;
    const index = leaderboard.findIndex(t => t.teamId === teamId);
    return index >= 0 ? index + 1 : null;
  };

  const getMatchWinner = (match: BracketMatch) => {
    if (!match.completedAt || match.teamAScore === undefined || match.teamBScore === undefined) {
      return null;
    }
    return match.teamAScore > match.teamBScore ? match.teamAId : match.teamBId;
  };

  // Constants for layout
  const MATCH_HEIGHT = 120; // Total height of match box
  const BASE_SPACING = 60; // Base spacing between matches

  // Calculate positioning for each round
  const getMatchPosition = (roundIndex: number, matchIndex: number) => {
    // Each round has exponentially larger spacing
    const spacing = BASE_SPACING * Math.pow(2, roundIndex);
    
    // For first round, matches start at top with regular spacing
    if (roundIndex === 0) {
      return matchIndex * (MATCH_HEIGHT + BASE_SPACING);
    }
    
    // For subsequent rounds, center matches between pairs from previous round
    const prevRoundMatches = rounds[roundIndex - 1].matches.length;
    const prevSpacing = BASE_SPACING * Math.pow(2, roundIndex - 1);
    
    // Each match in this round represents 2 matches from previous round
    const pairStartIndex = matchIndex * 2;
    const pairEndIndex = pairStartIndex + 1;
    
    // Calculate center position between the two parent matches
    const parentMatch1Pos = pairStartIndex * (MATCH_HEIGHT + prevSpacing);
    const parentMatch2Pos = pairEndIndex * (MATCH_HEIGHT + prevSpacing);
    
    return (parentMatch1Pos + parentMatch2Pos + MATCH_HEIGHT) / 2 - MATCH_HEIGHT / 2;
  };

  return (
    <div className="bracket-container">
      <div className="bracket-rounds">
        {rounds.map(({ round, matches }, roundIndex) => (
          <div key={round} className="bracket-round">
            <h3 className="round-title">{getRoundName(round)}</h3>
            <div 
              className="round-matches"
              style={{ 
                position: 'relative',
                height: `${Math.max(
                  matches.length * (MATCH_HEIGHT + BASE_SPACING * Math.pow(2, roundIndex)),
                  rounds[0].matches.length * (MATCH_HEIGHT + BASE_SPACING)
                )}px`
              }}
            >
              {matches.map((match, matchIndex) => {
                const isByeMatch = match.round === 1 && ((match.teamA && !match.teamB) || (!match.teamA && match.teamB));
                const winner = getMatchWinner(match);
                const isLastRound = roundIndex === rounds.length - 1;
                const position = getMatchPosition(roundIndex, matchIndex);
                
                return (
                  <div 
                    key={match.id} 
                    className={`match-container ${!isLastRound ? 'with-connector' : ''}`}
                    style={{
                      position: 'absolute',
                      top: `${position}px`,
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }}
                  >
                    <div className="match-box">
                      {/* Team A */}
                      <div className={`team ${winner === match.teamAId ? 'winner' : ''}`}>
                        <div className="team-info">
                          {match.teamA ? (
                            <>
                              <span className="team-name">{match.teamA.name}</span>
                              <Badge variant="outline" className="team-seed">
                                {getTeamSeed(match.teamAId)}
                              </Badge>
                            </>
                          ) : (
                            <span className="team-placeholder">TBD</span>
                          )}
                        </div>
                        {match.completedAt && (
                          <span className="team-score">{match.teamAScore}</span>
                        )}
                      </div>

                      <div className="match-divider"></div>

                      {/* Team B */}
                      <div className={`team ${winner === match.teamBId ? 'winner' : ''}`}>
                        <div className="team-info">
                          {match.teamB ? (
                            <>
                              <span className="team-name">{match.teamB.name}</span>
                              <Badge variant="outline" className="team-seed">
                                {getTeamSeed(match.teamBId)}
                              </Badge>
                            </>
                          ) : (
                            <span className="team-placeholder">
                              {isByeMatch ? 'BYE' : 'TBD'}
                            </span>
                          )}
                        </div>
                        {match.completedAt && (
                          <span className="team-score">{match.teamBScore}</span>
                        )}
                      </div>

                      {/* Match status */}
                      {isByeMatch && (
                        <div className="match-status">
                          <Badge variant="secondary" className="bye-badge">
                            Advances
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Connection lines */}
                    {!isLastRound && (
                      <div
                        style={{
                          position: 'absolute',
                          left: '100%',
                          top: '50%',
                          width: '4rem',
                          height: '2px',
                          backgroundColor: '#9ca3af',
                          zIndex: 5,
                        }}
                      />
                    )}

                    {/* Vertical connector for pairs */}
                    {!isLastRound && matchIndex % 2 === 0 && matchIndex + 1 < matches.length && (
                      <div
                        style={{
                          position: 'absolute',
                          left: 'calc(100% + 4rem)',
                          top: '50%',
                          width: '2px',
                          height: `${getMatchPosition(roundIndex, matchIndex + 1) - position}px`,
                          backgroundColor: '#9ca3af',
                          zIndex: 5,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Champion display */}
        {rounds.length > 0 && (
          <div className="bracket-round champion-round">
            <h3 className="round-title">Champion</h3>
            <div className="champion-box">
              {(() => {
                const finalMatch = rounds[rounds.length - 1].matches[0];
                const winner = getMatchWinner(finalMatch);
                const winnerTeam = winner 
                  ? (finalMatch.teamA?.id === winner ? finalMatch.teamA : finalMatch.teamB)
                  : null;
                
                return winnerTeam ? (
                  <>
                    <div className="champion-name">{winnerTeam.name}</div>
                    <Badge variant="outline" className="champion-seed">
                      Seed {getTeamSeed(winner)}
                    </Badge>
                  </>
                ) : (
                  <div className="champion-placeholder">TBD</div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}