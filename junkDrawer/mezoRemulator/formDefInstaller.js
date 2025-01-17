/*
    because there's just not any easier way to do this
    and I need to get it done

    that.api would already have a nocieMexoAPI object 
*/
loadSchemaDefs(){
    let that = this;
    return(new Promise((toot, boot) => {
        new noiceRemedyAPI({
            protocol: window.location.protocol.replace(':',''),
            server: window.location.hostname,
            proxyPath: '/REST',
            user: '',       // no way mang
            password: ''    // as if
        }).authenticate().then((rapi) => {

            let schemaList = [
                "NPAM:NSCAN5:UserInfo",
                "NPAM:NSCAN2:LineItemView",
                "NPAM:NSCAN2:LocationNotes",
                "NPAM:NSCAN5:Location",
                "NPAM:Manufacturer_Vendor",
                "NPAM:NSCAN2:PO Number Registry",
                "NPAM:NSCAN2:PO PreSubmitQueue",
                "NPAM:PRR Data",
                "NPAM:NSCAN2:Row",
                "NPAM:NSCAN2:TagRegistry",
                "NPAM:Product Catalog",
                "NPAM:NSCAN2:TrackingNumberRegistry",
                "CTM:People"
            ];

            function recursor(idx){
                if (idx == schemaList.length){
                    toot(true);
                }else{
                    rapi.getFormFields({ schema: schemaList[idx] }).then((formDef) => {
                        that.api.putFile({
                            fileName: `formDefinition_${schemaList[idx]}.json`,
                            data: new TextEncoder().encode(JSON.stringify(formDef))
                        }).then((res) => {
                            console.log(`formDefinition_${schemaList[idx]}.json -> ${res.id}`);

                            rapi.getFormFields({ schema: schemaList[idx], fetchMenus: true}).catch((error) => {
                                console.log(`ignored: ${error}`);
                            }).then((formDeff) => {
                                if (formDef instanceof Object){
                                    that.api.putFile({
                                        fileName: `formDefinitionWithMenus_${schemaList[idx]}.json`,
                                        data: new TextEncoder().encode(JSON.stringify(formDeff))
                                    }).then((ress) => {
                                        console.log(`formDefinitionWithMenus_${schemaList[idx]}.json -> ${ress.id}`);
                                        requestAnimationFrame(() => { recursor(idx+1); });
                                    });
                                }else{
                                    requestAnimationFrame(() => { recursor(idx+1); });
                                }
                            });
                        }).catch((error) => {
                            boot(error);
                        });
                    }).catch((error) => {
                        boot(error);
                    })
                }
            }
            recursor(0);

        }).catch((error) => {
            console.log(error);
        })
    }));
}
