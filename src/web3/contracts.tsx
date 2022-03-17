import React from 'react';
import * as Antd from 'antd';
import BigNumber from 'bignumber.js';

import { useAsyncEffect } from 'hooks/useAsyncEffect';
import { useWallet } from 'wallets/wallet';
import Web3Contract from 'web3/contract';
import { ETHContract, useETHContract } from 'web3/contracts/eth';
import { DEXFContract, useDEXFContract } from 'web3/contracts/dexf';
import { BUSDContract, BUSDTokenMeta, useBUSDContract } from 'web3/contracts/busd';
import { DexfBnbLpContract, useDexfBnbLpContract } from 'web3/contracts/dexf-bnb-lp';
import { LPFarmContract, useLPFarmContract } from 'web3/contracts/farm';
import { UniswapV2RouterContract, useUniswapV2RouterContract } from 'web3/contracts/v2-router';
import { BusdBnbLpContract, useBusdBnbLpContract } from 'web3/contracts/busd-bnb-lp';
import { GovernorContract, useGovernorContract } from 'web3/contracts/governor';

import UserRejectedModal from 'components/user-rejected-modal';

export type Web3ContractsData = {
  eth: ETHContract;
  dexf: DEXFContract;
  busd: BUSDContract;
  dexfBnbLp: DexfBnbLpContract;
  farm: LPFarmContract;
  router: UniswapV2RouterContract;
  busdBnbLp: BusdBnbLpContract;
  governor: GovernorContract;
};

export type Web3Contracts = Web3ContractsData & {
  poolTvl: BigNumber | undefined;
  poolApy: BigNumber | undefined;
  dexfAmountPerLp: BigNumber | undefined;
  getTokenUsdPrice(tokenAddress: string): BigNumber | undefined;
};

const Web3ContractsContext = React.createContext<Web3Contracts>({} as any);

export function useWeb3Contracts(): Web3Contracts {
  return React.useContext(Web3ContractsContext);
}

const Web3ContractsProvider: React.FunctionComponent = props => {
  const wallet = useWallet();
  const ethContract = useETHContract();
  const dexfContract = useDEXFContract();
  const busdContract = useBUSDContract();
  const dexfBnbLpContract = useDexfBnbLpContract();
  const busdBnbLpContract = useBusdBnbLpContract();
  const farmContract = useLPFarmContract();
  const routerContract = useUniswapV2RouterContract();
  const governorContract = useGovernorContract();

  const [userRejectedVisible, setUserRejectedVisible] = React.useState<boolean>(false);

  React.useEffect(() => {
    const contracts = [
      ethContract.contract,
      dexfContract.contract,
      busdContract.contract,
      dexfBnbLpContract.contract,
      busdBnbLpContract.contract,
      governorContract.contract,
    ];

    function handleError(err: Error & { code: number }, contract: Web3Contract, { method }: any) {
      console.error(`${contract.name}:${method}`, { error: err });

      if (err.code === 4001) {
        setUserRejectedVisible(true);
      } else {
        Antd.notification.error({
          message: err.message,
        });
      }
    }

    contracts.forEach((contract: Web3Contract) => {
      contract.on('error', handleError);
    });

    return () => {
      contracts.forEach((contract: Web3Contract) => {
        contract.off('error', handleError);
      });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    const contracts = [
      ethContract.contract,
      dexfContract.contract,
      busdContract.contract,
      dexfBnbLpContract.contract,
      busdBnbLpContract.contract,
      farmContract.contract,
      routerContract.contract,
      governorContract.contract,
    ];

    contracts.forEach(contract => {
      contract.setProvider(wallet.provider);
    });
  }, [wallet.provider]); // eslint-disable-line react-hooks/exhaustive-deps

  const [tvl, setTvl] = React.useState<BigNumber | undefined>(new BigNumber(0));
  const [apy, setApy] = React.useState<BigNumber | undefined>(undefined);
  const [dexfAmountPerLp, setDexfAmountPerLp] = React.useState<BigNumber | undefined>(undefined);

  useAsyncEffect(async () => {
    const poolReserves = await dexfBnbLpContract.getReserves();
    const dexfBnbLpTotalSupply = await dexfBnbLpContract.totalSupply();
    const totalLockedLp = dexfBnbLpContract.totalLocked;
    const bnbPrice = busdBnbLpContract.bnbPrice;
    let rate = new BigNumber(dexfContract.rate);
    const stakingRewardRemaining = dexfContract.stakingRewardRemaining;

    if (poolReserves && dexfBnbLpTotalSupply.gt(0) && totalLockedLp && bnbPrice) {
      setTvl(poolReserves[1].times(bnbPrice).times(2).div(dexfBnbLpTotalSupply).times(totalLockedLp));
    }
    if (poolReserves && dexfBnbLpTotalSupply && totalLockedLp && stakingRewardRemaining && totalLockedLp.gt(0)) {
      const currentDexfAmount = poolReserves[0].times(2).div(dexfBnbLpTotalSupply).times(totalLockedLp).times(new BigNumber(10).pow(18));
      setApy(stakingRewardRemaining.times(rate).div(currentDexfAmount).times(100));
      setDexfAmountPerLp(poolReserves[0].times(2).div(dexfBnbLpTotalSupply));
    }
  }, [dexfBnbLpContract, busdBnbLpContract, dexfContract]);

  function getTokenUsdPrice(tokenAddress: string): BigNumber | undefined {
    switch (tokenAddress) {
      case BUSDTokenMeta.address:
        return new BigNumber(1);
      default:
        return undefined;
    }
  }

  const value = {
    eth: ethContract,
    dexf: dexfContract,
    busd: busdContract,
    dexfBnbLp: dexfBnbLpContract,
    busdBnbLp: busdBnbLpContract,
    farm: farmContract,
    router: routerContract,
    governor: governorContract,
    poolTvl: tvl,
    poolApy: apy,
    dexfAmountPerLp,
    getTokenUsdPrice,
  };

  return (
    <Web3ContractsContext.Provider value={value}>
      <UserRejectedModal
        visible={userRejectedVisible}
        onCancel={() => setUserRejectedVisible(false)}
      />
      {props.children}
    </Web3ContractsContext.Provider>
  );
};

export default Web3ContractsProvider;
