import React, { Component } from "react";
import Slide from "./Slide";
import { Button } from 'react-bootstrap';
import { API } from 'aws-amplify';
import "./Images.css";

export default class Images extends Component {
  constructor(props) {
    super(props);

    this.state = {
      caseId: this.props.match.params.id,
      images: null,
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
      this.getImage(this.state.caseId);
    }
  }

  async handleReload(event) {
    event.preventDefault();
    API.put('api', '/pullimages/');
    alert('Getting all recent image data. This may take a few minutes to complete.');
  }

  async handleRebuild(event) {
    event.preventDefault();
    API.put('api', '/image/' + this.state.images.CaseId)
    .then(() => {
      this.getImage(this.state.images.CaseId);
    });
  }

  async handleResync(event) {
    event.preventDefault();
    API.put('api', '/imagesync/' + this.state.images.CaseId)
    .then(() => {
      this.getImage(this.state.images.CaseId);
    });
  }

  handleSubmit(event) {
    event.preventDefault();
    this.getImage(this.state.caseId);
  }

  handleChange(event) {
    this.setState({caseId: event.target.value});
  }

  updateSyncStatus() {
    if (this.state.sync) {
      if (this.state.sync.lastModified === this.state.images.ModifiedOn) {
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

  clearImageData() {
    this.setState({ images: null });
    this.setState({ sync: null });
    this.setState({ syncStatus: '' });
  }

  async getImage(caseId) {
    this.setState({ error: null });
    Promise.all([API.get('api', '/image/' + caseId),
      API.get('api', '/imagesync/' + caseId)])
    .then(results => {
      this.setState({ images: results[0].data });
      this.setState({ sync: results[1].data });
      this.updateSyncStatus();
      this.setState({ caseId: '' });
    })
    .catch(err => {
      if (err.response && err.response.status === 404) {
        this.clearImageData();
        this.setState({ error: "Image data for '" + caseId + "' could not be found." });
      }
    });
  }

  render() {
    return (
      <div class="container">
        <div class="header">
          <h1>Images</h1>
          <div class="row">
            <div class="col-md-6 offset-md-3 col-sm-12">
              <form onSubmit={this.handleSubmit}>
                <div class="input-group">
                  <div class="input-group-prepend">
                    <button type="button" class="btn btn-secondary btn-sm" onClick={this.handleReload}><img src="/sync.png" alt="reload images"></img></button>
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
          this.state.images ?
          <div class="card">
          <div class="card-header bg-info text-white text-center">
              <Button className="float-left" variant="secondary" size="sm" onClick={this.handleRebuild}><img src="/sync.png" alt="reload image"></img></Button>
              {this.state.images.CaseId}
              <Button className="float-right" variant={this.state.syncStatus.status} size="sm" onClick={this.handleResync}>{this.state.syncStatus.message}</Button>
            </div>
            <div class="card-body">
              <div class="row">
                <label class="col-sm-2">Last Modified</label>
                <div class="col-sm-4">{this.state.images.ModifiedOn}</div>
              </div>
              <h3>Slides</h3>
              {this.state.images.Slides.map((item) => 
                <Slide content={item} key={item.SlideId} />
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