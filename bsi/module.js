'use strict';

const bsiRequest = require('./request');
const bsiParse = require('./parse');

const bsiModule = (() => {
    return {
        login: () => {
            return bsiRequest.login();
        },

        logoff: () => {
            return bsiRequest.logoff();
        },

        receipts: {
            getUpdated: (lastModified) => {
                return bsiRequest.receipts.getUpdated(lastModified);
            },

            get: (shipmentId) => {
                return bsiRequest.receipts.get(shipmentId)
                .then(results => {
                    return bsiParse.receipts.parseReport(results);
                });
            }
        },

        cases: {
            getUpdated: (lastModified) => {
                return bsiRequest.cases.getUpdated(lastModified);
            },

            get: (caseId) => {
                return bsiRequest.cases.get(caseId)
                .then(results => {
                    return bsiParse.cases.parseReport(results);
                });
            }
        },

        molecularqcs: {
            get: (caseId) => {
                return bsiRequest.cases.get(caseId)
                .then(results => {
                    return bsiParse.molecularqcs.parseReport(results);
                });
            }
        },

        iscans: {
            get: (caseId) => {
                return bsiRequest.cases.get(caseId)
                .then(results => {
                    return bsiParse.iscans.parseReport(results);
                });
            }
        },

        proteins: {
            get: (caseId) => {
                return bsiRequest.cases.get(caseId)
                .then(results => {
                    return bsiParse.proteins.parseReport(results);
                });
            }
        }
    };
})();

module.exports = bsiModule;