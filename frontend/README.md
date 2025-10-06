# Stellar Counter DApp Frontend

A modern React/Next.js frontend for interacting with the Stellar Counter smart contract built with Soroban.

## Features

- **Wallet Integration**: Connect with Freighter wallet extension
- **Smart Contract Interaction**: Increment, decrement, and reset counter values
- **Real-time Updates**: Read events from the blockchain for live counter updates
- **Payment Functionality**: Send XLM payments on Stellar Testnet
- **Responsive Design**: Built with Tailwind CSS for mobile and desktop
- **TypeScript Support**: Full type safety throughout the application

## Prerequisites

- Node.js and npm installed
- Freighter Wallet browser extension
- Stellar Testnet account with XLM for transaction fees

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The application will be available at `https://localhost:3000` (HTTPS required for Freighter wallet).

## Project Structure

```
src/
├── app/
│   ├── counter/
│   │   └── page.tsx          # Counter smart contract page
│   ├── layout.tsx            # Root layout component
│   └── page.tsx              # Home page with wallet connection
├── components/
│   ├── Button.tsx            # Reusable button component
│   ├── ConnectWalletButton.tsx # Freighter wallet connection
│   ├── Input.tsx             # Reusable input component
│   └── SendPaymentForm.tsx   # Payment form component
└── globals.css               # Global styles
```

## Smart Contract Integration

The frontend interacts with a deployed counter smart contract on Stellar Testnet. The contract includes:

- `increment()` - Increases counter by 1
- `decrement()` - Decreases counter by 1 (with zero protection)
- `reset()` - Resets counter to 0
- `get_count()` - Returns current counter value

## Configuration

### Contract ID
Update the `CONTRACT_ID` in `/src/app/counter/page.tsx` with your deployed contract ID.

### Network
Currently configured for Stellar Testnet. To use Mainnet:
1. Change `NETWORK_PASSPHRASE` to `Networks.PUBLIC`
2. Update `SOROBAN_URL` to mainnet RPC endpoint

## Development

### Available Scripts

- `npm run dev` - Start development server with HTTPS
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Key Dependencies

- `@stellar/stellar-sdk` - Stellar SDK for blockchain interaction
- `@stellar/freighter-api` - Freighter wallet integration
- `next` - React framework
- `tailwindcss` - CSS framework
- `typescript` - Type safety

## Usage

1. **Connect Wallet**: Click "Connect Freighter Wallet" to connect your Stellar account
2. **View Counter**: Navigate to the Counter page to see current counter value
3. **Interact**: Use Increment, Decrement, or Reset buttons to modify the counter
4. **Send Payments**: Use the payment form on the home page to send XLM

## Troubleshooting

### Freighter Wallet Issues
- Ensure Freighter extension is installed and unlocked
- Check that you're using HTTPS (required for wallet integration)
- Verify you're on Stellar Testnet

### Transaction Failures
- Ensure account has sufficient XLM for transaction fees
- Check network connection and RPC endpoint availability
- Verify contract ID is correct

### Build Issues
- Run `npm install` to ensure all dependencies are installed
- Check TypeScript errors with `npm run lint`
- Verify Node.js version compatibility

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.