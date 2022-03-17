import React from 'react';
import BigNumber from 'bignumber.js';

import { useReload } from 'hooks/useReload';
import { useAsyncEffect } from 'hooks/useAsyncEffect';
import Web3Contract from 'web3/contract';

export const CONTRACT_V2_ROUTER = String(process.env.REACT_APP_CONTRACT_V2_ROUTER_ADDR);

type UniswapV2RouterContractData = {
  WETH?: string | undefined;
};

export type UniswapV2RouterContract = UniswapV2RouterContractData & {
  contract: Web3Contract;
  reload(): void;
  getAmountsIn: (amountOut: BigNumber, path: string[]) => Promise<any>;
  getAmountsOut: (amountIn: BigNumber, path: string[]) => Promise<any>;
};

const InitialData: UniswapV2RouterContractData = {
  WETH: undefined,
};

export function useUniswapV2RouterContract(): UniswapV2RouterContract {
  const [reload] = useReload();

  const contract = React.useMemo<Web3Contract>(() => {
    return new Web3Contract(
      require('web3/abi/v2-router.json'),
      CONTRACT_V2_ROUTER,
      'UniswapV2Router02',
    );
  }, []);

  const [data, setData] = React.useState<UniswapV2RouterContractData>(InitialData);

  useAsyncEffect(async () => {
    let [WETH] = await contract.batch([
      {
        method: 'WETH',
      },
    ]);

    setData(prevState => ({
      ...prevState,
      WETH,
    }));
  }, [reload, contract]);

  const getAmountsIn = React.useCallback(
    async (amountOut: BigNumber, path: string[]) => {
      let value: any;
      [value] = await contract.batch([
        {
          method: 'getAmountsIn',
          methodArgs: [amountOut, path],
          // transform: (value: any) => new BigNumber(value),
        },
      ]);

      return value;
    },
    [contract]
  );

  const getAmountsOut = React.useCallback(
    async (amountIn: BigNumber, path: string[]) => {
      let value: any;
      [value] = await contract.batch([
        {
          method: 'getAmountsOut',
          methodArgs: [amountIn, path],
          transform: (amounts: any) => amounts.map((amount: any) => new BigNumber(amount)),
        },
      ]);

      return value;
    },
    [contract]
  );

  return React.useMemo<UniswapV2RouterContract>(() => ({
    ...data,
    contract,
    reload,
    getAmountsIn,
    getAmountsOut,
  }), [
    data,
    contract,
    reload,
    getAmountsIn,
    getAmountsOut,
  ]);
}
