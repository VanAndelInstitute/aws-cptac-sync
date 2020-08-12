import React, { Component } from "react";
import Protein from "./Protein";
import { Button } from 'react-bootstrap';
import { API } from 'aws-amplify';
import "./Proteins.css";

export default class Proteins extends Component {
  constructor(props) {
    super(props);

    this.state = {
      caseId: this.props.match.params.id,
      protein: null,
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
      this.getProtien();
    }
  }

  async handleReload(event) {
    event.preventDefault();
    API.put('api', '/pullproteins/');
    alert('Getting all recent proteins data from BSI. This may take a few minutes to complete.');
  }

  async handleRebuild(event) {
    event.preventDefault();
    API.put('api', '/protein/' + this.state.protein.caseId)
    .then(() => {
      this.getProtein(this.state.protein.caseId);
    });
  }

  async handleResync(event) {
    event.preventDefault();
    API.put('api', '/proteinsync/' + this.state.protein.caseId)
    .then(() => {
      this.getProtein(this.state.protein.caseId);
    });
  }

  handleSubmit(event) {
    event.preventDefault();
    this.getProtein(this.state.caseId);
  }

  handleChange(event) {
    this.setState({caseId: event.target.value});
  }

  updateSyncStatus() {
    if (this.state.sync) {
      if (this.state.sync.lastModified === this.state.protein.lastModified) {
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

  clearProteinData() {
    this.setState({ protein: null });
    this.setState({ sync: null });
    this.setState({ syncStatus: '' });
  }

  async getProtein(caseId) {
    this.setState({ error: null });
    Promise.all([API.get('api', '/protein/' + caseId),
      API.get('api', '/proteinsync/' + caseId)])
    .then(results => {
      this.setState({ protein: results[0].data });
      this.setState({ sync: results[1].data });
      this.updateSyncStatus();
      this.setState({ caseId: '' });
    })
    .catch(err => {
      if (err.response && err.response.status === 404) {
        this.clearProteinData();
        this.setState({ error: "Protein data for '" + caseId + "' could not be found." });
      }
    });
  }

  render() {
    return (
      <div class="container">
        <div class="header">
          <h1>Proteins</h1>
          <div class="row">
            <div class="col-md-6 offset-md-3 col-sm-12">
              <form onSubmit={this.handleSubmit}>
                <div class="input-group">
                  <div class="input-group-prepend">
                    <button type="button" class="btn btn-secondary btn-sm" onClick={this.handleReload}><img src="/sync.png" alt="reload proteins"></img></button>
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
          this.state.protein ?
          <div class="card">
            <div class="card-header bg-info text-white text-center">
              <Button className="float-left" variant="secondary" size="sm" onClick={this.handleRebuild}><img src="/sync.png" alt="reload protein"></img></Button>
              {this.state.protein.caseId}
              <Button className="float-right" variant={this.state.syncStatus.status} size="sm" onClick={this.handleResync}>{this.state.syncStatus.message}</Button>
            </div>
            <div class="card-body">
              <h2>Tumor Protein</h2>
              {this.state.protein.tumorProtein.map((item) => 
                <Protein content={item} key={item.analyteID} />
              )}
              <h2>Normal Protein</h2>
              {this.state.protein.normalProtein.map((item) => 
                <Protein content={item} key={item.analyteID} />
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