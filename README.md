# 🏓 Pickleball Tournament Manager

A full-stack web application for managing pickleball tournaments with team registration, seed rounds, court management, and playoff brackets.

![Tournament Manager](https://img.shields.io/badge/Tournament-Manager-blue)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue)
![Express](https://img.shields.io/badge/Express-5.1.0-green)
![Prisma](https://img.shields.io/badge/Prisma-6.13.0-purple)

## ✨ Features

### 🏆 Tournament Management
- Create and manage multiple tournaments
- Configure seed matches per team (1-10)
- Set number of courts with dynamic add/remove functionality
- Tournament dashboard with comprehensive overview

### 👥 Team Registration
- Register teams with exactly 2 players each
- Capture player details: name, email, gender, age, payment status
- Form validation for all required fields

### 🎯 Seed Round Management
- Generate random seed matches with configurable matches per team
- Smart match generation avoiding duplicate pairings
- Clear seed round with confirmation dialog
- Real-time match status tracking (Pending → In Progress → Completed)
- Visual stats dashboard showing match progress

### 🏟️ Court Management
- Real-time court status display with color-coded availability
- Assign matches to available courts
- Add/remove courts dynamically during tournament
- Track which teams are idle vs playing
- Smart validation prevents removing courts in use

### 📊 Score Tracking & Leaderboard
- Record match scores with intuitive modal interface
- Calculate point differentials automatically
- Leaderboard ranked by cumulative point differential
- Top 8 teams advance to playoffs

### 🏅 Playoff Bracket
- Foundation for single-elimination bracket
- Auto-seeding based on seed round performance
- (Bracket visualization: coming soon)

## 🚀 Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Express.js + TypeScript
- **Database**: SQLite with Prisma ORM
- **Development**: tsx, concurrently, ESLint

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tournament_manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   npx prisma migrate dev
   ```

4. **Seed the database (optional)**
   ```bash
   npm run db:seed
   ```

## 🏃‍♂️ Running the Application

### Development Mode
```bash
npm run dev
```
This starts both the frontend (port 5173) and backend (port 3001) concurrently.

### Individual Services
```bash
# Frontend only
npm run client

# Backend only
npm run server
```

### Database Commands
```bash
# Seed with test data (10 teams, matches, scores)
npm run db:seed

# Reset database (clear all data)
npm run db:reset

# Reset and seed in one command
npm run db:reset-and-seed
```

## 📁 Project Structure

```
tournament_manager/
├── src/
│   ├── components/
│   │   ├── ui/           # shadcn/ui components
│   │   └── Layout.tsx    # Main navigation layout
│   ├── pages/           # React Router pages
│   ├── types/           # TypeScript type definitions
│   ├── lib/             # Utility functions
│   └── utils/           # Helper functions
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── migrations/      # Database migrations
├── scripts/
│   ├── seed.ts         # Database seeding script
│   └── reset.ts        # Database reset script
└── server.ts           # Express backend server
```

## 🎮 Usage Guide

### Creating a Tournament
1. Navigate to the tournaments page
2. Click "Create Tournament"
3. Enter tournament name
4. Configure settings (courts, matches per team)

### Registering Teams
1. Go to tournament dashboard
2. Click "Register Team"
3. Fill in team name and player details
4. Submit registration

### Managing Seed Rounds
1. Navigate to "Seed Round" page
2. Click "Generate Seed Matches"
3. Configure matches per team (1-10)
4. Generate random pairings

### Court Management
1. Go to "Courts Dashboard"
2. View real-time court status
3. Assign waiting matches to available courts
4. Add/remove courts as needed
5. Enter scores when matches complete

### Viewing Results
1. Check "Leaderboard" for current standings
2. View point differentials and rankings
3. Top 8 teams advance to playoffs

## 🎯 API Endpoints

### Tournaments
- `GET /api/tournaments` - List all tournaments
- `POST /api/tournaments` - Create tournament
- `GET /api/tournaments/:id` - Get tournament details

### Teams & Matches
- `POST /api/tournaments/:id/teams` - Register team
- `GET /api/tournaments/:id/matches` - List matches
- `POST /api/tournaments/:id/matches/generate-seed` - Generate seed matches
- `DELETE /api/tournaments/:id/matches/clear-seed` - Clear seed round

### Court Management
- `PUT /api/tournaments/:id/courts/add` - Add court
- `PUT /api/tournaments/:id/courts/remove` - Remove court
- `PUT /api/matches/:id/assign-court` - Assign match to court
- `PUT /api/matches/:id/score` - Record match score

## 🎨 UI Components

Built with a custom implementation of shadcn/ui:
- **Button**: Multiple variants (primary, destructive, outline)
- **Card**: Container components with headers and content
- **Dialog**: Modal dialogs with proper accessibility
- **Table**: Responsive data tables with sorting
- **Badge**: Status indicators with color variants
- **Input/Label**: Form controls with consistent styling

## 🔧 Development

### Database Changes
```bash
# After modifying prisma/schema.prisma
npx prisma migrate dev --name <migration-name>
npx prisma generate
```

### Code Quality
```bash
# Lint code
npm run lint

# Build for production
npm run build
```

## 🎯 Roadmap

### Planned Features
- **Interactive Bracket Visualization**: Visual tournament bracket
- **Double Elimination**: Alternative bracket format
- **Player Statistics**: Individual performance tracking
- **Real-time Updates**: WebSocket integration
- **Mobile App**: React Native companion

### Technical Improvements
- **Authentication**: User accounts and permissions
- **File Uploads**: Team photos, tournament logos
- **Email Notifications**: Match reminders and updates
- **Analytics Dashboard**: Tournament insights

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/)
- UI components inspired by [shadcn/ui](https://ui.shadcn.com/)
- Database management with [Prisma](https://prisma.io/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)

## 📞 Support

For support and questions:
- Create an issue in this repository
- Check the [CLAUDE.md](CLAUDE.md) file for detailed development documentation

---

Made with ❤️ for the pickleball community