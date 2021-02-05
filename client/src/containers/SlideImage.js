import React, {Component} from 'react';
import "./SlideImage.css";

export default class SlideImage extends Component {
    render() {
        return (
                <div class="row no-gutters">
                    <label class="col-sm-1">Image Id</label>
                    <div class="col-sm-2 white-space">{this.props.content.ImageId}</div>
                    <label class="col-sm-2">Last Modified</label>
                    <div class="col-sm-3 white-space">{this.props.content.lastModified}</div>
                    <label class="col-sm-1">Scan Date</label>
                    <div class="col-sm-3 white-space">{this.props.content.scanDate}</div>
                </div>
        );
    }
}