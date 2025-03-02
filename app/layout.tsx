import './globals.css';
import {ReactNode} from 'react';
import {Metadata} from 'next';
import {WagmiContext} from '@/contexts/WagmiContext';
import {ContractProvider} from '@/contexts/ContractContext';
import {Toaster} from 'react-hot-toast';
export const metadata: Metadata = {
    title: 'Arrakis Deposit App',
};

export default function RootLayout({children}: {children: ReactNode}) {
    return (
        <html lang='en'>
            <body>
                <Toaster />
                <WagmiContext>
                    <ContractProvider>{children}</ContractProvider>
                </WagmiContext>
            </body>
        </html>
    );
}
