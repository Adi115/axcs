import React from "react";
import * as Antd from "antd";

import { useWallet } from 'wallets/wallet';

import s from "./styles.module.css";

export type LinkModalProps = {
  visible: boolean,
  setShowLinkModal: Function,
};

const LinkModal: React.FunctionComponent<LinkModalProps> = (props) => {
  const wallet = useWallet();

  const { visible, setShowLinkModal } = props;
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = (str: string) => {
    const el = document.createElement('textarea');
    el.value = str;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    setCopied(true);
  };

  return (
    <Antd.Modal
      centered
      closeIcon={null}
      footer={null}
      visible={visible}
      wrapClassName={s.createLinkModal}
      onOk={() => setShowLinkModal(false)}
      onCancel={() => { setShowLinkModal(false); setCopied(false); }}
      width={530}
    >
      <div className={s.linkModalWrapper}>
        <b className={s.linkModalTitle}>Your Referral Link</b>
        <div className={s.linkModaldescription}>
          <span>Stakes opened through this link will generate rewards for staker and referrer.
          To participate you must have CM referrer or Super referrer status by
            referring total of 50 ETH or 150 ETH equivalent in SWAPP stakes.</span>
          <br />
          <span>Note: referrer rewards are only generated for stakes with minimum duration of 365 days.</span>
        </div>
        <div className={s.linkUrl}>
          http://swappfi-newdesign.s3-website-us-east-1.amazonaws.com/?w={wallet.account && wallet.account.substr(0, 20)}<br/>
          {wallet.account && wallet.account.substr(20)}
        </div>
        <div className={s.copyBtnWrapper}>
          {
            copied ?
              <Antd.Button
                className={s.copyBtn}
                onClick={() => { copyToClipboard(`http://swappfi-newdesign.s3-website-us-east-1.amazonaws.com/?w=${wallet.account}`) }}
              >
                Copied
            </Antd.Button> :
              <Antd.Button
                className={s.copyBtn}
                onClick={() => { copyToClipboard(`http://swappfi-newdesign.s3-website-us-east-1.amazonaws.com/?w=${wallet.account}`) }}
              >
                Copy referral link
            </Antd.Button>
          }
        </div>
      </div>
    </Antd.Modal>
  );
};

export default LinkModal;
