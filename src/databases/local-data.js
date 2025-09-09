import { appendEvent } from "../events/events";
import { userData } from "../main";
import { renderAnyOpeningPages, toggleNotification } from "../views/pages";
import { postCloudData } from "./google-sheets";
import * as cardDataManage from "../items/card-data-manage";

export var localProjectData = null;
export var localCardData = null;

export function loadCloudDataToLocal() {
    if (!userData.sheetID || !userData.sheetUrl) {
        toggleNotification('error', "No user sheet data found, please create one.", 'data_alert');
        return;
    }
    loadCloudProjectData();
    loadCloudCardData();
}

export function loadCloudProjectData() {
    if (!userData.sheetID || !userData.sheetUrl) {
        toggleNotification('error', "No user sheet data found, please create one.", 'data_alert');
        return;
    }
}

export function loadCloudCardData() {
    if (!userData.sheetID || !userData.sheetUrl) {
        toggleNotification('error', "No user sheet data found, please create one.", 'data_alert');
        return;
    }

    appendEvent("Retieving user's cards", async () => {
        const result = await postCloudData(`loadCards`, {sheetID: userData.sheetID});
        localCardData = result.data.filter(card => card.uid !== '').map(card => JSON.parse(card.data));
        renderAnyOpeningPages();
    }, "mitre");
}

export function appendLocalCard(newCardDataArray) {
    if (localCardData) {
        const newUID = cardDataManage.getDataUID(newCardDataArray);
        if (localCardData.some(lc => cardDataManage.getDataUID(lc) === newUID))
            return;
        localCardData.push(newCardDataArray);
    }
}

export function uploadCard(cardDataArray) {
    const cardID = cardDataManage.getDataUID(cardDataArray);
    appendEvent(`Saving the card ${cardID}`, async () => {
        const result = await postCloudData('saveCard', {
            sheetID: userData.sheetID,
            cardID: cardID,
            cardData: JSON.stringify(cardDataArray)
        });
        console.log(result);
    });
}