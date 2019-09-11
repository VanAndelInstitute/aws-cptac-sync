'use strict';

//Shipment Receipts
const shipmentReceipts = require('./shipment-receipts');

module.exports.pullrecentreceipts = (event, context) => {
    shipmentReceipts.pullRecentChanges();
};

module.exports.rebuildreceipt = (event, context) => {
    shipmentReceipts.rebuildReceipt(event.pathParameters.id);
};

module.exports.syncreceipt = (event, context) => {
    event.Records.filter(record => record.eventName != 'REMOVE').map(async record => {
        shipmentReceipts.syncReceipt(record);
    });
};

module.exports.getreceipt = async (event, context) => {
    var receipt = await shipmentReceipts.getReceipt(event.pathParameters.id);
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
    bsiCase.rebuildCase(event.pathParameters.id);
};

//Molecular QC
module.exports.syncmolecularqc = (event, context) => {
    event.Records.filter(record => record.eventName != 'REMOVE').map(async record => {
        molecularqc.syncMolecularqc(record);
    });
};

module.exports.getmolecularqc = async (event, context) => {
    var iscan = await molecularqc.getMolecularqc(event.pathParameters.id);
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
            "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
        },
        body: JSON.stringify({data: iscan})
    };
};

//IScan
module.exports.synciscan = (event, context) => {
    event.Records.filter(record => record.eventName != 'REMOVE').map(async record => {
        iscan.syncIscan(record);
    });
};

module.exports.getiscan = async (event, context) => {
    var iscan = await iscan.getIscan(event.pathParameters.id);
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
            "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
        },
        body: JSON.stringify({data: iscan})
    };
};