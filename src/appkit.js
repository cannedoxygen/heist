import { createAppKit } from '@reown/appkit/react'
import { WagmiProvider } from 'wagmi'
import { base, mainnet } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'

// 0. Setup queryClient
const queryClient = new QueryClient()

// 1. Get projectId from https://cloud.walletconnect.com
const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || '9a0374575383749a8967f0039bd2c7f5'

// 2. Create a metadata object - optional
const metadata = {
  name: 'Aikira Heist',
  description: 'AIKIRA: Data Heist - Endless runner game with futuristic AI interface',
  url: window.location.origin, // origin will match your domain & subdomain
  icons: ['https://assets.reown.com/reown-profile-pic.png']
}

// 3. Set the networks
const networks = [mainnet, base]

// 4. Create Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: typeof window === 'undefined'
})

// 5. Create modal
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  features: {
    analytics: true // Optional - defaults to your Cloud configuration
  }
})

export function AppKitProvider({ children }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}