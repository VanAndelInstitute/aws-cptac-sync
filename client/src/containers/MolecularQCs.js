import React, { Component } from "react";
import MolecularDNA from "./MolecularDNA";
import MolecularRNA from "./MolecularRNA";
import { Button } from 'react-bootstrap';
import { API } from 'aws-amplify';
import "./MolecularQCs.css";

export default class MolecularQCs extends Component {
  constructor(props) {
    super(props);

    this.state = {
      caseId: this.props.match.params.id,
      molecularqc: null,
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
      this.getMolecularQc(this.state.caseId);
    }
  }

  async handleReload(event) {
    event.preventDefault();
    API.put('api', '/pullrecent/molecularqc');
    alert('Getting all recent molecular qc data from BSI. This may take a few minutes to complete.');
  }

  async handleRebuild(event) {
    event.preventDefault();
    API.put('api', '/molecularqc/' + this.state.molecularqc.caseId)
    .then(() => {
      this.getMolecularQc(this.state.molecularqc.caseId);
    });
  }

  async handleResync(event) {
    event.preventDefault();
    API.put('api', '/molecularqcsync/' + this.state.molecularqc.caseId)
    .then(() => {
      this.getMolecularQc(this.state.molecularqc.caseId);
    });
  }

  handleSubmit(event) {
    event.preventDefault();
    this.getMolecularQc(this.state.caseId);
  }

  handleChange(event) {
    this.setState({caseId: event.target.value});
  }

  updateSyncStatus() {
    if (this.state.sync) {
      if (this.state.sync.lastModified === this.state.molecularqc.lastModified) {
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

  clearMolecularQcData() {
    this.setState({ molecularqc: null });
    this.setState({ sync: null });
    this.setState({ syncStatus: '' });
  }

  async getMolecularQc(caseId) {
    this.setState({ error: null });
    Promise.all([API.get('api', '/molecularqc/' + caseId),
      API.get('api', '/molecularqcsync/' + caseId)])
    .then(results => {
      this.setState({ molecularqc: results[0].data });
      this.setState({ sync: results[1].data });
      this.updateSyncStatus();
      this.setState({ caseId: '' });
    })
    .catch(err => {
      if (err.response && err.response.status === 404) {
        this.clearMolecularQcData();
        this.setState({ error: "Molecular QC data for '" + caseId + "' could not be found." });
      }
    });
  }

  render() {
    return (
      <div class="container">
        <div class="header">
          <h1>Molecular QCs</h1>
          <div class="row">
            <div class="col-md-6 offset-md-3 col-sm-12">
              <form onSubmit={this.handleSubmit}>
                <div class="input-group">
                  <div class="input-group-prepend">
                    <button type="button" class="btn btn-secondary btn-sm" onClick={this.handleReload}><img src="/sync.png" alt="reload molecular qcs"></img></button>
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
          this.state.molecularqc ?
          <div class="card">
          <div class="card-header bg-info text-white text-center">
              <Button className="float-left" variant="secondary" size="sm" onClick={this.handleRebuild}><img src="/sync.png" alt="reload molecularqc"></img></Button>
              {this.state.molecularqc.caseId}
              <Button className="float-right" variant={this.state.syncStatus.status} size="sm" onClick={this.handleResync}>{this.state.syncStatus.message}</Button>
            </div>
            <div class="card-body">
              <h3>Germline DNA</h3>
              {this.state.molecularqc.germlineDNA.map((item) => 
                <MolecularDNA content={item} key={item.analyteID} />
              )}
              
              <h3>Tumor DNA</h3>
              {this.state.molecularqc.tumorDNA.map((item) => 
                <MolecularDNA content={item} key={item.analyteID} />
              )}
              
              <h3>Tumor RNA</h3>
              {this.state.molecularqc.tumorRNA.map((item) => 
                <MolecularRNA content={item} key={item.analyteID} />
              )}
              
              <h3>Normal DNA</h3>
              {this.state.molecularqc.normalDNA.map((item) => 
                <MolecularDNA content={item} key={item.analyteID} />
              )}
              
              <h3>Normal RNA</h3>
              {this.state.molecularqc.normalRNA.map((item) => 
                <MolecularRNA content={item} key={item.analyteID} />
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