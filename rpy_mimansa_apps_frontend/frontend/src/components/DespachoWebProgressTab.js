import React from 'react';
import { Grid, Step, Icon } from 'semantic-ui-react'
import {Link} from 'react-router-dom';

class ProgressTab extends React.Component {

  static defaultProps = {
    load_tab_active:false,
    load_tab_disabled:true,
    dock_door_tab_active:false,
    dock_door_tab_disabled:true,
    trailer_tab_active:false,
    trailer_tab_disabled:true,
    load_carton_tab_active:false,
    load_carton_tab_disabled:true,
}

render() {
      return (
        <Grid.Row size='tiny'>
          <Grid.Column width={4}></Grid.Column>
          <Grid.Column width={8}>
          <Step.Group attached size='tiny' fluid>
            <Step active={this.props.load_tab_active} disabled={this.props.load_tab_disabled} as={Link} to='/load'>
              <Icon name='boxes' />
              <Step.Content>
                <Step.Title>Carga</Step.Title>
              </Step.Content>
            </Step>

            <Step active={this.props.dock_door_tab_active } disabled={this.props.dock_door_tab_disabled } as={Link} to='/dock_door'>
              <Icon name='warehouse' />
              <Step.Content>
                <Step.Title>Puerto de Despacho</Step.Title>
              </Step.Content>
            </Step>

            <Step active={this.props.trailer_tab_active } disabled={this.props.trailer_tab_disabled } as={Link} to='/trailer'>
              <Icon name='truck' />
              <Step.Content>
                <Step.Title>Camion</Step.Title>
              </Step.Content>
            </Step>
            <Step active={this.props.load_carton_tab_active } disabled={this.props.load_carton_tab_disabled } as={Link} to='/load_carton'>
              <Icon name='box' />
              <Step.Content>
                <Step.Title>Carton</Step.Title>
              </Step.Content>
            </Step>
            </Step.Group>
            </Grid.Column>
            <Grid.Column width={4}></Grid.Column>
          </Grid.Row>
      )
    }
}

export default ProgressTab;