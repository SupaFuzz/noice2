const proprtyDBLegacyColMap = {
    "Entry ID": 1,
    "Create Date": 3,
    "Last Modified By": 5,
    "Modified Date": 6,
    "Serial Number": 200000001,
    "Tier 1": 200000003,
    "Center": 260000001,
    "Building": 260000004,
    "Room": 260000005,
    "Tag Number": 260100004,
    "Part Number": 262000003,
    "Bin / Rack": 536870917,
    "Last Inventory Date": 536870922,
    "Mac Address": 536871017,
    "paper.tagNumber": 536871035,
    "rfid.tagNumber": 536871036,
    "Manufacturer Name": 240001003,
    "Latitude": 536871040,
    "Longitude": 536871041,
    "Assigned To": 4,
    "Property Type": 1234560120,
    "Unit Price": 260600001,
    "Description": 8,
    "Company": 1000000001,
    "Requisition ID": 263000017,
    "CRQ": 1000000182,
    "PO Number": 260100023,
    "FSC": 536870920,
    "NPAM Status": 536870978
};

const InventorySyncConfig = {
    createOptions: { keyPath: 'entryId'},
    indexes: {
        entryId:            { keyPath: 'entryId', unique: true, _id: 1},
        Center:             { keyPath: 'Center', _id: 260000001},
        Building:           { keyPath: 'Building', _id: 260000004},
        Room:               { keyPath: 'Room', _id: 260000005 },
        CenterBuildingRoom: { keyPath: ['Center', 'Building', 'Room'] },
        CenterBuilding:     { keyPath: ['Center', 'Building'] }
    },
    _sync: {

        // DO NOT DISABLE THIS ON PROD -- the wait is too damn high!
        disablePrune: true,

        enableSync: true,
        syncOrder: 1,
        bulkPutLimit: 1800,
        query: {
            schema: 'NPAM:NSCAN2:LineItemView',
            fields: Object.keys(proprtyDBLegacyColMap).map((l) => {return(proprtyDBLegacyColMap[l])}),
            QBE: `('TagNumber' != $NULL$ OR 'SerialNumber' != $NULL$)`
        },
        syncInterval: (60 * 2 * 1000), // 2 minutes
        pruneInterval: (60 * 60 * 2 * 1000), // 2 hours
        rowUpdateCallback: (threadHandle, data) => {
        /*
            TO-DO: update onscreen rows that changed
            NOTE: data is the notificationQueue from handleTransmits() of the form:
            {
                formName: formMeta.formName,
                entryId: <serverEntryId>,
                old_entryId: <createModeOriginalEntryId(should be deleted by here)
            }
            this is the list of entryId values on the target dataStore
            that not only transmitted, but have been refreshed
            this is a placeholder for now, something in the app at large needs to get
            a signal.
        */
        },
        syncCompleteCallback: (threadHandle, data) => {
            // handle completed form sync parent thread messaging here
        },
        formDefinitionTransform: (formDefinition) => {
            /*
                allows transform of formDefinition.
                if defined, this is executed between api.getFormFields()
                and indexedDB.put(). you really shouldn't need this but is the
                most elegant solution to the problem with currency fields on
                view forms. Whatever you return is gonna be what gets wrote
            */
            if (
                (formDefinition instanceof Object) &&
                (formDefinition.nameIndex instanceof Object) &&
                formDefinition.nameIndex.hasOwnProperty('Unit Price')
            ){
                formDefinition.nameIndex['Unit Price'].datatype = 'CURRENCY';
                formDefinition.idIndex[formDefinition.nameIndex['Unit Price'].id].datatype = 'CURRENCY';
            }
            return(formDefinition);
        }

    },
    _bulkSync: {
        metaQuery: {
            schema: 'NICS:OfflineData',
            QBE: `'DocumentTitle' = "NSCAN2DataFile"`,
            fields: ['DocumentLength', 'Entry ID', 'Modified Date']
        },
        disableSlowPrune: true,
        getDataFileBuildDate: (metaQueryResult, threadHandle) => {
            // config-define way of getting the bulk file build date
            return(
                (
                    (metaQueryResult instanceof Object) &&
                    (metaQueryResult.entries instanceof Array) &&
                    (metaQueryResult.entries[0] instanceof Object) &&
                    (metaQueryResult.entries[0].values instanceof Object) &&
                    (metaQueryResult.entries[0].values.hasOwnProperty('Modified Date')) &&
                    (! isNaN(parseInt(threadHandle.toEpoch(metaQueryResult.entries[0].values['Modified Date']))))
                )?parseInt(threadHandle.toEpoch(metaQueryResult.entries[0].values['Modified Date'])):0
            )
        },
        dataFileQueryCallback: (metaQueryResult, formMeta, threadHandle) => {
            return({
                schema: 'NICS:OfflineData',
                ticket: metaQueryResult.entries[0].values['Entry ID'],
                fields: [ 'DocumentData' ],
                progressCallback: (evt) => {
                    threadHandle.statusUpdate({
                        message: `sync ${formMeta.formName}`,
                        detail: `downloading bulk sync file`,
                        additionalDetail: `${evt.loaded} bytes [${Math.floor((evt.loaded/metaQueryResult.entries[0].values['DocumentLength'])*100)}%]`,
                        updatePieCharts: [{name: 'network', value: ((evt.loaded/metaQueryResult.entries[0].values['DocumentLength'])*100)}],
                        logMessage: false
                    });
                }
            });
        },
        hasNewDataCallback: (metaQueryResult, formMeta, threadHandle) => {

            // this is a more agnostic way of knowing if we have new data
            return(
                (metaQueryResult instanceof Object) &&
                (metaQueryResult.entries instanceof Array) &&
                (metaQueryResult.entries[0] instanceof Object) &&
                (metaQueryResult.entries[0].values instanceof Object) &&
                (metaQueryResult.entries[0].values.hasOwnProperty('Modified Date')) &&
                (! isNaN(parseInt(threadHandle.toEpoch(metaQueryResult.entries[0].values['Modified Date'])))) &&
                (formMeta instanceof Object) &&
                formMeta.hasOwnProperty('lastBulkSyncFileDate') &&
                (! isNaN(parseInt(formMeta.lastBulkSyncFileDate))) &&
                (
                    parseInt(threadHandle.toEpoch(metaQueryResult.entries[0].values['Modified Date'])) >
                    parseInt(formMeta.lastBulkSyncFileDate)
                )
            )
        },
        parseDataFile: (dataFileQueryResult, formMeta, threadHandle) => {
            return(new Promise((toot, boot) => {
                /*
                    this takes output of the dataFileQuery
                    returning an array of indexedDB datastore row-formatted records
                    this should return a promise resolving to { maxModifiedDate: <int>, writeQueue: <array> }
                */
                let out = {
                    maxModifiedDate: 0,
                    writeQueue: []
                };
                if (
                    (dataFileQueryResult instanceof Object) &&
                    (dataFileQueryResult.values instanceof Object) &&
                    dataFileQueryResult.values.hasOwnProperty('DocumentData')
                ){
                    // parse it
                    let parsed = {};
                    let errorFlag = false;
                    try {
                        parsed = JSON.parse(dataFileQueryResult.values.DocumentData);
                    }catch(e){
                        threadHandle.log(`handleBulkSync('NPAM:NSCAN2:LineItemView') | config.parseDataFile() | JSON.parse() threw unexpectedly: ${e}`);
                        errorFlag = true;
                        boot(e);
                    }

                    // decode rows and accumulate maxModifiedDate
                    if (
                        (! errorFlag) &&
                        (parsed instanceof Object) &&
                        (parsed.propertyDB instanceof Object) &&
                        (parsed.propertyDB.colOrder instanceof Array) &&
                        (parsed.propertyDB.rowDB instanceof Array) &&
                        (threadHandle instanceof Object) &&
                        (threadHandle.formIndexMappings instanceof Object) &&
                        (threadHandle.formIndexMappings['NPAM:NSCAN2:LineItemView'] instanceof Object)
                    ){
                        out.writeQueue = parsed.propertyDB.rowDB.map((row, idx) => {
                            let rowTmp = {};
                            row.forEach((col, i) => {
                                let fieldID = proprtyDBLegacyColMap[parsed.propertyDB.colOrder[i]];
                                let colName = threadHandle.formIndexMappings['NPAM:NSCAN2:LineItemView'].hasOwnProperty(fieldID)?threadHandle.formIndexMappings['NPAM:NSCAN2:LineItemView'][fieldID]:fieldID;
                                rowTmp[colName] = col;
                            });
                            if (
                                rowTmp.hasOwnProperty('6') &&
                                (! isNaN(parseInt(rowTmp['6']))) &&
                                (parseInt(rowTmp['6']) > out.maxModifiedDate)
                            ){ out.maxModifiedDate = parseInt(rowTmp['6']); }
                            return(rowTmp);
                        });
                    }
                }
                toot(out);
            }));
        },
        dataFileFieldMap: proprtyDBLegacyColMap,

    }, // end _bulkSync
}
export { InventorySyncConfig };
