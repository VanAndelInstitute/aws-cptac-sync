'use strict';

import bsiRequest from './request.js';
import bsiParse from './parse.js';

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

            get: async (shipmentId) => {
                let results = await bsiRequest.receipts.get(shipmentId)
                return bsiParse.receipts.parseReport(results);
            }
        },

        cases: {
            getUpdated: (lastModified) => {
                return bsiRequest.cases.getUpdated(lastModified);
            },

            get: async (caseId) => {
                let results = await bsiRequest.cases.get(caseId)
                return bsiParse.cases.parseReport(results);
            }
        },

        molecularqcs: {
            get: async (caseId) => {
                let results = await bsiRequest.cases.get(caseId)
                return bsiParse.molecularqcs.parseReport(results);
            }
        },

        iscans: {
            get: async (caseId) => {
                let results = await bsiRequest.cases.get(caseId)
                return bsiParse.iscans.parseReport(results);
            }
        },

        proteins: {
            get: async (caseId) => {
                let results = await bsiRequest.cases.get(caseId)
                return bsiParse.proteins.parseReport(results);
            }
        }
    };
})();

export default bsiModule;