'use strict';

const bsi = require('./bsi/module');
const dynamo = require('./dynamo/module');
const got = require('got');
const { SecretsManager } = require("@aws-sdk/client-secrets-manager");

const secretClient = new SecretsManager();

var iscansModule = (() => {
    async function getCdrSecrets() {
        return secretClient.getSecretValue({SecretId: process.env.CDR_SECRET});
    }
    
    async function createCdrRequest(iscan) {
        let data = await getCdrSecrets();
        var secrets = JSON.parse(data.SecretString);
        const url = process.env.CDR_BASE_URL + 'iscanEvent/' + iscan.caseId;
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
            
            var lastUpdated = await dynamo.getLatest('Case');
            var bsiCases = await bsi.cases.getUpdated(lastUpdated.lastModified);

            for (let index = 0; index < bsiCases.length; index++) {
                var iscan = await bsi.iscans.get(bsiCases[index]);
                if (iscan) {
                    await dynamo.iscans.update(iscan);
                }
            }

            await dynamo.updateLatest(lastUpdated);
            await bsi.logoff();
        },

        sync: async (iscan) => {
            console.log("Syncing " + iscan.caseId + " to CDR.");
            var statusCode = await createCdrRequest(iscan);
            
            console.log("Recording status code " + statusCode + ".");
            await dynamo.iscans.updateSync({
                caseId: iscan.caseId,
                lastModified: iscan.lastModified,
                lastSynced: new Date().toISOString(),
                syncResult: statusCode
            });
        },

        dynamoToJson: (data) => {
            return dynamo.toJson(data);
        },

        get: (caseId) => {
            return dynamo.iscans.get(caseId);
        },

        getSync: (caseId) => {
            return dynamo.iscans.getSync(caseId);
        },

        rebuild: async (caseId) => {
            await bsi.login();
            var iscan = await bsi.iscans.get(caseId);
            await dynamo.iscans.update(iscan);
            await bsi.logoff();
        }
    };
})();

module.exports = iscansModule;