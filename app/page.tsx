'use client';

import {ConnectButton} from '@rainbow-me/rainbowkit';
import {useAccount, useChainId} from 'wagmi';
import {arbitrum} from 'wagmi/chains';
import DepositForm from '@/components/DepositForm';

export default function Home() {
    const {isConnected} = useAccount();
    const chainId = useChainId();

    return (
        <main className='p-6'>
            <h1 className='text-2xl font-bold mb-4'>Arrakis Deposit App</h1>
            <ConnectButton chainStatus='icon'/>
            {chainId && chainId !== arbitrum.id && (
                <p className='text-red-500 mt-4'>
                    Please switch to the Arbitrum network to continue.
                </p>
            )}
            {isConnected && (
                <div className='mt-6'>
                    <DepositForm />
                </div>
            )}
        </main>
    );
}
