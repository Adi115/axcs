import React from 'react';
import * as Antd from 'antd';
import { ModalProps } from 'antd/lib/modal';

import { WalletConnector } from 'wallets/types';
import { useWallet, WalletConnectors } from 'wallets/wallet';

import LedgerDerivationPathModal from 'components/ledger-deriviation-path-modal';

import s from './styles.module.css';

export type ConnectWalletModalProps = ModalProps & {};

const ConnectWalletModal: React.FunctionComponent<ConnectWalletModalProps> = props => {
  const { ...modalProps } = props;

  const wallet = useWallet();

  const [ledgerModal, setLedgerModal] = React.useState<boolean>(false);

  function handleConnectorSelect(connector: WalletConnector) {
    if (wallet.isActive) {
      return;
    }

    if (connector.id === 'ledger') {
      return setLedgerModal(true);
    }

    return wallet.connect(connector);
  }

  return (
    <>
      <Antd.Modal
        className={s.component}
        centered
        closable
        footer={[]}
        {...modalProps}
      >
        <div className={s.headerLabel}>Connect Wallet</div>
        <div className={s.headerNote}>Please select chosen type of wallet</div>
        <div className={s.connectorList}>
          {WalletConnectors.map(connector => (
            <Antd.Button
              key={connector.id}
              type="ghost"
              className={s.connectorBtn}
              onClick={() => handleConnectorSelect(connector)}
            >
              <img src={connector.logo} alt={connector.name} className={s.connectorLogo} />
              <span className={s.connectorName}>{connector.name}</span>
            </Antd.Button>
          ))}
        </div>
      </Antd.Modal>
      <LedgerDerivationPathModal
        visible={ledgerModal}
        onCancel={() => setLedgerModal(false)} />
    </>
  );
};

export default ConnectWalletModal;
