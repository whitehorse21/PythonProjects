import React, {useEffect} from 'react'
import { Grid} from 'semantic-ui-react'
import { useHistory } from 'react-router-dom';
import MainMenu from '../components/MainMenu';

const  Main = () => {
    let history = useHistory();

    useEffect(() => {
        var scanInfo = JSON.parse(sessionStorage.getItem("scanInfo"));

        if (scanInfo == null || scanInfo.login_user_id === undefined) {
            // history.push("/login");
        } else {
            var newInfo = {
                login_user_id: scanInfo.login_user_id,
                whse: scanInfo.whse,
                whse_name: scanInfo.whse_name,
            };
            sessionStorage.setItem("scanInfo", JSON.stringify(newInfo));
        }
    }, [history]);

    return (
        <>
            <Grid centered>
                <Grid.Row></Grid.Row>
                <MainMenu/>
            </Grid>
        </>
    )
}

export default Main;