import { modalContainer } from "../config/DOMElements";
import { postCloudData } from "../databases/google-sheets";
import { loadCloudCardData } from "../databases/local-data";
import { appendEvent } from "../events/events";
import { userData } from "../main";
import { generateShortId } from "../utils/helpers";
import { toggleNotification } from "./pages";
import { createIconizedButton, createIconizedTextHeader, createTextDescription, createTextHeader } from "./view-elements";

let currentModal = [];

export function createModalWindow(title) {
    const modalID = generateShortId();
    const newModalWindow = document.createElement('div');
    newModalWindow.classList.add('window-modal', 'panel', 'area-padding20', 'area-fit-lim-handheld-90');
    newModalWindow.style.minWidth = '30%';
    newModalWindow.style.paddingTop = '30px';

    //Title
    newModalWindow.appendChild(createTextHeader(title));

    //Close Button
    const closeButton = document.createElement('button');
    closeButton.classList.add('btn-modal-close', 'btn-normal', 'area-horizontal', 'area-center', 'placement-stick-top-right-5');
    closeButton.addEventListener('click', () => closeModalByID(modalID));
    const closeIcon = document.createElement('i');
    closeIcon.classList.add('material-symbols-outlined', 'icon');
    closeIcon.textContent = 'close';
    closeButton.appendChild(closeIcon);
    newModalWindow.appendChild(closeButton);
    const modalSaveEntry = {
        id: modalID,
        name: title,
        modal: newModalWindow
    }
    currentModal.push(modalSaveEntry);
    modalContainer.appendChild(newModalWindow);
    updateModalRenderings();
    return newModalWindow;
}

function getModalByName(modalName) {
    return currentModal.find(modal => modal.name === modalName);
}

function closeModalByID(modalID) {
    const existModalIndex = currentModal.findLastIndex(modal => modal.id === modalID);
    if (existModalIndex < 0)
        return;

    currentModal.splice(existModalIndex, 1).forEach(modal => {
        modal.modal.remove();
    });
    updateModalRenderings();
}

function closeModalByName(modalName) {
    const existModalIndex = currentModal.findLastIndex(modal => modal.name === modalName);
    if (existModalIndex < 0)
        return;

    currentModal.splice(existModalIndex, 1).forEach(modal => {
        modal.modal.remove();
    });
    updateModalRenderings();
}

function updateModalRenderings(){
    if (currentModal.length > 0){
        for (let i = 0; i < currentModal.length; i++) {
            if (!currentModal[i].modal)
                continue;

            if (i === currentModal.length - 1){
                currentModal[i].modal.classList.remove('hidden');
                continue;
            }
            currentModal[i].modal.classList.add('hidden');
        }

        modalContainer.classList.remove('hidden');
    }
    else {
        modalContainer.classList.add('hidden');
    }
}

export function getModalSheetSetting(){
    const sheetSettingModalName = "Sheet Setting";
    const modal = createModalWindow(sheetSettingModalName);
    modal.style.maxWidth = '80%';

    //Retrieve the project/card data after setting finished
    const manualCloseButton = modal.querySelector('.btn-modal-close');
    console.log(manualCloseButton);
    if (manualCloseButton) {
        console.log("T2");
        manualCloseButton.addEventListener('click', () => {
            console.log("Close Clicked");
            loadCloudCardData();
        });
    }

    //Sheet Zone
    const sheetHeader = createIconizedTextHeader('data_table', "Connected Google Sheet File");
    modal.appendChild(sheetHeader);
    const sheetDescription = createTextDescription('This Google Sheet file is for storing your data and is secured within your account. The data is not shared.');
    modal.appendChild(sheetDescription);
    
    const sheetUrlArea = document.createElement('div');
    sheetUrlArea.classList.add('area-horizonatal', 'btn-normal', 'area-center');
    sheetUrlArea.style.borderStyle = 'dashed';
    sheetUrlArea.style.backgroundColor = '#f2f2f2ff';
    const textSheetUrl = document.createElement('div');
    if (userData.sheetUrl) {
        textSheetUrl.textContent = userData.sheetUrl;
        textSheetUrl.style.textAlign = 'left';
        textSheetUrl.style.overflowX = 'hidden';
        textSheetUrl.style.whiteSpace = 'nowrap';
        textSheetUrl.style.textOverflow = 'ellipsis';
    }
    else {
        textSheetUrl.textContent = '<Not linked>';
        textSheetUrl.style.color = 'red';
        textSheetUrl.style.textAlign = 'center';
    }

    sheetUrlArea.appendChild(textSheetUrl);
    modal.appendChild(sheetUrlArea);

    //Button - create new one
    //Button - use existing one
    if (!userData.sheetUrl || userData.sheetUrl.length === 0) {
        const btnCreateNewSheet = createIconizedButton('wand_stars', 'Generate New Sheet', async () => {
            const textInputModalName = 'New Sheet Name';
            getModalTextInput(textInputModalName, "Give the sheet a name.", [
                () => {
                    var btnGenerate = document.createElement('button');
                    btnGenerate.classList.add('btn-normal');
                    btnGenerate.textContent = 'Generate sheet name';
                    btnGenerate.onclick = async () => {
                        btnGenerate.textContent = 'Generating...';
                        getModalByName(textInputModalName)?.modal?.querySelectorAll('button, input').forEach(element => {
                            element.disabled = true;
                        });
                        const newSheetData = await appendEvent('Creating new user sheet', async () => {
                            const data = await postCloudData('setUserSheet', {uid: userData.uid});
                            return data;
                        }, "wand_stars");
                        userData.sheetID = newSheetData.data.sheetID;
                        userData.sheetUrl = newSheetData.data.sheetUrl;
                        toggleNotification('success', 'Created a new data sheet: ' + newSheetData.data.sheetName, 'star_shine');
                        closeModalByName(textInputModalName);
                        closeModalByName(sheetSettingModalName);
                        getModalSheetSetting();
                    };
                    return btnGenerate;
                },
                () => {
                    var btnApply = createIconizedButton('new_label', 'Apply Name', async () => {
                        var thisModal = getModalByName(textInputModalName);
                        if (thisModal) {
                            var modalInputText = thisModal.modal.querySelector('input');
                            if (modalInputText && modalInputText.value.trim().length <= 0) {
                                toggleNotification('error', 'Please input the data sheet name first.');
                                return;
                            }
                            thisModal.modal.querySelectorAll('button, input').forEach(element => {
                                element.disabled = true;
                            });
                        }
                        btnApply.textContent = 'Applying...';
                        const newSheetData = await appendEvent('Creating new user sheet', async () => {
                            const data = await postCloudData('setUserSheet', {uid: userData.uid, sheetName: modalInputText.value.trim()});
                            return data;
                        }, "wand_stars");
                        userData.sheetID = newSheetData.data.sheetID;
                        userData.sheetUrl = newSheetData.data.sheetUrl;
                        toggleNotification('success', 'Created a new data sheet: ' + newSheetData.data.sheetName, 'star_shine');
                        closeModalByName(textInputModalName);
                        closeModalByName(sheetSettingModalName);
                        getModalSheetSetting();
                    });
                    btnApply.classList.add('btn-primary');
                    btnApply.querySelector('.icon').style.color = 'white';
                    btnApply.querySelector('div').style.color = 'white';
                    return btnApply;
                }
            ]);
            /*await appendEvent('Creating new user sheet', async () => {
                console.log("Trying to connect to sheet creation...");
                const data = await postCloudData('setUserSheet', {uid: currentUserUID});
                console.log(data);
                return data;
            });*/
            
        });
        btnCreateNewSheet.classList.add('btn-stack', 'btn-primary');
        btnCreateNewSheet.querySelector('.icon').style.color = 'white';
        btnCreateNewSheet.querySelector('div').style.color = 'white';
        modal.appendChild(btnCreateNewSheet);

        const btnUseExistingSheet = createIconizedButton('place_item', 'Import Sheet', () => {

        });
        btnUseExistingSheet.classList.add('btn-stack');
        modal.appendChild(btnUseExistingSheet);
    }

    //Button - delete if already have
    if (userData.sheetUrl && userData.sheetUrl.length > 0){
        const btnDeleteSheet = document.createElement('button');
        btnDeleteSheet.classList.add('btn-normal');
        btnDeleteSheet.style.color = 'red';
    }
}

export function getModalTextInput(title, placeholder, getButtonActions){
    const modal = createModalWindow(title);
    modal.style.maxWidth = '80%';

    //Text Input Zone
    const inputField = document.createElement('input');
    inputField.classList.add('input-text');
    inputField.type = 'text';
    inputField.placeholder = placeholder;
    modal.appendChild(inputField);

    //Button Zone
    const buttonZone = document.createElement('div');
    buttonZone.classList.add('area-horizontal', 'area-center', 'area-fit-horizontal', 'btn-stack');
    modal.appendChild(buttonZone);
    if (getButtonActions){
        for (var bAction of getButtonActions){
            if (!bAction)
                continue;
            var buttonResult = bAction();
            if (!buttonResult)
                continue;
            buttonZone.appendChild(buttonResult);
        }
    }
}