'use strict';

const bsi = require('./bsi/module');
const dynamo = require('./dynamo/module');

var bsiCaseModule = (() => {

    return {
        pullRecentChanges: async () => {
            await bsi.login();
            
            var lastUpdated = await dynamo.getLatest('Case');

            var bsiCases = await bsi.cases.getUpdated(lastUpdated.lastModified);

            await Promise.all(bsiCases.map(async (caseId) => {
                console.log("Building " + caseId);
                //Get all case data
                var bsiCase = await bsi.cases.get(caseId);
                if (lastUpdated.lastModified < bsiCase.molecularqc.lastModified.toISOString()) {
                    lastUpdated.lastModified = bsiCase.molecularqc.lastModified.toISOString();
                }
                await dynamo.molecularqcs.update(bsiCase.molecularqc);
                if (bsiCases.iscan) {
                    await dynamo.iscans.update(bsiCase.iscan);
                }
            }));

            await dynamo.updateLatest(lastUpdated);
            await bsi.logoff();
        },

        rebuild: async (caseId) => {
            await bsi.login();
            var bsiCase = await bsi.cases.get(caseId);
            await Promise.all([dynamo.molecularqcs.update(bsiCase.molecularqc),
                               dynamo.iscans.update(bsiCase.iscan)]);
            await bsi.logoff();
        }
    };
})();

module.exports = bsiCaseModule;