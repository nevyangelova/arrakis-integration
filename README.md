# Arrakis Integration

A simple dApp for interacting with Arrakis Finance liquidity pools. Deposit WETH and RETH to earn fees.

## Setup

```bash
# Install dependencies
yarn

# Run development server
yarn dev

# Run tests
yarn test
```

## Architecture Decisions

### Single Context Pattern

Used a single `ContractContext` to manage all blockchain interactions. This keeps state management simple and avoids prop drilling. All contract calls, state, and error handling live in one place. Easier for you to review and test.

### Atomic Components

Built small, focused components that do one thing well:

-   `Input.tsx` - Handles numeric input with validation
-   `PrimaryButton.tsx` - Consistent button styling with loading states
-   `DepositForm.tsx` - Combines components for the deposit flow and submits transaction

This makes testing easier and components more reusable.

### Gas Optimization

Optimized contract interactions to minimize gas costs:

-   Approvals happen inside try/catch blocks to maintain normal gas fees
-   Only calculate values once to avoid duplicate blockchain calls
-   Proper error detection for user rejections vs actual errors
-   Clear success/failure indicators to avoid unnecessary transactions

### Testing First

Built tests before implementing components to ensure proper behavior:

-   Context tests verify contract interactions work correctly
-   Component tests ensure UI behaves as expected
-   Edge case tests for scientific notation, zero values, etc.

This approach caught several bugs early and made development faster.

## Assumptions

1. Users have MetaMask or another web3 wallet installed
2. Users have WETH and RETH in their wallet
3. The Arrakis vault contract is already deployed and working
4. 5% slippage is acceptable for most users

## Known Limitations

1. No mobile wallet support (WalletConnect, etc.)
2. Limited error handling for complex contract failures
3. No transaction history or position management
4. Only supports one pool (WETH/RETH)
5. Only supports slippage of 5%

## Areas for Improvement

1. Add support for multiple pools
2. Improve mobile support
3. Add more comprehensive error handling
4. Implement better loading states
5. Implement multiple hooks for the contract calls if the context gets too large

## Local Development

```bash
# Install dependencies
yarn

# Run development server
yarn dev

# Run tests
yarn test

# Run specific test files
yarn test components
yarn test contexts

# Build for production
yarn build
```

## Contract Interactions

All contract addresses are in `lib/constants.ts`.

## Formatting Utilities

Simple utilities handle:

-   Number formatting for display
-   User input validation (prevents non-numeric input)
-   Blockchain error message formatting

These keep the UI clean and user-friendly without unnecessary complexity.
