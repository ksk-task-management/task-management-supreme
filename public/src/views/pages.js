import { areaNotify, iconNotify, pageLogin, pageRegister, pageCardsMasonryList, textNotifyContent, areaEventLoading, txtEventLoading, iconEventLoading, txtEventLoadingEventRemaining } from "../config/dom-elements";
import { remainingEventCount } from "../events/events";
import * as pgMasonry from "./pages/page-masonry";

let timeoutFunction = null;

export function displayPage(page) {
    if (page === 'inside-space'){
        //FETCH TO USER's LAST SETTING PAGE....
        displayPage('cards_masonry_list');
        return;
    }

    pageLogin.classList.add('hidden');
    pageRegister.classList.add('hidden');
    pageCardsMasonryList.classList.add('hidden');

    if (page === 'login') {
        pageLogin.classList.remove('hidden');
    }
    else if (page === 'register') {
        pageRegister.classList.remove('hidden');
    }
    else if (page === 'cards_masonry_list'){
        pageCardsMasonryList.classList.remove('hidden');
    }
}

export function renderAnyOpeningPages() {
    if (!pageCardsMasonryList.classList.contains('hidden')) {
        pgMasonry.render();
    }
}

export function toggleNotification(type, message, customIcon = null, accentColor = null, backdropColor = null){
    areaNotify.classList.remove('hidden');
    textNotifyContent.textContent = message;

    if (customIcon) {
        iconNotify.textContent = customIcon; // Set custom icon class
    } else {
        switch (type) {
            case 'success':
                iconNotify.textContent = 'check_circle'; // Example success icon
                break;
            case 'error':
                iconNotify.textContent = 'error'; // Example error icon
                break;
            case 'info':
                iconNotify.textContent = 'info'; // Example info icon
                break;
            default:
                iconNotify.textContent = 'notification'; // Default notification icon
        }
    }

    var iAccentColor = accentColor;
    var iBackdropColor = backdropColor;
    if (!iAccentColor || !iBackdropColor){
        if (type === 'success'){
            iAccentColor = 'rgb(11, 195, 82)';
            iBackdropColor = 'rgba(11, 195, 82, 0.1)';
        }
        else if (type === 'error'){
            iAccentColor = 'rgb(216, 19, 111)';
            iBackdropColor = 'rgba(216, 19, 111, 0.1)';
        }
        else if (type === 'info'){
            iAccentColor = 'rgb(0, 123, 255)';
            iBackdropColor = 'rgba(0, 123, 255, 0.1)';
        }
        else {
            iAccentColor = 'rgb(128, 128, 128)'; // Default color
            iBackdropColor = 'rgba(128, 128, 128, 0.1)'; // Default backdrop
        }
    }
    
    textNotifyContent.style.color = iAccentColor;
    iconNotify.style.color = iAccentColor;
    areaNotify.style.backgroundColor = iBackdropColor;

    if (timeoutFunction){
        clearTimeout(timeoutFunction);
    }

    setTimeout(() => {
        areaNotify.classList.add('hidden');
    }, 5000); // Hide after 5 seconds
    areaNotify.onclick = () => {
        areaNotify.classList.add('hidden');
        if (timeoutFunction){
            clearTimeout(timeoutFunction);
        }
    };
}

let isAreaLoadingActive = false;
export function openEventLoading(txt, icon = null){
    if (!isAreaLoadingActive) {
        areaEventLoading.classList.remove('hidden');
        areaEventLoading.classList.add('animation-slide-in-y');
        areaEventLoading.onanimationend = () => {
            areaEventLoading.classList.remove('animation-slide-in-y');
        }
        isAreaLoadingActive = true;
    }

    if (txt) {
        txtEventLoading.textContent = txt;
    }

    if (icon) {
        iconEventLoading.textContent = icon;
    } else iconEventLoading.textContent = 'hourglass';

    txtEventLoadingEventRemaining.textContent = remainingEventCount();

}

export function closeEventLoading(){
    if (areaEventLoading.classList.contains('animation-slide-out-y'))
        return;

    if (isAreaLoadingActive) {
        areaEventLoading.classList.add('animation-slide-out-y');
        areaEventLoading.onanimationend = () => {
            areaEventLoading.classList.remove('animation-slide-out-y');
            areaEventLoading.classList.add('hidden');
        }
        isAreaLoadingActive = false;
    }
}