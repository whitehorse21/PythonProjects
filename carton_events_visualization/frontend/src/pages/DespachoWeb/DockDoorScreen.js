import React, { useState, useEffect, useRef } from 'react'
import { useHistory } from 'react-router-dom';
import { Grid, Header, Input, Segment, Divider, Loader } from 'semantic-ui-react'
import MainMenu from '../../components/MainMenu';
import PopUpMessage from '../../components/PopupMessage';
import { apiValidateDockDoor } from '../../services/api';
import DespachoWebProgressTab from '../../components/DespachoWebProgressTab';

const DockDoorScreen = () => {

    let history = useHistory();
    const refDockDoorBrcdInput = useRef(null);

    const [loading, setLoading] = useState(false);

    const [login_user_id, setUserId] = useState("");
    const [whse_name, setWhseName] = useState("");
    const [load_info, setLoadInfo] = useState("");
    const [dock_door_brcd, setDockDoorBrcd] = useState("");

    const [alert, setAlert] = useState(false);
    const [error, setError] = useState("");




    const handleKeyUp = e => {
        if (e.keyCode === 13) {
            if (dock_door_brcd === "") {
                setDockDoorBrcd("");
                setError("Favor escanear el puerto de despacho.");
                setAlert(true);
            } else {
                validateDockDoor();
                setDockDoorBrcd("");
            }
        }
    }

    useEffect(() => {
        var scanInfo = JSON.parse(sessionStorage.getItem("scanInfo"));
        console.log(" == scanInfo in useEffect = ", scanInfo)

        if (scanInfo === null || scanInfo.load_info.load_nbr === undefined) {
            history.push("/load");
        } else {
            if (scanInfo !== null && scanInfo.load_info !== undefined) {
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
                setLoadInfo(scanInfo.load_info);
                setDockDoorBrcd(scanInfo.load_info.dock_door_brcd);
            }
        }

    }, [history]);

    const validateDockDoor = () => {

        setLoading(true);

        var scanInfo = JSON.parse(sessionStorage.getItem("scanInfo"));

        apiValidateDockDoor({ whse: scanInfo.whse, dock_door_brcd: dock_door_brcd, login_user_id: scanInfo.login_user_id, load_nbr: scanInfo.load_info.load_nbr})
            .then(res => {
                console.log('===== res: ', res);
                setLoading(false);
                if (res) {
                    var scanInfo = JSON.parse(sessionStorage.getItem("scanInfo"));
                    console.log(" == whse = ", scanInfo.whse)
                    console.log(scanInfo)
                    var newObj = Object.assign({}, scanInfo, {load_info: res.load_info});
                    sessionStorage.setItem("scanInfo", JSON.stringify(newObj));
                    history.push('/trailer');
                }
            })
            .catch(function (error) {
                // Handle Errors here.
                setLoading(false);
                console.log('===== error: ', error.message);
                setError(error.message);
                setAlert(true);
                // ...
            });

    }

    const onClose = () => {
        setDockDoorBrcd("");
        setAlert(false);
        refDockDoorBrcdInput.current.focus();
    }

    return (
        <Grid centered>
            <Grid.Row></Grid.Row>
            <MainMenu/>
            <Grid.Row>
                <Grid.Column width={4} />
                <Grid.Column width={8}>
                    <Header align="center" as='h1'>Despacho WEB</Header>
                </Grid.Column>
                <Grid.Column width={4}>
                    <Header as='h5' floated='right'>{login_user_id} @ {whse_name}</Header>
                </Grid.Column>
            </Grid.Row>
            <DespachoWebProgressTab dock_door_tab_active={true} dock_door_tab_disabled={false}
                         load_tab_active={true} load_tab_disabled={false}
                         />
            <Grid.Row>
                <Grid.Column width={4}>
                    <Header as='h2' align="center">Carga : {load_info.load_nbr}</Header>
                    <Header as='h3' align="center">Cartones Asignados : {load_info.cartons_assigned}<br/>Cartones cargados : {load_info.cartons_loaded}</Header>
                </Grid.Column>
            </Grid.Row>
            <Grid.Row centered columns={3}>
                <Grid.Column align="center">
                    <Segment align="center" verticalAlign='middle' padded='very' clearing>
                        <Input autoFocus
                                fluid
                                placeholder='Ingresar el Puerto'
                                label='Puerto de Despacho'
                                labelPosition='left'
                                ref={refDockDoorBrcdInput}
                                value={dock_door_brcd}
                                onChange={e => setDockDoorBrcd(e.target.value.toUpperCase().trim())}
                                onKeyUp={handleKeyUp}
                                InputProps={{ readOnly: Boolean(loading), }}
                            />
                        <Divider hidden />
                        {loading && <Loader active inline='centered' />}
                    </Segment>
                </Grid.Column>
            </Grid.Row>
            <Grid.Row>
                <PopUpMessage error={error} open={alert} onClose={() => onClose(error)}/>
            </Grid.Row>
        </Grid>
    )
}

export default DockDoorScreen;