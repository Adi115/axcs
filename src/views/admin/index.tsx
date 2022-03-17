/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
// import BigNumber from 'bignumber.js';
import { useTable, Column } from "react-table";
import ReactPaginate from "react-paginate";
import * as Antd from "antd";
import moment from "moment";
import { useWallet } from "wallets/wallet";
import { request, adminApi } from "api";
import { useAsyncEffect } from "hooks/useAsyncEffect";

import s from "./styles.module.css";

interface Staker {
  id: number;
  address: string;
}

interface Stake {
  id: number;
  address: string;
  order: number;
  amount: number;
  startEpochId: number;
  endEpochId: number;
  lockWeeks: number;
  claimedAmount: number;
  earnedAmount: number;
  lastClaimEpochId: number;
  startTimestamp: number;
  endTimestamp: number;
  lockOn: string;
  unlockOn: string;
}

const AdminDashboard: React.FunctionComponent = () => {
  const wallet = useWallet();

  const [isStaker, setIsStaker] = React.useState(true);
  const [stakers, setStakers] = React.useState<Staker[]>([]);
  const [totalStaker, setTotalStaker] = React.useState(0);
  const [stakerOffset, setStakerOffset] = React.useState(0);
  const [stakerLimit, setStakerLimit] = React.useState(20);
  const [stakerPage, setStakerPage] = React.useState(0);

  const [address, setAddress] = React.useState("");
  const [stakes, setStakes] = React.useState<Stake[]>([]);
  const [totalStake, setTotalStake] = React.useState(0);
  const [stakeOffset, setStakeOffset] = React.useState(0);
  const [stakeLimit, setStakeLimit] = React.useState(20);

  useAsyncEffect(async () => {
    try {
      const option = {
        method: "GET",
      };
      const response = await request(adminApi.getStakers(stakerOffset, stakerLimit), option);
      if (response?.status) {
        setStakers(response.data.rows);
        setTotalStaker(response.data.count);
      }
    } catch (e) {
      console.log(e);
    }
  }, [stakerOffset, stakerLimit]);

  useAsyncEffect(async () => {
    try {
      const option = {
        method: "GET",
      };
      const response = await request(adminApi.getStakes(address, stakeOffset, stakeLimit), option);
      if (response?.status) {
        setStakes(response.data.rows);
        setTotalStake(response.data.count);
      }
    } catch (e) {
      console.log(e);
    }
  }, [address, stakeOffset, stakeLimit]);

  const stakerData: Staker[] = React.useMemo(() => {
    return stakers;
  }, [stakers]);

  const stakerColumns: Column<Staker>[] = React.useMemo(
    () => [
      {
        Header: "No",
        accessor: "id",
      },
      {
        Header: "Address",
        accessor: "address",
      },
    ],
    []
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({
    columns: stakerColumns,
    data: stakerData,
  });

  const handleStakerPageClick = (data: any) => {
    let selected = data.selected;
    let offset = Math.ceil(selected * stakerLimit);

    setStakerOffset(offset);
    setStakerPage(selected);
  };

  // stake
  const stakeData: Stake[] = React.useMemo(() => {
    return stakes.map((stake, index) => {
      return {
        ...stake,
        lockOn: moment(stake.lockOn).format("MMMM Do, YYYY - h:mm:ss a"),
        unlockOn: moment(stake.unlockOn).format("MMMM Do, YYYY - h:mm:ss a"),
      };
    });
  }, [stakes]);

  const stakeColumns: Column<Stake>[] = React.useMemo(
    () => [
      {
        Header: "No",
        accessor: "id",
      },
      {
        Header: "Address",
        accessor: "address",
      },
      {
        Header: "Order",
        accessor: "order",
      },
      {
        Header: "Amount",
        accessor: "amount",
      },
      // {
      //   Header: 'Start Epoch Id',
      //   accessor: 'startEpochId',
      // },
      // {
      //   Header: 'End Epoch Id',
      //   accessor: 'endEpochId',
      // },
      {
        Header: "Lock Weeks",
        accessor: "lockWeeks",
      },
      {
        Header: "Claimed Amount",
        accessor: "claimedAmount",
      },
      {
        Header: "Earned Amount",
        accessor: "earnedAmount",
      },
      // {
      //   Header: 'Last Claim Epoch Id',
      //   accessor: 'lastClaimEpochId',
      // },
      // {
      //   Header: 'Start Timestamp',
      //   accessor: 'startTimestamp',
      // },
      // {
      //   Header: 'End Timestamp',
      //   accessor: 'endTimestamp',
      // },
      {
        Header: "Lock On",
        accessor: "lockOn",
      },
      {
        Header: "Unlock On",
        accessor: "unlockOn",
      },
    ],
    []
  );

  const {
    getTableProps: getTableProps1,
    getTableBodyProps: getTableBodyProps1,
    headerGroups: headerGroups1,
    rows: rows1,
    prepareRow: prepareRow1,
  } = useTable({ columns: stakeColumns, data: stakeData });

  const handleStakePageClick = (data: any) => {
    let selected = data.selected;
    let offset = Math.ceil(selected * stakerLimit);

    setStakeOffset(offset);
  };

  const excelExport = async (type: number) => {
    try {
      let url = adminApi.exportStakes;
      if (type === 2) {
        url = adminApi.exportStakesTotal;
      }

      console.log(url);
      await fetch(url, {
        headers: {
          "Content-Type": "application/json",
        },
        method: "GET",
      })
        .then((response) => response.blob())
        .then((blob) => URL.createObjectURL(blob))
        .then((uril) => {
          var link = document.createElement("a");
          link.href = uril;
          link.download = `Report-${Date.now()}.xls`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
    } catch (e) {
      console.log(e);
    }
  };

  if (
    !wallet.account ||
    (wallet.account.toLowerCase() !== "0xe7463385d9ddffb5a080a4df1af40db758f0ce95" &&
      wallet.account.toLowerCase() !== "0xd8a052a5d9683679580a6aa47263bfc6f0d1dd57")
  ) {
    return <></>;
  }

  return (
    <div className={s.component}>
      <div className={s.options}>
        <Antd.Switch
          checkedChildren="Staker Info"
          unCheckedChildren="Stake Info"
          checked={isStaker}
          onChange={(checked) => {
            setIsStaker(checked);
            if (checked) {
              setAddress("");
            }
          }}
        />
        <Antd.Button
          type="primary"
          onClick={() => {
            excelExport(1);
          }}
        >
          Export Stake List
        </Antd.Button>
        <Antd.Button
          type="primary"
          onClick={() => {
            excelExport(2);
          }}
        >
          Export Aggregation
        </Antd.Button>
      </div>
      {isStaker && (
        <div>
          <table {...getTableProps()}>
            <thead>
              {headerGroups.map((headerGroup: any) => (
                <tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map((column: any) => (
                    <th {...column.getHeaderProps()}>{column.render("Header")}</th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody {...getTableBodyProps()}>
              {rows.map((row: any) => {
                prepareRow(row);
                return (
                  <tr {...row.getRowProps()}>
                    {row.cells.map((cell: any) => {
                      if (cell.column.id === "address") {
                        return (
                          <td
                            {...cell.getCellProps()}
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                              setAddress(cell.value);
                              setIsStaker(false);
                            }}
                          >
                            {cell.render("Cell")}
                          </td>
                        );
                      }
                      return <td {...cell.getCellProps()}>{cell.render("Cell")}</td>;
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className={s.paginationWrapper}>
            <ReactPaginate
              previousLabel={"previous"}
              nextLabel={"next"}
              breakLabel={"..."}
              breakClassName={"break-me"}
              forcePage={stakerPage}
              pageCount={totalStaker / stakerLimit}
              marginPagesDisplayed={2}
              pageRangeDisplayed={5}
              onPageChange={handleStakerPageClick}
              // containerClassName={'pagination'}
              activeClassName={"active"}
            />
          </div>
        </div>
      )}
      {!isStaker && (
        <div>
          <table {...getTableProps1()} style={{ width: "100%" }}>
            <thead>
              {headerGroups1.map((headerGroup: any) => (
                <tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map((column: any) => (
                    <th {...column.getHeaderProps()}>{column.render("Header")}</th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody {...getTableBodyProps1()}>
              {rows1.map((row: any) => {
                prepareRow1(row);
                return (
                  <tr {...row.getRowProps()}>
                    {row.cells.map((cell: any) => {
                      return <td {...cell.getCellProps()}>{cell.render("Cell")}</td>;
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className={s.paginationWrapper}>
            <ReactPaginate
              previousLabel={"previous"}
              nextLabel={"next"}
              breakLabel={"..."}
              breakClassName={"break-me"}
              pageCount={totalStake / stakeLimit}
              marginPagesDisplayed={2}
              pageRangeDisplayed={5}
              onPageChange={handleStakePageClick}
              // containerClassName={'pagination'}
              activeClassName={"active"}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
