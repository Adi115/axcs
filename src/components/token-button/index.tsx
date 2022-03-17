import React from 'react';
import cx from 'classnames';

import { TokenMeta } from 'web3/types';
import { ReactComponent as CheckSvg } from 'resources/svg/icons/check.svg';
import { ReactComponent as ETHIcon } from 'resources/svg/tokens/eth.svg';

import s from './styles.module.css';

export type TokenButtonProps = {
  tokenMeta?: TokenMeta;
  selected?: boolean;
  className?: string;
  clickHandler?: Function;
};

const TokenButton: React.FunctionComponent<TokenButtonProps> = props => {
  const { tokenMeta, selected, clickHandler } = props;

  return (
    <div className={cx(s.component, props.className, selected && s.selected)} onClick={() => {clickHandler && clickHandler();}}>
      {tokenMeta ? tokenMeta.icon : <ETHIcon />}
      <span>{tokenMeta ? tokenMeta.name : "ETH"}</span>
      <div className={s.checkWrapper}>
        <CheckSvg className={s.checkSvg}/>
      </div>
    </div>
  );
};

export default TokenButton;
