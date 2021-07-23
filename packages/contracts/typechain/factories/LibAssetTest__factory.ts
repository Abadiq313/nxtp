/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { LibAssetTest, LibAssetTestInterface } from "../LibAssetTest";

const _abi = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "assetId",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "decreaseERC20Allowance",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "assetId",
        type: "address",
      },
    ],
    name: "getOwnBalance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "assetId",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "increaseERC20Allowance",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "assetId",
        type: "address",
      },
    ],
    name: "isEther",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "assetId",
        type: "address",
      },
      {
        internalType: "address payable",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transferAsset",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "assetId",
        type: "address",
      },
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transferERC20",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address payable",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transferEther",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b50610a26806100206000396000f3fe6080604052600436106100745760003560e01c80639db5dbe41161004e5780639db5dbe4146100f7578063a7d2fdf614610117578063b29fd85914610145578063cad1b1131461016557600080fd5b806305b1137b14610080578063439e2e45146100a25780634b93c875146100c257600080fd5b3661007b57005b600080fd5b34801561008c57600080fd5b506100a061009b366004610882565b610185565b005b3480156100ae57600080fd5b506100a06100bd3660046108ad565b610193565b3480156100ce57600080fd5b506100e26100dd366004610866565b6101a3565b60405190151581526020015b60405180910390f35b34801561010357600080fd5b506100a06101123660046108ed565b6101b7565b34801561012357600080fd5b50610137610132366004610866565b6101c2565b6040519081526020016100ee565b34801561015157600080fd5b506100a06101603660046108ed565b6101cd565b34801561017157600080fd5b506100a06101803660046108ed565b6101d8565b61018f82826101e3565b5050565b61019e838383610275565b505050565b60006001600160a01b038216155b92915050565b61019e838383610299565b60006101b1826102a4565b61019e838383610338565b61019e838383610383565b6000826001600160a01b03168260405160006040518083038185875af1925050503d8060008114610230576040519150601f19603f3d011682016040523d82523d6000602084013e610235565b606091505b505090508061019e5760405162461bcd60e51b8152602060048201526007602482015266046a88a746064760cb1b60448201526064015b60405180910390fd5b6001600160a01b0383161561028f5761019e838383610299565b61019e82826101e3565b61019e8383836103ce565b60006001600160a01b03821615610331576040516370a0823160e01b81523060048201526001600160a01b038316906370a082319060240160206040518083038186803b1580156102f457600080fd5b505afa158015610308573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061032c9190610921565b6101b1565b4792915050565b6001600160a01b0383166103785760405162461bcd60e51b81526020600482015260076024820152662349413a30323960c81b604482015260640161026c565b61019e838383610431565b6001600160a01b0383166103c35760405162461bcd60e51b81526020600482015260076024820152662344413a30323960c81b604482015260640161026c565b61019e8383836104f8565b6040516001600160a01b03831660248201526044810182905261019e90849063a9059cbb60e01b906064015b60408051601f198184030181529190526020810180516001600160e01b03166001600160e01b03199093169290921790915261061a565b604051636eb1769f60e11b81523060048201526001600160a01b038381166024830152600091839186169063dd62ed3e9060440160206040518083038186803b15801561047d57600080fd5b505afa158015610491573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906104b59190610921565b6104bf9190610988565b6040516001600160a01b0385166024820152604481018290529091506104f290859063095ea7b360e01b906064016103fa565b50505050565b604051636eb1769f60e11b81523060048201526001600160a01b0383811660248301526000919085169063dd62ed3e9060440160206040518083038186803b15801561054357600080fd5b505afa158015610557573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061057b9190610921565b9050818110156105df5760405162461bcd60e51b815260206004820152602960248201527f5361666545524332303a2064656372656173656420616c6c6f77616e63652062604482015268656c6f77207a65726f60b81b606482015260840161026c565b6040516001600160a01b0384166024820152828203604482018190529061061390869063095ea7b360e01b906064016103fa565b5050505050565b600061066f826040518060400160405280602081526020017f5361666545524332303a206c6f772d6c6576656c2063616c6c206661696c6564815250856001600160a01b03166106ec9092919063ffffffff16565b80519091501561019e578080602001905181019061068d9190610901565b61019e5760405162461bcd60e51b815260206004820152602a60248201527f5361666545524332303a204552433230206f7065726174696f6e20646964206e6044820152691bdd081cdd58d8d9595960b21b606482015260840161026c565b60606106fb8484600085610705565b90505b9392505050565b6060824710156107665760405162461bcd60e51b815260206004820152602660248201527f416464726573733a20696e73756666696369656e742062616c616e636520666f6044820152651c8818d85b1b60d21b606482015260840161026c565b843b6107b45760405162461bcd60e51b815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e7472616374000000604482015260640161026c565b600080866001600160a01b031685876040516107d09190610939565b60006040518083038185875af1925050503d806000811461080d576040519150601f19603f3d011682016040523d82523d6000602084013e610812565b606091505b509150915061082282828661082d565b979650505050505050565b6060831561083c5750816106fe565b82511561084c5782518084602001fd5b8160405162461bcd60e51b815260040161026c9190610955565b600060208284031215610877578081fd5b81356106fe816109d8565b60008060408385031215610894578081fd5b823561089f816109d8565b946020939093013593505050565b6000806000606084860312156108c1578081fd5b83356108cc816109d8565b925060208401356108dc816109d8565b929592945050506040919091013590565b6000806000606084860312156108c1578283fd5b600060208284031215610912578081fd5b815180151581146106fe578182fd5b600060208284031215610932578081fd5b5051919050565b6000825161094b8184602087016109ac565b9190910192915050565b60208152600082518060208401526109748160408501602087016109ac565b601f01601f19169190910160400192915050565b600082198211156109a757634e487b7160e01b81526011600452602481fd5b500190565b60005b838110156109c75781810151838201526020016109af565b838111156104f25750506000910152565b6001600160a01b03811681146109ed57600080fd5b5056fea2646970667358221220d6dd6933eaf7f2221352346658cc3f9d596dc41d0e81e5b0f7c5863f9f6f128664736f6c63430008040033";

export class LibAssetTest__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(overrides?: Overrides & { from?: string | Promise<string> }): Promise<LibAssetTest> {
    return super.deploy(overrides || {}) as Promise<LibAssetTest>;
  }
  getDeployTransaction(overrides?: Overrides & { from?: string | Promise<string> }): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): LibAssetTest {
    return super.attach(address) as LibAssetTest;
  }
  connect(signer: Signer): LibAssetTest__factory {
    return super.connect(signer) as LibAssetTest__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): LibAssetTestInterface {
    return new utils.Interface(_abi) as LibAssetTestInterface;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): LibAssetTest {
    return new Contract(address, _abi, signerOrProvider) as LibAssetTest;
  }
}
