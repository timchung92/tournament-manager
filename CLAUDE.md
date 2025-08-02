# Pickleball Tournament Manager - Claude Assistant Guide

## Project Overview

This is a full-stack web application for managing pickleball tournaments, built with React, TypeScript, Express, Prisma, and SQLite. The application handles tournament creation, team registration, seed round management, court assignments, score tracking, and playoff brackets.

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Express.js + TypeScript
- **Database**: SQLite with Prisma ORM
- **Development**: tsx, concurrently, ESLint

## Project Structure

```
tournament_manager/
├── src/
│   ├── components/
│   │   ├── ui/           # shadcn/ui components (Button, Card, Dialog, etc.)
│   │   └── Layout.tsx    # Main navigation layout
│   ├── pages/           # React Router pages
│   ├── types/           # TypeScript type definitions
│   ├── lib/             # Utility functions (Prisma client, utils)
│   └── utils/           # Helper functions (match generation)
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── migrations/      # Database migrations
├── scripts/
│   ├── seed.ts         # Database seeding script
│   └── reset.ts        # Database reset script
└── server.ts           # Express backend server
```

## Key Features

### 1. Tournament Management
- Create multiple tournaments
- Configure seed matches per team (1-10)
- Set number of courts (default: 6)
- Tournament dashboard with overview

### 2. Team Registration
- Register teams with exactly 2 players each
- Capture player details: name, email, gender, age, payment status
- Validation for required fields

### 3. Seed Round Management
- Generate random seed matches with configurable matches per team
- Smart match generation avoiding duplicate pairings
- Clear seed round with confirmation dialog
- Match status tracking (Pending → In Progress → Completed)
- Visual stats dashboard showing match progress

### 4. Court Management
- Real-time court status display
- Assign matches to available courts
- Track which teams are idle vs playing
- Enter match scores to complete games

### 5. Score Tracking & Leaderboard
- Record match scores (Team A vs Team B)
- Calculate point differentials automatically
- Leaderboard ranked by cumulative point differential
- Top 8 teams advance to playoffs

### 6. Playoff Bracket
- Foundation for single-elimination bracket
- Auto-seeding based on seed round performance
- (Bracket visualization: coming soon)

## Database Schema

### Core Models
- **Tournament**: Top-level container with settings
- **Team**: Two players per team, linked to tournament
- **Player**: Individual player with contact/demographic info
- **Match**: Seed and playoff matches with scores
- **BracketMatch**: Playoff bracket structure

### Key Relationships
- Tournament → Teams (1:many)
- Team → Players (1:2)
- Tournament → Matches (1:many)
- Match → Teams (many:2 via teamAId/teamBId)

## API Endpoints

### Tournaments
- `GET /api/tournaments` - List all tournaments
- `POST /api/tournaments` - Create tournament
- `GET /api/tournaments/:id` - Get tournament with teams/matches

### Teams
- `GET /api/tournaments/:tournamentId/teams` - List teams
- `POST /api/tournaments/:tournamentId/teams` - Register team

### Matches
- `GET /api/tournaments/:tournamentId/matches` - List matches
- `POST /api/tournaments/:tournamentId/matches/generate-seed` - Generate seed matches
- `DELETE /api/tournaments/:tournamentId/matches/clear-seed` - Clear seed round
- `PUT /api/matches/:id/assign-court` - Assign match to court
- `PUT /api/matches/:id/score` - Record match score

### Leaderboard
- `GET /api/tournaments/:tournamentId/leaderboard` - Get team rankings

## Development Commands

```bash
# Start development servers (frontend + backend)
npm run dev

# Start frontend only
npm run client

# Start backend only  
npm run server

# Database operations
npm run db:seed          # Seed with test data
npm run db:reset         # Clear all data
npm run db:reset-and-seed # Reset and seed

# Build for production
npm run build

# Lint code
npm run lint
```

## Database Seeding

The seed script creates realistic test data:
- 1 tournament ("Summer Pickleball Championship 2024")
- 10 teams with 20 players (realistic names/emails)
- Generated seed matches (3 per team default)
- 12 completed matches with scores
- 4 matches assigned to courts (simulating in-progress games)

## shadcn/ui Components

The app uses a custom implementation of shadcn/ui components:
- **Button**: Primary, destructive, outline, ghost variants
- **Card**: Container with header, content, footer sections
- **Dialog**: Modal dialogs with proper accessibility
- **Table**: Responsive data tables
- **Badge**: Status indicators with color variants
- **Input/Label**: Form controls with consistent styling

## Key Business Logic

### Match Generation Algorithm
1. Takes teams and desired matches per team
2. Randomly pairs teams while avoiding duplicates
3. Continues until each team has played desired number of matches
4. Handles odd number of teams gracefully

### Scoring System
- Records exact scores (e.g., 11-7)
- Calculates point differential per team
- Aggregates across all completed matches
- Ranks teams by cumulative point differential

### Court Assignment
- Tracks which courts are occupied
- Shows available matches that can be assigned
- Prevents double-booking courts
- Releases court when match is completed

## UI/UX Patterns

### State Management
- Local state with useState for component data
- Real-time updates after API operations
- Loading states for all async operations
- Error handling with user-friendly messages

### Navigation
- React Router with tournament-scoped routes
- Breadcrumb-style navigation in layout
- Tournament ID in URLs for bookmarking

### Responsive Design
- Mobile-first Tailwind CSS approach
- Grid layouts that adapt to screen size
- Collapsible navigation on small screens

## Common Development Tasks

### Adding New Features
1. Update Prisma schema if database changes needed
2. Run `npx prisma migrate dev` to update database
3. Add API endpoints in `server.ts`
4. Create/update React components in `src/pages/`
5. Add navigation links in `Layout.tsx` if needed

### Styling Components
- Use existing shadcn/ui components when possible
- Follow Tailwind CSS utility-first approach
- Maintain consistent spacing (space-y-4, space-y-6, etc.)
- Use semantic color classes (text-muted-foreground, bg-destructive, etc.)

### Database Operations
- Always use Prisma client for database operations
- Include proper relations in queries (include: { ... })
- Handle errors gracefully with try/catch
- Use transactions for complex operations

## Testing the Application

### Manual Testing Flow
1. Create a tournament
2. Register multiple teams (use seed script for quick setup)
3. Generate seed matches with different matches per team
4. Assign matches to courts
5. Enter scores for completed matches
6. View leaderboard to see rankings
7. Test clearing seed round functionality

### Data Validation
- Form validation prevents invalid data entry
- API endpoints validate required fields
- Database constraints ensure data integrity
- User feedback for validation errors

## Future Enhancements

### Planned Features
- **Bracket Visualization**: Interactive tournament bracket display
- **Double Elimination**: Alternative bracket format
- **Player Statistics**: Individual player performance tracking
- **Tournament Templates**: Reusable tournament configurations
- **Export/Import**: Data export for external analysis
- **Real-time Updates**: WebSocket integration for live updates

### Technical Improvements
- **Authentication**: User accounts and role-based access
- **File Uploads**: Team photos, tournament logos
- **Email Notifications**: Match reminders, tournament updates
- **Mobile App**: React Native companion app
- **Analytics**: Tournament performance insights

## Troubleshooting

### Common Issues
- **Database locked**: Stop all processes, restart dev server
- **Port conflicts**: Check if ports 3001 (backend) or 5173 (frontend) are in use
- **Type errors**: Run `npx prisma generate` after schema changes
- **CSS not loading**: Clear browser cache, restart Vite dev server

### Development Tips
- Use the seed script for consistent test data
- Check browser dev tools for API errors
- Use Prisma Studio (`npx prisma studio`) to inspect database
- Monitor server logs for backend debugging

## Code Quality Standards

### TypeScript
- Strict mode enabled with comprehensive type checking
- Explicit types for all API responses
- Proper interface definitions for all data structures

### Code Organization
- Clear separation of concerns (UI, API, business logic)
- Reusable components in dedicated directories
- Consistent naming conventions throughout

### Error Handling
- Graceful degradation for network issues
- User-friendly error messages
- Proper loading states for better UX