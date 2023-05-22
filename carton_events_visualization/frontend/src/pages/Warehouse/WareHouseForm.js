import React, { useState, useEffect } from 'react'
import { Button, Form, Icon, Loader } from 'semantic-ui-react'
import { useHistory } from 'react-router-dom';
import axios from 'axios'
import PopUpMessage from '../../components/PopupMessage';
import { restApiSettings } from "../../services/api";

const WarehouseForm = (props) => {

    let history = useHistory();

    const [loading, setLoading] = useState(false);

    const [code, setCode] = useState("");
    const [name, setName] = useState("");
    const [rut, setRut] = useState("");
    const [addr_line_1, setAddrLine1] = useState("");
    const [addr_line_2, setAddrLine2] = useState("");
    const [locality, setLocality] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [zipcode, setZipcode] = useState("");
    const [phone, setPhone] = useState("");
    const [pre_code, setPreCode] = useState("");

    const [open, setOpen] = useState(false);
    const [alert_msg, setAlertMsg] = useState("");
    const [severity, setSeverity] = useState("success");


    const handleClose = (event, reason) => {
        setOpen(false);
    };

    useEffect(() => {
        if (props.mode==="edit")
        {
            const pathParts = history.location.pathname.split("/");
            if (pathParts.length > 3) {
                console.log("== query = ", pathParts[3]);
                setPreCode(pathParts[3]);
                getData(pathParts[3]);
            }
        }
    }, []);

    const getData = (code)  => {
        axios.get(`${restApiSettings.baseURL}/warehouse/?code=${code}`)
            .then(res => {
                console.log(res)
                setCode(res.data[0].code);
                setName(res.data[0].name);
                setRut(res.data[0].rut);
                setAddrLine1(res.data[0].addr_line_1);
                setAddrLine2(res.data[0].addr_line_2);
                setLocality(res.data[0].locality);
                setCity(res.data[0].city);
                setState(res.data[0].state);
                setZipcode(res.data[0].zipcode);
                setPhone(res.data[0].phone);
            })
    }

    const handleSubmit = (e) => {
        console.log('handleSubmit called');
        e.preventDefault();
        if (code === "" || name === "" || rut === "" || addr_line_1 === "" || addr_line_2 === "" || locality === "" || city === "" || state === "" || zipcode === "" || phone === "") {
            if (code === "") {
                setAlertMsg("El ingreso de codigo de la bodega es obligatorio.");
            } else if (name === "") {
                setAlertMsg("El ingreso de nombre de la bodega es obligatorio.");
            } else if (rut === "") {
                setAlertMsg("El ingreso de RUT de la bodega es obligatorio.");
            } else if (addr_line_1 === "") {
                setAlertMsg("El ingreso de direccion linea 1 de la bodega es obligatorio.");
            } else if (addr_line_2 === "") {
                setAlertMsg("El ingreso de direccion linea 2 de la bodega es obligatorio.");
            } else if (locality === "") {
                setAlertMsg("El ingreso de comuna de la bodega es obligatorio.");
            } else if (city === "") {
                setAlertMsg("El ingreso de ciudad de la bodega es obligatorio.");
            } else if (state === "") {
                setAlertMsg("El ingreso de region de la bodega es obligatorio.");
            } else if (zipcode === "") {
                setAlertMsg("El ingreso de codigo postal de la bodega es obligatorio.");
            } else if (phone === "") {
                setAlertMsg("El ingreso de telefono de la bodega es obligatorio.");
            }

            setSeverity("warning");
            setOpen(true);
            return;
        }

        setLoading(true);

        let form_data = new FormData();
        form_data.append('code', code);
        form_data.append('name', name);
        form_data.append('rut', rut);
        form_data.append('addr_line_1', addr_line_1);
        form_data.append('addr_line_2', addr_line_2);
        form_data.append('locality', locality);
        form_data.append('city', city);
        form_data.append('state', state);
        form_data.append('zipcode', zipcode);
        form_data.append('phone', phone);

        if (props.mode==="edit")
        {
            let url = `${restApiSettings.baseURL}/warehouse/?code=${pre_code}`;
            console.log("url = ", url);
            axios.put(url, form_data, {
                headers: {
                    'content-type': 'multipart/form-data',
                },
            }).then(res => {
                setPreCode(code);
                setAlertMsg("Detalles de la bodega actualizados exitosamente");
                setSeverity("success");
                setOpen(true);
                history.push("/warehouse/list");
                setLoading(false);
            }).catch(err => {
                setAlertMsg(err.response.data['message']);
                setSeverity("error");
                setOpen(true);
                setLoading(false);
            })
        }
        else if (props.mode==="create")
        {
            let url = `${restApiSettings.baseURL}/warehouse/`;
            console.log("url = ", url);
            axios.post(url, form_data, {
                headers: {
                    'content-type': 'multipart/form-data',
                },
            }).then(res => {
                setAlertMsg("The warehouse has been created successfully.");
                setSeverity("success");
                setOpen(true);
                history.push("/warehouse/list");
                setLoading(false);
            }).catch(err => {
                setAlertMsg(err.response.data['message']);
                setSeverity("error");
                setOpen(true);
                setLoading(false);
            })
        }
    };

    return (
        <>
            <Form>
                <Form.Group widths='equal'>
                    <Form.Field control='input'
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                label="Código"
                                autoFocus
                                InputProps={{readOnly: Boolean(loading),}}
                    />
                    <Form.Field control='input'
                                value={name}
                                onChange={e => setName(e.target.value)}
                                label="Nombre"
                                autoFocus
                                InputProps={{readOnly: Boolean(loading),}}
                    />
                    <Form.Field control='input'
                                value={rut}
                                onChange={e => setRut(e.target.value)}
                                label="RUT"
                                autoFocus
                                InputProps={{readOnly: Boolean(loading),}}
                    />
                </Form.Group>
                <Form.Group widths='equal'>
                    <Form.Field control='input'
                                value={addr_line_1}
                                onChange={e => setAddrLine1(e.target.value)}
                                label="Dirección Linea 1"
                                autoFocus
                                InputProps={{readOnly: Boolean(loading),}}
                    />

                    <Form.Field control='input'
                                value={addr_line_2}
                                onChange={e => setAddrLine2(e.target.value)}
                                label="Dirección Linea 2"
                                autoFocus
                                InputProps={{readOnly: Boolean(loading),}}
                    />
                </Form.Group>
                <Form.Group widths='equal'>
                    <Form.Field control='input'
                                value={locality}
                                onChange={e => setLocality(e.target.value)}
                                label="Comuna"
                                autoFocus
                                InputProps={{readOnly: Boolean(loading),}}
                    />

                    <Form.Field control='input'
                                value={city}
                                onChange={e => setCity(e.target.value)}
                                label="Ciudad"
                                autoFocus
                                InputProps={{readOnly: Boolean(loading),}}
                    />
                    <Form.Field control='input'
                                value={state}
                                onChange={e => setState(e.target.value)}
                                label="Region"
                                autoFocus
                                InputProps={{readOnly: Boolean(loading),}}
                    />
                </Form.Group>
                <Form.Group widths='equal'>
                    <Form.Field control='input'
                                value={zipcode}
                                onChange={e => setZipcode(e.target.value)}
                                label="Código Postal"
                                autoFocus
                                InputProps={{readOnly: Boolean(loading),}}
                    />
                    <Form.Field control='input'
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                label="Fono"
                                autoFocus
                                InputProps={{readOnly: Boolean(loading),}}
                    />
                </Form.Group>
                {loading && <Loader active inline='centered' />}
                <Button icon labelPosition='left' primary type="submit" onClick={handleSubmit}><Icon name='save'/>Guardar</Button>
                <Button icon labelPosition='left' secondary onClick={() => history.push("/warehouse/list")}><Icon name='list'/>Listar</Button>
            </Form>
            <PopUpMessage open={open} onClose={handleClose} severity={severity} error={alert_msg} />
        </>
    )
}

export default WarehouseForm;