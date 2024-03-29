'use strict';

import config from './config.js';
import got from 'got';
import dateformat from 'dateformat';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import https from 'node:https';
import crypto from 'node:crypto';

const secretClient = new SecretsManager();

const bsiRequestModule = (() => {
    var sessionId;

    async function getBsiSecrets() {
        return secretClient.getSecretValue({SecretId: process.env.BSI_SECRET});
    }

    async function createBsiRequest(uri) {
        return got(uri, {
            headers: { 'BSI-SESSION-ID': sessionId },
            agent: {
                https: new https.Agent({
                    secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
                }),
            },
        }).json();
    }

    return {
        login: async () => {
            let secrets = await getBsiSecrets();
            let response = await got.post(config.uri.login, {
                form: JSON.parse(secrets.SecretString),
                agent: {
                    https: new https.Agent({
                        secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
                    }),
                },
            });
            sessionId = response.body;
        },

        getTableMetadata: async (table) => {
            return createBsiRequest(config.uri.fields.replace('%tablename%', table));
        },

        logoff: async () => {
            return got.post(config.uri.logoff, {
                headers: { "BSI-SESSION-ID": sessionId },
                agent: {
                    https: new https.Agent({
                        secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
                    }),
                },
            });
        },

        receipts: {
            getUpdated: async (lastModified) => {
                lastModified = dateformat(lastModified, 'mm%2Fdd%2Fyyyy%20HH%3AMM');
                return createBsiRequest(config.uri.getModifiedShipments.replace('%lastModified%', lastModified));
            },

            get: async (shipmentId) => {
                return createBsiRequest(config.uri.getShipmentById.replace('%shipmentId%', shipmentId));
            }
        },

        cases: {
            getUpdated: async (lastModified) => {
                lastModified = dateformat(lastModified, 'mm%2Fdd%2Fyyyy%20HH%3AMM');
                try {
                    let reports = await Promise.all([
                        createBsiRequest(config.uri.getCaseByVialLastModified.replace('%lastModified%', lastModified)),
                        createBsiRequest(config.uri.getCaseBySampleLastModified.replace('%lastModified%', lastModified)),
                        createBsiRequest(config.uri.getCaseBySubjectLastModified.replace('%lastModified%', lastModified))
                    ]);
                    let caseIds = [];
                    reports.forEach(report =>
                        report.rows.forEach(results =>
                            results.forEach(caseId => {
                                caseIds.push(caseId);
                            })
                        )
                    );
                    return caseIds.filter((value, index, self) => {return self.indexOf(value) === index;});
                } catch (error) {
                    console.log(error)
                };
            },

            get: (caseId) => {
                return Promise.all([createBsiRequest(config.uri.vialReport.replace('%caseId%', caseId)),
                        createBsiRequest(config.uri.pooledReport.replace('%caseId%', caseId))]);
            },
        }
    };
})();

export default bsiRequestModule;