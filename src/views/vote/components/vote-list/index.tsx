import React from 'react';
import moment from "moment";
import BigNumber from "bignumber.js";
import cx from "classnames";

import { useAsyncEffect } from 'hooks/useAsyncEffect';

import { request, governorApi } from 'api';

import s from './styles.module.css';

const descriptionSplitor = "!@#$%^&*()";

export type StakeProps = {
  setAction: Function,
  setVoteId: Function,
  proposals: any[],
  setProposals: Function,
  className: string | boolean,
};

const VoteList: React.FunctionComponent<StakeProps> = (props) => {
  const { setAction, setVoteId, proposals, setProposals, className } = props;

  const [timerID, setTimerID] = React.useState<any>(undefined);

  // useAsyncEffect(async () => {
  //   try {
  //     const option = {
  //       method: 'GET',
  //     }
  //     const response = await request(governorApi.getAllProposals, option);
  //     if (response?.data?.total > 0) {
  //       setProposals(response.data.result);
  //     }
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }, [])

  const fetchData = async() => {
    try {
      const option = {
        method: 'GET',
      }
      const response = await request(governorApi.getAllProposals, option);
      if (response?.data?.total > 0) {
        setProposals(response.data.result);
      }
    } catch (e) {
      console.log(e);
    }
  }

  useAsyncEffect(async () => {
    if (timerID > 0) clearInterval(timerID);

    const tempTimerID = setInterval(async () => {
      fetchData();
    }, 10000);

    setTimerID(tempTimerID);
    fetchData();
  }, []);

  const cardClickHandler = (voteId: string) => {
    setVoteId(voteId);
    setAction("voteDetail");
    window.scrollTo(0, 0);
  }

  const idStyle = (id: string) => {
    let result = id;
    for (let i = 0; i < 3 - id.length; i++) {
      result = `0${result}`;
    }

    return result;
  }

  const getTitle = (description: string) => {
    let pos = description.indexOf(descriptionSplitor);
    if (pos === -1) {
      return description;
    }

    return description.substring(0, pos);
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

  const getBorderStyle = (proposal: any) => {
    switch (proposal.state) {
      case "Canceled":
        return undefined;
      case "Pending":
          return undefined;
      case "Active":
        if (new BigNumber(proposal.forVotes).gt(new BigNumber(proposal.againstVotes))) {
          return s.activeStateBorder;
        }
        return s.activeStateBorder1;
      case "Defeated":
          return undefined;
      case "Succeeded":
        return undefined;
      case "Executed":
          return undefined;
      case "Expired":
        return undefined;
      case "Queued":
          return undefined;
      default:
        return undefined;
    }
  }

  return (
    <>
      {
        proposals.map((proposal: any, index: any) => (
          <div className={cx(s.card, className, getBorderStyle(proposal))} onClick={() => cardClickHandler(proposal.id)} key={index}>
            <div>
              <span className={s.description}>
                {getTitle(proposal.description)}
              </span>
              <div className={s.status}>
                <div className={s.voteId}>
                  <span>{idStyle(proposal.id.toString())}</span>
                </div>
                <div className={getEndTimeStyle(proposal)}>
                  <span>{moment.unix(proposal?.endTimestamp).isAfter(moment()) ? "Ends" : "Ended"} {moment.unix(proposal.endTimestamp).fromNow()}</span>
                </div>
                <div style={{flex: "1", display: "flex", justifyContent: "flex-end"}}>
                  <div className={cx(s.voteState, getVoteStyle(proposal))}>
                    <span>{proposal.state}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))
      }
    </>
  );
};

export default VoteList;
