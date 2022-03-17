import React from 'react';
import { Route, Switch } from 'react-router-dom';
import * as Antd from 'antd';

import Header from 'components/header';
import Warnings from 'components/warnings';
import Main from 'views/main';
import AdminDashboard from 'views/admin';

import s from './styles.module.css';

export type LayoutData = {
  leftPaneOpened: boolean;
};

export type Layout = LayoutData & {
  setLeftPaneOpened(value: boolean): void;
};

const LayoutContext = React.createContext<Layout>({} as any);

export function useLayout(): Layout {
  return React.useContext(LayoutContext);
}

const LayoutView: React.FunctionComponent = () => {
  const [leftPaneOpened, setLeftPaneOpened] = React.useState<boolean>(false);

  const value = {
    leftPaneOpened,
    setLeftPaneOpened
  };

  return (
    <LayoutContext.Provider value={value}>
      <Antd.Layout className={s.container} onClick={() => { if(leftPaneOpened) setLeftPaneOpened(false) }}>
        <Header />
        <Antd.Layout className={s.main}>
          <Warnings>
            <Antd.Layout.Content className={s.content}>
              {/* <Main /> */}
              <Switch>
                <Route path="/admin" component={AdminDashboard} />
                <Route path="/" component={Main} />
                {/* <Redirect from="/" to="/stake" /> */}
              </Switch>
            </Antd.Layout.Content>
          </Warnings>
        </Antd.Layout>
      </Antd.Layout>
    </LayoutContext.Provider>
  );
};

export default LayoutView;
