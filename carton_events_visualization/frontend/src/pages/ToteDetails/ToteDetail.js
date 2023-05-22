import React, { useState, useRef } from 'react'
import { Grid, Header, Input, Segment, Divider, Loader, Table } from 'semantic-ui-react'
import { apiGetToteDetails } from '../../services/api';
import MainMenu from '../../components/MainMenu';
import PopUpMessage from '../../components/PopupMessage';

const  ToteDetail = () => {
    const refToteInput = useRef(null);

    const [loading, setLoading] = useState(false);

    const [tote_id, setToteId] = useState("");
    const [res, setRes] = useState(null);

    const [alert, setAlert] = useState(false);
    const [error, setError] = useState("");

    const handleKeyUp = e => {
        if (e.keyCode === 13) {
            if (tote_id === undefined) {
                setToteId("");
            } else if (tote_id === "") {
                setError("Favor escanear el ID de TOTE");
                setAlert(true);
            } else {
                getToteDetails();
                setToteId("");
            }
        }
    }


    const getToteDetails = () => {

        setLoading(true);

        apiGetToteDetails({ tote: tote_id })
            .then(res => {
                console.log('===== res: ', res);
                setLoading(false)

                if (res) {
                    setRes(res);
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

    const onClose = (error) => {
        console.log("error = ", error);
        setToteId(undefined);
        setAlert(false);
        refToteInput.current.focus();
    }

    return (
        <>
            <Grid centered>
                <Grid.Row/>
                <MainMenu/>
                <Grid.Row centered columns={4}>
                    <Grid.Column align="center">
                        <Header align="center" as='h1'>Empacar Desde TOTE</Header>
                        <Header align="center" as='h3'>Detalles del TOTE</Header>
                        <Divider hidden />
                        <Segment align="center" verticalAlign='middle'>
                            <Input autoFocus
                                    fluid
                                    placeholder='Ingresar el TOTE'
                                    label='TOTE'
                                    labelPosition='left'
                                    ref={refToteInput}
                                    value={tote_id}
                                    onChange={e => setToteId(e.target.value.toUpperCase().trim())}
                                    onKeyUp={handleKeyUp}
                                    InputProps={{ readOnly: Boolean(loading), }}
                                />
                            {loading && <Loader active inline='centered' />}
                        </Segment>
                    </Grid.Column>
                </Grid.Row>
                    {res && res.tote_details &&
                        <Grid.Row centered>
                            <Grid.Column width={4}></Grid.Column>
                            <Grid.Column width={8}>
                                <Table celled compact textAlign='center' color='grey' size="small">
                                <Table.Header>
                                    <Table.Row>
                                        <Table.HeaderCell>Tote</Table.HeaderCell>
                                        <Table.HeaderCell>Tipo</Table.HeaderCell>
                                        <Table.HeaderCell>Estado</Table.HeaderCell>
                                        <Table.HeaderCell>Distintos SKUs</Table.HeaderCell>
                                        <Table.HeaderCell>Distintos Cartónes</Table.HeaderCell>
                                        <Table.HeaderCell>VAS</Table.HeaderCell>
                                        <Table.HeaderCell>Distintos Clasificaciónes</Table.HeaderCell>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    <Table.Row>
                                        <Table.Cell>{res.tote_details.tote}</Table.Cell>
                                        <Table.Cell>{res.tote_details.tote_type}</Table.Cell>
                                        <Table.Cell>{res.tote_details.tote_status_text}</Table.Cell>
                                        <Table.Cell>{res.tote_details.distinct_skus}</Table.Cell>
                                        <Table.Cell>{res.tote_details.distinct_carton}</Table.Cell>
                                        <Table.Cell>{res.tote_details.requiring_vas}</Table.Cell>
                                        <Table.Cell>{res.tote_details.distinct_classifications}</Table.Cell>
                                    </Table.Row>
                                </Table.Body>
                            </Table>
                        </Grid.Column>
                        <Grid.Column width={4}></Grid.Column>
                    </Grid.Row>
                    }
                {res && res.carton_list &&
                    <Grid.Row centered>
                        <Grid.Column width={2}></Grid.Column>
                        <Grid.Column width={12}>
                            <Table celled compact striped textAlign='center' color='teal' size="small">
                                <Table.Header>
                                    <Table.Row>
                                        <Table.HeaderCell>Carton</Table.HeaderCell>
                                        <Table.HeaderCell>Estado</Table.HeaderCell>
                                        <Table.HeaderCell>Código de Barra</Table.HeaderCell>
                                        <Table.HeaderCell>DSP SKU</Table.HeaderCell>
                                        <Table.HeaderCell>Descripción de SKU</Table.HeaderCell>
                                        <Table.HeaderCell>Cant. a Empacar</Table.HeaderCell>
                                        <Table.HeaderCell>Cant. Empacada</Table.HeaderCell>
                                        <Table.HeaderCell>Pendiente</Table.HeaderCell>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {   res.carton_list.map(carton =>
                                            <Table.Row>
                                                <Table.Cell>{carton.carton_nbr}</Table.Cell>
                                                <Table.Cell>{carton.stat_code}</Table.Cell>
                                                <Table.Cell>{carton.sku_brcd}</Table.Cell>
                                                <Table.Cell>{carton.dsp_sku}</Table.Cell>
                                                <Table.Cell>{carton.sku_desc}</Table.Cell>
                                                <Table.Cell>{carton.to_be_pakd_units}</Table.Cell>
                                                <Table.Cell>{carton.units_pakd}</Table.Cell>
                                                <Table.Cell>{carton.remaining}</Table.Cell>
                                            </Table.Row>
                                        )
                                    }
                                </Table.Body>
                            </Table>
                        </Grid.Column>
                        <Grid.Column width={2}></Grid.Column>
                    </Grid.Row>
                    }
                <Grid.Row>
                    <PopUpMessage error={error} open={alert} onClose={() => onClose(error)}/>
                </Grid.Row>
            </Grid>
        </>
    )
}

export default ToteDetail;