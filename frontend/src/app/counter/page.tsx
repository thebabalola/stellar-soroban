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
      // Use refreshCount to get the current count directly
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
      const account = await server.getAccount(publicKey);
      console.log("Account loaded:", account.accountId());
      
      const contract = new Contract(CONTRACT_ID);
      console.log("Contract created with ID:", CONTRACT_ID);
      
      // Try to read the contract storage directly
      console.log("Trying to read contract storage...");
      const contractData = await server.getContractData(CONTRACT_ID);
      console.log("Contract data:", contractData);
      
      // Look for the count in the contract data
      if (contractData && contractData.length > 0) {
        for (const data of contractData) {
          console.log("Checking data entry:", data);
          if (data.key && data.key.contractData && data.key.contractData.key) {
            const key = data.key.contractData.key;
            console.log("Data key:", key);
            
            // Check if this is the count key (instance storage)
            if (key.switch().name === 'scvSymbol' && key.sym() === 'COUNTER') {
              console.log("Found COUNTER key!");
              if (data.val && data.val.switch().name === 'scvU32') {
                const count = data.val.u32();
                console.log("✅ Found count in storage:", count);
                setCount(count);
                return;
              }
            }
          }
        }
      }
      
      // If storage reading doesn't work, try the simulation approach
      console.log("Storage reading failed, trying simulation...");
      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(contract.call("get_count"))
        .setTimeout(30)
        .build();

      console.log("Transaction built, preparing...");
      const preparedTx = await server.prepareTransaction(tx);
      console.log("Transaction prepared, simulating...");
      
      const result = await server.simulateTransaction(preparedTx);
      console.log("Simulation completed, result:", result);
      
      // Check if there are any events that might contain the count
      if (result.events && result.events.length > 0) {
        console.log("Found events:", result.events);
        for (const event of result.events) {
          console.log("Event:", event);
          if (event.value && event.value.switch().name === 'scvU32') {
            const count = event.value.u32();
            console.log("✅ Found count in event:", count);
            setCount(count);
            return;
          }
        }
      }
      
      console.log("❌ No count found in storage or events, setting to 0");
      setCount(0);
      
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
