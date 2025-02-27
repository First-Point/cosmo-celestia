import {
    type SponsoredCallRequest,
    GelatoRelay,
    type CallWithERC2771Request,
} from "@gelatonetwork/relay-sdk-viem";
import { createWalletClient, createPublicClient, encodeFunctionData, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Get API key and private key from environment
const GELATO_RELAY_API_KEY = process.env.GELATO_RELAY_API_KEY || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}` || "";

// Validate environment variables
if (!GELATO_RELAY_API_KEY || !PRIVATE_KEY) {
    console.error("Missing required environment variables");
    process.exit(1);
}

// Define ABC chain
const abcChain = {
    id: 112,
    name: 'ABC Testnet',
    network: 'abc-testnet',
    nativeCurrency: {
        decimals: 18,
        name: 'ABC',
        symbol: 'ABC',
    },
    rpcUrls: {
        default: {
            http: ['https://rpc.abc.t.raas.gelato.cloud'],
        },
        public: {
            http: ['https://rpc.abc.t.raas.gelato.cloud'],
        },
    },
} as const;

// Create account from private key
const account = privateKeyToAccount(PRIVATE_KEY);

// Create wallet client
const client = createWalletClient({
    account,
    chain: abcChain,
    transport: http('https://rpc.abc.t.raas.gelato.cloud')
});

// Create public client
const publicClient = createPublicClient({
    chain: abcChain,
    transport: http('https://rpc.abc.t.raas.gelato.cloud')
});

// Create Gelato Relay instance
const relay = new GelatoRelay({
    contract: {
        relay1BalanceERC2771: "0x61F2976610970AFeDc1d83229e1E21bdc3D5cbE4",
        relayERC2771: "",
        relay1BalanceConcurrentERC2771: "",
        relayConcurrentERC2771: "",
        relay1BalanceConcurrentERC2771zkSync: "",
        relay1BalanceERC2771zkSync: "",
        relayConcurrentERC2771zkSync: "",
        relayERC2771zkSync: "",
        relayERC2771Abstract: "",
        relay1BalanceERC2771Abstract: "",
        relayConcurrentERC2771Abstract: "",
        relay1BalanceConcurrentERC2771Abstract: ""
    }
});

// CosmoDEX contract address and ABI
const COSMO_DEX_ADDRESS = '0x68Ef81065Bcad75401B1df5923611DfFD29596cc';
const COSMO_DEX_ABI = [
    {
        name: 'bothTokensFaucet',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            {
                name: 'recipient',
                type: 'address'
            }
        ],
        outputs: []
    }
] as const;

/**
 * Execute bothTokensFaucet function using Gelato Relay
 * @param recipient Address to receive the tokens
 */
async function executeBothTokensFaucet(recipient: any) {
    try {
        console.log('Preparing sponsored call for bothTokensFaucet...');
        
        // Get chain ID
        const chainId = await client.getChainId();

        // Encode function data
        const data = encodeFunctionData({
            abi: COSMO_DEX_ABI,
            functionName: 'bothTokensFaucet',
            args: [recipient]
        });

        // Prepare relay request
        const relayRequest: CallWithERC2771Request = {
            user: account.address,
            chainId: BigInt(chainId),
            target: COSMO_DEX_ADDRESS,
            data,
        };

        // Execute sponsored call
        const response = await relay.sponsoredCallERC2771(
            relayRequest,
            client as any,
            GELATO_RELAY_API_KEY
        );

        // Generate task status URL
        const taskLink = `https://relay.gelato.digital/tasks/status/${response.taskId}`;
        
        return {
            ...response,
            taskLink
        };
    } catch (error) {
        console.error('Error executing bothTokensFaucet:', error);
        throw error;
    }
}

// Main function
async function main() {
    try {
        console.log('Starting bothTokensFaucet execution...');
        
        // Execute bothTokensFaucet for the connected account
        const result = await executeBothTokensFaucet(account.address);
        
        console.log('Task created successfully!');
        console.log('Task ID:', result.taskId);
        console.log('Task Link:', result.taskLink);
        
    } catch (error) {
        console.error('Error in main function:', error);
    }
}

// Execute main function if running directly
if (require.main === module) {
    main().catch(console.error);
}

export { executeBothTokensFaucet }; 