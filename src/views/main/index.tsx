import React from 'react';
import { Redirect, Route, Switch, useRouteMatch, useHistory } from 'react-router-dom';
import cx from "classnames";
import BigNumber from "bignumber.js";

// import TokenButton from 'components/token-button';
import { useWeb3Contracts } from 'web3/contracts';
import IconButton from 'components/icon-button';
import StatsDetail from 'components/stats-detail';
import ExternalLink from 'components/externalLink';
import { useLayout } from 'views/layout';

import Farm from 'views/stake'
import Vote from 'views/vote'
import Dashboard from './components/dashboard';

import { ReactComponent as LogoSvg } from 'resources/svg/logo.svg';
import { ReactComponent as StakeIcon } from 'resources/svg/icons/stake.svg';
import { ReactComponent as StakeIcon1 } from 'resources/svg/icons/stake1.svg';
import { ReactComponent as DashboardIcon } from 'resources/svg/icons/dashboard.svg';
import { ReactComponent as DashboardIcon1 } from 'resources/svg/icons/dashboard1.svg';
import { ReactComponent as VoteIcon } from 'resources/svg/icons/vote.svg';
import { ReactComponent as VoteIcon1 } from 'resources/svg/icons/vote1.svg';
import { ReactComponent as LinkIcon } from 'resources/svg/icons/link.svg';
import { ReactComponent as XSvg } from 'resources/svg/icons/x.svg';

import s from './styles.module.css';
import { getEtherscanAddressUrl, getHumanValue, formatBigValue } from 'web3/utils';

const CONTRACT_LP_FARMING = String(process.env.REACT_APP_CONTRACT_LP_FARMING_ADDR).toLowerCase();
const CONTRACT_PAIR_ADDR = String(process.env.REACT_APP_BNB_DEXF_V2_PAIR_ADDR).toLowerCase();

enum VoteActionTypes {
  VOTE_LIST = 'voteList',
  VOTE_DETAIL = 'voteDetail',
  VOTE_CREATE = 'voteCreate',
}

const Main: React.FunctionComponent = () => {
  const history = useHistory();

  const { dexfBnbLp, poolTvl, poolApy, farm, governor } = useWeb3Contracts();
  const { leftPaneOpened } = useLayout();

  const [action, setAction] = React.useState(VoteActionTypes.VOTE_LIST);
  const [totalDexfClaimed, setTotalDexfClaimed] = React.useState(new BigNumber(0));
  const [totalDexfEarned, setTotalDexfEarned] = React.useState(new BigNumber(0));
  const [dexfBnbStaked, setDexfBnbStaked] = React.useState(new BigNumber(0));
  const [currentDexfBnbStaked, setCurrentDexfBnbStaked] = React.useState(new BigNumber(0));
  const [proposalModal, setProposalModal] = React.useState(false);

  const calcVotingPercent = (votes: BigNumber): string => {
    if (governor.quorumVotes && governor.quorumVotes.gt(0) && votes) {
      const percent = votes.times(100).div(governor.quorumVotes.times(5)).dp(2, 0).toNumber();
      return percent.toFixed(2);
    }

    return "0";
  }

  return (
    <div className={s.container}>
      <div className={s.tokensWrapper}>
        <div className={s.tokens}>
          <IconButton
            icon={<StakeIcon1 />}
            iconSelected={<StakeIcon />}
            name="Stake"
            className={s.tokenButton}
            path='/stake'
            small={true}
          />
          <IconButton
            icon={<DashboardIcon1 />}
            iconSelected={<DashboardIcon />}
            name="Your Dashboard"
            className={s.tokenButton}
            path='/dashboard'
            small={true}
          />
          <IconButton
            icon={<VoteIcon1 />}
            iconSelected={<VoteIcon />}
            name="Vote"
            className={s.tokenButton}
            path='/vote'
            small={true}
          />
          {/* <a href="https://dexfprivatesale.org" target="_blank" rel="noreferrer">
            <IconButton
              icon={<VoteIcon1 />}
              iconSelected={<VoteIcon />}
              name="Private Sale"
              className={s.tokenButton}
              small={true}
            />
          </a> */}
        </div>
      </div>
      <div className={s.mainPane}>
        <Switch>
          <Route path="/stake" component={Farm} />
          <Route path="/dashboard" render={(props) =>
            <Dashboard
              setAction={setAction}
              setTotalDexfClaimed={setTotalDexfClaimed}
              setTotalDexfEarned={setTotalDexfEarned}
              setDexfBnbStaked={setDexfBnbStaked}
              setCurrentDexfBnbStaked={setCurrentDexfBnbStaked}
              {...props}
            />}
          />
          <Route path="/vote" render={(props) =>
            <Vote
              action={action}
              setAction={setAction}
              {...props}
            />}
          />
          <Redirect from="/" to="/stake" />
        </Switch>
      </div>
      {
        Boolean(useRouteMatch({path: "/stake"})) &&
        <div className={s.stats}>
          <span className={s.statTitle}>Global Stats</span>
          <StatsDetail name={"Total Value Locked"} value={`$${poolTvl ? poolTvl.toNumber().toFixed(2) : "_"}`} className={s.statsDetail} greenValue />
          <StatsDetail name={"APY"} value={`${poolApy ? poolApy.toNumber().toFixed(2) : "_"}%`} className={s.statsDetail} greenValue />
          <StatsDetail name={"Total DEXF-BNB Locked"} value={formatBigValue(dexfBnbLp.totalLocked, 2)} className={s.statsDetail} />
          {/* <StatsDetail name={"Total Votes Distributed"} value={"3,342.83"} className={s.statsDetail} /> */}
          <StatsDetail name={"Total Rewards Distributed"} value={`${formatBigValue(farm.totalRewardDistributed, 2)} DEXF`} className={s.statsDetail} />
        </div>
      }
      {
        Boolean(useRouteMatch({path: "/dashboard"})) &&
        <div className={s.stats}>
          <span className={s.statTitle}>Your Stats</span>
          <StatsDetail name={"APY"} value={`${poolApy ? poolApy.toNumber().toFixed(2) : "_"}%`} className={s.statsDetail} />
          <StatsDetail name={"DEXF-BNB Staked"} value={formatBigValue(dexfBnbStaked, 2)} className={s.statsDetail} />
          {/* <StatsDetail name={"Votes from Staking"} value={"7.83"} className={s.statsDetail} /> */}
          <StatsDetail name={"Total DEXF Claimed"} value={formatBigValue(totalDexfClaimed, 2)} className={s.statsDetail} />
          <StatsDetail name={"Total DEXF Earned"} value={formatBigValue(totalDexfEarned, 2)} className={s.statsDetail} />
          <div className={s.stakeBtnWrapper}>
            <StatsDetail name={"DEXF-BNB Balance"} value={formatBigValue(currentDexfBnbStaked, 2)} className={s.statsDetail} />
            <span className={s.stakeBtn} onClick={() => {history.push('/stake')}}>STAKE</span>
          </div>
        </div>
      }
      {
        Boolean(useRouteMatch({path: "/vote"})) &&
        <div className={s.stats}>
          <span className={s.statTitle}>Vote Stats</span>
          <StatsDetail name={"Votes Balance"} value={formatBigValue(getHumanValue(farm.votingPower, 20), 2)} className={s.statsDetail} />
          <StatsDetail name={"Votes %"} value={calcVotingPercent(new BigNumber(farm.votingPower ?? 0))} className={s.statsDetail} />
          <div className={s.voteBtn}
            onClick={
              () => {
                if (action !== VoteActionTypes.VOTE_CREATE) {
                  setProposalModal(true)
                }
              }
            }
          >
            CREATE PROPOSAL
          </div>
        </div>
      }
      <div className={cx(s.leftPane, leftPaneOpened && s.displayFlex)} onClick={(e) => { e.stopPropagation() }}>
        <div className={s.logo}>
          <LogoSvg />
          <span className={s.lpStaking}>Staking & Governance</span>
        </div>
        <div className={s.buttons}>
          <IconButton
            icon={<StakeIcon1 />}
            iconSelected={<StakeIcon />}
            name="Stake"
            className={s.tokenButton}
            path='/stake'
          />
          <IconButton
            icon={<DashboardIcon1 />}
            iconSelected={<DashboardIcon />}
            name="Your Dashboard"
            className={s.tokenButton}
            path='/dashboard'
          />
          <IconButton
            icon={<VoteIcon1 />}
            iconSelected={<VoteIcon />}
            name="Vote"
            className={s.tokenButton}
            path='/vote'
          />
          {/* <a href="https://dexfprivatesale.org" target="_blank" rel="noreferrer">
            <IconButton
              icon={<VoteIcon1 />}
              iconSelected={<VoteIcon />}
              name="Private Sale"
              className={s.tokenButton}
            />
          </a> */}
        </div>
        <div className={s.linksWrapper}>
          <ExternalLink href="https://www.dexfolio.org" style={{ marginBottom: "30px" }}><div className={s.link}>Dexfolio.org <LinkIcon /></div></ExternalLink>
          <ExternalLink href={getEtherscanAddressUrl(CONTRACT_LP_FARMING)} style={{ marginBottom: "30px" }}><div className={s.link}>Staking Contract <LinkIcon /></div></ExternalLink>
          <ExternalLink href={getEtherscanAddressUrl(CONTRACT_PAIR_ADDR)}><div className={s.link}>Pair Info <LinkIcon /></div></ExternalLink>
        </div>
      </div>
      {
        proposalModal &&
        <div className={s.infoModalWrapper} onClick={() => { setProposalModal(false) }}>
          <div className={s.infoModal} onClick={(e) => { e.stopPropagation() } }>
            <span className={s.modalTitle}>Create Proposal</span>
            <span className={s.modalDescription}>
              You need to have at least 5% of total distributed votes to create proposals.
            </span>
            {
              Number(calcVotingPercent(new BigNumber(farm.votingPower ?? 0))) > 5 &&
              <div className={s.startBtn} onClick={() => {setProposalModal(false); setAction(VoteActionTypes.VOTE_CREATE)}}>
                <span>START</span>
              </div>
            }
            <div className={s.closeBtn} onClick={() => { setProposalModal(false) }}>
              <XSvg />
            </div>
          </div>
        </div>
      }
    </div>
  );
};

export default Main;
