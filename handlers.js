'use strict';

const bsi = require('./bsi/module');
const dynamo = require('./dynamo/module');

module.exports.syncreceipts = async (event, context) => {
    await bsi.login();
    
    var lastUpdated = await dynamo.getLatest('Shipment Receipt');

    var receipts = await bsi.getNewReceipts(lastUpdated.lastModified);
    var filteredReceipts = await dynamo.filterReceipts(receipts.rows);
    await Promise.all(filteredReceipts.map(async shipmentId => {
        var receipt = await bsi.getReceipt(shipmentId);
        if (lastUpdated.lastModified < receipt.lastModified) {
            lastUpdated.lastModified = receipt.lastModified;
        }
        await dynamo.updateReceipt(receipt);
    }));

    await dynamo.updateLatest(lastUpdated);
    await bsi.logoff();
};

module.exports.getreceipt = async (event, context) => {
    var receipt = await dynamo.getReceipt(event.pathParameters.id);
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
            "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
        },
        body: JSON.stringify({data: receipt})
    };
};