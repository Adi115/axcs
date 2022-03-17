import React from "react";
// import cx from "classnames";
import VoteList from "./components/vote-list";
import VoteDetail from "./components/vote-detail";
import VoteCreate from "./components/vote-create";

import s from "./styles.module.css";

enum ActionTypes {
  VOTE_LIST = "voteList",
  VOTE_DETAIL = "voteDetail",
  VOTE_CREATE = "voteCreate",
}

export type VoteProps = {
  action: string;
  setAction: Function;
};

const Vote: React.FunctionComponent<VoteProps> = (props) => {
  const { action, setAction } = props;
  const [proposals, setProposals] = React.useState<any[]>([]);
  const [voteId, setVoteId] = React.useState("");

  React.useEffect(() => {
    if (voteId === "" && action !== ActionTypes.VOTE_LIST) {
      setAction(ActionTypes.VOTE_LIST);
    }
    /* eslint-disable react-hooks/exhaustive-deps */
  }, []);

  return (
    <>
      <VoteList
        setAction={setAction}
        setVoteId={setVoteId}
        proposals={proposals}
        setProposals={setProposals}
        className={action !== ActionTypes.VOTE_LIST && s.displayNone}
      />
      <VoteDetail
        setAction={setAction}
        voteId={voteId}
        proposals={proposals}
        className={action !== ActionTypes.VOTE_DETAIL && s.displayNone}
      />
      <VoteCreate
        setAction={setAction}
        setVoteId={setVoteId}
        className={action !== ActionTypes.VOTE_CREATE && s.displayNone}
      />
    </>
  );
};

export default Vote;
