import React from 'react';
import * as Antd from "antd";
import BigNumber from "bignumber.js";
import cx from "classnames";
import moment from "moment"; 
import { useAsyncEffect } from 'hooks/useAsyncEffect';
import { useWeb3Contracts } from 'web3/contracts';
import { formatBigValue, getHumanValue, getMultiplier } from 'web3/utils';

import { ReactComponent as LockIcon } from 'resources/svg/icons/lock.svg';
import { ReactComponent as InfoSvg } from 'resources/svg/icons/info.svg';
import { ReactComponent as XSvg } from 'resources/svg/icons/x.svg';
import { ReactComponent as UnlockSvg } from 'resources/svg/icons/unlock.svg';

import s from './styles.module.css';


export type DashboardProps = {
  setAction: Function,
  setTotalDexfClaimed: Function,
  setTotalDexfEarned: Function,
  setDexfBnbStaked: Function,
  setCurrentDexfBnbStaked: Function,
};

const Dashboard: React.FunctionComponent<DashboardProps> = (props) => {
  const { setTotalDexfClaimed, setTotalDexfEarned, setDexfBnbStaked, setCurrentDexfBnbStaked } = props;

  const [multiplierInfo, setMultiplierInfo] = React.useState(false);
  const [voteInfo, setVoteInfo] = React.useState(false);
  const [stakes, setStakes] = React.useState<any[]>([]);

  const { farm, dexfBnbLp, dexf, dexfAmountPerLp } = useWeb3Contracts();

  useAsyncEffect(async () => {
    try {
      let myStakes = await farm.getStakes();
      const promises: any[] = [];
      myStakes.forEach((stake: any, index: number) => {
        promises.push(farm.getClaimAmountByIndex(index));
      })
      const results = await Promise.all(promises);
      myStakes = myStakes.map((stake: any, index: number) => {
        return {...stake, claimAmount: results[index][0], index, depositing: false};
      })

      let totalClaimed = new BigNumber(0);
      let totalEarned = new BigNumber(0);
      let totalStaked = new BigNumber(0);
      let currentTotalStaked = new BigNumber(0);
      myStakes.forEach((stake: any, index: number) => {
        totalClaimed = totalClaimed.plus(new BigNumber(stake.claimedAmount));
        totalEarned = totalEarned.plus(new BigNumber(stake.claimAmount));
        totalStaked = totalStaked.plus(new BigNumber(stake.amount));
        if (stake.endEpochId === 0) {
          currentTotalStaked = currentTotalStaked.plus(new BigNumber(stake.amount));
        }
      })
      setTotalDexfClaimed(getHumanValue(totalClaimed, 18));
      setTotalDexfEarned(getHumanValue(totalEarned.plus(totalClaimed), 18));
      setDexfBnbStaked(getHumanValue(totalStaked, 18));
      setCurrentDexfBnbStaked(getHumanValue(currentTotalStaked, 18));

      setStakes(myStakes.reverse());
    } catch (err) {
      console.log(err);
    }
  }, [farm]);

  const calcPercent = (stake: any) => {
    if (!farm.currentEpoch) {
      return 0;
    }

    return (farm.currentEpoch - stake["startEpochId"]) / (7 * stake["lockWeeks"] + 1) * 100;
  }

  const calcTime = (epochId: number) => {
    if (!farm.epoch1Start || !farm.epochDuration) {
      return "-";
    }

    const timestamp = Number(farm.epoch1Start) + farm.epochDuration * (epochId > 1 ? epochId - 1 : 0);
    return moment.unix(timestamp).format('MMMM Do, YYYY - h:mm:ss a');
  }

  const unstake = async (index: number) => {
    let newStakes = stakes.map((e: any) => {
      if (e.index === index) {
        e.depositing = true;
      }
      return e;
    })
    setStakes(newStakes);

    try {
      await farm.unstake(index);
      farm.reload();
      dexfBnbLp.reload();
      dexf.reload();
    } catch (e) {
      console.log(e);
    }

    newStakes = stakes.map((e: any) => {
      if (e.index === index) {
        e.depositing = false;
      }
      return e;
    })
    setStakes(newStakes);
  }

  // const claim = async () => {
  //   setDepositing(true);

  //   try {
  //     await farm.claim();
  //     farm.reload();
  //     dexfBnbLp.reload();
  //   } catch (e) {
  //     console.log(e);
  //   }

  //   setDepositing(false);
  // }

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
    <div className={s.dashboard}>
      {
        stakes.map((stake, index) => {
          return stake["endEpochId"] === "0" &&
            (
              <div className={cx(s.outerCard)} key={index}>
                <div className={s.card}>
                  {
                    calcPercent(stake) < 100 ?
                    <div className={s.progressbar}>
                      <Antd.Progress percent={calcPercent(stake)} showInfo={false} />
                      <LockIcon />
                    </div> :
                    <div className={cx(s.progressbar, s.progressbarCompleted)}>
                      <Antd.Progress percent={100} showInfo={false} />
                      <UnlockSvg />
                    </div>
                  }
                  <div className={s.status}>
                    <span>
                      LP Staked
                    </span>
                    <div>
                      <span className={s.value}>{formatBigValue(getHumanValue(new BigNumber(stake["amount"]), 18), 4)} DEXF-BNB</span>
                    </div>
                  </div>
                  <div className={s.status}>
                    <span>
                      APY (estimated)
                    </span>
                    <div>
                      <span className={s.value}>
                        {calcApy(stake["lockWeeks"])}%
                      </span>
                    </div>
                  </div>
                  <div className={s.status}>
                    <div className={s.haveInfo}>
                      <span>Rewards multiplier</span>
                      <InfoSvg onClick={() => { setMultiplierInfo(true) }} />
                    </div>
                    <div className={s.haveInfo}>
                      <span className={s.value}>{getMultiplier(stake["lockWeeks"]).toFixed(2)}x</span>
                    </div>
                  </div>
                  <div className={s.status}>
                    <div className={s.haveInfo}>
                      <span>Votes (estimated)</span>
                      <InfoSvg onClick={() => { setVoteInfo(true) }} />
                    </div>
                    <div>
                      <span className={s.value}>{formatBigValue(getHumanValue(new BigNumber(stake["amount"]).multipliedBy(getMultiplier(stake["lockWeeks"])), 18), 4)}</span>
                    </div>
                  </div>
                  <div className={s.status}>
                    <span>
                      Rewards Earned
                    </span>
                    <div>
                      <span className={s.value}>
                        {formatBigValue(getHumanValue(new BigNumber(stake["claimAmount"]), 18), 2)} DEXF
                      </span>
                    </div>
                  </div>
                  <div className={s.status}>
                    <span>
                      Rewards Claimed
                    </span>
                    <div>
                      <span className={s.value}>
                        {formatBigValue(getHumanValue(new BigNumber(stake["claimedAmount"]), 18), 2)} DEXF
                      </span>
                    </div>
                  </div>
                  {
                    calcPercent(stake) >= 100 && stake["endEpochId"] === "0" &&
                    <div className={s.warning}>
                      <InfoSvg />
                      <span>
                        If you unstake and claim your rewards, this pool will be removed.
                        You will need to restake and wait the lock duration AGAIN to get this pool back.
                      </span>
                    </div>
                  }
                  <div className={s.btnWrapper}>
                    <Antd.Button
                      onClick={() => {unstake(stake["index"])}}
                      disabled={
                        (Number(stake["startEpochId"]) + stake["lockWeeks"] * 7 + 1 > Number(farm.currentEpoch)) ||
                        (stake["endEpochId"] === stake["lastClaimEpochId"] && stake["endEpochId"] !== "0")
                      }
                      loading={stake["depositing"]}
                    >
                      UNSTAKE AND CLAIM REWARDS
                    </Antd.Button>
                  </div>
                </div>
                <div>
                  <div className={s.lockStatus}>
                    <span>
                      Locked on
                    </span>
                    <span>
                      {moment.unix(stake["startTimestamp"]).format('MMMM Do, YYYY - h:mm:ss a')}
                    </span>
                  </div>
                  <div className={s.lockStatus}>
                    <span>
                      Lockup Length
                    </span>
                    <span>
                      {stake["lockWeeks"]} weeks
                    </span>
                  </div>
                  <div className={s.lockStatus}>
                    <span>
                    Unlocks on
                    </span>
                    <span>
                      {calcTime(Number(stake["startEpochId"]) + 7 * stake["lockWeeks"] + 1)}
                    </span>
                  </div>
                </div>
              </div>
            )
        })
      }
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

export default Dashboard;
