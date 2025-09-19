import * as cardEditor from "../editors/card-editor";
import * as cardDataManage from "../../items/card-data-manage";
import * as localData from "../../databases/local-data";
import { hyperflatArray } from "../../utils/helpers";
import { elementTemplates } from "../../items/cards";
import { createModalWindow } from "../modals";
import { forceRenderOpeningPage } from "../pages";

export function getModalCardCreation(cardDataArray = null) {
    const cardCreationWindowName = "Card Creation";
    const modal = createModalWindow(cardCreationWindowName);
    modal.classList.add("modal-card-creation");
    modal.style.maxWidth = '85%';
    modal.querySelector(".btn-modal-close").addEventListener('click', () => {
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
    });

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
            const newEditor = cardEditor.createEditor(parentHtml, "html", parentData, block, newBlock);
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