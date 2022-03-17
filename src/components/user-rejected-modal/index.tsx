import React from 'react';
import * as Antd from 'antd';
import { ModalProps } from 'antd/lib/modal';

import s from './styles.module.css';

export type UserRejectedModalProps = ModalProps & {};

const UserRejectedModal: React.FunctionComponent<UserRejectedModalProps> = props => {
  const { ...modalProps } = props;

  return (
    <Antd.Modal
      className={s.component}
      centered
      footer={[]}
      {...modalProps}
      zIndex={1001}
    >
      <div className={s.headerLabel}>Error</div>
      <div className={s.text}>Transaction rejected</div>
      <div className={s.btnWrapper}>
        <Antd.Button
          type="primary"
          className={s.dismissBtn}
          onClick={props.onCancel}
        >Dismiss</Antd.Button>
      </div>
    </Antd.Modal>
  );
};

export default UserRejectedModal;
