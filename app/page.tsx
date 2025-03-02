'use client';

import React from 'react';
import {useAccount, useChainId} from 'wagmi';
import {arbitrum} from 'wagmi/chains';
import DepositForm from '@/components/DepositForm';
import Navbar from '@/components/Navbar';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function Home() {
    const {isConnected, isConnecting, isReconnecting} = useAccount();
    const chainId = useChainId();
    const isLoading = isConnecting || isReconnecting;
    const isCorrectNetwork = chainId === arbitrum.id;

    return (
        <div className='min-h-screen flex flex-col'>
            <Navbar />
            <main className='p-6 flex-grow'>
                {!isLoading && !isConnected && (
                    <p className='text-center text-gray-700 mt-8'>
                        Please connect your wallet.
                    </p>
                )}
                {isLoading && <LoadingSpinner />}
                {!isLoading && isConnected && !isCorrectNetwork && (
                    <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4'>
                        <p>
                            Please switch to the Arbitrum network to continue.
                        </p>
                    </div>
                )}
                {!isLoading && isConnected && isCorrectNetwork && (
                    <div className='mt-6'>
                        <DepositForm />
                    </div>
                )}
            </main>
        </div>
    );
}
