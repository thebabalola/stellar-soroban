# Soroban Counter Contract

A simple counter smart contract built with Soroban on Stellar, featuring increment, decrement, reset, and get_count functions.

## Project Structure

This repository uses the recommended structure for a Soroban project:
```text
.
├── contracts
│   └── counter
│       ├── src
│       │   ├── lib.rs
│       │   └── test.rs
│       └── Cargo.toml
├── Cargo.toml
└── README.md
```

## Contract Functions

- `increment()` - Increases the counter by 1
- `decrement()` - Decreases the counter by 1 (with zero protection)
- `reset()` - Resets the counter to 0
- `get_count()` - Returns the current counter value

## Deployment Information

### Contract Details
- **Contract ID**: `CBOZO7BFB2YM4AFEYJYPLRMWKOR5NXP2UK7CMP72D7KJQ6TGL27S2TJA`
- **Network**: Stellar Testnet
- **WASM Hash**: `c0b4830c97c2a33878d988d7cf971819c45d4c190fb8eeece802449fd986e34b`
- **RPC URL**: `https://soroban-testnet.stellar.org:443`


## Building and Deploying

1. **Build the contract**:
   ```bash
   cd contracts/counter
   make build
   ```

2. **Deploy to Testnet**:
   ```bash
   stellar contract deploy --wasm ../../target/wasm32v1-none/release/counter.wasm --source-account alice --network testnet
   ```

3. **Test the contract**:
   ```bash
   make test
   ```

## Frontend Integration

This contract is designed to work with the React/Next.js frontend located in the `frontend/` directory. The frontend provides a user-friendly interface for interacting with all contract functions.

## Storage

This contract uses Instance storage (`env.storage().instance()`) to persist the counter value across function calls.