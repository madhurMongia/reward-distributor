/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BytesLike,
  FunctionFragment,
  Result,
  Interface,
  AddressLike,
  ContractRunner,
  ContractMethod,
  Listener,
} from "ethers";
import type {
  TypedContractEvent,
  TypedDeferredTopicFilter,
  TypedEventLog,
  TypedListener,
  TypedContractMethod,
} from "../common";

export interface ICrossChainProofOfHumanityInterface extends Interface {
  getFunction(nameOrSignature: "humanityOf" | "isHuman"): FunctionFragment;

  encodeFunctionData(
    functionFragment: "humanityOf",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "isHuman",
    values: [AddressLike]
  ): string;

  decodeFunctionResult(functionFragment: "humanityOf", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "isHuman", data: BytesLike): Result;
}

export interface ICrossChainProofOfHumanity extends BaseContract {
  connect(runner?: ContractRunner | null): ICrossChainProofOfHumanity;
  waitForDeployment(): Promise<this>;

  interface: ICrossChainProofOfHumanityInterface;

  queryFilter<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;
  queryFilter<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;

  on<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  on<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  once<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  once<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  listeners<TCEvent extends TypedContractEvent>(
    event: TCEvent
  ): Promise<Array<TypedListener<TCEvent>>>;
  listeners(eventName?: string): Promise<Array<Listener>>;
  removeAllListeners<TCEvent extends TypedContractEvent>(
    event?: TCEvent
  ): Promise<this>;

  humanityOf: TypedContractMethod<[_human: AddressLike], [string], "view">;

  isHuman: TypedContractMethod<[_human: AddressLike], [boolean], "view">;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "humanityOf"
  ): TypedContractMethod<[_human: AddressLike], [string], "view">;
  getFunction(
    nameOrSignature: "isHuman"
  ): TypedContractMethod<[_human: AddressLike], [boolean], "view">;

  filters: {};
}
