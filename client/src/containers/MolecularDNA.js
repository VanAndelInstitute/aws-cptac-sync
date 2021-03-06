import React, {Component} from 'react';
import "./MolecularDNA.css";

export default class MolecularDNA extends Component {
    render() {
        return (
            <div class="card">
                <div class="card-header bg-primary text-white">
                    <div class="row">
                        <div class="col-sm-4">{this.props.content.analyteID}</div>
                        <div class="col-sm-8 row">
                            <div class="col-sm-4">Nanodrop</div>
                            <div class="col-sm-4">KAPA</div>
                            <div class="col-sm-4">Qubit</div>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row no-gutters">
                        <div class="col-sm-4">
                            <div class="row no-gutters">
                                <label class="col-sm-6">Analyte ID</label>
                                <div class="col-sm-6">{this.props.content.analyteID}</div>
                            </div>
                        </div>
                        <div class="col-sm-8 row no-gutters">
                            <div class="col-sm-4">
                                <div class="row no-gutters">
                                    <label class="col-sm-9">A260/A230</label>
                                    <div class="col-sm-3">{this.props.content.nanoDrop.a260OverA230}</div>
                                </div>
                            </div>
                            <div class="col-sm-4">
                                <div class="row no-gutters">
                                    <label class="col-sm-7">Bioanalyzer Minimum</label>
                                    <div class="col-sm-5">{this.props.content.Bioanalyzer.min}</div>
                                </div>
                            </div>
                            <div class="col-sm-4">
                                <div class="row no-gutters">
                                    <label class="col-sm-9">Concentration</label>
                                    <div class="col-sm-3">{this.props.content.qubit.concentration}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row no-gutters">
                        <div class="col-sm-4">
                            <div class="row no-gutters">
                                <label class="col-sm-6">Specimen ID(s)</label>
                                <div class="col-sm-6 white-space">{this.props.content.specimenIDs.map(specimen => specimen.specimenID).join('\n')}</div>
                            </div>
                        </div>
                        <div class="col-sm-8 row no-gutters">
                            <div class="col-sm-4">
                                <div class="row no-gutters">
                                    <label class="col-sm-9">A260/A280</label>
                                    <div class="col-sm-3">{this.props.content.nanoDrop.a260OverA280}</div>
                                </div>
                            </div>
                            <div class="col-sm-4">
                                <div class="row no-gutters">
                                    <label class="col-sm-7">Bioanalyzer Average</label>
                                    <div class="col-sm-5">{this.props.content.Bioanalyzer.avg.lower} bp - {this.props.content.Bioanalyzer.avg.upper} bp</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row no-gutters">
                        <div class="col-sm-4">
                            <div class="row no-gutters">
                                <label class="col-sm-6">Gel Score</label>
                                <div class="col-sm-6">{this.props.content.gelScore}</div>
                            </div>
                        </div>
                        <div class="col-sm-8 row no-gutters">
                            <div class="col-sm-4">
                                <div class="row no-gutters">
                                    <label class="col-sm-9">Concentration</label>
                                    <div class="col-sm-3">{this.props.content.nanoDrop.concentration}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row no-gutters">
                        <div class="col-sm-4">
                            <div class="row no-gutters">
                                <label class="col-sm-6">Volume</label>
                                <div class="col-sm-6">{this.props.content.volume}</div>
                            </div>
                        </div>
                    </div>
                    <div class="row no-gutters">
                        <div class="col-sm-6">
                            <div class="row no-gutters">
                                <label class="col-sm-4">Date of Extraction</label>
                                <div class="col-sm-8">{this.props.content.dateOfExtraction}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}