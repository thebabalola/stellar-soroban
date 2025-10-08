"use client";

import {
  BASE_FEE,
  Contract,
  Networks,
  rpc as StellarRpc,
  Transaction,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";
import React, { useEffect, useState } from "react";
import {
  getAddress,
  isConnected,
  signTransaction,
} from "@stellar/freighter-api";

import { ConnectButton } from "../../components/ConnectWalletButton";
import { Client, networks } from "../../contracts/counter/src/index"; // For reading count

// Replace with your actual contract ID and network details
const CONTRACT_ID = "CBOZO7BFB2YM4AFEYJYPLRMWKOR5NXP2UK7CMP72D7KJQ6TGL27S2TJA";
const NETWORK_PASSPHRASE = Networks.TESTNET;
const SOROBAN_URL = "https://soroban-testnet.stellar.org:443";

export default function CounterPage() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const server = new StellarRpc.Server(SOROBAN_URL);

  // Create contract client function for reading count using TypeScript bindings
  const getContractClient = () => {
    return new Client({
      ...networks.testnet,
      rpcUrl: "https://soroban-testnet.stellar.org:443",
      // No signTransaction needed for read operations
    });
  };

  useEffect(() => {
    const checkWallet = async () => {
      const connected = await isConnected();
      if (connected) {
        const pubKey = await getAddress();
        setPublicKey(pubKey.address);
        // Refresh count when wallet is connected
        setTimeout(() => refreshCount(), 1000);
      }
    };

    checkWallet();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh count when publicKey changes
  useEffect(() => {
    if (publicKey) {
      refreshCount();
    }
  }, [publicKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshCount = async () => {
    if (!publicKey) {
      console.log("No public key available for refreshCount");
      return;
    }
    
    try {
      console.log("Getting count using TypeScript bindings...");
      
      // Use the TypeScript bindings to get the count (read-only, no signing needed)
      const contract = getContractClient();
      const result = await contract.get_count({
        simulate: true,
      });
      
      console.log("Get count result:", result);
      
      if (result.result) {
        const count = result.result;
        console.log("✅ Count retrieved:", count);
        setCount(count);
      } else {
        console.log("No result from get_count, setting to 0");
        setCount(0);
      }
      
    } catch (error) {
      console.error("❌ Error in refreshCount:", error);
      setCount(0);
    }
  };

  const handleIncrement = async () => {
    if (!publicKey) {
      console.error("Wallet not connected");
      return;
    }

    setLoading(true);

    try {
      console.log("Incrementing counter using direct Stellar SDK...");
      
      // Use direct Stellar SDK for transactions (this works reliably)
      const account = await server.getAccount(publicKey);
      const contract = new Contract(CONTRACT_ID);

      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(contract.call("increment"))
        .setTimeout(30)
        .build();

      const preparedTx = await server.prepareTransaction(tx);

      const signedXdr = await signTransaction(
        preparedTx.toEnvelope().toXDR("base64"),
        {
          networkPassphrase: NETWORK_PASSPHRASE,
        },
      );

      const signedTx = TransactionBuilder.fromXDR(
        signedXdr.signedTxXdr,
        NETWORK_PASSPHRASE,
      ) as Transaction;

      const txResult = await server.sendTransaction(signedTx);

      if (txResult.status !== "PENDING") {
        throw new Error("Something went Wrong");
      }
      const hash = txResult.hash;
      let getResponse = await server.getTransaction(hash);
      // Poll `getTransaction` until the status is not "NOT_FOUND"

      while (getResponse.status === "NOT_FOUND") {
        console.log("Waiting for transaction confirmation...");
        getResponse = await server.getTransaction(hash);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (getResponse.status === "SUCCESS") {
        // Make sure the transaction's resultMetaXDR is not empty
        if (!getResponse.resultMetaXdr) {
          throw "Empty resultMetaXDR in getTransaction response";
        }
        
        // After successful transaction, refresh the count
        console.log("Transaction successful, refreshing count...");
        await refreshCount();
      } else {
        throw `Transaction failed: ${getResponse.resultXdr}`;
      }
    } catch (error) {
      console.error("Error incrementing counter:", error);
      alert(
        "Error incrementing counter. Please check the console for details.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDecrement = async () => {
    if (!publicKey) {
      console.error("Wallet not connected");
      return;
    }

    setLoading(true);

    try {
      console.log("Decrementing counter using direct Stellar SDK...");
      
      // Use direct Stellar SDK for transactions
      const account = await server.getAccount(publicKey);
      const contract = new Contract(CONTRACT_ID);

      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(contract.call("decrement"))
        .setTimeout(30)
        .build();

      const preparedTx = await server.prepareTransaction(tx);

      const signedXdr = await signTransaction(
        preparedTx.toEnvelope().toXDR("base64"),
        {
          networkPassphrase: NETWORK_PASSPHRASE,
        },
      );

      const signedTx = TransactionBuilder.fromXDR(
        signedXdr.signedTxXdr,
        NETWORK_PASSPHRASE,
      ) as Transaction;

      const txResult = await server.sendTransaction(signedTx);

      if (txResult.status !== "PENDING") {
        throw new Error("Something went Wrong");
      }
      const hash = txResult.hash;
      let getResponse = await server.getTransaction(hash);

      while (getResponse.status === "NOT_FOUND") {
        console.log("Waiting for transaction confirmation...");
        getResponse = await server.getTransaction(hash);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (getResponse.status === "SUCCESS") {
        if (!getResponse.resultMetaXdr) {
          throw "Empty resultMetaXDR in getTransaction response";
        }
        
        // After successful transaction, refresh the count
        console.log("Transaction successful, refreshing count...");
        await refreshCount();
      } else {
        throw `Transaction failed: ${getResponse.resultXdr}`;
      }
    } catch (error) {
      console.error("Error decrementing counter:", error);
      alert(
        "Error decrementing counter. Please check the console for details.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!publicKey) {
      console.error("Wallet not connected");
      return;
    }

    setLoading(true);

    try {
      console.log("Resetting counter using direct Stellar SDK...");
      
      // Use direct Stellar SDK for transactions
      const account = await server.getAccount(publicKey);
      const contract = new Contract(CONTRACT_ID);

      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(contract.call("reset"))
        .setTimeout(30)
        .build();

      const preparedTx = await server.prepareTransaction(tx);

      const signedXdr = await signTransaction(
        preparedTx.toEnvelope().toXDR("base64"),
        {
          networkPassphrase: NETWORK_PASSPHRASE,
        },
      );

      const signedTx = TransactionBuilder.fromXDR(
        signedXdr.signedTxXdr,
        NETWORK_PASSPHRASE,
      ) as Transaction;

      const txResult = await server.sendTransaction(signedTx);

      if (txResult.status !== "PENDING") {
        throw new Error("Something went Wrong");
      }
      const hash = txResult.hash;
      let getResponse = await server.getTransaction(hash);

      while (getResponse.status === "NOT_FOUND") {
        console.log("Waiting for transaction confirmation...");
        getResponse = await server.getTransaction(hash);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (getResponse.status === "SUCCESS") {
        if (!getResponse.resultMetaXdr) {
          throw "Empty resultMetaXDR in getTransaction response";
        }
        
        // After successful transaction, refresh the count
        console.log("Transaction successful, refreshing count...");
        await refreshCount();
      } else {
        throw `Transaction failed: ${getResponse.resultXdr}`;
      }
    } catch (error) {
      console.error("Error resetting counter:", error);
      alert(
        "Error resetting counter. Please check the console for details.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setPublicKey(null);
    setCount(null);
  };

  return (
    <div className="max-w-md mx-auto mt-10 text-black">
      <h1 className="text-2xl font-bold mb-4">
        Stellar Smart Contract Counter
      </h1>
      {publicKey ? (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm text-gray-600">Connected:</p>
              <p className="font-mono text-sm break-all">{publicKey}</p>
            </div>
            <button
              onClick={handleDisconnect}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
            >
              Disconnect
            </button>
          </div>
          <div className="mb-4 flex items-center gap-4">
            <p>
              Current Count: {count === null ? "Loading..." : count}
            </p>
            <button
              onClick={refreshCount}
              disabled={loading}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded text-sm disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
          <div className="space-x-2">
            <button
              onClick={handleIncrement}
              disabled={loading}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                "Increment"
              )}
            </button>
            <button
              onClick={handleDecrement}
              disabled={loading}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              Decrement
            </button>
            <button
              onClick={handleReset}
              disabled={loading}
              className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              Reset
            </button>
          </div>
        </div>
      ) : (
        <>
          <p>Please connect your Freighter wallet to use this app.</p>
          <ConnectButton label="Connect Wallet" />
        </>
      )}
    </div>
  );
}