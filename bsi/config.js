var config = {};

config.uri = {};
config.uri.login = process.env.BSI_BASE_URL + 'VARI/common/logon';
config.uri.logoff = process.env.BSI_BASE_URL + 'common/logoff';
config.uri.fields = process.env.BSI_BASE_URL + 'VARI/database/tables/%tablename%/fields';
config.uri.vialReport = process.env.BSI_BASE_URL + 'VARI/reports/list?' +
    'display_fields=%2Bvial.bsi_id&' +
    'display_fields=%2Bvial.current_label&' +
    'display_fields=%2Bvial.parent_id&' +
    'display_fields=%2Bvial.date_entered&' +
    'display_fields=%2Bvial.date_modified&' +
    'display_fields=%2Bvial.mat_type&' +
    'display_fields=%2Bvial.study_id&' +
    'display_fields=%2Bvial.volume&' +
    'display_fields=%2Bvial.volume_unit&' +
    'display_fields=%2Bvial.field_345&' +
    'display_fields=%2Bvial.field_342&' +
    'display_fields=%2Bvial.field_343&' +
    'display_fields=%2Bvial.field_344&' +
    'display_fields=%2Bvial.field_348&' +
    'display_fields=%2Bvial.field_339&' +
    'display_fields=%2Bvial.field_397&' +
    'display_fields=%2Bvial.field_398&' +
    'display_fields=%2Bvial.field_399&' +
    'display_fields=%2Bvial.field_356&' +
    'display_fields=%2Bvial.field_366&' +
    'display_fields=%2Bvial.field_336&' +
    'display_fields=%2Bsample.date_last_modified&' +
    'display_fields=%2Bsample.tumor_type&' +
    'display_fields=%2Bsubject.subject_id&' +
    'display_fields=%2Bsubject.date_last_modified&' +
    'display_fields=%2Bsubject_8.field_14&' +
    'display_fields=%2Bsubject_8.field_9&' +
    'display_fields=%2Bsubject_8.field_16&' +
    'display_fields=%2Bsubject_8.field_23&' +
    'display_fields=%2Bsubject_8.field_22&' +
    'criteria=subject.subject_id="%caseId%"&' +
    'sort_fields=vial.date_entered';
config.uri.pooledReport = process.env.BSI_BASE_URL + 'VARI/reports/list?' +
    'display_fields=req_vial_tasks.ship_results_label&' +
    'display_fields=req_vial_tasks.bsi_id&' +
    'criteria=requisition.billing_study%3D%22CPTAC%22&' +
    'criteria=req_tasks.req_task_type="Pool"&' +
    'sort_fields=req_vial_tasks.ship_results_label';
config.uri.getCaseByVialLastModified = process.env.BSI_BASE_URL + 'VARI/reports/list?' +
    'display_fields=subject.subject_id&' +
    'criteria=vial.date_modified%3E"%lastModified%"&' +
    'criteria=subject_8.field_14!%3D%40%40Missing&' +
    'criteria=vial.field_356!%3D%40%40Missing&' +
    'criteria=vial.study_id%3D%22CPTAC%22';
config.uri.getCaseBySampleLastModified = process.env.BSI_BASE_URL + 'VARI/reports/list?' +
    'display_fields=subject.subject_id&' +
    'criteria=sample.date_last_modified%3E"%lastModified%"&' +
    'criteria=subject_8.field_14!%3D%40%40Missing&' +
    'criteria=vial.field_356!%3D%40%40Missing&' +
    'criteria=vial.study_id%3D%22CPTAC%22';
config.uri.getCaseBySubjectLastModified = process.env.BSI_BASE_URL + 'VARI/reports/list?' +
    'display_fields=subject.subject_id&' +
    'criteria=subject.date_last_modified%3E"%lastModified%"&' +
    'criteria=subject_8.field_14!%3D%40%40Missing&' +
    'criteria=vial.field_356!%3D%40%40Missing&' +
    'criteria=vial.study_id%3D%22CPTAC%22';
config.uri.getShipmentById = process.env.BSI_BASE_URL + 'VARI/reports/list?' +
    'display_fields=%2Bshipment.shipment_id&' +
    'display_fields=%2Bshipment.shipment_type&' +
    'display_fields=%2Bshipment.courier&' +
    'display_fields=%2Bshipment.tracking_id&' +
    'display_fields=%2Bshipment.date_created&' +
    'display_fields=%2Bshipment.date_modified&' +
    'display_fields=%2Bshipment.date_shipped&' +
    'display_fields=%2Bshipment.date_received&' +
    'display_fields=%2Bshipment.notes&' +
    'display_fields=%2Bshipment.center&' +
    'display_fields=%2Bshipment.collection_center&' +
    'display_fields=%2Bshipment.kit_ids&' +
    'display_fields=%2Bshipment_vial_manifest.status&' +
    'display_fields=%2Bshipment_vial_manifest.subject_id&' +
    'display_fields=%2Bshipment_vial_manifest.current_label&' +
    'display_fields=%2Bshipment_vial_manifest.sample_id&' +
    'display_fields=%2Bshipment_vial_manifest.bsi_id&' +
    'display_fields=%2Bshipment_vial_manifest.seq_num&' +
    'display_fields=%2Bshipment_vial_manifest.kit_id&' +
    'criteria=shipment.shipment_id%3D%22%shipmentId%%22&' +
    'criteria=shipment_vial_manifest.type%3D%221%22';
config.uri.getModifiedShipments = process.env.BSI_BASE_URL + 'VARI/reports/list?' +
    'display_fields=shipment.shipment_id&' +
    'display_fields=shipment.date_modified&' +
    'criteria=shipment.date_modified%3E"%lastModified%"&' +
    'criteria=shipment.shipment_status%3D%223%22&' +
    'criteria=vial.study_id%3D%22CPTAC%22';
    
config.receipts = {};
config.receipts.Metadata = [
    {'table': 'shipment', 'fields': ['shipment.shipment_id', 'shipment.shipment_type', 'shipment.courier', 
    'shipment.tracking_id', 'shipment.date_created', 'shipment.date_modified', 'shipment.date_shipped', 
    'shipment.date_received', 'shipment.notes', 'shipment.center', 'shipment.collection_center', 
    'shipment.kit_ids']},
    {'table': 'shipment_vial_manifest', 'fields': ['shipment_vial_manifest.status', 'shipment_vial_manifest.subject_id', 
    'shipment_vial_manifest.current_label', 'shipment_vial_manifest.sample_id', 'shipment_vial_manifest.bsi_id', 
    'shipment_vial_manifest.seq_num', 'shipment_vial_manifest.kit_id']}
];
config.receipts.fieldNameMap = {'shipment.date_modified': 'lastModified'};

config.vials = {};
config.vials.Metadata = [
    {'table': 'vial', 'fields': ['vial.bsi_id', 'vial.current_label', 'vial.parent_id', 'vial.date_entered', 
    'vial.date_modified', 'vial.mat_type', 'vial.study_id', 'vial.volume', 'vial.volume_unit', 'vial.field_345', 'vial.field_342', 'vial.field_343', 
    'vial.field_344', 'vial.field_348', 'vial.field_339', 'vial.field_397', 'vial.field_398', 'vial.field_399', 
    'vial.field_356', 'vial.field_366', 'vial.field_336']},
    {'table': 'sample', 'fields': ['sample.date_last_modified', 'sample.tumor_type']},
    {'table': 'subject', 'fields': ['subject.subject_id', 'subject.date_last_modified']},
    {'table': 'subject_8', 'fields': ['subject_8.field_14', 'subject_8.field_9', 'subject_8.field_16', 
    'subject_8.field_23', 'subject_8.field_22']}
];
config.vials.fieldNameMap = {'vail.study_id': 'studyCode', 'vial.date_modified': 'lastModified', 
    'sample.date_last_modified': 'sampleLastModified', 'subject.date_last_modified': 'subjectLastModified', 
    'vial.field_342': 'concentrationByNanodropNgL', 'vial.field_339': 'concentrationByQubitNgL', 
    'vial.field_343': '260280', 'vial.field_344': '260230', 'vial.parent_id': 'parentIds', 
    'vial.study_id': 'studyCode', 'vial.field_336': 'cellCount'};

module.exports = config;