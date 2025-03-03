export const formatNumberForDisplay = (
    amount: number,
    maxFixedPlaces = 2
): number => parseFloat(amount.toFixed(maxFixedPlaces));

export const formatUserInput = (
    value: string | number,
    maxDecimals = 18
): string => {
    // Convert to string if it's a number
    const strValue = String(value);

    // Return empty string if input is empty
    if (strValue === '' || strValue === null) return '';

    // Remove all non-numeric characters except decimal point
    let sanitized = strValue.replace(/[^\d.]/g, '');

    // Handle multiple decimal points - keep only the first one
    const parts = sanitized.split('.');
    if (parts.length > 2) {
        sanitized = parts[0] + '.' + parts.slice(1).join('');
    }

    // Handle leading zeros - this is the key fix
    if (parts[0].length > 0) {
        // If it's just "0" or starts with "0." keep it as is
        if (parts[0] === '0' || (parts.length > 1 && parts[0] === '0')) {
            // Keep as is
        }
        // If it starts with 0 but has more digits, remove leading zeros
        else if (parts[0].startsWith('0')) {
            parts[0] = parts[0].replace(/^0+/, '');
            // If we removed all digits, add a single '0' back
            if (parts[0] === '') parts[0] = '0';
        }

        // Reconstruct the number
        sanitized = parts.length > 1 ? parts[0] + '.' + parts[1] : parts[0];
    }

    // Limit decimal places
    if (parts.length === 2 && parts[1].length > maxDecimals) {
        sanitized = parts[0] + '.' + parts[1].substring(0, maxDecimals);
    }

    return sanitized;
};

export const formatBlockchainErrorMessage = (
    error: any,
    fallbackMessage: string
): string => {
    // If error is null or undefined, return the fallback message
    if (!error) return fallbackMessage;

    // Check for user rejection patterns across different wallets
    if (
        error.reason === 'rejected' ||
        error.message?.includes('User denied transaction') ||
        error.message?.includes('User rejected') ||
        error.message?.includes('denied transaction signature')
    ) {
        return 'Transaction was rejected by the user';
    }

    // Check for insufficient funds
    if (
        error.message?.includes('insufficient funds') ||
        error.message?.includes('exceeds balance')
    ) {
        return 'Insufficient funds in your wallet';
    }

    // Check for gas estimation failures
    if (error.message?.includes('gas required exceeds')) {
        return 'Transaction would fail - possibly due to contract requirements';
    }

    // Network errors
    if (
        error.message?.includes('network') ||
        error.message?.includes('disconnected')
    ) {
        return 'Network error - please check your connection';
    }

    // Extract specific error message if available
    if (error.message) {
        // Try to extract a more readable part of the error message
        const detailsMatch = error.message.match(/Details: (.*?)(\.|$)/);
        if (detailsMatch && detailsMatch[1]) {
            return detailsMatch[1];
        }

        // If the message is too long, try to extract a meaningful part
        if (error.message.length > 100) {
            return `${fallbackMessage} - ${error.message.substring(0, 100)}...`;
        }

        return `${fallbackMessage} - ${error.message}`;
    }

    // Default fallback message if we couldn't extract anything useful
    return fallbackMessage;
};
