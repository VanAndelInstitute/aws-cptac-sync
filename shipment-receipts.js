'use strict';

const bsi = require('./bsi/module');
const dynamo = require('./dynamo/module');
const request = require('request');
const AWS = require('aws-sdk');

const secretClient = new AWS.SecretsManager();

var receiptModule = (() => {
    function getCdrSecrets() {
        return new Promise((resolve, reject) => {
            secretClient.getSecretValue({SecretId: process.env.CDR_SECRET}, (err, data) => {
                err ? reject(err) : resolve(data);
            });
        });
    }
    
    function createCdrRequest(receipt) {
        return new Promise((resolve, reject) => {
            getCdrSecrets().then(data => {
                var secrets = JSON.parse(data.SecretString);
                request({
                    uri: process.env.CDR_BASE_URL + 'shippingEvent/' + receipt.shipmentId,
                    method: 'POST',
                    body: receipt,
                    json: true,
                    auth: {
                        'user': secrets.username,
                        'pass': secrets.password
                    }
                }, async (error, response, body) => {
                    resolve(response.statusCode);
                });
            });
        });
    }

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
            var statusCode = await createCdrRequest(receipt);
            
            return dynamo.receipts.updateSync({
                shipmentId: receipt.shipmentId,
                lastModified: receipt.lastModified,
                lastSynced: new Date().toISOString(),
                syncResult: statusCode
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