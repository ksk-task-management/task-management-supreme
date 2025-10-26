import * as cardDataManage from "../../configs/card-data-manage";
import { defaultCardStatus } from "../../configs/cards";
import * as pages from "../pages";
import * as localData from "../../databases/local-data";
import * as viewCardEditor from "../editors/view-card-editor"
import { ColorHSL, getUpperColor, hyperflatArray, setColorOpacity } from "../../utils/helpers";

export function displayCard(cardData) {
    const displayCardDataArray = cardData.card;
    const originalCardDataArray = cardData.orgCard;

    //Card
    const cardHtml = document.createElement('div');
    cardHtml.classList.add('masonrylist-card');

    //Coloring Cascade
    //Custom Stylings
    const customStylings = hyperflatArray(cardDataManage.getBlocks(displayCardDataArray, "card-styling", {notFindUnderKeys: ["subcards"]})?.map(sb => cardDataManage.getReturnValue("*", sb, "styles", "value")) ?? null, {renderValues: true, excludedNulls: true})
                            .filter(style => typeof style === 'string').map(style => {
                                const splits = style.split(":");
                                return {domain: splits[0].toLowerCase(), value: splits[1]}
                            });
    if (customStylings.length > 0) {
         //Style - Base Color
        const baseColorStyle = customStylings.findLast(cs => cs.domain === 'base-color');
        if (baseColorStyle) {
            const cardColor = new ColorHSL().fromHex(baseColorStyle.value).setL(94).setS(72);
            cardHtml.style.backgroundColor = cardColor.getHSLString();
            cardHtml.dataset.baseColor = cardColor.getHex();

            const borderColor = cardColor.modifyL(-25).modifyS(-25);
            cardHtml.style.borderColor = borderColor.getHSLString();
            const baseTextColor = cardColor.setL(22.5).modifyS(-20);
            cardHtml.style.color = baseTextColor.getHSLString();
        }
    }

    const cardtype = cardDataManage.getBlocks(displayCardDataArray, "type")?.map(c => cardDataManage.getReturnValue("*", c, "type", "value"));
    if (cardtype && Array.isArray(cardtype) && cardtype.some(t => t === 'Board')) {
        //Board type
        displayBoardCard(displayCardDataArray, originalCardDataArray, cardHtml);
    }
    else {
        //General type
        displayGeneralCard(displayCardDataArray, originalCardDataArray, cardHtml);
    }

    const cardTopToolbarHtml = document.createElement('div');
    cardTopToolbarHtml.classList.add('display-card-toolbar-top');
    if (cardHtml.hasChildNodes())
        cardHtml.insertBefore(cardTopToolbarHtml, cardHtml.firstChild);
    else 
        cardHtml.appendChild(cardTopToolbarHtml);

    //Top Toolbar - Creator
    const topToolbarCreatorZoneHtml = document.createElement('div');
    topToolbarCreatorZoneHtml.classList.add('display-card-toolbar-creator-area');
    cardTopToolbarHtml.appendChild(topToolbarCreatorZoneHtml);

    //Top Toolbar - Creator - Profile Icon
    if (!cardtype || !cardtype.some(type => type === 'Board')) {
        const cardIconAreaHtml = document.createElement('div');
        cardIconAreaHtml.classList.add('display-card-toolbar-creator-profileicn');
        topToolbarCreatorZoneHtml.appendChild(cardIconAreaHtml);
        const cardIcon = customStylings.findLast(cs => cs.domain === 'icon')?.value ?? undefined;
        const cardIconHtml = document.createElement('div');
        cardIconHtml.classList.add('icon', 'material-symbols-outlined');
        cardIconHtml.textContent = cardIcon ?? 'token';
        cardIconAreaHtml.appendChild(cardIconHtml);
    }
    

    if (cardData.parent) {
        let pracParent = [];
        cardData.parent.forEach(p => {
            const matchIdx = pracParent.findIndex(pp => pp.level === p.level);
            if (matchIdx >= 0) {
                pracParent[matchIdx].parent.push(p.parentCard);
            }
            else {
                pracParent.push({level: p.level, parent: [p.parentCard]});
            }
        });
        pracParent = pracParent.sort((a, b) => b.level - a.level);
        const closestParent = pracParent.pop();
        const parentDisplayArray = [];
        if (pracParent.length > 0) {
            parentDisplayArray.push({
                text: "..."
            });
        }
        if (closestParent) {
            const closestParentItem = {
                text: closestParent.parent?.map(ppc => cardDataManage.getDataTitle(ppc))?.join(" | ") ?? "Unknown Parent"
            }
            const puid = cardDataManage.getDataUID(closestParent.parent[0]) ?? undefined;
            if (puid)
                closestParentItem.onClick = ev => {
                    ev.stopPropagation();
                    ev.preventDefault();
                    pages.displayPage("masonry-list", {
                        env: puid
                    });
                }
            parentDisplayArray.push(closestParentItem);
        }
            
        parentDisplayArray.forEach((parent, idx) => {
            const parentHtml = document.createElement('span');
            parentHtml.classList.add('display-card-toolbar-creator-parent');
            parentHtml.textContent = parent.text;
            topToolbarCreatorZoneHtml.appendChild(parentHtml);
            if (parent.onClick) {
                parentHtml.addEventListener('click', ev => {
                    parent.onClick(ev);
                });
                parentHtml.classList.add('clickable');
            }

            if (idx < parentDisplayArray.length - 1) {
                const chevronHtml = document.createElement('div');
                chevronHtml.classList.add('icon', 'material-symbols-outlined', 'display-card-toolbar-creator-parent-chevron');
                chevronHtml.textContent = 'chevron_forward';
                topToolbarCreatorZoneHtml.appendChild(chevronHtml);
            }
        });
    }

    if (cardHtml) {
        const cardColor = getUpperColor(cardHtml);
        const colBase = new ColorHSL().fromHex(cardColor);
        const colProfileBG = colBase.modifyL(-10).modifyS(-20);
        const colProfileIcon = colProfileBG.modifyL(-40).modifyS(-20);
        //cardIconAreaHtml.style.backgroundColor = colProfileBG.getHex();
        //cardIconAreaHtml.style.color = colProfileIcon.getHex();
        topToolbarCreatorZoneHtml.querySelectorAll(".display-card-toolbar-creator-profileicn")?.forEach(el => {
            el.style.backgroundColor = colProfileBG.getHex();
        });
        topToolbarCreatorZoneHtml.querySelectorAll(".display-card-toolbar-creator-profileicn .icon")?.forEach(el => {
            el.style.color = colProfileIcon.getHex();
        });
        topToolbarCreatorZoneHtml.querySelectorAll(".display-card-toolbar-creator-parent")?.forEach(el => {
            el.style.color = colBase.modifyL(-52).modifyS(-25).getHex();
        });
        topToolbarCreatorZoneHtml.querySelectorAll(".display-card-toolbar-creator-parent-chevron")?.forEach(el => {
            el.style.color = colBase.modifyL(-20).modifyS(-12).getHex();
        });
    }



    /*const currentPage = pages.getLastPage();
    const cardParent = hyperflatArray(cardDataManage.getBlocks(displayCardDataArray, 'parent')?.map(pb => cardDataManage.getReturnValue("*", pb, "*", "value")) ?? null, {renderValues: true, excludedNulls: true});
    const parentIDs = cardParent.filter(cpid => {
        if (!currentPage.options?.env)
            return true;
        return cpid !== currentPage.options.env;
    });
    if (parentIDs.length > 0) {
        parentIDs.forEach(puid => {
            const parentCard = localData.localCardData.find(c => {
                const cuid = cardDataManage.getDataUID(c);
                if (!cuid) return false;
                return puid === cuid;
            });
            if (parentCard) {
                const parentTitle = hyperflatArray(cardDataManage.getBlocks(parentCard, 'title')?.map(tb => cardDataManage.getReturnValue('text', tb, '*', 'value')) ?? null, {renderValues: true, excludedNulls: true});
                if (parentTitle.length > 0) {
                    parentTitle.forEach((title, idx) => {
                        const cardParentHtml = document.createElement("div");
                        cardParentHtml.classList.add('masonry-card-parent');
                        cardParentHtml.textContent = title;
                        cardTopToolbarHtml.appendChild(cardParentHtml);
                        cardParentHtml.addEventListener('click', ev => {
                            ev.stopPropagation();
                            ev.preventDefault();
                            pages.displayPage("masonry-list", {
                                env: puid
                            });
                        });

                        if (cardHtml) {
                            const cardColor = getUpperColor(cardHtml);
                            const colParent = new ColorHSL().fromHex(cardColor).modifyL(-20).modifyS(-20);
                            //colParent.a = 0.8;
                            cardParentHtml.style.color = colParent.getHSLString();
                        }
                    });
                }
            }
        });
    }*/

    if (cardHtml) {
        //Style - Blurred
        const blurStyle = customStylings.find(s => s.domain === 'field-blurred');
        if (blurStyle) {
            const newBlurredFilter = document.createElement('div');
            newBlurredFilter.classList.add('masonry-card-blurred');
            if (blurStyle.value.toLowerCase().trim() === "revealable") {
                newBlurredFilter.classList.add('revealable');
                newBlurredFilter.addEventListener('click', ev => {
                    if (!newBlurredFilter.classList.contains("reveal")) {
                        newBlurredFilter.classList.add('reveal');
                        ev.stopPropagation();
                    }
                });
                cardHtml.addEventListener('mouseleave', ev => {
                    if (newBlurredFilter.classList.contains("reveal")) {
                        newBlurredFilter.classList.remove("reveal");
                        ev.stopPropagation();
                    }
                });
            }
            cardHtml.appendChild(newBlurredFilter);
        }
    }

    return cardHtml;
}

export function displayGeneralCard(displayCardDataArray, originalCardDataArray, cardHtml) {
    //Header
    
    //Body
    const cardBodyArea = document.createElement('div');
    cardBodyArea.classList.add('card-body-area');
    cardHtml.appendChild(cardBodyArea);
    displayCardDataArray.forEach(blockDat => {
        //console.log("--Begin Examind Block:", blockDat);
        const blockHtml = cardDataManage.getReturnValue("html", blockDat, null, "value", {
            parentData: displayCardDataArray,
            cardHtml: cardHtml
        });
        if (blockHtml && typeof blockHtml === 'object') {
            cardBodyArea.appendChild(blockHtml);
        }
    });

    //Bottom Toolbar


    //Default behaviour -> Click to open the card editor
    cardHtml.addEventListener('click', () => {
        viewCardEditor.getModalCardEditor(originalCardDataArray);
    });
}

export function displayBoardCard(displayCardDataArray, originalCardDataArray, boardCardHtml) {
    const color = getUpperColor(boardCardHtml);
    const colBoardBase = new ColorHSL().fromHex(color).modifyL(-10).modifyS(-15);
    const colBoardBorder = colBoardBase.modifyL(-25).modifyS(-25);
    boardCardHtml.style.backgroundColor = colBoardBase.getHex();
    boardCardHtml.style.borderColor = colBoardBorder.getHex();
    boardCardHtml.dataset.baseColor = colBoardBase.getHex();

    const boardUID = cardDataManage.getBlocks(displayCardDataArray, "uid")?.map(id => cardDataManage.getReturnValue("*", id, "uid", "value"))[0] ?? null;
    const boardTitle = cardDataManage.getBlocks(displayCardDataArray, "title")?.map(id => cardDataManage.getReturnValue("text", id, "title", "value"))[0] ?? "Unnamed Board";
    const boardSubcards = cardDataManage.getBlocks(displayCardDataArray, "subcards");
    var boardSubcardVisible = boardSubcards?.map(id => cardDataManage.getReturnValue("text|boolean", id, "visible_outside", "value"))[0] ?? true;
    if (boardSubcardVisible === "false") {
        boardSubcardVisible = false;
    }

    //Children
    const boardChildren = localData.localCardData.filter(lc => {
        return isCardDisplayInEnv(lc, {env: boardUID, bypass: ["parent-hiding"]})
    });
    //Custom Stylings
    const customStylings = hyperflatArray(cardDataManage.getBlocks(displayCardDataArray, "card-styling")?.map(sb => cardDataManage.getReturnValue("*", sb, "styles", "value")) ?? null, {renderValues: true, excludedNulls: true})
                            .filter(style => typeof style === 'string').map(style => {
                                const splits = style.split(":");
                                return {domain: splits[0].toLowerCase(), value: splits[1]}
                            });
    //Icons
    const customIcon = customStylings.findLast(sc => sc.domain === 'icon');
    const icon = customIcon?.value ?? "content_paste";

    boardCardHtml.classList.add('masonrylist-board-card');

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

    //Subcard status one-dimensional displayer
    if (boardChildren.length > 0) {
       
        const progressPercents = boardChildren.map(child => {
            const childStatus = cardDataManage.getBlocks(child, "status")?.map(s => cardDataManage.getReturnValue("text", s, "status", "value"))[0] ?? null;
            return defaultCardStatus.find(ds => ds.status === childStatus)?.progressPercent ?? null;
        }).filter(f => f);
        if (progressPercents.length >= 0) {
            const boardProgressAreaHtml = document.createElement('div');
            boardProgressAreaHtml.classList.add('board-card-progress-line-area');
            progressPercents.forEach((percent, idx) => {
                const eachPercentHtml = document.createElement('span');
                eachPercentHtml.classList.add('board-card-progress-line-child');
                if (idx === 0) {
                    eachPercentHtml.classList.add('start');
                }
                else if (idx === progressPercents.length - 1) {
                    eachPercentHtml.classList.add('end');
                }
                eachPercentHtml.style.setProperty("--data-percent", percent);
                boardProgressAreaHtml.appendChild(eachPercentHtml);
            });
            lowerBoardAreaHtml.appendChild(boardProgressAreaHtml);
        }
    }


    boardCardHtml.appendChild(lowerBoardAreaHtml);

    //Board behaviour -> Click to open the masonry list of the inner board section
    boardCardHtml.addEventListener('click', () => {
        pages.displayPage("masonry-list", {
            env: boardUID
        });
    });
}

export function isCardDisplayInEnv(cardDataArray, options = null) {
    var env = options?.env;
    var lapse = 0;
    var curCards = [{uid: cardDataManage.getDataUID(cardDataArray)?.trim(), card:cardDataArray, level: 0}];
    var canDisplay = true;
    var foundEnvParent = !env;
    var envLevel = null;
    while (curCards.length > 0 && canDisplay) {
        const currentCard = curCards[0].card;
        if (lapse > 0) {
            //Finding env card's level
            if (env && !envLevel) {
                envLevel = curCards.find(cc => cc.uid === env)?.level;
            }

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
                    if (!env || !envLevel || curCards[0].level < envLevel) {
                        canDisplay = false;
                        break;
                    }
                }
            }
        }

        var parentUIDs = hyperflatArray([cardDataManage.getBlocks(currentCard, "parent")?.map(p => {
            var result = cardDataManage.getReturnValue("set|text", p, "parent", "value");
            return result;
        })], {excludedNulls: true, renderValues: true});

        const newParent = [];
        if (parentUIDs.length > 0) {
            parentUIDs.forEach(pUID => {
                for (var lc of localData.localCardData) {
                    const uid = cardDataManage.getDataUID(lc)?.trim() ?? null;
                    if (uid && uid === pUID.trim()) {
                        newParent.push({uid: uid, card:lc, level: curCards[0].level + 1});
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