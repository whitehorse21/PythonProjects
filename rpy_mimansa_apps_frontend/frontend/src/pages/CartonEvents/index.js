import React, { useState, useEffect } from "react";
import {
  Grid,
  Button,
  Icon,
  Loader,
  Input,
  Header,
  Table as SemanticTable,
  Segment,
} from "semantic-ui-react";
import TablePagination from "@material-ui/core/TablePagination";
import TablePaginationActions from "./paginationActions";
import { apiFetchCartonEvents } from "../../services/api";
import PopUpMessage from "../../components/PopupMessage";
import MainMenu from "../../components/MainMenu";
import {
  useReactTable,
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";

import { rankItem } from "@tanstack/match-sorter-utils";

import { exportExcel } from "./export";

const fuzzyFilter = (row, columnId, value, addMeta) => {
  // Rank the item
  console.log(row, columnId, value, addMeta);
  const itemRank = rankItem(row.getValue(columnId), value);

  // Store the itemRank info
  addMeta({
    itemRank,
  });

  // Return if the item should be filtered in/out
  return itemRank.passed;
};

function CartonEvents() {
  const [login_user_id, setUserId] = useState("");
  const [whse_name, setWhseName] = useState("");

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(false);
  const [error, setError] = useState("");

  const columnHelper = createColumnHelper();

  const [globalFilter, setGlobalFilter] = useState("");

  const [data, setData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [sorting, setSorting] = useState([]);
  const [pageInfo, setPageInfo] = useState({
    pageIndex: 1,
    pageSize: 10,
  });

  const columns = [
    columnHelper.accessor((row) => row.id, {
      id: "id",
      cell: (info) => (
        <p style={{ wordWrap: "break-word" }}>{info.getValue()}</p>
      ),
      header: () => <span>ID</span>,
    }),
    columnHelper.accessor((row) => row.carton_nbr, {
      id: "carton_nbr",
      cell: (info) => (
        <p style={{ wordWrap: "break-word" }}>{info.getValue()}</p>
      ),
      header: () => <span>Carton Number</span>,
    }),
    columnHelper.accessor((row) => row.load_nbr, {
      id: "load_nbr",
      cell: (info) => (
        <p style={{ wordWrap: "break-word" }}>{info.getValue()}</p>
      ),
      header: () => <span>Load Number</span>,
    }),
    columnHelper.accessor((row) => row.whse_code, {
      id: "whse_code",
      cell: (info) => (
        <p style={{ wordWrap: "break-word" }}>{info.getValue()}</p>
      ),
      header: () => <span>Warehouse Code</span>,
    }),
    columnHelper.accessor((row) => row.whse_name, {
      id: "whse_name",
      cell: (info) => (
        <p style={{ wordWrap: "break-word" }}>{info.getValue()}</p>
      ),
      header: () => <span>Warehouse Name</span>,
    }),
    columnHelper.accessor((row) => row.load_carton_event_description, {
      id: "load_carton_event_description",
      cell: (info) => (
        <p style={{ wordWrap: "break-word" }}>{info.getValue()}</p>
      ),
      header: () => <span>Carton Event Type</span>,
    }),
    columnHelper.accessor((row) => row.old_stat_code, {
      id: "old_stat_code",
      cell: (info) => (
        <p style={{ wordWrap: "break-word" }}>{info.getValue()}</p>
      ),
      header: () => <span>Old Stat Code</span>,
    }),
    columnHelper.accessor((row) => row.new_stat_code, {
      id: "new_stat_code",
      cell: (info) => (
        <p style={{ wordWrap: "break-word" }}>{info.getValue()}</p>
      ),
      header: () => <span>New Stat Code</span>,
    }),
    columnHelper.accessor((row) => row.creation_date, {
      id: "creation_date",
      cell: (info) => (
        <p style={{ wordWrap: "break-word" }}>{info.getValue()}</p>
      ),
      header: () => <span>Creation Date</span>,
    }),
    columnHelper.accessor((row) => row.modification_date, {
      id: "modification_date",
      cell: (info) => (
        <p style={{ wordWrap: "break-word" }}>{info.getValue()}</p>
      ),
      header: () => <span>Modification Date</span>,
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: fuzzyFilter,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    debugTable: true,
    debugHeaders: true,
    debugColumns: false,
  });

  useEffect(() => {
    var scanInfo = JSON.parse(sessionStorage.getItem("scanInfo"));
    if (scanInfo !== null) {
      setUserId(scanInfo.login_user_id);
      setWhseName(scanInfo.whse_name);
    }

    fetchUsers();
  }, [pageInfo, sorting]);

  const handleChangePage = (_, newPage) => {
    console.log("page index - ", newPage);
    table.setPageIndex(newPage);
    setPageInfo({ ...pageInfo, pageIndex: newPage + 1 });
  };

  const handleChangeRowsPerPage = (e) => {
    const size = e.target.value ? Number(e.target.value) : 10;
    table.setPageSize(size);
    setPageInfo({ ...pageInfo, pageSize: size });
  };

  const fetchUsers = () => {
    let updatedSortInfo = { sort: "id", direction: "asc" };
    if (sorting.length > 0) {
      updatedSortInfo = {
        sort: sorting[0].id,
        direction: sorting[0].desc ? "desc" : "asc",
      };
    }

    console.log(sorting, updatedSortInfo);
    setLoading(true);

    apiFetchCartonEvents({
      page: pageInfo.pageIndex,
      per_page: pageInfo.pageSize,
      ...updatedSortInfo,
      //q: filterString,
    })
      .then((res) => {
        setData(res.results);
        setTotalRows(res.count);
        setLoading(false);
      })
      .catch(function (error) {
        // Handle Errors here.
        setLoading(false);
        console.log("===== error: ", error);
        setError(error.message);
        setAlert(true);
      });
  };

  const onClose = () => {
    console.log("Entered onClose of Load screen");
    setAlert(false);
  };

  return (
    <Grid>
      <Grid.Row></Grid.Row>
      <MainMenu login_user_id={login_user_id} whse_name={whse_name} />
      <Grid.Row>
        <Grid.Column width={12} />
        <Grid.Column width={4}>
          <Header as="h5" floated="right">
            {login_user_id} @ {whse_name}
          </Header>
        </Grid.Column>
      </Grid.Row>

      <Grid.Row centered columns={16}>
        <Grid.Column align="center" width={1}></Grid.Column>
        <Grid.Column align="center" width={14}>
          <Header align="center" as="h1">
            Carton Events
          </Header>

          <Segment>
            <Input
              floated="left"
              size="medium"
              onChange={(e) => setGlobalFilter(e.target.value.trim())}
              value={globalFilter}
              placeholder="Search..."
            />
            {loading && <Loader active inline="centered" />}{" "}
            <Button
              icon
              labelPosition="left"
              primary
              onClick={() => exportExcel(data, "cartonevent")}
              floated="right"
            >
              <Icon name="cloud download" />
              Export
            </Button>
            <SemanticTable celled fixed selectable color={"blue"}>
              <SemanticTable.Header>
                {table.getHeaderGroups().map((headerGroup) => (
                  <SemanticTable.Row key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <SemanticTable.HeaderCell
                          key={header.id}
                          colSpan={header.colSpan}
                        >
                          {header.isPlaceholder ? null : (
                            <>
                              <div
                                {...{
                                  className: header.column.getCanSort()
                                    ? "cursor-pointer select-none"
                                    : "",
                                  onClick:
                                    header.column.getToggleSortingHandler(),
                                }}
                              >
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                                {{
                                  asc: " 🔼",
                                  desc: " 🔽",
                                }[header.column.getIsSorted()] ?? null}
                              </div>
                            </>
                          )}
                        </SemanticTable.HeaderCell>
                      );
                    })}
                  </SemanticTable.Row>
                ))}
              </SemanticTable.Header>
              <SemanticTable.Body>
                {table.getRowModel().rows.map((row) => {
                  return (
                    <SemanticTable.Row key={row.id}>
                      {row.getVisibleCells().map((cell) => {
                        return (
                          <SemanticTable.Cell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </SemanticTable.Cell>
                        );
                      })}
                    </SemanticTable.Row>
                  );
                })}
              </SemanticTable.Body>
            </SemanticTable>
            <TablePagination
              rowsPerPageOptions={[5, 10, 20, 30]}
              component="div"
              count={totalRows}
              rowsPerPage={pageInfo.pageSize}
              page={pageInfo.pageIndex - 1}
              SelectProps={{
                inputProps: { "aria-label": "rows per page" },
                native: true,
              }}
              onPageChange={handleChangePage}
              onChangeRowsPerPage={handleChangeRowsPerPage}
              ActionsComponent={(props) => (
                <TablePaginationActions
                  {...props}
                  onPageChange={handleChangePage}
                />
              )}
            />
          </Segment>
        </Grid.Column>
        <Grid.Column align="center" width={1}></Grid.Column>
      </Grid.Row>
      <Grid.Row>
        <PopUpMessage
          error={error}
          open={alert}
          onClose={() => onClose(error)}
        />
      </Grid.Row>
    </Grid>
  );
}

export default CartonEvents;
