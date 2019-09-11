'use strict';

const bsi = require('./bsi/module');
const dynamo = require('./dynamo/module');

var receiptModule = (() => {

    return {
        pullRecentChanges: async () => {
            await bsi.login();
            
            var lastUpdated = await dynamo.getLatest('Shipment Receipt');

            var receipts = await bsi.receipts.getUpdated(lastUpdated.lastModified);
            var filteredReceipts = await dynamo.receipts.filter(receipts.rows);
            await Promise.all(filteredReceipts.map(async shipmentId => {
                var receipt = await bsi.receipts.get(shipmentId);
                if (lastUpdated.lastModified < receipt.lastModified) {
                    lastUpdated.lastModified = receipt.lastModified;
                }
                await dynamo.receipts.update(receipt);
            }));

            await dynamo.updateLatest(lastUpdated);
            await bsi.logoff();
        },

        rebuild: async (shipmentId) => {
            await bsi.login();
            var receipt = await bsi.receipts.get(shipmentId);
            await dynamo.receipts.update(receipt);
            await bsi.logoff();
        },

        sync: async (record) => {
            var receipt = dynamo.toJson(record.dynamodb.NewImage);
            //TODO: Send information to endpoint, record response
            await dynamo.receipts.updateSync({
                shipmentId: receipt.shipmentId,
                lastModified: receipt.lastModified,
                lastSynced: new Date().toISOString(),
                syncResult: 200
            });
        },

        get: (shipmentId) => {
            return dynamo.receipts.get(shipmentId);
        }
    };
})();

module.exports = receiptModule;