import React from "react";
import { Route, Switch } from "react-router-dom";
import Home from "./containers/Home";
import ShipmentReceipts from "./containers/ShipmentReceipts";
import NotFound from "./containers/NotFound"

export default ({ childProps }) =>
  <Switch>
    <Route path="/" exact component={Home} />
    { childProps.isDataManager && <Route path="/shipmentreceipts" exact component={ShipmentReceipts} /> }
		<Route component={NotFound} />
  </Switch>;