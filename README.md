# AIKIRA: Data Heist

An endless runner arcade-style game with a futuristic AI interface theme. Players must connect their crypto wallet to play, collect data, avoid traps, and compete for the highest score on the leaderboard.

## Game Overview

- **Game Type:** Endless runner or tap-to-dodge arcade-style game
- **Theme:** Futuristic AI interface / corrupted data grid
- **Goal:** Collect data, avoid traps, get the highest score
- **Access:** Must connect wallet (Phantom, Rainbow, or WalletConnect-compatible) to play

## Features

### Wallet Connection
- Supported Wallets:
  - Phantom
  - Rainbow
  - WalletConnect
- Network: Base
- Wallet connection is required before gameplay begins

### Leaderboard
- Displays top scores by connected wallet
- Each record stores:
  - Wallet address (shortened)
  - High score
  - Date of last game
- Leaderboard stored off-chain (Supabase) or optionally mirrored on-chain via Base contract

### Game Loop Flow
1. **Connect Wallet**
   - Phantom / RainbowKit prompt
   - Confirm Base network
2. **Start Game**
   - Loads arcade screen
   - Controls: tap/spacebar/jump/dodge to collect data and survive
3. **End Game**
   - Score submitted to backend (via wallet address)
   - If higher than last score → update leaderboard
   - Player shown their rank
4. **Leaderboard View**
   - Live display of top 100 wallet addresses
   - Player can see their own position

## Tech Stack

| Component | Tool |
|-----------|------|
| Frontend | React + Phaser.js |
| Wallet Connect | RainbowKit + Wagmi (Phantom integrated) |
| Network | Base (Ethereum L2) |
| Leaderboard DB | Supabase |
| Optional On-Chain | Solidity + Base contract (optional) |
| Hosting | Vercel / Netlify |

## Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/yourusername/aikira-data-heist.git
cd aikira-data-heist
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on the `.env.example` template:
```bash
cp .env.example .env
```

4. Fill in your environment variables:
- `REACT_APP_WALLETCONNECT_PROJECT_ID` - Get from [WalletConnect Cloud](https://cloud.walletconnect.com/)
- `REACT_APP_SUPABASE_URL` - Your Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY` - Your Supabase anon/public key

5. Start the development server:
```bash
npm start
```

## Game Controls

- **Spacebar/Tap/Click:** Jump/Dodge
- **M Key:** Toggle mute

## File Structure

The project follows a modular structure with separated components and their CSS:

```
aikira-data-heist/
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   ├── context/            # React context providers
│   ├── game/               # Game logic and Phaser implementation
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page components
│   ├── services/           # API and external services
│   ├── styles/             # Global styles
│   └── utils/              # Helper functions
└── ...
```

## Supabase Setup

1. Create a new project on [Supabase](https://supabase.com/)
2. Create a `leaderboard` table with the following structure:
```sql
CREATE TABLE leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL UNIQUE,
  score INTEGER NOT NULL,
  last_played TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX leaderboard_score_idx ON leaderboard(score DESC);
```

## Deployment

### Vercel
1. Connect your GitHub repository to Vercel
2. Add your environment variables in the Vercel project settings
3. Deploy!

### Netlify
1. Connect your GitHub repository to Netlify
2. Add your environment variables in the Netlify project settings
3. Deploy!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.