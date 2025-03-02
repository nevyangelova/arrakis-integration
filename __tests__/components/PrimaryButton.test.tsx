import React from 'react';
import {render, screen} from '@testing-library/react';
import PrimaryButton from '@/components/PrimaryButton';

describe('PrimaryButton Component', () => {
    test('renders correctly when enabled', () => {
        render(
            <PrimaryButton disabled={false} isLoading={false}>
                Click Me
            </PrimaryButton>
        );

        const button = screen.getByText('Click Me');
        expect(button).toBeInTheDocument();
        expect(button).not.toBeDisabled();
        expect(button).toHaveClass('bg-green-500');
    });

    test('renders correctly when disabled', () => {
        render(
            <PrimaryButton disabled={true} isLoading={false}>
                Click Me
            </PrimaryButton>
        );

        const button = screen.getByText('Click Me');
        expect(button).toBeInTheDocument();
        expect(button).toBeDisabled();
        expect(button).toHaveClass('bg-gray-400');
    });

    test('renders loading state correctly', () => {
        render(
            <PrimaryButton disabled={false} isLoading={true}>
                Click Me
            </PrimaryButton>
        );

        expect(screen.getByText('Processing...')).toBeInTheDocument();
        expect(screen.queryByText('Click Me')).not.toBeInTheDocument();

        const svg = document.querySelector('svg.animate-spin');
        expect(svg).toBeInTheDocument();
    });

    test('applies correct button type', () => {
        render(
            <PrimaryButton disabled={false} isLoading={false} type='submit'>
                Submit
            </PrimaryButton>
        );

        const button = screen.getByText('Submit') as HTMLButtonElement;
        expect(button.type).toBe('submit');
    });
});
