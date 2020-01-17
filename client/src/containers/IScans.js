import React, { Component } from "react";
import { Button } from 'react-bootstrap';
import { API } from 'aws-amplify';
import "./IScans.css";

export default class IScans extends Component {
  constructor(props) {
    super(props);

    this.state = {
      caseId: this.props.match.params.id,
      iscan: null,
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
    if (this.state.caseId) {
      this.getIScan();
    }
  }

  async handleReload(event) {
    event.preventDefault();
    API.put('api', '/pulliscans/');
    alert('Getting all recent iscan data from BSI. This may take a few minutes to complete.');
  }

  async handleRebuild(event) {
    event.preventDefault();
    API.put('api', '/iscan/' + this.state.iscan.caseId)
    .then(() => {
      this.getIScan(this.state.iscan.caseId);
    });
  }

  async handleResync(event) {
    event.preventDefault();
    API.put('api', '/iscansync/' + this.state.iscan.caseId)
    .then(() => {
      this.getIScan(this.state.iscan.caseId);
    });
  }

  handleSubmit(event) {
    event.preventDefault();
    this.getIScan(this.state.caseId);
  }

  handleChange(event) {
    this.setState({caseId: event.target.value});
  }

  updateSyncStatus() {
    if (this.state.sync) {
      if (this.state.sync.lastModified === this.state.iscan.lastModified) {
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

  clearIScanData() {
    this.setState({ iscan: null });
    this.setState({ sync: null });
    this.setState({ syncStatus: '' });
  }

  async getIScan(caseId) {
    this.setState({ error: null });
    Promise.all([API.get('api', '/iscan/' + caseId),
      API.get('api', '/iscansync/' + caseId)])
    .then(results => {
      this.setState({ iscan: results[0].data });
      this.setState({ sync: results[1].data });
      this.updateSyncStatus();
      this.setState({ caseId: '' });
    })
    .catch(err => {
      if (err.response && err.response.status === 404) {
        this.clearIScanData();
        this.setState({ error: "IScan data for '" + caseId + "' could not be found." });
      }
    });
  }

  render() {
    return (
      <div class="container">
        <div class="header">
          <h1>iScans</h1>
          <div class="row">
            <div class="col-md-6 offset-md-3 col-sm-12">
              <form onSubmit={this.handleSubmit}>
                <div class="input-group">
                  <div class="input-group-prepend">
                    <button type="button" class="btn btn-secondary btn-sm" onClick={this.handleReload}><img src="/sync.png" alt="reload iscans"></img></button>
                  </div>
                  <input id="search" type="text" class="form-control" placeholder="Enter Case Id" value={this.state.caseId} onChange={this.handleChange} />
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
          this.state.iscan ?
          <div class="card">
            <div class="card-header bg-info text-white text-center">
              <Button className="float-left" variant="secondary" size="sm" onClick={this.handleRebuild}><img src="/sync.png" alt="reload iscan"></img></Button>
              {this.state.iscan.caseId}
              <Button className="float-right" variant={this.state.syncStatus.status} size="sm" onClick={this.handleResync}>{this.state.syncStatus.message}</Button>
            </div>
            <div class="card-body">
              <h2>Tumor Tissue</h2>
              <div class="row">
                <label class="col-sm-4">iScan Contamination</label>
                <div class="col-sm-2">{this.state.iscan.tumorTissue.iscanContamination}</div>
                <label class="col-sm-2">iScan Match</label>
                <div class="col-sm-4">{this.state.iscan.tumorTissue.iscanMatch}</div>
              </div>
              <h2>Normal Tissue</h2>
              <div class="row">
                <label class="col-sm-4">iScan Contamination</label>
                <div class="col-sm-2">{this.state.iscan.normalTissue.iscanContamination}</div>
                <label class="col-sm-2">iScan Match</label>
                <div class="col-sm-4">{this.state.iscan.normalTissue.iscanMatch}</div>
              </div>
            </div>
          </div>
          :
          ''
        }
      </div>
    );
  }
}