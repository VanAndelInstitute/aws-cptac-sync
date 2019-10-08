'use strict';

//Shipment Receipts
const shipmentReceipts = require('./shipment-receipts');

module.exports.pullrecentreceipts = (event, context) => {
    shipmentReceipts.pullRecentChanges();
};

module.exports.rebuildreceipt = (event, context) => {
    shipmentReceipts.rebuild(event.pathParameters.id);
};

module.exports.syncreceipt = (event, context) => {
    event.Records.filter(record => record.eventName != 'REMOVE').map(async record => {
        shipmentReceipts.sync(record);
    });
};

module.exports.getreceipt = async (event, context) => {
    var receipt = await shipmentReceipts.get(event.pathParameters.id);
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
            "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
        },
        body: JSON.stringify({data: receipt})
    };
};

//Cases
const bsiCase = require('./bsi-case');

module.exports.pullrecentcases = (event, context) => {
    bsiCase.pullRecentChanges();
};

module.exports.rebuildcase = (event, context) => {
    bsiCase.rebuild(event.pathParameters.id);
};

//Molecular QC
const molecularqcs = require('./molecularqcs');

module.exports.syncmolecularqc = (event, context) => {
    event.Records.filter(record => record.eventName != 'REMOVE').map(async record => {
        molecularqcs.sync(record);
    });
};

module.exports.getmolecularqc = async (event, context) => {
    var molecularqc = await molecularqcs.get(event.pathParameters.id);
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
            "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
        },
        body: JSON.stringify({data: molecularqc})
    };
};

//IScan
const iscans = require('./iscans');

module.exports.synciscan = (event, context) => {
    event.Records.filter(record => record.eventName != 'REMOVE').map(async record => {
        iscans.sync(record);
    });
};

module.exports.getiscan = async (event, context) => {
    var iscan = await iscans.get(event.pathParameters.id);
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
            "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
        },
        body: JSON.stringify({data: iscan})
    };
};