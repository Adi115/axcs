import React from 'react';
import * as Antd from "antd";
import BigNumber from "bignumber.js";
import cx from "classnames";
import { useWeb3Contracts } from 'web3/contracts';
import { getMultiplier } from 'web3/utils';
import { TokenMeta } from 'web3/types';

import { ReactComponent as ArrowLeftSvg } from 'resources/svg/icons/arrow-left.svg';
import { ReactComponent as CheckedSvg } from 'resources/svg/icons/checked.svg';
import { ReactComponent as UncheckedSvg } from 'resources/svg/icons/unchecked.svg';
import { ReactComponent as InfoSvg } from 'resources/svg/icons/info.svg';
import { ReactComponent as XSvg } from 'resources/svg/icons/x.svg';

import s from './styles.module.css';


export type LockupLengthProps = {
  setAction: Function,
  className: string | boolean,
  lockupLength: number,
  setLockupLength: Function,
  lpEstimated: number,
  token: TokenMeta | string,
};

const LockupLength: React.FunctionComponent<LockupLengthProps> = (props) => {
  const { setAction, className, lockupLength, setLockupLength, lpEstimated, token } = props;

  const { farm, dexf, dexfAmountPerLp } = useWeb3Contracts();

  const [checked, setChecked] = React.useState(false);
  const [multiplierInfo, setMultiplierInfo] = React.useState(false);
  const [voteInfo, setVoteInfo] = React.useState(false);

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
    <div>
      <div className={cx(s.card, className)}>
        <div className={s.title} onClick={() => {setAction('stake')}}>
          <ArrowLeftSvg />
          <span>Lockup Length</span>
        </div>
        <div className={s.description1}>
          <span>
            A longer lockup will give more staking rewards, governance votes, and APY. 
          </span>
        </div>
        <div className={s.description2}>
          <span>
            Once you wait the lockup length, you can unstake your LP tokens to claim your DEXF rewards.
          </span>
        </div>
        <div className={s.description3}>
          <span>
            You can choose to leave them staked to continue receiving rewards and votes.
          </span>
        </div>
        <div className={s.progress}>
          <Antd.Slider
            defaultValue={lockupLength}
            value={lockupLength}
            min={4}
            max={104}
            tipFormatter={null}
            onChange={(value: number) => {setLockupLength(value)}}
          />
        </div>
        <div className={s.status}>
          <span>
            Lockup Length
          </span>
          <div>
            <span className={s.max} onClick={() => {setLockupLength(104)}}>MAX</span>
            <span className={s.value}>{lockupLength}</span><span className={s.value}>&nbsp;weeks</span>
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
          <div className={s.haveInfo}>
            <span>Rewards multiplier</span>
            <InfoSvg onClick={() => { setMultiplierInfo(true) }} />
          </div>
          <div>
            <span className={s.value}>{getMultiplier(lockupLength).toFixed(2)}</span>
            <span className={s.value}>&nbsp;x</span>
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
          <div className={s.haveInfo}>
            <span>Votes (estimated)</span>
            <InfoSvg onClick={() => { setVoteInfo(true) }} />
          </div>
          <div>
            <span className={s.value}>{Number(lpEstimated * getMultiplier(lockupLength))?.toFixed(2)}</span>
          </div>
        </div>
        <div className={s.understand} onClick={() => { setChecked(!checked) }}>
          {checked && <CheckedSvg />}
          {!checked && <UncheckedSvg />}
          <span>
            I understand that I won’t be able to unstake my DEXF-BNB LP tokens for <span>{lockupLength}</span> weeks.
          </span>
        </div>
        <div className={s.btnWrapper}>
          <Antd.Button
            onClick={() => {setAction('review')}}
            disabled={!checked}
          >
            Continue to Review
          </Antd.Button>
        </div>
      </div>
      {
        multiplierInfo &&
        <div className={s.infoModalWrapper} onClick={() => { setMultiplierInfo(false) }}>
          <div className={s.infoModal} onClick={(e) => { e.stopPropagation() } }>
            <span className={s.modalTitle}>Rewards Multiplier</span>
            <span className={s.modalDescription}>
              The longer you lock your staked LP, the higher your rewards multiplier!
            </span>
            <span className={s.modalDescription}>
              If you lock your LP tokens for 104 weeks (max), you will receive 3x rewards every day!
            </span>
            <span className={s.modalDescription}>
              Keep in mind, you can’t unstake the LP tokens for the duration it’s locked.
            </span>
            <div className={s.closeBtn} onClick={() => { setMultiplierInfo(false) }}>
              <XSvg />
            </div>
          </div>
        </div>
      }
      {
        voteInfo &&
        <div className={s.infoModalWrapper} onClick={() => { setVoteInfo(false) }}>
          <div className={s.infoModal} onClick={(e) => { e.stopPropagation() } }>
            <span className={s.modalTitle}>Votes</span>
            <span className={s.modalDescription}>
              When you stake, you get votes equal to the LP tokens staked multiplied by the Rewards Multiplier.
            </span>
            <span className={s.modalDescription}>
              You use votes to participate in Dexfolio governance proposals. Votes can be used once for every proposal.
            </span>
            <div className={s.closeBtn} onClick={() => { setVoteInfo(false) }}>
              <XSvg />
            </div>
          </div>
        </div>
      }
    </div>
  );
};

export default LockupLength;
