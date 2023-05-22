import React from 'react';
import { Grid, Step, Icon } from 'semantic-ui-react'
import {Link} from 'react-router-dom';

class ProgressTab extends React.Component {

  static defaultProps = {
    location_tab_active:false,
    location_tab_disabled:true,
    tote_tab_active:false,
    tote_tab_disabled:true,
    sku_tab_active:false,
    sku_tab_disabled:true,
    sku_carton_tab_active:false,
    sku_carton_tab_disabled:true,
}

render() {
      return (
        <Grid.Row size='tiny'>
          <Grid.Column width={4}></Grid.Column>
          <Grid.Column width={8}>
          <Step.Group attached size='tiny' fluid>
            <Step active={this.props.location_tab_active} disabled={this.props.location_tab_disabled} as={Link} to='/location'>
              <Icon name='location arrow' />
              <Step.Content>
                <Step.Title>Ubicación</Step.Title>
              </Step.Content>
            </Step>

            <Step active={this.props.tote_tab_active } disabled={this.props.tote_tab_disabled } as={Link} to='/tote'>
              <Icon name='box' />
              <Step.Content>
                <Step.Title>TOTE</Step.Title>
              </Step.Content>
            </Step>

            <Step active={this.props.sku_tab_active } disabled={this.props.sku_tab_disabled } as={Link} to='/tote_sku'>
              <Icon name='boxes' />
              <Step.Content>
                <Step.Title>SKU</Step.Title>
              </Step.Content>
            </Step>
            <Step active={this.props.sku_carton_tab_active } disabled={this.props.sku_carton_tab_disabled } as={Link} to='/tote_sku_carton'>
              <Icon name='dolly flatbed' />
              <Step.Content>
                <Step.Title>SKU/Carton</Step.Title>
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