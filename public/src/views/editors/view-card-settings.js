import { postCloudData } from "../../databases/google-sheets";
import { appendEvent } from "../../events/events";
import { userData } from "../../main";
import { formatBytes } from "../../utils/helpers";
import { closeModalByID, createModalWindow } from "../modals";
import { toggleNotification } from "../pages";

const settingStructure = [
    {
        section: "General",
        tabs: [
            {
                name: "Appearance",
                icon: "palette",
                settings: [
                    {
                        name: "Primary Color",
                        refName: "PRIMARY_COLOR",
                        editor(valueData) {
                        }
                    }
                ]
            }
        ]
    },
    {
        section: "Storage",
        tabs: [
            {
                name: "Main Sheet",
                icon: "database",
                settings: [
                    {
                        name: "Sheet ID",
                        refName: "MAIN_SHEET_ID",
                        editor(valueData) {
                            console.log("Editor", valueData);
                        }
                    }
                ]
            },
            {
                name: "Cloud Files",
                icon: "cloud",
                settings: [
                    {
                        name: "Cloud Folder Storage",
                        refName: "ONLINE_STORAGE_FOLDER_ID",
                        editor(valueData) {
                            const folderSettingAreaHtml = document.createElement('div');
                            folderSettingAreaHtml.classList.add('modal-settings-folder-area');

                            const folderItemRenderFunc = (folderDat, folderHtml) => {
                                folderHtml.innerHTML = '';
                                folderHtml.classList.add('modal-settings-folder-item');

                                //Icon
                                const icnFolder = document.createElement('span');
                                icnFolder.classList.add('icon', 'material-symbols-outlined');
                                icnFolder.textContent = 'folder_check_2';
                                folderHtml.appendChild(icnFolder);

                                //Name
                                const txtFolderName = document.createElement('span');
                                txtFolderName.classList.add('modal-settings-folder-item-name');
                                txtFolderName.textContent = folderDat.folderName ? folderDat.folderName : "Unknown Folder";
                                folderHtml.appendChild(txtFolderName);

                                //Link
                                if (folderDat.folderLink) {
                                    const linkFolder = document.createElement('a');
                                    linkFolder.classList.add('modal-settings-folder-item-link');
                                    linkFolder.href = folderDat.folderLink;
                                    linkFolder.target = '_blank';
                                    linkFolder.rel = 'noopener noreferrer';
                                    linkFolder.textContent = folderDat.folderLink;
                                    folderHtml.appendChild(linkFolder);
                                    linkFolder.addEventListener('click', (e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        window.open(folderDat.folderLink, '_blank', 'noopener');
                                    });
                                }

                                //Size
                                const txtFolderSize = document.createElement('span');
                                txtFolderSize.classList.add('modal-settings-folder-item-size');
                                txtFolderSize.textContent = folderDat.folderSize ? formatBytes(folderDat.folderSize) : "-- Bytes";
                                folderHtml.appendChild(txtFolderSize);

                                //Delete and refresh Button
                                const btnFolderActions = document.createElement('div');
                                btnFolderActions.classList.add('modal-settings-folder-item-actions');
                                folderHtml.appendChild(btnFolderActions);
                                //Refresh Button
                                const btnRefresh = document.createElement('span');
                                btnRefresh.classList.add('icon', 'material-symbols-outlined', 'btn-folder-refresh');
                                btnRefresh.textContent = 'refresh';
                                btnFolderActions.appendChild(btnRefresh);
                                btnRefresh.title = "Refresh Folder Info";
                                btnRefresh.addEventListener('click', async (e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    appendEvent("Refreshing folder info...", async () => {
                                        const result = await postCloudData('getFolderInfo', {folderID: folderDat.folderID});
                                        if (result.status === 'success' && result.data) {
                                            toggleNotification('success', `Folder ${result.data.folderName} info has been refreshed.`);
                                            folderDat.folderName = result.data.folderName;
                                            folderDat.folderSize = result.data.folderSize;
                                            folderDat.folderLink = result.data.folderLink;
                                            folderItemRenderFunc(folderDat, folderHtml);
                                            await saveSettingModule("ONLINE_STORAGE_FOLDER_ID", valueData);
                                        }
                                        else if (result.status === 'error') {
                                            toggleNotification('error', 'Error retrieving folder info: ' + result.message);
                                        }
                                    } , "folder_data");
                                });
                                //Delete Button
                                const btnDelete = document.createElement('span');
                                btnDelete.classList.add('icon', 'material-symbols-outlined', 'btn-folder-delete');
                                btnDelete.textContent = 'delete';
                                btnFolderActions.appendChild(btnDelete);
                                btnDelete.title = "Remove this folder from the list";
                                btnDelete.addEventListener('click', async (e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    const confirmDelete = confirm(`Are you sure you want to remove the folder ${folderDat.folderName ? folderDat.folderName : folderDat.folderID} from the list? This will not delete any files in the folder.`);
                                    if (!confirmDelete) return;
                                    const folderIndex = valueData.findIndex(folDat => folDat.folderID === folderDat.folderID);
                                    if (folderIndex >= 0) {
                                        valueData.splice(folderIndex, 1);
                                        await saveSettingModule("ONLINE_STORAGE_FOLDER_ID", valueData);
                                    }
                                    folderHtml.remove();
                                });

                                if (folderDat.folderName) {
                                    folderHtml.dataset.folderName = folderDat.folderName;
                                }
                            }

                            //Folder List
                            //console.log("Folder Data", valueData);
                            valueData.forEach(folderObject => {
                               // console.log("Rendering folder", folderObject);
                                const folderItemHtml = document.createElement('div');
                                folderSettingAreaHtml.appendChild(folderItemHtml);
                                folderItemRenderFunc(folderObject, folderItemHtml);
                            });

                            //Folder Add Button
                            const btnFolderAddHtml = document.createElement('div');
                            btnFolderAddHtml.classList.add('modal-settings-folder-item', 'btn-folder-add');
                            const icnAdd = document.createElement('span');
                            icnAdd.classList.add('icon', 'material-symbols-outlined');
                            icnAdd.textContent = 'create_new_folder';
                            btnFolderAddHtml.appendChild(icnAdd);
                            const txtAdd = document.createElement('span');
                            txtAdd.classList.add('txt');
                            txtAdd.textContent = "Add Folder";
                            btnFolderAddHtml.appendChild(txtAdd);
                            folderSettingAreaHtml.appendChild(btnFolderAddHtml);
                            btnFolderAddHtml.addEventListener('click', () => {
                                const modalAddFolder = createModalWindow("Add Cloud Folder");  
                                modalAddFolder.classList.add('modal-add-cloud-folder');
                                const txtInstructions = document.createElement('div');
                                txtInstructions.classList.add('txt-description');
                                txtInstructions.textContent = "Pick a google drive folder > Share > Copy Link, in the URL 'https://drive.google.com/drive/folders/1A2B3C4D5E6F7G8H9I0J/?usp=drive_link', the Folder ID is '1A2B3C4D5E6F7G8H9I0J'.";
                                modalAddFolder.appendChild(txtInstructions);
                                const inputFolderID = document.createElement('input');
                                inputFolderID.classList.add('input-txt-3d-groove')
                                inputFolderID.type = 'text';
                                inputFolderID.placeholder = "Enter Folder ID";
                                modalAddFolder.appendChild(inputFolderID);
                                const btnAddFolderConfirm = document.createElement('button');
                                btnAddFolderConfirm.classList.add("btn-normal", "btn-primary", "area-fill-horizontal", "btn-stack");
                                btnAddFolderConfirm.textContent = "Add Folder";
                                btnAddFolderConfirm.addEventListener('click', async () => {
                                    const newFolderID = inputFolderID.value.trim();
                                    if (newFolderID.length === 0) return;
                                    appendEvent("Retrieving folder info...", async () => {
                                        const result = await postCloudData('getFolderInfo', {folderID: newFolderID});
                                        if (result.status === 'success' && result.data) {
                                            toggleNotification('success', `Folder ${result.data.folderName} has beed applied as a cloud storage folder.`);
                                            let dataToSave = valueData.forEach(folDat => folDat.folderID === newFolderID);
                                            if (!dataToSave) {
                                                dataToSave = {folderID: result.data.folderID};
                                                valueData.push(dataToSave);
                                            };
                                            dataToSave.folderName = result.data.folderName;
                                            dataToSave.folderSize = result.data.folderSize;
                                            dataToSave.folderLink = result.data.folderLink;
                                            //console.log(dataToSave);

                                            //Update Local Display
                                            const newFolderItemHtml = document.createElement('div');
                                            const afterElement = folderSettingAreaHtml.querySelector(`.modal-settings-folder-item[data-folder-name="${dataToSave.folderName}"]`);
                                            folderSettingAreaHtml.insertBefore(newFolderItemHtml, afterElement ?? btnFolderAddHtml);
                                            folderItemRenderFunc(dataToSave, newFolderItemHtml);
                                            if (afterElement)
                                                afterElement.remove();

                                            //Save to database
                                            await saveSettingModule("ONLINE_STORAGE_FOLDER_ID", valueData);
                                        }
                                        else if (result.status === 'error') {
                                            toggleNotification('error', 'Error retrieving folder info: ' + result.message);
                                        }
                                        closeModalByID(modalAddFolder.dataset.modalID);
                                    } , "folder_data");
                                });
                                modalAddFolder.appendChild(btnAddFolderConfirm);
                            });

                            return folderSettingAreaHtml;
                        }
                    }
                ]
            }
        ]
    },
]

const loadedSettings = [];
let activeTab = "Appearance";
export function getModalSettings() {
    const modalSettings = createModalWindow("Settings");
    modalSettings.classList.add("modal-settings");
    modalSettings.style.maxWidth = '80%';

    const settingArea = document.createElement('div');
    settingArea.classList.add('modal-settings-area');
    modalSettings.appendChild(settingArea);

    //Setting Side Tabs
    const sideTabContainer = document.createElement('div');
    sideTabContainer.classList.add('modal-settings-side-tab-container');
    settingArea.appendChild(sideTabContainer);

    //Setting Content Container
    const settingContentContainer = document.createElement('div');
    settingContentContainer.classList.add('modal-settings-content-container');
    settingArea.appendChild(settingContentContainer);

    for (let section of settingStructure){
        const sectionTxt = document.createElement('div');
        sectionTxt.classList.add('modal-settings-txt-section');
        sectionTxt.textContent = section.section;
        sideTabContainer.appendChild(sectionTxt);

        for (let tab of section.tabs){
            const tabBtn = document.createElement('div');
            tabBtn.classList.add('modal-settings-btn-tab');
            const tabIcn = document.createElement('span');
            tabIcn.classList.add('icon', 'material-symbols-outlined');
            tabIcn.textContent = tab.icon;
            tabBtn.appendChild(tabIcn);
            const tabTxt = document.createElement('span');
            tabTxt.classList.add('txt');
            tabTxt.textContent = tab.name;
            tabBtn.appendChild(tabTxt);
            sideTabContainer.appendChild(tabBtn);
            tabBtn.onclick = () => {
                activeTab = tab.name;
                const allTabBtns = sideTabContainer.querySelectorAll('.modal-settings-btn-tab');
                allTabBtns.forEach(btn => btn.classList.remove('active'));
                tabBtn.classList.add('active');
                //Load tab content
                renderSettingContent(settingContentContainer, tab.settings);
            };

            if (activeTab && activeTab === tab.name) {
                tabBtn.classList.add('active');
                tabBtn.click();
            }
        }
    }
}

function renderSettingContent(containerHtml, tabSettingContent) {
    if (!tabSettingContent || !Array.isArray(tabSettingContent)) return;
    //Clear previous content
    containerHtml.innerHTML = '';
    for (let setting of tabSettingContent){
        const settingModuleAreaHtml = document.createElement('div');
        settingModuleAreaHtml.classList.add('modal-settings-module');
        containerHtml.appendChild(settingModuleAreaHtml);

        const txtModuleTitleHtml = document.createElement('div');
        txtModuleTitleHtml.classList.add('modal-settings-txt-module-title');
        txtModuleTitleHtml.textContent = setting.name;
        settingModuleAreaHtml.appendChild(txtModuleTitleHtml);

        if (setting.editor && typeof setting.editor === 'function'){
            const moduleValue = getSettingModule(setting.refName);
            console.log("Rendering setting", setting.refName, moduleValue);
            const moduleValueObject = moduleValue ?? [];
            const moduleEditorHtml = setting.editor(moduleValueObject);
            if (moduleEditorHtml instanceof HTMLElement) {
                settingModuleAreaHtml.appendChild(moduleEditorHtml);
            }
        }
    }
}

export function getSettingModule(refName) {
    return loadedSettings.find(s => {
        console.log("Checking setting", s.settingModule, refName);
        return s.settingModule === refName;
    })?.settingValue;
}

export async function loadAllSettings() {
    const result = await postCloudData('fetchSettings', {sheetID: userData.sheetID});
    if (result.status === 'success' && result.data) {
        for (let setting of result.data) {
            if (setting.settingModule && setting.settingValue) {
                let parsedData = undefined;
                try {
                    parsedData = JSON.parse(setting.settingValue);
                }
                catch (e){
                    continue;
                }
                loadedSettings.push({settingModule: setting.settingModule, settingValue: parsedData});
            }   
        }
    } else if (result.status === 'error') {
        toggleNotification('error', 'Error retrieving settings: ' + result.message);
    }
    console.log("Settings loaded", loadedSettings);
    return loadedSettings;
}

async function saveSettingModule(settingModule, settingValue) {
    const index = loadedSettings.findIndex(s => s.settingModule === settingModule);
    if (index !== -1) {
        loadedSettings[index].settingValue = settingValue;
    } else {
        loadedSettings.push({settingModule: settingModule, settingValue: settingValue});
    }
    const saveResult = await postCloudData('saveSettingModule', {sheetID: userData.sheetID, settingModule: settingModule, settingValue: JSON.stringify(settingValue)});
    console.log("saveSettingModule", saveResult, loadAllSettings);
}