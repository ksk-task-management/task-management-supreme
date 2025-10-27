import * as localData from "../../databases/local-data";
import * as cardDataManage from "../../configs/card-data-manage";
import * as cardDisplay from "../../views/renders/card-displayers";
import * as constants from "../../configs/constants";
import * as pages from "../pages";
import * as viewCardEditor from "../editors/view-card-editor";
import { defaultCardStatus, elementTemplates } from "../../configs/cards";
import { ColorHSL, getUpperColor, hyperflatArray } from "../../utils/helpers";
import { postCloudData } from "../../databases/google-sheets";
import { appendEvent } from "../../events/events";
import { userData } from "../../main";

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
    availableCards.forEach(orgCardDataArray => {
        const displayCardDataArray = [...orgCardDataArray];
        if (!cardDisplay.isCardDisplayInEnv(displayCardDataArray, options))
            return;

        const pendingParentBlocks = [];
        const findParentIdxFunc = (leadUID, level, cda) => {
            if (!cda || !Array.isArray(cda))
                return;
            for (let p = 0; p < cda.length; p++) {
                if (cda[p].key && cda[p].key === 'parent') {
                    const newParent = {};
                    if (leadUID !== undefined)
                        newParent.leadUID = leadUID;
                    newParent.bParent = cda[p];
                    newParent.level = level ?? 0;
                    pendingParentBlocks.push(newParent);
                }
            }
        }
        findParentIdxFunc(undefined, 0, displayCardDataArray);
        
        const allCardParents = [];
        while (pendingParentBlocks.length > 0) {
            const curParentBlock = pendingParentBlocks.shift();
            const parentUID = cardDataManage.getReturnValue('text', curParentBlock.bParent, 'parent', 'value') ?? undefined;
            const parentCard = localData.localCardData.find(lc => cardDataManage.getDataUID(lc) === parentUID);
            if (parentCard) {
                if (!allCardParents.some(ap => ap.uid === parentUID)) {
                    allCardParents.push({level: curParentBlock.level, parentCard: parentCard});
                }

                const parentSubcards = hyperflatArray(cardDataManage.getBlocks(parentCard, 'subcards')?.map(cs => cardDataManage.getReturnValue('set', cs, 'inheritance', 'value')) ?? [], {excludedNulls: true})?.map(val => {
                    if (val.value && cardDataManage.isBlock(val.value)) 
                        return val.value;
                    return undefined;
                })?.filter(s => cardDataManage.isMatter(s) && cardDataManage.isBlock(s));

                const appendTargetUID = curParentBlock.leadUID ? curParentBlock.leadUID : curParentBlock.bParent.uid ?? undefined;
                const appendTargetIdx = appendTargetUID ? displayCardDataArray.findIndex(cda => cda.uid === appendTargetUID) : undefined;
                if (appendTargetIdx !== undefined && appendTargetIdx >= 0) {
                    displayCardDataArray.splice(appendTargetIdx + 1, 0, ...parentSubcards);
                }

                findParentIdxFunc(appendTargetUID, curParentBlock.level + 1, parentCard);
            }
        }

        var score = undefined;
        //Status
        let ctStatus = undefined;
        const cStatusArray = hyperflatArray(cardDataManage.getBlocks(displayCardDataArray, "status")?.map(cs => cardDataManage.getReturnValue('text', cs, "*", "value") ?? null), {excludedNulls: true, renderValues: true})?.map(status => {
            return defaultCardStatus.find(st => st.status === status)
        })?.filter(status => cardDataManage.isMatter(status)).sort((a, b) => a.scoreAdjust - b.scoreAdjust);
        if (cStatusArray.length > 0) {
            ctStatus = cStatusArray[0];
        }

        //Score adjusted by Deadlines
        if (!ctStatus || (ctStatus.status !== 'Completed' && ctStatus !== 'Cancelled')) {
            const cbDeadlines = cardDataManage.getBlocks(displayCardDataArray, "end-date", {notFindUnderCompleteSections: true});
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
        totalCards.push({
            card: displayCardDataArray, 
            orgCard: orgCardDataArray, 
            parent: allCardParents,
            statusTemplate: ctStatus, 
            score: score
        });
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

        //Adjustment - Incomplete Area
        if (card.card) {
            const incompleteArea = cardDataManage.getBlocks(card.card, 'incomplete-area');
            if (incompleteArea && incompleteArea.length > 0) {
                card.score *= 1 - Math.min(100, incompleteArea.length * constants.scorePercentPerIncompleteArea) / 100;
            }
        }
    });

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

            card.html = cardDisplay.displayCard(card); 
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

            const upperColor = getUpperColor(card.html);
            if (upperColor) {
                const colScoreBG = new ColorHSL().fromHex(upperColor).modifyL(-10);
                cardScoreHtml.style.backgroundColor = colScoreBG.getHSLString();

                const colScoreBorder = colScoreBG.modifyL(-20).modifyS(-20);
                cardScoreHtml.style.borderColor = colScoreBorder.getHSLString();

                const colScoreTxtColor = colScoreBorder.modifyL(-10).modifyS(-10);
                cardScoreHtml.style.color = colScoreTxtColor.getHSLString();
            }

            //Card wonkiness
            card.html.style.transform = `rotate(${(Math.random() * 2 - 1) * 0.7}deg)`; //-0.25 to 0.25 degree
        });
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