import React from 'react';
import { useHistory } from 'react-router-dom';
import * as Antd from "antd";
import BigNumber from "bignumber.js";
import cx from "classnames";

import { TokenMeta } from 'web3/types';
import { DexfBnbLpTokenMeta } from 'web3/contracts/dexf-bnb-lp';
import { ETHTokenMeta } from 'web3/contracts/eth';
import { DEXFTokenMeta } from 'web3/contracts/dexf';
import { BUSDTokenMeta } from 'web3/contracts/busd';
import { useWeb3Contracts } from 'web3/contracts';
import { useWallet } from 'wallets/wallet'
import { getExponentValue, getMultiplier } from 'web3/utils';

import { ReactComponent as ArrowLeftSvg } from 'resources/svg/icons/arrow-left.svg';
import { ReactComponent as ArrowDonw1Svg } from 'resources/svg/icons/arrow-down1.svg';
import { ReactComponent as CheckSvg } from 'resources/svg/icons/check-green.svg';
import { ReactComponent as CheckedSvg } from 'resources/svg/icons/checked.svg';
import { ReactComponent as UncheckedSvg } from 'resources/svg/icons/unchecked.svg';

import s from './styles.module.css';

export type ReviewProps = {
  setAction: Function,
  className: string | boolean,
  depositAmount: BigNumber,
  lockupLength: number,
  setLockupLength: Function,
  token: TokenMeta | string,
  lpEstimated: number,
};

const Review: React.FunctionComponent<ReviewProps> = (props) => {
  const history = useHistory();

  const { setAction, className, depositAmount, lockupLength, token, lpEstimated } = props;

  const [approving, setApproving] = React.useState(false);
  const [depositing, setDepositing] = React.useState(false);
  const [allowance, setAllowance] = React.useState(new BigNumber(0));
  const [checked, setChecked] = React.useState(false);

  const { dexf, eth, dexfBnbLp, busd, farm, dexfAmountPerLp } = useWeb3Contracts();
  const wallet = useWallet();

  React.useEffect(() => {
    switch (token) {
      case DexfBnbLpTokenMeta:
        dexfBnbLp.allowance && setAllowance(dexfBnbLp.allowance);
        break;
      case ETHTokenMeta:
        eth.allowance && setAllowance(eth.allowance);
        break;
      case DEXFTokenMeta:
        dexf.allowance && setAllowance(dexf.allowance);
        break;
      case BUSDTokenMeta:
        busd.allowance && setAllowance(busd.allowance);
        break;
      default:
        break;
    }
  }, [wallet, dexf, eth, dexfBnbLp, busd, farm, token, depositing])

  const isApprovementNeeded = () => {
    if (token === "BNB") {
      return false;
    }

    let decimals = (token as TokenMeta).decimals;
    if (new BigNumber(depositAmount).times(getExponentValue(decimals)).gt(allowance)) {
      return true;
    }
    return false;
  }

  const approve = async () => {
    if (isApprovementNeeded()) {
      setApproving(true);

      const amount = new BigNumber(2).pow(256).minus(1);
      try {
        switch (token) {
          case DexfBnbLpTokenMeta:
            await dexfBnbLp.approveSend(amount);
            dexfBnbLp.reload();
            break;
          case ETHTokenMeta:
            await eth.approveSend(amount);
            eth.reload();
            break;
          case DEXFTokenMeta:
            await dexf.approveSend(amount);
            dexf.reload();
            break;
          case BUSDTokenMeta:
            await busd.approveSend(amount);
            busd.reload();
            break;
          default:
            break;
        }
      } catch (e) {
        console.log(e);
      }

      setApproving(false);
    }    
  }

  const stake = async () => {
    setDepositing(true);

    try {
      if (token === "BNB") {
        await farm.stake(depositAmount, lockupLength);
        farm.reload();
      } else if ((token as TokenMeta).name === "DEXF") {
        await farm.stakeDexf(depositAmount, lockupLength);
        farm.reload();
      } else if ((token as TokenMeta).name === "DEXF-BNB LP") {
        await farm.stakeLPToken(depositAmount, lockupLength);
        farm.reload();
      } else {
        await farm.stakeToken(
          (token as TokenMeta).address,
          new BigNumber(depositAmount).times(getExponentValue((token as TokenMeta).decimals)),
          lockupLength
        );
        farm.reload();
      }
  
      switch (token) {
        case DexfBnbLpTokenMeta:
          dexfBnbLp.reload();
          break;
        case ETHTokenMeta:
          eth.reload();
          break;
        case DEXFTokenMeta:
          dexf.reload();
          break;
        case BUSDTokenMeta:
          busd.reload();
          break;
        default:
          break;
      }

      if (token !== DexfBnbLpTokenMeta) {
        dexfBnbLp.reload();
      }

      history.push("/dashboard");
    } catch (e) {
      console.log(e);
    }

    setDepositing(false);
  }

  const calcApy = (lockWeeks: any) => {
    if (farm.currentMultiplier !== undefined && farm.currentMultiplier.gt(0) && dexfAmountPerLp && dexf.stakingRewardRemaining) {
      return dexf.stakingRewardRemaining.times(dexf.rate)
        .times(getMultiplier(Number(lockWeeks))).times(100)
        .div(farm.currentMultiplier)
        .div(new BigNumber(dexfAmountPerLp)).times(100).dp(2, 2).toString(10);
    }

    return "-";
  }

  return (
    <div className={cx(s.card, className)}>
      <div className={s.title} onClick={() => {setAction('lockUpLength')}}>
        <ArrowLeftSvg />
        <span>Review</span>
      </div>
      <div className={s.status}>
        <span>
          Deposit
        </span>
        <div>
          <span className={s.value}>{depositAmount.toFixed(4)}</span>
          <span className={s.value}>&nbsp;{ (token as TokenMeta).name && (token as TokenMeta).name}{ token === "BNB" && "BNB"}</span>
        </div>
      </div>
      <div className={s.status}>
        {
          (token as TokenMeta).name === "DEXF-BNB LP" ?
          <span>LP Staked</span> :
          <span>LP Staked (estimated)</span>
        }
        <div>
          <span className={s.value}>{Number(lpEstimated)?.toFixed(2)}</span>
          <span className={s.value}>&nbsp;DEXF-BNB</span>
        </div>
      </div>
      <div className={s.status}>
        <span>
          APY (estimated)
        </span>
        <div>
          <span className={s.value}>{calcApy(lockupLength)}%</span>
        </div>
      </div>
      <div className={s.status}>
        <span>
          Lockup Length
        </span>
        <div>
          {/* <span className={s.max} onClick={() => {setLockupLength(104)}}>MAX</span> */}
          <span className={s.value}>{lockupLength}</span>
          <span className={s.value}>&nbsp;weeks</span>
        </div>
      </div>
      <div className={s.status}>
        <span>
          Rewards multiplier
        </span>
        <div>
          <span className={s.value}>{getMultiplier(lockupLength).toFixed(2)}</span>
          <span className={s.value}>&nbsp;x</span>
        </div>
      </div>
      <div className={s.status}>
        <span>
          Votes (estimated)
        </span>
        <div>
          <span className={s.value}>{Number(lpEstimated * getMultiplier(lockupLength))?.toFixed(2)}</span>
        </div>
      </div>
      <div className={s.understand} onClick={() => { setChecked(!checked) }}>
        {checked && <CheckedSvg />}
        {!checked && <UncheckedSvg />}
        <span>
          I accept the&nbsp;
          <a href="https://dexfolio.org/terms-of-use" target="_blank" rel="noreferrer">Terms of Use</a>
          &nbsp;and&nbsp;
          <a href="https://dexfolio.org/privacy-policy" target="_blank" rel="noreferrer">Privacy Policy</a>.
        </span>
      </div>
      <div className={cx(s.btnWrapper, s.firstBtn)}>
        <Antd.Button
          onClick={() => {approve()}}
          disabled={!isApprovementNeeded()}
          loading={approving}
        >
          1. APPROVE Wallet
        </Antd.Button>
        {
          !isApprovementNeeded() &&
          <CheckSvg className={s.check} />
        }
      </div>
      <div className={s.arrowWrapper}>
        <ArrowDonw1Svg />
      </div>
      <div className={s.btnWrapper}>
        <Antd.Button
          onClick={() => {stake()}}
          disabled={isApprovementNeeded() || !checked}
          loading={depositing}
        >
          2. Stake LP Tokens
        </Antd.Button>
      </div>
    </div>
  );
};

export default Review;
