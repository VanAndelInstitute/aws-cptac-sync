import React, { Component } from "react";
import { Auth, Hub } from 'aws-amplify';
import "./Home.css";

export default class Home extends Component {
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
  }
  render() {
    return (
      <div className="Home">
        <div className="lander">
          { !this.state.isAuthenticated
            && <div class="alert alert-primary" role="alert">Please log in to continue.</div> }
          { this.state.isAuthenticated
            && !this.state.isDataManager
            && <div class="alert alert-danger" role="alert">You are not authorized to use this application.</div> }
        </div>
      </div>
    );
  }
}