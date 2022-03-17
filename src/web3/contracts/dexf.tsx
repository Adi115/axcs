import React from 'react';
import BigNumber from 'bignumber.js';

import { useReload } from 'hooks/useReload';
import { useAsyncEffect } from 'hooks/useAsyncEffect';
import { TokenMeta } from 'web3/types';
import { getHumanValue } from 'web3/utils';
import { useWallet } from 'wallets/wallet';
import Web3Contract from 'web3/contract';
import { CONTRACT_LP_FARMING } from 'web3/contracts/farm';

import { ReactComponent as DEXFIcon } from 'resources/svg/tokens/dexf.svg';

const CONTRACT_DEXF_ADDR = String(process.env.REACT_APP_CONTRACT_DEXF_ADDR).toLowerCase();

export const DEXFTokenMeta: TokenMeta = {
  icon: <DEXFIcon key="dexf" />,
  name: 'DEXF',
  address: CONTRACT_DEXF_ADDR,
  decimals: 18,
};

type DEXFContractData = {
  balance?: BigNumber | undefined;
  allowance?: BigNumber | undefined;
  stakingRewardRemaining?: BigNumber | undefined;
  dailyReleasePercentStaking: number | undefined;
  rate: number;
};

export type DEXFContract = DEXFContractData & {
  contract: Web3Contract;
  reload(): void;
  approveSend(value: BigNumber): Promise<any>;
};

const InitialData: DEXFContractData = {
  balance: undefined,
  allowance: undefined,
  stakingRewardRemaining: undefined,
  dailyReleasePercentStaking: undefined,
  rate: 0,
};

export function useDEXFContract(): DEXFContract {
  const [reload] = useReload();
  const wallet = useWallet();

  const contract = React.useMemo<Web3Contract>(() => {
    return new Web3Contract(
      require('web3/abi/dexf.json'),
      CONTRACT_DEXF_ADDR,
      'DEXF',
    );
  }, []);

  const [data, setData] = React.useState<DEXFContractData>(InitialData);

  useAsyncEffect(async () => {
    let stakingRewardRemaining: BigNumber | undefined;
    let dailyReleasePercentStaking: number | undefined;

    [stakingRewardRemaining, dailyReleasePercentStaking] = await contract.batch([
      {
        method: 'stakingRewardRemaining',
        transform: (value: string) => new BigNumber(value),
      },
      {
        method: 'DAILY_RELEASE_PERCENT_STAKING',
        transform: (value: string) => parseInt(value),
      },
    ]);

    let rate = 0;
    if (dailyReleasePercentStaking) {
      const dailyPercent = dailyReleasePercentStaking / 10000;
      let totalReward = 0;
      let remaining = 1;
      for (let i = 0; i < 365; i++) {
        let reward = remaining * dailyPercent;
        totalReward += reward;
        remaining -= reward;
      }

      rate = totalReward
    }
    

    setData(prevState => ({
      ...prevState,
      stakingRewardRemaining,
      dailyReleasePercentStaking,
      rate,
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
          transform: (value: string) => getHumanValue(new BigNumber(value), DEXFTokenMeta.decimals),
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

  return React.useMemo<DEXFContract>(() => ({
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
