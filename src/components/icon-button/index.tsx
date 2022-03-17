import React, { ReactNode } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';
import cx from 'classnames';

import s from './styles.module.css';

export type IconButtonProps = {
  icon?: ReactNode;
  iconSelected?: ReactNode;
  name?: string;
  path?: string;
  className?: string;
  clickHandler?: Function;
  small?: boolean;
};

const IconButton: React.FunctionComponent<IconButtonProps> = props => {
  const history = useHistory();

  const { icon, iconSelected, name, path, clickHandler, small } = props;

  const isActivePath = Boolean(useRouteMatch({
    path: path,
    exact: path === '/',
  }));

  function handleSiderBtnClick() {
    if (path) {
      history.push(path);
    }
    clickHandler?.();
  }

  return (
    <div className={cx(small && s.small)}>
      <div className={cx(s.component, props.className, isActivePath && s.selected)} onClick={() => { handleSiderBtnClick(); }}>
        {icon && !isActivePath && icon}
        {iconSelected && isActivePath && iconSelected}
        <span>{name ? name : ""}</span>
      </div>
    </div>
  );
};

export default IconButton;
