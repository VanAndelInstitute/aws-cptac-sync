'use strict';

const bsi = require('./bsi/module');
const dynamo = require('./dynamo/module');
const got = require('got');
const { SecretsManager } = require("@aws-sdk/client-secrets-manager");

const secretClient = new SecretsManager();

var molecularqcsModule = (() => {
    async function getCdrSecrets() {
        return secretClient.getSecretValue({SecretId: process.env.CDR_SECRET});
    }
    
    async function createCdrRequest(molecularqc) {
        let data = await getCdrSecrets();
        var secrets = JSON.parse(data.SecretString);
        const url = process.env.CDR_BASE_URL + 'molecularQCEvent/' + molecularqc.caseId;
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
                var molecularqc = await bsi.molecularqcs.get(bsiCases[index]);
                await dynamo.molecularqcs.update(molecularqc);
            }

            await dynamo.updateLatest(lastUpdated);
            await bsi.logoff();
        },

        sync: async (molecularqc) => {
            console.log("Syncing " + molecularqc.caseId + " to CDR.");
            var lastModified = molecularqc.lastModified;
            delete molecularqc.lastModified;
            var statusCode = await createCdrRequest(molecularqc);

            console.log("Recording status code " + statusCode + ".");
            await dynamo.molecularqcs.updateSync({
                caseId: molecularqc.caseId,
                lastModified: lastModified,
                lastSynced: new Date().toISOString(),
                syncResult: statusCode
            });
        },

        dynamoToJson: (data) => {
            return dynamo.toJson(data);
        },

        get: (caseId) => {
            return dynamo.molecularqcs.get(caseId);
        },

        getSync: (caseId) => {
            return dynamo.molecularqcs.getSync(caseId);
        },

        rebuild: async (caseId) => {
            await bsi.login();
            var molecularqc = await bsi.molecularqcs.get(caseId);
            await dynamo.molecularqcs.update(molecularqc);
            await bsi.logoff();
        }
    };
})();

module.exports = molecularqcsModule;