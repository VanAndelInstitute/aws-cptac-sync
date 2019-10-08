'use strict';

const bsi = require('./bsi/module');
const dynamo = require('./dynamo/module');

var bsiCaseModule = (() => {

    return {
        pullRecentChanges: async () => {
            await bsi.login();
            
            var lastUpdated = await dynamo.getLatest('Case');

            var bsiCases = await bsi.cases.getUpdated(lastUpdated.lastModified);

            for (let index = 0; index < bsiCases.length; index++) {
                console.log("Building " + bsiCases[index]);
                //Get all case data
                var bsiCase = await bsi.cases.get(bsiCases[index]);
                if (lastUpdated.lastModified < bsiCase.molecularqc.lastModified) {
                    lastUpdated.lastModified = bsiCase.molecularqc.lastModified;
                }
                await dynamo.molecularqcs.update(bsiCase.molecularqc);
                if (bsiCase.iscan) {
                    await dynamo.iscans.update(bsiCase.iscan);
                }
            }

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