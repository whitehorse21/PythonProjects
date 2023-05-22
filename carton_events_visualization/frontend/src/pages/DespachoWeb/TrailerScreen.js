import React, { useState, useEffect, useRef } from 'react'
import { useHistory } from 'react-router-dom';
import { Grid, Header, Input, Segment, Divider, Loader } from 'semantic-ui-react'
import MainMenu from '../../components/MainMenu';
import PopUpMessage from '../../components/PopupMessage';
import { apiValidateTrailer } from '../../services/api';
import DespachoWebProgressTab from '../../components/DespachoWebProgressTab';

const TrailerScreen = () => {

    let history = useHistory();
    const refTrailerInput = useRef(null);

    const [loading, setLoading] = useState(false);

    const [login_user_id, setUserId] = useState("");
    const [whse_name, setWhseName] = useState("");

    const [trlr_nbr, setTrailer] = useState("");
    const [load_info, setLoadInfo] = useState("");

    const [alert, setAlert] = useState(false);
    const [error, setError] = useState("");

    const handleKeyUp = e => {
        if (e.keyCode === 13) {
            if (trlr_nbr === "") {
                setTrailer("");
                setError("Favor ingresar el patente de camion.");
                setAlert(true);
            } else {
                validateTrailer();
                setTrailer("");
            }
        }
    }

    useEffect(() => {
        var scanInfo = JSON.parse(sessionStorage.getItem("scanInfo"));
        console.log(" == scanInfo in useEffect of TrailerScreen= ", scanInfo)

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
                setWhseName(scanInfo.whse_name);
                setLoadInfo(scanInfo.load_info);
                setTrailer(scanInfo.load_info.trlr_nbr);
            }
        }

    }, [history]);

    const validateTrailer = () => {

        setLoading(true);

        var scanInfo = JSON.parse(sessionStorage.getItem("scanInfo"));
        console.log('apiValidateTrailer', scanInfo);

        apiValidateTrailer({ whse: scanInfo.whse, trlr_nbr: trlr_nbr, login_user_id: scanInfo.login_user_id, load_nbr: scanInfo.load_info.load_nbr})
            .then(res => {
                console.log('===== res: ', res);
                setLoading(false);
                if (res) {
                    history.push('/load_carton');
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
        setTrailer("");
        setAlert(false);
        refTrailerInput.current.focus();
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
            <DespachoWebProgressTab trailer_tab_active={true} trailer_tab_disabled={false}
                        dock_door_tab_active={true} dock_door_tab_disabled={false}
                         load_tab_active={true} load_tab_disabled={false}
                         />
            <Grid.Row>
                <Grid.Column width={4}>
                    <Header as='h2' align="center">Carga : {load_info.load_nbr}</Header>
                    <Header as='h3' align="center">Puerto : {load_info.dock_door_brcd}</Header>
                    <Header as='h3' align="center">Cartones Asignados : {load_info.cartons_assigned}<br/>Cartones cargados : {load_info.cartons_loaded}</Header>
                </Grid.Column>
            </Grid.Row>
            <Grid.Row centered columns={3}>
                <Grid.Column align="center">
                    <Segment align="center" verticalAlign='middle' padded='very' clearing>
                        <Input autoFocus
                                fluid
                                placeholder='Ingresar el Patente del Camion'
                                label='Patente Camion de Despacho'
                                labelPosition='left'
                                ref={refTrailerInput}
                                value={trlr_nbr}
                                onChange={e => setTrailer(e.target.value.toUpperCase().trim())}
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

export default TrailerScreen;