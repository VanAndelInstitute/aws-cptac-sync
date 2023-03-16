// App.js
import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { Auth, Hub } from 'aws-amplify';
import { Nav, Navbar, NavItem } from 'react-bootstrap';
import Routes from './Routes';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isAuthenticated: false,
      isDataManager: false
    };
  }

  componentDidMount() {
    Hub.listen("auth", async ({ payload: { event, data } }) => {
      switch (event) {
        case "signIn":
          var session = await Auth.currentSession();
          this.setState({ isDataManager: session.idToken.payload['cognito:groups'].includes('Data_Manager') });
          this.setState({ isAuthenticated: true });
          break;
        case "signOut":
          this.setState({ isDataManager: false });
          this.setState({ isAuthenticated: false });
          break;
      }
    });

    Auth.currentSession()
    .then(session => {
      this.setState({ isAuthenticated: true });
      this.setState({ isDataManager: session.idToken.payload['cognito:groups'].includes('Data_Manager') });
    })
    .catch(() => {
      this.setState({ isDataManager: false });
      this.setState({ isAuthenticated: false });
    });
  };

  render() {
    const childProps = {
      isAuthenticated: this.state.isAuthenticated,
      isDataManager: this.state.isDataManager
    };
    return (
      <div className="App container">
        <Navbar collapseOnSelect variant="dark" bg="primary" expand="lg">
          <Navbar.Brand href="/">
            CPTAC Sync
          </Navbar.Brand>
          <Navbar.Collapse id="responsive-navbar-nav">
            {this.state.isDataManager ? (
              <Nav className="mr-auto">
                <Nav.Link href="/shipmentreceipts">Shipment Receipts</Nav.Link>
                <Nav.Link href="/molecularqcs">Molecular QCs</Nav.Link>
                <Nav.Link href="/iscans">iScans</Nav.Link>
                <Nav.Link href="/proteins">Proteins</Nav.Link>
              </Nav>
            ) : (
              <Nav className="mr-auto">
                <div>&nbsp;</div>
              </Nav>
            )}
            <Nav>
              {this.state.isAuthenticated ? (
                <NavItem className="nav-link" onClick={() => Auth.signOut()}>Logout</NavItem>
              ) : (
                <NavItem className="nav-link" onClick={() => Auth.federatedSignIn()}>Login</NavItem>
              )}
            </Nav>
          </Navbar.Collapse>
        </Navbar>
        <Routes childProps={childProps} />
      </div>
    );
  }
}

export default withRouter(App);
