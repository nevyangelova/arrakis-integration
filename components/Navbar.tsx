import React from 'react';
import {ConnectButton} from '@rainbow-me/rainbowkit';

export default function Navbar() {
    return (
        <nav className='w-full bg-gray-800 text-white py-4 px-6 flex items-center justify-between'>
            <div className='text-2xl font-bold'>Arrakis Deposit</div>
            <div>
                <ConnectButton chainStatus='icon' />
            </div>
        </nav>
    );
}
