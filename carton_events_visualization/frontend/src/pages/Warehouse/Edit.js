import { Grid, Header, Divider, Icon} from 'semantic-ui-react'
import MainMenu from '../../components/MainMenu';
import WareHouseForm from './WareHouseForm'

const  WarehouseEdit = () => {
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
                <Grid.Row centered>
                    <Grid.Column width={7}>
                        <WareHouseForm mode="edit"></WareHouseForm>
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row centered></Grid.Row>
            </Grid>
        </>
    )
}

export default WarehouseEdit;