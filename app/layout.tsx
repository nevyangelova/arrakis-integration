import './globals.css';
import {ReactNode} from 'react';
import {Metadata} from 'next';
import {Providers} from './providers';

export const metadata: Metadata = {
    title: 'Arrakis Deposit App',
};

export default function RootLayout({children}: {children: ReactNode}) {
    return (
        <html lang='en'>
            <body>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
