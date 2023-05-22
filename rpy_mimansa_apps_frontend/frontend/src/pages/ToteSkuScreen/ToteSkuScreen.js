import React, { useState, useEffect, useRef } from 'react'
import { useHistory } from 'react-router-dom';
import { Grid, Header, Icon, Input, Segment, Divider, Loader } from 'semantic-ui-react'
import MainMenu from '../../components/MainMenu';
import PopUpMessage from '../../components/PopupMessage';
import { apiValidateSKU, apiCancelTote } from '../../services/api';
import ProgressTab from '../../components/ProgressTab';

const ToteSkuScreen = () => {

    let history = useHistory();
    const refSKUInput = useRef(null);

    const [loading, setLoading] = useState(false);

    const [skuid, setSKUId] = useState("");
    const [alert, setAlert] = useState(false);
    const [error, setError] = useState("");

    const [login_user_id, setUserId] = useState("");
    const [tote_id, setTOTEId] = useState("");
    const [tote_type, setToteType] = useState("");
    const [location, setLocation] = useState("");
    const [whse_name, setWhseName] = useState("");

    const [sku, setSKU] = useState("");
    const [distinct_carton, setCartons] = useState("");
    const [classification, setClassification] = useState("");
    const [push_url, setPushUrl] = useState("");

    const [severity, setSeverity] = useState("success");
    const [readonly, setReadOnly] = useState(false);

    const handleKeyUp = e => {
        if (e.keyCode === 13) {
            console.log(readonly);
            if (skuid === "") {
                setSKUId("");
                setReadOnly(false);
            } else if ( !readonly ) {
                if (skuid === "") {
                    setError("Favor escanear el SKU");
                    setAlert(true);
                } else {
                    validateSKUId();
                    setSKUId("");
                }
            }
        }
    }

    useEffect(() => {

        var scanInfo = JSON.parse(sessionStorage.getItem("scanInfo"));

        if (scanInfo === null || scanInfo.tote_id === undefined) {
            history.push("/tote");
        } else {
            setTOTEId(scanInfo.tote_id);
            setToteType(scanInfo.tote_type);
            setUserId(scanInfo.login_user_id);
            setLocation(scanInfo.location);
            setWhseName(scanInfo.whse_name);

            setSKU(scanInfo.distinct_skus);
            setCartons(scanInfo.distinct_carton);
            setClassification(scanInfo.classification);
        }
        if (scanInfo !== null && scanInfo.skuid !== undefined) {
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

                tote_id: scanInfo.tote_id,
                tote_type: scanInfo.tote_type,
                tote_status: scanInfo.tote_status,
                tote_status_text: scanInfo.tote_status_text,
                distinct_skus: scanInfo.distinct_skus,
                distinct_carton: scanInfo.distinct_carton,
                requiring_vas: scanInfo.requiring_vas,
                classification: scanInfo.distinct_classifications,
            };
            sessionStorage.setItem("scanInfo", JSON.stringify(newInfo));
        }

    }, [history]);

    const validateSKUId = () => {

        setLoading(true);
        setReadOnly(true);

        var scanInfo = JSON.parse(sessionStorage.getItem("scanInfo"));

        if (skuid === "CANCEL") {
            apiCancelTote({ tote: scanInfo.tote_id, tote_type:scanInfo.tote_type, login_user_id: scanInfo.login_user_id, whse: scanInfo.whse, reserve_locn: scanInfo.reserve_locn })
                .then(res => {
                    console.log('===== res: ', res);
                    setLoading(false);
                    if (res) {
                        setPushUrl("/tote");
                        setError(res.message);
                        setSeverity("success");
                        setAlert(true);
                    }
                })
                .catch(function (error) {
                    // Handle Errors here.
                    setSeverity("error");
                    setLoading(false);
                    setReadOnly(false);
                    console.log('===== error: ', error.message);
                    setError(error.message);
                    setAlert(true);
                    // ...
                });
        } else {
            apiValidateSKU({ whse: scanInfo.whse, tote: scanInfo.tote_id, sku_brcd: skuid, login_user_id: scanInfo.login_user_id })
                .then(res => {
                    console.log('===== res: ', res);
                    setLoading(false);
                    if (res) {
                        var scanInfo = JSON.parse(sessionStorage.getItem("scanInfo"));
                        var newObj = Object.assign({}, scanInfo, { skuid: skuid, image: res.sku_image_url, image_list: res.sku_image_list, desc: res.sku_desc, dsp_sku: res.dsp_sku, next_carton: res.next_carton_details.next_carton_nbr, qty: res.next_carton_details.next_carton_qty, rte_id:res.next_carton_details.next_carton_rte_id,sku_brcd_list: res.sku_brcd_list });
                        sessionStorage.setItem("scanInfo", JSON.stringify(newObj));

                        if (res.next_carton_details.next_carton_nbr === '')
                        {
                            setError('No hay mas cartones para empacar para este tote.');
                            setAlert(true);
                            setPushUrl('/tote');
                        }
                        else
                        {
                            history.push('/tote_sku_carton');
                        }
                    }
                })
                .catch(function (error) {
                    // Handle Errors here.
                    setSeverity("error");
                    setLoading(false);
                    setReadOnly(false);
                    console.log('===== error apiValidateSKU: ', error.message);
                    setError(error.message);
                    setAlert(true);
                    // ...
                });
        }


    }

    const onClose = () => {
        setSKUId("");
        setAlert(false);
        refSKUInput.current.focus();
        if (push_url !== "")
        {
            history.push(push_url);
        }
    }

    return (
        <Grid centered>
            <Grid.Row></Grid.Row>
            <MainMenu/>
            <Grid.Row>
                <Grid.Column width={4} />
                <Grid.Column width={8}>
                    <Header align="center" as='h1'>Empacar Desde TOTE - {tote_type}</Header>
                </Grid.Column>
                <Grid.Column width={4}>
                    <Header as='h5' floated='right'>{login_user_id} @ {location} @ {whse_name}</Header>
                </Grid.Column>
            </Grid.Row>
            <ProgressTab tote_tab_active={true} tote_tab_disabled={false}
                         location_tab_active={true} location_tab_disabled={false}
                         sku_tab_active={true} sku_tab_disabled={false}
                         />
            <Grid.Row centered columns={4}>
                <Grid.Column align="center">
                    <Segment.Group align="center" verticalAlign='middle' padded='very' clearing>
                        <Segment><Header as='h4'><Icon name='box'/>{tote_id} ({tote_type})</Header></Segment>
                        <Segment>DISTINTOS SKUs: {sku}</Segment>
                        <Segment>CARTÓNES: {distinct_carton}</Segment>
                        <Segment>CLASIFICACIÓN: {classification}</Segment>
                        <Segment>
                            <Divider hidden />
                            <Input autoFocus
                                    fluid
                                    placeholder='Ingresar el SKU'
                                    label='SKU'
                                    labelPosition='left'
                                    ref={refSKUInput}
                                    value={skuid}
                                    onChange={e => setSKUId(e.target.value.toUpperCase().trim())}
                                    onKeyUp={handleKeyUp}
                                    InputProps={{ readOnly: Boolean(loading), }}
                                />
                            <Divider hidden />
                            {loading && <Loader active inline='centered' />}
                        </Segment>
                    </Segment.Group>
                </Grid.Column>
            </Grid.Row>
            <Grid.Row>
                <PopUpMessage error={error} severity={severity} open={alert} onClose={() => onClose(error)}/>
            </Grid.Row>
        </Grid>
    )
}

export default ToteSkuScreen;