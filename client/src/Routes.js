import React from "react";
import { Route, Switch } from "react-router-dom";
import Home from "./containers/Home";
import ShipmentReceipt from "./containers/ShipmentReceipts";
import MolecularQC from "./containers/MolecularQCs";
import IScan from "./containers/IScans";
import Protein from "./containers/Proteins";
import NotFound from "./containers/NotFound";

export default ({ childProps }) =>
  <Switch>
    <Route path="/" exact component={Home} />
    { childProps.isDataManager && <Route path="/shipmentreceipts/:id?" component={ShipmentReceipt} /> }
    { childProps.isDataManager && <Route path="/molecularqcs/:id?" component={MolecularQC} /> }
    { childProps.isDataManager && <Route path="/iscans/:id?" component={IScan} /> }
    { childProps.isDataManager && <Route path="/proteins/:id?" component={Protein} /> }
		<Route component={NotFound} />
  </Switch>;