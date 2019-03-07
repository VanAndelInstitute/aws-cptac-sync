'use strict';

const bsiRequest = require('./request');
const bsiParse = require('./parse');

const bsiModule = (function() {
    return {
        login: function() {
            return bsiRequest.login();
        },

        getNewReceipts: function(lastModified) {
            return bsiRequest.getNewReceipts(lastModified);
        },

        getReceipt: function(shipmentId) {
            return bsiRequest.getReceipt(shipmentId)
            .then(results => {
                return bsiParse.parseShipmentReport(results);
            });
        },

        logoff: function() {
            return bsiRequest.logoff();
        }
    };
})();

module.exports = bsiModule;