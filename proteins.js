'use strict';

const bsi = require('./bsi/module');
const dynamo = require('./dynamo/module');
const got = require('got');
const { SecretsManager } = require("@aws-sdk/client-secrets-manager");

const secretClient = new SecretsManager();

var proteinsModule = (() => {
    async function getCdrSecrets() {
        return secretClient.getSecretValue({SecretId: process.env.CDR_SECRET});
    }
    
    async function createCdrRequest(proteins) {
        let data = await getCdrSecrets();
        var secrets = JSON.parse(data.SecretString);
        const url = process.env.CDR_BASE_URL + 'proteinEvent/';
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
                var protein = await bsi.proteins.get(bsiCases[index]);
                if (protein) {
                    await dynamo.proteins.update(protein);
                }
            }

            await dynamo.updateLatest(lastUpdated);
            await bsi.logoff();
        },

        sync: async (protein) => {
            console.log("Syncing " + protein.caseId + " to CDR.");
            var lastModified = protein.lastModified;
            delete protein.lastModified;
            var statusCode = await createCdrRequest(protein);
            
            console.log("Recording status code " + statusCode + ".");
            await dynamo.proteins.updateSync({
                caseId: protein.caseId,
                lastModified: lastModified,
                lastSynced: new Date().toISOString(),
                syncResult: statusCode
            });
        },

        dynamoToJson: (data) => {
            return dynamo.toJson(data);
        },

        get: (caseId) => {
            return dynamo.proteins.get(caseId);
        },

        getSync: (caseId) => {
            return dynamo.proteins.getSync(caseId);
        },

        rebuild: async (caseId) => {
            await bsi.login();
            var protein = await bsi.proteins.get(caseId);
            await dynamo.proteins.update(protein);
            await bsi.logoff();
        }
    };
})();

module.exports = proteinsModule;