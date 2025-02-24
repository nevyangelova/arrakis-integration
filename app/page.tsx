'use client';

import {ConnectButton} from '@rainbow-me/rainbowkit';
import {useChainId} from 'wagmi';
import {arbitrum} from 'wagmi/chains';

export default function Home() {
    const chainId = useChainId();

    return (
        <main className='p-6'>
            <h1 className='text-2xl font-bold mb-4'>Arrakis Deposit App</h1>
            <ConnectButton 
                chainStatus="icon"
                showBalance={false}
            />
            {chainId && chainId !== arbitrum.id && (
                <p className="text-red-500 mt-4">
                    Please switch to Arbitrum network to continue
                </p>
            )}
        </main>
    );
}
