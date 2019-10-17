'use strict';

const bsi = require('./bsi/module');
const dynamo = require('./dynamo/module');

var molecularqcsModule = (() => {
    return {
        pullRecentChanges: async () => {
            return new Promise(async (resolve, reject) => {
                await bsi.login();
                
                var lastUpdated = await dynamo.getLatest('Case');
                var bsiCases = await bsi.cases.getUpdated(lastUpdated.lastModified);

                for (let index = 0; index < bsiCases.length; index++) {
                    var molecularqc = await bsi.molecularqcs.get(bsiCases[index]);
                    await dynamo.molecularqcs.update(molecularqc);
                }

                await dynamo.updateLatest(lastUpdated);
                await bsi.logoff();
                resolve();
            });
        },

        sync: async (molecularqc) => {
            //TODO: Send information to endpoint, record response
            await dynamo.molecularqcs.updateSync({
                caseId: molecularqc.caseId,
                lastModified: molecularqc.lastModified,
                lastSynced: new Date().toISOString(),
                syncResult: 200
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