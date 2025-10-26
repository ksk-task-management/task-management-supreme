import { appendEvent } from "../events/events";
import { userData } from "../main";
import { forceRenderOpeningPage, toggleNotification } from "../views/pages";
import { postCloudData } from "./google-sheets";
import * as cardDataManage from "../configs/card-data-manage";
import { hyperflatArray } from "../utils/helpers";

export var localProjectData = null;
export var localCardData = null;

export function loadCloudDataToLocal() {
    if (!userData.sheetID || !userData.sheetUrl) {
        toggleNotification('error', "No user sheet data found, please create one.", 'data_alert');
        return;
    }
    loadCloudCardData();
}

export function loadCloudCardData() {
    if (!userData.sheetID || !userData.sheetUrl) {
        toggleNotification('error', "No user sheet data found, please create one.", 'data_alert');
        return;
    }

    appendEvent("Retieving user's cards", async () => {
        const result = await postCloudData(`loadCards`, {sheetID: userData.sheetID});
        localCardData = result.data.filter(card => card.uid !== '').map(card => JSON.parse(card.data));
        forceRenderOpeningPage();
    }, "playing_cards");
}

export function appendLocalCard(newCardDataArray) {
    if (localCardData) {
        const newUID = cardDataManage.getDataUID(newCardDataArray);
        if (localCardData.some(lc => cardDataManage.getDataUID(lc) === newUID))
            return;
        localCardData.push(newCardDataArray);
    }
}

export function deleteLocalCard(cardDataArray) {
    if (localCardData) {
        const targetUID = cardDataManage.getDataUID(cardDataArray);
        const targetIdx = localCardData.findIndex(lcd => cardDataManage.getDataUID(lcd) === targetUID);
        if (targetIdx >= 0) {
            localCardData.splice(targetIdx, 1);
        }
    }
}

export function saveCloudCard(cardDataArray) {
    let cardID = cardDataManage.getDataUID(cardDataArray);
    if (!cardID) {
        cardDataArray = cardDataManage.getCardContainingData(cardDataArray);
        cardID = cardDataManage.getDataUID(cardDataArray);
    }
    /*cardDataArray = localCardData.find(card => cardDataManage.getDataUID(card) === cardID);
    if (!cardDataArray)
        return;*/

    appendEvent(`Saving the card ${cardID}`, async () => {
        const result = await postCloudData('saveCard', {
            sheetID: userData.sheetID,
            cardID: cardID,
            cardData: JSON.stringify(cardDataArray)
        });
        console.log(result);
    });
}

export function deleteCloudCard(cardDataArray) {
    const cardID = cardDataManage.getDataUID(cardDataArray);
    appendEvent(`Deleting the card ${cardID}`, async () => {
        const result = await postCloudData('deleteCard', {
            sheetID: userData.sheetID,
            cardID: cardID,
        });
        console.log(result);
    });
}