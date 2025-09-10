import * as localData from "../../databases/local-data";
import * as cardDataManage from "../../items/card-data-manage";
import { defaultCardStatus, getModalCardCreation } from "../../items/cards";

export const masonryContainer = document.getElementById('masonrylist-container');
const gapSize = 5;
let timeToRerenderFunction = null;
export function render() {
    if (!masonryContainer)
        return;
    masonryContainer.innerHTML = '';
    const columnCount = getColumnCount();
    const columnWidth = (masonryContainer.getBoundingClientRect().width  - (columnCount + 1) * gapSize) / columnCount;
    for (var i = 0; i < columnCount; i++) {
        createColumn(columnWidth);
    }
    renderCards();
}

function renderCards() {
        console.log("============Begin New Rendering Round");

    const columns = masonryContainer.children;
    if (!localData.localCardData)
        return;
    const totalCards = [];
    for (var i = 0; i < localData.localCardData.length; i++) {
        const curIndex = i;
        const cardDataArray = localData.localCardData[curIndex];
        //Card
        const cardHtml = document.createElement('div');
        cardHtml.classList.add('masonrylist-card');

        //Header

        //Body
        const cardBodyArea = document.createElement('div');
        cardBodyArea.classList.add('card-body-area');
        cardHtml.appendChild(cardBodyArea);
        cardDataArray.forEach(blockDat => {
            console.log("--Begin Examind Block:", blockDat);
            const blockHtml = cardDataManage.getReturnValue("html", blockDat, null, "value");
            if (blockHtml && typeof blockHtml === 'object') {
                cardBodyArea.appendChild(blockHtml);
            }
        });
        const cardDatArray = cardDataArray;
        cardHtml.addEventListener('click', () => {
            //Test Editing
            console.log(cardDataArray);
            getModalCardCreation(cardDataArray);
        });

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
        totalCards.push({
            el: cardHtml,
            arrangement: score
        });
        //columns[0].appendChild(cardHtml);
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
        card.el.style.transform = `rotate(${(Math.random() * 2 - 1) * 1}deg)`; //-0.5 to 0.5 degree
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

export function onMasonryResized() {
    if (timeToRerenderFunction) {
        clearTimeout(timeToRerenderFunction);
    }
   timeToRerenderFunction = setTimeout(() => {
    render();
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