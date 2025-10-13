import * as localData from "../../databases/local-data";
import * as cardDataManage from "../../items/card-data-manage";
import * as cardDisplay from "../../views/renders/card-displayers";
import * as pages from "../pages";
import * as viewCardEditor from "../editors/view-card-editor";
import { defaultCardStatus, elementTemplates } from "../../items/cards";

export const masonryContainer = document.getElementById('masonrylist-container');
const gapSize = 5;
let timeToRerenderFunction = null;
export function render(pageObject, options = null) {
    if (!masonryContainer)
        return;
    masonryContainer.innerHTML = '';
    const columnCount = getColumnCount();
    const columnWidth = (masonryContainer.getBoundingClientRect().width  - (columnCount + 1) * gapSize) / columnCount;
    for (var i = 0; i < columnCount; i++) {
        createColumn(columnWidth);
    }
    renderCards(options);

    const masonryBackButton = document.getElementById('btn-masonry-inside-back');
    const masonryBoardEditButton = document.getElementById('btn-masonry-inside-edit');
    if (options && options.env) {
        masonryBackButton.classList.remove('hidden');
        masonryBackButton.onclick = () => {
            pages.gotoPreviousPage();
        }

        masonryBoardEditButton.classList.remove('hidden');
        masonryBoardEditButton.onclick = () => {
            const boardCardDataArray = localData.localCardData.find(lc => cardDataManage.getDataUID(lc) === options.env);
            if (!boardCardDataArray)
                return;
            viewCardEditor.getModalCardEditor(boardCardDataArray);
        }
    }
    else {
        masonryBackButton.classList.add('hidden');
        masonryBoardEditButton.classList.add('hidden');
    }

    const masonryAddCardButton = document.getElementById('btn-masonrylist-add-card');
    masonryAddCardButton.onclick = () => {
        const defaultBlocks = [];
        if (options && options.env) {
            const parentBlockTemplate = elementTemplates.find(et => et.key.includes('parent'));
            const parentValueTemplate = parentBlockTemplate.value?.find(v => v.refName === 'parent');
            const newParentValue = cardDataManage.makeBlockValueFromTemplate(parentValueTemplate);
            cardDataManage.appendData(newParentValue, cardDataManage.makeValue('text', options.env));
            cardDataManage.appendData(defaultBlocks, cardDataManage.makeValue(parentBlockTemplate.key[0], cardDataManage.makeBlock("parent", [newParentValue])));
        }
        viewCardEditor.getModalCardEditor(defaultBlocks);
    }

    //Scrolling adjustment
    const pageMasonry = document.getElementById('page-cards-masonrylist');
    if (pageMasonry && pageObject) {
        if (pageObject.scrollPos) {
            pageMasonry.scrollTop = pageObject.scrollPos;
        }

        pageMasonry.onscroll = () => {
            pageObject.scrollPos = pageMasonry.scrollTop;
        }
    }
}

function renderCards(options = null) {
    const columns = masonryContainer.children;
    var availableCards = localData?.localCardData ?? [];
    if (!availableCards)
        return;
    const totalCards = [];
    for (var i = 0; i < availableCards.length; i++) {
        const curIndex = i;
        const cardDataArray = availableCards[curIndex];

        //Card displating logics
        if (!cardDisplay.isCardDisplayInEnv(cardDataArray, options)) {
            continue;
        }

        //Card
        const cardHtml = cardDisplay.displayCard(cardDataArray);

        const cardDatArray = cardDataArray;
        var score = 1000; //TEMP
        const statusBlocks = cardDataManage.getBlocks(cardDatArray, 'status');
        if (statusBlocks && statusBlocks.length > 0) {
            const statusAdjustment = cardDataManage.getReturnValue("cardstatus|text", statusBlocks[0],"status", "value");
            if (statusAdjustment) {
                const statusTemplate = defaultCardStatus.find(ds => ds.status === statusAdjustment);
                if (statusTemplate) {
                    score *= (statusTemplate.scoreAdjust ? statusTemplate.scoreAdjust : 100) / 100;
                }
                if (statusAdjustment === 'In Progress') {
                    cardHtml.classList.add('elevated');
                }
            }
        }

        //Score Element on top of the "Task" card
        const cardTopToolbar = document.createElement('div');
        cardTopToolbar.classList.add('display-card-toolbar-top');
        if (cardHtml.hasChildNodes()) {
            cardHtml.insertBefore(cardTopToolbar, cardHtml.firstChild);
        }
        else {
            cardHtml.appendChild(cardTopToolbar);
        }

        totalCards.push({
            el: cardHtml,
            arrangement: score
        });
    }
    totalCards.sort((a, b) => a.arrangement - b.arrangement).forEach(card => {
        //console.log(card.arrangement);
        var columnToPlace = columns[0];
        var minHeight = columnToPlace.offsetHeight;
        for (var i = 1; i < columns.length; i++){
        var height = columns[i].offsetHeight;
        if (height < minHeight) {
            columnToPlace = columns[i];
            minHeight = height;
        }
        }
        if (!columnToPlace)
            return;
        columnToPlace.appendChild(card.el);
        //Card wonkiness
        card.el.style.transform = `rotate(${(Math.random() * 2 - 1) * 0.7}deg)`; //-0.25 to 0.25 degree
    });
}

function createCardDisplay() {
     //Card Header

    //Card Body
}

export function createColumn(width) {
    const masonryColumn = document.createElement('div');
    masonryColumn.classList.add('masonrylist-column');
    masonryColumn.style.width = `${width}px`;
    masonryColumn.style.flexBasis = `${width}px`;
    masonryContainer.appendChild(masonryColumn);
    return masonryColumn;
}

const widthThreshold = 10;
let lastWindowWidth = 0;
export function onMasonryResized() {
    const currentWidth = window.width;
    if (Math.abs(lastWindowWidth - currentWidth) < widthThreshold) {
        return;
    }
    lastWindowWidth = currentWidth;
    if (timeToRerenderFunction) {
        clearTimeout(timeToRerenderFunction);
    }
   timeToRerenderFunction = setTimeout(() => {
    pages.forceRenderOpeningPage();
   }, 350);
}

function getColumnCount() {
    const width = window.innerWidth;
    if (width >= 1024) { // lg breakpoint
        return 4;
    } else if (width >= 768) { // md breakpoint
        return 3;
    } else if (width >= 640) { // sm breakpoint
        return 2;
    } else { // default for smaller screens
        return 1;
    }
}