import React from 'react';
import BigNumber from 'bignumber.js';
import memoize from 'lodash/memoize';

import { TokenMeta } from 'web3/types';
import { DEXFTokenMeta } from 'web3/contracts/dexf';
import { DexfBnbLpTokenMeta } from 'web3/contracts/dexf-bnb-lp';
import { BUSDTokenMeta } from 'web3/contracts/busd';
import { ETHTokenMeta } from 'web3/contracts/eth';

export const MAX_UINT_256 = new BigNumber(2).pow(256).minus(1);
export const ZERO_BIG_NUMBER = new BigNumber(0);

export function getWSRpcUrl(chainId: number = Number(process.env.REACT_APP_WEB3_CHAIN_ID)): string {
  const WEB3_RPC_ID = String(process.env.REACT_APP_WEB3_RPC_ID);

  switch (chainId) {
    case 1:
      return `wss://mainnet.infura.io/ws/v3/${WEB3_RPC_ID}`;
    case 4:
      return `wss://rinkeby.infura.io/ws/v3/${WEB3_RPC_ID}`;
    case 42:
      return `wss://kovan.infura.io/ws/v3/${WEB3_RPC_ID}`;
    default:
      throw new Error(`Not supported chainId=${chainId}.`);
  }
}

export function getHttpsRpcUrl(chainId: number = Number(process.env.REACT_APP_WEB3_CHAIN_ID)): string {
  const WEB3_RPC_ID = String(process.env.REACT_APP_WEB3_RPC_ID);

  switch (chainId) {
    case 1:
      return `https://mainnet.infura.io/v3/${WEB3_RPC_ID}`;
    case 4:
      return `https://rinkeby.infura.io/v3/${WEB3_RPC_ID}`;
    case 42:
      return `https://kovan.infura.io/v3/${WEB3_RPC_ID}`;
    case 56:
        return String(process.env.REACT_APP_WEB3_RPC_BSC);
    default:
      throw new Error(`Not supported chainId=${chainId}.`);
  }
}

export function getEtherscanTxUrl(
  txHash: string,
  chainId: number = Number(process.env.REACT_APP_WEB3_CHAIN_ID),
): string {
  switch (chainId) {
    case 1:
      return `https://etherscan.io/tx/${txHash}`;
    case 4:
      return `https://rinkeby.etherscan.io/tx/${txHash}`;
    case 42:
      return `https://kovan.etherscan.io/tx/${txHash}`;
    case 56:
        return `https://bscscan.com/address/tx/${txHash}`;
    default:
      throw new Error(`Not supported chainId=${chainId}.`);
  }
}

export function getEtherscanAddressUrl(
  address: string,
  chainId: number = Number(process.env.REACT_APP_WEB3_CHAIN_ID),
): string {
  switch (chainId) {
    case 1:
      return `https://etherscan.io/address/${address}`;
    case 4:
      return `https://rinkeby.etherscan.io/address/${address}`;
    case 42:
      return `https://kovan.etherscan.io/address/${address}`;
    case 56:
        return `https://bscscan.com/address/${address}`;
    default:
      throw new Error(`Not supported chainId=${chainId}.`);
  }
}

export function getNetworkName(chainId: number | undefined): string {
  switch (chainId) {
    case 1:
      return 'Mainnet';
    case 4:
      return 'Rinkeby';
    case 42:
      return 'kovan';
    case 56:
      return 'BSC Mainnet';
    default:
      return '-';
  }
}

export function getExponentValue(decimals: number = 0): BigNumber {
  return new BigNumber(10).pow(decimals);
}

export function getHumanValue(value?: BigNumber, decimals: number = 0): BigNumber | undefined {
  return value?.div(getExponentValue(decimals));
}

export function getNonHumanValue(value: BigNumber | number, decimals: number = 0): BigNumber {
  return (new BigNumber(value)).multipliedBy(getExponentValue(decimals));
}

export function formatBigValue(value?: BigNumber, decimals: number = 4, defaultValue: string = '-', minDecimals: number | undefined = undefined): string {
  return value ? new BigNumber(value.toFixed(decimals)).toFormat(minDecimals) : defaultValue;
}

export function formatUSDValue(value?: BigNumber, decimals: number = 2, minDecimals: number = decimals): string {
  if (value === undefined) {
    return '-';
  }

  const val = BigNumber.isBigNumber(value) ? value : new BigNumber(value);
  const formattedValue = formatBigValue(val.abs(), decimals, '-', minDecimals);

  return val.isPositive() ? `$${formattedValue}` : `-$${formattedValue}`;
}

export function defaultFormatValue(value?: BigNumber): string {
  return formatBigValue(value, 2);
}

export function shortenAddr(addr: string, first: number = 6, last: number = 4) {
  return [String(addr).slice(0, first), String(addr).slice(-last)].join('...');
}

export function convertToNumber(value: BigNumber | undefined) {
  if (value) {
    return parseFloat(value.toString());
  }

  return 0;
}

export function getTokenMeta(tokenAddr: string): TokenMeta | undefined {
  switch (tokenAddr.toLowerCase()) {
    case DEXFTokenMeta.address:
      return DEXFTokenMeta;
    case DexfBnbLpTokenMeta.address:
      return DexfBnbLpTokenMeta;
    case BUSDTokenMeta.address:
      return BUSDTokenMeta;
    case ETHTokenMeta.address:
      return ETHTokenMeta;
    default:
      return undefined;
  }
}

export enum PoolTypes {
  STABLE = 'stable',
  UNILP = 'unilp',
  SWAPP = 'swapp',
}

export const getPoolIcons = memoize((poolType: PoolTypes): React.ReactNode[] => {
  switch (poolType) {
    case PoolTypes.STABLE:
      return [
        DEXFTokenMeta.icon,
      ];
    case PoolTypes.UNILP:
      return [
        DexfBnbLpTokenMeta.icon,
      ];
    case PoolTypes.SWAPP:
      return [
        BUSDTokenMeta.icon,
      ];
    default:
      return [];
  }
});

export const getPoolNames = memoize((poolType: PoolTypes): string[] => {
  switch (poolType) {
    case PoolTypes.STABLE:
      return [
        DEXFTokenMeta.name,
      ];
    case PoolTypes.UNILP:
      return [
        DexfBnbLpTokenMeta.name,
      ];
    case PoolTypes.SWAPP:
      return [
        BUSDTokenMeta.name,
      ];
    default:
      return [];
  }
});

export function getTokenAddress(token: string) {
  switch (token) {
    case 'DAI':
      return String(process.env.REACT_APP_CONTRACT_DAI_ADDR);
  }
  return "";
}

export function getMultiplier(lockWeeks: number) {
  const multipliers = [
    100, 104, 108, 112, 115, 119, 122, 125, 128, 131,
    134, 136, 139, 142, 144, 147, 149, 152, 154, 157,
    159, 161, 164, 166, 168, 170, 173, 175, 177, 179,
    181, 183, 185, 187, 189, 191, 193, 195, 197, 199,
    201, 203, 205, 207, 209, 211, 213, 214, 216, 218,
    220, 222, 223, 225, 227, 229, 230, 232, 234, 236,
    237, 239, 241, 242, 244, 246, 247, 249, 251, 252,
    254, 255, 257, 259, 260, 262, 263, 265, 267, 268,
    270, 271, 273, 274, 276, 277, 279, 280, 282, 283,
    285, 286, 288, 289, 291, 292, 294, 295, 297, 298
  ];

  if (lockWeeks < 3) {
    return 0;
  } else if (lockWeeks >= 104) {
    return 3;
  }

  return multipliers[lockWeeks - 4] / 100;
}
