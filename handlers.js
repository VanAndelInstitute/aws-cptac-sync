'use strict';

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