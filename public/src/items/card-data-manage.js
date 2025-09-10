import { generateShortId } from "../utils/helpers";
import { elementTemplates, majorCardTypes } from "./cards";
import * as localData from "../databases/local-data";

export function makeBlock(domain, values, editDate = null) {
    const blockTemplate = elementTemplates.find(bt => bt.key.includes(domain));
    if (!blockTemplate)
        return;

    const pracValues = values;
    blockTemplate.value?.forEach(val => {
        if (!val.isOmittable && !pracValues.some(pv => pv.refName === val.refName)) {
            pracValues.push({refName: val.refName, value: val.initialValue ? val.initialValue() : undefined});
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

export function appendData(parent, objectDat, forceToBeValue = false) {
    //console.log("Appending ", parent, "<--", objectDat);
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
        parent.value = objectDat;
    }
    console.log("Appended to: ", parent);
}

export function deleteData(parent, objectDat) {
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
        if (parent.value.valueID === objectDat.valueID) {
            parent.value = undefined;
        }
    }
    console.log("Deleted from: ", parent);
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

export function processValueType(valueType) {
    var val =valueType;
    if (valueType.includes('-')) {
        val = valueType.split('-')[0].trim();
    }
    return val.split('|').map(s => s.trim());
}

export function getDataUID(cardDataArray) {
    return cardDataArray.find(cb => cb.key === 'uid')?.value?.find(cbv => cbv.refName === 'uid')?.value?.value;
}

export function getBlocks(cardDataArray, keys) {
    var result = null;
    const pracKeys = Array.isArray(keys) ? keys : [keys];
    const isObject = element => {
        return Object.prototype.toString.call(element) === '[object Object]' || (Array.isArray(element) && typeof element !== 'string');
    };
    const remainingData = [];
    cardDataArray.forEach(block => remainingData.push(block));
    while (remainingData.length > 0) {
        const firstData = remainingData.shift();
        if (isObject(firstData) && firstData.key && pracKeys.includes(firstData.key)) {
            const template = elementTemplates.find(et => et.key.includes(firstData.key));
            if (template && template.return && template.return.block) {
                if (!result) result = [];
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
            Object.keys(firstData).forEach(key => {
                const child = firstData[key];
                if (isObject(child))
                    remainingData.unshift(child);
            });
        }
    }
    return result;
}

export function getReturnValue(valueType, objectDat, valueChannelRefName, valueMode, options = null) {
    if (!valueType || !valueMode || !objectDat)
        return null;

    //console.log("Y0 Try getting the return value of --", objectDat, " w/", valueType, valueChannelRefName, valueMode, "options:", options);
    //Valuedat = {key, value, valueID} 
    var pracVal = objectDat;
    var objectTemplate = null;
    var satisfactions = null;
    while (pracVal && !satisfactions) {
        var elTemplate = null;
        var elSatisfaction = null;
        if (pracVal.key) {
            elTemplate = elementTemplates.find(et => et.key.includes(pracVal.key));
            elSatisfaction = checkValueReturnSatisfaction(elTemplate, valueType);
            //console.log("Y1 Testing the satisfactions originated from", pracVal, "for the valueType", elSatisfaction);
            if (elSatisfaction) {
                //console.log("Y1-0 Element/Block", pracVal,"can satisfy the requested valueType: ", valueType, "with satisfaction:", satisfactions);
                //>> Check if the UD elements can also satisfy the valueType or not -> Preventing the infinite loop
                if (valueChannelRefName && pracVal.value) {
                    var candidateUDVal = pracVal.value;
                    //console.log("Y1-0.1", candidateUDVal);
                    if (Array.isArray(candidateUDVal) && candidateUDVal.length > 0 && candidateUDVal[0].refName) {
                        candidateUDVal = candidateUDVal.find(bv => {
                            //console.log("Y1-0.1E - Examining a child", bv, "with the refName of", valueChannelRefName);
                            return valueChannelRefName === "*" || (bv.refName && bv.refName === valueChannelRefName && bv.value);
                        }).value;
                    }
                    if (candidateUDVal && candidateUDVal.key) {
                        //console.log("Y1-0.2", candidateUDVal);
                        const cUDValTemplate = elementTemplates.find(et => et.key.includes(candidateUDVal.key));
                        if (cUDValTemplate) {
                            //console.log("Y1-0.3");
                            const cUDValSat = checkValueReturnSatisfaction(cUDValTemplate, valueType);
                            if (cUDValSat) {
                                //console.log("Y1-0.4 Element/Block", pracVal, "also possesses a UD element", candidateUDVal,"which can satisfy the valueType", valueType);
                                pracVal = candidateUDVal;
                                objectTemplate = cUDValTemplate;
                                satisfactions = cUDValSat;
                                continue;
                            }
                        }
                    }

                }

                objectTemplate = elTemplate;
                satisfactions = elSatisfaction;
                continue;
            }
        }

        if (isBlock(pracVal)) {
                //console.log("Y1-1 Block", pracVal,"CANNOT satisfy the requested valueType: ", valueType);
                if (valueChannelRefName && pracVal.value && pracVal.value.length > 0) {
                    const rootIndx = pracVal.value.findIndex(bv => {
                        return valueChannelRefName === "*" || (bv.refName && bv.refName === valueChannelRefName && bv.value);
                    });
                    if (rootIndx >= 0) {
                        pracVal = pracVal.value[rootIndx].value;
                        //console.log("Y1-1-2 Now pracVal is a value: ", pracVal);
                        continue;
                    }
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
        const result = selectedSat[valueMode](objectTemplate, pracVal, options);
        //console.log("Y2.5 This is the return result: ", result, " of the request of: ", valueType, valueChannelRefName, valueMode, "Requested from: ", objectDat, pracVal);
        return result;
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

export function isMatter(el) {
    return el !== undefined && el !== null;
} 