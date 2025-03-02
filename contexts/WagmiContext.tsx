'use client';

import {WagmiProvider} from 'wagmi';
import {QueryClientProvider, QueryClient} from '@tanstack/react-query';
import {RainbowKitProvider} from '@rainbow-me/rainbowkit';
import config from '@/config/wagmi';

const queryClient = new QueryClient();

export function WagmiContext({children}: {children: React.ReactNode}) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider>{children}</RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
