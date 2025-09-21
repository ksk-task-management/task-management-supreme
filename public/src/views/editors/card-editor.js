import * as inlineCommands from "../../items/inline-commands";
import * as contextMenu from "../context-menu";
import * as cardDataManage from "../../items/card-data-manage";
import * as viewCardEditor from "./view-card-editor";
import { elementTemplates } from "../../items/cards";

export function renderExistingBlocks(parentHtml, dataArray) {
    if (!parentHtml || !dataArray || dataArray.length <= 0)
        return;
    //console.log("T-1", dataArray);
    dataArray.forEach(blockdat => {
        const elementTemplate = elementTemplates.find(et => et.key.includes(blockdat.key));
        //console.log("T-1# >>Creating Edtor For: ", blockdat);
        createEditor(parentHtml, "html", dataArray, elementTemplate, cardDataManage.makeValue(blockdat.key, blockdat));
    });
}

//The 'data' is either block/block array
export function createInputCarret(parentHtml, data, valueType, options = null) {
    if (!parentHtml) {
        return;
    }

    const isInline = options?.inline === true;
    const isAdditive = options?.additive === true;
    var inlinePlaceholder = null;
    if (options) {
        if (options.innerValueType) {
            inlinePlaceholder = options.innerValueType.replace('*', "•ᴗ•");
        }
        else if (options.placeholder) {
            inlinePlaceholder = options.placeholder;
        }
    }
    
    const forceDataToBeValue = options?.forceDataToBeValue === true;

    const inputFieldHandlerHtml = document.createElement('span');
    inputFieldHandlerHtml.classList.add('editor', 'input-field-span-inline-handler');

    var newInputField = null;
    if (!isInline) {
        newInputField = document.createElement('span');
        newInputField.contentEditable = true;
        newInputField.role = 'textbox';
        if (inlinePlaceholder)
            newInputField.setAttribute('data-value-type', inlinePlaceholder);
        newInputField.addEventListener('click', ev => {
            ev.target.focus();
            ev.stopPropagation();
        });
       // newInputField = document.createElement('input');
        //newInputField.type = 'text';
        //newInputField.placeholder = `Type some block or command(${inlineCommands.inlineCommandChar})...`;
        newInputField.classList.add('editor', 'input-text', 'input-text-seamless', 'block-insert-omit');
    }
    else {
        newInputField = document.createElement('span');
        newInputField.contentEditable = true;
        newInputField.role = 'textbox';
        if (inlinePlaceholder)
            newInputField.setAttribute('data-value-type', inlinePlaceholder);
        newInputField.classList.add('editor', 'input-block-value', 'block-insert-omit', 'inline');
        newInputField.addEventListener('click', ev => {
            ev.target.focus();
            ev.stopPropagation();
        });
        inputFieldHandlerHtml.classList.add('inline');
    }
    inputFieldHandlerHtml.appendChild(newInputField);
    if (isAdditive) {
        inputFieldHandlerHtml.classList.add("input-additive");
    }

    newInputField.addEventListener('input', ev => {
        const currentInput = ev.target.value ?? ev.target.textContent;
        const matchedItems = [];

        if (valueType) {
            console.log("Inputting ", valueType);
            elementTemplates.forEach(et => {
                if (!et.key || et.key.length <= 0)
                    return;
                if (!cardDataManage.checkValueReturnSatisfaction(et, valueType)) {
                    return;
                }
                et.key.forEach(etk => {
                    var textParts = contextMenu.generateMatchedTextParts(etk.toLowerCase(), currentInput.toLowerCase());
                    if (textParts.length > 0) {
                        var newMatch = {
                            icon: et.icon ? et.icon(null) : "token",
                            textParts: textParts.map(t => {
                                const result = {text: t.text};
                                if (t.addMode === true){
                                    result.highlightColor = 'var(--color-selected)';
                                }
                                return result;
                            }),
                            onClick: () => {
                                var newValueDat = null;
                                if (et.return.block) {
                                    //Block
                                    newValueDat = cardDataManage.makeValue(etk, cardDataManage.makeBlock(etk, []));
                                }
                                else {
                                    //Value
                                    newValueDat = cardDataManage.makeValue(etk, undefined);
                                }
                                cardDataManage.appendData(data, newValueDat, {forceToBeValue: forceDataToBeValue, ...options});

                                if (!isAdditive) {
                                    //Destroy old value editors
                                    if (isInline === true) {
                                        parentHtml.querySelectorAll('.value-object').forEach(el => {
                                            el.remove();
                                        });
                                    }
                                }
                            
                                const newBlockEditor = createEditor(parentHtml, valueType, data, et, newValueDat);

                                //if (!isAdditive) {
                                    //Handle inline caret behaviour
                                    checkInlineCaretVisibility(parentHtml);
                                //}
                            }
                        };
                        const m1 = textParts.filter(p => p.addMode === true).map(p => p.text).join('');
                        newMatch.score = m1.length;
                        matchedItems.push(newMatch);
                    }
                });
            });
        }

        if (options && options.customMenuItems) {
            const customMenuItems = options.customMenuItems(ev);
            if (Array.isArray(customMenuItems))
                matchedItems.push(...customMenuItems);
        }

        contextMenu.createMenu(inputFieldHandlerHtml, matchedItems, {clearCaller: true});
    });
    contextMenu.bindEventDefaultKeys(newInputField);
    parentHtml.appendChild(inputFieldHandlerHtml);
}

export function checkInlineCaretVisibility(parentHtml, exceptionCount = 0) {
    var caret = null;
    Array.from(parentHtml.children).forEach(el => {
        var currentEl = el;
        if (!caret && currentEl.classList.contains("input-field-span-inline-handler")) {
            caret = currentEl;
        }
    })
    if (!caret || !caret.classList.contains('inline') || caret.classList.contains('input-additive')){
        caret.classList.remove('hidden');
        return;
    }

    const children = parentHtml.querySelectorAll('.value-object');
    const childrenCount = children.length - exceptionCount;
    if (childrenCount > 0) {
        caret.classList.add('hidden');
    }
    else {
        caret.classList.remove('hidden');
    }
}

export function createEditor(parentHtml, valueType, parentData, objectTemplate, objectDat, options = null) {
    if (!objectTemplate || !objectDat) {
        return null;
    }

    //console.log("T0 Obj Template", objectTemplate);
    //console.log("T0.q The Obj Itself", objectDat);
    var newEditor = null;
    var isBlock = false;
    if (objectTemplate.return && objectTemplate.return.block) {
        //console.log("T1.1");
        //For Provided Element Template: Block call, ...
        newEditor = createBlockEditor(parentHtml, objectDat.value);
        isBlock = true;
    }
    else {
        //For unprovided template: Value call, Inline value call... 
        //console.log("T1.2");
        const actualValueKey = objectDat.key;
        const actualElementTemplate = elementTemplates.find(et => et.key.includes(actualValueKey));
        if (actualElementTemplate) {
            //console.log("T1.2.1 Try sending and get the editor: ", objectDat);
            if (valueType.includes('-')) {
                if (!options) options = {};
                options.innerValueType = valueType.split('-')[1].trim();
            }
            newEditor = cardDataManage.getReturnValue(actualValueKey, objectDat, null, "editor", options);
        }
        isBlock = false;
    }
   
    if (newEditor) {
       insertEditorAgainstCaret(parentHtml, newEditor);
        newEditor.classList.add('value-object');
        newEditor.addEventListener('click', ev => {
            ev.target.classList.toggle('clicked');
            ev.stopPropagation();
            document.querySelectorAll('.value-object.clicked').forEach(el => {
                if (el === ev.target)
                    return;
                el.classList.remove('clicked');
            });

            if (ev.target.classList.contains('clicked')) {
                //Common
                const menuItems = [];
                //Array Editors
                if (parentData && Array.isArray(parentData)) {
                    const currentIdx = parentData.findIndex(c => cardDataManage.isMatch(c, objectDat));
                    if (currentIdx > 0) {
                        menuItems.push(
                            {
                                icon: "north",
                                onClick: () => {
                                    const targetIdx = currentIdx - 1;
                                    const targetElement = parentData[targetIdx];
                                    var pracVal = objectDat;
                                    if (cardDataManage.isBlock(targetElement) && !cardDataManage.isBlock(pracVal) && pracVal.value && cardDataManage.isBlock(pracVal.value)) {
                                        pracVal = pracVal.value;
                                    }
                                    parentData[targetIdx] = pracVal;
                                    parentData[currentIdx] = targetElement;
                                    const testIndex = Array.from(parentHtml.children).indexOf(newEditor);
                                    if (testIndex > -1) {
                                       const target = parentHtml.children[testIndex - 1];
                                       parentHtml.insertBefore(newEditor, target);
                                    }
                                }
                            }
                        )
                    }

                    if (currentIdx < parentData.length - 1) {
                        menuItems.push(
                            {
                                icon: "south",
                                onClick: () => {
                                    const targetIdx = currentIdx + 1;
                                    const targetElement = parentData[targetIdx];
                                    var pracVal = objectDat;
                                    if (cardDataManage.isBlock(targetElement) && !cardDataManage.isBlock(pracVal) && pracVal.value && cardDataManage.isBlock(pracVal.value)) {
                                        pracVal = pracVal.value;
                                    }
                                    parentData[targetIdx] = pracVal;
                                    parentData[currentIdx] = targetElement;
                                    const testIndex = Array.from(parentHtml.children).indexOf(newEditor);
                                    if (testIndex > -1) {
                                       const target = parentHtml.children[testIndex + 1];
                                       parentHtml.insertBefore(target, newEditor);
                                    }
                                }
                            }
                        )
                    }
                }
                //Universal
                menuItems.push(
                    {
                        icon: 'delete',
                        color: 'red',
                        onClick: () => {
                            cardDataManage.deleteData(parentData, objectDat, {...options});
                            newEditor.remove();
                            checkInlineCaretVisibility(parentHtml, 1);
                            console.log("Removed", parentData, objectTemplate, valueType);
                            //viewCardEditor.renderEditorToolbar(parentHtml, parentData, "#", valueType, "block");
                        }
                    }
                );

                const menu = contextMenu.createMenu(newEditor, menuItems, {
                    direction: "horizontal", 
                    alignItems: "center",
                    firstSelected: false
                });
                const callerBound = newEditor.getBoundingClientRect();
                const menuBound = menu.getBoundingClientRect();
                const newLeft = Math.max(callerBound.left, Math.min(ev.clientX, callerBound.left + callerBound.width - menuBound.width));
                const newTop = callerBound.top;
                contextMenu.adjustCustomPosition(newEditor, newLeft, newTop, callerBound.width, callerBound.height);
            }
            else contextMenu.closeMenu();
        });
    }
    
    return newEditor;
}

function insertEditorAgainstCaret(parentHtml, newEditor) {
    const inputCaret = Array.from(parentHtml.children).find(child => child.classList.contains('input-field-span-inline-handler'));
    if (inputCaret && parentHtml.contains(inputCaret)) {
        parentHtml.insertBefore(newEditor, inputCaret);
    }
    else {
        parentHtml.appendChild(newEditor);
    }
}

export function createBlockEditor(parentHtml, block) {
    if (!parentHtml || !block || !block.key)
        return null;
    const blockTemplate = elementTemplates.find(bt => bt.key && bt.key.includes(block.key));
    if (!blockTemplate)
        return;

    const newBlockEditor = document.createElement('div');
    newBlockEditor.classList.add('editor', 'block-editor');
    //Block Key
    const blockKeyArea = document.createElement('div');
    blockKeyArea.classList.add('area-horizontal', 'area-fit-horizontal', 'area-newline', 'editor', 'block-editor-key-area');
    const blockIcon = document.createElement('span');
    blockIcon.classList.add('material-symbols-outlined', 'icon');
    blockIcon.textContent = blockTemplate.icon ? blockTemplate.icon() : "token";
    blockKeyArea.appendChild(blockIcon);
    const blockKeyTitle = document.createElement('span');
    console.log("[B] ", block.key, typeof block.key);
    blockKeyTitle.textContent = block.key[0].toUpperCase() + block.key.substring(1).replaceAll('-', " ");
    blockKeyArea.appendChild(blockKeyTitle);
    newBlockEditor.appendChild(blockKeyArea);
    //Values
    const valueArea = document.createElement('div');
    valueArea.classList.add('editor', 'block-value-area');
    newBlockEditor.appendChild(valueArea);
    block.value.forEach(bv => {
        const valueTemplate = blockTemplate.value.find(btv => btv.refName === bv.refName);
        if (!valueTemplate) {
            return;
        }
        createValueEditor(valueArea, valueTemplate, bv);
    });

    //Value Input
    const valueInputField = createInputCarret(valueArea, null, null, {
        inline: true,
        placeholder: "+",
        customMenuItems: ev => {
            const result = [];
            const allInputtableValues = blockTemplate.value?.map(v => {
                return {
                    valueTemplate: v,
                    searchKey: v.refName.toLowerCase().replaceAll("_", " ")
                }
            });
            for (let bv of block.value) {
                const comparingName = bv.refName.toLowerCase().replaceAll("_", " ");
                const existIndex = allInputtableValues.findIndex(v => v.searchKey === comparingName);
                if (existIndex >= 0) {
                    allInputtableValues.splice(existIndex, 1);
                }
            }
            allInputtableValues.forEach(v => {
                const textParts = contextMenu.generateMatchedTextParts(v.searchKey, ev.target.textContent.toLowerCase());
                if (textParts.length > 0) {
                    const newMatch = {
                        textParts: textParts.map(t => {
                            return {
                                text: t.text,
                                highlightColor: t.addMode === true ? "red" : null
                            } 
                        }),
                        icon: "label",
                        onClick: () => {
                            const newBlockValue = cardDataManage.makeBlockValueFromTemplate(v.valueTemplate);
                            if (newBlockValue) {
                                block.value.push(newBlockValue);
                                createValueEditor(valueArea, v.valueTemplate, newBlockValue);
                            }
                        }
                    };
                    const m1 = textParts.filter(p => p.addMode === true).map(p => p.text).join('');
                    newMatch.score = m1.length;
                    result.push(newMatch);
                }
            });
            return result;
        }
    }); /*document.createElement('span');
    valueInputField.contentEditable = true;
    valueInputField.role = 'textbox';
    valueInputField.classList.add('editor', 'input-block-value');
    valueInputField.addEventListener('input', ev => {
        const matchedValues = [];
        blockTemplate.value?.forEach(btv => {
            const valueEditorTemplate = elementTemplates.find(vet => vet.key.includes(btv.type) && vet.return && vet.return[btv.type]);
            if (!valueEditorTemplate)
                return;
            const textParts = contextMenu.generateMatchedTextParts(btv.refName.toLowerCase(), ev.target.textContent.toLowerCase());
            if (textParts.length > 0) {
                var newMatch = {
                    icon: valueEditorTemplate.icon ? valueEditorTemplate.icon(null) : "label",
                    textParts: textParts.map(t => {
                        const result = {text: t.text};
                        if (t.addMode === true){
                            result.highlightColor = 'var(--color-selected)';
                        }
                        return result;
                    }),
                    onClick: () => {
                        console.log(btv, 'is Clicked');
                       // console.log(bt, btk, "isClicked");
                    }
                };
                const m1 = textParts.filter(p => p.addMode === true).map(p => p.text).join('');
                newMatch.score = m1.length;
                matchedValues.push(newMatch);
            }
        });
        contextMenu.createMenu(valueInputField, matchedValues);
    });
    valueInputField.addEventListener('click', ev => {
        ev.target.focus();
    });
    contextMenu.bindEventDefaultKeys(valueInputField);
    valueArea.appendChild(valueInputField);*/
    return newBlockEditor;
}

export function createValueEditor(parentHtml, valueTemplate, valueDat) {
    var valElementTemplate = null;
    if (valueDat.value && valueDat.value.key) {
        valElementTemplate = elementTemplates.find(et => et.key.includes(valueDat.value.key)); //valueEditors.find(v => v.type && v.type.includes(valueTemplate.type));
    }
   // console.log("T@ Generating a value editor for: ", valueTemplate, "-->", valElementTemplate, valueDat);
    const newValueEditor = document.createElement('span');
    newValueEditor.classList.add('editor', 'value-editor');
    //Header
    const newValueHeaderArea = document.createElement('span');
    newValueHeaderArea.classList.add('editor', 'area-horizontal', 'area-fit-horizontal', 'value-header-area');
    newValueEditor.appendChild(newValueHeaderArea);
    const newValueHeaderIcon = document.createElement('span');
    newValueHeaderIcon.classList.add('material-symbols-outlined', 'icon');
    newValueHeaderIcon.textContent = valElementTemplate && valElementTemplate.icon ? valElementTemplate.icon() : 'label';
    newValueHeaderArea.appendChild(newValueHeaderIcon);
    const newValueHeaderText = document.createElement('span');
    newValueHeaderText.classList.add("txt-value-label");
    newValueHeaderText.textContent = valueTemplate.name;
    newValueHeaderArea.appendChild(newValueHeaderText);
    //Value
    if (valElementTemplate) {
        //Value > Value Editor
        const valueValueEditor = createEditor(newValueEditor, valueTemplate.type, valueDat, valElementTemplate, valueDat.value);
    }
    //Value > Caret to select inner values
    const innerCaret = createInputCarret(newValueEditor, valueDat, valueTemplate.type, {inline: true, innerValueType: valueTemplate.type});
    checkInlineCaretVisibility(newValueEditor);

    //Appending Logic
    insertEditorAgainstCaret(parentHtml, newValueEditor);
}