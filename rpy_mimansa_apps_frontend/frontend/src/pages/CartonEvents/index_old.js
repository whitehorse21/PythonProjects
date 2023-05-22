import React, { useState, useEffect, useRef, useMemo } from "react";
import { useHistory } from "react-router-dom";
import { Grid, Header, Loader, Segment } from "semantic-ui-react";
import MainMenu from "../../components/MainMenu";
import PopUpMessage from "../../components/PopupMessage";
import { apiFetchCartonEvents } from "../../services/api";
import DataTable from "react-data-table-component";
import DataTableExtensions from "react-data-table-component-extensions";
import "react-data-table-component-extensions/dist/index.css";

const CartonEvents = () => {
  let history = useHistory();

  const [login_user_id, setUserId] = useState("");
  const [whse_name, setWhseName] = useState("");

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [curPage, setCurrentPage] = useState(1);
  const [sortInfo, setSortInfo] = useState({ sort: "id", direction: "asc" });

  const [alert, setAlert] = useState(false);
  const [error, setError] = useState("");

  const columns = [
    {
      name: "ID",
      selector: (row) => row.id,
      cellExport: (row) => row.id,
      sortable: true,
      sortField: "id",
      width: "70px",
    },
    {
      name: "Carton Number",
      selector: (row) => row.carton_nbr,
      cellExport: (row) => row.carton_nbr,
      sortable: true,
      sortField: "carton_nbr",
    },
    {
      name: "Load Number",
      selector: (row) => row.load_nbr,
      cellExport: (row) => row.load_nbr,
      sortable: true,
      sortField: "load_nbr",
    },
    {
      name: "Warehouse Code",
      selector: (row) => row.whse_code,
      cellExport: (row) => row.whse_code,
      sortable: true,
      sortField: "whse_code",
    },
    {
      name: "Warehouse Name",
      selector: (row) => row.whse_name,
      cellExport: (row) => row.whse_name,
      sortable: true,
      wrap: true,
      sortField: "whse_name",
    },
    {
      name: "Carton Event Type",
      selector: (row) => row.load_carton_event_description,
      cellExport: (row) => row.load_carton_event_description,
      sortable: true,
      wrap: true,
      sortField: "load_carton_event_description",
      grow: 3,
    },

    {
      name: "Old Stat Code",
      selector: (row) => row.old_stat_code,
      cellExport: (row) => row.old_stat_code,
      sortable: true,
      sortField: "old_stat_code",
    },
    {
      name: "New Stat Code",
      selector: (row) => row.new_stat_code,
      cellExport: (row) => row.new_stat_code,
      sortable: true,
      sortField: "new_stat_code",
    },
    {
      name: "Creation Date",
      selector: (row) => row.creation_date,
      cellExport: (row) => row.creation_date,
      sortable: true,
      wrap: true,
      sortField: "creation_date",
      grow: 2,
    },
    {
      name: "Modification Date",
      selector: (row) => row.modification_date,
      cellExport: (row) => row.modification_date,
      sortable: true,
      wrap: true,
      sortField: "modification_date",
      grow: 2,
    },
  ];

  useEffect(() => {
    var scanInfo = JSON.parse(sessionStorage.getItem("scanInfo"));
    if (scanInfo !== null) {
      setUserId(scanInfo.login_user_id);
      setWhseName(scanInfo.whse_name);
    }

    fetchUsers(); // fetch page 1 of users
  }, [curPage, perPage, sortInfo]);

  const fetchUsers = () => {
    setLoading(true);

    apiFetchCartonEvents({ page: curPage, per_page: perPage, ...sortInfo })
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

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePerRowsChange = async (newPerPage, page) => {
    setPerPage(newPerPage);
    setCurrentPage(page);
  };

  const handleSort = (column, sortDirection) => {
    setSortInfo({ sort: column.sortField, direction: sortDirection });
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
            <DataTableExtensions exportHeaders columns={columns} data={data}>
              <DataTable
                className="verticalAlign"
                noHeader
                columns={columns}
                data={data}
                progressPending={loading}
                progressComponent={<Loader active inline="centered" />}
                fixedHeader={true}
                fixedHeaderScrollHeight="calc(100vh - 316px)"
                highlightOnHover
                pagination
                paginationServer
                paginationTotalRows={totalRows}
                onChangeRowsPerPage={handlePerRowsChange}
                onChangePage={handlePageChange}
                sortServer
                onSort={handleSort}
              />
            </DataTableExtensions>
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
};

export default CartonEvents;
