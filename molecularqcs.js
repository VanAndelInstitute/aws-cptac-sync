'use strict';

const dynamo = require('./dynamo/module');

var molecularqcsModule = (() => {
    return {
        sync: async (record) => {
            var molecularqc = dynamo.toJson(record.dynamodb.NewImage);
            //TODO: Send information to endpoint, record response
            await dynamo.molecularqcs.updateSync({
                caseId: molecularqc.caseId,
                lastModified: molecularqc.lastModified,
                lastSynced: new Date().toISOString(),
                syncResult: 200
            });
        },

        get: (caseId) => {
            return dynamo.molecularqcs.get(caseId);
        }
    };
})();

module.exports = molecularqcsModule;