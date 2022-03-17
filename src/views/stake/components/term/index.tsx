import React from 'react';
import * as Antd from "antd";
import cx from "classnames";
import { ReactComponent as ArrowLeftSvg } from 'resources/svg/icons/arrow-left.svg';

import s from './styles.module.css';

export type TermsOfUseProps = {
  setAction: Function,
  className: string | boolean,
};

const TermsOfUse: React.FunctionComponent<TermsOfUseProps> = (props) => {
  const { setAction, className } = props;

  return (
    <div className={cx(s.card, className)}>
      <div className={s.title} onClick={() => {setAction('lockUpLength')}}>
        <ArrowLeftSvg />
        <span>Terms of Use</span>
      </div>
      <div className={s.version}>
        <span>
          Version 1.0
        </span>
      </div>
      <div className={s.terms}>
        <span>
          The software is provided “as is” without any express or implied warranty of any kind including warranties of merchantability or fitness for any particular purpose. In no event shall Dexfolio LLC or its suppliers be liable for any damages whatsoever (including, without limitation, damages for loss of profits, smart contract vulnerability, malicious actors, business interruption, loss of information) arising out of the use of or inability to use the software, even if Dexfolio LLC has been advised of the possibility of such damages.
        </span>
      </div>
      <div className={s.btnWrapper}>
        <Antd.Button
          onClick={() => {setAction('review')}}
        >
          I ACCEPT THE TERMS OF USE
        </Antd.Button>
      </div>
    </div>
  );
};

export default TermsOfUse;
