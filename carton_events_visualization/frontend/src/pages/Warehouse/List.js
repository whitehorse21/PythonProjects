import React, { useState, useEffect } from 'react'
import { Grid, Header, Icon, Divider, Loader, Table, Button } from 'semantic-ui-react'
import { useHistory } from 'react-router-dom';
import MainMenu from '../../components/MainMenu';
import axios from 'axios'
import PopUpMessage from '../../components/PopupMessage';
import { restApiSettings } from "../../services/api";
import { useConfirm } from 'material-ui-confirm';

const WarehouseList = () => {
    let history = useHistory();
    const confirm = useConfirm();

    const [warehouse_list, setWarehouseList] = useState([]);
    const [loading, setLoading] = useState(false);

    const [open, setOpen] = useState(false);
    const [alert_msg, setAlertMsg] = useState("");
    const [severity, setSeverity] = useState("success");

    useEffect(() => {
        getList();
    }, []);

    const getList = ()  => {
        setLoading(true);
        axios.get(`${restApiSettings.baseURL}/warehouse/`)
            .then(res => {
                console.log(res)
                setWarehouseList(res.data);
                setLoading(false);
            }).catch(err => {
                setLoading(false);
            });
    }

    const deleteRow = (code) => {
        confirm({ title:'Confirmación', description: '¿Desea eliminar la bodega?', 'confirmationText':'Si' })
            .then(() => {
                setLoading(true);
                axios.delete(`${restApiSettings.baseURL}/warehouse/?code=${code}`)
                    .then(res => {
                        setAlertMsg("La bodega fue eliminada exitosamente.");
                        setSeverity("success");
                        setOpen(true);
                        getList();
                    }).catch(err => {
                        console.log(" error = ", err.response.data);
                        let errMsg = err.response.data;
                        errMsg = err.response.data.substr(1, errMsg.length - 2);
                        setAlertMsg(errMsg);
                        setSeverity("error");
                        setOpen(true);
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
                <Icon name='warehouse' size='big'/>
                <Divider hidden />
                    <Grid.Column align="center">
                        <Header align="center" as='h1'>Maestro de Bodega</Header>
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row centered>
                    <Grid.Column width={14}>
                        <Button icon labelPosition='left' primary onClick={() => history.push("/warehouse/create")}><Icon name='add'/>Agregar</Button>
                        {loading && <Loader active inline='centered' />}
                        <Table celled compact textAlign='center' color='blue' size="small">
                            <Table.Header>
                                <Table.Row>
                                    <Table.HeaderCell >N.</Table.HeaderCell>
                                    <Table.HeaderCell >Código</Table.HeaderCell>
                                    <Table.HeaderCell >Nombre</Table.HeaderCell>
                                    <Table.HeaderCell >RUT</Table.HeaderCell>
                                    <Table.HeaderCell >Dirección Linea 1</Table.HeaderCell>
                                    <Table.HeaderCell >Dirección Linea 2</Table.HeaderCell>
                                    <Table.HeaderCell >Comuna</Table.HeaderCell>
                                    <Table.HeaderCell >Ciudad</Table.HeaderCell>
                                    <Table.HeaderCell >Region</Table.HeaderCell>
                                    <Table.HeaderCell >Código Postal</Table.HeaderCell>
                                    <Table.HeaderCell >Fono</Table.HeaderCell>
                                    <Table.HeaderCell >Fecha Creación</Table.HeaderCell>
                                    <Table.HeaderCell >Fecha Modificación</Table.HeaderCell>
                                    <Table.HeaderCell >Acción</Table.HeaderCell>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                            {
                                warehouse_list.map((warehouse, i) =>
                                    <Table.Row key={i}>
                                        <Table.Cell key={"no_" + i} >{ i + 1 }</Table.Cell>
                                        <Table.Cell key={"code_" + i} >{warehouse.code}</Table.Cell>
                                        <Table.Cell key={"name_" + i} >{warehouse.name}</Table.Cell>
                                        <Table.Cell key={"rut_" + i} >{warehouse.rut}</Table.Cell>
                                        <Table.Cell key={"addr_line_1_" + i} >{warehouse.addr_line_1}</Table.Cell>
                                        <Table.Cell key={"addr_line_2_" + i} >{warehouse.addr_line_2}</Table.Cell>
                                        <Table.Cell key={"locality_" + i} >{warehouse.locality}</Table.Cell>
                                        <Table.Cell key={"city_" + i} >{warehouse.city}</Table.Cell>
                                        <Table.Cell key={"state_" + i} >{warehouse.state}</Table.Cell>
                                        <Table.Cell key={"zipcode_" + i} >{warehouse.zipcode}</Table.Cell>
                                        <Table.Cell key={"phone_" + i} >{warehouse.phone}</Table.Cell>
                                        <Table.Cell key={"creation_date_" + i} >{warehouse.creation_date}</Table.Cell>
                                        <Table.Cell key={"modification_date_" + i} >{warehouse.modification_date}</Table.Cell>
                                        <Table.Cell key={"action_" + i} style={{ wordWrap: 'no-wrap'}}>
                                            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"/>
                                            <Button onClick={ e => history.push(`/warehouse/edit/${warehouse.code}`)}><Icon name='edit'/></Button>
                                            <Button onClick={ e => deleteRow(warehouse.code)}><Icon name='trash alternate'/></Button>
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

export default WarehouseList;
