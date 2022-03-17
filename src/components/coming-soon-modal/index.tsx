import React from 'react';
import * as Antd from 'antd';
import { ModalProps } from 'antd/lib/modal';

import s from './styles.module.css';

export type ComingSoonModalProps = ModalProps & {};

const ComingSoonModal: React.FunctionComponent<ComingSoonModalProps> = props => {
  const { ...modalProps } = props;

  return (
    <Antd.Modal
      className={s.component}
      centered
      closable={true}
      footer={[]}
      {...modalProps}
    >
      <div className={s.headerLabel}>Coming Soon</div>
      <div className={s.text}>
        Voting is coming soon.
      </div>
      <div className={s.footer}>
        <Antd.Button
          type="ghost"
          className={s.backBtn}
          onClick={props.onCancel}
        >Go Back</Antd.Button>
      </div>
    </Antd.Modal>
  );
};

export default ComingSoonModal;
