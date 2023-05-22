import React, { useState, useEffect } from 'react'
import { Button, Form, Select, Divider, Loader, Icon } from 'semantic-ui-react'
import { useHistory } from 'react-router-dom';
import axios from 'axios'
import PopUpMessage from '../../components/PopupMessage';
import { restApiSettings } from "../../services/api";

const print_mode_choices = [{key:'DIRECT', text: 'DIRECT', value: 'DIRECT'},{key:'QUEUE', text: 'QUEUE', value: 'QUEUE'},];

const  LocnPrinterMapEdit = (props) => {
    let history = useHistory();

    const [loading, setLoading] = useState(false);

    const [whse_code, setWhseCode] = useState("");
    const [reserve_locn, setReserveLocn] = useState("");
    const [staging_locn, setStagingLocn] = useState("");
    const [control_locn, setControlLocn] = useState("");
    const [printer_name, setPrinterName] = useState("");
    const [print_mode, setPrinterMode] = useState("");
    const [id, setId] = useState("");

    const [warehouse_list, setWarehouseList] = useState([]);
    const [push_url, setPushUrl] = useState("");

    const [open, setOpen] = useState(false);
    const [alert_msg, setAlertMsg] = useState("");
    const [severity, setSeverity] = useState("success");

    useEffect(() => {
        getWhseList();
        const pathParts = history.location.pathname.split("/");
        if (pathParts.length > 3) {
            console.log("== query = ", pathParts[3]);
            setId(pathParts[3]);
            getData(pathParts[3]);
        }
    }, []);

    const getWhseList = ()  => {
        axios.get(`${restApiSettings.baseURL}/warehouse/`)
            .then(res => {
                console.log(res)

                setWarehouseList(res.data.map(d => ({
                    "key" : d.code,
                    "value" : d.code,
                    "text" : d.code + ' : ' + d.name,
                  })));
            })
    }

    const getData = (id)  => {
        axios.get(`${restApiSettings.baseURL}/locnprintermap/?id=${id}`)
            .then(res => {
                console.log(res)
                setWhseCode(res.data[0].whse_code);
                setReserveLocn(res.data[0].reserve_locn);
                setStagingLocn(res.data[0].staging_locn);
                setControlLocn(res.data[0].control_locn);
                setPrinterName(res.data[0].printer_name);
                setPrinterMode(res.data[0].print_mode);
            })
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if (whse_code === "" || reserve_locn === "" || staging_locn === "" || control_locn === "" || printer_name === "" || print_mode === "") {
            if (whse_code === "") {
                setAlertMsg("Selección de la bodega es obligatorio.");
            } else if (reserve_locn === "") {
                setAlertMsg("Ingreso de la ubicación VAS es obligatorio .");
            } else if (staging_locn === "") {
                setAlertMsg("Ingreso de la ubicación de anclaje es obligatorio .");
            } else if (control_locn === "") {
                setAlertMsg("Ingreso de la ubicación de control es obligatorio .");
            } else if (printer_name === "") {
                setAlertMsg("Ingreso del nombre de la Cola es obligatorio .");
            } else if (print_mode === "") {
                setAlertMsg("Ingreso del modo de conexion es obligatorio .");
            }

            setSeverity("warning");
            setOpen(true);
            return;
        } else {
            if (!validateReserveLocn(reserve_locn)) {
                setAlertMsg("Ubicación de VAS invalido.");
                setSeverity("warning");
                setOpen(true);
                return;
            } else if (!validateStagingLocn(staging_locn)) {
                setAlertMsg("Ubicación de anclaje invalido.");
                setSeverity("warning");
                setOpen(true);
                return;
            }
            else if (!validateControlLocn(control_locn)) {
                setAlertMsg("Ubicación de control invalido.");
                setSeverity("warning");
                setOpen(true);
                return;
            }
        }

        setLoading(true);

        let form_data = new FormData();
        form_data.append('whse_code', whse_code);
        form_data.append('reserve_locn', reserve_locn);
        form_data.append('staging_locn', staging_locn);
        form_data.append('control_locn', control_locn);
        form_data.append('printer_name', printer_name);
        form_data.append('print_mode', print_mode);
        if (props.mode==="edit")
        {
            let url = `${restApiSettings.baseURL}/locnprintermap/?id=${id}`;
            console.log("url = ", url);
            axios.put(url, form_data).then(res => {
                console.log('Put successful')
                setAlertMsg("Registro guardado exitosamente.");
                setSeverity("success");
                setOpen(true);
                setPushUrl("/locnprintermap/list");
                setLoading(false);
            }).catch(err => {
                setAlertMsg(err.response.data['message']);
                setSeverity("error");
                setOpen(true);
                setLoading(false);
            })
        }
        else if (props.mode==="add")
        {
            let url = `${restApiSettings.baseURL}/locnprintermap/`;
            console.log("url = ", url);
            axios.post(url, form_data, {
                headers: {
                    'content-type': 'multipart/form-data',
                },
            }).then(res => {
                setAlertMsg("Registro guardado exitosamente.");
                setSeverity("success");
                setOpen(true);
                setPushUrl("/locnprintermap/list");
                setLoading(false);
            }).catch(err => {
                setAlertMsg(err.response.data['message']);
                setSeverity("error");
                setOpen(true);
                setLoading(false);
            })
        }
    };

    const handlePrintModeDropdown = (event, data) =>{
        setPrinterMode(data.value);
    };

    const handleWhseDropdown = (event, data) =>{
        setWhseCode(data.value);
    };

    const handleClose = (event, reason) => {
        setOpen(false);
        if (push_url !== "")
        {
            history.push(push_url);
        }
    };

    const validateReserveLocn = locn => {
        // validate reserve_locn
        return true;
    }

    const validateStagingLocn = locn => {
        // validate reserve_locn
        return true;
    }

    const validateControlLocn = locn => {
        // validate reserve_locn
        return true;
    }

return (
    <>
        <Form>
            <Select placeholder="Seleccionar la bodega" options={warehouse_list} value={whse_code} onChange={handleWhseDropdown}></Select>
            <Form.Field control='input'
                        value={reserve_locn}
                        onChange={e => setReserveLocn(e.target.value)}
                        label="Ubicacion VAS"
                        autoFocus
                        InputProps={{readOnly: Boolean(loading),}}
            />
            <Form.Field control='input'
                        value={staging_locn}
                        onChange={e => setStagingLocn(e.target.value)}
                        label="Ubic. Anclaje"
                        autoFocus
                        InputProps={{readOnly: Boolean(loading),}}
            />
            <Form.Field control='input'
                        value={control_locn}
                        onChange={e => setControlLocn(e.target.value)}
                        label="Ubic. Control"
                        autoFocus
                        InputProps={{readOnly: Boolean(loading),}}
            />
            <Form.Field control='input'
                        value={printer_name}
                        onChange={e => setPrinterName(e.target.value)}
                        label="Nombre de la Cola"
                        autoFocus
                        InputProps={{readOnly: Boolean(loading),}}
            />
            <Select placeholder="Seleccionar el modo" options={print_mode_choices} value={print_mode} onChange={handlePrintModeDropdown}></Select>
            <Divider hidden />
            {loading && <Loader active inline='centered' />}
            <Button icon labelPosition='left' primary type="submit" onClick={handleSubmit}><Icon name='save'/>Guardar</Button>
            <Button icon labelPosition='left' secondary onClick={() => history.push("/locnprintermap/list")}><Icon name='list'/>Listar</Button>
        </Form>
        <PopUpMessage open={open} onClose={handleClose} severity={severity} error={alert_msg} />
    </>
    )
}

export default LocnPrinterMapEdit;