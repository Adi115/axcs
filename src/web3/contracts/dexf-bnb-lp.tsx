import React from 'react';
import BigNumber from 'bignumber.js';

import { useReload } from 'hooks/useReload';
import { useAsyncEffect } from 'hooks/useAsyncEffect';
import { TokenMeta } from 'web3/types';
import { getHumanValue } from 'web3/utils';
import { useWallet } from 'wallets/wallet';
import Web3Contract from 'web3/contract';
import { CONTRACT_LP_FARMING } from 'web3/contracts/farm';

import { ReactComponent as DexfBnbLpIcon } from 'resources/svg/tokens/dexf-bnbLp.svg';

const CONTRACT_LP_TOKEN_ADDR = String(process.env.REACT_APP_BNB_DEXF_V2_PAIR_ADDR).toLowerCase();
const CONTRACT_DEXF_TOKEN_ADDR = String(process.env.REACT_APP_CONTRACT_DEXF_ADDR).toLowerCase();

export const DexfBnbLpTokenMeta: TokenMeta = {
  icon: <DexfBnbLpIcon key="dexf-bnb-lp" />,
  name: 'DEXF-BNB LP',
  address: CONTRACT_LP_TOKEN_ADDR,
  decimals: 18,
};

type DexfBnbLpContractData = {
  balance?: BigNumber;
  allowance?: BigNumber;
  totalLocked?: BigNumber;
  token0?: string | undefined;
};

export type DexfBnbLpContract = DexfBnbLpContractData & {
  contract: Web3Contract;
  reload(): void;
  approveSend(value: BigNumber): Promise<any>;
  totalSupply(): Promise<any>;
  getReserves(): Promise<any>;
};

const InitialData: DexfBnbLpContractData = {
  balance: undefined,
  allowance: undefined,
  totalLocked: undefined,
  token0: undefined,
};

export function useDexfBnbLpContract(): DexfBnbLpContract {
  const [reload] = useReload();
  const wallet = useWallet();

  const contract = React.useMemo<Web3Contract>(() => {
    return new Web3Contract(
      require('web3/abi/dexf-bnb-lp.json'),
      CONTRACT_LP_TOKEN_ADDR,
      'DEXF-BNB LP',
    );
  }, []);

  const [data, setData] = React.useState<DexfBnbLpContractData>(InitialData);

  useAsyncEffect(async () => {
    let totalLocked: BigNumber | undefined;
    let token0: undefined;

    [totalLocked, token0] = await contract.batch([
      {
        method: 'balanceOf',
        methodArgs: [CONTRACT_LP_FARMING],
        transform: (value: string) => getHumanValue(new BigNumber(value), DexfBnbLpTokenMeta.decimals),
      },
      {
        method: 'token0',
        methodArgs: [],
      },
    ]);

    setData(prevState => ({
      ...prevState,
      totalLocked,
      token0,
    }));
  }, [reload]);

  useAsyncEffect(async () => {
    let balance: BigNumber | undefined;
    let allowance: BigNumber | undefined;

    if (wallet.account) {
      [balance, allowance] = await contract.batch([
        {
          method: 'balanceOf',
          methodArgs: [wallet.account],
          transform: (value: string) => getHumanValue(new BigNumber(value), DexfBnbLpTokenMeta.decimals),
        },
        {
          method: 'allowance',
          methodArgs: [wallet.account, CONTRACT_LP_FARMING],
          transform: (value: string) => new BigNumber(value),
        },
      ]);
    }

    setData(prevState => ({
      ...prevState,
      balance,
      allowance,
    }));
  }, [reload, wallet.account]);

  const approveSend = React.useCallback((value: BigNumber): Promise<any> => {
    if (!wallet.account) {
      return Promise.reject();
    }

    return contract.send('approve', [
      CONTRACT_LP_FARMING,
      value,
    ], {
      from: wallet.account,
    }).then(reload);
  }, [reload, contract, wallet.account]);

  const totalSupply = React.useCallback(async () => {
      let value: any;
      [value] = await contract.batch([
        {
          method: 'totalSupply',
          transform: (value: string) => new BigNumber(value),
        },
      ]);

      return value;
    },
    [contract]
  );

  const getReserves = React.useCallback(async () => {
      let value: any;
      let token0: string;
      [value, token0] = await contract.batch([
        {
          method: 'getReserves',
          transform: (value: any) => [new BigNumber(value[0]), new BigNumber(value[1])],
        },
        {
          method: 'token0'
        },
      ]);

      if (token0.toLowerCase() === CONTRACT_DEXF_TOKEN_ADDR.toLowerCase()) {
        return value;
      }

      return [value[1], value[0]];
    },
    [contract]
  );

  return React.useMemo<DexfBnbLpContract>(() => ({
    ...data,
    contract,
    reload,
    approveSend,
    totalSupply,
    getReserves,
  }), [
    data,
    contract,
    reload,
    approveSend,
    totalSupply,
    getReserves,
  ]);
}
