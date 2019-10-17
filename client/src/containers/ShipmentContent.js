import React, {Component} from 'react';

export default class ShipmentContent extends Component {
    render() {
        return (
            <div class="row">
                <div class="col-sm-6">{this.props.content.subjectId}</div>
                <div class="col-sm-6">{this.props.content.currentLabel}</div>
            </div>
        );
    }
}