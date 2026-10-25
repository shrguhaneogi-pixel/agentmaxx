// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title BazaarEscrow
 * @notice On-chain settlement and escrow smart contract for Agentmaxx Bazaar on Base Sepolia.
 * @dev Guarantees cryptographic parity with the TypeScript EIP-712 typed structured data
 * schema, enforces signature deadlines, prevents replay attacks via an on-chain nonce registry,
 * and guards against reentrancy.
 */
contract BazaarEscrow is EIP712, ReentrancyGuard {
    // Exact struct matching the Agentmaxx Phase 2 EIP-712 schema
    struct Payment {
        address from;
        address to;
        string amount;
        string asset;
        string resource;
        string nonce;
        uint256 deadline;
    }

    // TypeHash representing the EIP-712 primary type "Payment"
    bytes32 public constant PAYMENT_TYPEHASH = keccak256(
        "Payment(address from,address to,string amount,string asset,string resource,string nonce,uint256 deadline)"
    );

    // Replay protection: tracking consumed nonces per signer account
    mapping(address => mapping(string => bool)) public consumedNonces;

    // Emitted when a payment is verified, settled, and recorded on-chain
    event PaymentSettled(
        address indexed from,
        address indexed to,
        string dealId,
        uint256 amount,
        string asset,
        string nonce
    );

    /**
     * @notice Initializes the EIP-712 domain separator:
     * Domain Name: "Agentmaxx Bazaar", Version: "1".
     * Chain ID and verifyingContract are bound to block.chainid and address(this).
     */
    constructor() EIP712("Agentmaxx Bazaar", "1") {}

    /**
     * @notice Settles a payment authorized via EIP-712 signature on-chain.
     * @param p The payment authorization struct
     * @param signature The EIP-712 cryptographic signature created by p.from
     */
    function settlePayment(Payment calldata p, bytes calldata signature)
        external
        payable
        nonReentrant
    {
        // 1. Signature Deadline Enforcement
        require(block.timestamp <= p.deadline, "Payment expired");

        // 2. On-Chain Replay Protection
        require(!consumedNonces[p.from][p.nonce], "Replay detected");

        // 3. EIP-712 Signature Verification
        bytes32 structHash = keccak256(
            abi.encode(
                PAYMENT_TYPEHASH,
                p.from,
                p.to,
                keccak256(bytes(p.amount)),
                keccak256(bytes(p.asset)),
                keccak256(bytes(p.resource)),
                keccak256(bytes(p.nonce)),
                p.deadline
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, signature);
        require(signer == p.from, "Invalid signature");

        // 4. Mark Nonce Consumed (before external call)
        consumedNonces[p.from][p.nonce] = true;

        // 5. Transfer native ETH if msg.value > 0
        if (msg.value > 0) {
            (bool success, ) = p.to.call{value: msg.value}("");
            require(success, "ETH transfer failed");
        }

        // 6. Emit Settlement Event (p.resource maps to the bazaar deal ID)
        emit PaymentSettled(p.from, p.to, p.resource, msg.value, p.asset, p.nonce);
    }

    /**
     * @notice Helper to check if a nonce has been consumed for a given account.
     * @param account The signer address to query
     * @param nonce The nonce string to check
     * @return True if the nonce was already consumed on-chain
     */
    function isNonceConsumed(address account, string calldata nonce)
        external
        view
        returns (bool)
    {
        return consumedNonces[account][nonce];
    }
}
