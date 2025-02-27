import {
    type SponsoredCallRequest,
    GelatoRelay,
    type CallWithERC2771Request,
} from "@gelatonetwork/relay-sdk-viem";
import { createWalletClient, createPublicClient, encodeFunctionData, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type {
    PublicClient,
    Chain,
    Account,
    HttpTransport,
    WalletClient,
} from "viem";
import dotenv from "dotenv";

// .env dosyasını yükle
dotenv.config();

// API anahtarını al
const GELATO_RELAY_API_KEY = process.env.GELATO_RELAY_API_KEY || "";
if (!GELATO_RELAY_API_KEY) {
    console.error("GELATO_RELAY_API_KEY .env dosyasında tanımlanmamış!");
    process.exit(1);
}

// Özel anahtarı al
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}` || "";
if (!PRIVATE_KEY) {
    console.error("PRIVATE_KEY .env dosyasında tanımlanmamış!");
    process.exit(1);
}

// ABC zincirini tanımla
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
            http: ['https://rpc.abc.t.raas.gelato.cloud'], // ABC zinciri için doğru RPC URL'sini buraya yazın
        },
        public: {
            http: ['https://rpc.abc.t.raas.gelato.cloud'], // ABC zinciri için doğru RPC URL'sini buraya yazın
        },
    },
} as const;

// Özel anahtardan hesap oluştur
const account = privateKeyToAccount(PRIVATE_KEY);

// WalletClient oluştur
const client = createWalletClient({
    account,
    chain: abcChain,
    transport: http('https://rpc.abc.t.raas.gelato.cloud') // ABC zinciri için doğru RPC URL'sini buraya yazın
});

// PublicClient oluştur
const publicClient = createPublicClient({
    chain: abcChain,
    transport: http('https://rpc.abc.t.raas.gelato.cloud') // ABC zinciri için doğru RPC URL'sini buraya yazın
});

// Gelato Relay instance oluştur
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

/**
 * Executes a `sponsoredCall` with the Gelato Relay SDK.
 * @param abi ABI of the contract.
 * @param functionName Function name to call.
 * @param args Arguments for the function call.
 * @param target Target contract address.
 */
export async function executeSponsoredCall(
    abi: any,
    functionName: string,
    args: any[],
    target: string
) {
    try {
        // Get chain ID
        const chainId = await publicClient.getChainId();

        // Encode function data
        const data = encodeFunctionData({
            abi,
            functionName,
            args,
        });

        // Prepare relay request
        const relayRequest: SponsoredCallRequest = {
            chainId: BigInt(chainId),
            target,
            data,
        };

        // Make the sponsored call
        const response = await relay.sponsoredCall(
            relayRequest,
            GELATO_RELAY_API_KEY
        );

        // Generate the task status URL
        const taskLink = `https://relay.gelato.digital/tasks/status/${response.taskId}`;
        console.log(`Task created successfully. Track here: ${taskLink}`);

        // Return response with task link
        return {
            ...response,
            taskLink,
        };
    } catch (error) {
        console.error("Error in executeSponsoredCall:", error);
        throw error;
    }
}

/**
 * Executes a `sponsoredCallERC2771` with the Gelato Relay SDK.
 * @param abi ABI of the contract.
 * @param functionName Function name to call.
 * @param args Arguments for the function call.
 * @param target Target contract address.
 */
export async function executeSponsoredCallERC2771(
    abi: any,
    functionName: string,
    args: any[],
    target: string
) {
    try {
        // Get chain ID
        const chainId = await client.getChainId();

        // Encode function data
        const data = encodeFunctionData({
            abi,
            functionName,
            args,
        });

        // Prepare relay request
        const relayRequest: CallWithERC2771Request = {
            user: account.address,
            chainId: BigInt(chainId),
            target,
            data,
        };

        // Make the sponsored call
        const response = await relay.sponsoredCallERC2771(
            relayRequest,
            client as any,
            GELATO_RELAY_API_KEY
        );

        // Generate the task status URL
        const taskLink = `https://relay.gelato.digital/tasks/status/${response.taskId}`;
        console.log(`Task created successfully. Track here: ${taskLink}`);

        // Return response with task link
        return { ...response, taskLink };
    } catch (error) {
        console.error("Error in executeSponsoredCallERC2771:", error);
        throw error;
    }
}

// Counter kontrat adresi
const counterAddress = '0xa2aE8d8F0d797BFA724c75eF9B34fF226802C212';

// Counter ABI
const counterAbi = [
    {
        name: 'increment',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [],
        outputs: []
    }
];

// Ana fonksiyon
async function main() {
    try {
        console.log('Sending sponsored transaction...');
        
        // ERC2771 sponsorlu çağrı yap
        const result = await executeSponsoredCallERC2771(
            counterAbi,
            'increment',
            [],
            counterAddress
        );
        
        console.log('Transaction sent!');
        console.log('Task ID:', result.taskId);
        console.log('Task Link:', result.taskLink);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

// Eğer doğrudan çalıştırılıyorsa, main fonksiyonunu çağır
if (require.main === module) {
    main().catch(console.error);
}