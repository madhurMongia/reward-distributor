/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Contract,
  ContractFactory,
  ContractTransactionResponse,
  Interface,
} from "ethers";
import type {
  Signer,
  BigNumberish,
  ContractDeployTransaction,
  ContractRunner,
} from "ethers";
import type { NonPayableOverrides } from "../../common";
import type { MockERC20, MockERC20Interface } from "../../mocks/MockERC20";

const _abi = [
  {
    inputs: [
      {
        internalType: "string",
        name: "_name",
        type: "string",
      },
      {
        internalType: "string",
        name: "_symbol",
        type: "string",
      },
      {
        internalType: "uint8",
        name: "_decimals",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "_initialSupply",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "allowance",
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
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "approve",
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
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
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
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bool",
        name: "_shouldFail",
        type: "bool",
      },
    ],
    name: "setTransferFromShouldFail",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bool",
        name: "_shouldFail",
        type: "bool",
      },
    ],
    name: "setTransferShouldFail",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
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
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transfer",
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
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transferFrom",
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
    inputs: [],
    name: "transferFromShouldFail",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "transferShouldFail",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const _bytecode =
  "0x608060405234801561001057600080fd5b50604051610ae7380380610ae783398101604081905261002f91610139565b600361003b8582610247565b5060046100488482610247565b506005805460ff191660ff9390931692909217909155600281905533600090815260208190526040902055506103069050565b634e487b7160e01b600052604160045260246000fd5b600082601f8301126100a257600080fd5b81516001600160401b03808211156100bc576100bc61007b565b604051601f8301601f19908116603f011681019082821181831017156100e4576100e461007b565b816040528381526020925086602085880101111561010157600080fd5b600091505b838210156101235785820183015181830184015290820190610106565b6000602085830101528094505050505092915050565b6000806000806080858703121561014f57600080fd5b84516001600160401b038082111561016657600080fd5b61017288838901610091565b9550602087015191508082111561018857600080fd5b5061019587828801610091565b935050604085015160ff811681146101ac57600080fd5b6060959095015193969295505050565b600181811c908216806101d057607f821691505b6020821081036101f057634e487b7160e01b600052602260045260246000fd5b50919050565b601f821115610242576000816000526020600020601f850160051c8101602086101561021f5750805b601f850160051c820191505b8181101561023e5782815560010161022b565b5050505b505050565b81516001600160401b038111156102605761026061007b565b6102748161026e84546101bc565b846101f6565b602080601f8311600181146102a957600084156102915750858301515b600019600386901b1c1916600185901b17855561023e565b600085815260208120601f198616915b828110156102d8578886015182559484019460019091019084016102b9565b50858210156102f65787850151600019600388901b60f8161c191681555b5050505050600190811b01905550565b6107d2806103156000396000f3fe608060405234801561001057600080fd5b50600436106100ea5760003560e01c806370a082311161008c578063bfb87c1c11610066578063bfb87c1c146101f5578063c0b1fd5e14610208578063dd62ed3e14610232578063ff0a85701461026b57600080fd5b806370a08231146101b157806395d89b41146101da578063a9059cbb146101e257600080fd5b806318160ddd116100c857806318160ddd1461015a57806323b872dd1461016c578063313ce5671461017f57806340c10f191461019e57600080fd5b806306fdde03146100ef578063095ea7b31461010d5780630cf96c3b14610130575b600080fd5b6100f761027d565b60405161010491906105e5565b60405180910390f35b61012061011b366004610650565b61030b565b6040519015158152602001610104565b61015861013e36600461067a565b600580549115156101000261ff0019909216919091179055565b005b6002545b604051908152602001610104565b61012061017a36600461069c565b610339565b60055461018c9060ff1681565b60405160ff9091168152602001610104565b6101586101ac366004610650565b6104c3565b61015e6101bf3660046106d8565b6001600160a01b031660009081526020819052604090205490565b6100f761050d565b6101206101f0366004610650565b61051a565b6005546101209062010000900460ff1681565b61015861021636600461067a565b60058054911515620100000262ff000019909216919091179055565b61015e6102403660046106f3565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205490565b60055461012090610100900460ff1681565b6003805461028a90610726565b80601f01602080910402602001604051908101604052809291908181526020018280546102b690610726565b80156103035780601f106102d857610100808354040283529160200191610303565b820191906000526020600020905b8154815290600101906020018083116102e657829003601f168201915b505050505081565b3360009081526001602081815260408084206001600160a01b03871685529091529091208290555b92915050565b60055460009062010000900460ff1615610355575060006104bc565b6001600160a01b0384166000908152602081905260409020548211156103b95760405162461bcd60e51b8152602060048201526014602482015273496e73756666696369656e742062616c616e636560601b60448201526064015b60405180910390fd5b6001600160a01b03841660009081526001602090815260408083203384529091529020548211156104255760405162461bcd60e51b8152602060048201526016602482015275496e73756666696369656e7420616c6c6f77616e636560501b60448201526064016103b0565b6001600160a01b0384166000908152602081905260408120805484929061044d908490610776565b90915550506001600160a01b0383166000908152602081905260408120805484929061047a908490610789565b90915550506001600160a01b0384166000908152600160209081526040808320338452909152812080548492906104b2908490610776565b9091555060019150505b9392505050565b6001600160a01b038216600090815260208190526040812080548392906104eb908490610789565b9250508190555080600260008282546105049190610789565b90915550505050565b6004805461028a90610726565b600554600090610100900460ff161561053557506000610333565b3360009081526020819052604090205482111561058b5760405162461bcd60e51b8152602060048201526014602482015273496e73756666696369656e742062616c616e636560601b60448201526064016103b0565b33600090815260208190526040812080548492906105aa908490610776565b90915550506001600160a01b038316600090815260208190526040812080548492906105d7908490610789565b909155506001949350505050565b60006020808352835180602085015260005b81811015610613578581018301518582016040015282016105f7565b506000604082860101526040601f19601f8301168501019250505092915050565b80356001600160a01b038116811461064b57600080fd5b919050565b6000806040838503121561066357600080fd5b61066c83610634565b946020939093013593505050565b60006020828403121561068c57600080fd5b813580151581146104bc57600080fd5b6000806000606084860312156106b157600080fd5b6106ba84610634565b92506106c860208501610634565b9150604084013590509250925092565b6000602082840312156106ea57600080fd5b6104bc82610634565b6000806040838503121561070657600080fd5b61070f83610634565b915061071d60208401610634565b90509250929050565b600181811c9082168061073a57607f821691505b60208210810361075a57634e487b7160e01b600052602260045260246000fd5b50919050565b634e487b7160e01b600052601160045260246000fd5b8181038181111561033357610333610760565b808201808211156103335761033361076056fea2646970667358221220b9c58cf6511e13d597a770265ee8d593a6945f713c92c4f2cc6362c049e3574b64736f6c63430008190033";

type MockERC20ConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: MockERC20ConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class MockERC20__factory extends ContractFactory {
  constructor(...args: MockERC20ConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override getDeployTransaction(
    _name: string,
    _symbol: string,
    _decimals: BigNumberish,
    _initialSupply: BigNumberish,
    overrides?: NonPayableOverrides & { from?: string }
  ): Promise<ContractDeployTransaction> {
    return super.getDeployTransaction(
      _name,
      _symbol,
      _decimals,
      _initialSupply,
      overrides || {}
    );
  }
  override deploy(
    _name: string,
    _symbol: string,
    _decimals: BigNumberish,
    _initialSupply: BigNumberish,
    overrides?: NonPayableOverrides & { from?: string }
  ) {
    return super.deploy(
      _name,
      _symbol,
      _decimals,
      _initialSupply,
      overrides || {}
    ) as Promise<
      MockERC20 & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(runner: ContractRunner | null): MockERC20__factory {
    return super.connect(runner) as MockERC20__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): MockERC20Interface {
    return new Interface(_abi) as MockERC20Interface;
  }
  static connect(address: string, runner?: ContractRunner | null): MockERC20 {
    return new Contract(address, _abi, runner) as unknown as MockERC20;
  }
}
