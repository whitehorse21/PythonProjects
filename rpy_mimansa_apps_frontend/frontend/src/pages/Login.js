import React, { useState, useEffect, useRef } from 'react'
import { Grid, Header, Input, Segment, Divider } from 'semantic-ui-react'
import { LinearProgress } from '@material-ui/core'
import { useHistory } from 'react-router-dom';
import PopUpMessage from '../components/PopupMessage';
import { apiValidateUserId } from '../services/api';
import logo from '../images/logo.png';

const Login = () => {

    let history = useHistory();

    const [loading, setLoading] = useState(false);

    const [login_user_id, setUserId] = useState("");
    const [password, setPassword] = useState("");
    const [alert, setAlert] = useState(false);
    const [error, setError] = useState("");

    const refUserId = useRef(null);
    const refPassword = useRef(null);


    const handleKeyUpUserId = e => {
        if (e.keyCode === 13) {
            if (login_user_id === undefined) {
                setUserId("");
            } else if (login_user_id === "") {
                setError("El ingreso de ID de usuario es obligatorio.");
                setAlert(true);
                refUserId.current.focus();
            } else {
                refPassword.current.focus();
            }
        }
    }

    const handleKeyUpPassword = e => {
        if (e.keyCode === 13) {
            if (login_user_id === undefined) {
                setUserId("");
                refUserId.current.focus();
            } else if (login_user_id === "") {
                setError("Favor ingresar el ID de usuario.");
                setAlert(true);
                refUserId.current.focus();
            } else if (password === undefined) {
                setPassword("");
            } else if (password === "") {
                setError("Favor ingresar la contraseña");
                setAlert(true);
            } else {
                validateUserId();
            }
        }
    }

    useEffect(() => {
        sessionStorage.removeItem("scanInfo");
    }, []);

    const validateUserId = () => {

        setLoading(true);

        apiValidateUserId({ login_user_id: login_user_id, password: password })
            .then(res => {
                console.log('Response: apiValidateUserId : ', res);
                setLoading(false)

                if (res) {
                    sessionStorage.setItem("scanInfo", JSON.stringify({ login_user_id: login_user_id, whse: res.whse, whse_name: res.whse_name }));
                    history.push('/main');
                }
            })
            .catch(function (error) {
                // Handle Errors here.
                setLoading(false);
                console.log('Error: ', error);
                setUserId("");
                setPassword("");
                setError(error.message);
                setAlert(true);
            });
    }

    const onClose = (error) => {
        console.log("onClose called from Login.js");
        console.log("Error: ", error);
        setAlert(false);
    }

    return (

        <Grid centered>
            {loading &&
                    <LinearProgress color="secondary" />
                }
            <Grid.Row><img src={logo} alt="logo" /></Grid.Row>
            <Grid.Row centered columns={4}>
                <Header align="center" as='h1'>Empacar Desde TOTE / Despacho WEB</Header>
                <Grid.Column align="center">
                    <Divider hidden />
                    <Segment align="center" verticalAlign='middle' padded='very' clearing>
                        <Input autoFocus placeholder='Usuario' fluid icon='user' iconPosition='left'
                            onChange={e => setUserId(e.target.value.toUpperCase().trim())}
                            onKeyUp={handleKeyUpUserId}
                            value={login_user_id}
                            InputProps={{
                                readOnly: Boolean(loading),
                            }}
                            ref={refUserId}
                            />
                        <Divider hidden />
                        <Input placeholder='Contraseña' fluid icon='lock' iconPosition='left'
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onKeyUp={handleKeyUpPassword}
                            type="password"
                            InputProps={{
                                readOnly: Boolean(loading),
                            }}
                            ref={refPassword}
                            />
                    </Segment>
                </Grid.Column>
            </Grid.Row>
            <Grid.Row>
                {/*<AlertDialog item="User Id" error={error} open={alert} handleClose={() => onClose(error)}/> */}
                <PopUpMessage error={error} open={alert} onClose={() => onClose(error)}/>
            </Grid.Row>
        </Grid>
    )
}

export default Login;