import React, {Component} from 'react';
import SlideImage from "./SlideImage";
import "./Slide.css";

export default class Slide extends Component {
    render() {
        return (
            <div class="card">
                <div class="card-header bg-primary text-white">
                    <div class="row">
                        <div class="col-sm-12">{this.props.content.SlideId}</div>
                    </div>
                </div>
                <div class="card-body">
                    {this.props.content.Images.map((item) => 
                        <SlideImage content={item} key={item.ImageId} />
                    )}
                </div>
            </div>
        );
    }
}