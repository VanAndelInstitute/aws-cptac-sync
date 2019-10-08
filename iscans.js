'use strict';

const dynamo = require('./dynamo/module');

var iscansModule = (() => {
    return {
        sync: async (record) => {
            var iscan = dynamo.toJson(record.dynamodb.NewImage);
            //TODO: Send information to endpoint, record response
            await dynamo.iscans.updateSync({
                caseId: iscan.caseId,
                lastModified: iscan.lastModified,
                lastSynced: new Date().toISOString(),
                syncResult: 200
            });
        },

        get: (caseId) => {
            return dynamo.iscans.get(caseId);
        }
    };
})();

module.exports = iscansModule;