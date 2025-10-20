import { generateShortId } from "../utils/helpers";
import { toggleNotification } from "../views/pages";
import * as settings from "../views/editors/view-card-settings";

export const googleWebBuildAPI = 'https://script.google.com/macros/s/AKfycbx-WF5j9_2A_EOH09ZLF_wc5TQdUYpFAZI9nbuVbCpIyEeAeSo77dzrBiF7XZELuECPAg/exec';

async function getCloudData(action){
    const url = `${googleWebBuildAPI}?action=${action}`;
    const response = await fetch(url, { method: 'GET', 'content-type': 'text/plain;charset=utf-8'});
    const result = await response.json();

    if (result.status === 'success') {
        return result;
    } else {
        toggleNotification('error', 'Error retrieving data: ' + action + ' - ' + result.message);
    }
    return null;
}

export async function postCloudData(action, data) {
    data.lastEditTime = new Date().toISOString();
    settings.setSettingModule('LAST_EDIT_TIME', data.lastEditTime);
    const payloadJSON = JSON.stringify({...data});
    var result = await fetch(`${googleWebBuildAPI}?action=${action}`, {
        method: 'POST',
        body: payloadJSON,
        headers: { 'Content-Type': 'text/plain;charset=utf-8'},
    });
    var result = await result.json();
    return result;
}

export async function addUser(name, email, username, password) {
    const payloadJSON = JSON.stringify({
        uid: generateShortId(),
        name: name,
        email: email,
        username: username,
        password: password
    });

    await fetch(`${googleWebBuildAPI}?action=addNewUser`, {
        method: 'POST',
        body: payloadJSON,
        headers: { 'Content-Type': 'text/plain;charset=utf-8'},
    })
    .then(response => response.text())
     .then(data => console.log(data));
}

export async function fetchUsers() {
    var result = await getCloudData('fetchUsers');
    return result;
}

export function fetchProjects(){

}

export function fetchCards(){

}

export function fetchSettings(){

}