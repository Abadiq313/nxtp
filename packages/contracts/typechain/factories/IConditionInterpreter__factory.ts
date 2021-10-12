/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type {
  IConditionInterpreter,
  IConditionInterpreterInterface,
} from "../IConditionInterpreter";

const _abi = [
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "receivingChainCondition",
            type: "address",
          },
          {
            internalType: "address",
            name: "sendingChainCondition",
            type: "address",
          },
          {
            internalType: "address",
            name: "receivingChainTxManagerAddress",
            type: "address",
          },
          {
            internalType: "address",
            name: "user",
            type: "address",
          },
          {
            internalType: "address",
            name: "router",
            type: "address",
          },
          {
            internalType: "address",
            name: "initiator",
            type: "address",
          },
          {
            internalType: "address",
            name: "sendingAssetId",
            type: "address",
          },
          {
            internalType: "address",
            name: "receivingAssetId",
            type: "address",
          },
          {
            internalType: "address",
            name: "sendingChainFallback",
            type: "address",
          },
          {
            internalType: "address",
            name: "receivingAddress",
            type: "address",
          },
          {
            internalType: "address",
            name: "callTo",
            type: "address",
          },
          {
            internalType: "bytes32",
            name: "callDataHash",
            type: "bytes32",
          },
          {
            internalType: "bytes32",
            name: "transactionId",
            type: "bytes32",
          },
          {
            internalType: "uint256",
            name: "sendingChainId",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "receivingChainId",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "expiry",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "preparedBlockNumber",
            type: "uint256",
          },
        ],
        internalType: "struct TransactionData",
        name: "txData",
        type: "tuple",
      },
      {
        internalType: "bytes",
        name: "unlockData",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "chainId",
        type: "uint256",
      },
    ],
    name: "shouldCancel",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "receivingChainCondition",
            type: "address",
          },
          {
            internalType: "address",
            name: "sendingChainCondition",
            type: "address",
          },
          {
            internalType: "address",
            name: "receivingChainTxManagerAddress",
            type: "address",
          },
          {
            internalType: "address",
            name: "user",
            type: "address",
          },
          {
            internalType: "address",
            name: "router",
            type: "address",
          },
          {
            internalType: "address",
            name: "initiator",
            type: "address",
          },
          {
            internalType: "address",
            name: "sendingAssetId",
            type: "address",
          },
          {
            internalType: "address",
            name: "receivingAssetId",
            type: "address",
          },
          {
            internalType: "address",
            name: "sendingChainFallback",
            type: "address",
          },
          {
            internalType: "address",
            name: "receivingAddress",
            type: "address",
          },
          {
            internalType: "address",
            name: "callTo",
            type: "address",
          },
          {
            internalType: "bytes32",
            name: "callDataHash",
            type: "bytes32",
          },
          {
            internalType: "bytes32",
            name: "transactionId",
            type: "bytes32",
          },
          {
            internalType: "uint256",
            name: "sendingChainId",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "receivingChainId",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "expiry",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "preparedBlockNumber",
            type: "uint256",
          },
        ],
        internalType: "struct TransactionData",
        name: "txData",
        type: "tuple",
      },
      {
        internalType: "bytes",
        name: "unlockData",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "relayerFee",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "chainId",
        type: "uint256",
      },
    ],
    name: "shouldFulfill",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export class IConditionInterpreter__factory {
  static readonly abi = _abi;
  static createInterface(): IConditionInterpreterInterface {
    return new utils.Interface(_abi) as IConditionInterpreterInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IConditionInterpreter {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as IConditionInterpreter;
  }
}
