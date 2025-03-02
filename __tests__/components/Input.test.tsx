import React from 'react';
import {render, screen, fireEvent} from '@testing-library/react';
import Input from '@/components/Input';

describe('Input Component', () => {
    const mockProps = {
        label: 'Test Label',
        value: '10',
        onChange: jest.fn(),
        onMax: jest.fn(),
        balanceDisplay: '100 WETH',
        minDisplay: '9.5 WETH',
        placeholder: '0.0',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders correctly with all props', () => {
        render(<Input {...mockProps} />);

        expect(screen.getByText('Test Label')).toBeInTheDocument();

        const input = screen.getByPlaceholderText('0.0') as HTMLInputElement;
        expect(input.value).toBe('10');

        expect(screen.getByText('Max')).toBeInTheDocument();

        expect(screen.getByText('Balance: 100 WETH')).toBeInTheDocument();
        expect(screen.getByText('Min: 9.5 WETH')).toBeInTheDocument();
    });

    test('calls onChange when input value changes', () => {
        render(<Input {...mockProps} />);

        const input = screen.getByPlaceholderText('0.0');
        fireEvent.change(input, {target: {value: '20'}});

        expect(mockProps.onChange).toHaveBeenCalled();
    });

    test('calls onMax when Max button is clicked', () => {
        render(<Input {...mockProps} />);

        const maxButton = screen.getByText('Max');
        fireEvent.click(maxButton);

        expect(mockProps.onMax).toHaveBeenCalled();
    });

    test('input has correct attributes', () => {
        render(<Input {...mockProps} />);

        const input = screen.getByPlaceholderText('0.0') as HTMLInputElement;
        expect(input.type).toBe('number');
        expect(input.min).toBe('0');
        expect(input.step).toBe('any');
    });
});
