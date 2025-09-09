import * as inlineCommands from "./inline-commands";
import * as contextMenu from "../views/context-menu";
import * as cardDataManage from "./card-data-manage";
import { elementTemplates } from "./cards";

export function renderExistingBlocks(parentHtml, dataArray) {
    if (!parentHtml || !dataArray || dataArray.length <= 0)
        return;
    console.log("T-1", dataArray);
    dataArray.forEach(blockdat => {
        const elementTemplate = elementTemplates.find(et => et.key.includes(blockdat.key));
        console.log("T-1# >>Creating Edtor For: ", blockdat);
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
    const forceDataToBeValue = options?.forceDataToBeValue === true;

    //console.log("Generaring caret for value type:", valueType);
    var newInputField = null;
    if (!isInline) {
        newInputField = document.createElement('input');
        newInputField.type = 'text';
        newInputField.placeholder = `Type some block or command(${inlineCommands.inlineCommandChar})...`;
        newInputField.classList.add('editor', 'input-text', 'input-text-seamless', 'block-insert-omit');
    }
    else {
        newInputField = document.createElement('span');
        newInputField.contentEditable = true;
        newInputField.role = 'textbox';
        newInputField.classList.add('editor', 'input-block-value', 'block-insert-omit');
        newInputField.addEventListener('click', ev => {
            ev.target.focus();
        });
    }
    newInputField.addEventListener('input', ev => {
        //const env = cardDataManage.getDataEnvironment(data);
        const currentInput = ev.target.value ?? ev.target.textContent;
        const matchedItems = [];
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
                            cardDataManage.appendData(data, newValueDat, forceDataToBeValue);

                            if (!isAdditive) {
                                //Destroy old value editors
                                if (isInline === true) {
                                    parentHtml.querySelectorAll('.value-object').forEach(el => {
                                        el.remove();
                                    });
                                }
                            }
                            
                            const newBlockEditor = createEditor(parentHtml, valueType, data, et, newValueDat);

                            if (!isAdditive) {
                                //Handle inline caret behaviour
                                checkInlineCaretVisibility(parentHtml);
                            }
                        }
                    };
                    const m1 = textParts.filter(p => p.addMode === true).map(p => p.text).join('');
                    newMatch.score = m1.length;
                    matchedItems.push(newMatch);
                }
            });
        });
        contextMenu.createMenu(newInputField, matchedItems);
    });
    contextMenu.bindEventDefaultKeys(newInputField);
    parentHtml.appendChild(newInputField);
}

export function checkInlineCaretVisibility(parentHtml, exceptionCount = 0) {
    var caret = null;
    Array.from(parentHtml.children).forEach(el => {
        if (!caret && el.classList.contains("block-insert-omit")){
            caret = el;
        }
    })
    if (!caret || caret.tagName !== 'SPAN')
        return;
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
    if (objectTemplate.return && objectTemplate.return.block) {
        //console.log("T1.1");
        //For Provided Element Template: Block call, ...
            //Block Editor
            newEditor = createBlockEditor(parentHtml, objectDat.value);
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
            newEditor = cardDataManage.getReturnValue(objectDat.key ?? valueType, objectDat, null, "editor", options);
            //Check if the element template can provide the return type as request or not?
            /*const satisfactions = cardDataManage.checkValueReturnSatisfaction(actualElementTemplate, valueType);
             console.log("T1.2.1", satisfactions);
            var selectedReturn = null;
            while (!selectedReturn && satisfactions.length > 0) {
                const first = satisfactions.shift();
                if (first.editor)
                    selectedReturn = first;
            }
            console.log("T1.2.2");
            if (selectedReturn) {
                 console.log("T1.2.3");
                newEditor = selectedReturn.editor(objectTemplate, objectDat);
            }
            else if (actualElementTemplate.return.block) {
                //No satisfying editor for this type of value -> Find other way to display the editor
                console.log("This value required block display");
            }
            else {
                return null;
            }

            //Check if the element template provide block display or not*/

        }
    }
    /*if (objectTemplate.return.block) {
        //Block Editor
        const newBlockEditor = createBlockEditor(parentHtml, objectDat);
    }
    else {
        //Value Editor (Customized within the template)
    }*/
    if (newEditor) {
        console.log("T2 Inserting the new editor: ", newEditor, "Into", parentHtml, parentHtml.children.length);
        const inputCaret = Array.from(parentHtml.children).find(child => child.classList.contains('block-insert-omit'));
        if (inputCaret && parentHtml.contains(inputCaret)) {
            console.log("T2.1 Inserting before the caret: ", inputCaret);
            parentHtml.insertBefore(newEditor, inputCaret);
        }
        else {
            parentHtml.appendChild(newEditor);
        }

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
                const menuItems = [
                    {
                        text: "Delete",
                        icon: 'delete',
                        color: 'red',
                        fontSize: '14px',
                        onClick: () => {
                            console.log("Deleted: ", objectDat);
                            console.log("Remaining: ", parentData);
                            cardDataManage.deleteData(parentData, objectDat);
                            newEditor.remove();
                            checkInlineCaretVisibility(parentHtml, 1);
                           // console.log('Deleting the element');
                        }
                    }
                ];
                const menu = contextMenu.createMenu(newEditor, menuItems, false);
                //contextMenu.adjustCustomPosition(ev.clientX, ev.clientY, 0, 0);
                const callerBound = newEditor.getBoundingClientRect();
                const menuBound = menu.getBoundingClientRect();
                const newLeft = Math.max(callerBound.left, Math.min(ev.clientX, callerBound.left + callerBound.width - menuBound.width));
                const newTop = callerBound.top;
                contextMenu.adjustCustomPosition(newLeft, newTop, callerBound.width, callerBound.height);
            }
            else contextMenu.closeMenu();
        });
    }
    
    return newEditor;
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
    blockKeyTitle.textContent = block.key;
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
    const valueInputField = document.createElement('span');
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
    valueArea.appendChild(valueInputField);
    return newBlockEditor;
}

export function createValueEditor(parentHtml, valueTemplate, valueDat) {
    var valElementTemplate = null;
    if (valueDat.value && valueDat.value.key) {
        valElementTemplate = elementTemplates.find(et => et.key.includes(valueDat.value.key)); //valueEditors.find(v => v.type && v.type.includes(valueTemplate.type));
    }
    console.log("T@ Generating a value editor for: ", valueTemplate, "-->", valElementTemplate, valueDat);
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
    const innerCaret = createInputCarret(newValueEditor, valueDat, valueTemplate.type, {inline: true});
    checkInlineCaretVisibility(newValueEditor);

    parentHtml.appendChild(newValueEditor);
}