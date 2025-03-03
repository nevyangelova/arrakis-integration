'use client';

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
    useCallback,
    useMemo,
} from 'react';
import {useAccount, useBalance, useReadContract, useWriteContract} from 'wagmi';
import {formatUnits, parseUnits, zeroAddress} from 'viem';
import {HelperABI, ResolverABI, RouterABI} from '@/lib/abis';
import {
    ARRAKIS_ROUTER_ADDRESS,
    ARRAKIS_HELPER_ADDRESS,
    ARRAKIS_RESOLVER_ADDRESS,
    ARRAKIS_VAULT_ADDRESS,
    WETH_ADDRESS,
    RETH_ADDRESS,
} from '@/lib/constants';
import {formatBlockchainErrorMessage} from '@/utils/formatters';

/**
 * ContractContext - A central place to manage all our DeFi liquidity operations
 *
 * This context provides a clean way to:
 * 1. Read token data from the blockchain
 * 2. Calculate proper ratios between tokens
 * 3. Handle user input for both tokens
 * 4. Process approvals and liquidity transactions
 */

interface ContractContextType {
    token0: string;
    token1: string;
    underlying: {amount0: number; amount1: number} | null;
    balanceToken0: string | null;
    balanceToken1: string | null;
    depositToken0: string;
    depositToken1: string;
    updateWeth: (value: string) => void;
    updateReth: (value: string) => void;
    approveToken0: () => Promise<boolean>;
    approveToken1: () => Promise<boolean>;
    addLiquidity: () => Promise<any>;
    isLoading: boolean;
    error: string | null;
}

const ContractContext = createContext<ContractContextType | undefined>(
    undefined
);

export const ContractProvider = ({children}: {children: ReactNode}) => {
    const {address, isConnected} = useAccount();
    const {writeContractAsync} = useWriteContract();
    const [depositToken0, setDepositToken0] = useState<string>('');
    const [depositToken1, setDepositToken1] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [activeField, setActiveField] = useState<'weth' | 'reth' | null>(
        null
    );
    const SLIPPAGE = 5n; // 5% slippage based on the requirements

    // Check much of each token is already in the liquidity pool
    const {data: underlyingData, isLoading: isLoadingUnderlying} =
        useReadContract({
            address: ARRAKIS_HELPER_ADDRESS,
            abi: HelperABI,
            functionName: 'totalUnderlying',
            args: [ARRAKIS_VAULT_ADDRESS],
        });
    // Convert the raw blockchain data into a more usable format
    // Memoizing the result makes sense since it's an expensive external call
    const underlying = useMemo(() => {
        const underlyingArray = underlyingData as [bigint, bigint] | undefined;
        if (!underlyingArray) return null;

        return {
            amount0: Number(formatUnits(underlyingArray[0], 18)),
            amount1: Number(formatUnits(underlyingArray[1], 18)),
        };
    }, [underlyingData]);

    // Check how much of each token the user already has in their wallet
    // Using wagmi getBalance instead of a hard-coded ABI with useReadContract
    const {data: wethBalanceData, isLoading: isLoadingWeth} = useBalance({
        address,
        token: WETH_ADDRESS,
    });
    const {data: rethBalanceData, isLoading: isLoadingReth} = useBalance({
        address,
        token: RETH_ADDRESS,
    });
    // Convert raw balance data to human-readable format
    const balanceToken0 = wethBalanceData
        ? formatUnits(wethBalanceData.value, wethBalanceData.decimals)
        : null;
    const balanceToken1 = rethBalanceData
        ? formatUnits(rethBalanceData.value, rethBalanceData.decimals)
        : null;

    // Use the resolver contract to calculate how many LP tokens the user get
    const {data: mintAmounts} = useReadContract({
        address: ARRAKIS_RESOLVER_ADDRESS as `0x${string}`,
        abi: ResolverABI,
        functionName: 'getMintAmounts',
        args: [
            ARRAKIS_VAULT_ADDRESS as `0x${string}`,
            depositToken0 ? parseUnits(depositToken0, 18) : 0n,
            depositToken1 ? parseUnits(depositToken1, 18) : 0n,
        ],
        query: {enabled: Boolean(depositToken0) && Boolean(depositToken1)},
    });
    const mintAmountsArray = mintAmounts as
        | [bigint, bigint, bigint]
        | undefined;
    // The third value is how many LP tokens the users get as the minimum acceptable amount
    const mintAmountMin = mintAmountsArray ? mintAmountsArray[2] : 0n;

    // The DeFi router needs permission to move tokens from the wallet
    const approveToken = useCallback(
        async (tokenAddress: string, depositAmount: string) => {
            // TBH we don't need this because we won't be able to see the form
            // or even click the button if there's no deposit amount but I will keep
            if (!isConnected || !depositAmount) return false; // Return false on invalid input
            setLoading(true);
            setError(null);
            try {
                const result = await writeContractAsync({
                    address: tokenAddress as `0x${string}`,
                    abi: [
                        {
                            name: 'approve',
                            type: 'function',
                            inputs: [
                                {name: 'spender', type: 'address'},
                                {name: 'amount', type: 'uint256'},
                            ],
                            outputs: [{name: '', type: 'bool'}],
                            stateMutability: 'nonpayable',
                        },
                    ],
                    functionName: 'approve',
                    args: [
                        ARRAKIS_ROUTER_ADDRESS as `0x${string}`,
                        parseUnits(depositAmount, 18),
                    ],
                });
                return Boolean(result); // Return true if we have a transaction hash
            } catch (error: any) {
                setError(
                    formatBlockchainErrorMessage(
                        error,
                        `Failed to approve token`
                    )
                );
                setError(`Approval error: ${error}`);
                return false;
            } finally {
                setLoading(false);
            }
        },
        [isConnected, writeContractAsync]
    );

    // Approve spending caps
    const approveToken0 = useCallback(() => {
        return approveToken(WETH_ADDRESS, depositToken0);
    }, [approveToken, depositToken0]);

    const approveToken1 = useCallback(() => {
        return approveToken(RETH_ADDRESS, depositToken1);
    }, [approveToken, depositToken1]);

    // Add liquidity to the pool
    const addLiquidity = useCallback(async () => {
        if (!mintAmountsArray) {
            setError(
                'Unable to calculate liquidity amounts. Please try again.'
            );
            return;
        }

        setLoading(true);
        setError(null);
        try {
            // Convert human-readable amounts to (wei)
            const amount0Max = parseUnits(depositToken0, 18);
            const amount1Max = parseUnits(depositToken1, 18);
            // Calculate minimum acceptable amounts with 5% slippage tolerance
            const amount0Min = (amount0Max * 95n) / 100n;
            const amount1Min = (amount1Max * 95n) / 100n;

            // Parameters I got from the router contract ABI
            const result = await writeContractAsync({
                address: ARRAKIS_ROUTER_ADDRESS,
                abi: RouterABI,
                functionName: 'addLiquidity',
                args: [
                    {
                        amount0Max,
                        amount1Max,
                        amount0Min,
                        amount1Min,
                        amountSharesMin: mintAmountMin,
                        vault: ARRAKIS_VAULT_ADDRESS,
                        receiver: address,
                        gauge: zeroAddress,
                    },
                ],
            });
            return result;
        } catch (error: any) {
            setError(
                formatBlockchainErrorMessage(error, 'Failed to add liquidity')
            );
        } finally {
            setLoading(false);
        }
    }, [
        isConnected,
        mintAmountsArray,
        depositToken0,
        depositToken1,
        balanceToken0,
        balanceToken1,
        mintAmountMin,
        writeContractAsync,
        address,
    ]);

    const updateWeth = useCallback((value: string) => {
        setActiveField('weth');
        setDepositToken0(value);
    }, []);

    const updateReth = useCallback((value: string) => {
        setActiveField('reth');
        setDepositToken1(value);
    }, []);

    // This effect automatically calculates the other token amount whenever one changes
    useEffect(() => {
        if (!underlying) return;

        if (activeField === 'weth' && depositToken0) {
            // User entered WETH amount, calculate RETH needed
            const ratio = underlying.amount1 / underlying.amount0;
            const computed = (Number(depositToken0) * ratio).toFixed(18);
            setDepositToken1(computed);
        } else if (activeField === 'reth' && depositToken1) {
            // User entered RETH amount, calculate WETH needed
            const ratio = underlying.amount1 / underlying.amount0;
            const computed = (Number(depositToken1) / ratio).toFixed(18);
            setDepositToken0(computed);
        }
    }, [depositToken0, depositToken1, activeField, underlying]);

    useEffect(() => {
        return () => {
            setError(null);
            setLoading(false);
        };
    }, []);

    const isLoading =
        isLoadingUnderlying || isLoadingWeth || isLoadingReth || loading;

    const value = useMemo(
        () => ({
            token0: WETH_ADDRESS,
            token1: RETH_ADDRESS,
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
        }),
        [
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
        ]
    );

    return (
        <ContractContext.Provider value={value}>
            {children}
        </ContractContext.Provider>
    );
};

// A simple hook to make it easy for components to use this context
export const useContract = (): ContractContextType => {
    const context = useContext(ContractContext);
    if (!context)
        throw new Error('useContract must be used within a ContractProvider');
    return context;
};

export default ContractProvider;
