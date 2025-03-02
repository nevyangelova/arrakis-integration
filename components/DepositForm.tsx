'use client';

import React, { useCallback} from 'react';
import {useContract} from '@/contexts/ContractContext';
import {formatNumberForDisplay, formatUserInput} from '@/utils/formatters';

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

    const SLIPPAGE = 0.05; // 5% slippage

    const handleMaxWeth = () => {
        if (balanceToken0) updateWeth(balanceToken0);
    };

    const handleMaxReth = () => {
        if (balanceToken1) updateReth(balanceToken1);
    };

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, isWeth: boolean) => {
        const formattedValue = formatUserInput(e.target.value);
        isWeth ? updateWeth(formattedValue) : updateReth(formattedValue);
    }, [updateWeth, updateReth]);

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            if (!depositToken0 || !depositToken1) return;
            try {
                await approveToken0();
                await approveToken1();
                await addLiquidity();
            } catch (error) {
                console.error('Transaction failed:', error);
            }
        },
        [approveToken0, approveToken1, addLiquidity]
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
                {/* WETH Input */}
                <div>
                    <label className='block text-sm font-medium text-gray-700'>
                        WETH Amount
                    </label>
                    <div className='mt-1 flex rounded-md shadow-sm'>
                        <input
                            value={depositToken0}
                            onChange={(e) => handleInputChange(e, true)}
                            className='flex-1 border rounded-l-md p-2'
                            placeholder='0.0'
                        />
                        <button
                            type='button'
                            onClick={handleMaxWeth}
                            className='bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600'
                        >
                            Max
                        </button>
                    </div>
                    <div className='mt-1 flex justify-between text-sm text-gray-500'>
                        <span>
                            Balance:{' '}
                            {formatNumberForDisplay(
                                Number(balanceToken0 || 0),
                                5
                            )}{' '}
                            WETH
                        </span>
                        <span>
                            Min:{' '}
                            {depositToken0
                                ? formatNumberForDisplay(
                                      Number(depositToken0) * (1 - SLIPPAGE),
                                      5
                                  )
                                : '0'}{' '}
                            WETH
                        </span>
                    </div>
                </div>
                {/* RETH Input */}
                <div>
                    <label className='block text-sm font-medium text-gray-700'>
                        RETH Amount
                    </label>
                    <div className='mt-1 flex rounded-md shadow-sm'>
                        <input
                            value={depositToken1}
                            onChange={(e) => handleInputChange(e, false)}
                            className='flex-1 border rounded-l-md p-2'
                            placeholder='0.0'
                        />
                        <button
                            type='button'
                            onClick={handleMaxReth}
                            className='bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600'
                        >
                            Max
                        </button>
                    </div>
                    <div className='mt-1 flex justify-between text-sm text-gray-500'>
                        <span>
                            Balance:{' '}
                            {formatNumberForDisplay(
                                Number(balanceToken1 || 0),
                                5
                            )}{' '}
                            RETH
                        </span>
                        <span>
                            Min:{' '}
                            {depositToken1
                                ? formatNumberForDisplay(
                                      Number(depositToken1) * (1 - SLIPPAGE),
                                      5
                                  )
                                : '0'}{' '}
                            RETH
                        </span>
                    </div>
                </div>
                <button
                    type='submit'
                    disabled={isSubmitDisabled()}
                    className={`
            w-full py-3 rounded-lg font-medium text-white text-lg
            transition-all duration-200
            ${
                isSubmitDisabled()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-600 active:transform active:scale-[0.98]'
            }
          `}
                >
                    {isLoading ? (
                        <div className='flex items-center justify-center gap-2'>
                            <svg
                                className='animate-spin h-5 w-5 text-white'
                                xmlns='http://www.w3.org/2000/svg'
                                fill='none'
                                viewBox='0 0 24 24'
                            >
                                <circle
                                    className='opacity-25'
                                    cx='12'
                                    cy='12'
                                    r='10'
                                    stroke='currentColor'
                                    strokeWidth='4'
                                ></circle>
                                <path
                                    className='opacity-75'
                                    fill='currentColor'
                                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                                ></path>
                            </svg>
                            Processing...
                        </div>
                    ) : (
                        'Submit Deposit'
                    )}
                </button>
            </form>
        </div>
    );
}
