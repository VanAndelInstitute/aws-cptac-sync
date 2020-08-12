import React, {Component} from 'react';
import "./Protein.css";

export default class Protein extends Component {
    render() {
        return (
            <div class="card">
                <div class="card-header bg-primary text-white">
                    <div class="row">
                        <div class="col-sm-12">{this.props.content.analyteID}</div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row no-gutters">
                        <div class="col-sm-4">
                            <div class="row no-gutters">
                                <label class="col-sm-6">Specimen ID(s)</label>
                                <div class="col-sm-6 white-space">{this.props.content.specimenIDs.map(specimen => specimen.specimenID).join('\n')}</div>
                            </div>
                        </div>
                        <div class="col-sm-8 row no-gutters">
                            <div class="col-sm-8">
                                <div class="row no-gutters">
                                    <label class="col-sm-4">Material Type</label>
                                    <div class="col-sm-8">{this.props.content.materialType}</div>
                                </div>
                            </div>
                            <div class="col-sm-4">
                                <div class="row no-gutters">
                                    <label class="col-sm-6">Volume</label>
                                    <div class="col-sm-6">{this.props.content.volume} {this.props.content.volumeUnit}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row no-gutters">
                        <div class="col-sm-4">
                            <div class="row no-gutters">
                                <label class="col-sm-6"></label>
                                <div class="col-sm-6"></div>
                            </div>
                        </div>
                        <div class="col-sm-8 row no-gutters">
                            <div class="col-sm-8">
                                <div class="row no-gutters">
                                    <label class="col-sm-4">Processing Date</label>
                                    <div class="col-sm-8">{this.props.content.processingDate}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}