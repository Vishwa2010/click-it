# ClickIt — Claude Code Instructions

**Tagline:** Find the shot. Own the spot.

ClickIt is a crowdsourced photo spot discovery app where photographers and travelers pin exact GPS locations of great shots, share their photos, and compete to discover and document the world's best photography locations. Think Strava for photographers — map-first, gamified, built on real locations found by real people.

---

## Stack

- React Native + Expo (SDK 51+)
- TypeScript — strict mode, no `any` types ever
- Mapbox SDK (react-native-mapbox-gl) for the map
- Supabase for backend (auth, database, storage)
- Cloudinary for photo storage and EXIF extraction
- Zustand for state management
- React Navigation v6 (bottom tabs + stack)
- Expo Notifications for push alerts
- SunCalc.js for golden hour calculations
- OpenWeatherMap API for live conditions

---

## Commands

```
npx expo start          # start dev server
npx expo run:ios        # run on iOS simulator
npx expo run:android    # run on Android emulator
npm run typecheck       # tsc --noEmit
npm run lint            # ESLint
```

Run `typecheck` and `lint` after every set of changes. Fix all errors before moving on.

---

## Environment Variables Required

```
SUPABASE_URL
SUPABASE_ANON_KEY
MAPBOX_ACCESS_TOKEN
CLOUDINARY_CLOUD_NAME
CLOUDINARY_UPLOAD_PRESET
OPENWEATHER_API_KEY
EXPO_PUBLIC_API_URL
```

Never hardcode these. Use Expo's environment variable system (`app.config.ts`).

---

## Project Structure

```
clickit/
├── app.config.ts
├── App.tsx
├── src/
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   ├── TabNavigator.tsx
│   │   └── types.ts
│   ├── screens/
│   │   ├── MapScreen.tsx
│   │   ├── ExploreScreen.tsx
│   │   ├── UploadScreen.tsx
│   │   ├── ChallengesScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── SpotScreen.tsx
│   │   ├── PhotographerScreen.tsx
│   │   ├── RouteBuilderScreen.tsx
│   │   ├── ShotDuelScreen.tsx
│   │   └── ARCompassScreen.tsx
│   ├── components/
│   │   ├── SpotPin.tsx
│   │   ├── SpotCard.tsx
│   │   ├── PhotoGallery.tsx
│   │   ├── ExplorerRankBadge.tsx
│   │   ├── ShotWindowCard.tsx
│   │   ├── ConditionsWidget.tsx
│   │   ├── ChallengeCard.tsx
│   │   ├── DuelCard.tsx
│   │   ├── SpotTwinCard.tsx
│   │   ├── ConfirmSheet.tsx
│   │   └── FilterBar.tsx
│   ├── store/
│   │   ├── useMapStore.ts
│   │   ├── useUserStore.ts
│   │   ├── useSpotsStore.ts
│   │   └── useChallengesStore.ts
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── cloudinary.ts
│   │   ├── suncalc.ts
│   │   ├── exif.ts
│   │   └── xp.ts
│   ├── hooks/
│   │   ├── useLocation.ts
│   │   ├── useSpots.ts
│   │   ├── useShotWindow.ts
│   │   └── useExplorerRank.ts
│   └── types/
│       ├── spot.ts
│       ├── user.ts
│       ├── challenge.ts
│       └── duel.ts
```

---

## Core Data Types

### `src/types/spot.ts`

```ts
export type SpotRank =
  'undiscovered' | 'hidden_gem' | 'popular' | 'iconic' | 'legendary'

export type SpotDifficulty =
  'easy' | 'moderate' | 'hard' | 'permit_required'

export type SpotTag =
  'sunset' | 'sunrise' | 'cityscape' | 'nature' | 'waterfall' |
  'architecture' | 'street_art' | 'rooftop' | 'hidden_gem' | 'night'

export interface Spot {
  id: string
  name: string
  description: string
  latitude: number
  longitude: number
  founder_id: string
  rank: SpotRank
  difficulty: SpotDifficulty
  tags: SpotTag[]
  cover_photo_url: string
  photo_count: number
  navigation_count: number
  best_time_start: string
  best_time_end: string
  gear_recommendation: string
  created_at: string
}

export interface SpotPhoto {
  id: string
  spot_id: string
  user_id: string
  photo_url: string
  taken_at: string
  camera: string
  lens: string
  upvotes: number
  created_at: string
}
```

### `src/types/user.ts`

```ts
export type ExplorerRank =
  'bronze' | 'silver' | 'gold' | 'elite' | 'legend'

export interface User {
  id: string
  username: string
  avatar_url: string
  bio: string
  explorer_rank: ExplorerRank
  xp: number
  spots_founded: number
  spots_visited: number
  countries_visited: number
  cities_visited: number
  photos_uploaded: number
  followers_count: number
  following_count: number
  created_at: string
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  earned_at: string
}
```

### `src/types/challenge.ts`

```ts
export type ChallengeStatus = 'active' | 'completed' | 'expired'

export interface Challenge {
  id: string
  title: string
  description: string
  xp_reward: number
  badge_id: string
  start_date: string
  end_date: string
  requirement_type: string
  requirement_count: number
  user_progress?: number
  status?: ChallengeStatus
}
```

### `src/types/duel.ts`

```ts
export type DuelStatus = 'pending' | 'active' | 'voting' | 'completed'

export interface Duel {
  id: string
  spot_id: string
  challenger_id: string
  opponent_id: string
  challenger_photo_url?: string
  opponent_photo_url?: string
  challenger_votes: number
  opponent_votes: number
  status: DuelStatus
  expires_at: string
  created_at: string
}
```

---

## Screens

### `MapScreen.tsx` — Main map view
- Full screen Mapbox map centered on user location
- Spot pins as custom markers (camera icon, color by rank)
- Pins cluster when zoomed out — expand on zoom in
- Filter bar horizontally scrollable at top: All / Nature / Urban / Architecture / Golden Hour / Hidden Gems / Rooftop
- Active filter highlights in `#FF6B35`
- Tapping a pin opens a bottom sheet SpotCard (50% height)
- SpotCard shows: cover photo, spot name, rank badge, difficulty, shot window, Navigate + View Spot buttons
- Conditions widget bottom left: weather icon + "Perfect light near you"
- "+" FAB bottom right — opens UploadScreen

### `ExploreScreen.tsx` — Discovery feed
- Conditions feed — horizontal scroll of spots with perfect conditions right now
- Spot Twins — pairs of visually similar spots worldwide, side-by-side cards, shareable
- Trending this week — vertical list of SpotCards ranked by navigation count
- Local Experts near you — photographer profiles with Local Expert badge

### `UploadScreen.tsx` — Pin a new spot

**Step 1: Photo**
- Camera view with capture button OR pick from camera roll
- Auto-extract GPS from EXIF — show detected coordinates
- If no GPS found, drop pin manually on mini map

**Step 2: Spot details**
- Check for existing spots within 50m radius
  - Found → "Add to [Spot Name]?" with existing spot preview
  - Not found → "Create new spot — you'll be the Founder!"
- Input: spot name (if new), description
- Tag selector: multi-select pill buttons
- Difficulty selector: Easy / Moderate / Hard / Permit Required
- Gear used: camera body + lens fields
- Optional: 15-second Spot Story video

**Step 3: Confirm + publish**
- Preview card showing how it will look on the map
- Publish button — animates XP gain (+100 if new, +20 if adding to existing)
- Confetti animation on first spot pin

### `ChallengesScreen.tsx`
- Active challenges at top with progress bars and countdown timers
- Leaderboard tab — top explorers this month
- Completed challenges with earned badges
- Upcoming challenges teaser section

### `ProfileScreen.tsx`
- Cover: personal world map showing all pinned spots as dots
- Avatar + username + Explorer rank badge + XP progress bar to next rank
- Stats row: Spots / Countries / Cities / Photos
- Badges grid — earned with lock icon on unearned
- "Spots I founded" horizontal scroll
- "My photos" grid
- Settings gear top right

### `SpotScreen.tsx` — Full spot detail
- Hero photo (full width, 40% screen height)
- Spot name + rank badge + Founder credit
- Shot Window card with sun position visualization
- Photo gallery tabs: Top / Recent / Morning / Golden Hour / Night
- Each photo shows photographer avatar, upvote count, gear used
- Gear recommendation pill: "Best lens: 35mm (voted by 23 photographers)"
- Navigate button (opens native maps with exact coordinates)
- "I shot this" button (opens upload flow pre-filled with this spot)
- Active duel banner if a duel is live at this spot

---

## Design System

### Colors

```
Primary orange:    #FF6B35
Dark background:   #1A1A2E
Surface:           #16213E
Card:              #0F3460
Text primary:      #FFFFFF
Text secondary:    #A8B2C1
Border:            rgba(255,255,255,0.1)
```

Explorer rank colors:
```
Bronze:   #CD7F32
Silver:   #C0C0C0
Gold:     #FFD700
Elite:    #9B59B6
Legend:   #FF6B35
```

Spot rank colors:
```
Undiscovered:  #A8B2C1
Hidden gem:    #2ECC71
Popular:       #3498DB
Iconic:        #F39C12
Legendary:     #E74C3C
```

### Typography
- Headers: 24px bold
- Subheaders: 18px semibold
- Body: 14px regular
- Caption: 12px regular
- Dark theme throughout — all text white or `#A8B2C1`

### Components
- Cards: `#0F3460` bg, `border-radius: 16px`, `border: 1px rgba(255,255,255,0.08)`
- Buttons: `#FF6B35` bg, `border-radius: 12px`, 14px semibold white text
- Bottom sheets: `#16213E` bg, drag handle, `border-radius` top 24px

---

## XP and Rank Logic (`src/lib/xp.ts`)

```ts
export const XP_REWARDS = {
  PIN_NEW_SPOT: 100,
  ADD_TO_EXISTING_SPOT: 20,
  PHOTO_UPVOTED: 10,
  SPOT_NAVIGATED_TO: 50,
  CHALLENGE_COMPLETED_SMALL: 200,
  CHALLENGE_COMPLETED_LARGE: 500,
  DUEL_WON: 150,
  NEW_COUNTRY: 300,
  NEW_CITY: 100,
  LOCAL_EXPERT_EARNED: 400,
}

export const RANK_THRESHOLDS = {
  bronze: 0,
  silver: 1000,
  gold: 5000,
  elite: 15000,
  legend: 40000,
}

export function getRankFromXP(xp: number): ExplorerRank {
  if (xp >= 40000) return 'legend'
  if (xp >= 15000) return 'elite'
  if (xp >= 5000) return 'gold'
  if (xp >= 1000) return 'silver'
  return 'bronze'
}

export function getXPToNextRank(xp: number): number {
  const thresholds = [1000, 5000, 15000, 40000]
  const next = thresholds.find(t => t > xp)
  return next ? next - xp : 0
}
```

---

## Shot Window Logic (`src/lib/suncalc.ts`)

Use SunCalc.js to calculate for any GPS coordinate:
- Sunrise time
- Golden hour start/end (morning)
- Golden hour start/end (evening)
- Blue hour start/end
- Sunset time

Compare community photo upvotes by time of day to determine the community-voted best time window. Combine with SunCalc data to generate the Shot Window display.

Push notification trigger: if user has a spot saved and is within 20km, send a notification 45 minutes before its Shot Window opens.

---

## Supabase Schema

Build these tables:

```
users, spots, spot_photos, spot_saves, spot_navigations,
challenges, user_challenges, badges, user_badges,
duels, duel_votes, followers, spot_tags, gear_tags,
spot_twins, notifications
```

- Row Level Security on all tables
- Users can only edit their own data
- Public read on: `spots`, `spot_photos`, `challenges`
- Authenticated write on everything else

---

## Hard Rules — Never Break These

- No `any` type in TypeScript — ever
- Never store user credentials or tokens in AsyncStorage unencrypted — use Expo SecureStore
- Never auto-submit or auto-navigate without explicit user confirmation
- Always request location permission before accessing GPS
- Always request camera permission before opening camera
- Compress photos to max 2MB before uploading to Cloudinary
- Strip all EXIF data EXCEPT GPS coordinates before display (privacy — never expose camera serial numbers)
- Never show exact coordinates for spots flagged as private property — show approximate area only
- Write loading and error states for every data fetch — never leave a screen blank
- Run `typecheck` and `lint` after every change — fix all errors before stopping

---

## Build Order

Work through these steps in order. After each step confirm it compiles and runs on both iOS and Android simulators before moving to the next.

1. Project setup — Expo + TypeScript + navigation skeleton + Supabase client
2. Auth flow — sign up, login, onboarding (username + 3 interest tags)
3. Map screen — Mapbox map + spot pins + filter bar (mock data first)
4. Spot screen — full detail view with photo gallery
5. Upload flow — camera + EXIF + pin + publish
6. Profile screen — personal map + rank + badges
7. XP system — award XP on actions, rank progression
8. Challenges screen — active challenges + progress bars
9. Shot Window — SunCalc integration + push notifications
10. Explore screen — conditions feed + Spot Twins + trending
11. Shot Duel — challenge + voting flow
12. Route Builder — optimized photo walk generation
13. AR Compass — camera overlay with nearby spot pins

Start with step 1.
