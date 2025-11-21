import { btnLogin, btnLoginGotoRegister, btnLoginPasswordBlinder, btnLoginSwitchMode, btnRegGotoLogin, btnRegisterCreateAccount, btnsCreateCard, inputLoginEmail, inputLoginPassword, inputLoginUsername, inputRegEmail, inputRegLastName, inputRegMiddleName, inputRegName, inputRegPassword, inputRegPasswordConfirm, inputRegUsername, txtLoginEmail, txtLoginUsername } from "./config/dom-elements";
import { addUser, fetchUsers, googleWebBuildAPI, postCloudData } from "./databases/google-sheets";
import { loadCloudDataToLocal } from "./databases/local-data";
import { appendEvent } from "./events/events";
import { getModalSheetSetting } from "./views/modals";
import { displayPage, toggleNotification } from "./views/pages";
import { makeAction_ButtonSwitch } from "./views/view-actions";
import * as pgMasonry from "./views/pages/page-masonry";
import * as pgCardViewer from "./views/pages/page-card-viewer";
import * as settings from "./views/editors/view-card-settings";
import * as contextMenu from "./views/context-menu";
import { delay } from "./utils/helpers";

export const userData = {
    uid: null,
    email: null,
    username: null,
    sheetID: null,
    sheetUrl: null
};

window.onload = onAppLoad;
window.onresize = () => {
    //>ความพยายามในการจัดการกับปัญหา context-menu เด้งใน IOS แต่เหมือนจะได้ผล Response แค่ใน Android
    //toggleNotification('success', "Test");
    pgMasonry.onMasonryResized();
};

document.addEventListener('click', ev => {
    //Check contextmenu outside-click to close
    if (contextMenu.activeMenu && !contextMenu.activeMenu.contains(ev.target)){
        contextMenu.closeMenu();
    }
});

//Handle data compatibility between tabs/windows
document.addEventListener('visibilitychange', handleVisibilityChange, false);
function handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
        checkDataDuplication();
    }
}
function checkDataDuplication() {
    if (userData && userData.sheetID) {
        appendEvent("Checking the last time edited", async () => {
            const localDate = new Date(settings.getSettingModuleValue("LAST_EDIT_TIME"));
            const result = await postCloudData('getLastEditSetting', {sheetID: userData.sheetID});
            const cloudDate = new Date(result.data["LAST_EDIT_TIME"]) ?? undefined;
            if (localDate && cloudDate && cloudDate > localDate) {
                appendEvent("Data incompatibilities found! Begin advancing to the newer version.", async () => {
                    await delay(1000);
                    postLoginContentLoadings();
                }, "settings_alert");
            }

        }, "graph_6");
    }
}


function onAppLoad(){
    pgCardViewer.setupCardViewerPage();

    //>ความพยายามในการจัดการกับปัญหา context-menu เด้งใน IOS แต่เหมือนจะได้ผล Response แค่ใน Android
    /*if ('virtualKeyboard' in navigator) {
        navigator.virtualKeyboard?.addEventListener('geometrychange', (event) => {
            const { height } = event.target.boundingRect;
            console.log(`Keyboard height: ${height}px`);
            toggleNotification('success', `Keyboard height: ${height}px`);
        });
    }*/
}

//Login - Password blinder

//Login - Login Mode Switching Button
makeAction_ButtonSwitch(btnLoginSwitchMode, state => {
    if (state === 0) {
        //Rendering Email Login
        txtLoginEmail.classList.remove('hidden');
        inputLoginEmail.classList.remove('hidden');
        txtLoginUsername.classList.add('hidden');
        inputLoginUsername.classList.add('hidden');
        btnLoginSwitchMode.textContent = "Or Login with Username";
    }
    else if (state === 1) {
        //Rendering Username Login
        txtLoginEmail.classList.add('hidden');
        inputLoginEmail.classList.add('hidden');
        txtLoginUsername.classList.remove('hidden');
        inputLoginUsername.classList.remove('hidden');
        btnLoginSwitchMode.textContent = "Or Login with Email";
    }
}, 'currentButtonState', 2);

//Login - Login
btnLogin.addEventListener('click', async () => {
    const email = inputLoginEmail.value.trim();
    const username = inputLoginUsername.value.trim();
    if (email.length === 0 && username.length === 0){
        toggleNotification('error', 'Please fill the email and username fields.', 'psychology_alt');
        return;
    }

    const password = inputLoginPassword.value.trim();
    if (password.length === 0){
        toggleNotification('error', 'Please enter the account password.', 'password');
        return;
    }


    btnLogin.textContent = 'Logging in...';
    btnLogin.disabled = true;
    const loginMode = btnLoginSwitchMode.dataset.currentButtonState;
    appendEvent("Logging in as " + (loginMode === '0' ? email : username), async () => {
        //Retriving user UID
        appendEvent("Retrieving the user's UID", async () => {
            const postDat = {
                email: null,
                username: null
            }
            if (loginMode === '0') {
                postDat.email = email;
            }
            else if (loginMode === '1') {
                postDat.username = username;
            }
            const result = await postCloudData('getUserUID', postDat);
            if (result.status === 'success' && result.data.uid) {
                userData.uid = result.data.uid;
            }
        }, "detection_and_zone");

        //Check user availability status -> No uid: Open the modal, Have uid: Continue
        appendEvent("Retrieving the user's data", async () => {
            if (userData.uid) {
                //Retreing the user's full data
                const retrievingData = await postCloudData('getUser', {uid: userData.uid, isTestingSheet: true});
                console.log("Retrieved data:", retrievingData)
                if (retrievingData.data.password === password) {
                    //Fill Email
                    if (retrievingData.data.email && retrievingData.data.email !== ''){
                        userData.email = retrievingData.data.email;
                    }
                    //Fill Username
                    if (retrievingData.data.username && retrievingData.data.username !== ''){
                        userData.username = retrievingData.data.username;
                    }

                    //Fill Sheet
                    if (!retrievingData.data.sheetID || retrievingData.data.sheetID === '' || !retrievingData.data.sheetUrl || retrievingData.data.sheetUrl === '') {
                        appendEvent("Displaying the creating user modal", async () => {
                            getModalSheetSetting();
                        }, "add_ad");
                    }
                    else {
                        userData.sheetID = retrievingData.data.sheetID;
                        userData.sheetUrl = retrievingData.data.sheetUrl;
                        postLoginContentLoadings();
                    }
                    
                    inputLoginEmail.value = '';
                    inputLoginUsername.value = '';
                    inputLoginPassword.value = '';
                    btnLogin.textContent = 'Login';
                    btnLogin.disabled = false;
                    toggleNotification('success', 'Login successful.', 'check_circle');
                    displayPage('inside-space');
                }
                else {
                    toggleNotification('error', 'Invalid email/username or password.', 'psychology_alt');
                    btnLogin.textContent = 'Login';
                    btnLogin.disabled = false;
                }
            }
            else {
                //Don't have data
                appendEvent("Displaying the creating user modal", async () => {
                toggleNotification('error', "The username/email not found, please register the new account.", "psychology_alt");
                    displayPage('register');
                    btnLogin.textContent = 'Login';
                    btnLogin.disabled = false;
                }, "add_ad");
            }
        }, "data_table");
    }, 'login');
});

function postLoginContentLoadings() {
    appendEvent("Retieving the user's settings", async () => {
        await settings.loadAllSettings();
    }, "settings");
    loadCloudDataToLocal();

}

//Login - Go to Registration Page
btnLoginGotoRegister.addEventListener('click', () => {
    displayPage('register');
});

//Register - Password blinder
makeAction_ButtonSwitch(btnLoginPasswordBlinder, state => {
    if (state === 0){
        //Blind
        inputLoginPassword.type = 'password';
        btnLoginPasswordBlinder.querySelector('.icon').textContent = 'visibility';
    }
    else if (state === 1) {
        //Unblind
        inputLoginPassword.type = 'text';
        btnLoginPasswordBlinder.querySelector('.icon').textContent = 'visibility_off';
    }
}, 'currentButtonState', 2)

//Register - Password confirm blinder

//Register - Go to Login
btnRegGotoLogin.addEventListener('click', () => {
    inputLoginEmail.value = '';
    inputLoginUsername.value = '';
    inputLoginPassword.value = '';
    displayPage('login');
});

//Register - Create Account
btnRegisterCreateAccount.addEventListener('click', async () => {
    const name = inputRegName.value.trim();
    const middlename = inputRegMiddleName.value.trim();
    const lastname = inputRegLastName.value.trim();
    if (name.length === 0 || lastname.length === 0) {
        toggleNotification('error', 'Name and Lastname are required.', 'psychology_alt');
        return;
    }

    const email = inputRegEmail.value.trim();
    const username = inputRegUsername.value.trim();
    if (email.length === 0 || username.length === 0){
        toggleNotification('error', 'Please fill the email and username fields.', 'psychology_alt');
        return;
    }

    const password = inputRegPassword.value.trim();
    if (password.length === 0){
        toggleNotification('error', 'Please enter the account password.', 'password');
        return;
    }

    const passwordConfirm = inputRegPasswordConfirm.value.trim();
    if (passwordConfirm.length === 0){
        toggleNotification('error', 'Please confirm the account password.', 'password');
        return;
    }

    if (password !== passwordConfirm) {
        toggleNotification('error', 'Passwords do not match.', 'password');
        return;
    }

    btnRegisterCreateAccount.textContent = 'Checking the email/username availability...';
    btnRegisterCreateAccount.disabled = true;
    appendEvent("Checking the email/username availability", async () => {
        var existUsers = await fetchUsers();
        if (existUsers !== null && existUsers.status === 'success' && existUsers.data.length > 0) {
            if (existUsers.data.some(user => user.email === email)) {
                toggleNotification('error', 'This e-mail is already registered.', 'email');
                btnRegisterCreateAccount.textContent = 'Register';
                btnRegisterCreateAccount.disabled = false;
                return;
            }
            else if (existUsers.data.some(user => user.username.toLowerCase() === username.toLowerCase())) {
                toggleNotification('error', 'This username is already registered.', 'person');
                btnRegisterCreateAccount.textContent = 'Register';
                btnRegisterCreateAccount.disabled = false;
                return;
            }
        }
        btnRegisterCreateAccount.textContent = 'Creating the registration...';

        appendEvent("Creating the registration", async () => {
            await addUser(`${name}${" " + middlename} ${lastname}`, email, username, password);

            btnRegisterCreateAccount.textContent = 'Register';
            btnRegisterCreateAccount.disabled = false;
            inputRegName.value = '';
            inputRegMiddleName.value = '';
            inputRegLastName.value = '';
            inputRegEmail.value = '';
            inputRegUsername.value = '';
            inputRegPassword.value = '';
            inputRegPasswordConfirm.value = '';

            inputLoginEmail.value = '';
            inputLoginUsername.value = '';
            const currentLoginMode = btnLoginSwitchMode.dataset.currentButtonState;
            if (currentLoginMode === '0') {
                inputLoginEmail.value = email;
            }
            else if (currentLoginMode === '1') {
                inputLoginUsername.value = username;
            }
            inputLoginPassword.value = password;
            displayPage('login');
            toggleNotification('success', 'Account registered successfully.', 'wand_stars');
        }, "fingerprint");
    }, "id_card");
});

//Masonry Card List - Settings
document.querySelector('#btn-settings').addEventListener('click', () => {
    settings.getModalSettings();
});


/*btnsCreateCard.forEach(button => {
    button.addEventListener('click', () => {
        getModalCardCreation();
    });
});*/