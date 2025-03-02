import React from 'react';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {useContract} from '@/contexts/ContractContext';
import DepositForm from '@/components/DepositForm';
import {formatUserInput} from '@/utils/formatters';
import toast from 'react-hot-toast';

jest.mock('@/contexts/ContractContext', () => ({
    useContract: jest.fn(() => ({
        balanceToken0: '1.5',
        balanceToken1: '2.5',
        depositToken0: '0.5',
        depositToken1: '1.0',
        updateWeth: jest.fn(),
        updateReth: jest.fn(),
        approveToken0: jest.fn().mockResolvedValue(true),
        approveToken1: jest.fn().mockResolvedValue(true),
        addLiquidity: jest.fn().mockResolvedValue('0xtxhash'),
        isLoading: false,
        error: null,
    })),
}));

jest.mock('react-hot-toast', () => ({
    success: jest.fn(),
    error: jest.fn(),
}));

jest.mock('../../utils/formatters', () => ({
    formatNumberForDisplay: jest.fn((num) => num.toFixed(2)),
    formatUserInput: jest.fn((value) => value),
}));

describe('DepositForm Component', () => {
    const mockUseContract = {
        balanceToken0: '1.5',
        balanceToken1: '2.5',
        depositToken0: '0.5',
        depositToken1: '1.0',
        updateWeth: jest.fn(),
        updateReth: jest.fn(),
        approveToken0: jest.fn().mockResolvedValue(true),
        approveToken1: jest.fn().mockResolvedValue(true),
        addLiquidity: jest.fn().mockResolvedValue('0xtxhash'),
        isLoading: false,
        error: null,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (useContract as jest.Mock).mockReturnValue(mockUseContract);
    });

    test('renders form correctly', () => {
        render(<DepositForm />);

        expect(screen.getByText('Deposit Liquidity')).toBeInTheDocument();
        expect(screen.getByText('WETH Amount')).toBeInTheDocument();
        expect(screen.getByText('RETH Amount')).toBeInTheDocument();
        expect(screen.getByText('Submit Deposit')).toBeInTheDocument();
        expect(screen.getByText('Slippage Tolerance: 5%')).toBeInTheDocument();
    });

    test('displays error message when context has error', () => {
        (useContract as jest.Mock).mockReturnValue({
            ...mockUseContract,
            error: 'Test error message',
        });

        render(<DepositForm />);

        expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    test('handles WETH input change correctly', () => {
        render(<DepositForm />);

        const wethInput = screen.getAllByRole('spinbutton')[0];
        fireEvent.change(wethInput, {target: {value: '1.2'}});

        expect(formatUserInput).toHaveBeenCalledWith('1.2');
        expect(mockUseContract.updateWeth).toHaveBeenCalled();
    });

    test('handles RETH input change correctly', () => {
        render(<DepositForm />);

        const rethInput = screen.getAllByRole('spinbutton')[1];
        fireEvent.change(rethInput, {target: {value: '2.2'}});

        expect(formatUserInput).toHaveBeenCalledWith('2.2');
        expect(mockUseContract.updateReth).toHaveBeenCalled();
    });

    test('handles Max button clicks correctly', () => {
        render(<DepositForm />);

        const maxButtons = screen.getAllByText('Max');
        fireEvent.click(maxButtons[0]);

        expect(mockUseContract.updateWeth).toHaveBeenCalledWith('1.5');

        fireEvent.click(maxButtons[1]);
        expect(mockUseContract.updateReth).toHaveBeenCalledWith('2.5');
    });

    test('submit button is disabled when form is invalid', () => {
        (useContract as jest.Mock).mockReturnValue({
            ...mockUseContract,
            depositToken0: '',
            depositToken1: '',
        });

        render(<DepositForm />);

        const submitButton = screen.getByText('Submit Deposit');
        expect(submitButton).toBeDisabled();
    });

    test('submit button is disabled when loading', () => {
        (useContract as jest.Mock).mockReturnValue({
            ...mockUseContract,
            isLoading: true,
        });

        render(<DepositForm />);

        const submitButton = screen.getByText('Processing...');
        expect(submitButton).toBeDisabled();
    });

    test('handles form submission correctly', async () => {
        render(<DepositForm />);

        const form = screen.getByRole('form');
        fireEvent.submit(form);

        await waitFor(() => {
            expect(mockUseContract.approveToken0).toHaveBeenCalled();
            expect(mockUseContract.approveToken1).toHaveBeenCalled();
            expect(mockUseContract.addLiquidity).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalled();
        });
    });

    test('handles submission error correctly', async () => {
        const error = new Error('Transaction failed');
        mockUseContract.approveToken0.mockRejectedValue(error);

        render(<DepositForm />);

        const form = screen.getByRole('form');
        fireEvent.submit(form);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith(
                'Transaction failed: Error: Transaction failed'
            );
        });
    });

    test('displays correct balance and min values', () => {
        render(<DepositForm />);

        expect(screen.getByText('Balance: 1.50 WETH')).toBeInTheDocument();
        expect(screen.getByText('Balance: 2.50 RETH')).toBeInTheDocument();

        // Min values with 5% slippage
        expect(screen.getByText('Min: 0.48 WETH')).toBeInTheDocument();
        expect(screen.getByText('Min: 0.95 RETH')).toBeInTheDocument();
    });
});
