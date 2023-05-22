import React, { useState, useEffect, useRef } from 'react'
import { useHistory } from 'react-router-dom';
import { Grid, Header, Input, Segment, Divider, Loader } from 'semantic-ui-react'
import MainMenu from '../../components/MainMenu';
import PopUpMessage from '../../components/PopupMessage';
import { apiValidateLPNId } from '../../services/api';
import ProgressTab from '../../components/ProgressTab';

const ToteScreen = () => {

    let history = useHistory();
    const refToteInput = useRef(null);

    const [loading, setLoading] = useState(false);

    const [login_user_id, setUserId] = useState("");
    const [location, setLocation] = useState("");
    // const [reserve_locn, setReserveLocn] = useState("");

    const [tote_id, setTOTEId] = useState("");
    const [alert, setAlert] = useState(false);
    const [error, setError] = useState("");
    const [whse_name, setWhseName] = useState("");


    const handleKeyUp = e => {
        if (e.keyCode === 13) {
            if (tote_id === "") {
                setTOTEId("");
            } else if (tote_id === "") {
                setError("Favor escanear el ID de TOTE");
                setAlert(true);
            } else {
                validateLPNId();
                setTOTEId("");
            }
        }
    }

    useEffect(() => {
        var scanInfo = JSON.parse(sessionStorage.getItem("scanInfo"));

        if (scanInfo === null || scanInfo.location === undefined) {
            history.push("/location");
        } else {
            if (scanInfo !== null && scanInfo.tote_id !== undefined) {
                var newInfo = {
                    login_user_id: scanInfo.login_user_id,
                    whse: scanInfo.whse,
                    whse_name: scanInfo.whse_name,
                    location: scanInfo.location,
                    dsp_locn: scanInfo.dsp_locn,
                    reserve_locn: scanInfo.reserve_locn,
                    staging_locn: scanInfo.staging_locn,
                    printer_name: scanInfo.printer_name,
                    print_mode: scanInfo.print_mode,
                };
                sessionStorage.setItem("scanInfo", JSON.stringify(newInfo));
            }
            if (scanInfo !== null) {
                setUserId(scanInfo.login_user_id);
                setLocation(scanInfo.location);
                setWhseName(scanInfo.whse_name);
                // setReserveLocn(scanInfo.reserve_locn);
            }
        }

    }, [history]);

    const validateLPNId = () => {

        setLoading(true);

        var scanInfo = JSON.parse(sessionStorage.getItem("scanInfo"));

        apiValidateLPNId({ whse: scanInfo.whse, tote: tote_id, login_user_id: scanInfo.login_user_id, reserve_locn: scanInfo.reserve_locn})
            .then(res => {
                console.log('===== res: ', res);
                setLoading(false);
                if (res) {
                    var scanInfo = JSON.parse(sessionStorage.getItem("scanInfo"));
                    console.log(" == whse = ", scanInfo.whse)
                    var newObj = Object.assign({}, scanInfo, { tote_id: tote_id, tote_type: res.tote_details.tote_type, tote_status: res.tote_details.tote_status, tote_status_text: res.tote_details.tote_status_text, distinct_skus: res.tote_details.distinct_skus, distinct_carton: res.tote_details.distinct_carton, requiring_vas: res.tote_details.requiring_vas,  classification: res.tote_details.distinct_classifications,  });
                    sessionStorage.setItem("scanInfo", JSON.stringify(newObj));
                    history.push('/tote_sku');
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
        setTOTEId("");
        setAlert(false);
        refToteInput.current.focus();
    }

    return (
        <Grid centered>
            <Grid.Row></Grid.Row>
            <MainMenu/>
            <Grid.Row>
                <Grid.Column width={4} />
                <Grid.Column width={8}>
                    <Header align="center" as='h1'>Empacar Desde TOTE</Header>
                </Grid.Column>
                <Grid.Column width={4}>
                    <Header as='h5' floated='right'>{login_user_id} @ {location} @ {whse_name}</Header>
                </Grid.Column>
            </Grid.Row>
            <ProgressTab tote_tab_active={true} tote_tab_disabled={false}
                         location_tab_active={true} location_tab_disabled={false}
                         />
            <Grid.Row centered columns={4}>
                <Grid.Column align="center">
                    <Segment align="center" verticalAlign='middle' padded='very' clearing>
                        <Input autoFocus
                                fluid
                                placeholder='Ingresar el TOTE'
                                label='TOTE'
                                labelPosition='left'
                                ref={refToteInput}
                                value={tote_id}
                                onChange={e => setTOTEId(e.target.value.toUpperCase().trim())}
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

export default ToteScreen;