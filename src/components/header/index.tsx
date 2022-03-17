import React from "react";
// import cx from 'classnames';
// import { Menu, Dropdown } from "antd";

// import ExternalLink from 'components/externalLink';
import ConnectedWallet from "components/connected-wallet";
import { useLayout } from "views/layout";

import { ReactComponent as LogoSvg } from "resources/svg/logo.svg";
import { ReactComponent as UnionSvg } from "resources/svg/icons/union.svg";

import s from "./styles.module.css";

// const links = [
//   (<ExternalLink href="https://bscscan.com/" style={{ marginRight: "30px" }}>Dexfolio.org</ExternalLink>),
//   (<ExternalLink href="https://bscscan.com/" style={{ marginRight: "30px" }}>Staking Contract</ExternalLink>),
//   (<ExternalLink href="https://bscscan.com/">Pair Info</ExternalLink>),
// ]

const Header: React.FunctionComponent = (props) => {
  const { leftPaneOpened, setLeftPaneOpened } = useLayout();

  // const menu = (
  //   <Menu className={s.menu}>
  //     {links?.map((item, index) => (
  //       <Menu.Item key={index}>
  //         {item}
  //       </Menu.Item>
  //     ))}
  //   </Menu>
  // );

  return (
    <div className={s.component}>
      <div className={s.logo}>
        <LogoSvg />
        <span className={s.lpStaking}>LP Staking</span>
      </div>
      <div className={s.links}>
        {/* <div className={s.linkBar}>
          {links?.map((item, index) => (
            item
          ))}
        </div> */}
        <ConnectedWallet />
        <UnionSvg
          onClick={(e) => {
            e.stopPropagation();
            setLeftPaneOpened(!leftPaneOpened);
          }}
        />
        {/* <Dropdown overlay={menu} trigger={["click"]} className={s.dropDown} placement="bottomRight">
          <UnionSvg />
        </Dropdown> */}
      </div>
    </div>
  );
};

export default Header;
