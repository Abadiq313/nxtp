import { Button, Checkbox, Col, Form, Input, Row, Typography, Table, Divider, Menu, Dropdown } from "antd";
import { BigNumber, constants, Contract, providers, Signer, utils } from "ethers";
import { ReactElement, useEffect, useState } from "react";
import { ChainData, ERC20Abi, getDeployedSubgraphUri, isValidAddress } from "@connext/nxtp-utils";
import { getDeployedTransactionManagerContract } from "@connext/nxtp-sdk";
import { request, gql } from "graphql-request";
import { getAddress } from "ethers/lib/utils";
import TransactionManagerArtifact from "@connext/nxtp-contracts/artifacts/contracts/TransactionManager.sol/TransactionManager.json";
import StableSwapArtifact from "@connext/nxtp-contracts/artifacts/contracts/amm/StableSwap.sol/StableSwap.json";

import { getChainName, getExplorerLinkForAddress } from "../utils";

// Stable swap addresses
// 1338: 0xEcFcaB0A285d3380E488A39B4BB21e777f8A4EaC
// 1337: 0xEcFcaB0A285d3380E488A39B4BB21e777f8A4EaC

// router: 0x627306090abaB3A6e1400e9345bC60c78a8BEf57

type RouterProps = {
  web3Provider?: providers.Web3Provider;
  signer?: Signer;
  chainData?: ChainData[];
};

const decimals: Record<string, number> = {};

const LOCAL_STABLE_SWAP_ADDR = "0xEcFcaB0A285d3380E488A39B4BB21e777f8A4EaC";
const LOCAL_TOKEN = "0xF12b5dd4EAD5F743C6BaA640B0216200e89B60Da";
const LOCAL_TRANSACTION_MANAGER = "0x8CdaF0CD259887258Bc13a92C0a6dA92698644C0";
const LOCAL_CHAINS = [1337, 1338];

const TESTNET_CHAINS = [421611, 97, 43113, 5, 42, 80001, 4, 3];

const MAINNET_CHAINS = [56, 100, 137, 250, 42161, 43114];

type BalanceEntry = {
  chain: string;
  symbol: string;
  assetId: string;
  balance: string;
  decimals: number;
  chainId: number;
};

const Networks = {
  Mainnets: "Mainnets",
  Testnets: "Testnets",
  Local: "Local",
} as const;
type Network = keyof typeof Networks;

const getLiquidityQuery = gql`
  query getLiquidity($router: ID!) {
    router(id: $router) {
      assetBalances {
        amount
        id
      }
    }
  }
`;

const getSwapRateFromVirutalAMM = async (
  amountIn: BigNumber,
  balances: BigNumber[],
  indexIn: number,
  indexOut: number,
  stableSwapAddress: string,
  providerForAmm: providers.Provider,
): Promise<BigNumber> => {
  const contract = new Contract(stableSwapAddress, StableSwapArtifact.abi, providerForAmm);
  console.log("requesting amount out");
  const amountOut = await contract.onSwapGivenIn(amountIn, balances, indexIn, indexOut);
  return BigNumber.from(amountOut);
};

export const Router = ({ web3Provider, signer, chainData }: RouterProps): ReactElement => {
  const [txManager, setTxManager] = useState<Contract>();
  const [injectedProviderChainId, setInjectedProviderChainId] = useState<number>();
  const [routerAddress, setRouterAddress] = useState<string>();
  const [balances, setBalances] = useState<BalanceEntry[]>();
  const [form] = Form.useForm();
  const [network, setNetwork] = useState<Network>(Networks.Mainnets);
  const [addLiquidityBalances, setAddLiquidityBalances] = useState<(BalanceEntry & { basis: string })[]>([]);

  const switchNetwork = (_network: Network) => {
    if (_network === network) {
      return;
    }
    setNetwork(_network);
    refreshBalances(_network);
  };

  const getChains = (_network?: Network): number[] => {
    const n = _network ?? network;
    switch (n) {
      case Networks.Local:
        return LOCAL_CHAINS;
      case Networks.Mainnets:
        return MAINNET_CHAINS;
      case Networks.Testnets:
        return TESTNET_CHAINS;
      default:
        console.error("Unrecognized network:", n);
        return [];
    }
  };

  const menu = (
    <Menu>
      {Object.keys(Networks).map((k, idx) => {
        return (
          <Menu.Item key={idx} onClick={() => switchNetwork(k as Network)}>
            {k}
          </Menu.Item>
        );
      })}
    </Menu>
  );

  useEffect(() => {
    const init = async () => {
      if (!web3Provider || !signer) {
        return;
      }
      const { chainId } = await signer.provider!.getNetwork();
      setInjectedProviderChainId(chainId);
      const _txManager = LOCAL_CHAINS.includes(chainId)
        ? { address: LOCAL_TRANSACTION_MANAGER, abi: TransactionManagerArtifact.abi }
        : getDeployedTransactionManagerContract(chainId);
      if (_txManager) {
        setTxManager(new Contract(_txManager.address, _txManager.abi, signer));
      }
    };
    init();
  }, [web3Provider, signer]);

  const getDecimals = async (assetId: string, provider?: providers.StaticJsonRpcProvider): Promise<number> => {
    if (decimals[assetId.toLowerCase()]) {
      return decimals[assetId.toLowerCase()]!;
    }
    if (assetId === constants.AddressZero) {
      decimals[assetId] = 18;
      return 18;
    }
    const token = provider ? new Contract(assetId, ERC20Abi, provider) : new Contract(assetId, ERC20Abi, signer);
    const _decimals = await token.decimals();
    decimals[assetId.toLowerCase()] = _decimals;
    return _decimals;
  };

  const getBalancesAfterLiquidity = async (assetId: string, amountToAdd: string) => {
    if (!signer || !txManager) {
      throw new Error("Needs signer");
    }

    if (!assetId || !utils.isAddress(assetId) || !amountToAdd) {
      console.warn("bad inputs:", assetId, amountToAdd);
      return;
    }

    // Get pool balances via the router balances on all contracts
    const totalLiquidity = (
      await Promise.all(
        getChains().map(async (c) => {
          const balances = (await getBalancesFromSubgraph(c)) ?? [];
          if (balances.length === 0) {
            return undefined;
          }
          return balances;
        }),
      )
    )
      .flat()
      .filter((x) => !!x);

    // TODO: how to find pool on non-local chains?
    const sendingAssetPool = totalLiquidity.filter(
      (entry) => entry?.assetId.toLowerCase() === assetId.toLowerCase(),
    ) as BalanceEntry[];
    const sendingAssetBalanceIdx = sendingAssetPool.findIndex(
      (entry) => entry?.assetId.toLowerCase() === assetId.toLowerCase() && injectedProviderChainId === entry.chainId,
    );

    console.log("sendingAssetPool", sendingAssetPool);
    console.log("sendingAssetBalanceIdx", sendingAssetBalanceIdx);

    const amountToAddWei = utils.parseUnits(amountToAdd, sendingAssetPool[sendingAssetBalanceIdx]?.decimals ?? 18);
    const updated = amountToAddWei.add(sendingAssetPool[sendingAssetBalanceIdx]?.balance ?? 0);

    if (sendingAssetBalanceIdx === -1) {
      // Does not exist
      // TODO: how to know how many chains to support on
      // TODO: display a warning?
    }

    // Convert 1 of asset to others in pool
    const balanceWithSendingAssetBasis = await Promise.all(
      sendingAssetPool.map(async (entry, idx) => {
        if (idx === sendingAssetBalanceIdx) {
          // hardcode
          return {
            ...entry,
            basis: "1.0",
          };
        }

        // TODO: how many chains?
        const balances =
          sendingAssetBalanceIdx === -1
            ? [updated, constants.Zero]
            : sendingAssetPool.map((e, idx) => {
                if (idx === sendingAssetBalanceIdx) {
                  return updated;
                }
                return BigNumber.from(e?.balance ?? 0);
              });
        const basis = await getSwapRateFromVirutalAMM(
          utils.parseUnits("1", sendingAssetPool[sendingAssetBalanceIdx]?.decimals ?? 18),
          balances,
          Math.max(sendingAssetBalanceIdx, 0),
          idx,
          LOCAL_STABLE_SWAP_ADDR, // TODO: swap addr on signer chain
          signer.provider!,
        );
        return {
          ...entry,
          basis: utils.formatUnits(basis, entry?.decimals ?? 18),
        };
      }),
    );

    setAddLiquidityBalances(balanceWithSendingAssetBasis);
    return balanceWithSendingAssetBasis;
  };

  const addLiquidity = async (assetId: string, liquidityToAdd: string, infiniteApprove: boolean): Promise<string> => {
    console.log("Add liquidity: ", routerAddress, assetId, liquidityToAdd, infiniteApprove);
    if (!signer || !txManager) {
      throw new Error("Needs signer");
    } else if (!routerAddress) {
      throw new Error("Needs router address");
    }
    let value: BigNumber;
    let liquidityToAddWei: BigNumber;
    const signerAddress = await signer.getAddress();
    const decimals = await getDecimals(assetId);
    if (assetId !== constants.AddressZero) {
      const token = new Contract(assetId, ERC20Abi, signer);
      liquidityToAddWei = utils.parseUnits(liquidityToAdd, decimals);
      const allowance = await token.allowance(signerAddress, txManager.address);
      console.log("allowance: ", allowance.toString());
      if (allowance.lt(liquidityToAddWei)) {
        const tx = await token.approve(txManager.address, infiniteApprove ? constants.MaxUint256 : liquidityToAddWei, {
          gasLimit: 250_000,
        });
        console.log("approve tx: ", tx);
        await tx.wait();
      } else {
        console.log("allowance is sufficient");
      }
      value = constants.Zero;
    } else {
      value = utils.parseEther(liquidityToAdd);
      liquidityToAddWei = value;
    }
    console.log("value: ", value.toString());
    console.log("liquidityWei: ", liquidityToAddWei.toString());

    const addLiquidity = await txManager.addLiquidityFor(liquidityToAddWei, assetId, routerAddress, {
      value,
      gasLimit: 250_000,
    });
    console.log("addLiquidity tx: ", addLiquidity);
    await addLiquidity.wait();
    const liquidity = await getLiquidity(form.getFieldValue("assetId"));
    return liquidity;
  };

  // Returns value in human readable units
  const getLiquidity = async (assetId: string): Promise<string> => {
    if (!txManager) {
      throw new Error("Needs signer");
    }
    const liquidity = await txManager.routerBalances(routerAddress, assetId);
    console.log("liquidity: ", liquidity);
    return utils.formatUnits(liquidity, await getDecimals(assetId));
  };

  const getBalancesFromSubgraph = async (chainId: number): Promise<BalanceEntry[] | undefined> => {
    let uri: string | undefined;
    let data: any | undefined;
    if (LOCAL_CHAINS.includes(chainId)) {
      uri = `http://localhost:${chainId === 1337 ? 9 : 8}010/subgraphs/name/connext/nxtp`;
      data = {
        chain: chainId.toString(),
        assetId: {
          [constants.AddressZero]: {
            decimals: 18,
            symbol: constants.EtherSymbol,
          },
          [LOCAL_TOKEN]: {
            decimals: 18,
            symbol: "TEST",
          },
        },
      };
    } else {
      uri = getDeployedSubgraphUri(chainId);
      data = chainData?.find((c) => c.chainId === chainId);
    }
    if (!uri) {
      console.error("Subgraph not available for chain: ", chainId);
      return;
    }
    if (!data) {
      console.error("Chaindata not available for chain: ", chainId);
      return;
    }
    const liquidity = await request(uri, getLiquidityQuery, { router: routerAddress!.toLowerCase() });
    const balanceEntries = (liquidity?.router?.assetBalances ?? []).map(
      ({ amount, id }: { amount: string; id: string }): BalanceEntry | undefined => {
        console.log("chainId: ", chainId);
        console.log("id: ", id);
        console.log("amount: ", amount);
        const assetId = utils.getAddress(id.split("-")[0]);
        let decimals =
          data.assetId[getAddress(assetId)]?.decimals ??
          data.assetId[assetId.toLowerCase()]?.decimals ??
          data.assetId[assetId.toUpperCase()]?.decimals;
        if (!decimals) {
          console.warn(`No decimals for asset ${assetId} on chain ${chainId}, using 18`);
          // return;
          decimals = 18;
        }
        const chain = data.chain === "ETH" ? data.network : data.chain;
        return {
          chainId,
          assetId,
          balance: amount,
          decimals,
          chain,
          symbol:
            data.assetId[getAddress(assetId)]?.symbol ??
            data.assetId[assetId.toLowerCase()]?.symbol ??
            data.assetId[assetId.toUpperCase()]?.symbol ??
            assetId,
        };
      },
    );
    return balanceEntries.filter((x: BalanceEntry | undefined) => !!x);
  };

  // Refreshes the balances table with human readable values for each asset on current chain.
  const refreshBalances = async (_network?: Network): Promise<void> => {
    if (!isValidAddress(routerAddress)) {
      return;
    }

    const entries = (
      await Promise.all(
        getChains(_network).map(async (chainId) => {
          const balances = (await getBalancesFromSubgraph(chainId)) ?? [];
          if (balances.length === 0) {
            return undefined;
          }
          return balances;
        }),
      )
    )
      .flat()
      .filter((x) => !!x) as unknown as BalanceEntry[];

    // convert to human-readable
    const liquidityTable = entries.map((e) => {
      return {
        ...e,
        balance: utils.formatUnits(e.balance, e.decimals),
      };
    });

    setBalances(liquidityTable);
  };

  return (
    <>
      <Row gutter={16}>
        <Col span={3}></Col>
        <Col span={21}>
          <Typography.Paragraph>
            Connected to{" "}
            {injectedProviderChainId && chainData && txManager ? (
              <>
                {getChainName(injectedProviderChainId, chainData)}:{" "}
                <a
                  href={getExplorerLinkForAddress(txManager.address, injectedProviderChainId, chainData)}
                  target="_blank"
                >
                  Transaction Manager Contract
                </a>
              </>
            ) : (
              "-"
            )}
          </Typography.Paragraph>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={3} />
        <Col span={8}>
          <Typography.Title level={2}>Manage Liquidity</Typography.Title>
        </Col>
      </Row>
      <Divider />
      <Row gutter={16}>
        <Col span={3} />
        <Col span={12}>
          <Typography.Title level={4}>Router Balances</Typography.Title>
        </Col>
        <Col span={4}>
          <Row justify="space-around">
            <Button type="primary" onClick={() => refreshBalances()}>
              Reload
            </Button>
            <Dropdown overlay={menu}>
              <Button type="default">{network}</Button>
            </Dropdown>
          </Row>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={3} />
        <Col span={16}>
          <Input
            addonBefore="Router Address:"
            placeholder="0x..."
            onChange={(e) => {
              setRouterAddress(e.target.value);
              refreshBalances();
            }}
            value={routerAddress}
          />
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={3} />
        <Col span={16}>
          <Table
            pagination={false}
            columns={[
              {
                title: "Chain",
                dataIndex: "chain",
                key: "chain",
              },
              {
                title: "Asset",
                dataIndex: "token",
                key: "token",
              },
              {
                title: "Asset ID",
                dataIndex: "assetId",
                key: "assetId",
              },
              {
                title: "Balance",
                dataIndex: "balance",
                key: "balance",
              },
            ]}
            dataSource={(balances ?? []).map((l, i) => ({ ...l, token: l.symbol.toUpperCase(), key: i }))}
            footer={() => (
              <div>
                Total:{" "}
                {(balances ?? []).map((l) => (l.balance ? Number(l.balance) : 0)).reduce((a, b) => a + b, 0) || "0"}
              </div>
            )}
          />
        </Col>
      </Row>
      <Divider />
      <Row gutter={16}>
        <Col span={3} />
        <Col span={8}>
          <Typography.Title level={4}>Add Liquidity</Typography.Title>
        </Col>
        <Col span={8}>
          <Row>
            {addLiquidityBalances.map((balance, idx) => {
              return `(${balance.chainId}) ${balance.symbol} ${balance.basis.slice(0, 6)} ${
                idx == addLiquidityBalances.length - 1 ? "" : "="
              } \n`;
            })}
          </Row>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={16}>
          <Form
            form={form}
            name="basic"
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 16 }}
            onFinish={({ assetId, liquidityToAdd, infiniteApproval }) => {
              addLiquidity(assetId, liquidityToAdd, infiniteApproval);
            }}
            onFieldsChange={(changed, all) => {
              const hasAsset = !!all.find((a) => (a.name as any[]).includes("assetId") && a.value != undefined);
              if (changed.find((c) => (c.name as any[]).includes("amount") && hasAsset)) {
                return;
              }
              getBalancesAfterLiquidity(
                all.find((a) => (a.name as any[]).includes("assetId"))!.value,
                changed.find((c) => (c.name as any[]).includes("liquidityToAdd"))?.value ?? "0",
              ).catch((e) => console.warn("failed to update balances", e));
            }}
          >
            <Form.Item label="Asset ID" name="assetId">
              <Input />
            </Form.Item>

            <Form.Item label="Liquidity to Add" name="liquidityToAdd">
              <Input />
            </Form.Item>

            <Form.Item label="Infinite Approval" name="infiniteApproval" valuePropName="checked">
              <Checkbox></Checkbox>
            </Form.Item>

            <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
              <Button type="primary" htmlType="submit">
                Add Liquidity
              </Button>
            </Form.Item>
          </Form>
        </Col>
      </Row>
    </>
  );
};
