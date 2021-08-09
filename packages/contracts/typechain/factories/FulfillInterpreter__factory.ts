/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  FulfillInterpreter,
  FulfillInterpreterInterface,
} from "../FulfillInterpreter";

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
  "0x608060405234801561001057600080fd5b50604051610b41380380610b4183398101604081905261002f91610059565b6001600081905580546001600160a01b0319166001600160a01b0392909216919091179055610087565b60006020828403121561006a578081fd5b81516001600160a01b0381168114610080578182fd5b9392505050565b610aab806100966000396000f3fe6080604052600436106100295760003560e01c806396f32fb81461002e578063cf9a36041461005b575b600080fd5b34801561003a57600080fd5b506001546040516001600160a01b0390911681526020015b60405180910390f35b61006e61006936600461083a565b61007c565b6040516100529291906109df565b60006060600260005414156100d85760405162461bcd60e51b815260206004820152601f60248201527f5265656e7472616e637947756172643a207265656e7472616e742063616c6c0060448201526064015b60405180910390fd5b60026000556001546001600160a01b031633146101225760405162461bcd60e51b8152602060048201526008602482015267234f544d3a30323760c01b60448201526064016100cf565b6001600160a01b038716158061013d5761013d888a8861022b565b6000808a6001600160a01b031683610156576000610158565b885b8888604051610168929190610937565b60006040518083038185875af1925050503d80600081146101a5576040519150601f19603f3d011682016040523d82523d6000602084013e6101aa565b606091505b5091509150816101cf576101bf8a8a8a61027b565b826101cf576101cf8a8c8a61029f565b8b7fbf49bd2de448d90a19e0510ab1030fead50ebfc64a4f112ca42535ae79fbab798c8c8c8c8c8c888a60405161020d989796959493929190610963565b60405180910390a26001600055909b909a5098505050505050505050565b6001600160a01b03831661026b5760405162461bcd60e51b815260206004820152600760248201526608d2504e8c0ccd60ca1b60448201526064016100cf565b6102768383836102ea565b505050565b6001600160a01b03831615610295576102768383836103e4565b61027682826103ef565b6001600160a01b0383166102df5760405162461bcd60e51b815260206004820152600760248201526608d1104e8c0ccd60ca1b60448201526064016100cf565b61027683838361047c565b604051636eb1769f60e11b81523060048201526001600160a01b038381166024830152600091839186169063dd62ed3e9060440160206040518083038186803b15801561033657600080fd5b505afa15801561034a573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061036e91906108f3565b6103789190610a0d565b6040516001600160a01b0385166024820152604481018290529091506103de90859063095ea7b360e01b906064015b60408051601f198184030181529190526020810180516001600160e01b03166001600160e01b03199093169290921790915261059e565b50505050565b610276838383610670565b6000826001600160a01b03168260405160006040518083038185875af1925050503d806000811461043c576040519150601f19603f3d011682016040523d82523d6000602084013e610441565b606091505b50509050806102765760405162461bcd60e51b8152602060048201526007602482015266046a88a746064760cb1b60448201526064016100cf565b604051636eb1769f60e11b81523060048201526001600160a01b0383811660248301526000919085169063dd62ed3e9060440160206040518083038186803b1580156104c757600080fd5b505afa1580156104db573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906104ff91906108f3565b9050818110156105635760405162461bcd60e51b815260206004820152602960248201527f5361666545524332303a2064656372656173656420616c6c6f77616e63652062604482015268656c6f77207a65726f60b81b60648201526084016100cf565b6040516001600160a01b0384166024820152828203604482018190529061059790869063095ea7b360e01b906064016103a7565b5050505050565b60006105f3826040518060400160405280602081526020017f5361666545524332303a206c6f772d6c6576656c2063616c6c206661696c6564815250856001600160a01b03166106a09092919063ffffffff16565b8051909150156102765780806020019051810190610611919061081a565b6102765760405162461bcd60e51b815260206004820152602a60248201527f5361666545524332303a204552433230206f7065726174696f6e20646964206e6044820152691bdd081cdd58d8d9595960b21b60648201526084016100cf565b6040516001600160a01b03831660248201526044810182905261027690849063a9059cbb60e01b906064016103a7565b60606106af84846000856106b9565b90505b9392505050565b60608247101561071a5760405162461bcd60e51b815260206004820152602660248201527f416464726573733a20696e73756666696369656e742062616c616e636520666f6044820152651c8818d85b1b60d21b60648201526084016100cf565b843b6107685760405162461bcd60e51b815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e747261637400000060448201526064016100cf565b600080866001600160a01b031685876040516107849190610947565b60006040518083038185875af1925050503d80600081146107c1576040519150601f19603f3d011682016040523d82523d6000602084013e6107c6565b606091505b50915091506107d68282866107e1565b979650505050505050565b606083156107f05750816106b2565b8251156108005782518084602001fd5b8160405162461bcd60e51b81526004016100cf91906109fa565b60006020828403121561082b578081fd5b815180151581146106b2578182fd5b600080600080600080600060c0888a031215610854578283fd5b87359650602088013561086681610a5d565b9550604088013561087681610a5d565b9450606088013561088681610a5d565b93506080880135925060a088013567ffffffffffffffff808211156108a9578384fd5b818a0191508a601f8301126108bc578384fd5b8135818111156108ca578485fd5b8b60208285010111156108db578485fd5b60208301945080935050505092959891949750929550565b600060208284031215610904578081fd5b5051919050565b60008151808452610923816020860160208601610a31565b601f01601f19169290920160200192915050565b8183823760009101908152919050565b60008251610959818460208701610a31565b9190910192915050565b6001600160a01b0389811682528881166020830152871660408201526060810186905260e0608082018190528101849052600061010085878285013781818785010152601f19601f8701168301818482030160a08501526109c68282018761090b565b9250505082151560c08301529998505050505050505050565b82151581526040602082015260006106af604083018461090b565b6020815260006106b2602083018461090b565b60008219821115610a2c57634e487b7160e01b81526011600452602481fd5b500190565b60005b83811015610a4c578181015183820152602001610a34565b838111156103de5750506000910152565b6001600160a01b0381168114610a7257600080fd5b5056fea2646970667358221220412bf0c92f05b8b9b4879c6f381764a67b9b571ae2c5cbd2cb8129cfa3e2368564736f6c63430008040033";

export class FulfillInterpreter__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    transactionManager: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<FulfillInterpreter> {
    return super.deploy(
      transactionManager,
      overrides || {}
    ) as Promise<FulfillInterpreter>;
  }
  getDeployTransaction(
    transactionManager: string,
    overrides?: Overrides & { from?: string | Promise<string> }
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
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): FulfillInterpreter {
    return new Contract(address, _abi, signerOrProvider) as FulfillInterpreter;
  }
}
