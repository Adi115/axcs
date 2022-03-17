import React from "react";
import BigNumber from "bignumber.js";

import { useReload } from "hooks/useReload";
import { useAsyncEffect } from "hooks/useAsyncEffect";
import { useWallet } from "wallets/wallet";
import Web3Contract from "web3/contract";

export const CONTRACT_GOVERNOR = String(process.env.REACT_APP_CONTRACT_GOVERNOR_ADDR);

type GovernorContractData = {
  proposalCount: number;
  proposals: any[];
  quorumVotes: BigNumber | undefined;
  proposalThreshold: BigNumber | undefined;
};

export type GovernorContract = GovernorContractData & {
  contract: Web3Contract;
  reload(): void;
  propose: (
    targets: string[],
    values: string[],
    signatures: string[],
    calldatas: string[],
    description: string
  ) => void;
  castVote: (proposalId: number, support: boolean) => void;
  getReceipt: (proposalId: string, voter: string) => Promise<any>;
};

const InitialData: GovernorContractData = {
  proposalCount: 0,
  proposals: [],
  quorumVotes: undefined,
  proposalThreshold: undefined,
};

export function useGovernorContract(): GovernorContract {
  const [reload] = useReload();
  const wallet = useWallet();

  const contract = React.useMemo<Web3Contract>(() => {
    return new Web3Contract(require("web3/abi/governor.json"), CONTRACT_GOVERNOR, "GOVERNOR_ALPHA");
  }, []);

  const [data, setData] = React.useState<GovernorContractData>(InitialData);

  useAsyncEffect(async () => {
    const [proposalCount, quorumVotes, proposalThreshold] = await contract.batch([
      {
        method: "proposalCount",
      },
      {
        method: "quorumVotes",
      },
      {
        method: "proposalThreshold",
      },
    ]);

    const requests = [];
    for (let i = 0; i < Number(proposalCount); i++) {
      requests.push({
        method: "proposals",
        methodArgs: [i + 1],
      });
    }
    let proposals = await contract.batch(requests);
    proposals = proposals.reverse();

    setData((prevState) => ({
      ...prevState,
      proposalCount,
      proposals,
      quorumVotes: new BigNumber(quorumVotes),
      proposalThreshold: new BigNumber(proposalThreshold),
    }));
  }, [reload]);

  const propose = React.useCallback(
    (targets: string[], values: string[], signatures: string[], calldatas: string[], description: string) => {
      if (!wallet.account) {
        return Promise.reject();
      }

      return contract
        .send("propose", [targets, values, signatures, calldatas, description], {
          from: wallet.account,
        })
        .then(reload);
    },
    [reload, contract, wallet.account]
  );

  const castVote = React.useCallback(
    (proposalId: number, support: boolean) => {
      if (!wallet.account) {
        return Promise.reject();
      }

      return contract
        .send("castVote", [proposalId, support], {
          from: wallet.account,
        })
        .then(reload);
    },
    [reload, contract, wallet.account]
  );

  const getReceipt = React.useCallback(
    async (proposalId: string, voter: string) => {
      const [result] = await contract.batch([
        {
          method: "getReceipt",
          methodArgs: [proposalId, voter],
        },
      ]);

      return result;
    },
    [contract]
  );

  return React.useMemo<GovernorContract>(
    () => ({
      ...data,
      contract,
      reload,
      propose,
      castVote,
      getReceipt,
    }),
    [data, contract, reload, propose, castVote, getReceipt]
  );
}
