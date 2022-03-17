import React from 'react';
import BigNumber from 'bignumber.js';

import { useReload } from 'hooks/useReload';
import { useAsyncEffect } from 'hooks/useAsyncEffect';
import { TokenMeta } from 'web3/types';
import { getHumanValue } from 'web3/utils';
import { useWallet } from 'wallets/wallet';
import Web3Contract from 'web3/contract';
import { CONTRACT_LP_FARMING } from 'web3/contracts/farm';

import { ReactComponent as BUSDIcon } from 'resources/svg/tokens/busd.svg';

const CONTRACT_BUSD_ADDR = String(process.env.REACT_APP_CONTRACT_BUSD_ADDR).toLowerCase();

export const BUSDTokenMeta: TokenMeta = {
  icon: <BUSDIcon key="busd" />,
  name: 'BUSD',
  address: CONTRACT_BUSD_ADDR,
  decimals: 18,
};

type BUSDContractData = {
  balance?: BigNumber;
  allowance?: BigNumber;
};

export type BUSDContract = BUSDContractData & {
  contract: Web3Contract;
  reload(): void;
  approveSend(value: BigNumber): Promise<any>;
};

const InitialData: BUSDContractData = {
  balance: undefined,
  allowance: undefined,
};

export function useBUSDContract(): BUSDContract {
  const [reload] = useReload();
  const wallet = useWallet();

  const contract = React.useMemo<Web3Contract>(() => {
    return new Web3Contract(
      require('web3/abi/busd.json'),
      CONTRACT_BUSD_ADDR,
      'BUSD',
    );
  }, []);

  const [data, setData] = React.useState<BUSDContractData>(InitialData);

  useAsyncEffect(async () => {
    let balance: BigNumber | undefined;
    let allowance: BigNumber | undefined;

    if (wallet.account) {
      [balance, allowance] = await contract.batch([
        {
          method: 'balanceOf',
          methodArgs: [wallet.account],
          transform: (value: string) => getHumanValue(new BigNumber(value), BUSDTokenMeta.decimals),
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

  return React.useMemo<BUSDContract>(() => ({
    ...data,
    contract,
    reload,
    approveSend,
  }), [
    data,
    contract,
    reload,
    approveSend,
  ]);
}
