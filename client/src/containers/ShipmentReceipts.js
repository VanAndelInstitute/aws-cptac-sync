import React, { Component } from "react";
import { API } from 'aws-amplify';
import "./Restricted.css";

export default class Restricted extends Component {
  constructor(props) {
    super(props);

    this.state = {
      shipment: null
    };
  }
  
  async componentDidMount() {
    console.log('on component mount');
    var result = await API.get('api', '/receipt/I2019:000287');
    console.log(result)
    this.setShipment(result.data);
  }

  setShipment = shipment => {
    this.setState({ shipment: shipment });
  }

  secureApiCall = () => {
    return 
  }

  render() {
    return (
      <div className="Restricted">
        <div className="lander">
          <h1>Restricted Page</h1>
          <p>{this.state.shipment ? this.state.shipment.courier : ''}</p>
        </div>
      </div>
    );
  }
}