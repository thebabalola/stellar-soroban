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

// Replace with your actual contract ID and network details
const CONTRACT_ID = "CBOZO7BFB2YM4AFEYJYPLRMWKOR5NXP2UK7CMP72D7KJQ6TGL27S2TJA";
const NETWORK_PASSPHRASE = Networks.TESTNET;
const SOROBAN_URL = "https://soroban-testnet.stellar.org:443";

export default function CounterPage() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const server = new StellarRpc.Server(SOROBAN_URL);

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

  const getInitialCount = async () => {
    try {
      // Try to read from events first
      const topic1 = xdr.ScVal.scvSymbol("count").toXDR("base64");
      const topic2 = xdr.ScVal.scvSymbol("increment").toXDR("base64");

      const latestLedger = await server.getLatestLedger();
      const events = await server.getEvents({
        startLedger: latestLedger.sequence - 2000,
        filters: [
          {
            type: "contract",
            contractIds: [CONTRACT_ID],
            topics: [[topic1, topic2]],
          },
        ],
        limit: 20,
      });
      
      if (events.events && events.events.length > 0) {
        const latestEvent = events.events[events.events.length - 1];
        if (latestEvent.value && latestEvent.value.switch().name === 'scvU32') {
          const count = latestEvent.value.u32();
          console.log("✅ Found count from events:", count);
          setCount(count);
          return;
        }
      }
      
      // If events don't work, use refreshCount
      await refreshCount();
    } catch (error) {
      console.error("Error getting initial count:", error);
      // Set to 0 as default if we can't get the count
      setCount(0);
    }
  };

  const refreshCount = async () => {
    if (!publicKey) {
      console.log("No public key available for refreshCount");
      return;
    }
    
    try {
      console.log("Starting refreshCount...");
      
      // Try a simple approach - just set count to 0 for now and let operations update it
      console.log("Setting count to 0 as fallback");
      setCount(0);
      
      // Try to get count from recent events
      console.log("Trying to get count from events...");
      const topic1 = xdr.ScVal.scvSymbol("count").toXDR("base64");
      const topic2 = xdr.ScVal.scvSymbol("increment").toXDR("base64");

      const latestLedger = await server.getLatestLedger();
      const events = await server.getEvents({
        startLedger: latestLedger.sequence - 50,
        filters: [
          {
            type: "contract",
            contractIds: [CONTRACT_ID],
            topics: [[topic1, topic2]],
          },
        ],
        limit: 20,
      });
      
      if (events.events && events.events.length > 0) {
        console.log("Found events:", events.events.length);
        
        // Look for the most recent count value
        for (let i = events.events.length - 1; i >= 0; i--) {
          const event = events.events[i];
          console.log(`Event ${i}:`, event);
          
          if (event.value && event.value.switch().name === 'scvU32') {
            const count = event.value.u32();
            console.log("✅ Found count from events:", count);
            setCount(count);
            return;
          }
        }
      }
      
      console.log("No count found in events, keeping at 0");
      
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

  return (
    <div className="max-w-md mx-auto mt-10 text-black">
      <h1 className="text-2xl font-bold mb-4">
        Stellar Smart Contract Counter
      </h1>
      {publicKey ? (
        <div>
          <p className="mb-4">Connected: {publicKey}</p>
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
