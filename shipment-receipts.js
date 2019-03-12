'use strict';

const bsi = require('./bsi/module');
const dynamo = require('./dynamo/module');

var receiptModule = (function() {

    return {
        pullRecentChanges: async function() {
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
        },

        rebuildReceipt: async function(shipmentId) {
            await bsi.login();
            var receipt = await bsi.getReceipt(shipmentId);
            await dynamo.updateReceipt(receipt);
            await bsi.logoff();
        },

        syncReceipt: async function(record) {
            var receipt = dynamo.toJson(record.dynamodb.NewImage);
            //TODO: Send information to endpoint, record response
            await dynamo.updateSync({
                shipmentId: receipt.shipmentId,
                lastModified: receipt.lastModified,
                lastSynced: new Date().toISOString(),
                syncResult: 200
            });
        },

        getReceipt: function(shipmentId) {
            return dynamo.getReceipt(shipmentId);
        }
    };
})();

module.exports = receiptModule;