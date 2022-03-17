import React from 'react';
import cx from "classnames";

import s from './styles.module.css';

export type PauseProps = {
  setAction: Function,
  className: string | boolean,
};

const Pause: React.FunctionComponent<PauseProps> = (props) => {
  const { className } = props;

  return (
    <div className={cx(s.card, className)}>
      <div className={s.title}>
        <p>Staking paused</p>
        <p>
          If you staked any tokens, unstake immediately:
        </p>
      </div>
      <div className={s.terms}>
        <p>
          We found a bug in the staking contract. Don’t worry the bug hasn’t occurred yet.
        </p>
        <p>
          To ensure the safety of your funds, you MUST unstake your tokens immediately.
        </p>
        <p>
          Earned rewards will be allocated appropriately.
        </p>
        <p>
          Go to this <a href="https://l.linklyhq.com/l/aF6p" target="_blank" rel="noreferrer" style={{ textDecoration: "underline", fontWeight: "bold" }}>medium post</a> for step by step instructions to unstake using the emergencyWithdraw function.
        </p>
      </div>
    </div>
  );
};

export default Pause;
