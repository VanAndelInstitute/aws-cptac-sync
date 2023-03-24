import React, { Component } from "react";
import ShipmentContent from "./ShipmentContent";
import { Button } from 'react-bootstrap';
import { API } from 'aws-amplify';
import "./ShipmentReceipts.css";

export default class ShipmentReceipts extends Component {
  constructor(props) {
    super(props);

    this.state = {
      shipmentId: this.props.match.params.id,
      shipment: null,
      sync: null,
      syncStatus: { status: 'warning', message: 'Checking' },
      error: null
    };

    this.handleRebuild = this.handleRebuild.bind(this);
    this.handleReload = this.handleReload.bind(this);
    this.handleResync = this.handleResync.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }
  
  componentDidMount() {
    console.log('on component mount');
    if (this.state.shipmentId) {
      this.getShipment();
    }
  }

  async handleReload(event) {
    event.preventDefault();
    API.put('api', '/pullrecent/receipts');
    alert('Getting all recent shipment receipts from BSI. This may take a few minutes to complete.');
  }

  async handleRebuild(event) {
    event.preventDefault();
    API.put('api', '/receipt/' + this.state.shipment.shipmentId)
    .then(() => {
      this.getShipment(this.state.shipment.shipmentId);
    });
  }

  async handleResync(event) {
    event.preventDefault();
    API.put('api', '/receiptsync/' + this.state.shipment.shipmentId)
    .then(() => {
      this.getShipment(this.state.shipment.shipmentId);
    });
  }

  handleSubmit(event) {
    event.preventDefault();
    this.getShipment(this.state.shipmentId);
  }

  handleChange(event) {
    this.setState({shipmentId: event.target.value});
  }

  updateSyncStatus() {
    if (this.state.sync) {
      if (this.state.sync.lastModified === this.state.shipment.lastModified) {
        if (this.state.sync.syncResult === 200) {
          this.setState({ syncStatus: { status: 'success', message: 'Synced'} });
        }
        else {
          this.setState({ syncStatus: { status: 'danger', message: 'Errored' } });
        }
      }
      else {
        this.setState({ syncStatus: { status: 'warning', message: 'Pending' } });
      }
    }
    else {
      this.setState({ syncStatus: { status: 'warning', message: 'Pending' } });
    }
  }

  clearShipmentData() {
    this.setState({ shipment: null });
    this.setState({ sync: null });
    this.setState({ syncStatus: '' });
  }

  async getShipment(shipmentId) {
    this.setState({ error: null });
    Promise.all([API.get('api', '/receipt/' + shipmentId),
      API.get('api', '/receiptsync/' + shipmentId)])
    .then(results => {
      this.setState({ shipment: results[0].data });
      this.setState({ sync: results[1].data });
      this.updateSyncStatus();
      this.setState({ shipmentId: '' });
    })
    .catch(err => {
      if (err.response.status === 404) {
        this.clearShipmentData();
        this.setState({ error: "Shipment Receipt '" + shipmentId + "' could not be found." });
      }
    });
  }

  render() {
    return (
      <div class="container">
        <div class="header">
          <h1>Shipment Receipts</h1>
          <div class="row">
            <div class="col-md-6 offset-md-3 col-sm-12">
              <form onSubmit={this.handleSubmit}>
                <div class="input-group">
                  <div class="input-group-prepend">
                    <button type="button" class="btn btn-secondary btn-sm" onClick={this.handleReload}><img src="/sync.png" alt="reload shipments"></img></button>
                  </div>
                  <input id="search" type="text" class="form-control" placeholder="Enter Shipment Id" value={this.state.shipmentId} onChange={this.handleChange} />
                  <div class="input-group-append">
                    <button id="submit" type="submit" class="btn btn-primary btn-sm">Search</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
        {
          this.state.error ?
          <div class="alert alert-danger" role="alert">{this.state.error}</div> :
          ''
        }
        {
          this.state.shipment ?
          <div class="card">
            <div class="card-header bg-info text-white text-center">
              <Button className="float-left" variant="secondary" size="sm" onClick={this.handleRebuild}><img src="/sync.png" alt="reload shipment"></img></Button>
              {this.state.shipment.shipmentId}
              <Button className="float-right" variant={this.state.syncStatus.status} size="sm" onClick={this.handleResync}>{this.state.syncStatus.message}</Button>
            </div>
            <div class="card-body">
              <div class="row">
                <label class="col-sm-2">Shipment Id</label>
                <div class="col-sm-4">{this.state.shipment.shipmentId}</div>
                <label class="col-sm-2">Type</label>
                <div class="col-sm-4">{this.state.shipment.shipmentType}</div>
                <label for="courier" class="col-sm-2">Courier</label>
                <div class="col-sm-4">{this.state.shipment.courier}</div>
                <label class="col-sm-2">Tracking Id</label>
                <div class="col-sm-4">{this.state.shipment.trackingId}</div>
                <label class="col-sm-2">Date Created</label>
                <div class="col-sm-4">{this.state.shipment.dateCreated}</div>
                <label class="col-sm-2">Last Modified</label>
                <div class="col-sm-4">{this.state.shipment.lastModified}</div>
                <label class="col-sm-2">Date Shipped</label>
                <div class="col-sm-4">{this.state.shipment.dateShipped}</div>
                <label class="col-sm-2">Date Received</label>
                <div class="col-sm-4">{this.state.shipment.dateReceived}</div>
                <label class="col-sm-2">Sender</label>
                <div class="col-sm-4">{this.state.shipment.sender}</div>
                <label class="col-sm-2">Recipient</label>
                <div class="col-sm-4">{this.state.shipment.recipient}</div>
                <label class="col-sm-2">Kit Ids</label>
                <div class="col-sm-4">{this.state.shipment.kitIds}</div>
                <label class="col-sm-2">Notes</label>
                <div class="col-sm-4">{this.state.shipment.notes}</div>
              </div>
              <nav class="navbar navbar-expand-lg navbar-light bg-secondary">
                <strong>Contents</strong>
              </nav>
              <div class="row">
                  <label class="col-sm-6">Subject Id</label>
                  <label class="col-sm-6">Label</label>
              </div>
              {this.state.shipment.contents.map((item) => 
                <ShipmentContent content={item} key={item.currentLabel} />
              )}
            </div>
          </div>
          :
          ''
        }
      </div>
    );
  }
}