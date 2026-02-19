# 🌱 CarbonPals

A gamified web application for tracking carbon emissions and encouraging eco-friendly behavior through interactive pet avatars, points, badges, and social features.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### 🎯 Core Functionality
- **💳 Expenditure Tracking**: Log spending across categories (fuel, groceries, electricity, etc.)
- **🌍 Carbon Calculation**: Automatic conversion of spending to CO₂ emissions
- **📊 Monthly Baseline**: Establish personal carbon baseline with threshold-based points
- **♻️ Eco-Swaps**: Log eco-friendly actions (biking, public transit, vegetarian meals, secondhand purchases)

### 🎮 Gamification
- **🥚 Pet Avatar**: Interactive pixel-art pet that evolves as you earn XP from eco-swaps
- **🏆 Points System**: 
  - **Reduction Points**: Awarded monthly when emissions stay below baseline
  - **Eco-Swap Points**: Instant rewards for sustainable actions
- **🏅 Badges**: Unlock achievements (First Steps, Carbon Cutter, Planet Saver, Eco Warrior, etc.)
- **📈 Leaderboard**: Compete globally on carbon reduction rankings

### 👥 Social Features
- **📝 Feed**: Share progress, achievements, and eco-tips
- **💬 Comments & Likes**: Engage with the community
- **🎖️ Profile**: Display badges and stats

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (React 19)
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript
- **Testing**: Vitest

### Backend
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase) with RLS policies
- **Authentication**: JWT + Supabase Auth
- **Testing**: Jest (55 tests passing)
- **API Docs**: Swagger/OpenAPI

### DevOps
- **Containerization**: Docker & Docker Compose
- **Mock Mode**: In-memory database for development

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn
- (Optional) Docker & Docker Compose

### Option 1: Mock Mode (Easiest - No Setup Required)

Perfect for development and testing without database setup!

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm run start        # Runs in mock mode by default
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Access the app:**
- 🌐 Frontend: http://localhost:3000
- 🔌 Backend API: http://localhost:3001
- 📚 API Docs: http://localhost:3001/api/docs

**Create an account and start tracking!** No environment variables needed.

### Option 2: Production Mode (With Supabase)

1. **Create Supabase Project**: https://supabase.com

2. **Set up database**:
   ```bash
   # Run schema.sql in Supabase SQL Editor
   cat schema.sql | pbcopy  # Copy schema
   # Paste in Supabase > SQL Editor > New Query > Run
   ```

3. **Configure environment**:
   ```bash
   # Backend
   cd backend
   cp .env.example .env
   # Edit .env with your Supabase credentials
   
   # Set DB_MODE=supabase
   ```

4. **Start servers** (same as Option 1)

### Option 3: Docker Compose

```bash
docker-compose up
```

## 📁 Project Structure

```
carbonpals/
├── frontend/                    # Next.js React app
│   ├── app/
│   │   ├── components/         # Reusable components
│   │   │   ├── EcoSwaps.tsx    # Eco-swap logging UI
│   │   │   ├── NavBar.tsx      # Navigation with auth
│   │   │   └── PetAvatar.tsx   # Pet visualization
│   │   ├── contexts/           # React contexts
│   │   │   └── AuthContext.tsx # Authentication state
│   │   ├── feed/               # Social feed page
│   │   ├── leaderboard/        # Rankings page
│   │   ├── login/              # Login page
│   │   ├── signup/             # Signup page
│   │   └── page.tsx            # Main dashboard
│   └── package.json
│
├── backend/                     # NestJS API
│   ├── src/
│   │   ├── auth/               # Authentication (JWT)
│   │   ├── baseline/           # Carbon baseline & points
│   │   ├── badges/             # Achievement system
│   │   ├── carbon/             # CO₂ calculations
│   │   ├── database/           # Database service (mock + real)
│   │   ├── eco-swaps/          # Eco-friendly actions
│   │   ├── expenditures/       # Spending tracker
│   │   ├── leaderboard/        # Rankings
│   │   ├── pets/               # Pet progression
│   │   └── social/             # Feed, posts, comments
│   └── package.json
│
├── schema.sql                   # PostgreSQL schema
├── docker-compose.yml          # Docker configuration
│
└── Documentation/
    ├── CRITICAL_FEATURES_IMPLEMENTED.md
    ├── AUTH_FIX.md
    ├── POINTS_SYSTEM_EXPLAINED.md
    ├── NETWORK_ERROR_FIX.md
    └── TESTING_MONTH_END.md
```

## 🎮 How It Works

### Monthly Points Cycle

1. **Month 1**: Log expenditures → Establish baseline (e.g., 500 kg CO₂/month)
2. **Month 2**: 
   - Track spending (e.g., 400 kg CO₂)
   - Log eco-swaps (e.g., +50 points)
   - **End of month**: Below baseline! → +100 reduction points
3. **Month 3**: 
   - Track spending (e.g., 550 kg CO₂)
   - **End of month**: Above baseline → 0 reduction points (failed threshold)

### Pet Growth

- Pet gains XP from **eco-swaps only** (not emissions!)
- 50 XP = 1 level
- Pet evolves: 🥚 → 🐣 → 🐥 → 🐓 → ...

### Points Breakdown

| Action | Points |
|--------|--------|
| Biking to work | 15 |
| Secondhand purchase | 20 |
| Public transit | 10 |
| Vegetarian meal | 5 |
| Plant-based meal | 3 |
| Below baseline (monthly) | floor(baseline - actual) |

## 🧪 Testing

### Backend Tests (55 passing)
```bash
cd backend
npm test                 # All tests
npm test baseline        # Baseline service tests
npm test pets            # Pet progression tests
npm test badges          # Badge unlocking tests
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Manual Testing Guide
See `TESTING_MONTH_END.md` for testing the monthly points finalization flow.

## 📚 API Documentation

### Key Endpoints

**Authentication:**
- `POST /auth/signup` - Create account
- `POST /auth/login` - Login
- `GET /auth/me` - Get current user

**Tracking:**
- `POST /expenditures` - Log spending
- `POST /eco-swaps` - Log eco-action
- `GET /baseline/points` - Get points summary
- `GET /baseline/history` - Monthly history

**Social:**
- `GET /social/feed` - Get feed
- `POST /social/posts` - Create post
- `POST /social/posts/:id/comments` - Comment
- `POST /social/posts/:id/like` - Like

**Gamification:**
- `GET /pets/my-pet` - Get pet status
- `GET /badges/my-badges` - Get unlocked badges
- `GET /leaderboard` - Get rankings

Full API docs: http://localhost:3001/api/docs

## 🔧 Configuration

### Environment Variables

**Backend** (`backend/.env`):
```env
NODE_ENV=development
DB_MODE=mock              # or 'supabase'
PORT=3001

# Only needed if DB_MODE=supabase
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

JWT_SECRET=your-secret-key
```

**Frontend** (`frontend/.env.local`):
```env
# Not needed in mock mode!
# Only if using real Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 🎯 Development Workflow

### Feature Development
1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes
3. Run tests: `npm test`
4. Commit: `git commit -m "Add feature"`
5. Push: `git push origin feature/your-feature`
6. Create PR to `dev` branch

### Code Quality
- Backend: 55/55 tests passing ✅
- Frontend: Build passes ✅
- TypeScript: Strict mode enabled
- Linting: ESLint configured

## 📖 Documentation

- **AUTH_FIX.md** - Authentication system setup
- **POINTS_SYSTEM_EXPLAINED.md** - How points work
- **CRITICAL_FEATURES_IMPLEMENTED.md** - Implementation details
- **NETWORK_ERROR_FIX.md** - Troubleshooting guide
- **TESTING_MONTH_END.md** - Month-end testing guide

## 🐛 Troubleshooting

### "NetworkError when attempting to fetch resource"
→ Backend not running. Start with `cd backend && npm run start`

### Points not updating after eco-swap
→ Backend restarted with fix applied (see POINTS_SYSTEM_EXPLAINED.md)

### Can't sign up
→ Check backend is running on port 3001

## 🚧 Roadmap

### Phase 2 (Important)
- [ ] User profile page (edit display name, avatar)
- [ ] Auto-trigger badge checks after actions
- [ ] Leaderboard cache for performance

### Phase 3 (Nice-to-Have)
- [ ] Pet customization (choose species, colors)
- [ ] Monthly carbon goals
- [ ] Export/reports (PDF, CSV)
- [ ] Push notifications

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

Built with ❤️ for a more sustainable future 🌍

---

**Happy carbon tracking! 🌱**
