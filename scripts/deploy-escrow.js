import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("=== BazaarEscrow Base Sepolia Deployment ===");

  const artifactPath = path.resolve(
    __dirname,
    "../artifacts/contracts/BazaarEscrow.sol/BazaarEscrow.json"
  );

  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Artifact not found at ${artifactPath}. Please run 'npm run compile' first.`);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const { abi, bytecode } = artifact;

  const privateKey = process.env.WALLET_PRIVATE_KEY;
  if (!privateKey) {
    console.warn("WARNING: No WALLET_PRIVATE_KEY environment variable provided.");
    console.log("Deployment script is ready for use once a funded private key is configured.");
    return;
  }

  const formattedKey = privateKey.startsWith("0x")
    ? (privateKey as `0x${string}`)
    : (`0x${privateKey}` as `0x${string}`);

  const account = privateKeyToAccount(formattedKey);
  const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(rpcUrl),
  });

  console.log(`Deployer address: ${account.address}`);
  console.log(`Target Chain: Base Sepolia (${baseSepolia.id})`);

  console.log("Broadcasting deployment transaction...");
  const hash = await walletClient.deployContract({
    abi,
    bytecode: bytecode.object || bytecode,
  });

  console.log(`Deployment transaction submitted. Hash: ${hash}`);
  console.log("Waiting for block finality...");

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const contractAddress = receipt.contractAddress;

  console.log("==================================================");
  console.log(`BazaarEscrow successfully deployed to: ${contractAddress}`);
  console.log(`Transaction block number: ${receipt.blockNumber}`);
  console.log("Update your environment variables:");
  console.log(`PAYMENT_VERIFYING_CONTRACT=${contractAddress}`);
  console.log(`NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("==================================================");
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
