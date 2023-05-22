import React from 'react'
import { Grid, Header, Divider, Icon } from 'semantic-ui-react'
import WareHouseForm from './WareHouseForm'
import MainMenu from '../../components/MainMenu';

const  WarehouseCreate = () => {

    return (
        <>
            <Grid centered>
                <Grid.Row></Grid.Row>
                <MainMenu/>
                <Grid.Row centered columns={4}>
                    <Icon name='warehouse' size='big'/>
                    <Divider hidden />
                    <Grid.Column align="center">
                        <Header align="center" as='h1'>Maestro de Bodega</Header>
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                    <Grid.Column width={7}>
                        <WareHouseForm mode="create"></WareHouseForm>
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row centered></Grid.Row>
            </Grid>
        </>
    )
}

export default WarehouseCreate;