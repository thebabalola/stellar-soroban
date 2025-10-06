# Stellar Soroban Counter DApp

A complete decentralized application (dApp) built on Stellar with Soroban smart contracts, featuring a counter contract and a modern React/Next.js frontend.

## 🚀 Features

### Smart Contract (Soroban)
- **Counter Contract** with full functionality:
  - `increment()` - Increases counter by 1
  - `decrement()` - Decreases counter by 1 (with zero protection)
  - `reset()` - Resets counter to 0
  - `get_count()` - Returns current counter value
- **Instance Storage** - Persistent counter state
- **Event Logging** - All operations are logged

### Frontend (Next.js + React)
- **Modern UI** - Built with React, TypeScript, and Tailwind CSS
- **Wallet Integration** - Freighter wallet support
- **Real-time Updates** - Live counter updates from blockchain events
- **Payment Functionality** - Send XLM payments on Stellar Testnet
- **Responsive Design** - Mobile and desktop optimized
- **HTTPS Support** - Required for Freighter wallet compatibility

## 📁 Project Structure

```
stellar-soroban/
├── soroban-counter-app/          # Smart contract project
│   ├── contracts/
│   │   └── counter/              # Counter contract
│   │       ├── src/
│   │       │   ├── lib.rs        # Contract implementation
│   │       │   └── test.rs       # Contract tests
│   │       ├── Cargo.toml
│   │       └── Makefile
│   ├── Cargo.toml
│   └── README.md
├── soroban-hello-world/          # Hello World contract example
├── frontend/                     # Next.js frontend application
│   ├── src/
│   │   ├── app/                  # Next.js app directory
│   │   │   ├── counter/          # Counter page
│   │   │   ├── layout.tsx        # Root layout
│   │   │   └── page.tsx          # Home page
│   │   ├── components/           # React components
│   │   │   ├── Button.tsx
│   │   │   ├── ConnectWalletButton.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Navigation.tsx
│   │   │   └── SendPaymentForm.tsx
│   │   └── contracts.txt/        # TypeScript bindings (inactive)
│   ├── package.json
│   └── README.md
├── Storage_in_soroban.txt        # Storage documentation
├── self_&_Self.txt              # Rust concepts documentation
└── README.md                    # This file
```

## 🛠️ Prerequisites

- **Rust** - For smart contract development
- **Stellar CLI** - For contract deployment and management
- **Node.js** (v20+) - For frontend development
- **Freighter Wallet** - Browser extension for wallet integration

## 🚀 Quick Start

### 1. Smart Contract Setup

```bash
# Navigate to contract directory
cd soroban-counter-app/contracts/counter

# Build the contract
make build

# Deploy to Testnet
stellar contract deploy --wasm ../../target/wasm32v1-none/release/counter.wasm --source-account alice --network testnet
```

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. Access the Application

- **Frontend**: `http://localhost:3000`
- **Counter Page**: `http://localhost:3000/counter`

## 📋 Contract Details

### Deployment Information
- **Contract ID**: `CBOZO7BFB2YM4AFEYJYPLRMWKOR5NXP2UK7CMP72D7KJQ6TGL27S2TJA`
- **Network**: Stellar Testnet
- **WASM Hash**: `c0b4830c97c2a33878d988d7cf971819c45d4c190fb8eeece802449fd986e34b`
- **RPC URL**: `https://soroban-testnet.stellar.org:443`

### Test Account (Alice)
- **Public Key**: `GDJ4PP4CBBYCTPSZGRCRS7UJ3FRPJENDWJRCDJ2CEPKOZWPTWTV6T22Q`
- **Secret Key**: `SC6546D6U7AY634N6AY3TN2DWFU33IEQPRC3SRFWHBDW62TWAMYNWXNO`

## 🔧 Development

### Smart Contract Development
```bash
# Build contract
make build

# Run tests
make test

# Clean build artifacts
make clean
```

### Frontend Development
```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

## 🌐 Network Configuration

### Testnet (Default)
- **Network Passphrase**: `Test SDF Network ; September 2015`
- **RPC URL**: `https://soroban-testnet.stellar.org:443`
- **Horizon URL**: `https://horizon-testnet.stellar.org`

### Mainnet (Production)
- **Network Passphrase**: `Public Global Stellar Network ; September 2015`
- **RPC URL**: `https://soroban-mainnet.stellar.org:443`
- **Horizon URL**: `https://horizon.stellar.org`

## 📚 Documentation

- **Storage in Soroban**: `Storage_in_soroban.txt`
- **Rust Concepts**: `self_&_Self.txt`
- **Contract README**: `soroban-counter-app/README.md`
- **Frontend README**: `frontend/README.md`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- **Stellar Documentation**: https://developers.stellar.org/
- **Soroban Documentation**: https://soroban.stellar.org/docs
- **Freighter Wallet**: https://freighter.app/
- **Stellar Testnet**: https://testnet.stellar.org/

## 🎯 Features Implemented

- ✅ Complete smart contract with all CRUD operations
- ✅ Modern React/Next.js frontend
- ✅ Freighter wallet integration
- ✅ Real-time blockchain event reading
- ✅ Payment functionality
- ✅ TypeScript bindings generation
- ✅ Responsive design
- ✅ Error handling and user feedback
- ✅ HTTPS support for wallet compatibility
- ✅ Comprehensive documentation

---

**Built with ❤️ using Stellar, Soroban, React, and Next.js**
