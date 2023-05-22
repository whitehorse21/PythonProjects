import React from "react";
import { Button, Header, Icon, Modal, Message } from "semantic-ui-react";
import errSound from "../assets/err.mp3";
class PopUpMessage extends React.Component {
  constructor(props) {
    super(props);
    this.state = { open: false };
  }

  open = () => this.setState({ open: true });
  close = () => this.setState({ open: false });

  componentDidUpdate(prevProps, prevState) {
    if (this.state.open) {
      console.log("playing sound ~~~~~~~~~~~~");
      const audio = new Audio(errSound);
      audio.play();
    }
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (prevState.open !== nextProps.open) {
      return { open: nextProps.open };
    }

    return null;
  }

  render() {
    return (
      <div>
        <Modal open={this.state.open} onClose={this.props.onClose} size="mini">
          <Header icon>
            {this.props.severity === "success" ? (
              <Icon color="green" name="thumbs up" />
            ) : (
              <Icon color="red" name="warning sign" />
            )}
          </Header>
          <Modal.Content align="center">
            {this.props.severity === "success" ? (
              <Message size="huge" success>
                <Message.Header>Info</Message.Header>
                {this.props.error}
              </Message>
            ) : (
              <Message size="huge" negative>
                <Message.Header>Error</Message.Header>
                {this.props.error}
              </Message>
            )}
          </Modal.Content>
          <Modal.Actions>
            <Button autoFocus onClick={this.props.onClose}>
              Cerrar
            </Button>
          </Modal.Actions>
        </Modal>
      </div>
    );
  }
}

export default PopUpMessage;
