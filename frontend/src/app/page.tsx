"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import SendPaymentForm from "../components/SendPaymentForm";
import * as StellarSdk from "@stellar/stellar-sdk";
import { rpc as StellarRpc } from "@stellar/stellar-sdk";
import {
  isConnected,
  setAllowed,
  getAddress,
  signTransaction,
} from "@stellar/freighter-api";

export default function Home() {
  const [publicKey, setPublicKey] = useState<string | null>(null);

  useEffect(() => {
    const checkFreighter = async () => {
      try {
        const connected = await isConnected();
        if (connected) {
          const pubKey = await getAddress();
          setPublicKey(pubKey.address);
        }
      } catch (error) {
        console.error("Error checking Freighter connection:", error);
      }
    };

    checkFreighter();
  }, []);

  const handleConnectWallet = async () => {
    try {
      await setAllowed();
      const pubKey = await getAddress();
      setPublicKey(pubKey.address);
    } catch (error) {
      console.error("Error connecting to Freighter:", error);
    }
  };

  const handleSendPayment = async (destination: string, amount: string) => {
    if (!publicKey) {
      console.error("Wallet not connected");
      return;
    }

    try {
      const server = new StellarRpc.Server(
        "https://soroban-testnet.stellar.org",
      );
      const sourceAccount = await server.getAccount(publicKey);
      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination: destination,
            asset: StellarSdk.Asset.native(),
            amount: amount,
          }),
        )
        .setTimeout(30)
        .build();

      const signedTransaction = await signTransaction(transaction.toXDR(), {
        networkPassphrase: StellarSdk.Networks.TESTNET,
      });

      const transactionResult = await server.sendTransaction(
        StellarSdk.TransactionBuilder.fromXDR(
          signedTransaction.signedTxXdr,
          StellarSdk.Networks.TESTNET,
        ),
      );

      console.log("Transaction successful:", transactionResult);
      alert("Payment sent successfully!");
    } catch (error) {
      console.error("Error sending payment:", error);
      alert("Error sending payment. Please check the console for details.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Welcome to Stellar Counter DApp</h2>
        <p className="text-gray-600 mb-6">
          A decentralized application built on Stellar with Soroban smart contracts
        </p>
        
        {publicKey ? (
          <div className="mb-6">
            <p className="text-green-600 font-semibold">Connected: {publicKey}</p>
          </div>
        ) : (
          <button
            onClick={handleConnectWallet}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-6"
          >
            Connect Freighter Wallet
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-bold mb-4">Send Payment</h3>
          <SendPaymentForm onSubmit={handleSendPayment} />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-bold mb-4">Smart Contract Counter</h3>
          <p className="text-gray-600 mb-4">
            Interact with the counter smart contract deployed on Stellar Testnet
          </p>
          <Link 
            href="/counter"
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded inline-block"
          >
            Go to Counter
          </Link>
        </div>
      </div>
    </div>
  );
}