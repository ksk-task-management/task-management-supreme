import * as localData from "../../databases/local-data";
import * as cardDataManage from "../../configs/card-data-manage";
import * as cardDisplay from "../../views/renders/card-displayers";
import * as constants from "../../configs/constants";
import * as pages from "../pages";
import * as viewCardEditor from "../editors/view-card-editor";
import { defaultCardStatus, elementTemplates } from "../../configs/cards";
import { hyperflatArray } from "../../utils/helpers";

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

    //Stratify the cards
    //[{status, cards: [html, cardDataArray, score]}]
    const today = new Date();
    const baseTimeUnit = constants.timeConvertionUnits.find(tc => tc.name === "Day")?.value ?? 1000 * 60 * 60 * 24;
    const totalCards = [];
    let cMin = undefined, cMax = undefined;
    //const totalStratifiedCard = [];
    availableCards.forEach(cardDataArray => {
        if (!cardDisplay.isCardDisplayInEnv(cardDataArray, options))
            return;

        //

        var score = undefined;
        //Status
        let ctStatus = undefined;
        const cStatusArray = hyperflatArray(cardDataManage.getBlocks(cardDataArray, "status")?.map(cs => cardDataManage.getReturnValue('text', cs, "*", "value") ?? null), {excludedNulls: true, renderValues: true})?.map(status => {
            return defaultCardStatus.find(st => st.status === status)
        })?.filter(status => cardDataManage.isMatter(status)).sort((a, b) => a.scoreAdjust - b.scoreAdjust);
        if (cStatusArray.length > 0) {
            ctStatus = cStatusArray[0];
        }

        //Score adjusted by Deadlines
        if (!ctStatus || (ctStatus.status !== 'Completed' && ctStatus !== 'Cancelled')) {
            const cbDeadlines = cardDataManage.getBlocks(cardDataArray, "end-date");
            const cDS = hyperflatArray(cbDeadlines?.map(cd => cardDataManage.getReturnValue('datetime', cd, "date_start", "value") ?? null), {excludedNulls: true, renderValues: true})?.map(status => new Date(status))?.sort((a, b) => a - b)[0];
            const cDE = hyperflatArray(cbDeadlines?.map(cd => cardDataManage.getReturnValue('datetime', cd, "date_end", "value") ?? null), {excludedNulls: true, renderValues: true})?.map(status => new Date(status))?.sort((a, b) => a - b)[0];
            if (cDE) {
                const dTE = (cDE - today) / baseTimeUnit;
                if (!score) score = 0;
                score += dTE * (dTE >= 0 ? constants.scorePerDaysToEnd : constants.scorePerDaysPassedEnd);
            }
            if (cDS) {
                const dST = (today - cDS) / baseTimeUnit;
                if (dST > 0) {
                    if (!score) score = 0;
                    score -= dST * constants.scorePerDaysPassedStart;
                }
            }

            if (!cMin || (score && score < cMin)) {
                cMin = score;
            }
            if (!cMax || (score && score > cMax)) {
                cMax = score;
            }
        }
        totalCards.push({card: cardDataArray, statusTemplate: ctStatus, score: score});

        //Status finding
        /*let cStatus = undefined;
        const cStatusArray = hyperflatArray(cardDataManage.getBlocks(cardDataArray, "status")?.map(cs => cardDataManage.getReturnValue('text', cs, "*", "value") ?? null), {excludedNulls: true, renderValues: true})?.map(status => {
            return defaultCardStatus.find(st => st.status === status)
        })?.filter(status => cardDataManage.isMatter(status)).sort((a, b) => a.scoreAdjust - b.scoreAdjust);
        if (cStatusArray.length > 0) {
            cStatus = cStatusArray[0];
            if (cStatus.status === 'In Progress') {
                cardHtml.classList.add('elevated');
            }

        }

        //Append to the array
        let stratum = undefined;
        const existIdx = totalStratifiedCard.findIndex(tsc => tsc.status === cStatus?.status);
        if (existIdx < 0) {
            stratum = {status: cStatus?.status, baseScore: cStatus?.scoreAdjust ?? 110, cards: []};
            totalStratifiedCard.push(stratum);
        }
        else stratum = totalStratifiedCard[existIdx];
        stratum.cards.push({
            cardDataArray: cardDataArray,
            html: cardHtml,
            //baseScore: score,
            score: score
        });*/
    });
    let adjMin = Math.min(cMin ?? 0, 0);
    if (adjMin < 0)
        adjMin *= -1;
    totalCards.forEach(card => {
        if (!card.score)
            card.score = (cMax ?? 1000) * 1.1;
        card.score += adjMin;

        //Adjustment - Status
        if (card.statusTemplate) {
            card.score *= card.statusTemplate.scoreAdjust / 100;
        }
        /*const cStatusArray = hyperflatArray(cardDataManage.getBlocks(card.card, "status")?.map(cs => cardDataManage.getReturnValue('text', cs, "*", "value") ?? null), {excludedNulls: true, renderValues: true})?.map(status => {
            return defaultCardStatus.find(st => st.status === status)
        })?.filter(status => cardDataManage.isMatter(status)).sort((a, b) => a.scoreAdjust - b.scoreAdjust);
        if (cStatusArray.length > 0) {
            let cStatus = cStatusArray[0];
            if (cStatus.status === 'In Progress') {
                card.html.classList.add('elevated');
            }
            card.score *= cStatus.scoreAdjust / 100;
        }*/
    });
    console.log(totalCards);

    totalCards.sort((a, b) => a.score - b.score).forEach(card => {
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

            card.html = cardDisplay.displayCard(card.card); 
            if (card.statusTemplate && card.statusTemplate.status === 'In Progress') {
                card.html.classList.add('elevated');
            }

            columnToPlace.appendChild(card.html);
            //Card score            
            //Top toolbar - Score
            const cardScoreHtml = document.createElement('div');
            cardScoreHtml.classList.add('masonry-card-score-display');
            cardScoreHtml.textContent = card.score ? Math.round(card.score) : '--';
            card.html.querySelector('.display-card-toolbar-top').appendChild(cardScoreHtml);
            //Card wonkiness
            card.html.style.transform = `rotate(${(Math.random() * 2 - 1) * 0.7}deg)`; //-0.25 to 0.25 degree
        });




    //Score adjustment by minimum/status
    /*totalStratifiedCard.sort((a, b) => a.baseScore - b.baseScore).forEach(stratum => {
        /*let stratumMaximum = undefined;
        stratum.cards.forEach(stc => {
            if (!stratumMaximum || (stc.score && stc.score > stratumMaximum)) {
                stratumMaximum = stc.score;
            }
        });
        stratum.cards.forEach(stc => {
            if (stc.score) 
                return;
            stc.score = (stratumMaximum ?? 0) * 1.1;
            console.log('[O3]', stratumMaximum, stc.score);
        });*/

        /*let stratumMinimum = undefined;
        stratum.cards.forEach(stc => {
            if (!stratumMinimum || (stc.score && stc.score < stratumMinimum)) {
                stratumMinimum = stc.score;
            }
        });
        let adjMinimum = Math.min(stratumMinimum ?? 0, 0);
        if (adjMinimum < 0) adjMinimum *= -1;
        console.log(stratum, stratum.status, stratumMinimum, adjMinimum);

        const stratumStatusTemp = defaultCardStatus.find(dst => dst.status === stratum.status) ?? undefined;
        stratum.cards.forEach(stc => {
            if (stc.score) {
                stc.score += adjMinimum;
                if (stratumStatusTemp)
                    stc.score *= stratumStatusTemp.scoreAdjust / 100;
            }
            console.log('[O1]', stc.score);
        });

        

        //Card placement
        stratum.cards.sort((a, b) => {
            const aScore = a.score ?? 999999;
            const bScore = b.score ?? 999999;
            return aScore - bScore;
        })
    });*/

    



    /*const totalCards = [];
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
    });*/
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