import React from 'react';
import BigNumber from "bignumber.js";
import { TokenMeta } from 'web3/types';
import Stake from "./components/stake";
import LockupLength from "./components/lockUp";
import Review from "./components/review";
import TermsOfUse from "./components/term";
// import Pause from "./components/pause";

import s from './styles.module.css';

enum ActionTypes {
  STAKE = 'stake',
  LOCKUP_LENGTH = 'lockUpLength',
  TERMS_OF_USE = 'termsOfUse',
  REVIEW = 'review'
}

const Farm: React.FunctionComponent = () => {
  const [token, setToken] = React.useState<TokenMeta | string>("BNB");
  const [depositAmount, setDepositAmount] = React.useState<BigNumber>(new BigNumber(0));
  const [action, setAction] = React.useState(ActionTypes.STAKE);
  const [lockupLength, setLockupLength] = React.useState(4);
  const [lpEstimated, setLpEstimated] = React.useState(0);

  return (
    <>
        <Stake
          depositAmount={depositAmount}
          setDepositAmount={setDepositAmount}
          token={token}
          setToken={setToken}
          setAction={setAction}
          className={action !== ActionTypes.STAKE && s.displayNone}
          // className={s.displayNone}
          lpEstimated={lpEstimated}
          setLpEstimated={setLpEstimated}
        />
        <LockupLength
          setAction={setAction}
          className={action !== ActionTypes.LOCKUP_LENGTH && s.displayNone}
          lockupLength={lockupLength}
          setLockupLength={setLockupLength}
          lpEstimated={lpEstimated}
          token={token}
        />
        <TermsOfUse
          setAction={setAction}
          className={action !== ActionTypes.TERMS_OF_USE && s.displayNone}
        />
        <Review
          setAction={setAction}
          className={action !== ActionTypes.REVIEW && s.displayNone}
          depositAmount={depositAmount}
          lockupLength={lockupLength}
          setLockupLength={setLockupLength}
          token={token}
          lpEstimated={lpEstimated}
        />
        {/* <Pause
          setAction={setAction}
          className={action !== ActionTypes.STAKE && s.displayNone}
        /> */}
      </>
  );
};

export default Farm;
