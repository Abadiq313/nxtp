import axios from "axios";
import { Interface } from "ethers/lib/utils";

import { FulfillParams, PrepareParams, CancelParams } from "./transactionManager";

const ACCESS_TOKEN = "4942987b-af28-4ab7-bf75-4bd383e82f80";

const CHAIN_ID = {
  RINKEBY: 4,
  GOERLI: 5,
  BSC: 56,
  MATIC: 137,
  FANTOM: 250,
  ARBITRUM: 42161,
  AVALANCHE: 43114,
};

const endpoints = {
  [CHAIN_ID.RINKEBY]: "https://relay.rinkeby.fra.gelato.digital/relay",
  [CHAIN_ID.GOERLI]: "https://relay.goerli.fra.gelato.digital/relay",
  [CHAIN_ID.BSC]: "https://relay.bsc.fra.gelato.digital/relay",
  [CHAIN_ID.MATIC]: "https://relay.matic.fra.gelato.digital/relay",
  [CHAIN_ID.FANTOM]: "https://relay.fantom.fra.gelato.digital/relay",
  [CHAIN_ID.ARBITRUM]: "https://relay.arbitrum.fra.gelato.digital/relay",
  [CHAIN_ID.AVALANCHE]: "https://relay.avalanche.fra.gelato.digital/relay",
};

const gelatoSend = async (
  chainId: number,
  dest: string,
  data: string,
  token: string,
  relayerFee: string,
): Promise<any> => {
  const server = endpoints[chainId];
  const params = { dest, data, token, relayerFee, access_token: ACCESS_TOKEN };

  let output;
  try {
    const res = await axios.post(server, params);
    output = res.data;
  } catch (error) {
    console.error(error);
    output = error;
  }
  return output;
};

export const isChainSupportedByGelato = (chainId: number): boolean => {
  return Object.values(CHAIN_ID).indexOf(chainId) !== -1;
};

/// NXTP-ROUTER-CONTRACTS

export const gelatoAddLiquidity = async (
  chainId: number,
  address: string,
  abi: Interface,
  params: { amount: string; assetId: string; relayerFee: string },
): Promise<any> => {
  const args = { ...params };
  const data = abi.encodeFunctionData("addLiquidity", [args]);
  const token = args.assetId;
  const ret = await gelatoSend(chainId, address, data, token, args.relayerFee);
  return ret;
};

export const gelatoRemoveLiquidity = async (
  chainId: number,
  address: string,
  abi: Interface,
  _args: { amount: string; assetId: string; relayerFee: string },
): Promise<any> => {
  const args = { ..._args };
  const data = abi.encodeFunctionData("removeLiquidity", [args]);
  const token = args.assetId;
  const ret = await gelatoSend(chainId, address, data, token, args.relayerFee);
  return ret;
};

export const gelatoPrepare = async (
  chainId: number,
  address: string,
  abi: Interface,
  _args: { params: PrepareParams; relayerFee: string },
): Promise<any> => {
  const args = { ..._args };
  const data = abi.encodeFunctionData("prepare", [args]);
  const token = args.params.txData.receivingAssetId;
  const ret = await gelatoSend(chainId, address, data, token, args.relayerFee);
  return ret;
};

export const gelatoFulfill = async (
  chainId: number,
  address: string,
  abi: Interface,
  _args: FulfillParams,
): Promise<any> => {
  const args = { ..._args, encodedMeta: "0x" };
  const data = abi.encodeFunctionData("fulfill", [args]);
  const token = args.txData.receivingAssetId;
  const ret = await gelatoSend(chainId, address, data, token, args.relayerFee);
  return ret;
};

export const gelatoCancel = async (
  chainId: number,
  address: string,
  abi: Interface,
  _args: { params: CancelParams; relayerFee: string },
): Promise<any> => {
  const args = { ..._args };
  const data = abi.encodeFunctionData("cancel", [args]);
  const token = args.params.txData.receivingAssetId;
  const ret = await gelatoSend(chainId, address, data, token, args.relayerFee);
  return ret;
};
