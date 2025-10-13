import * as cardEditor from "../editors/card-editor";
import * as cardDataManage from "../../items/card-data-manage";
import * as localData from "../../databases/local-data";
import { hyperflatArray } from "../../utils/helpers";
import { elementTemplates } from "../../items/cards";
import { closeModalByID, createModalWindow } from "../modals";
import { forceRenderOpeningPage } from "../pages";

export function getModalCardEditor(cardDataArray = null) {
    const cardCreationWindowName = "Card Creation";
    const modal = createModalWindow(cardCreationWindowName, {displayCloseButton: false});
    modal.classList.add("modal-card-creation");
    modal.style.maxWidth = '85%';

    //Top Panels
    const topPanelHtml = document.createElement('div');
    topPanelHtml.classList.add("view-card-editor-top-panel");
    modal.appendChild(topPanelHtml);

    const leftPanelHtml = document.createElement('div');
    leftPanelHtml.classList.add('view-card-editor-top-subpanel');
    topPanelHtml.appendChild(leftPanelHtml);
    
    /*const txtDelete = document.createElement('span');
    txtDelete.classList.add("txt");
    txtDelete.textContent = "Delete";
    btnDeleteCard.appendChild(txtDelete);*/

    const rightPanelHtml = document.createElement('div');
    rightPanelHtml.classList.add('view-card-editor-top-subpanel');
    topPanelHtml.appendChild(rightPanelHtml);
    //Save Button
    const btnSaveCard = document.createElement('div');
    btnSaveCard.classList.add("btn-card-editor", "btn-save");
    rightPanelHtml.appendChild(btnSaveCard);
   /* const icnSave = document.createElement('span');
    icnSave.classList.add('icon', 'material-symbols-outlined');
    icnSave.textContent = 'save';
    btnSaveCard.appendChild(icnSave);*/
    const txtSave = document.createElement('span');
    txtSave.classList.add("txt");
    txtSave.textContent = "Save this card";
    btnSaveCard.appendChild(txtSave);
    btnSaveCard.addEventListener('click', () => {
        localData.appendLocalCard(cardDataArray);
        localData.saveCloudCard(cardDataArray);
        forceRenderOpeningPage();

        /*if (editorToolbarHtml) {
            editorToolbarHtml.remove();
            editorToolbarHtml = null;
        }

        if (editorElementHandler) {
            editorElementHandler.remove();
            editorElementHandler = null;
        }*/
        const modalID = modal.dataset.modalID;
        if (modalID) {
            closeModalByID(modalID);
        }
    });
    //Delete Button
    const btnDeleteCard = document.createElement('div');
    btnDeleteCard.classList.add("btn-card-editor", "btn-delete");
    rightPanelHtml.appendChild(btnDeleteCard);
    const icnDelete = document.createElement('span');
    icnDelete.classList.add('icon', 'material-symbols-outlined');
    icnDelete.textContent = 'delete_forever';
    btnDeleteCard.appendChild(icnDelete);
    btnDeleteCard.addEventListener('click', () => {
        localData.deleteLocalCard(cardDataArray);
        localData.deleteCloudCard(cardDataArray);
        forceRenderOpeningPage();

        const modalID = modal.dataset.modalID;
        if (modalID) {
            closeModalByID(modalID);
        }
    });

    /*modal.querySelector(".btn-modal-close").addEventListener('click', () => {
        //console.log("Saving a card: ", JSON.stringify(cardDataArray), userData.sheetID);
        localData.appendLocalCard(cardDataArray);
        localData.uploadCard(cardDataArray);
        forceRenderOpeningPage();

        if (editorToolbarHtml) {
            editorToolbarHtml.remove();
            editorToolbarHtml = null;
        }

        if (editorElementHandler) {
            editorElementHandler.remove();
            editorElementHandler = null;
        }
    });*/

    if (!cardDataArray) cardDataArray = [];
    cardDataManage.validateData(cardDataArray);
    cardEditor.renderExistingBlocks(modal, cardDataArray);
    //renderEditorToolbar(modal, cardDataArray, "#", "html");
    cardEditor.createInputCarret(modal, cardDataArray, "html");
}

let editorToolbarHtml = null;
let editorElementHandler = null;
let scrollID = null;
export function renderEditorToolbar(parentHtml, parentData, parentTemplate, appendableType, dataPath = "$") {
    if (!editorToolbarHtml) {
        editorToolbarHtml = document.createElement('div');
        editorToolbarHtml.classList.add('input-field-span-inline-handler', 'toolbar-card-editor');

        //Left-knob
        const leftKnobHtml = document.createElement('div');
        leftKnobHtml.classList.add('toolbar-card-editor-knob');
        const leftKnobIcon = document.createElement('span');
        leftKnobIcon.classList.add('icon', 'material-symbols-outlined');
        leftKnobIcon.textContent = "arrow_left";
        leftKnobHtml.appendChild(leftKnobIcon);
        editorToolbarHtml.appendChild(leftKnobHtml);

        //Handler
        editorElementHandler = document.createElement('div');
        editorElementHandler.classList.add('toolbar-card-editor-element-handler');
        editorToolbarHtml.appendChild(editorElementHandler);

        //Right-knob
        const rightKnobHtml = document.createElement('div');
        rightKnobHtml.classList.add('toolbar-card-editor-knob');
        const rightKnobIcon = document.createElement('span');
        rightKnobIcon.classList.add('icon', 'material-symbols-outlined');
        rightKnobIcon.textContent = "arrow_right";
        rightKnobHtml.appendChild(rightKnobIcon);
        editorToolbarHtml.appendChild(rightKnobHtml);
        parentHtml.appendChild(editorToolbarHtml);

        //Scrolling
        leftKnobHtml.addEventListener('mousedown', () => startScrolling(-1));
        leftKnobHtml.addEventListener('mouseup', stopScrolling);
        leftKnobHtml.addEventListener('mouseleave', stopScrolling);
        rightKnobHtml.addEventListener('mousedown', () => startScrolling(1));
        rightKnobHtml.addEventListener('mouseup', stopScrolling);
        rightKnobHtml.addEventListener('mouseleave', stopScrolling);
        stopScrolling();
    }

    Array.from(editorElementHandler.children).forEach(et => et.remove());
    var contraKeys = [];
    if (dataPath === 'block') {
        const cardDataArray = parentTemplate === "#" ? parentData : cardDataManage.getCardContainingData(parentData);
        if (cardDataArray)
            contraKeys = hyperflatArray(cardDataManage.getBlocks(cardDataArray, "*"), {excludedNulls: true})?.map(c => c.key) ?? [];
    }
    
    elementTemplates.filter(block => block.return && block.return.block && (!block.isSingular || !contraKeys.some(conKey => block.key.includes(conKey))))/*.filter(et => et.key.some(etk => !contraBlocks || contraBlocks.length <= 0 || !contraBlocks.includes(etk)))*/.forEach(block => {
        const btnNewElement = document.createElement('div');
        btnNewElement.classList.add('btn-toolbar-card-editor');
        const newElementIcon = document.createElement('div');
        newElementIcon.classList.add('icon', "material-symbols-outlined", "toolbar-card-editor-icon");
        newElementIcon.textContent = block.icon();
        btnNewElement.appendChild(newElementIcon);
        editorElementHandler.appendChild(btnNewElement);
        btnNewElement.addEventListener('click', () => {
            const newBlock = cardDataManage.makeValue(block.key[0], cardDataManage.makeBlock(block.key[0], []));
            cardDataManage.appendData(parentData, newBlock);
            const newEditor = cardEditor.createEditor(parentHtml, "html", parentData, block, newBlock, {
                dataSlot: parentData,
                dataSlotType: appendableType
            });
            cardEditor.checkInlineCaretVisibility(parentHtml);
            renderEditorToolbar(parentHtml, parentData, parentTemplate, appendableType, dataPath);
        });
    });
}

function startScrolling(direction) {
    if (!editorElementHandler)
        return;
    scrollID = setInterval(() => {
        editorElementHandler.scrollBy({left: 5 * direction, behaviour: "smooth"});
    }, 7);
}

function stopScrolling() {
    if (!scrollID)
        return;
    clearInterval(scrollID);
}