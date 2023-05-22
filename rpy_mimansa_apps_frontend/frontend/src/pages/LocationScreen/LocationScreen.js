import React, { useState, useEffect, useRef } from 'react'
import { useHistory } from 'react-router-dom';
import { Grid, Header, Input, Segment, Divider, Loader } from 'semantic-ui-react'
import MainMenu from '../../components/MainMenu';
import PopUpMessage from '../../components/PopupMessage';
import ProgressTab from '../../components/ProgressTab';
import { apiValidateLocation } from '../../services/api';

const LocationScreen = () => {

    let history = useHistory();
    const refLocationInput = useRef(null);

    const [loading, setLoading] = useState(false);

    const [login_user_id, setUserId] = useState("");
    const [whse, setWhse] = useState("");
    const [whse_name, setWhseName] = useState("");

    const [location, setLocation] = useState("");
    const [alert, setAlert] = useState(false);
    const [error, setError] = useState("");

    const handleKeyUp = e => {
        if (e.keyCode === 13) {
            if (location === "") {
                setLocation("");
            } else if (location === "") {
                setError("Ingreso de la ubicación es obligatorio.")
                setAlert(true);
            } else {
                validateLocation();
                setLocation("");
            }
        }
    }

    useEffect(() => {
        var scanInfo = JSON.parse(sessionStorage.getItem("scanInfo"));
        console.log('Location screen');
        console.log(scanInfo);

        if (scanInfo === null || scanInfo.login_user_id === undefined) {
            history.push("/login");
        } else {
            if (scanInfo !== null && scanInfo.location !== undefined) {
                var newInfo = { login_user_id: scanInfo.login_user_id, whse: scanInfo.whse, whse_name: scanInfo.whse_name };
                sessionStorage.setItem("scanInfo", JSON.stringify(newInfo));
            }
            if (scanInfo !== null) {
                setUserId(scanInfo.login_user_id);
                setWhse(scanInfo.whse);
                setWhseName(scanInfo.whse_name);
            }
        }

    }, [history]);


    const validateLocation = () => {

        setLoading(true);

        var scanInfo = JSON.parse(sessionStorage.getItem("scanInfo"));

        apiValidateLocation({ whse: whse, locn_brcd: location, login_user_id: scanInfo.login_user_id })
            .then(res => {
                console.log('===== res: ', res);
                setLoading(false);
                if (res) {
                    var scanInfo = JSON.parse(sessionStorage.getItem("scanInfo"));
                    var newObj = Object.assign({}, scanInfo, { location:location, dsp_locn: res.dsp_locn, reserve_locn: res.reserve_locn, staging_locn: res.staging_locn, control_locn: res.control_locn, printer_name: res.printer_name, print_mode: res.print_mode, }); //location: location,
                    sessionStorage.setItem("scanInfo", JSON.stringify(newObj));
                    history.push('/tote');
                }
            })
            .catch(function (error) {
                // Handle Errors here.
                setLoading(false);
                console.log('===== error: ', error);
                setError(error.message);
                setAlert(true);
                // ...
            });

    }

    const onClose = () => {
        console.log("Entered onClose of Location screen");
        setLocation("");
        setAlert(false);
        refLocationInput.current.focus();
    }

    return (
        <Grid>
            <Grid.Row></Grid.Row>
            <MainMenu login_user_id={login_user_id} whse_name={whse_name} />
            <Grid.Row>
                <Grid.Column width={4} />
                <Grid.Column width={8}>
                    <Header align="center" as='h1'>Empacar Desde TOTE</Header>
                </Grid.Column>
                <Grid.Column width={4}>
                    <Header as='h5' floated='right'>{login_user_id} @ {whse_name}</Header>
                </Grid.Column>
            </Grid.Row>
            <ProgressTab location_tab_active={true} location_tab_disabled={false}/>
            <Grid.Row centered columns={4}>
                <Grid.Column align="center">
                    <Segment align="center" verticalAlign='middle' padded='very' clearing>
                        <Input autoFocus
                                fluid
                                placeholder="Escanear ubicación VAS"
                                label='Ubicación'
                                labelPosition='left'
                                ref={refLocationInput}
                                value={location}
                                onChange={e => setLocation(e.target.value.toUpperCase().trim())}
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

export default LocationScreen;