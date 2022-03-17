import React from 'react';
import BigNumber from 'bignumber.js';
import { useReload } from 'hooks/useReload';
import { useAsyncEffect } from 'hooks/useAsyncEffect';
import { TokenMeta } from 'web3/types';
import { useWallet } from 'wallets/wallet';
import Web3Contract from 'web3/contract';
import { CONTRACT_LP_FARMING } from 'web3/contracts/farm';

import { ReactComponent as BusdBnbLpIcon } from 'resources/svg/tokens/dexf-bnbLp.svg';

const CONTRACT_LP_TOKEN_ADDR = String(process.env.REACT_APP_BNB_BUSD_V2_PAIR_ADDR).toLowerCase();
const CONTRACT_WBNB_ADDR = String(process.env.REACT_APP_CONTRACT_WBNB_ADDR).toLowerCase();

export const BusdBnbLpTokenMeta: TokenMeta = {
  icon: <BusdBnbLpIcon key="busd-bnb-lp" />,
  name: 'BUSD-BNB LP',
  address: CONTRACT_LP_TOKEN_ADDR,
  decimals: 18,
};

type BusdBnbLpContractData = {
  bnbPrice?: BigNumber;
};

export type BusdBnbLpContract = BusdBnbLpContractData & {
  contract: Web3Contract;
  reload(): void;
  approveSend(value: BigNumber): Promise<any>;
  totalSupply(): Promise<any>;
  getReserves(): Promise<any>;
};

const InitialData: BusdBnbLpContractData = {
  bnbPrice: undefined,
};

export function useBusdBnbLpContract(): BusdBnbLpContract {
  const [reload] = useReload();
  const wallet = useWallet();

  const contract = React.useMemo<Web3Contract>(() => {
    return new Web3Contract(
      require('web3/abi/dexf-bnb-lp.json'),
      CONTRACT_LP_TOKEN_ADDR,
      'BUSD-BNB LP',
    );
  }, []);

  const [data, setData] = React.useState<BusdBnbLpContractData>(InitialData);

  useAsyncEffect(async () => {
    let bnbPrice: BigNumber | undefined;
    let value: any;
    let token0: string;

    [value, token0] = await contract.batch([
      {
        method: 'getReserves',
        transform: (value: any) => [new BigNumber(value[0]), new BigNumber(value[1])],
      },
      {
        method: 'token0',
      },
    ]);
    if (value && value[0] && value[1] && token0) {
      if (token0.toLowerCase() === CONTRACT_WBNB_ADDR.toLowerCase()) {
        bnbPrice = value[1].div(value[0]);
      } else {
        bnbPrice = value[0].div(value[1]);
      }
    }

    setData(prevState => ({
      ...prevState,
      bnbPrice,
    }));
  }, [reload]);

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
      [value] = await contract.batch([
        {
          method: 'getReserves',
          transform: (value: any) => [new BigNumber(value[0]), new BigNumber(value[1])],
        },
      ]);

      return value;
    },
    [contract]
  );

  return React.useMemo<BusdBnbLpContract>(() => ({
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
