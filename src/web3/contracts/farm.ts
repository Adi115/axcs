import React from 'react';
import BigNumber from 'bignumber.js';

import { useReload } from 'hooks/useReload';
import { useAsyncEffect } from 'hooks/useAsyncEffect';
import { getHumanValue } from 'web3/utils';
import { useWallet } from 'wallets/wallet';
import Web3Contract from 'web3/contract';

export const CONTRACT_LP_FARMING = String(process.env.REACT_APP_CONTRACT_LP_FARMING_ADDR);

type LPFarmContractData = {
  epoch1Start?: number | undefined;
  epochDuration?: number | undefined;
  currentEpoch?: number | undefined;
  totalRewardDistributed?: BigNumber | undefined;
  currentMultiplier?: BigNumber | undefined;
  votingPower: BigNumber | undefined;
};

export type LPFarmContract = LPFarmContractData & {
  contract: Web3Contract;
  reload(): void;
  stake: (amount: BigNumber, lockWeeks: number) => void;
  stakeDexf: (amount: BigNumber, lockWeeks: number) => void;
  stakeToken: (fromTokenAddress: string, tokenAmount: BigNumber, lockWeeks: number) => void;
  stakeLPToken: (amount: BigNumber, lockWeeks: number) => void;
  unstake: (index: number) => void;
  claim: () => void;
  getStakes: () => Promise<any>;
  getClaimAmountByIndex: (index: number) => Promise<any>;
  getEpochMultiplier: (index: number) => Promise<any>;
  getPriorMultiplier: (timestamp: string) => Promise<any>;
  getPriorTotalMultiplier: (timestamp: string) => Promise<any>;
};

const InitialData: LPFarmContractData = {
  epoch1Start: undefined,
  epochDuration: undefined,
  currentEpoch: undefined,
  totalRewardDistributed: undefined,
  votingPower: undefined,
};

export function useLPFarmContract(): LPFarmContract {
  const [reload] = useReload();
  const wallet = useWallet();

  const contract = React.useMemo<Web3Contract>(() => {
    return new Web3Contract(
      require('web3/abi/lp-farming.json'),
      CONTRACT_LP_FARMING,
      'LP_FARMING',
    );
  }, []);

  const [data, setData] = React.useState<LPFarmContractData>(InitialData);

  useAsyncEffect(async () => {
    let [epoch1Start, epochDuration, currentEpoch, totalRewardDistributed, currentMultiplier] = await contract.batch([
      {
        method: '_epoch1Start',
      },
      {
        method: '_epochDuration',
      },
      {
        method: 'getCurrentEpoch',
      },
      {
        method: 'totalRewardDistributed',
        transform: (value: string) => getHumanValue(new BigNumber(value), 18),
      },
      {
        method: 'getPriorTotalMultiplier',
        methodArgs: [0],
        transform: (value: string) => new BigNumber(value),
      },
    ]);

    setData(prevState => ({
      ...prevState,
      epoch1Start,
      epochDuration,
      currentEpoch,
      currentMultiplier,
      totalRewardDistributed,
    }));
  }, [reload]);

  useAsyncEffect(async () => {
    if (!wallet.account) {
      return;
    }
    const [votingPower] = await contract.batch([
      {
        method: 'getPriorMultiplier',
        methodArgs: [wallet.account, 0],
      },
    ]);

    setData(prevState => ({
      ...prevState,
      votingPower: votingPower ? new BigNumber(votingPower[1]) : undefined,
    }));
  }, [reload, wallet.account]);

  const stake = React.useCallback((amount: BigNumber, lockWeeks: number) => {
    if (!wallet.account) {
      return Promise.reject();
    }

    return contract.send('stake', [lockWeeks], {
      from: wallet.account,
      value: amount.times(new BigNumber(10).pow(18))
    }).then(reload);
  }, [reload, contract, wallet.account]);

  const stakeDexf = React.useCallback(
    (amount: BigNumber, lockWeeks: number) => {
      if (!wallet.account) {
        return Promise.reject();
      }

      return contract.send('stakeDexf', [
        amount.times(new BigNumber(10).pow(18)),
        lockWeeks
      ], {
        from: wallet.account,
      }).then(reload);
    },
    [reload, contract, wallet.account]
  );

  const stakeToken = React.useCallback(
    (fromTokenAddress: string, tokenAmount: BigNumber, lockWeeks: number) => {
      if (!wallet.account) {
        return Promise.reject();
      }

      return contract.send('stakeToken', [
        fromTokenAddress,
        tokenAmount,
        lockWeeks,
      ], {
        from: wallet.account,
      }).then(reload);
    },
    [reload, contract, wallet.account]
  );

  const stakeLPToken = React.useCallback(
    (amount: BigNumber, lockWeeks: number) => {
      if (!wallet.account) {
        return Promise.reject();
      }

      return contract.send('stakeLPToken', [
        amount.times(new BigNumber(10).pow(18)),
        lockWeeks,
      ], {
        from: wallet.account,
      }).then(reload);
    },
    [reload, contract, wallet.account]
  );

  const unstake = React.useCallback((index: number) => {
    if (!wallet.account) {
      return Promise.reject();
    }

    return contract.send('unstake', [index],
      {
      from: wallet.account,
    }).then(reload);
  }, [reload, contract, wallet.account]);

  const claim = React.useCallback(() => {
    if (!wallet.account) {
      return Promise.reject();
    }

    return contract.send('claim', [],
      {
      from: wallet.account,
    }).then(reload);
  }, [reload, contract, wallet.account]);

  const getStakes = React.useCallback(async () => {
    if (!wallet.account) {
      return Promise.reject();
    }

    const [stakes] = await contract.batch([
      {
        method: 'getStakes',
        methodArgs: [wallet.account],
      },
    ]);

    return stakes;
  }, [contract, wallet.account]);

  const getClaimAmountByIndex = React.useCallback(async (index: number) => {
    if (!wallet.account) {
      return Promise.reject();
    }

    const [claimAmount] = await contract.batch([
      {
        method: 'getClaimAmountByIndex',
        methodArgs: [wallet.account, index],
      },
    ]);

    return claimAmount;
  }, [contract, wallet.account]);

  const getEpochMultiplier = React.useCallback(async (index: number) => {
    const [multiplier] = await contract.batch([
      {
        method: 'totalMultipliers',
        methodArgs: [index],
      },
    ]);

    return multiplier;
  }, [contract]);

  const getPriorMultiplier = React.useCallback(async (timestamp: string) => {
    if (!wallet.account) {
      return Promise.reject();
    }

    const [multiplier] = await contract.batch([
      {
        method: 'getPriorMultiplier',
        methodArgs: [wallet.account, timestamp],
      },
    ]);

    return multiplier;
  }, [contract, wallet]);

  const getPriorTotalMultiplier = React.useCallback(async (timestamp: string) => {
    const [multiplier] = await contract.batch([
      {
        method: 'getPriorTotalMultiplier',
        methodArgs: [timestamp],
      },
    ]);

    return multiplier;
  }, [contract]);

  return React.useMemo<LPFarmContract>(() => ({
    ...data,
    contract,
    reload,
    stake,
    stakeDexf,
    stakeToken,
    stakeLPToken,
    unstake,
    claim,
    getStakes,
    getClaimAmountByIndex,
    getEpochMultiplier,
    getPriorMultiplier,
    getPriorTotalMultiplier,
  }), [
    data,
    contract,
    reload,
    stake,
    stakeDexf,
    stakeToken,
    stakeLPToken,
    unstake,
    claim,
    getStakes,
    getClaimAmountByIndex,
    getEpochMultiplier,
    getPriorMultiplier,
    getPriorTotalMultiplier,
  ]);
}
