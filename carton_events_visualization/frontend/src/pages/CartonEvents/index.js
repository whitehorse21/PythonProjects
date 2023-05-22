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
  Label,
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
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import SemanticDatepicker from "react-semantic-ui-datepickers";
import "react-semantic-ui-datepickers/dist/react-semantic-ui-datepickers.css";
import moment from "moment";

import { exportExcel } from "./export";

function CartonEvents() {
  const [login_user_id, setUserId] = useState("");
  const [whse_name, setWhseName] = useState("");

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(false);
  const [error, setError] = useState("");

  const columnHelper = createColumnHelper();

  const [data, setData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [sorting, setSorting] = useState([]);
  const [pageInfo, setPageInfo] = useState({
    pageIndex: 1,
    pageSize: 10,
  });

  const [inputValue, setInputValue] = useState("");
  const [timer, setTimer] = useState(null);

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
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    debugTable: true,
    debugHeaders: true,
    debugColumns: false,
  });

  const newEndDate = new Date();
  newEndDate.setDate(newEndDate.getDate() + 7);

  const [maxDate, setMaxDate] = useState(newEndDate);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const onStartDateChange = (event, data) => {
    setPageInfo({ ...pageInfo, pageIndex: 1 });

    setStartDate(data.value);

    if (data.value) {
      const newEndDate = new Date(data.value);
      newEndDate.setDate(data.value.getDate() + 7);
      setEndDate(newEndDate);
      setMaxDate(newEndDate);
    } else {
      setEndDate(data.value);
    }
  };

  const onEndDateChange = (event, data) => {
    setPageInfo({ ...pageInfo, pageIndex: 1 });

    setEndDate(data.value);

    if (!data.value) {
      setMaxDate(Date());
      setStartDate(data.value);
    }
  };

  useEffect(() => {
    var scanInfo = JSON.parse(sessionStorage.getItem("scanInfo"));
    if (scanInfo !== null) {
      setUserId(scanInfo.login_user_id);
      setWhseName(scanInfo.whse_name);
    }

    fetchUsers();
  }, [pageInfo, sorting, startDate, endDate]);

  const handleChangePage = (_, newPage) => {
    table.setPageIndex(newPage);
    setPageInfo({ ...pageInfo, pageIndex: newPage + 1 });
  };

  const handleChangeRowsPerPage = (e) => {
    const size = e.target.value ? Number(e.target.value) : 10;
    table.setPageSize(size);
    setPageInfo({ ...pageInfo, pageSize: size });
  };

  const fetchUsers = (bExport = false) => {
    let updatedSortInfo = { sort: "id", direction: "asc" };
    if (sorting.length > 0) {
      updatedSortInfo = {
        sort: sorting[0].id,
        direction: sorting[0].desc ? "desc" : "asc",
      };
    }

    setLoading(true);

    let dateFilter = {};
    if (endDate) {
      const queryEndDate = new Date(endDate);
      queryEndDate.setDate(endDate.getDate() + 1);
      dateFilter = {
        start_date: moment(startDate).format("YYYY-MM-DD"),
        end_date: moment(queryEndDate).format("YYYY-MM-DD"),
      };
    }

    let apiParams = {
      page: pageInfo.pageIndex,
      per_page: pageInfo.pageSize,
      ...dateFilter,
      ...updatedSortInfo,
      ...(bExport && { export: true }),
      ...(inputValue.length > 0 && { q: inputValue }),
    };

    console.log("@@@@@@@@@@@@@@@ - ", apiParams);

    apiFetchCartonEvents(apiParams)
      .then((res) => {
        setLoading(false);
        if (res.results) {
          setData(res.results);
          setTotalRows(res.count);
        } else {
          exportExcel(res.data, "cartonevent.xml");
        }
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

  const onSearchChange = (e) => {
    setInputValue(e.target.value.trim());

    clearTimeout(timer);

    const newTimer = setTimeout(() => {
      setPageInfo({ ...pageInfo, pageIndex: 1 });
    }, 500);

    setTimer(newTimer);
  };

  const onExcelExport = () => {
    fetchUsers(true);
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
            {loading && (
              <>
                <Loader active inline="centered" />
                <br />
              </>
            )}
            <Input
              icon="search"
              iconPosition="left"
              floated="left"
              size="medium"
              onChange={onSearchChange}
              value={inputValue}
              placeholder="Search..."
            />
            <Button
              icon
              labelPosition="left"
              primary
              onClick={onExcelExport}
              floated="right"
            >
              <Icon name="cloud download" />
              Export
            </Button>
            <div style={{ float: "right" }}>
              <Label size="large">From</Label>
              <SemanticDatepicker
                value={startDate}
                onChange={onStartDateChange}
                pointing="right"
                clearable={true}
              />
              <Label size="large">To</Label>
              <SemanticDatepicker
                onChange={onEndDateChange}
                pointing="right"
                value={endDate}
                minDate={startDate}
                maxDate={maxDate}
                clearable={true}
                disabled={startDate ? false : true}
              />{" "}
            </div>
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
                                  asc: <Icon name="caret up" />,
                                  desc: <Icon name="caret down" />,
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
