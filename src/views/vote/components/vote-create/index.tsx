import React from "react";
import * as Antd from "antd";
import ReactMarkdown from "react-markdown";
import cx from "classnames";
import { useWeb3Contracts } from "web3/contracts";
import Web3 from "web3";
import { /*getWSRpcUrl,*/ getHttpsRpcUrl } from "web3/utils";

import { ReactComponent as ArrowLeftSvg } from "resources/svg/icons/arrow-left.svg";
import { ReactComponent as XSvg } from "resources/svg/icons/x.svg";
import { ReactComponent as ArrowUpSvg } from "resources/svg/icons/arrow-up.svg";
import { ReactComponent as ArrowDonwSvg } from "resources/svg/icons/arrow-down.svg";
import { ReactComponent as ArrowDonwGreySvg } from "resources/svg/icons/arrow-down-grey.svg";
import { ReactComponent as CheckedSvg } from "resources/svg/icons/checked.svg";
import { ReactComponent as UncheckedSvg } from "resources/svg/icons/unchecked.svg";
import s from "./styles.module.css";

// const DEFAULT_CONTRACT_PROVIDER = new Web3.providers.WebsocketProvider(getWSRpcUrl());
const DEFAULT_CONTRACT_PROVIDER = new Web3.providers.HttpProvider(getHttpsRpcUrl());
const web3 = new Web3(DEFAULT_CONTRACT_PROVIDER);

const contracts = ["Timelock", "DexfToken"];

const contractAddresses: any = {
  Timelock: String(process.env.REACT_APP_CONTRACT_TIMELOCK_ADDR).toLowerCase(),
  DexfToken: String(process.env.REACT_APP_CONTRACT_DEXF_ADDR).toLowerCase(),
};

const functions: any = {
  Timelock: {
    setDelay: {
      signature: "setDelay(uint256)",
      params: ["delay_ (uint256)"],
      paramTypes: ["uint256"],
    },
    setPendingAdmin: {
      signature: "setPendingAdmin(address)",
      params: ["pendingAdmin_ (address)"],
      paramTypes: ["address"],
    },
  },
  DexfToken: {
    changeAllocation: {
      signature: "changeAllocation(uint256,uint8,uint8)",
      params: ["amount (uint256)", "from (uint8)", "to (uint8)"],
      paramTypes: ["uint256", "uint8", "uint8"],
    },
    pause: {
      signature: "pause()",
      params: [],
      paramTypes: [],
    },
    setDailyReleasePercentStaking: {
      signature: "setDailyReleasePercentStaking(uint256)",
      params: ["percent (uint256)"],
      paramTypes: ["uint256"],
    },
    renounceOwnership: {
      signature: "renounceOwnership()",
      params: [],
      paramTypes: [],
    },
    transferOwnership: {
      signature: "transferOwnership(address)",
      params: ["newOwner (address)"],
      paramTypes: ["address"],
    },
    setDailyReleaseAmountTreasury: {
      signature: "setDailyReleaseAmountTreasury(uint256)",
      params: ["dailyReleaseAmount (uint256)"],
      paramTypes: ["uint256"],
    },
    setStakingRewardRemaining: {
      signature: "setStakingRewardRemaining(uint256)",
      params: ["remainingAmount (uint256)"],
      paramTypes: ["uint256"],
    },
    setTreasury1: {
      signature: "setTreasury1(address)",
      params: ["newAddress (address)"],
      paramTypes: ["address"],
    },
    unpause: {
      signature: "unpause()",
      params: [],
      paramTypes: [],
    },
    addToBlacklist: {
      signature: "addToBlacklist(address)",
      params: ["account (address)"],
      paramTypes: ["address"],
    },
    removeFromBlacklist: {
      signature: "removeFromBlacklist(address)",
      params: ["account (address)"],
      paramTypes: ["address"],
    },
    updateBuyLimit: {
      signature: "updateBuyLimit(uint256)",
      params: ["limit (uint256)"],
      paramTypes: ["uint256"],
    },
    updateSellLimit: {
      signature: "updateSellLimit(uint256)",
      params: ["limit (uint256)"],
      paramTypes: ["uint256"],
    },
    setTaxFee: {
      signature: "setTaxFee(uint256)",
      params: ["fee (uint256)"],
      paramTypes: ["uint256"],
    },
  },
};

const descriptionSplitor = "!@#$%^&*()";

const encodeParameters = (types: any[], values: any[]) => {
  try {
    return web3.eth.abi.encodeParameters(types, values);
  } catch (e) {
    return "";
  }
};

export type StakeProps = {
  setAction: Function;
  setVoteId: Function;
  className: string | boolean;
};

const VoteCreate: React.FunctionComponent<StakeProps> = (props) => {
  const { setAction, className } = props;

  const { governor } = useWeb3Contracts();

  const [addModal, setAddModal] = React.useState(false);
  const [contractOpen, setContractOpen] = React.useState(false);
  const [functionOpen, setFunctionOpen] = React.useState(false);
  const [contractName, setContractName] = React.useState("");
  const [functionName, setFunctionName] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [editing, setEditing] = React.useState(false);
  const [actions, setActions] = React.useState<any[]>([]);
  const [actionIndex, setActionIndex] = React.useState(0);
  const [params, setParams] = React.useState<string[]>([]);
  const [data, setData] = React.useState("0x");
  const [depositing, setDepositing] = React.useState(false);

  const guide = `Enter why people should vote for your proposal.
# Start a line with a hashtag to make a heading
Surround text in asterisks to **bold** it
Create a hyperlink like this:
[surround text in brackets](surround url in parenthases)
`;

  const editArea = React.useRef<any>(null);

  React.useEffect(() => {
    if (contractName !== "" && functionName !== "" && actionIndex === actions.length) {
      const functionParams = functions[contractName][functionName].params;
      let temp = [];
      for (let i = 0; i < functionParams.length; i++) {
        temp.push("");
      }
      setParams(temp);
    } else if (actionIndex === actions.length) {
      setParams([]);
    }
    /* eslint-disable react-hooks/exhaustive-deps */
  }, [contractName, functionName]);

  const paramChangeHandler = (value: string, index: number) => {
    let temp = [...params];
    temp[index] = value;
    setParams(temp);
    setData(encodeParameters(functions[contractName][functionName].paramTypes, temp));
  };

  const actionSaveAvailable = () => {
    let temp = false;
    if (contractName !== "" && functionName !== "") {
      temp = true;
      for (let i = 0; i < params.length; i++) {
        if (params[i].length === 0) {
          temp = false;
          break;
        }
      }
      if (params.length > 0 && data === "") {
        temp = false;
      }
    }

    return temp;
  };

  const initContractData = () => {
    setContractName("");
    setFunctionName("");
    setParams([]);
    setData("0x");
  };

  const saveAction = () => {
    if (!actionSaveAvailable) {
      return;
    }

    const action = {
      contract: contractName,
      function: functionName,
      params: params,
      data: data,
      signature: functions[contractName][functionName].signature,
    };

    let temp = [...actions];
    if (actionIndex >= temp.length) {
      temp.push(action);
    } else {
      temp[actionIndex] = action;
    }

    setActions(temp);
    setAddModal(false);
    initContractData();
  };

  const publishAvaliable = () => {
    if (title.length > 0 && actions.length > 0 && description.length > 0) {
      return true;
    }

    return false;
  };

  const publish = async () => {
    if (!publishAvaliable()) {
      return;
    }

    let targets: string[] = [];
    let values: string[] = [];
    let signatures: string[] = [];
    let calldatas: string[] = [];
    let str = `${title}${descriptionSplitor}${description}`;

    actions.forEach((action) => {
      targets.push(contractAddresses[action.contract]);
      values.push("0");
      signatures.push(action.signature);
      calldatas.push(action.data);
    });

    setDepositing(true);

    try {
      await governor.propose(targets, values, signatures, calldatas, str);
      governor.reload();

      // setAction("dashboard");
    } catch (e) {
      console.log(e);
    }

    setDepositing(false);
  };

  const makeParam = (arr: any[]) => {
    let result = "";
    for (let i = 0; i < arr.length; i++) {
      result += arr[i];
      if (i !== arr.length - 1) {
        result += ",";
      }
    }

    return result;
  };

  return (
    <>
      <div className={cx(s.card, className)}>
        <div
          className={s.title}
          onClick={() => {
            setAction("voteList");
          }}
        >
          <ArrowLeftSvg />
          <span>All Proposals</span>
        </div>
        <div className={s.proposalTitle}>
          <input
            placeholder="Enter Proposal Title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
            }}
          />
        </div>
        <div className={s.detailTitle}>
          <span>Details</span>
        </div>
        <div className={s.details}>
          {actions.map((action, index) => (
            <div
              className={s.detail}
              onClick={() => {
                setActionIndex(index);
                setContractName(action.contract);
                setFunctionName(action.function);
                setParams(action.params);
                setData(action.data);
                setAddModal(true);
              }}
            >
              <div>
                <span>{index + 1}</span>
              </div>
              <span style={{ wordWrap: "break-word", width: "95%" }}>{`${action.contract}.${
                action.function
              }(${makeParam(action.params)})`}</span>
            </div>
          ))}
          <div
            className={s.detail}
            onClick={() => {
              setActionIndex(actions.length + 1);
              setAddModal(true);
            }}
          >
            <div>
              <span>{actions.length + 1}</span>
            </div>
            <span style={{ color: "rgba(232, 232, 232, 0.55)" }}>Add action</span>
          </div>
        </div>
        <div
          className={s.editingCheck}
          onClick={() => {
            setEditing(!editing);
          }}
        >
          {editing && <CheckedSvg />}
          {!editing && <UncheckedSvg />}
          <span>{editing ? "Show preview" : "Edit"}</span>
        </div>
        <div className={cx(s.description, s.editing, !editing && s.editingNone)}>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} ref={editArea}></textarea>
        </div>
        {!editing &&
          (description ? (
            <div className={s.markDown}>
              <ReactMarkdown children={description} />
            </div>
          ) : (
            <div className={s.description}>
              <textarea value={guide} style={{ wordWrap: "break-word" }} onChange={() => {}} disabled />
            </div>
          ))}
        <div className={s.btnWrapper}>
          <Antd.Button
            onClick={() => {
              publish();
            }}
            disabled={!publishAvaliable()}
            loading={depositing}
          >
            Publish
          </Antd.Button>
        </div>
      </div>
      {addModal && (
        <div
          className={s.infoModalWrapper}
          onClick={() => {
            setAddModal(false);
            initContractData();
          }}
        >
          <div
            className={s.infoModal}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <span className={s.modalTitle}>Add Action</span>
            <div className={s.scrollWrapper}>
              <div className={s.targetContract}>
                <div className={s.selectContract}>
                  <span>Select Target Contract</span>
                </div>
                <div
                  className={cx(s.selectedContract, contractName === "" && s.selectedContract1)}
                  onClick={() => {
                    setContractOpen(!contractOpen);
                  }}
                >
                  {contractName !== "" ? <span>{contractName}</span> : <span>Click to view contracts</span>}
                  {contractOpen ? <ArrowUpSvg /> : <ArrowDonwSvg />}
                </div>
              </div>
              {contractOpen && (
                <div className={s.contracts}>
                  {contracts.map((item, index) => (
                    <div
                      style={{ cursor: "pointer", marginBottom: "6px" }}
                      onClick={() => {
                        setContractName(item);
                        setContractOpen(false);
                      }}
                      key={"contract" + index}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              )}
              <div className={s.downArrowGrey}>
                <ArrowDonwGreySvg />
              </div>
              <div className={s.targetFunction}>
                <div className={s.selectContract}>
                  <span>Select Function</span>
                </div>
                <div
                  className={cx(s.selectedContract, functionName === "" && s.selectedContract1)}
                  onClick={() => {
                    setFunctionOpen(!functionOpen);
                  }}
                >
                  {functionName !== "" ? <span>{functionName}</span> : <span>Click to view Functions</span>}
                  {functionOpen ? <ArrowUpSvg /> : <ArrowDonwSvg />}
                </div>
              </div>
              {functionOpen && (
                <div className={s.contracts}>
                  {Object.keys(functions[contractName] ?? []).map((item: any, index: any) => (
                    <div
                      style={{ cursor: "pointer", marginBottom: "6px" }}
                      onClick={() => {
                        setFunctionName(item);
                        setFunctionOpen(false);
                      }}
                      key={"function" + index}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              )}
              {contractName && functionName && (
                <div className={s.signature}>
                  <span>Signature:&nbsp;{functions[contractName][functionName]?.signature ?? ""}</span>
                </div>
              )}
              {contractName && functionName && functions[contractName][functionName]?.params.length > 0 && (
                <div className={s.downArrowGrey}>
                  <ArrowDonwGreySvg />
                </div>
              )}
              {contractName &&
                functionName &&
                functions[contractName][functionName]?.params.map((item: any, index: any) => (
                  <div className={s.data} key={"param" + index}>
                    <div>
                      <span>{item}</span>
                    </div>
                    <input
                      type="text"
                      placeholder={item.includes("address") ? "0x..." : "0"}
                      value={params[index] ?? ""}
                      onChange={(e) => {
                        paramChangeHandler(e.target.value, index);
                      }}
                    />
                  </div>
                ))}
              {contractName && functionName && functions[contractName][functionName]?.params.length > 0 && (
                <div className={s.rawData}>
                  <span>{`Data:${data}`}</span>
                </div>
              )}
              <div className={s.btnWrapper}>
                <Antd.Button
                  onClick={() => {
                    saveAction();
                  }}
                  disabled={!actionSaveAvailable()}
                >
                  {actions.length < actionIndex ? "Add Action" : "Update Action"}
                </Antd.Button>
              </div>
            </div>
            <div
              className={s.closeBtn}
              onClick={() => {
                setAddModal(false);
                initContractData();
              }}
            >
              <XSvg />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VoteCreate;
