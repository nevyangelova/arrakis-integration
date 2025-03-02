import React from 'react';
import {render, cleanup} from '@testing-library/react';
import {screen, waitFor} from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import {ContractProvider, useContract} from '@/contexts/ContractContext';
import {useAccount, useReadContract, useWriteContract} from 'wagmi';
import {formatUnits, parseUnits} from 'viem';

jest.mock('wagmi', () => ({
    useAccount: jest.fn(),
    useReadContract: jest.fn(),
    useWriteContract: jest.fn(),
}));

jest.mock('viem', () => ({
    formatUnits: jest.fn(),
    parseUnits: jest.fn(),
    zeroAddress: '0x0000000000000000000000000000000000000000',
}));

const TestComponent = () => {
    const {
        underlying,
        balanceToken0,
        balanceToken1,
        depositToken0,
        depositToken1,
        updateWeth,
        updateReth,
        approveToken0,
        approveToken1,
        addLiquidity,
        isLoading,
        error,
    } = useContract();

    return (
        <div>
            <div data-testid='underlying'>
                {underlying
                    ? `${underlying.amount0}/${underlying.amount1}`
                    : 'loading'}
            </div>
            <div data-testid='balances'>
                {balanceToken0}/{balanceToken1}
            </div>
            <div data-testid='deposits'>
                {depositToken0}/{depositToken1}
            </div>
            <button data-testid='updateWeth' onClick={() => updateWeth('0.1')}>
                Update WETH
            </button>
            <button data-testid='updateReth' onClick={() => updateReth('0.2')}>
                Update RETH
            </button>
            <button data-testid='approveToken0' onClick={approveToken0}>
                Approve WETH
            </button>
            <button data-testid='approveToken1' onClick={approveToken1}>
                Approve RETH
            </button>
            <button data-testid='addLiquidity' onClick={addLiquidity}>
                Add Liquidity
            </button>
            <div data-testid='loading'>
                {isLoading ? 'Loading' : 'Not Loading'}
            </div>
            <div data-testid='error'>{error || 'No Error'}</div>
        </div>
    );
};

describe('ContractContext', () => {
    const writeContractAsyncMock = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        (useAccount as jest.Mock).mockReturnValue({
            address: '0x1234567890123456789012345678901234567890',
            isConnected: true,
        });

        (useWriteContract as jest.Mock).mockReturnValue({
            writeContractAsync: writeContractAsyncMock,
        });

        (formatUnits as jest.Mock).mockImplementation((value) => {
            return String(Number(value) / 1e18);
        });
        (parseUnits as jest.Mock).mockImplementation((value) => {
            return BigInt(Number(value) * 1e18);
        });

        // We set the ratio is 1:2.
        // balanceOf returns wallet balances.
        // getMintAmounts returns a mint amount with a minimum of 5e16.
        (useReadContract as jest.Mock).mockImplementation((params) => {
            const {functionName, address} = params;

            if (functionName === 'totalUnderlying') {
                return {
                    data: [BigInt(1e18), BigInt(2e18)],
                    isLoading: false,
                };
            } else if (functionName === 'balanceOf') {
                const addressStr = String(address || '');
                if (addressStr.includes('WETH')) {
                    return {
                        data: BigInt(0.5e18),
                        isLoading: false,
                    };
                } else if (addressStr.includes('RETH')) {
                    return {
                        data: BigInt(1e18),
                        isLoading: false,
                    };
                }
            } else if (functionName === 'getMintAmounts') {
                return {
                    data: [BigInt(1e17), BigInt(2e17), BigInt(5e16)],
                    isLoading: false,
                };
            }
            return {data: undefined, isLoading: true};
        });
    });

    it('should render the provider without crashing', () => {
        render(
            <ContractProvider>
                <TestComponent />
            </ContractProvider>
        );
        expect(screen.getByTestId('underlying')).toBeInTheDocument();
    });

    it('should display underlying pool values correctly', () => {
        render(
            <ContractProvider>
                <TestComponent />
            </ContractProvider>
        );
        expect(screen.getByTestId('underlying')).toHaveTextContent('1/2');
    });

    it('should update token values when user inputs WETH amount (1:2 ratio)', async () => {
        const user = userEvent.setup();
        render(
            <ContractProvider>
                <TestComponent />
            </ContractProvider>
        );

        await user.click(screen.getByTestId('updateWeth'));
        // For 0.1 WETH, with a 1:2 pool ratio, we expect 0.2 RETH (0.1 * (2/1))
        // Underlying [1,2] gives ratio = 2/1 = 2.
        await waitFor(() => {
            const deposits = screen.getByTestId('deposits').textContent;
            expect(deposits).toMatch(/0\.1\/0\.2/);
        });
    });

    it('should update token values when user inputs RETH amount (1:2 ratio)', async () => {
        const user = userEvent.setup();
        render(
            <ContractProvider>
                <TestComponent />
            </ContractProvider>
        );

        await user.click(screen.getByTestId('updateReth'));
        // For 0.2 RETH, computed WETH = 0.2 / 2 = 0.1.
        await waitFor(() => {
            const deposits = screen.getByTestId('deposits').textContent;
            expect(deposits).toMatch(/0\.1.*\/0\.2/);
        });
    });

    it('should update token values correctly with different underlying ratios (2:1 ratio)', async () => {
        // Override the mock for totalUnderlying to simulate a 2:1 ratio (2 WETH, 1 RETH).
        (useReadContract as jest.Mock).mockImplementation((params) => {
            const {functionName, address} = params;
            if (functionName === 'totalUnderlying') {
                return {
                    data: [BigInt(2e18), BigInt(1e18)],
                    isLoading: false,
                };
            } else if (functionName === 'balanceOf') {
                const addressStr = String(address || '');
                if (addressStr.includes('WETH')) {
                    return {
                        data: BigInt(1e18),
                        isLoading: false,
                    };
                } else if (addressStr.includes('RETH')) {
                    return {
                        data: BigInt(0.5e18),
                        isLoading: false,
                    };
                }
            } else if (functionName === 'getMintAmounts') {
                return {
                    data: [BigInt(1e17), BigInt(2e17), BigInt(5e16)],
                    isLoading: false,
                };
            }
            return {data: undefined, isLoading: true};
        });

        const user = userEvent.setup();
        render(
            <ContractProvider>
                <TestComponent />
            </ContractProvider>
        );

        // For updateWeth: 0.1 WETH should yield computed RETH = 0.1 * (1/2) = 0.05.
        await user.click(screen.getByTestId('updateWeth'));
        await waitFor(() => {
            const deposits = screen.getByTestId('deposits').textContent;
            expect(deposits).toMatch(/0\.1\/0\.05/);
        });

        // For updateReth: button for updateReth always sends "0.2", so computed WETH = 0.2 / (1/2) = 0.4.
        await user.click(screen.getByTestId('updateReth'));
        await waitFor(() => {
            const deposits = screen.getByTestId('deposits').textContent;
            expect(deposits).toMatch(/0\.4.*\/0\.2/);
        });
    });

    it('should call approval function when approveToken0 is clicked with valid deposit', async () => {
        const user = userEvent.setup();
        render(
            <ContractProvider>
                <TestComponent />
            </ContractProvider>
        );

        // Set deposit for token0 by updating WETH.
        await user.click(screen.getByTestId('updateWeth'));
        // Call approve for token0.
        await user.click(screen.getByTestId('approveToken0'));

        expect(writeContractAsyncMock).toHaveBeenCalledWith(
            expect.objectContaining({
                functionName: 'approve',
                args: [expect.any(String), parseUnits('0.1', 18)],
            })
        );
    });

    it('should call approval function when approveToken1 is clicked with valid deposit', async () => {
        const user = userEvent.setup();
        render(
            <ContractProvider>
                <TestComponent />
            </ContractProvider>
        );

        // Set deposit for token1 by updating RETH.
        await user.click(screen.getByTestId('updateReth'));
        // Call approve for token1.
        await user.click(screen.getByTestId('approveToken1'));

        expect(writeContractAsyncMock).toHaveBeenCalledWith(
            expect.objectContaining({
                functionName: 'approve',
                args: [expect.any(String), parseUnits('0.2', 18)],
            })
        );
    });

    it('should not call writeContractAsync when approveToken0 is clicked with empty deposit', async () => {
        const user = userEvent.setup();
        render(
            <ContractProvider>
                <TestComponent />
            </ContractProvider>
        );

        // Without updating deposit clicking approve should do nothing.
        await user.click(screen.getByTestId('approveToken0'));
        expect(writeContractAsyncMock).not.toHaveBeenCalled();
    });

    it('should call addLiquidity function with correct parameters', async () => {
        const user = userEvent.setup();
        render(
            <ContractProvider>
                <TestComponent />
            </ContractProvider>
        );

        // Set deposit values via updateWeth (depositToken0 becomes "0.1" and computed depositToken1 becomes "0.2" under 1:2 ratio).
        await user.click(screen.getByTestId('updateWeth'));

        // Call addLiquidity.
        await user.click(screen.getByTestId('addLiquidity'));

        expect(writeContractAsyncMock).toHaveBeenCalledWith(
            expect.objectContaining({
                functionName: 'addLiquidity',
                args: [
                    expect.objectContaining({
                        amount0Max: parseUnits('0.1', 18),
                        amount1Max: parseUnits('0.2', 18),
                        amount0Min: (parseUnits('0.1', 18) * 95n) / 100n,
                        amount1Min: (parseUnits('0.2', 18) * 95n) / 100n,
                        amountSharesMin: BigInt(5e16),
                        vault: expect.any(String),
                        receiver: expect.any(String),
                        gauge: '0x0000000000000000000000000000000000000000',
                    }),
                ],
            })
        );
    });

    it('should not call addLiquidity when mintAmountsArray is undefined', async () => {
        // Override getMintAmounts to return undefined.
        (useReadContract as jest.Mock).mockImplementation((params) => {
            const {functionName, address} = params;
            if (functionName === 'totalUnderlying') {
                return {
                    data: [BigInt(1e18), BigInt(2e18)],
                    isLoading: false,
                };
            } else if (functionName === 'balanceOf') {
                const addressStr = String(address || '');
                if (addressStr.includes('WETH')) {
                    return {
                        data: BigInt(0.5e18),
                        isLoading: false,
                    };
                } else if (addressStr.includes('RETH')) {
                    return {
                        data: BigInt(1e18),
                        isLoading: false,
                    };
                }
            } else if (functionName === 'getMintAmounts') {
                return {
                    data: undefined,
                    isLoading: false,
                };
            }
            return {data: undefined, isLoading: true};
        });

        const user = userEvent.setup();
        render(
            <ContractProvider>
                <TestComponent />
            </ContractProvider>
        );

        await user.click(screen.getByTestId('updateWeth'));
        await user.click(screen.getByTestId('addLiquidity'));
        expect(writeContractAsyncMock).not.toHaveBeenCalled();
    });

    it('should handle error states for approveToken functions', async () => {
        // Simulate failure for approval by overriding useWriteContract.
        (useWriteContract as jest.Mock).mockReturnValue({
            writeContractAsync: jest.fn().mockImplementation(() => {
                return Promise.reject(new Error('Approval failed'));
            }),
        });

        const user = userEvent.setup();
        render(
            <ContractProvider>
                <TestComponent />
            </ContractProvider>
        );

        await user.click(screen.getByTestId('updateWeth'));
        await user.click(screen.getByTestId('approveToken0'));

        await waitFor(() => {
            // The error message should contain "Failed to approve token"
            expect(screen.getByTestId('error').textContent).toContain(
                'Failed to approve token'
            );
        });
    });

    it('should handle error states for addLiquidity function', async () => {
        // Simulate failure for addLiquidity by overriding useWriteContract.
        (useWriteContract as jest.Mock).mockReturnValue({
            writeContractAsync: jest.fn().mockImplementation(() => {
                return Promise.reject(new Error('Liquidity addition failed'));
            }),
        });

        const user = userEvent.setup();
        render(
            <ContractProvider>
                <TestComponent />
            </ContractProvider>
        );

        await user.click(screen.getByTestId('updateWeth'));
        await user.click(screen.getByTestId('addLiquidity'));

        await waitFor(() => {
            expect(screen.getByTestId('error').textContent).toContain(
                'Failed to add liquidity'
            );
        });
    });

    it('should not call any contract write when wallet is disconnected', async () => {
        // Simulate wallet disconnected.
        (useAccount as jest.Mock).mockReturnValue({
            address: undefined,
            isConnected: false,
        });
        const user = userEvent.setup();
        // Render only once.
        render(
            <ContractProvider>
                <TestComponent />
            </ContractProvider>
        );

        await user.click(screen.getByTestId('addLiquidity'));
        await user.click(screen.getByTestId('approveToken0'));
        await user.click(screen.getByTestId('approveToken1'));
        expect(writeContractAsyncMock).not.toHaveBeenCalled();
    });

    it('should not update deposit ratios when underlying is not loaded', async () => {
        // Override totalUnderlying to simulate an unloaded state.
        (useReadContract as jest.Mock).mockImplementation((params) => {
            const {functionName} = params;
            if (functionName === 'totalUnderlying') {
                return {
                    data: undefined,
                    isLoading: true,
                };
            } else if (functionName === 'balanceOf') {
                return {
                    data: BigInt(1e18),
                    isLoading: false,
                };
            }
            return {data: undefined, isLoading: true};
        });

        const user = userEvent.setup();
        render(
            <ContractProvider>
                <TestComponent />
            </ContractProvider>
        );

        // Clicking updateWeth should update depositToken0 but leave depositToken1 empty.
        await user.click(screen.getByTestId('updateWeth'));
        await waitFor(() => {
            const deposits = screen.getByTestId('deposits').textContent;
            // Expect depositToken0 to be "0.1" and depositToken1 to remain empty.
            expect(deposits).toBe('0.1/');
        });
    });
});
