'use strict';

import bsi from './bsi/module.js';
import dynamo from './dynamo/module.js';
import got from 'got';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';

const secretClient = new SecretsManager();

var receiptModule = (() => {
    async function getCdrSecrets() {
        return secretClient.getSecretValue({SecretId: process.env.CDR_SECRET});
    }
    
    async function createCdrRequest(receipt) {
        let data = await getCdrSecrets();
        var secrets = JSON.parse(data.SecretString);
        const url = process.env.CDR_BASE_URL + 'shippingEvent/' + receipt.shipmentId;
        let response = await got.post(url, {
            json: receipt,
            username: secrets.username,
            password: secrets.password
        });
        return response.statusCode;
    }

    return {
        pullRecentChanges: async () => {
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
            console.log("Syncing " + receipt.shipmentId + " to CDR.");
            var statusCode = await createCdrRequest(receipt);
            
            console.log("Recording status code " + statusCode + ".");
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

export default receiptModule;