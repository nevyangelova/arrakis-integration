'use client';

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from 'react';
import {useAccount, useReadContract, useWriteContract} from 'wagmi';
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
    approveToken0: () => Promise<void>;
    approveToken1: () => Promise<void>;
    addLiquidity: () => Promise<void>;
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
    const underlyingArray = underlyingData as [bigint, bigint] | undefined;
    const underlying = underlyingArray
        ? {
              amount0: Number(underlyingArray[0]) / 1e18, // Convert from Wei to normal units
              amount1: Number(underlyingArray[1]) / 1e18,
          }
        : null;

    // Check how much of each token the user already has in their wallet
    const {data: balanceToken0Data, isLoading: isLoadingBalance0} =
        useReadContract({
            address: WETH_ADDRESS as `0x${string}`,
            abi: [
                {
                    name: 'balanceOf',
                    type: 'function',
                    inputs: [{name: 'account', type: 'address'}],
                    outputs: [{name: 'balance', type: 'uint256'}],
                    stateMutability: 'view',
                },
            ],
            functionName: 'balanceOf',
            args: [address!],
            query: {enabled: Boolean(address)},
        });
    const {data: balanceToken1Data, isLoading: isLoadingBalance1} =
        useReadContract({
            address: RETH_ADDRESS as `0x${string}`,
            abi: [
                {
                    name: 'balanceOf',
                    type: 'function',
                    inputs: [{name: 'account', type: 'address'}],
                    outputs: [{name: 'balance', type: 'uint256'}],
                    stateMutability: 'view',
                },
            ],
            functionName: 'balanceOf',
            args: [address!],
            query: {enabled: Boolean(address)},
        });
    // Convert raw balance data to human-readable format
    const balanceToken0 = balanceToken0Data
        ? formatUnits(balanceToken0Data, 18)
        : null;
    const balanceToken1 = balanceToken1Data
        ? formatUnits(balanceToken1Data, 18)
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
    console.log({mintAmounts});
    const mintAmountsArray = mintAmounts as
        | [bigint, bigint, bigint]
        | undefined;
    // The third value is how many LP tokens the users get as the minimum acceptable amount
    const mintAmountMin = mintAmountsArray ? mintAmountsArray[2] : 0n;

        const updateWeth = (value: string) => {
        setActiveField('weth');
        setDepositToken0(value);
    };
    
    const updateReth = (value: string) => {
        setActiveField('reth');
        setDepositToken1(value);
    };

    // This effect automatically calculates the other token amount whenever one changes
    // It's important to maintain the correct ratio based on what's already in the pool
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

    // The DeFi router needs permission to move tokens from the wallet
    const approveToken = async (
        tokenAddress: string,
        depositAmount: string
    ) => {
        if (!isConnected || !depositAmount) return;
        try {
            await writeContractAsync({
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
                    parseUnits(depositAmount, 18), // Convert from user-friendly number to blockchain format
                ],
            });
        } catch (error) {
            setError(`Failed to approve token at ${tokenAddress}`);
        }
    };

    // Aprove spending caps
    const approveToken0 = async () =>
        await approveToken(WETH_ADDRESS, depositToken0);
    const approveToken1 = async () =>
        await approveToken(RETH_ADDRESS, depositToken1);

    // Add liquidity to the pool
    const addLiquidity = async () => {
        if (!isConnected || !mintAmountsArray) return;
        try {
            // Convert human-readable amounts to (wei)
            const amount0Max = parseUnits(depositToken0, 18);
            const amount1Max = parseUnits(depositToken1, 18);
            
            // Calculate minimum acceptable amounts with 5% slippage tolerance
            const amount0Min = (amount0Max * 95n) / 100n;
            const amount1Min = (amount1Max * 95n) / 100n;

            console.log({
                amount0Max: amount0Max.toString(),
                amount1Max: amount1Max.toString(),
                amount0Min: amount0Min.toString(),
                amount1Min: amount1Min.toString(),
                amountSharesMin: mintAmountMin.toString(),
                mintAmountsArray,
            });
            
            // Parameters I got from the router contract ABI
            await writeContractAsync({
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
        } catch (error) {
            setError('Failed to add liquidity');
        }
    };

    const isLoading =
        isLoadingUnderlying || isLoadingBalance0 || isLoadingBalance1;

    const value = {
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
    };

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
