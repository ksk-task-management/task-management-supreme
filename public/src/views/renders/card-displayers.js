import * as cardDataManage from "../../items/card-data-manage";
import { getModalCardCreation } from "../../items/cards";
import * as pages from "../pages";
import * as localData from "../../databases/local-data";
import { hyperflatArray } from "../../utils/helpers";

export function displayCard(cardDataArray) {
    const cardtype = cardDataManage.getBlocks(cardDataArray, "type")?.map(c => cardDataManage.getReturnValue("*", c, "type", "value"));
    if (cardtype && Array.isArray(cardtype) && cardtype.some(t => t === 'Board')) {
        return displayBoardCard(cardDataArray);
    }

    //Card
    const cardHtml = document.createElement('div');
    cardHtml.classList.add('masonrylist-card');
    
    //Header
    
    //Body
    const cardBodyArea = document.createElement('div');
    cardBodyArea.classList.add('card-body-area');
    cardHtml.appendChild(cardBodyArea);
    cardDataArray.forEach(blockDat => {
        //console.log("--Begin Examind Block:", blockDat);
        const blockHtml = cardDataManage.getReturnValue("html", blockDat, null, "value");
        if (blockHtml && typeof blockHtml === 'object') {
            cardBodyArea.appendChild(blockHtml);
        }
    });

    //Default behaviour -> Click to open the card editor
    cardHtml.addEventListener('click', () => {
        getModalCardCreation(cardDataArray);
    });
    return cardHtml;
}

export function displayBoardCard(cardDataArray) {
    const boardUID = cardDataManage.getBlocks(cardDataArray, "uid")?.map(id => cardDataManage.getReturnValue("*", id, "uid", "value"))[0] ?? null;
    const boardTitle = cardDataManage.getBlocks(cardDataArray, "title")?.map(id => cardDataManage.getReturnValue("text", id, "title", "value"))[0] ?? "Unnamed Board";
    const boardSubcards = cardDataManage.getBlocks(cardDataArray, "subcards");
    const boardSubcardVisible = boardSubcards?.map(id => cardDataManage.getReturnValue("text|boolean", id, "visible_outside", "value"))[0] ?? false;
    if (boardSubcardVisible === "true") {
        boardSubcardVisible = true;
    }

    //Children
    const boardChildren = localData.localCardData.filter(lc => {
        return isCardDisplayInEnv(lc, {env: boardUID, bypass: ["parent-hiding"]})
    });
    //Custom Stylings
    const customStylings = hyperflatArray(cardDataManage.getBlocks(cardDataArray, "card-styling")?.map(sb => cardDataManage.getReturnValue("*", sb, "styles", "value")) ?? null, {renderValues: true, excludedNulls: true})
                            .filter(style => typeof style === 'string').map(style => {
                                const splits = style.split(":");
                                return {domain: splits[0].toLowerCase(), value: splits[1]}
                            });
    //Icons
    const customIcon = customStylings.find(sc => sc.domain === 'icon');
    const icon = customIcon?.value ?? "content_paste";

    const boardCardHtml = document.createElement('div');
    boardCardHtml.classList.add('masonrylist-card', 'masonrylist-board-card');

    //Upper board area
    const upperBoardAreaHtml = document.createElement('div');
    upperBoardAreaHtml.classList.add('board-card-area-upper');
    const boardTitleIcon = document.createElement('div');
    boardTitleIcon.classList.add('icon', 'material-symbols-outlined', 'board-card-title-icon');
    boardTitleIcon.textContent = icon;
    upperBoardAreaHtml.appendChild(boardTitleIcon);

    const boardTitleHtml = document.createElement('div');
    boardTitleHtml.classList.add('board-card-title');
    boardTitleHtml.textContent = boardTitle;
    //const funText = '♔♕♖♗♘♙♤♡♧♢🜲⚀⚁⚂⚃⚄⚅';
    //boardTitleHtml.dataset.funText = funText[Math.floor(Math.random() * funText.length) + 1] ?? "*";
    upperBoardAreaHtml.appendChild(boardTitleHtml);
    boardCardHtml.appendChild(upperBoardAreaHtml);

    //Lower board area
    const lowerBoardAreaHtml = document.createElement('div');
    lowerBoardAreaHtml.classList.add('board-card-area-lower');

    const boardLowerDetailsArea = document.createElement('div');
    boardLowerDetailsArea.classList.add('board-card-area-lower-details');
    lowerBoardAreaHtml.appendChild(boardLowerDetailsArea);
    if (!boardSubcardVisible) {
        const boardVisibleHtml = document.createElement('span');
        boardVisibleHtml.classList.add('board-card-children-count');
        boardVisibleHtml.textContent = "꩜𖦹₊⊹";
        boardLowerDetailsArea.appendChild(boardVisibleHtml);
    }
    const boardChildrenCountHtml = document.createElement('span');
    boardChildrenCountHtml.classList.add('board-card-children-count');
    boardChildrenCountHtml.textContent = (boardChildren?.length ?? 0) + " Cards";
    boardLowerDetailsArea.appendChild(boardChildrenCountHtml);
    boardCardHtml.appendChild(lowerBoardAreaHtml);

    //Board behaviour -> Click to open the masonry list of the inner board section
    boardCardHtml.addEventListener('click', () => {
        pages.displayPage("masonry-list", {
            env: boardUID
        });
    });

    return boardCardHtml;
}

export function isCardDisplayInEnv(cardDataArray, options = null) {
    var env = options?.env;
    var lapse = 0;
    var curCards = [{uid: cardDataManage.getDataUID(cardDataArray), card:cardDataArray}];
    var canDisplay = true;
    var foundEnvParent = !env;
    while (curCards.length > 0 && canDisplay) {
        const currentCard = curCards[0].card;
        if (lapse > 0) {
            //Env
            if (env && env === curCards[0].uid && !foundEnvParent) {
                canDisplay = true;
                foundEnvParent = true;
                break;
            }

            //Subcards
            if (!options?.bypass?.includes("parent-hiding")) {
                const subcardBlocks = cardDataManage.getBlocks(currentCard, "subcards")?.map(sc => cardDataManage.getReturnValue("text", sc, "visible_outside", "value"))?.filter(v => cardDataManage.isMatter(v));
                if (subcardBlocks && subcardBlocks.some(f => f === 'false' || f === false)) {
                    canDisplay = false;
                    break;
                }
            }
        }

        var parentUIDs = [cardDataManage.getBlocks(currentCard, "parent")?.map(p => {
            var result = cardDataManage.getReturnValue("set|text", p, "parent", "value");
            return result;
        })];
        var arrayIndex = parentUIDs.findIndex(p => Array.isArray(p));
        while (arrayIndex > -1) {
            const newChildren = parentUIDs[arrayIndex].map(c => {
                if (!cardDataManage.isMatter(c))
                    return null;
                if (c.key) {
                    return cardDataManage.getReturnValue("set|text", c, "*", "value");
                }
                else {
                    return c;
                }
            });
            parentUIDs.splice(arrayIndex, 1, ...newChildren);
            arrayIndex = parentUIDs.findIndex(p => Array.isArray(p));
        }
        parentUIDs = parentUIDs.filter(p => cardDataManage.isMatter(p));

        const newParent = [];
        if (parentUIDs.length > 0) {
            parentUIDs.forEach(pUID => {
                for (var lc of localData.localCardData) {
                    const uid = cardDataManage.getDataUID(lc) ?? null;
                    if (uid && uid === pUID) {
                        newParent.push({uid: uid, card:lc});
                        break;
                    }
                }
            });
        }
        curCards.splice(0, 1, ...newParent);
        lapse++;
    }
    if (env && !foundEnvParent) {
        canDisplay = false;
    }

    return canDisplay;
}