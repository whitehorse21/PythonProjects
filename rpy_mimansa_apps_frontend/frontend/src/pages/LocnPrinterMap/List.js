import React, { useState, useEffect } from 'react'
import { Grid, Header, Icon, Divider, Table, Button, Loader } from 'semantic-ui-react'
import { useHistory } from 'react-router-dom';
import MainMenu from '../../components/MainMenu';
import axios from 'axios'
import PopUpMessage from '../../components/PopupMessage';
import { restApiSettings } from "../../services/api";
import { useConfirm } from 'material-ui-confirm';

const LocnPrinterMapList = () => {
    let history = useHistory();
    const confirm = useConfirm();

    const [locnprintermap_list, setLocnPrinterMapList] = useState([]);
    const [loading, setLoading] = useState(false);

    const [open, setOpen] = useState(false);
    const [alert_msg, setAlertMsg] = useState("");
    const [severity, setSeverity] = useState("success");

    useEffect(() => {
        getList();
    }, []);

    const getList = ()  => {
        setLoading(true);
        axios.get(`${restApiSettings.baseURL}/locnprintermap/`)
            .then(res => {
                console.log(res)
                setLocnPrinterMapList(res.data);
                setLoading(false);
            }).catch(err => {
                setLoading(false);
            });
    }

    const deleteRow = (id) => {
        confirm({ title:'Confirmación', description: '¿Desea eliminar el registro?', 'confirmationText':'Si' })
            .then(() => {
                setLoading(true);
                axios.delete(`${restApiSettings.baseURL}/locnprintermap/?id=${id}`)
                    .then(res => {
                        setAlertMsg("El registro fue eliminado exitosament.");
                        setSeverity("success");
                        setOpen(true);
                        getList();
                        setLoading(false);
                    }).catch(err => {
                        setLoading(false);
                    });
            }).catch(() => {});
    }

    const handleClose = (event, reason) => {
        setOpen(false);
    };

    return (
        <>
            <Grid>
                <Grid.Row></Grid.Row>
                <MainMenu/>
                <Grid.Row centered columns={4}>
                    <Divider hidden />
                    <Grid.Column align="center">
                        <Header align="center" as='h1'>Maestro de Ubicaciónes</Header>
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row centered>
                    <Grid.Column width={14}>
                <Button icon labelPosition='left' primary onClick={() => history.push("/locnprintermap/create")}><Icon name='add'/>Agregar</Button>
                    {loading && <Loader active inline='centered' />}
                    <Table celled compact textAlign='center' color='blue' size="small">
                        <Table.Header>
                            <Table.Row>
                                <Table.HeaderCell >N.</Table.HeaderCell>
                                <Table.HeaderCell >Warehouse</Table.HeaderCell>
                                <Table.HeaderCell >Ubic. Reserva</Table.HeaderCell>
                                <Table.HeaderCell >Ubic. Anclaje</Table.HeaderCell>
                                <Table.HeaderCell >Ubic. Control</Table.HeaderCell>
                                <Table.HeaderCell >Cola</Table.HeaderCell>
                                <Table.HeaderCell >Modo</Table.HeaderCell>
                                <Table.HeaderCell >Fecha Creación</Table.HeaderCell>
                                <Table.HeaderCell >Fecha Modificación</Table.HeaderCell>
                                <Table.HeaderCell >Acción</Table.HeaderCell>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                        {
                            locnprintermap_list.map((locnprintermap, i) =>
                                <Table.Row key={i}>
                                    <Table.Cell key={"no_" + i} >{ i + 1 }</Table.Cell>
                                    <Table.Cell key={"whse_code_" + i} >{locnprintermap.whse_code}</Table.Cell>
                                    <Table.Cell key={"reserve_locn_" + i} >{locnprintermap.reserve_locn}</Table.Cell>
                                    <Table.Cell key={"staging_locn_" + i} >{locnprintermap.staging_locn}</Table.Cell>
                                    <Table.Cell key={"control_locn_" + i} >{locnprintermap.control_locn}</Table.Cell>
                                    <Table.Cell key={"printer_name_" + i} >{locnprintermap.printer_name}</Table.Cell>
                                    <Table.Cell key={"printer_mode_" + i} >{locnprintermap.print_mode}</Table.Cell>
                                    <Table.Cell key={"creation_date_" + i} >{locnprintermap.creation_date}</Table.Cell>
                                    <Table.Cell key={"modification_date_" + i} >{locnprintermap.modification_date}</Table.Cell>
                                    <Table.Cell key={"action_" + i} style={{ wordWrap: 'no-wrap'}}>
                                        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"/>
                                        <Button onClick={ e => history.push(`/locnprintermap/edit/${locnprintermap.id}`)}><Icon name='edit'/></Button>
                                        <Button onClick={ e => deleteRow(locnprintermap.id)}><Icon name='trash alternate'/></Button>
                                    </Table.Cell>
                                </Table.Row>
                            )
                        }

                        </Table.Body>
                    </Table>
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row centered columns={4}></Grid.Row>
            </Grid>
            <PopUpMessage open={open} onClose={handleClose} error={alert_msg} severity={severity}/>
        </>
    )
}

export default LocnPrinterMapList;
