import React from 'react';
import * as Antd from "antd";
import BigNumber from "bignumber.js";
import { Menu, Dropdown } from "antd";
import cx from "classnames";
import Web3 from 'web3';
import { TokenMeta } from 'web3/types';
import { DexfBnbLpTokenMeta } from 'web3/contracts/dexf-bnb-lp';
import { ETHTokenMeta } from 'web3/contracts/eth';
import { DEXFTokenMeta } from 'web3/contracts/dexf';
import { BUSDTokenMeta } from 'web3/contracts/busd';
import { useWeb3Contracts } from 'web3/contracts';
import { useWallet } from 'wallets/wallet'
import { useAsyncEffect } from 'hooks/useAsyncEffect';
import { formatBigValue, getHumanValue, getExponentValue, /*getWSRpcUrl,*/ getHttpsRpcUrl } from 'web3/utils';

import { ReactComponent as BNBSvg } from 'resources/svg/tokens/bnb.svg';
import { ReactComponent as ArrowDonwSvg } from 'resources/svg/icons/arrow-down.svg';
import { ReactComponent as ArrowDonw1Svg } from 'resources/svg/icons/arrow-down1.svg';
import { ReactComponent as InfoSvg } from 'resources/svg/icons/info.svg';
import s from './styles.module.css';

// const DEFAULT_CONTRACT_PROVIDER = new Web3.providers.WebsocketProvider(getWSRpcUrl());
const DEFAULT_CONTRACT_PROVIDER = new Web3.providers.HttpProvider(getHttpsRpcUrl());
const web3 = new Web3(DEFAULT_CONTRACT_PROVIDER);

const tokenArr = [
  DexfBnbLpTokenMeta,
  "BNB",
  // DEXFTokenMeta,
  BUSDTokenMeta,
  ETHTokenMeta,
]

export type StakeProps = {
  depositAmount: BigNumber,
  setDepositAmount: Function,
  token: TokenMeta | string,
  setToken: Function,
  setAction: Function,
  className: string | boolean,
  lpEstimated: number,
  setLpEstimated: Function,
};

const Stake: React.FunctionComponent<StakeProps> = (props) => {
  const { depositAmount, setDepositAmount, token, setToken, setAction, className, lpEstimated, setLpEstimated } = props;

  const { dexf, eth, dexfBnbLp, busd, router, farm } = useWeb3Contracts();

  const wallet = useWallet();

  const [ethBalance, setEthBalance] = React.useState<BigNumber | undefined>(new BigNumber(0));
  const [dAmount, setDAmount] = React.useState("0");

  useAsyncEffect(async () => {
    if (wallet.account) {
      try {
        const balance = getHumanValue(new BigNumber(await web3.eth.getBalance(wallet.account)), 18);
        setEthBalance(balance);
      } catch (err) {
        console.log(err);
      }
    }
  }, [wallet, farm])

  const balance = () => {
    switch (token) {
      case DexfBnbLpTokenMeta:
        return dexfBnbLp.balance;
      case ETHTokenMeta:
        return eth.balance;
      case DEXFTokenMeta:
        return dexf.balance;
      case BUSDTokenMeta:
        return busd.balance;
      case "BNB":
        return ethBalance;
      default:
        return new BigNumber(0);
    }
  }

  const max = () => {
    switch (token) {
      case DexfBnbLpTokenMeta:
        setDAmount(dexfBnbLp.balance? dexfBnbLp.balance.toString(10) : "0");
        setDepositAmount(dexfBnbLp.balance || new BigNumber(0));
        break;
      case ETHTokenMeta:
        setDAmount(eth.balance? eth.balance.toString(10) : "0");
        setDepositAmount(eth.balance || new BigNumber(0));
        break;
      case DEXFTokenMeta:
        setDAmount(dexf.balance? dexf.balance.toString(10) : "0");
        setDepositAmount(dexf.balance || new BigNumber(0));
        break;
      case BUSDTokenMeta:
        setDAmount(busd.balance? busd.balance.toString(10) : "0");
        setDepositAmount(busd.balance || new BigNumber(0));
        break;
      case "BNB":
        setDAmount(ethBalance? ethBalance.toString(10) : "0");
        setDepositAmount(ethBalance || new BigNumber(0));
        break;
    }
  }

  useAsyncEffect(async () => {
    onDepositAmountChanged(depositAmount);
  }, [depositAmount, token])

  const onDepositAmountChanged = async (value: BigNumber) => {
    if (value === undefined) {
      value = new BigNumber(0);
    }

    setDepositAmount(value);
    if ((token as TokenMeta).name === "DEXF-BNB LP") {
      setLpEstimated(value);
    } else if ((token as TokenMeta).name === "DEXF") {
      try {
        const [reserves, totalSupply] = await Promise.all([dexfBnbLp.getReserves(), dexfBnbLp.totalSupply()]);
        let reserveAmount = reserves[0];
        const estimated =
          value.div(2).times(getExponentValue(18)).dividedBy(reserveAmount).times(totalSupply);
        const humanValue = getHumanValue(estimated, 18);
        if (humanValue) {
          setLpEstimated(parseFloat(humanValue.toString()));
        }
      } catch (e) {
        console.log(e);
      }
    } else if (token === "BNB") {
      try {
        const [reserves, totalSupply] = await Promise.all([dexfBnbLp.getReserves(), dexfBnbLp.totalSupply()]);
        let reserveAmount = reserves[1];
        const estimated =
          value.div(2).times(getExponentValue(18)).dividedBy(reserveAmount).times(totalSupply);
        const humanValue = getHumanValue(estimated, 18);
        if (humanValue) {
          setLpEstimated(parseFloat(humanValue.toString()));
        }
      } catch (e) {
        console.log(e);
      }
    } else {
      try {
        const WETH = router.WETH;
        if (WETH) {
          const amountIn = new BigNumber(value).times(getExponentValue((token as TokenMeta).decimals));
          const [reserves, totalSupply, estimatedWethAmounts] = await Promise.all([
            dexfBnbLp.getReserves(),
            dexfBnbLp.totalSupply(),
            router.getAmountsOut(amountIn, [(token as TokenMeta).address, WETH])
          ]);
          let reserveAmount = reserves[1];
          const estimated =
            estimatedWethAmounts[1].div(2).div(reserveAmount).times(totalSupply);
          const humanValue = getHumanValue(estimated, 18);
          if (humanValue) {
            setLpEstimated(parseFloat(humanValue.toString()));
          }
        }
      } catch (e) {
        console.log(e);
      }
    }
  }

  const menu = (
    <Menu>
      {tokenArr?.map((item, index) => (
        <Menu.Item key={index} onClick={() => { setToken(item) }}>
          { (item as TokenMeta).name && (item as TokenMeta).name}
          { item === "BNB" && "BNB"}
        </Menu.Item>
      ))}
    </Menu>
  );

  return (
    <div className={cx(s.card, className)}>
      <div>
        <span className={s.stakeDescription1}>
          Stake DEXF-BNB LP to receive daily DEXF rewards and votes for governance.
        </span>
        <div className={s.stakeDescription2}>
          <span>
            Click the dropdown to deposit a different token.
          </span>
        </div>
      </div>
      <div className={s.deposit}>
        <div className={s.depositTop}>
          <span>Deposit</span>
          <span>Balance: {formatBigValue(balance(), 2)}</span>
        </div>
        <div className={s.depositBottom}>
          <input
            type="number"
            value={dAmount}
            // onChange={(e) => onDepositAmountChanged(parseFloat(e.target.value))}
            onChange={(e) => { setDepositAmount(new BigNumber(e.target.value)); setDAmount(e.target.value); }}
          >
          </input>
          <div className={s.token}>
            <div className={s.maxBtn} onClick={() => max()}>
              MAX
            </div>
            <Dropdown overlay={menu} trigger={["click"]} className={s.dropDown}>
              <div className={s.selectedToken}>
                {
                  (token as TokenMeta).icon &&
                  (token as TokenMeta).icon
                }
                {
                  token === "BNB" &&
                  <BNBSvg />
                }
                <span className={s.tokenName}>
                  {
                    (token as TokenMeta).name &&
                    (token as TokenMeta).name
                  }
                  {
                    token === "BNB" &&
                    "BNB"
                  }
                </span>
                <ArrowDonwSvg />
              </div>
            </Dropdown>
          </div>
        </div>
      </div>
      <div className={s.arrowWrapper}>
        <ArrowDonw1Svg />
      </div>
      <div className={s.estimated}>
        <div className={s.estimatedTop}>
          {
            (token as TokenMeta).name === "DEXF-BNB LP" ?
            <span>LP Staked</span> :
            <span>LP Staked (estimated)</span>
          }
        </div>
        <div className={s.estimatedBottom}>
          <input
            type="number"
            value={lpEstimated.toFixed(4)}
            // onChange={(e) => setLpEstimated(parseFloat(e.target.value))}
            onChange={() => {}}
          >
          </input>
          <div className={s.token}>
            <div className={s.selectedToken}>
              <span>DEXF-BNB LP</span>
            </div>
          </div>
        </div>
      </div>
      {
        (token as TokenMeta).name !== "DEXF-BNB LP" &&
        <div className={s.info}>
          <InfoSvg />
          <span>The {(token as TokenMeta).name ? (token as TokenMeta).name : token} you deposit will be used to purchase and stake DEXF-BNB LP</span>
        </div>
      }
      <div className={s.btnWrapper}>
        <Antd.Button
          onClick={() => {setAction('lockUpLength')}}
          disabled={depositAmount.lte(0) || depositAmount.gt(balance() || new BigNumber(0)) ? true : false}
        >
          Continue to Lockup Length
        </Antd.Button>
      </div>
    </div>
  );
};

export default Stake;
