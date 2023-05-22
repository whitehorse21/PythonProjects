import {RSAKey, stob64, hextorstr} from 'jsrsasign';
import React, { useState, useEffect, useRef } from 'react'
import { useHistory } from 'react-router-dom';
import { Grid, Header, Icon, Input, Segment, Divider, Loader, Message, Image } from 'semantic-ui-react'
import MainMenu from '../../components/MainMenu';
import PopUpMessage from '../../components/PopupMessage';
import { apiValidateActionCode, apiValidatePackCarton, apiValidatePrintCarton } from '../../services/api';
import qz from "qz-tray";
import ImageGallery from 'react-image-gallery';
import client_logo from '../../images/Logo_Ripley_Chile.png';
import ProgressTab from '../../components/ProgressTab';

import cert_pem from '../../signing/cert.pem.js';
import key_rsa_pem from '../../signing/key.pem.js';

const SKUDetailScreen = () => {

    let history = useHistory();
    const refSKUInput = useRef(null);
    const refMonoCartonInput = useRef(null);
    const refMultiCartonInput = useRef(null);

    const [loading, setLoading] = useState(false);

    const [alert, setAlert] = useState(false);
    const [error, setError] = useState("");
    // const [skuid, setSKUId] = useState("");
    const [login_user_id, setUserId] = useState("");
    const [tote_id, setTOTEId] = useState("");
    const [tote_type, setToteType] = useState("");
    const [location, setLocation] = useState("");
    const [image_list, setImageList] = useState("");
    const [whse_name, setWhseName] = useState("");
    const [desc, setDesc] = useState("");
    const [sku, setSKU] = useState("");
    // const [dspsku, setDspSku] = useState("");
    const [next_carton, setNextCarton] = useState("");
    const [qty, setQty] = useState(0);
    const [rte_id, setRteId] = useState("");
    const [sku_brcd_list, setSkuBrcdList] = useState([]);
    const [scannedSKU, setScannedSKU] = useState(0);
    const [sku_brcd, setSkuBrcd] = useState("");
    const [scan_carton, setScanCarton] = useState("");
    const [scan_carton_feedback, setScanCartonFeedback] = useState("");
    const [scan_carton_feedback_error, setScanCartonFeedbackError] = useState(false);
    const [scan_carton_feedback_queue, setScanCartonFeedbackQueue] = useState([]);
    const [push_url, setPushUrl] = useState("");
    const [action_code_for_sku, setActionCodeForSku] = useState("");
    const [readonly, setReadOnly] = useState(false);
    const [printed, setPrinted] = useState(false);
    const [print_mode, setPrintMode] = useState("");

    const [severity, setSeverity] = useState("success");

    useEffect(() => {
        var scanInfo = JSON.parse(sessionStorage.getItem("scanInfo"));
        if (scanInfo === null || scanInfo.skuid === undefined) {
            history.push("/tote_sku");
        } else {
            // setSKUId(scanInfo.skuid);
            setTOTEId(scanInfo.tote_id);
            setToteType(scanInfo.tote_type);
            setUserId(scanInfo.login_user_id);
            setLocation(scanInfo.location);
            setImageList(scanInfo.image_list);
            setWhseName(scanInfo.whse_name);
            setDesc(scanInfo.desc);
            setSKU(scanInfo.dsp_sku);
            setNextCarton(scanInfo.next_carton);
            setQty(scanInfo.qty);
            setSkuBrcdList(scanInfo.sku_brcd_list);
            setPrintMode(scanInfo.print_mode);
            setRteId(scanInfo.rte_id)
        }
        console.log("tote_type = ", scanInfo.tote_type, "  printed = ", printed);
        if (scanInfo.tote_type === "MONO") {
            if (!printed) {
                validatePrintCarton("PRINT");
                setPrinted(true);
            }
        }
    }, [history]);


    const onClose = () => {
        setAlert(false);
        if (refSKUInput.current)
        {
            setSkuBrcd("");
            refSKUInput.current.focus();
        }
        else if (refMonoCartonInput.current)
        {
            setScanCarton("");
            refMonoCartonInput.current.focus();
        }
        else if (refMultiCartonInput.current)
        {
            setScanCarton("");
            refMultiCartonInput.current.focus();
        }
        setLoading(false);
        if (push_url !== "")
        {
            history.push(push_url);
        }
    }

    const handleSKUKeyUp = e => {
        if (e.keyCode === 13)
        {
            if (sku_brcd === "" )
            {
                setReadOnly(false);
            }
            else if ( !readonly )
            {
                if (sku_brcd_list.some(item => sku_brcd === item)) {
                    if (scannedSKU < qty) {
                        if (scannedSKU === qty - 1) {
                            validatePrintCarton("PRINT");
                        }
                        setScannedSKU(scannedSKU + 1);
                    }
                } else if (sku_brcd === "SHORT")
                {
                    if (scannedSKU > 0) {
                        validatePrintCarton("PRINT");
                        //If MONO then the user comes on this screen only after scanning a SKU
                        //so there is no question of allowing a short.
                        if (tote_type !== "MONO")
                        {
                            setActionCodeForSku("SHORT");
                        }
                    }
                    else
                    {
                        setError("Debe escanearse al menos 1 Unidad.")
                        setAlert(true);
                    }
                }
                else
                {
                    setError(`Codigo de barra incorrecto : ${sku_brcd}`)
                    setAlert(true);
                }
            }
            setSkuBrcd("");
        }
    }

    const handleCartonKeyUp = e => {
        if (e.keyCode === 13) {
            validateCarton();
        }
    }

    const inputSkuBrcd = e => {
        setSkuBrcd(e.target.value.toUpperCase())
    }

    const inputScanCarton = e => {
        setScanCarton(e.target.value.toUpperCase().trim())
    }

    const validatePrintCarton = (action_code) => {
        console.log(" == validatePrintCarton == ", action_code);
        setLoading(true);
        setReadOnly(true);

        var scanInfo = JSON.parse(sessionStorage.getItem("scanInfo"));

        apiValidatePrintCarton({ whse: scanInfo.whse, carton_nbr: next_carton===""?scanInfo.next_carton:next_carton, printer_name: scanInfo.printer_name, print_mode: scanInfo.print_mode, action_code: action_code, login_user_id: scanInfo.login_user_id })
            .then(res => {
                console.log('===== PRINT res: ', res);
                setLoading(false);
                setReadOnly(false);
                if (res) {
                    console.log('==== res.message: ', res.message);
                    console.log("== scanInfo.print_mode = ", scanInfo.print_mode);

                    setScanCartonFeedbackQueue(scan_carton_feedback_queue => [res.message, ...scan_carton_feedback_queue]);
                    // if (res.message != "") {
                    //     setError(res.message);
                    //     setSeverity("success");
                    //     setSnackBarOpen(true);
                    // }
                    if (scanInfo.print_mode === "DIRECT" && res.print_command !== "")    {
                        console.log("== print_mode = ", scanInfo.print_mode);

                        qz.security.setCertificatePromise(function (resolve, reject) {
                            resolve(cert_pem);
                        });

                        var privateKey = key_rsa_pem;

                        qz.security.setSignaturePromise(function (toSign) {
                            return function (resolve, reject) {
                                try
                                {
                                    var pk = new RSAKey();
                                    pk.readPrivateKeyFromPEMString(privateKey);
                                    var hex = pk.sign(toSign, 'sha1');
                                    resolve(stob64(hextorstr(hex)));
                                } catch (err) {
                                    console.error(err);
                                    reject(err);
                                }
                            };
                        });

                        console.log("----Cycle Started.----");
                        if (qz.websocket.isActive())
                        {
                            console.log('IsActive returned True. Disconnecting');
                            qz.websocket.disconnect();
                            console.log('Done Disconnecting');
                        };

                        qz.websocket.connect().then(() => {
                            console.log('Connected. Now finding printer.');
                            return qz.printers.find(scanInfo.printer_name);
                        }).then((printer) => {
                            console.log('Printer found. Now printing to it.');
                            let config = qz.configs.create(printer);
                            return qz.print(config, [res.print_command]);
                        }).then(() => {
                            console.log('Done printing. Now disconnecting.');
                            return qz.websocket.disconnect();
                        }).then(() => {
                            // process.exit(0);
                            console.log("----Cycle Complete.----");
                        }).catch((err) => {
                            console.error(err);
                            // process.exit(1);
                        });
                    }
                    setPrinted(true);
                }
            })
            .catch(function (error) {
                setSeverity("error");
                setLoading(false);
                setReadOnly(false);
                console.log('===== error: ', error.message);

                setError(error.message);
                setAlert(true);
        });
    }

    const validateCarton = () => {
        setLoading(true);
        setReadOnly(true);

        if (scan_carton === "" )
        {
            setLoading(false);
            return;
        }

        var scanInfo = JSON.parse(sessionStorage.getItem("scanInfo"));

        if (scan_carton === "DAMAGED" || scan_carton === "DISCREPANCY" || scan_carton === "CANCEL")
        {
            apiValidateActionCode({ whse: scanInfo.whse, carton_nbr: next_carton, action_code: scan_carton, staging_locn: scanInfo.staging_locn,  login_user_id: login_user_id })
                .then(res => {
                    console.log('===== res: ', res);
                    setLoading(false);
                    setReadOnly(false);
                    if (res) {
                        console.log('==== res.message: ', res.message);
                        setScanCartonFeedbackQueue(scan_carton_feedback_queue => [res.message, ...scan_carton_feedback_queue]);
                    }
                })
                .catch(function (error) {
                    setSeverity("error");
                    setLoading(false);
                    setReadOnly(false);
                    console.log('===== error: ', error.message);

                    setError(error.message);
                    setAlert(true);
                });
        }
        else if (scan_carton === "SHORT")
        {
            setError("SHORT no permitido si ya ha escaneado el SKU anteriormente (Carton MONO)");
            setAlert(true);
        }
        else if (scan_carton === "REPRINT")
        {
            validatePrintCarton(scan_carton);
        }
        else if (scan_carton === next_carton)
        {
            if (tote_type === "MONO") { setScannedSKU(1);}
            const cur_qty = tote_type === "MONO"?1:scannedSKU;
            apiValidatePackCarton({ whse: scanInfo.whse, carton_nbr: scan_carton, tote: tote_id, tote_type: tote_type, staging_locn: scanInfo.staging_locn, login_user_id: login_user_id, sku_id: sku, qty: cur_qty, action_code: action_code_for_sku })
                .then(res => {
                    console.log('===== res: ', res);
                    setLoading(false);
                    if (res) {
                        var next_url='';
                        setScannedSKU(0);
                        console.log('==== res.message: ', res.message);
                        scanInfo.distinct_skus = res.tote_details.distinct_skus;
                        scanInfo.distinct_carton = res.tote_details.distinct_carton;
                        scanInfo.classification = res.tote_details.distinct_classifications;

                        sessionStorage.setItem("scanInfo", JSON.stringify(scanInfo));

                        setScanCartonFeedbackQueue([]);

                        if (res.next_carton_details.next_carton_qty === 0) {
                            if (res.tote_details.tote_status === 95) {
                                console.log('1. setPushUrl("/tote")');
                                next_url="/tote";
                                setPushUrl("/tote");
                            } else {
                                console.log('2. setPushUrl("/tote_sku")');
                                next_url="/tote_sku";
                                setPushUrl("/tote_sku");
                            }
                        } else {
                            //S - Move to SKU scan instead of Next Carton Scan after completing one carton.
                            //setNextCarton(res.next_carton_details.next_carton_nbr);
                            //setQty(res.next_carton_details.next_carton_qty);
                            //E - Move to SKU scan instead of Next Carton Scan after completing one carton.
                            setScanCarton("");
                            setActionCodeForSku("");
                            setReadOnly(false);
                            if (res.tote_details.tote_status === 95) {
                                console.log('3. setPushUrl("/tote")');
                                next_url="/tote";
                                setPushUrl("/tote");
                            } else
                            {
                                console.log('4. setPushUrl("/tote_sku");');
                                next_url="/tote_sku";
                                setPushUrl("/tote_sku");
                            }
                        }

                        //START - Do not show the confirmation message upon successful carton pack.
                        //setSeverity("success");
                        //setError(res.message);
                        //setAlert(true);
                        //END
                        if (next_url !== "")
                        {
                            console.log('Going to the url: ' + next_url);
                            history.push(next_url);
                        }
                        else
                        {
                            console.log('Going to the url: ' + next_url);
                        }
                    }
                })
                .catch(function (error) {
                    setSeverity("error");
                    setLoading(false);
                    setReadOnly(false);
                    console.log('===== error: ', error.message);
                    // setScanCartonFeedbackQueue(scan_carton_feedback_queue => [...scan_carton_feedback_queue, ...error.additional_message]);
                    setError(error.message);
                    setAlert(true);
                });
        } else {
            setLoading(false);
            console.log(scan_carton, " : ", next_carton);
            setSeverity("error");
            setError("Ha escaneado un carton incorrecto.");
            setAlert(true);
        }
        setScanCarton("");
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
                         sku_carton_tab_active={true} sku_carton_tab_disabled={false}
                         />
            <Grid.Row centered columns={2}>
                <Grid.Column width={1}></Grid.Column>
                <Grid.Column width={7}>
                <Segment.Group align="center" verticalAlign='middle' padded='very' clearing>
                <Segment>
                    <Header align="center" as='h2'>{desc}</Header>
                </Segment>
                <Segment>
                {
                    image_list.length>0
                    ? <ImageGallery items={image_list}
                                    showFullscreenButton={false}
                                    autoPlay={true}
                                    showNav={false}
                                    thumbnailPosition="left"
                    />
                    : <Image src={client_logo} alt="logo"/>
                    }
                </Segment>
                </Segment.Group>
                </Grid.Column>
                <Grid.Column width={1}>
                    <Divider vertical></Divider>
                </Grid.Column>
                <Grid.Column verticalAlign='middle' width={6}>
                    <Segment.Group align="center" verticalAlign='middle' compact>
                        <Segment>
                            <Header align="center" as='h4'>TOTE: {tote_id} ({tote_type})</Header>
                            <Header align="center" as='h4'>CARTÓN: {next_carton} {rte_id!=="" && '/ RUTA: ' + rte_id}</Header>
                        </Segment>
                        <>
                        {tote_type === "MONO" &&
                            <>
                            <Segment>
                                <Input
                                        autoFocus
                                        fluid
                                        placeholder='Ingresar el Cartón'
                                        label='Cartón'
                                        labelPosition='left'
                                        ref={refMonoCartonInput}
                                        value={scan_carton}
                                        onChange={e => inputScanCarton(e)}
                                        onKeyUp={handleCartonKeyUp}
                                        InputProps={{ readOnly: Boolean(loading), }}
                                        helperText={scan_carton_feedback}
                                        error={scan_carton_feedback_error}
                                        />
                                    <Divider hidden />
                            </Segment>
                            </>
                        }
                        </>
                        {tote_type === "MULTI" &&
                        <>
                            <Segment>
                                SKU: {sku}, {sku_brcd_list.join(', ')}
                            </Segment>
                            <Segment>
                                CANT.: {qty} Unidad{qty > 0 && "es"} {
                                            scannedSKU > 0 && (`(Escaneado : ${scannedSKU} , Pendiente : ${(qty - scannedSKU)})`)
                                        }
                            </Segment>
                            {(action_code_for_sku === "" && scannedSKU < qty) &&
                                <Segment>
                                    <Input id="sku_brcd"
                                    autoFocus
                                    placeholder='Escanear el SKU'
                                    label='SKU'
                                    labelPosition='left'
                                    ref={refSKUInput}
                                    value={sku_brcd}
                                    onChange={e => inputSkuBrcd(e)}
                                    onKeyUp={handleSKUKeyUp}
                                    InputProps={{ readOnly: Boolean(loading), }}
                                    />
                                <Divider hidden />
                            </Segment>
                            }

                            {(action_code_for_sku === "SHORT" || scannedSKU === qty) &&
                            <Segment>
                                <Input
                                    autoFocus
                                    fluid
                                    placeholder='Escanear el Cartón'
                                    label='Cartón'
                                    labelPosition='left'
                                    ref={refMultiCartonInput}
                                    value={scan_carton}
                                    onChange={e => inputScanCarton(e)}
                                    onKeyUp={handleCartonKeyUp}
                                    InputProps={{ readOnly: Boolean(loading), }}
                                    />
                                <Divider hidden />
                            </Segment>
                            }
                        </>
                        }
                    </Segment.Group>
                    {loading && <Loader active inline='centered' />}
                    {scan_carton_feedback_queue &&
                    <Segment.Group compact>
                            {scan_carton_feedback_queue.map((row) => (
                                <Segment>
                                    <Message size='small'><Icon name='check' size='big'/>{row}</Message>
                                </Segment>
                            ))}
                    </Segment.Group>
                    }
                </Grid.Column>
                <Grid.Column width={1}></Grid.Column>
            </Grid.Row>
            <Grid.Row>
                <PopUpMessage error={error} severity={severity} open={alert} onClose={() => onClose(error)}/>
            </Grid.Row>
        </Grid>
    )
}

export default SKUDetailScreen;