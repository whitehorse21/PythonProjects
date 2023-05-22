import { Grid, Header, Divider } from 'semantic-ui-react'
import LocnPrinterMapForm from './LocnPrinterMapForm'
import MainMenu from '../../components/MainMenu';

const  LocnPrinterMapEdit = () => {

    return (
        <>
            <Grid centered>
                <Grid.Row/>
                <MainMenu/>
                <Grid.Row centered columns={4}>
                    <Divider hidden />
                    <Grid.Column align="center">
                        <Header align="center" as='h1'>Maestro de Ubicaciones</Header>
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                    <Grid.Column width={5}>
                        <LocnPrinterMapForm mode="edit"></LocnPrinterMapForm>
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row centered></Grid.Row>
            </Grid>
        </>
    )
}

export default LocnPrinterMapEdit;