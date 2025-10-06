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
      }
    };

    checkWallet();
    getInitialCount();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getInitialCount = async () => {
    try {
      const topic1 = xdr.ScVal.scvSymbol("COUNTER").toXDR("base64");
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
      setCount(events.events.map((e) => e.value.u32()).pop() || null);
    } catch (error) {
      console.error(error);
    }
  };

  const refreshCount = async () => {
    try {
      const account = await server.getAccount(publicKey!);
      const contract = new Contract(CONTRACT_ID);
      
      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(contract.call("get_count"))
        .setTimeout(30)
        .build();

      const preparedTx = await server.prepareTransaction(tx);
      const result = await server.simulateTransaction(preparedTx);
      
      if (result.results && result.results.length > 0) {
        const returnValue = result.results[0].xdr;
        if (returnValue) {
          const scVal = xdr.ScVal.fromXDR(returnValue, "base64");
          const count = scVal.u32();
          setCount(count);
        }
      }
    } catch (error) {
      console.error("Error refreshing count:", error);
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
        
        // Extract the new count from the transaction result
        try {
          const returnValue = getResponse.resultMetaXdr
            .v4()
            .sorobanMeta()
            ?.returnValue();
          if (returnValue) {
            const newCount = returnValue.u32();
            setCount(newCount);
          } else {
            // If no return value, just refresh the count by calling get_count
            await refreshCount();
          }
        } catch (parseError) {
          console.log("Could not parse return value, refreshing count...");
          await refreshCount();
        }
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
        
        // Extract the new count from the transaction result
        try {
          const returnValue = getResponse.resultMetaXdr
            .v4()
            .sorobanMeta()
            ?.returnValue();
          if (returnValue) {
            const newCount = returnValue.u32();
            setCount(newCount);
          } else {
            // If no return value, just refresh the count by calling get_count
            await refreshCount();
          }
        } catch (parseError) {
          console.log("Could not parse return value, refreshing count...");
          await refreshCount();
        }
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
        
        // Extract the new count from the transaction result
        try {
          const returnValue = getResponse.resultMetaXdr
            .v4()
            .sorobanMeta()
            ?.returnValue();
          if (returnValue) {
            const newCount = returnValue.u32();
            setCount(newCount);
          } else {
            // If no return value, just refresh the count by calling get_count
            await refreshCount();
          }
        } catch (parseError) {
          console.log("Could not parse return value, refreshing count...");
          await refreshCount();
        }
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
          <p className="mb-4">
            Current Count: {count === null ? "Unknown" : count}
          </p>
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
