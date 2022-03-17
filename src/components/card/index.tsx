import React from 'react';
import cx from 'classnames';

import s from './styles.module.css';

export type CardProps = {
  className?: string;
};

const CardWidget: React.FunctionComponent<CardProps> = props => {
  return (
    <div className={cx(s.component, props.className)}>
      {props.children}
    </div>
  );
};

export default CardWidget;
