'use client';

import React, {useCallback} from 'react';
import {useContract} from '@/contexts/ContractContext';
import {formatNumberForDisplay, formatUserInput} from '@/utils/formatters';
import Input from '@/components/Input';
import PrimaryButton from '@/components/PrimaryButton';
import toast from 'react-hot-toast';

export default function DepositForm() {
    const {
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
        error: contextError,
    } = useContract();

    const SLIPPAGE = 0.05;

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>, isWeth: boolean) => {
            const formatted = formatUserInput(e.target.value);
            if (isWeth) {
                updateWeth(formatted);
            } else {
                updateReth(formatted);
            }
        },
        [updateWeth, updateReth]
    );

    const handleMaxWeth = useCallback(() => {
        if (balanceToken0) updateWeth(balanceToken0);
    }, [balanceToken0, updateWeth]);

    const handleMaxReth = useCallback(() => {
        if (balanceToken1) updateReth(balanceToken1);
    }, [balanceToken1, updateReth]);

    const handleDeposit = async () => {
        try {
            // Approval within the try block to maintain normal gas fees
            const token0Approved = await approveToken0();
            if (!token0Approved) return;

            const token1Approved = await approveToken1();
            if (!token1Approved) return;

            // Add liquidity after both approvals succeed
            const result = await addLiquidity();
            if (result) {
                toast.success('Liquidity added successfully!');
                updateWeth('');
                updateReth('');
            }
        } catch (error) {
            toast.error(`Unexpected error in deposit flow: ${error}`);
        }
    };

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            if (!depositToken0 || !depositToken1) return;
            try {
                await handleDeposit();
            } catch (error) {
                toast.error(`Transaction failed: ${error}`);
            }
        },
        [depositToken0, depositToken1, handleDeposit]
    );

    const isSubmitDisabled = useCallback(() => {
        if (isLoading) return true;
        if (!depositToken0 || !depositToken1) return true;
        if (!balanceToken0 || !balanceToken1) return true;
        const wethAmount = Number(depositToken0);
        const rethAmount = Number(depositToken1);
        if (wethAmount <= 0 || rethAmount <= 0) return true;
        if (wethAmount > Number(balanceToken0)) return true;
        if (rethAmount > Number(balanceToken1)) return true;
        return false;
    }, [isLoading, depositToken0, depositToken1, balanceToken0, balanceToken1]);

    return (
        <div className='mx-auto max-w-md'>
            <form
                onSubmit={handleSubmit}
                className='space-y-4 bg-gray-100 p-6 rounded-lg'
                role='form'
            >
                <h2 className='text-xl font-bold mb-4'>Deposit Liquidity</h2>
                {contextError && (
                    <div className='bg-red-100 text-red-600 p-3 rounded'>
                        {contextError}
                    </div>
                )}
                <div className='mb-2 text-sm text-gray-600'>
                    Slippage Tolerance: {SLIPPAGE * 100}%
                </div>
                <Input
                    label='WETH Amount'
                    value={depositToken0}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleInputChange(e, true)
                    }
                    onMax={handleMaxWeth}
                    balanceDisplay={`${formatNumberForDisplay(
                        Number(balanceToken0 || 0),
                        8
                    )} WETH`}
                    minDisplay={
                        depositToken0
                            ? `${formatNumberForDisplay(
                                  Number(depositToken0) * (1 - SLIPPAGE),
                                  8
                              )} WETH`
                            : '0 WETH'
                    }
                />
                <Input
                    label='RETH Amount'
                    value={depositToken1}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleInputChange(e, false)
                    }
                    onMax={handleMaxReth}
                    balanceDisplay={`${formatNumberForDisplay(
                        Number(balanceToken1 || 0),
                        8
                    )} RETH`}
                    minDisplay={
                        depositToken1
                            ? `${formatNumberForDisplay(
                                  Number(depositToken1) * (1 - SLIPPAGE),
                                  8
                              )} RETH`
                            : '0 RETH'
                    }
                />
                <PrimaryButton
                    disabled={isSubmitDisabled()}
                    isLoading={isLoading}
                    type='submit'
                    data-testid='submit-button'
                >
                    Submit Deposit
                </PrimaryButton>
            </form>
        </div>
    );
}
