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
    if (error.reason === 'rejected') return 'Rejected by user';
    return fallbackMessage;
};
