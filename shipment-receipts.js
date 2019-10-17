'use strict';

const bsi = require('./bsi/module');
const dynamo = require('./dynamo/module');

var receiptModule = (() => {

    return {
        pullRecentChanges: async () => {
            return new Promise(async (resolve, reject) => {
                await bsi.login();
                
                var lastUpdated = await dynamo.getLatest('Shipment Receipt');
    
                var receipts = await bsi.receipts.getUpdated(lastUpdated.lastModified);
                var filteredReceipts = await dynamo.receipts.filter(receipts.rows);
                
                for (let index = 0; index < filteredReceipts.length; index++) {
                    var receipt = await bsi.receipts.get(filteredReceipts[index]);
                    if (lastUpdated.lastModified < receipt.lastModified) {
                        lastUpdated.lastModified = receipt.lastModified;
                    }
                    await dynamo.receipts.update(receipt);
                };
    
                await dynamo.updateLatest(lastUpdated);
                await bsi.logoff();
                resolve();
            });
        },

        rebuild: async (shipmentId) => {
            await bsi.login();
            var receipt = await bsi.receipts.get(shipmentId);
            await dynamo.receipts.update(receipt);
            await bsi.logoff();
        },

        dynamoToJson: (data) => {
            return dynamo.toJson(data);
        },

        sync: async (receipt) => {
            //TODO: Send information to endpoint, record response
            return dynamo.receipts.updateSync({
                shipmentId: receipt.shipmentId,
                lastModified: receipt.lastModified,
                lastSynced: new Date().toISOString(),
                syncResult: 200
            });
        },

        get: (shipmentId) => {
            return dynamo.receipts.get(shipmentId);
        },

        getSync: (shipmentId) => {
            return dynamo.receipts.getSync(shipmentId);
        }
    };
})();

module.exports = receiptModule;