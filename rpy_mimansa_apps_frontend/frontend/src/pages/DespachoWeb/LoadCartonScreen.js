import React, { useState, useEffect, useRef } from "react";
import { useHistory } from "react-router-dom";
import {
  Grid,
  Header,
  Input,
  Segment,
  Divider,
  Loader,
  Icon,
  Table,
  Modal,
  Button,
  Label,
} from "semantic-ui-react";
import MainMenu from "../../components/MainMenu";
import PopUpMessage from "../../components/PopupMessage";
import {
  apiValidateLoadCarton,
  apiUpdateCartonBoxCount,
} from "../../services/api";
import DespachoWebProgressTab from "../../components/DespachoWebProgressTab";

const LoadCartonScreen = () => {
  let history = useHistory();
  const refCartonInput = useRef(null);

  const [loading, setLoading] = useState(false);

  const [login_user_id, setUserId] = useState("");
  const [whse_name, setWhseName] = useState("");
  const [carton_nbr, setCartonNbr] = useState("");
  const [load_info, setLoadInfo] = useState("");

  const [alert, setAlert] = useState(false);
  const [error, setError] = useState("");

  const [scanInfo, setScanInfo] = useState(undefined);
  const [cartonHistory, setCartonHistory] = useState([]);

  const [modalOpen, setModalOpen] = React.useState(false);
  const [qty, setQty] = useState(1);
  const [selected_carton_nbr, setSelectedCartonNbr] = useState("");

  const handleKeyUp = (e) => {
    if (e.keyCode === 13) {
      if (carton_nbr === "") {
        setCartonNbr("");
        setError("Favor ingresar el carton a cargar.");
        setAlert(true);
      } else {
        validateCarton();
        //setCartonNbr("");
      }
    }
  };

  useEffect(() => {
    var scanInfo = JSON.parse(sessionStorage.getItem("scanInfo"));
    console.log(" == scanInfo in useEffect of LoadCartonScreen= ", scanInfo);

    if (scanInfo === null || scanInfo.load_info.load_nbr === undefined) {
      history.push("/load");
    } else {
      if (scanInfo !== null && scanInfo.carton_nbr !== undefined) {
        var newInfo = {
          login_user_id: scanInfo.login_user_id,
          whse: scanInfo.whse,
          whse_name: scanInfo.whse_name,
          load_info: scanInfo.load_info,
        };
        sessionStorage.setItem("scanInfo", JSON.stringify(newInfo));
      }
      if (scanInfo !== null) {
        setUserId(scanInfo.login_user_id);
        setWhseName(scanInfo.whse_name);
        setLoadInfo(scanInfo.load_info);
        setCartonNbr(scanInfo.carton_nbr);
      }
    }
  }, [history]);

  const onClickedCarton = (selectedCarton) => {
    console.log("testing - ", selectedCarton);
    setSelectedCartonNbr(selectedCarton);
    setQty(1);
    setModalOpen(true);
  };

  const updateBoxCounter = (bFlag) => {
    let updatedQTY = bFlag ? qty + 1 : qty - 1;
    setQty(updatedQTY < 1 ? 1 : updatedQTY);
  };

  const updateCartonBoxCount = () => {
    setModalOpen(false);
    setLoading(true);

    apiUpdateCartonBoxCount({
      login_user_id: login_user_id,
      carton_nbr: selected_carton_nbr,
      qty: qty,
    })
      .then((res) => {
        console.log("===== res: ", res);
        setLoading(false);
      })
      .catch(function (error) {
        // Handle Errors here.
        setLoading(false);
        console.log("===== error: ", error.message);
        setError(error.message);
        setAlert(true);
      });
  };

  const validateCarton = () => {
    setLoading(true);

    var scanInfo = JSON.parse(sessionStorage.getItem("scanInfo"));
    console.log("apiValidateLoadCarton", scanInfo);
    console.log("current carton number", carton_nbr);

    apiValidateLoadCarton({
      whse: scanInfo.whse,
      carton_nbr: carton_nbr,
      trlr_nbr: scanInfo.load_info.trlr_nbr,
      login_user_id: scanInfo.login_user_id,
      load_nbr: scanInfo.load_info.load_nbr,
    })
      .then((res) => {
        console.log("===== res: ", res);
        setLoading(false);

        if (res) {
          if (cartonHistory.indexOf(carton_nbr) < 0) {
            setCartonHistory([carton_nbr, ...cartonHistory]);
          }

          setScanInfo(res.load_info);
          /*
                    var scanInfo = JSON.parse(sessionStorage.getItem("scanInfo"));
                    console.log(" == whse = ", scanInfo.whse)
                    console.log(scanInfo)
                    var newObj = Object.assign({}, scanInfo);
                    sessionStorage.setItem("scanInfo", JSON.stringify(newObj));
                    history.push('/load_carton');
                    */
        }
      })
      .catch(function (error) {
        // Handle Errors here.
        setLoading(false);
        console.log("===== error: ", error.message);
        setError(error.message);
        setAlert(true);
        // ...
      });
  };

  const onClose = () => {
    setCartonNbr("");
    setAlert(false);
    refCartonInput.current.focus();
  };

  return (
    <Grid centered>
      <Grid.Row></Grid.Row>
      <MainMenu />
      <Grid.Row>
        <Grid.Column width={4} />
        <Grid.Column width={8}></Grid.Column>
        <Grid.Column width={4}>
          <Header as="h5" floated="right">
            {login_user_id} @ {whse_name}
          </Header>
        </Grid.Column>
      </Grid.Row>
      <Grid.Row>
        <Grid.Column width={1}></Grid.Column>
        <Grid.Column align="center" width={8}>
          <Header align="center" as="h1">
            Despacho WEB
          </Header>
          <DespachoWebProgressTab
            trailer_tab_active={true}
            trailer_tab_disabled={false}
            dock_door_tab_active={true}
            dock_door_tab_disabled={false}
            load_tab_active={true}
            load_tab_disabled={false}
            load_carton_tab_active={true}
            load_carton_tab_disabled={false}
          />
          <Segment raised align="center" verticalAlign="middle" padded="very">
            <Input
              size="huge"
              autoFocus
              placeholder="Ingresar el Numero de Carton"
              label="Nro. Carton"
              labelPosition="left"
              ref={refCartonInput}
              value={carton_nbr}
              onChange={(e) =>
                setCartonNbr(e.target.value.toUpperCase().trim())
              }
              onKeyUp={handleKeyUp}
              InputProps={{ readOnly: Boolean(loading) }}
            />
            <Divider hidden />
            {loading && <Loader active inline="centered" />}
          </Segment>
        </Grid.Column>
        <Grid.Column width={6}>
          {scanInfo && (
            <Segment>
              <Header as="h2" align="center">
                Carga : {load_info.load_nbr}
              </Header>
              <Header as="h2" align="center">
                Puerto : {load_info.dock_door_brcd}
              </Header>
              <Header as="h3" align="center">
                Cartones Asignados : {load_info.cartons_assigned}
              </Header>
              <Header as="h3" align="center">
                Cartones cargados : {load_info.cartons_loaded}
              </Header>

              <Table celled structured>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell textAlign="center">
                      CARTON HISTORY
                    </Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {cartonHistory.map((eachCarton) => (
                    <Table.Row>
                      <Table.Cell
                        onClick={() => onClickedCarton(eachCarton)}
                        textAlign="center"
                      >
                        {eachCarton}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>

              <Table celled structured>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell colSpan="2" textAlign="center">
                      MULTI CARTON ORDERS
                    </Table.HeaderCell>
                  </Table.Row>
                  <Table.Row>
                    <Table.HeaderCell textAlign="center">PKT</Table.HeaderCell>
                    <Table.HeaderCell textAlign="center">
                      CARTONS PENDING
                    </Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {scanInfo.multi_carton_pkt.map((eachPKT) => (
                    <Table.Row>
                      <Table.Cell textAlign="center">{eachPKT[0]}</Table.Cell>
                      <Table.Cell textAlign="center">{eachPKT[1]}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </Segment>
          )}
        </Grid.Column>
        <Grid.Column width={1}></Grid.Column>
      </Grid.Row>
      <Grid.Row>
        <PopUpMessage
          error={error}
          open={alert}
          onClose={() => onClose(error)}
        />
      </Grid.Row>

      <Modal
        closeIcon
        open={modalOpen}
        size="mini"
        onClose={() => setModalOpen(false)}
      >
        <Header>{selected_carton_nbr}</Header>
        <Modal.Content>
          <Segment padded="very" align="center" clearing>
            <Button
              icon={{ as: "i", className: "minus circle" }}
              onClick={() => updateBoxCounter(false)}
            />
            <Label style={{ backgroundColor: "white", fontSize: 18 }}>
              {qty}{" "}
            </Label>
            <Button
              icon={{ as: "i", className: "plus circle" }}
              onClick={() => updateBoxCounter(true)}
            />
          </Segment>
        </Modal.Content>
        <Modal.Actions>
          <Button color="green" onClick={updateCartonBoxCount}>
            <Icon name="checkmark" /> Submit
          </Button>
        </Modal.Actions>
      </Modal>
    </Grid>
  );
};

export default LoadCartonScreen;
