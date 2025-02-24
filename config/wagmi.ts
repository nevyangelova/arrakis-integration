'use client';

import {createConfig, http} from 'wagmi';
import {mainnet, arbitrum} from 'wagmi/chains';
import {injected} from 'wagmi/connectors';
import '@rainbow-me/rainbowkit/styles.css';

const WagmiConfig = createConfig({
    chains: [arbitrum],
    connectors: [
        injected({
            target() {
                return {
                    id: 'windowProvider',
                    name: 'Window Provider',
                    provider: typeof window !== 'undefined' ? window.ethereum : undefined,
                };
            },
        })
    ],
    transports: {
        [mainnet.id]: http(),
        [arbitrum.id]: http(),
    },
    ssr: true,
});

export default WagmiConfig;