/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { FulfillInterpreter, FulfillInterpreterInterface } from "../FulfillInterpreter";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "transactionManager",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "transactionId",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "address payable",
        name: "callTo",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "assetId",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address payable",
        name: "fallbackAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "callData",
        type: "bytes",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "returnData",
        type: "bytes",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "success",
        type: "bool",
      },
    ],
    name: "Executed",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "transactionId",
        type: "bytes32",
      },
      {
        internalType: "address payable",
        name: "callTo",
        type: "address",
      },
      {
        internalType: "address",
        name: "assetId",
        type: "address",
      },
      {
        internalType: "address payable",
        name: "fallbackAddress",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "callData",
        type: "bytes",
      },
    ],
    name: "execute",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "getTransactionManager",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const _bytecode =
  "0x60a060405234801561001057600080fd5b50604051610afd380380610afd83398101604081905261002f91610049565b600160005560601b6001600160601b031916608052610077565b60006020828403121561005a578081fd5b81516001600160a01b0381168114610070578182fd5b9392505050565b60805160601c610a6361009a60003960008181603d015260980152610a636000f3fe6080604052600436106100295760003560e01c806396f32fb81461002e578063cf9a360414610078575b600080fd5b34801561003a57600080fd5b507f00000000000000000000000000000000000000000000000000000000000000006040516001600160a01b03909116815260200160405180910390f35b61008b61008636600461080d565b61008d565b005b336001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016146100f55760405162461bcd60e51b8152602060048201526008602482015267234f544d3a30323760c01b60448201526064015b60405180910390fd5b6001600160a01b0385161580610110576101108688866101fe565b60006060883b1561018c57886001600160a01b031683610131576000610133565b865b868660405161014392919061090a565b60006040518083038185875af1925050503d8060008114610180576040519150601f19603f3d011682016040523d82523d6000602084013e610185565b606091505b5090925090505b816101ac5761019c88888861024e565b826101ac576101ac888a88610272565b897fbf49bd2de448d90a19e0510ab1030fead50ebfc64a4f112ca42535ae79fbab798a8a8a8a8a8a888a6040516101ea989796959493929190610936565b60405180910390a250505050505050505050565b6001600160a01b03831661023e5760405162461bcd60e51b815260206004820152600760248201526608d2504e8c0ccd60ca1b60448201526064016100ec565b6102498383836102bd565b505050565b6001600160a01b03831615610268576102498383836103b7565b61024982826103c2565b6001600160a01b0383166102b25760405162461bcd60e51b815260206004820152600760248201526608d1104e8c0ccd60ca1b60448201526064016100ec565b61024983838361044f565b604051636eb1769f60e11b81523060048201526001600160a01b038381166024830152600091839186169063dd62ed3e9060440160206040518083038186803b15801561030957600080fd5b505afa15801561031d573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061034191906108c6565b61034b91906109c5565b6040516001600160a01b0385166024820152604481018290529091506103b190859063095ea7b360e01b906064015b60408051601f198184030181529190526020810180516001600160e01b03166001600160e01b031990931692909217909152610571565b50505050565b610249838383610643565b6000826001600160a01b03168260405160006040518083038185875af1925050503d806000811461040f576040519150601f19603f3d011682016040523d82523d6000602084013e610414565b606091505b50509050806102495760405162461bcd60e51b8152602060048201526007602482015266046a88a746064760cb1b60448201526064016100ec565b604051636eb1769f60e11b81523060048201526001600160a01b0383811660248301526000919085169063dd62ed3e9060440160206040518083038186803b15801561049a57600080fd5b505afa1580156104ae573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906104d291906108c6565b9050818110156105365760405162461bcd60e51b815260206004820152602960248201527f5361666545524332303a2064656372656173656420616c6c6f77616e63652062604482015268656c6f77207a65726f60b81b60648201526084016100ec565b6040516001600160a01b0384166024820152828203604482018190529061056a90869063095ea7b360e01b9060640161037a565b5050505050565b60006105c6826040518060400160405280602081526020017f5361666545524332303a206c6f772d6c6576656c2063616c6c206661696c6564815250856001600160a01b03166106739092919063ffffffff16565b80519091501561024957808060200190518101906105e491906107ed565b6102495760405162461bcd60e51b815260206004820152602a60248201527f5361666545524332303a204552433230206f7065726174696f6e20646964206e6044820152691bdd081cdd58d8d9595960b21b60648201526084016100ec565b6040516001600160a01b03831660248201526044810182905261024990849063a9059cbb60e01b9060640161037a565b6060610682848460008561068c565b90505b9392505050565b6060824710156106ed5760405162461bcd60e51b815260206004820152602660248201527f416464726573733a20696e73756666696369656e742062616c616e636520666f6044820152651c8818d85b1b60d21b60648201526084016100ec565b843b61073b5760405162461bcd60e51b815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e747261637400000060448201526064016100ec565b600080866001600160a01b03168587604051610757919061091a565b60006040518083038185875af1925050503d8060008114610794576040519150601f19603f3d011682016040523d82523d6000602084013e610799565b606091505b50915091506107a98282866107b4565b979650505050505050565b606083156107c3575081610685565b8251156107d35782518084602001fd5b8160405162461bcd60e51b81526004016100ec91906109b2565b6000602082840312156107fe578081fd5b81518015158114610685578182fd5b600080600080600080600060c0888a031215610827578283fd5b87359650602088013561083981610a15565b9550604088013561084981610a15565b9450606088013561085981610a15565b93506080880135925060a088013567ffffffffffffffff8082111561087c578384fd5b818a0191508a601f83011261088f578384fd5b81358181111561089d578485fd5b8b60208285010111156108ae578485fd5b60208301945080935050505092959891949750929550565b6000602082840312156108d7578081fd5b5051919050565b600081518084526108f68160208601602086016109e9565b601f01601f19169290920160200192915050565b8183823760009101908152919050565b6000825161092c8184602087016109e9565b9190910192915050565b6001600160a01b0389811682528881166020830152871660408201526060810186905260e0608082018190528101849052600061010085878285013781818785010152601f19601f8701168301818482030160a0850152610999828201876108de565b9250505082151560c08301529998505050505050505050565b60208152600061068560208301846108de565b600082198211156109e457634e487b7160e01b81526011600452602481fd5b500190565b60005b83811015610a045781810151838201526020016109ec565b838111156103b15750506000910152565b6001600160a01b0381168114610a2a57600080fd5b5056fea264697066735822122052ff6662af8f185627da63635ccad13496e1e8c7ad49db09b904830a642db98564736f6c63430008040033";

export class FulfillInterpreter__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    transactionManager: string,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<FulfillInterpreter> {
    return super.deploy(transactionManager, overrides || {}) as Promise<FulfillInterpreter>;
  }
  getDeployTransaction(
    transactionManager: string,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): TransactionRequest {
    return super.getDeployTransaction(transactionManager, overrides || {});
  }
  attach(address: string): FulfillInterpreter {
    return super.attach(address) as FulfillInterpreter;
  }
  connect(signer: Signer): FulfillInterpreter__factory {
    return super.connect(signer) as FulfillInterpreter__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): FulfillInterpreterInterface {
    return new utils.Interface(_abi) as FulfillInterpreterInterface;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): FulfillInterpreter {
    return new Contract(address, _abi, signerOrProvider) as FulfillInterpreter;
  }
}
