import { generateShortId, hyperflatArray } from "../utils/helpers";
import { elementTemplates, majorCardTypes } from "./cards";
import * as localData from "../databases/local-data";
import * as pages from "../views/pages";

export function makeBlock(domain, values, editDate = null) {
    const blockTemplate = elementTemplates.find(bt => bt.key.includes(domain));
    if (!blockTemplate)
        return;

    const pracValues = values;
    blockTemplate.value?.forEach(val => {
        if (val.isOmittable)
            return;

        if (!pracValues.some(pv => pv.refName === val.refName)) {
            const newBlockValue = makeBlockValueFromTemplate(val);
            if (newBlockValue) {
                pracValues.push(newBlockValue);
            }
        }
    });

    const newBlock = {
        uid: generateShortId(),
        key: domain,
        value: values,
        lastEdit: editDate ? editDate : new Date()
    }
    return newBlock;
}

export function makeBlockValueFromTemplate(valueTemplate) {
    if (!valueTemplate)
        return null;
    return {
        refName: valueTemplate.refName,
        value: valueTemplate.initialValue ? valueTemplate.initialValue() : undefined
    }
}

export function makeValue(valueKey, value) {
    var pracVal = value;
    if (!pracVal) {
        const elementTemplate = elementTemplates.find(et => et.key.includes(valueKey));
        if (elementTemplate && elementTemplate.value && elementTemplate.value.length > 0) {
            elementTemplate.value.forEach(vt => {
                if (vt.refName === '$' && vt.initialValue) {
                    pracVal = vt.initialValue().value;
                }
            });
        }
    }
    return {valueID: generateShortId(), key: valueKey, value: pracVal};
}

export function appendData(parent, objectDat, options = null) {
    //console.log("Appending ", parent, "<--", objectDat);
    const forceToBeValue = options && options.forceToBeValue === true;
    const targetName = options?.vp ?? "value";
    if (Array.isArray(parent)) {
        if (objectDat.value && isBlock(objectDat.value) && !forceToBeValue) {
            parent.push(objectDat.value);
        }
        else {
            parent.push(objectDat);
        }
    }
    else {
        //The parent is a value section
        if (objectDat.key && objectDat.value && !objectDat.valueID && !isBlock(objectDat)) {
            objectDat.valueID = generateShortId();
        }
        parent[targetName] = objectDat;
    }
    console.log("Appended to: ", parent);
}

export function deleteData(parent, objectDat, options = null) {
    const targetName = options?.vp ?? "value";
    if (Array.isArray(parent)) {
        var valueIndex = parent.findIndex(el => el.valueID === objectDat.valueID);
        if (valueIndex < 0 && isBlock(objectDat.value)) {
            //The objectDat is a pseudo-value, containing a block inside
            valueIndex = parent.findIndex(el => el.uid === objectDat.value.uid);
        }
        if (valueIndex >= 0)
            parent.splice(valueIndex, 1);
    }
    else {
        if (!parent[targetName] || !parent[targetName]?.valueID || parent[targetName].valueID === objectDat.valueID) {
            parent[targetName] = undefined;
        }
    }
    console.log("Deleted from: ", parent);
}

export function deleteCard(cardDataArray) {
    localData.deleteLocalCard(cardDataArray);
    localData.deleteCloudCard(cardDataArray);
    pages.forceRenderOpeningPage();
}

export function validateData(dataArray, env = null) {
    if (env === null) {
        env = getDataEnvironment(dataArray);
    }

    elementTemplates.forEach(bt => {
        var isReqOnEnv = false;
        if (bt.isRequiredOn && bt.isRequiredOn.length >= 0) {
            if (bt.isRequiredOn.includes("*M") && (env === 'M?' || majorCardTypes.includes(env))) {
                isReqOnEnv = true;
            }
            else {
                if (bt.isRequiredOn.includes(env)) {
                   
                    isReqOnEnv = true;
                }
            }
        }
        if (!isReqOnEnv || dataArray.some(dat => bt.key.includes(dat.key)))
            return;
        const newBlock = makeValue(bt.key[0], makeBlock(bt.key[0], bt.value.map(v => {
            return {
                refName: v.refName,
                value: v.initialValue ? v.initialValue() : "<NaN>"
            }
        })));
        appendData(dataArray, newBlock);
    });
}

export function checkValueReturnSatisfaction(elementTemplate, valueType) {
    if (!elementTemplate) return null;
    const processedVT = processValueType(valueType);
    if (!processedVT || processedVT.length <= 0) {
        return null;
    }

    if (typeof elementTemplate === 'string') {
        elementTemplate = elementTemplates.find(et => et.key.includes(elementTemplate));
        if (!elementTemplate) return null;
    }

    const satisfactions = [];
    if (elementTemplate.return)
        for (var vt of processedVT){
            if (vt === '*') {
                satisfactions.push(...Object.values(elementTemplate.return));
                continue;
            }

            if (elementTemplate.return[vt]){
                satisfactions.push(elementTemplate.return[vt]);
            }
            else {
                const keys = Object.keys(elementTemplate.return);
                if (keys && keys.length > 0) {
                    for (var key of keys) {
                        const curRepresent = elementTemplate.return[key].represent;
                        if (curRepresent && Array.isArray(curRepresent) && curRepresent.includes(vt)) {
                            satisfactions.push(elementTemplate.return[key]);
                            //console.log("Referred satisfaction acquired: ", elementTemplate.return[key]);
                        }
                    }
                }
            }
        }
    return satisfactions.length > 0 ? satisfactions : null;
}

export function processValueType(valueType, getInsideType = false) {
    var val = valueType;
    if (val.includes('|')){
        val = val.split('|').map(s => s.trim());
    }
    else {
        val = [val];
    }
    while (val.some(v => v.includes('-'))) {
        const thatIdx = val.findIndex(v => v.includes('-'));
        var newValues = val[thatIdx].split('-');
        if (!getInsideType) {
            newValues = [newValues[0]];
        }
        val.splice(thatIdx, 1, ...newValues);
    }
    return val;
}

export function getDataUID(cardDataArray) {
    return cardDataArray.find(cb => cb.key === 'uid')?.value?.find(cbv => cbv.refName === 'uid')?.value?.value;
}

export function getDataTitle(cardDataArray) {
    return hyperflatArray(getBlocks(cardDataArray, "title")?.map(ct => getReturnValue('text', ct, 'title', "value")) ?? [], {excludedNulls: true, renderValues: true}).filter(s => typeof s === 'string')?.join(' ');
}

/***
 * @param {object} [options=null] {notFindUnderCompleteSections: boolean, notFindUnderKeys: [block-keys]}
 */
export function getBlocks(cardDataArray, keys, options = null) {
    const isNotFindUnderCompleteSections = options?.notFindUnderCompleteSections ?? undefined;
    const isNotFindUnderKeys = options?.notFindUnderKeys ?? undefined;

    var result = null;
    const pracKeys = Array.isArray(keys) ? keys : [keys];
    pracKeys.forEach(key => {
        const keyTemplate = elementTemplates.find(el => el.key.includes(key));
        if (keyTemplate) {
            keyTemplate.key.forEach(ktk => {
                if (!pracKeys.includes(ktk)) 
                    pracKeys.push(ktk);
            });
        }
    });
    const isByPassKeys = pracKeys.some(key => key.trim() === "*");
    const isObject = element => {
        return Object.prototype.toString.call(element) === '[object Object]' || (Array.isArray(element) && typeof element !== 'string');
    };
    const remainingData = [];
    cardDataArray.forEach(block => remainingData.push(block));
    while (remainingData.length > 0) {
        const firstData = remainingData.shift();
        if (isNotFindUnderCompleteSections && firstData.isComplete === true)
            continue;

        if (isObject(firstData) && firstData.key && (isByPassKeys || pracKeys.includes(firstData.key))) {
            const template = elementTemplates.find(et => et.key.includes(firstData.key));
            if (template && template.return && template.return.block) {
                if (!result) result = [];
                if (!result.some(rb => rb.uid === firstData.uid))
                    result.push(firstData);
            }
        }
        if (Array.isArray(firstData) && typeof firstData !== 'string') {
            firstData.forEach(child => {
                if (isObject(child)) {
                    remainingData.unshift(child);
                }
            });
        }
        else if (Object.prototype.toString.call(firstData) === '[object Object]') {
            if (isNotFindUnderKeys && isNotFindUnderKeys.length > 0 && firstData.key) {
                if (isNotFindUnderKeys.includes(firstData.key))
                    continue;
            }

            Object.keys(firstData).forEach(key => {
                const child = firstData[key];
                if (isObject(child)) {
                    remainingData.unshift(child);
                }
            });
        }
    }
    return result;
}

export function getDataReference(cardDataArray, someData, returnType = "value") {
    /*const pracKeys = Array.isArray(keys) ? keys : [keys];
    const isByPassKeys = pracKeys.some(key => key.trim() === "*");*/
    const isObject = element => {
        return Object.prototype.toString.call(element) === '[object Object]' || (Array.isArray(element) && typeof element !== 'string');
    };
    const remainingData = [];
    cardDataArray.forEach(block => remainingData.push({
        parent: cardDataArray,
        value: block
    }));
    while (remainingData.length > 0) {
        const firstData = remainingData.shift();
        if (isObject(firstData.value) && firstData.value === someData) {
            if (returnType === 'value') {
                return firstData.value;
            }
            else if (returnType === 'parent') {
                return firstData.parent;
            }
            else if (returnType === '$') 
                return firstData;
        }
        if (Array.isArray(firstData.value) && typeof firstData.value !== 'string') {
            firstData.value.forEach(child => {
                if (isObject(child)) {
                    remainingData.unshift({
                        parent: firstData.value,
                        value: child
                    });
                }
            });
        }
        else if (Object.prototype.toString.call(firstData.value) === '[object Object]') {
            Object.keys(firstData.value).forEach(key => {
                const child = firstData.value[key];
                if (isObject(child))
                    remainingData.unshift({
                        parent: firstData.value,
                        value: child
                    });
            });
        }
    }
    return null;
}

export function getReturnValue(valueType, objectDat, valueChannelRefName, valueMode, options = null) {
    if (!valueType || !valueMode || !objectDat)
        return null;

    //console.log("Y0 Try getting the return value of --", objectDat, " w/", valueType, valueChannelRefName, valueMode, "options:", options);
    //Valuedat = {key, value, valueID} 
    var pracVal = objectDat;
    var objectTemplate = null;
    var satisfactions = null;
    let isReferred = false;
    while (pracVal && !satisfactions) {
        var elTemplate = null;
        var elSatisfaction = null;
        if (isBlock(pracVal)) {
                //console.log("Y1-1 Block", pracVal,"CANNOT satisfy the requested valueType: ", valueType, " w/ requested refname: ", valueChannelRefName);
                if (valueChannelRefName && pracVal.value && pracVal.value.length > 0) {
                    const rootIndx = pracVal.value.findIndex(bv => {
                        return valueChannelRefName === "*" || (bv.refName && bv.refName === valueChannelRefName && bv.value);
                    });
                    if (rootIndx >= 0) {
                        isReferred = true;
                        pracVal = pracVal.value[rootIndx].value;
                        //console.log("Y1-1-2 Now pracVal is a value: ", pracVal);
                        continue;
                    }
                }
            }

        if (pracVal.key) {
            elTemplate = elementTemplates.find(et => et.key.includes(pracVal.key));
            elSatisfaction = checkValueReturnSatisfaction(elTemplate, valueType);
            //console.log("Y1 Testing the satisfactions originated from", pracVal, "for the valueType", elSatisfaction);
            if (elSatisfaction) {
                //console.log("Y1-0 Element/Block", pracVal,"can satisfy the requested valueType: ", valueType, " requested refName: ", valueChannelRefName, "with satisfaction:", satisfactions);
                //>> Check if the UD elements can also satisfy the valueType or not -> Preventing the infinite loop
                if (valueChannelRefName && pracVal.value) {
                    var candidateUDVal = pracVal.value;
                    //console.log("Y1-0.1", candidateUDVal);
                    if (Array.isArray(candidateUDVal) && candidateUDVal.length > 0 && candidateUDVal[0].refName) {
                        candidateUDVal = candidateUDVal.find(bv => {
                            //console.log("Y1-0.1E - Examining a child", bv, "with the refName of", valueChannelRefName);
                            return valueChannelRefName === "*" || (bv.refName && bv.refName === valueChannelRefName && bv.value);
                        })?.value;
                    }
                    if (candidateUDVal) {
                        if (candidateUDVal.key) {
                            //console.log("Y1-0.2", candidateUDVal);
                            const cUDValTemplate = elementTemplates.find(et => et.key.includes(candidateUDVal.key));
                            if (cUDValTemplate) {
                             //console.log("Y1-0.3");
                                const cUDValSat = checkValueReturnSatisfaction(cUDValTemplate, valueType);
                                if (cUDValSat) {
                                    //<!> Temporary Fixing -> Need for long-term support
                                    if (!isReferred && valueChannelRefName && valueChannelRefName !== "*" && (!candidateUDVal.refName || candidateUDVal.refName !== valueChannelRefName)) {
                                        //console.log("Candidate for rooting: ", candidateUDVal, isReferred);
                                        pracVal = candidateUDVal;
                                        continue;
                                    }
                                        
                                    //console.log("Y1-0.4 Element/Block", pracVal, "also possesses a UD element", candidateUDVal,"which can satisfy the valueType", valueType);
                                    pracVal = candidateUDVal;
                                    objectTemplate = cUDValTemplate;
                                    satisfactions = cUDValSat;
                                    continue;
                                }
                            }
                        }
                        
                    }
                    else {
                        pracVal = null;
                    }
                }

                objectTemplate = elTemplate;
                satisfactions = elSatisfaction;
                continue;
            }
        }

        if (pracVal.value) {
            if (isBlock(pracVal.value)) {
                //console.log("Y2R the value is a block -> Referred", pracVal.value);
                pracVal = pracVal.value;
                continue;
            }
        }

            

        

        pracVal = null;
    }
    if (!satisfactions || !objectTemplate)
        return null;

    if (valueMode === '$'){
        //console.log("Y$ Return the value itself: ", pracVal);
        return pracVal;
    }

    //console.log("Y2.1 Begin extract the element: ", pracVal, "with sat.", satisfactions, valueMode);
    var selectedSat = null;
    for (var i = 0; i < satisfactions.length; i++) {
        if (satisfactions[i][valueMode]) {
            selectedSat = satisfactions[i];
            break;
        }
    }
    if (selectedSat) {
        //console.log("Y2.2 Begin extract the element: ", pracVal, "The selected sat. is", selectedSat, valueMode);
        if (selectedSat[valueMode].goto) {
            return getReturnValue(selectedSat[valueMode].goto, objectDat, valueChannelRefName, valueMode);
        }

        var result = null;
        try {
            result = selectedSat[valueMode](objectTemplate, pracVal, options);
            return result;
        }
        catch (error) {
            console.error("Got error during the rendering result", error);
        }
        //console.log("Y2.5 This is the return result: ", result, " of the request of: ", valueType, valueChannelRefName, valueMode, "Requested from: ", objectDat, pracVal);
        //return result;
    }

    return null;


   /* if (pracVal) {
        if (isBlock(pracVal)) {
            //console.log("Y-1");
            if (valueChannelRefName && pracVal.value && pracVal.value.length > 0) {
                pracVal = pracVal.value.find(v => {
                    if (valueChannelRefName === '*') return true;
                    return v.refName === valueChannelRefName;
                })?.value;
                console.log("Y-1-1", pracVal);
            }
            else {
                //console.log("Y-1-2");
                pracVal = null;
            }
        }
        else if (pracVal.value) {
            var isSatisfied = false;
            if (pracVal.value.key) {
                const vvTemplate = elementTemplates.find(et => et.key.includes(pracVal.value.key));
                if (vvTemplate && checkValueReturnSatisfaction(vvTemplate, valueType)) {
                    console.log("+Y: ", pracVal.value, "with the key", pracVal.value.key, "can satisfy the valueType", valueType);
                    //isSatisfied = true;
                }
            }

            //console.log("Y0");
            if (!isSatisfied)
            if (isBlock(pracVal.value) && valueChannelRefName && pracVal.value.value && pracVal.value.value.length > 0) {
                console.log("Y-1-2 PRE", pracVal, "---->", pracVal.value, "--->", pracVal.value.value);
                pracVal = pracVal.value.value.find(v => {
                    if (valueChannelRefName === '*') return true;
                    return v.refName === valueChannelRefName;
                })?.value;
                console.log("Y-1-2", pracVal);
            }
        }
    }
    console.log("Y1 Got the return value: ", pracVal);
    if (!pracVal) {
        return null;
    }
    //console.log("Y2");
    const objectTemplate = elementTemplates.find(et => et.key.includes(pracVal.key) && et.return);
    const valueSatisfaction = checkValueReturnSatisfaction(objectTemplate, valueType);
    if (valueSatisfaction && valueSatisfaction.length > 0) {
        const selectedSat = valueSatisfaction[0];
        console.log("Y2.1", selectedSat);
        if (valueMode === '$'){
            console.log("Y# Return the value itself: ", pracVal);
            return pracVal;
        }

        if (valueMode && selectedSat[valueMode]) {
            //console.log("Y2.2");
            if (selectedSat[valueMode].goto) {
                //console.log("Y2.3");
                //console.log("FOUND GOTO SECTION: " + valueMode);
                return getReturnValue(selectedSat[valueMode].goto, objectDat, valueChannelRefName, valueMode);
            }
            console.log("Y2.4", valueMode, pracVal);
            const result = selectedSat[valueMode](objectTemplate, pracVal, options);
            console.log("Y2.5 This is the return result: ", result, " of the request of: ", valueType, valueChannelRefName, valueMode, "Requested from: ", objectDat, pracVal);
         
            return result;
        }
    }
    return null;*/
}

export function getCardContainingData(objectDat) {
    const isObject = element => {
        return Object.prototype.toString.call(element) === '[object Object]' || (Array.isArray(element) && typeof element !== 'string');
    };
    for (var cardDataArray of localData.localCardData) {
        const remainingData = [];
        cardDataArray.forEach(block => remainingData.push(block));
        while (remainingData.length > 0) {
            const firstData = remainingData.shift();
            if (firstData === objectDat) {
                return cardDataArray;
            }
            if (Array.isArray(firstData) && typeof firstData !== 'string') {
                firstData.forEach(child => {
                    if (isObject(child)) {
                        remainingData.unshift(child);
                    }
                });
            }
            else if (Object.prototype.toString.call(firstData) === '[object Object]') {
                Object.keys(firstData).forEach(key => {
                    const child = firstData[key];
                    if (isObject(child))
                        remainingData.unshift(firstData[key]);
                });
            }
        }
    }
    return null;
}
 
export function getDataEnvironment(data) {
    if (Array.isArray(data)) {
        return data.find(d => d.key === 'type')?.value?.find(v => v.refName === 'type').value ?? "M?";
    }
    else if (data.key && data.key.length > 0) {
        return data.key;
    }
}

export function isBlock(objectDat) {
    if (!objectDat.key || !objectDat.uid || !objectDat.value || !Array.isArray(objectDat.value))
        return false;
    const elementTemplate = elementTemplates.find(et => et.key && et.key.includes(objectDat.key));
    if (elementTemplate && elementTemplate.return && elementTemplate.return.block) {
        return true;
    }
    return false;
}

export function isMatch(d1, d2) {
    var data1 = d1;
    var data2 = d2;
    if (isBlock(data1) && !isBlock(data2) && data2.value && isBlock(data2.value)) {
        data2 = data2.value;
    }
    else if (isBlock(data2) && !isBlock(data1) && data1.value && isBlock(data1.value)) {
        data1 = data1.value;
    }
    //console.log("[1]", data1, data2, data1 === data2);
    if (data1 === data2) return true;
    //console.log("[2]", data1.valueID, data2.valueID, data1.valueID === data2.valueID);
    if (data1.valueID && data2.valueID && data1.valueID === data2.valueID) return true;
    //console.log("[3]", data1.uid, data2.uid, data1.uid === data2.uid);
    if (data1.uid && data2.uid && data1.uid === data2.uid) return true;
    return false;
}

export function isMatter(el) {
    return el !== undefined && el !== null;
} 

//Data Path System
export class DataPath {
    path = [];
    constructor (path = []) {
        this.path = path;
    }

    append(object) {
        this.path.push(object);
    }
}

export class PathObject {
    type;
    dataObject;
    constructor (type, dataObject) {
        this.type = type;
        this.dataObject = dataObject;
    }
}

export const pathType = {
    cardArray: "cardDataArray",
    block: "block",
    blockValue: "block-value",
    value: "value"
}