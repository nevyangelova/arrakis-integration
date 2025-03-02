import './globals.css';
import {ReactNode} from 'react';
import {Metadata} from 'next';
import {WagmiContext} from '@/contexts/WagmiContext';
import {ContractProvider} from '@/contexts/ContractContext';

export const metadata: Metadata = {
    title: 'Arrakis Deposit App',
};

export default function RootLayout({children}: {children: ReactNode}) {
    return (
        <html lang='en'>
            <body>
                <WagmiContext>
                    <ContractProvider>{children}</ContractProvider>
                </WagmiContext>
            </body>
        </html>
    );
}
