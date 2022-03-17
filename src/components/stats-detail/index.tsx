import React from 'react';
import cx from 'classnames';

import s from './styles.module.css';

export type StatsDetailProps = {
  name: string;
  value: string;
  className?: string;
  greenValue?: boolean;
};

const StatsDetail: React.FunctionComponent<StatsDetailProps> = props => {
  const { greenValue } = props;
  return (
    <div className={cx(s.component, props.className)}>
      {
        greenValue ?
        <span className={s.greenValue}>{props.value}</span> :
        <span className={s.value}>{props.value}</span>  
      }
      <span className={s.name}>{props.name}</span>
    </div>
  );
};

export default StatsDetail;
