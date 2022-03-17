import React from 'react';
import * as Antd from "antd";
import moment from "moment";
import BigNumber from "bignumber.js";
import ReactMarkdown from 'react-markdown';
import cx from "classnames";
import { useWallet } from 'wallets/wallet';
import ExternalLink from 'components/externalLink';
import Web3 from 'web3';
import { useWeb3Contracts } from 'web3/contracts';
import { formatBigValue, getHumanValue, getEtherscanAddressUrl, getEtherscanTxUrl, /*getWSRpcUrl,*/ getHttpsRpcUrl } from 'web3/utils';
import { useAsyncEffect } from 'hooks/useAsyncEffect';
import { request, governorApi } from 'api';

import { ReactComponent as ArrowLeftSvg } from 'resources/svg/icons/arrow-left.svg';
import { ReactComponent as ArrowDownSvg } from 'resources/svg/icons/arrow-down.svg';
import { ReactComponent as DotSvg } from 'resources/svg/icons/dot.svg';
import { ReactComponent as GroupSvg } from 'resources/svg/icons/group.svg';
import { ReactComponent as LinkIcon } from 'resources/svg/icons/link.svg';
import { ReactComponent as CircleIcon } from 'resources/svg/icons/circle.svg';
import { ReactComponent as CircleHoverIcon } from 'resources/svg/icons/circle-hover.svg';
import { ReactComponent as CircleForIcon } from 'resources/svg/icons/circle-for.svg';
import { ReactComponent as CircleAgainstIcon } from 'resources/svg/icons/circle-against.svg';
import { ReactComponent as XSvg } from 'resources/svg/icons/x.svg';
import s from './styles.module.css';

// const DEFAULT_CONTRACT_PROVIDER = new Web3.providers.WebsocketProvider(getWSRpcUrl());
const DEFAULT_CONTRACT_PROVIDER = new Web3.providers.HttpProvider(getHttpsRpcUrl());
const web3 = new Web3(DEFAULT_CONTRACT_PROVIDER);

export type StakeProps = {
  setAction: Function,
  voteId: string,
  proposals: any[],
  className: string | boolean,
};


const decodeParameters = (signature: string, calldata: string) => {
  const startPos = signature.indexOf("(") + 1;
  const endPos = signature.indexOf(")");
  if (startPos === endPos) {
    return signature;
  }

  let types: any[] = [];
  let currentPos = startPos;
  while (true) {
    const commaPos = signature.indexOf(",", currentPos);
    if (commaPos === -1) {
      break;
    }
    types.push(signature.substring(currentPos, commaPos));
    currentPos = commaPos + 1;
  }
  types.push(signature.substring(currentPos, endPos));

  try {
    const decodedValue = web3.eth.abi.decodeParameters(types, calldata);
    const result = Object.values(decodedValue);
    let temp = "";
    for (let i = 0; i < result.length - 1; i++) {
      temp += result[i];
      if (i < result.length - 2) {
        temp += ",";
      }
    }

    return signature.substring(0, startPos - 1) + "(" + temp + ")";
  } catch (e) {
    return "";
  }
}

const contractAddresses: any = {
  'Timelock': String(process.env.REACT_APP_CONTRACT_TIMELOCK_ADDR).toLowerCase(),
  'DexfToken': String(process.env.REACT_APP_CONTRACT_DEXF_ADDR).toLowerCase(),
}

const getContractName = (addr: string) => {
  const name = Object.keys(contractAddresses).find((e) => (contractAddresses[e] === addr.toLowerCase()));
  return name;
}


const VoteDetail: React.FunctionComponent<StakeProps> = (props) => {
  const { setAction, voteId, proposals, className } = props;

  const { governor, farm } = useWeb3Contracts();
  const wallet = useWallet();

  const proposal = proposals.find((e) => (e.id === voteId));

  const [forVote, setForVote] = React.useState(new BigNumber(0));
  const [againstVote, setAgainstVote] = React.useState(new BigNumber(0));
  const [depositing, setDepositing] = React.useState(false);
  const [votingStatus, setVotingStatus] = React.useState<any>(undefined);
  const [quorumModal, setQuorumModal] = React.useState(false);
  const [forModal, setForModal] = React.useState(false);
  const [againstModal, setAgainstModal] = React.useState(false);
  const [forVoters, setForVoters] = React.useState<any[]>([]);
  const [againstVoters, setAgainstVoters] = React.useState<any[]>([]);
  const [votingPower, setVotingPower] = React.useState(new BigNumber(0));
  const [totalVotingPower, setTotalVotingPower] = React.useState(new BigNumber(0));

  useAsyncEffect(async () => {
    if (!wallet.account) {
      return;
    }

    if (voteId) {
      try {
        const result = await governor.getReceipt(voteId, wallet.account);
        setVotingStatus(result);
        if (result.hasVoted) {
          setForVote(new BigNumber(0));
          setAgainstVote(new BigNumber(0));
        }
      } catch (err) {
        console.log(err);
      }
    }
  }, [voteId, wallet, governor])

  useAsyncEffect(async () => {
    if (voteId) {
      const option = {
        method: 'GET',
      }
      try {
        let response = await request(governorApi.getVotersByProposalId(voteId) + "?filter=for", option);
        if (response?.data?.result.length > 0) {
          setForVoters(response.data.result.map((e: any) => ({address: e.address, votes: e.votes})));
        }
        response = await request(governorApi.getVotersByProposalId(voteId), option);
        if (response?.data?.result.length > 0) {
          setAgainstVoters(response.data.result.map((e: any) => ({address: e.address, votes: e.votes})));
        }
      } catch (err) {
        console.log(err);
      }
    }
  }, [voteId])

  useAsyncEffect(async () => {
    if (voteId && wallet.account) {
      try {
        const temp = await farm.getPriorMultiplier(proposal?.startTimestamp);
        setVotingPower(new BigNumber(temp[1]));
      } catch (err) {
        console.log(err)
      }
    }
  }, [voteId, wallet])

  useAsyncEffect(async () => {
    if (voteId) {
      try {
        const temp = await farm.getPriorTotalMultiplier(proposal?.startTimestamp);
        setTotalVotingPower(new BigNumber(temp));
      } catch (err) {
        console.log(err)
      }
    }
  }, [voteId])

  const idStyle = (id: string) => {
    if (!id) {
      return "";
    }

    let result = id;
    for (let i = 0; i < 3 - id.length; i++) {
      result = `0${result}`;
    }

    return result;
  }

  const calcVotingPercent = (votes: BigNumber): number => {
    if (totalVotingPower && totalVotingPower.gt(0) && votes) {
      const percent = votes.times(100).div(totalVotingPower).dp(2, 0).toNumber();
      return percent;
    }

    return 0;
  }

  const getTitle = (description: string) => {
    const descriptionSplitor = "!@#$%^&*()";
    let pos = description.indexOf(descriptionSplitor);
    if (pos === -1) {
      return description;
    }

    return description.substring(0, pos);
  }

  const getDescripton = (description: string) => {
    const descriptionSplitor = "!@#$%^&*()";
    let pos = description.indexOf(descriptionSplitor);
    if (pos === -1) {
      return "";
    }

    return description.substring(pos + descriptionSplitor.length);
  }

  const addressStyle = (addr: string) => {
    return addr.substr(0, 15) + "..." + addr.substr(28);
  }

  const getVoteStyle = (proposal: any) => {
    switch (proposal.state) {
      case "Canceled":
        return s.voteStateDefeated;
      case "Pending":
          return s.voteStateActive;
      case "Active":
        if (new BigNumber(proposal.forVotes).gt(new BigNumber(proposal.againstVotes))) {
          return s.voteStateActive;  
        }
        return s.voteStateActive1;
      case "Defeated":
          return s.voteStateDefeated;
      case "Succeeded":
        return s.voteStateExecuted;
      case "Executed":
          return s.voteStateExecuted;
      case "Expired":
        return s.voteStateDefeated;
      case "Queued":
          return s.voteStateExecuted;
      default:
        return s.voteStateDefeated;
    }
  }

  const getEndTimeStyle = (proposal: any) => {
    if (proposal.state === "Active") {
      if (new BigNumber(proposal.forVotes).gt(new BigNumber(proposal.againstVotes))) {
        return s.endTimeActive;
      }
      return s.endTimeActive1;
    }

    return s.endTime;
  }

  const forVoteHandler = () => {
    if (votingStatus && votingStatus.hasVoted) {
      return;
    }
    if (forVote.gt(0)) {
      setForVote(new BigNumber(0));
    } else {
      setForVote(votingPower);
      setAgainstVote(new BigNumber(0));
    }
  }

  const againstVoteHandler = () => {
    if (votingStatus && votingStatus.hasVoted) {
      return;
    }
    if (againstVote.gt(0)) {
      setAgainstVote(new BigNumber(0));
    } else {
      setAgainstVote(new BigNumber(votingPower));
      setForVote(new BigNumber(0));
    }
  }

  const castAvailable = () => {
    if (proposal.state !== "Active") {
      return false;
    }
    if (!votingStatus || (votingStatus && votingStatus.hasVoted === true)) {
      return false;
    }
    if (forVote.gt(0) || againstVote.gt(0)) {
      return true;
    }

    return false;
  }

  const cast = async () => {
    if (!castAvailable()) {
      return;
    }

    setDepositing(true);

    try {
      let support = false;
      if (forVote.gt(0)) {
        support = true;
      }

      await governor.castVote(proposal.id, support);
      governor.reload();

      // setAction("dashboard");
    } catch (e) {
      console.log(e);
    }

    setDepositing(false);
  }

  const votingCircleStyle = () => {
    if (proposal.state !== "Active") {
      return s.votingCircleDisable;
    }
    if (votingStatus && votingStatus.hasVoted) {
      return s.votingCircleDisable;
    }

    return s.votingCircle;
  }

  return (
    <div className={cx(s.card, className)}>
      <div className={s.title} onClick={() => {setAction('voteList')}}>
        <ArrowLeftSvg />
        <span>All Proposals</span>
      </div>
      {
        proposal &&
        <>
          <div style={{marginBottom: "36px"}}>
            <span className={s.description}>
              {getTitle(proposal?.description)}
            </span>
            <div className={s.status}>
              <div className={s.voteId}>
                <span>{idStyle(voteId.toString())}</span>
              </div>
              <div className={getEndTimeStyle(proposal)}>
                <span>{moment.unix(proposal?.endTimestamp).isAfter(moment()) ? "Ends" : "Ended"} {moment.unix(proposal?.endTimestamp).fromNow()}</span>
              </div>
              <div style={{flex: "1", display: "flex", justifyContent: "flex-end"}}>
                <div className={cx(s.voteState, getVoteStyle(proposal))}>
                  <span>{proposal.state}</span>
                </div>
              </div>
            </div>
          </div>
          <div className={s.innerCard}>
            <div className={s.votingDataWrapper}>
              <div className={s.votingData}>
                <div>
                  <span className={s.for}>For</span>
                </div>
                <div className={s.forPercentAndPower}>
                  <div className={s.forPercentWrapper} onClick={() => {setQuorumModal(true)}}>
                    <DotSvg className={s.dotSvg}/>
                    <span className={s.forPercent}>{calcVotingPercent(new BigNumber(proposal?.forVotes))}% / 20%</span>
                    <GroupSvg />
                  </div>
                  <span className={s.votingPower}>{proposal?.forVotes ? formatBigValue(getHumanValue(new BigNumber(proposal?.forVotes), 20), 2) : 0}</span>
                  <div className={s.arrowDownWrapper} onClick={() => {setForModal(true)}}>
                    <ArrowDownSvg />
                  </div>
                </div>
              </div>
              <div className={cx(s.progressbar, s.progressbarCompleted)}>
                <Antd.Progress percent={calcVotingPercent(new BigNumber(proposal?.forVotes))} showInfo={false} />
              </div>
            </div>
            <div className={s.votingDataWrapper}>
              <div className={s.votingData}>
                <div>
                  <span className={s.for}>Against</span>
                </div>
                <div className={s.againstPower}>
                  <span className={s.votingPower}>{proposal?.againstVotes ? formatBigValue(getHumanValue(new BigNumber(proposal?.againstVotes), 20), 2) : 0}</span>
                  <div className={s.arrowDownWrapper} onClick={() => {setAgainstModal(true)}}>
                    <ArrowDownSvg />
                  </div>
                </div>
              </div>
              <div className={s.progressbar}>
                <Antd.Progress percent={calcVotingPercent(new BigNumber(proposal?.againstVotes))} showInfo={false} />
              </div>
            </div>
          </div>
          <div className={s.details}>
            <span>Details</span>
          </div>
          <div className={s.innerCard}>
            {
              proposal?.signatures.map((signature: string, index: any) => (
                <div className={s.executeAction} key={index}>
                  <span style={{marginRight: "12px"}}>{index + 1}</span>
                  <span style={{width: "95%", wordWrap: "break-word"}}>
                    <a href={getEtherscanAddressUrl(proposal.targets[index])} target="_blank" rel="noreferrer">
                      <span className={s.contractName}>{getContractName(proposal.targets[index])}.</span>
                    </a>
                    <span className={s.functionName}>{decodeParameters(signature, proposal.calldatas[index])}</span>
                  </span>
                </div>
              ))
            }
          </div>
          <div className={s.markDown}>
            <ReactMarkdown children={getDescripton(proposal.description)} />
          </div>
          <div className={s.proposer}>
            <div>
              <span>Proposer</span>
            </div>
            <div className={s.proposerAddress}>
              <span>{addressStyle(proposal.proposer)}</span>
              <ExternalLink href={getEtherscanAddressUrl(proposal.proposer)} style={{display: "flex", alignItems: "center"}}><LinkIcon /></ExternalLink>
            </div>
          </div>
          <div className={s.history}>
            <div>
              <span>Proposal History</span>
            </div>
            <div className={s.proposalCreated}>
              <span>Created: {moment.unix(proposal.createdTimestamp).format('MMM DD, YYYY - HH:mmA')}</span>
              <ExternalLink href={getEtherscanTxUrl(proposal.createdTxHash)} style={{display: "flex", alignItems: "center"}}><LinkIcon /></ExternalLink>
            </div>
            <div className={s.proposalActive}>
              <span>Active: {moment.unix(proposal.startTimestamp).format('MMM DD, YYYY - HH:mmA')}</span>
            </div>
            {
              proposal.endTimestamp && proposal.executedTimestamp &&
              <div className={s.proposalActive}>
                <span>Passed: {moment.unix(proposal.endTimestamp).format('MMM DD, YYYY - HH:mmA')}</span>
              </div>
            }
            {
              proposal.cancelTimestamp &&
              <div className={s.proposalActive}>
                <span>Canceled: {moment.unix(proposal.cancelTimestamp).format('MMM DD, YYYY - HH:mmA')}</span>
              </div>
            }
            {
              proposal.queuedTimestamp &&
              <div className={s.proposalCreated}>
                <span>Queued: {moment.unix(proposal.queuedTimestamp).format('MMM DD, YYYY - HH:mmA')}</span>
                <ExternalLink href={getEtherscanTxUrl(proposal.queuedTxHash)} style={{display: "flex", alignItems: "center"}}><LinkIcon /></ExternalLink>
              </div>
            }
            {
              proposal.executedTimestamp &&
              <div className={s.proposalCreated}>
                <span>Executed: {moment.unix(proposal.executedTimestamp).format('MMM DD, YYYY - HH:mmA')}</span>
                <ExternalLink href={getEtherscanTxUrl(proposal.executedTxHash)} style={{display: "flex", alignItems: "center"}}><LinkIcon /></ExternalLink>
              </div>
            }
          </div>
          {
            proposal.state === "Active" &&
            <div>
              <div className={s.vote}>
                <div>
                  <span>Vote</span>
                </div>
                <div className={s.proposalCreated}>
                  <span>You have {formatBigValue(getHumanValue(votingPower, 20), 2)} valid votes for this proposal </span>
                </div>
              </div>
              <div className={s.votingPan}>
                <div onClick={() => {forVoteHandler()}} className={cx(votingCircleStyle(), s.circleWrapper)}>
                  {
                    forVote.gt(0) ?
                    <CircleForIcon className={s.circleNormal} /> :
                    <CircleIcon className={s.circleNormal} />
                  }
                  <CircleHoverIcon className={s.circleHover} />
                </div>
                <div className={s.votingDataWrapper}>
                  <div className={s.votingData}>
                    <div>
                      <span className={s.forSmall}>For</span>
                    </div>
                    <div className={s.forPercentAndPower}>
                      <div className={s.forPercentWrapper} onClick={() => {setQuorumModal(true)}}>
                        <DotSvg className={s.dotSvg}/>
                        <span className={s.forPercent}>{calcVotingPercent(new BigNumber(proposal?.forVotes).plus(forVote))}% / 20%</span>
                        <GroupSvg />
                      </div>
                      <span className={s.votingPower}>{proposal?.forVotes ? formatBigValue(getHumanValue(new BigNumber(proposal?.forVotes).plus(forVote), 20), 2) : 0}</span>
                      <div className={s.arrowDownWrapper} onClick={() => {setForModal(true)}}>
                        <ArrowDownSvg />
                      </div>
                    </div>
                  </div>
                  <div className={cx(s.progressbar, s.progressbarCompleted)}>
                    <Antd.Progress percent={calcVotingPercent(new BigNumber(proposal?.forVotes).plus(forVote))} showInfo={false} />
                  </div>
                </div>
              </div>
              <div className={s.votingPan}>
                <div onClick={() => {againstVoteHandler()}} className={cx(votingCircleStyle(), s.circleWrapper)}>
                  {
                    againstVote.gt(0) ?
                    <CircleAgainstIcon className={s.circleNormal} /> :
                    <CircleIcon className={s.circleNormal} />
                  }
                  <CircleHoverIcon className={s.circleHover} />
                </div>
                <div className={s.votingDataWrapper}>
                  <div className={s.votingData}>
                    <div>
                      <span className={s.forSmall}>Against</span>
                    </div>
                    <div className={s.againstPower}>
                      <span className={s.votingPower}>{proposal?.againstVotes ? formatBigValue(getHumanValue(new BigNumber(proposal?.againstVotes).plus(againstVote), 20), 2) : 0}</span>
                      <div className={s.arrowDownWrapper} onClick={() => {setAgainstModal(true)}}>
                        <ArrowDownSvg />
                      </div>
                    </div>
                  </div>
                  <div className={cx(s.progressbar)}>
                    <Antd.Progress percent={calcVotingPercent(new BigNumber(proposal?.againstVotes).plus(againstVote))} showInfo={false} />
                  </div>
                </div>
              </div>
              <div className={s.btnWrapper}>
                <Antd.Button
                  onClick={() => {cast()}}
                  disabled={!castAvailable()}
                  loading={depositing}
                >
                  Vote
                </Antd.Button>
              </div>
            </div>
          }
        </>
      }
      {
        quorumModal &&
        <div className={s.infoModalWrapper} onClick={() => { setQuorumModal(false) }}>
          <div className={s.infoModal} onClick={(e) => { e.stopPropagation() } }>
            <span className={s.modalTitle}>Quorum</span>
            <span className={s.modalDescription}>
              At least 20% of all distributed votes must vote in favor of the proposal for it to be valid.
            </span>
            <span className={s.modalDescription}>
              The purpose of this quorum is to ensure that the only measures that pass are ones with adequate voter participation.
            </span>
            <div className={s.closeBtn} onClick={() => { setQuorumModal(false) }}>
              <XSvg />
            </div>
          </div>
        </div>
      }
      {
        (forModal || againstModal) &&
        <div className={s.infoModalWrapper} onClick={() => { setForModal(false); setAgainstModal(false) }}>
          <div className={s.infoModal} onClick={(e) => { e.stopPropagation() } }>
            <span className={s.modalTitle}>{forModal ? "For Votes" : "Against Votes"}</span>
            <div className={s.voteModalInner}>
              <div className={s.modalVotingData}>
                <div>
                  <span className={s.forSmall}>{forModal ? "For" : "Against"}</span>
                </div>
                {
                  forModal ?
                  <span className={s.votingPower}>{proposal?.forVotes ? formatBigValue(getHumanValue(new BigNumber(proposal?.forVotes).plus(forVote), 20), 2) : 0}</span> :
                  <span className={s.votingPower}>{proposal?.againstVotes ? formatBigValue(getHumanValue(new BigNumber(proposal?.againstVotes).plus(forVote), 20), 2) : 0}</span>
                }
              </div>
              {
                forModal ?
                <div className={cx(s.progressbar, s.progressbarCompleted)}>
                  <Antd.Progress percent={calcVotingPercent(new BigNumber(proposal?.forVotes))} showInfo={false} />
                </div> :
                <div className={cx(s.progressbar)}>
                  <Antd.Progress percent={calcVotingPercent(new BigNumber(proposal?.againstVotes))} showInfo={false} />
                </div>
              }
              <div className={s.addressesVotes}>
                <span>{forModal ? forVoters.length : againstVoters.length} Addresses</span>
                <span>Votes</span>
              </div>
              {
                forModal && forVoters.map((e: any, index: number) => (
                  <div className={s.voteAddress} key={`vote-detail-for-voters${index}`}>
                    <div style={{display: "flex", alignItems: "center"}}>
                      <span style={{marginRight: "9px"}}>{e.address.substr(0, 4) + "..." + e.address.substr(-4)}</span>
                      <ExternalLink href={getEtherscanAddressUrl(e.address)} style={{display: "flex", alignItems: "center"}}><LinkIcon /></ExternalLink>
                    </div>
                    <span>{formatBigValue(getHumanValue(new BigNumber(e.votes), 20), 2)}</span>
                  </div>
                ))
              }
              {
                againstModal && againstVoters.map((e: any, index: number) => (
                  <div className={s.voteAddress} key={`vote-detail-against-voters${index}`}>
                    <div style={{display: "flex", alignItems: "center"}}>
                      <span style={{marginRight: "9px"}}>{e.address.substr(0, 4) + "..." + e.address.substr(-4)}</span>
                      <ExternalLink href={getEtherscanAddressUrl(e.address)} style={{display: "flex", alignItems: "center"}}><LinkIcon /></ExternalLink>
                    </div>
                    <span>{formatBigValue(getHumanValue(new BigNumber(e.votes), 20), 2)}</span>
                  </div>
                ))
              }
              <div className={s.closeBtn} onClick={() => { setForModal(false); setAgainstModal(false) }}>
                <XSvg />
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  );
};

export default VoteDetail;
