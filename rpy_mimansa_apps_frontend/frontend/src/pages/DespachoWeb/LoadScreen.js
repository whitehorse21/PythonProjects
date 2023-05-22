import React, { useState, useEffect, useRef } from "react";
import { useHistory } from "react-router-dom";
import {
  Grid,
  Header,
  Input,
  Segment,
  Divider,
  Loader,
} from "semantic-ui-react";
import MainMenu from "../../components/MainMenu";
import PopUpMessage from "../../components/PopupMessage";
import DespachoWebProgressTab from "../../components/DespachoWebProgressTab";
import { apiValidateLoad } from "../../services/api";

const LoadScreen = () => {
  let history = useHistory();
  const refLoadInput = useRef(null);

  const [loading, setLoading] = useState(false);

  const [login_user_id, setUserId] = useState("");
  const [whse, setWhse] = useState("");
  const [whse_name, setWhseName] = useState("");

  const [load_nbr, setLoadNbr] = useState("");
  const [load_info, setLoadInfo] = useState("");
  const [alert, setAlert] = useState(false);
  const [error, setError] = useState("");

  const handleKeyUp = (e) => {
    if (e.keyCode === 13) {
      if (load_nbr === "") {
        setLoadNbr("");
        setError("Ingreso de la carga es obligatorio.");
        setAlert(true);
      } else {
        validateLoad();
        setLoadNbr("");
      }
    }
  };

  useEffect(() => {
    var scanInfo = JSON.parse(sessionStorage.getItem("scanInfo"));

    if (scanInfo === null || scanInfo.login_user_id === undefined) {
      history.push("/login");
    } else {
      if (scanInfo !== null && scanInfo.load_info !== undefined) {
        var newInfo = {
          login_user_id: scanInfo.login_user_id,
          whse: scanInfo.whse,
          whse_name: scanInfo.whse_name,
          load_info: scanInfo.load_info,
        };
        sessionStorage.setItem("scanInfo", JSON.stringify(newInfo));
        console.log("scanInfo in useEffect:", scanInfo);
      }
      if (scanInfo !== null) {
        setUserId(scanInfo.login_user_id);
        setWhse(scanInfo.whse);
        setWhseName(scanInfo.whse_name);
        setLoadInfo(scanInfo.load_info);
      }
    }
  }, [history]);

  const validateLoad = () => {
    setLoading(true);

    var scanInfo = JSON.parse(sessionStorage.getItem("scanInfo"));

    apiValidateLoad({
      whse: whse,
      load_nbr: load_nbr,
      login_user_id: scanInfo.login_user_id,
    })
      .then((res) => {
        console.log("===== res: ", res);
        setLoading(false);
        if (res) {
          var scanInfo = JSON.parse(sessionStorage.getItem("scanInfo"));
          var newObj = Object.assign({}, scanInfo, {
            load_info: res.load_info,
          });
          sessionStorage.setItem("scanInfo", JSON.stringify(newObj));
          console.log("scanInfo :", scanInfo);
          history.push("/dock_door");
        }
      })
      .catch(function (error) {
        // Handle Errors here.
        setLoading(false);
        console.log("===== error: ", error);
        setError(error.message);
        setAlert(true);
        // ...
      });
  };

  const onClose = () => {
    console.log("Entered onClose of Load screen");
    setLoadNbr("");
    setAlert(false);
    refLoadInput.current.focus();
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
        <Grid.Column align="center" width={7}>
          <Header align="center" as="h1">
            Despacho WEB
          </Header>
          <DespachoWebProgressTab
            load_tab_active={true}
            load_tab_disabled={false}
          />
          <Segment align="center" verticalAlign="middle" padded="very" clearing>
            <Input
              autoFocus
              fluid
              placeholder="Ingresar la Carga"
              label="Carga"
              labelPosition="left"
              ref={refLoadInput}
              value={load_nbr}
              onChange={(e) => setLoadNbr(e.target.value.toUpperCase().trim())}
              onKeyUp={handleKeyUp}
              InputProps={{ readOnly: Boolean(loading) }}
            />
            <Divider hidden />
            {loading && <Loader active inline="centered" />}
          </Segment>
        </Grid.Column>
        <Grid.Column align="center" width={5}></Grid.Column>
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

export default LoadScreen;
