export const HelperABI = [
    {
        inputs: [
            {
                internalType: 'contract IArrakisV2',
                name: 'vault_',
                type: 'address',
            },
        ],
        name: 'totalUnderlying',
        outputs: [
            {internalType: 'uint256', name: 'amount0', type: 'uint256'},
            {internalType: 'uint256', name: 'amount1', type: 'uint256'},
        ],
        stateMutability: 'view',
        type: 'function',
    },
];

export const ResolverABI = [
    {
        inputs: [
            {
                internalType: 'contract IArrakisV2',
                name: 'vaultV2_',
                type: 'address',
            },
            {internalType: 'uint256', name: 'amount0Max_', type: 'uint256'},
            {internalType: 'uint256', name: 'amount1Max_', type: 'uint256'},
        ],
        name: 'getMintAmounts',
        outputs: [
            {internalType: 'uint256', name: 'amount0', type: 'uint256'},
            {internalType: 'uint256', name: 'amount1', type: 'uint256'},
            {internalType: 'uint256', name: 'mintAmount', type: 'uint256'},
        ],
        stateMutability: 'view',
        type: 'function',
    },
];

export const RouterABI = [
    {
        inputs: [
            {
                components: [
                    {
                        internalType: 'uint256',
                        name: 'amount0Max',
                        type: 'uint256',
                    },
                    {
                        internalType: 'uint256',
                        name: 'amount1Max',
                        type: 'uint256',
                    },
                    {
                        internalType: 'uint256',
                        name: 'amount0Min',
                        type: 'uint256',
                    },
                    {
                        internalType: 'uint256',
                        name: 'amount1Min',
                        type: 'uint256',
                    },
                    {
                        internalType: 'uint256',
                        name: 'amountSharesMin',
                        type: 'uint256',
                    },
                    {internalType: 'address', name: 'vault', type: 'address'},
                    {
                        internalType: 'address',
                        name: 'receiver',
                        type: 'address',
                    },
                    {internalType: 'address', name: 'gauge', type: 'address'},
                ],
                internalType: 'struct AddLiquidityData',
                name: 'params_',
                type: 'tuple',
            },
        ],
        name: 'addLiquidity',
        outputs: [
            {internalType: 'uint256', name: 'amount0', type: 'uint256'},
            {internalType: 'uint256', name: 'amount1', type: 'uint256'},
            {internalType: 'uint256', name: 'sharesReceived', type: 'uint256'},
        ],
        stateMutability: 'payable',
        type: 'function',
    },
];
