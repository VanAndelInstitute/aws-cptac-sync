'use strict';

const bsi = require('./bsi/module');
const dynamo = require('./dynamo/module');

var iscansModule = (() => {
    return {
        pullRecentChanges: async () => {
            return new Promise(async (resolve, reject) => {
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
                resolve();
            });
        },

        sync: async (iscan) => {
            //TODO: Send information to endpoint, record response
            await dynamo.iscans.updateSync({
                caseId: iscan.caseId,
                lastModified: iscan.lastModified,
                lastSynced: new Date().toISOString(),
                syncResult: 200
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