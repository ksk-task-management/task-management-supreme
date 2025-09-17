import { setColorOpacity, generateShortId, setColorPart, hyperflatArray } from "../utils/helpers";
import { createModalWindow } from "../views/modals";
import * as cardEditor from "./card-editor";
import * as cardDataObjectEditor from "./card-data-obj-editor";
import * as cardDataManage from "./card-data-manage";
import * as localData from "../databases/local-data";
import * as contextMenu from "../views/context-menu";
import { userData } from "../main";
import { appendEvent } from "../events/events";
import { postCloudData } from "../databases/google-sheets";
import { forceRenderOpeningPage } from "../views/pages";

export const majorCardTypes = [
    {
        type: "Task",
        icon: "nest_eco_leaf",
    },
    {
        type: "Event",
        icon: "event",
    },
    {
        type: "Idea",
        icon: "lightbulb",
    },
    {
        type: "Board",
        icon: "content_paste",
    },
    {
        type: "Division",
        icon: "auto_awesome_mosaic",
        requiredParent: true
    },
    {
        type: "Note",
        icon: "note_stack"
    }
];//["task", "event", "idea", "board"];

export const defaultCardStatus = [
    {
        status: "Not Started",
        icon: "history_toggle_off",
        color: "#e0267a",
        scoreAdjust: 40,
        progressPercent: 25,
        quickButtons: [
            {
                icon: "rocket",
                setStatus: "In Progress"
            },
            {
                icon: "umbrella",
                setStatus: "On Hold"
            }
        ]
    },
    {
        status: "In Progress",
        icon: "offline_bolt",
        color: "#7025e8",
        scoreAdjust: 2,
        progressPercent: 50,
        quickButtons: [
            {
                icon: "satellite_alt",
                setStatus: "Final Touch"
            },
            {
                icon: "cloud",
                setStatus: "Pending Background"
            },
            {
                icon: "pause_circle",
                setStatus: "Not Started"
            }
        ]
    },
    {
        status: "Pending Background",
        icon: "cloud_circle",
        scoreAdjust: 10,
        progressPercent: 45,
        color: "#4790d8ff",
        quickButtons: [
            {
                icon: "rocket",
                setStatus: "In Progress"
            },
            {
                icon: "pause_circle",
                setStatus: "Not Started"
            }
        ]
    },
    {
        status: "Completed",
        icon: "check_circle",
        color: "#25e88d",
        scoreAdjust: 0,
        progressPercent: 100,
    },
    {
        status: "Final Touch",
        icon: "nest_farsight_heat",
        color: "#1bdabaff",
        progressPercent: 100,
        scoreAdjust: 5, 
        quickButtons: [
            {
                icon: "wand_stars",
                setStatus: "Completed"
            },
            {
                icon: "recenter",
                setStatus: "In Progress"
            }
        ]
    },
    {
        status: "On Hold",
        icon: "pause_circle",
        color: "#e0bb26",
        scoreAdjust: 10,
        progressPercent: 0,
        quickButtons: [
            {
                icon: "exercise",
                setStatus: "Not Started"
            },
            {
                icon: "do_not_touch",
                setStatus: "Cancelled"
            }
        ]
    },
    {
        status: "Considered",
        icon: "lasso_select",
        color: "#bababaff",
        scoreAdjust: 90,
        progressPercent: 10,
        quickButtons: [
            {
                icon: "bolt",
                setStatus: "Not Started"
            },
            {
                icon: "do_not_touch",
                setStatus: "Cancelled"
            }
        ]
    },
    {
        status: "Cancelled",
        icon: "cancel",
        color: "#54444b",
        scoreAdjust: 500,
        progressPercent: 0,
        quickButtons: [
            {
                icon: "electric_bolt",
                setStatus: "Not Started"
            },
            {
                icon: "flare",
                setStatus: "Considered"
            },
        ]
    }
];

export const elementTemplates = [
    {
        key: ["type"],
        icon: () => "deployed_code",
        value: [
            {
                name: "Type",
                refName: "type",
                type: "cardtype",
                initialValue: () => {
                    return {
                        key: "cardtype",
                        value: majorCardTypes[0].type
                    }
                }
            }
        ],
        return: {
            "html": {
                
            },
            "block": {

            },
            "text": {

            }
        }
    },
    {
        key: ["uid"],
        icon: () => "data_object",
        value: [
            {
                name: "Card UID",
                refName: "uid",
                type: "text",
                initialValue: () => {
                   return {
                    key: "text",
                    value: generateShortId()
                   }
                },
                isEditable: false
            }
        ],
        return: {
            "html": {
                display: () => {return "Simulate The Html Return of UID Block";}
            },
            "block": {

            },
            "text": {

            }
        },
        isRequiredOn: ["*M"], //*M = major classes (tasks, events, ...)
        isAllowedUB: false
    },
    {
        key: ["parent"],
        icon: () => "subdirectory_arrow_right",
        value: [
            {
                name: "Parent",
                refName: "parent",
                type: "set-text|text",
                initialValue: () => {
                   return {
                    key: "text",
                    value: "<?>"
                   }
                },
            }
        ],
        return: {
            "html": {
                
            },
            "block": {

            }
        }
    },
    {
        key: ["subcards"],
        icon: () => "playing_cards",
        value: [
            {
                name: "Visible Outside",
                refName: "visible_outside",
                type: "boolean|text",
                isOmittable: true
            },
            {
                name: "Inheritance",
                refName: "inheritance",
                type: "set-*",
                isOmittable: true
            }
            //Moved under the "Style" block that falls under the inheritance value
            /*{
                name: "Title Prefix",
                refName: "title_prefix",
                type: "text",
                isOmitable: true
            },
            {
                name: "Title Suffix",
                refName: "title_suffix",
                type: "text",
                isOmitable: true
            }*/
        ],
        return: {
            "html": {

            },
            "block": {

            }
        }
    },
    {
        key: ["title"],
        icon: () => "title",
        value: [
            {
                name: "Card Title",
                refName: "title",
                type: "text",
                initialValue: () => {
                   return {
                    key: "text",
                    value: "Untitled"
                   }
                },
            }
        ],
        return: {
            "html": {
                //Dat is the Key-Value Pair
                value: (template, dat) => {
                    const newHtml = document.createElement('div');
                    newHtml.classList.add('area-horizontal');
                    var titleElement = cardDataManage.getReturnValue("html|text", dat, "title", "value");
                    if (typeof titleElement === 'string') {
                        const newStringDisplay = document.createElement('span');
                        newStringDisplay.classList.add('txt-title');
                        newStringDisplay.textContent = titleElement;
                        titleElement = newStringDisplay;
                    }
                    if (titleElement instanceof Node){
                        newHtml.appendChild(titleElement);
                    }
                    return newHtml;
                }
            },
            "block": {

            },
            "text": {

            }
        }
    },
    {
        key: ["description"],
        icon: () => "short_text",
        value: [
            {
                name: "Text",
                refName: "text",
                type: "text",
                initialValue: () => {
                    const descArray = ["Type something!", "Let's explain!", "Provide Info!", "Label me!"]
                    return {key: "text", value: descArray[Math.floor(Math.random() * descArray.length)]};
                },
            }
        ],
        return: {
            "html": {
                value: (template, dat) => {
                    const newHtml = document.createElement('div');
                    newHtml.classList.add('area-horizontal');
                    var titleElement = cardDataManage.getReturnValue("html|text", dat, "text", "value");
                    if (typeof titleElement === 'string') {
                        const newStringDisplay = document.createElement('span');
                        newStringDisplay.classList.add('txt-description');
                        newStringDisplay.textContent = titleElement;
                        titleElement = newStringDisplay;
                    }
                    if (titleElement instanceof Node){
                        newHtml.appendChild(titleElement);
                    }
                    return newHtml;
                }
            },
            "block": {

            },
            "text": {
                
            }
        }
    },
    {
        key: ["start-date"],
        icon: () => "calendar_add_on",
        value: [
            {
                name: "Starting Date",
                refName: "startDate",
                type: "datetime",
                initialValue: () => {
                    return {
                        key: "datetime",
                        value: new Date()
                    }
                }
            }
        ],
        return: {
            "html": {

            },
            "block": {

            },
            "text": {
                
            },
            "datetime": {

            }
        }
    },
    {
        key: ["end-date", "deadline"],
        icon: () => "calendar_clock",
        value: [
            {
                name: "End Date",
                refName: "endDate",
                type: "datetime",
                initialValue: () => {
                    return {
                        key: "datetime",
                        value: new Date()
                    }
                }
            }
        ],
        return: {
            "html": {

            },
            "block": {

            },
            "text": {
                
            },
            "datetime": {
                
            }
        }
    },
    {
        key: ["list"],
        icon: () => "list",
        value: [
            {
                name: "Items",
                refName: "items",
                type: "set-*"
            }
        ],
        return: {
            "html": {

            },
            "block": {

            }
        }
    },
    {
        key: ['card-styling'],
        icon: () => "format_paint",
        value: [
            {
                name: "Styles",
                refName: "styles",
                type: "set-style|text",
                initialValue: () => {
                    return {
                        key: "set",
                        value: []
                    }
                }
            }
        ],
        return: {
            "html": {

            },
            "block": {

            }
        }
    },
    {
        key: ["array"],
        icon: () => "more_horiz",
        value: [
            {
                name: "Items",
                refName: "items",
                type: "set-*"
            }
        ],
        return: {
            "html": {
                value: (template, dat) => 
                {
                    const arrayContainerHtml = document.createElement('div');
                    arrayContainerHtml.classList.add('display-container');
                    arrayContainerHtml.style.width = '100%';
                    arrayContainerHtml.style.height = 'fit-content';
                    const initialValue = cardDataManage.getReturnValue("set-*", dat, "items", "value");
                    const setValue = [initialValue];
                    while (setValue.some(v => cardDataManage.isMatter(v) && (v.valueID || Array.isArray(v)))) {
                        const idxNestedArray = setValue.findIndex(v => cardDataManage.isMatter(v) && (v.valueID || Array.isArray(v)));
                        const nestedValue = Array.isArray(setValue[idxNestedArray]) ? setValue[idxNestedArray] : [setValue[idxNestedArray]];
                        const tempResult = [];
                        nestedValue.forEach(nv => {
                            if (!cardDataManage.isMatter(nv))
                                return;
                            const r = cardDataManage.getReturnValue("*", nv, "*", "value");
                            if (!cardDataManage.isMatter(r))
                                return;
                            if (Array.isArray(r)) {
                                r.forEach(rr => tempResult.push(rr));
                            }
                            else
                                tempResult.push(r);
                        });
                        setValue.splice(idxNestedArray, 1, ...tempResult);
                    }

                    setValue?.forEach(valValue => {
                        //May be use valueType = "*" but afraid of unexoected results
                        if (!valValue) return;
                        const valContainer = document.createElement('div');
                        valContainer.style.display = 'inline-block';
                        valContainer.style.width = 'fit-content';
                        valContainer.style.maxWidth = '100%';
                        valContainer.style.height = 'fit-content';
                        valContainer.style.backgroundColor = 'white';
                        valContainer.style.border = '1px solid #c3c3c3';
                        valContainer.style.borderRadius = '5px';
                        valContainer.style.boxShadow = 'var(--shadow-min)';
                        valContainer.style.padding = '3px 6px';
                        valContainer.style.margin = '2px 2px';
                        arrayContainerHtml.appendChild(valContainer);

                        if (valValue instanceof Node) {
                            valContainer.appendChild(valValue);
                        }
                        else {
                            const valHtml = document.createElement('span');
                            valHtml.textContent = typeof valValue === 'string' ? valValue : JSON.stringify(valValue);
                            valContainer.appendChild(valHtml);
                        }
                    });
                    return arrayContainerHtml;
                }
            },
            "block": {
            },
            "set": {
                value: (template, dat) => {
                    const value = cardDataManage.getReturnValue("*", dat, "items", "value");
                    if (!Array.isArray(value)) {
                        value = [value];
                    }
                    //console.log('Array getting set value', value);
                    return value;
                }
            },
            "text": {
                value: (template, dat) => {
                    if (dat.value && Array.isArray(dat.value)) {
                        return "[" + dat.value.map(v => {
                            const txtVal = cardDataManage.getReturnValue("text", v, "*", "value");
                            return (txtVal !== undefined) ? txtVal : undefined;
                        }).filter(f => cardDataManage.isMatter(f)).join(", ") + "]";
                    }
                    else {
                        return "[]"
                    }
                }
            }
        }
    },
    {
        key: ["numbered-entry"],
        icon: () => "format_list_numbered",
        value: [
            {
                name: "Items",
                refName: "items",
                type: "set-*"
            }
        ],
        return: {
            "html": {
                value: (template, dat) => {
                    var setValue = cardDataManage.getReturnValue("html|set-*", dat, "items", "value");
                    const valueEntryArray = [];
                    if (setValue && !(setValue instanceof Node)) {
                        if (Array.isArray(setValue)) {
                            const arrayDistTemplate = elementTemplates.find(et => et.key.includes("array"));
                            const arraySatisfy = cardDataManage.checkValueReturnSatisfaction(arrayDistTemplate, "html");
                            if (arraySatisfy && arraySatisfy.length > 0) {
                                setValue = arraySatisfy[0].value(arrayDistTemplate, dat) ?? null;
                            }
                        }
                    }

                    const candidateParents = [];
                    if (setValue && setValue instanceof Node) {
                        const unclearedEntry = [setValue];
                        while (unclearedEntry.some(u => Array.isArray(u) || u.classList.contains('display-container'))) {
                            const thatIdx = unclearedEntry.findIndex(u => Array.isArray(u) || u.classList.contains('display-container'));
                            const newOnes = [];
                            if (Array.isArray(unclearedEntry[thatIdx])) {
                                unclearedEntry[thatIdx].forEach(i => {
                                    newOnes.push(i);
                                });
                            }
                            else if (unclearedEntry[thatIdx] instanceof Node) {
                                unclearedEntry[thatIdx].childNodes.forEach(i => {
                                    newOnes.push(i);
                                });
                                candidateParents.push(unclearedEntry[thatIdx]);
                            }
                            unclearedEntry.splice(thatIdx, 1, ...newOnes);
                        }

                        unclearedEntry.forEach(i => {
                            if (i instanceof HTMLElement) {
                                valueEntryArray.push(i);
                            }
                        });
                    }

                    if (valueEntryArray.length > 0){
                        valueEntryArray.forEach((ve, idx) => {
                            const numBadge = document.createElement('span');
                            numBadge.classList.add('num-badge');
                            numBadge.style.backgroundColor = '#787a7d';
                            numBadge.style.color = 'white';
                            numBadge.style.borderRadius = '5px';
                            numBadge.style.fontSize = '14px';
                            numBadge.style.fontWeight = 'bold';
                            numBadge.style.padding = '1px 6px';
                            numBadge.style.marginRight = '4px';
                            numBadge.textContent = (idx + 1).toString();
                            ve.prepend(numBadge);
                        });
                    }
                    return setValue;
                }
            },
            "block": {
            }
        }
    },
    //Displays
    {
        key: ["image"],
        icon: () => "image",
        value: [
            {
                name: "Source",
                refName: "source",
                type: "text|url|imagebase",
                initialValue: () => {
                    return {
                        key: "text",
                        value: "<Image Url>"
                    }
                }
            },
            {
                name: "Crop Position",
                refName: "crop_position",
                type: "text",
                initialValue: () => {
                    return {
                        key: "text",
                        value: "100% 100px center 40%"
                    }
                },
                isOmittable: true
            }
        ],
        return: {
            "html":{
                value: (template, dat) => {
                    const imgVal = cardDataManage.getReturnValue('text|url|imagebase', dat, "source", "value");
                    const cropVal = cardDataManage.getReturnValue('text', dat, "crop_position", "value") ?? null;
                    if (imgVal) {
                        const imgHtml = document.createElement('img');
                        imgHtml.src = imgVal;
                        imgHtml.style.marginTop = '2px';
                        imgHtml.style.borderRadius = '5px';
                        if (cropVal) {
                            const cropSplits = cropVal.split(' ');
                            const cropWidth = cropSplits[0] ?? "100%";
                            const cropHeight = cropSplits[1] ?? "auto"
                            const cropCntX = cropSplits[2] ?? "center";
                            const cropCntY = cropSplits[3] ?? "40%";
                            imgHtml.style.objectFit = "cover";
                            imgHtml.style.width = cropWidth;
                            imgHtml.style.height = cropHeight;
                            imgHtml.style.objectPosition = `${cropCntX} ${cropCntY}`;
                        }

                        return imgHtml;
                    }
                    return null;
                }
            },
            "block":{

            }
        }
    },
    {
        key: ["embed", "iframe"],
        icon: () => "iframe",
        value: [
            {
                name: "Source",
                refName: "source",
                type: "url|text"
            }
        ],
        return: {
            "html":{
                value: (template, dat) => {
                    const urlVal = cardDataManage.getReturnValue('url|text', dat, "source", "value");
                    if (urlVal) {
                        const iframeHtml = document.createElement('iframe');
                        iframeHtml.src = urlVal;
                        iframeHtml.style.width = '100%';
                        iframeHtml.style.height = 'auto';
                        iframeHtml.style.border = 'none';
                        iframeHtml.style.borderRadius = '10px';
                        iframeHtml.style.marginTop = '2px';
                        iframeHtml.style.position = 'relative';
                        const openButton = document.createElement('span');
                        openButton.classList.add('icon', 'material-symbols-outlined');
                        openButton.textContent = 'open_in_new';
                        openButton.style.position = 'absolute';
                        openButton.style.top = '5px';
                        openButton.style.right = '5px';
                        openButton.style.backgroundColor = setColorOpacity('#ffffff', 0.75);
                        openButton.style.borderRadius = '50%';
                        openButton.style.padding = '2px';
                        openButton.style.cursor = 'pointer';
                        openButton.addEventListener('click', ev => {
                            ev.stopPropagation();
                            window.open(urlVal, '_blank');
                        });
                        return iframeHtml;
                    }
                    return null;
                }
            },
            "block":{
            }
        }
    },
    {
        key: ["html-block"],
        icon: () => "html",
        value: [
            {
                name: "HTML",
                refName: "html_block",
                type: "html|text",
                initialValue: () => {
                    return {
                        key: "text",
                        value: "<HTML Block>"
                    }
                }
            },
            {
                name: "Full Width",
                refName: "full_width",
                type: "boolean|text",
                initialValue: () => {
                    return {
                        key: "boolean",
                        value: true
                    }
                },
                isOmittable: true
            }
        ],
        return: {
            "html": {
                value: (template, dat) => {
                    const result = cardDataManage.getReturnValue('html|text', dat, "html_block", "value");
                    const isLimitedWidth = cardDataManage.getReturnValue('text', dat, "full_width", "value");
                    const htmlResult = document.createElement('div');
                    htmlResult.innerHTML = result;
                    if (isLimitedWidth === true || isLimitedWidth === "true") {
                        htmlResult.firstChild.style.width = "100%";
                    }
                  
                    console.log(htmlResult.innerHTML, htmlResult, htmlResult.firstChild);
                    return htmlResult;
                }
            },
            "block": {

            }
        }
    },
    {
        key: ["code-block"],
        icon: () => "code",
        value: [
            {
                name: "Code",
                refName: "code",
                initialValue: () => {
                    return {
                        key: "text",
                        value: "<Code>"
                    }
                },
                type: "text"
            },
            {
                name: "Language",
                refName: "language",
                type: "text",
                initialValue: () => {
                    return {
                        key: "text",
                        value: "javascript"
                    }
                },
                isOmittable: true
            }/*,
            {
                name: "Prism Theme Link",
                refName: "prism_theme_link",
                type: "text",
                initialValue: () => {
                    return {
                        key: "text",
                        value: "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css"
                    }
                },
                isOmittable: true
            }*/
        ],
        return: {
            "html": {
                value: (templatem, dat) => {
                    const code = cardDataManage.getReturnValue('text', dat, "code", "value") ?? "Empty Code.";
                    const language = cardDataManage.getReturnValue('text', dat, "language", "value")?.toLowerCase() ?? "javascript";
                    /*const theme = cardDataManage.getReturnValue('text', dat, "prism_theme_link", "value")?.toLowerCase() ?? "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css";

                    const themeLink = document.getElementById('prism-theme');
                    //const customizedTheme = `https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/${theme}`;
                    themeLink.href = theme;*/

                    const newCodeBlockHtml = document.createElement("pre");
                    const codeElement = document.createElement("code");
                    codeElement.classList.add(`language-${language}`);
                    codeElement.textContent = code;
                    newCodeBlockHtml.appendChild(codeElement);
                    newCodeBlockHtml.dataset.language = language;
                    newCodeBlockHtml.classList.add('inline-value-display-codeblock');
                    Prism.highlightElement(codeElement);
                    return newCodeBlockHtml;
                }
            },
            "block": {

            }
        }
    },
    {
        key: ["qr-code"],
        icon: () => "qr_code",
        value: [
            {
                name: "Content",
                refName: "content",
                type: "text"
            }
        ],
        return: {
            "html": {
                value: (template, dat) => {
                    const value = cardDataManage.getReturnValue("text", dat, "content", "value") ?? "<Empty Content>";
                    const qrBlock = document.createElement('div');
                    qrBlock.style.width = "100%";
                    qrBlock.style.padding = "7px";
                    qrBlock.style.marginTop = "2px";
                    qrBlock.style.border = "#d6d6d6 1px solid";
                    qrBlock.style.borderRadius = "5px";
                    new QRCode(qrBlock, {
                        text: value,
                        colorDark: "#373737ff",
                        colorLight: "#ffffff",
                        correctLevel: QRCode.CorrectLevel.H
                    });
                    //Url display text
                    if (typeof value === 'string' && value.includes("://")) {
                        const urlDisplay = elementTemplates.find(et => et.key.includes("url"))?.return.html.value(template, dat);
                        if (urlDisplay) {
                            qrBlock.appendChild(urlDisplay);
                            urlDisplay.style.backgroundColor = "transparent";
                            urlDisplay.style.border = "#d6d6d6 1px solid !important";
                            urlDisplay.style.borderRadius = "5px";
                        }
                    }
                    else {

                    }
                    /*const htmlDisplay = cardDataManage.getReturnValue("html", dat, "content", "value") ?? null;
                    if (htmlDisplay) {
                        qrBlock.appendChild(htmlDisplay);
                    }
                    else{

                    }*/
                    return qrBlock;
                }
            },
            "block": {

            }
        }
    },
    //DIVIDER / SEPARATOR น่าสนนะ แต่น่าจะไปรวมกับ Section ดีกว่า
    {
        key: ["url"],
        icon: () => "link",
        value: [
            {
                name: "Link",
                refName: "link",
                type: "text"
            }
        ],
        return: {
            "html": {
                value: (template, dat) => {
                    const linkVal = cardDataManage.getReturnValue('text', dat, "*", "value");
                    if (linkVal) {
                        const linkHtml = document.createElement('span');
                        linkHtml.classList.add('inline-value-display-url-area');
                        const innerURLText = document.createElement('span');
                        innerURLText.classList.add('inline-value-display-url');
                        innerURLText.textContent = linkVal;
                        linkHtml.appendChild(innerURLText);
                        const btnCopy = document.createElement('span');
                        btnCopy.classList.add('icon', 'material-symbols-outlined', 'btn-inline-small-normal');
                        btnCopy.textContent = 'content_copy';
                        btnCopy.title = 'Copy to Clipboard';
                        btnCopy.addEventListener('click', ev => {
                            ev.stopPropagation();
                            navigator.clipboard.writeText(linkVal)
                                .then(() => console.log('Text copied successfully!'))
                                    .catch(err => console.error('Failed to copy text: ', err));
                            btnCopy.textContent = 'check';
                            setTimeout(() => {
                                btnCopy.textContent = 'content_copy';
                            }, 1000);
                        });
                        linkHtml.appendChild(btnCopy);
                        const btnOpen = document.createElement('span');
                        btnOpen.classList.add('icon', 'material-symbols-outlined', 'btn-inline-small-normal');
                        btnOpen.textContent = 'language';
                        btnOpen.title = 'Open Link in New Tab';
                        btnOpen.addEventListener('click', ev => {
                            ev.stopPropagation();
                            window.open(linkVal, '_blank');
                        });
                        linkHtml.appendChild(btnOpen);
                        return linkHtml;
                    }
                }
            },
            "block": {

            },
            "text": {
                value: (template, dat) => {
                    const linkVal = cardDataManage.getReturnValue('text', dat, "link", "value");
                    return linkVal ? linkVal : null;
                }
            }
        }
    },
    {
        key: ["ambiguous"],
        icon: () => "indeterminate_question_box",
        value: [
            {
                name: "Content",
                refName: "content",
                type: "html|text"
            }
        ],
        return: {
            "html": {
                value: (template, dat) => {
                    var contentHtml = cardDataManage.getReturnValue("html|text", dat, "content", "value");
                    if (typeof contentHtml === 'string') {
                        const newStringHtml = document.createElement('div');
                        newStringHtml.classList.add('txt-description');
                        newStringHtml.textContent = contentHtml;
                        contentHtml = newStringHtml;
                    }
                    if (contentHtml instanceof Node) {
                        contentHtml.style.border = '#c3c3c3 1px solid !important';;
                        contentHtml.style.color = '#c3c3c3';
                    }
                    return contentHtml;
                }
            },
            "block": {

            }
        }
    },
    {
        key: ["checklist"],
        icon: () => "checklist",
        return: {
            "html": {

            },
            "block": {

            },
            "text": {
                
            },
            "array": {
                
            }
        }
    },
    //Supplementaries
    {
        key: ['status'],
        icon: () => "circle",
        value: [
            {
                name: "Card Status",
                refName: "status",
                type: "cardstatus|text",
                initialValue: () => {
                   return {
                    key: "cardstatus",
                    value: "Considered"
                   }
                },
            }
        ],
        return: {
            "html": {
                value: (template, dat) => {
                    const statusHtmlArea = document.createElement('div');
                    statusHtmlArea.style.position = 'relative';
                    statusHtmlArea.style.display = 'flex';
                    statusHtmlArea.style.flexDirection = 'row';
                    statusHtmlArea.style.justifyItems = 'flex-start';
                    statusHtmlArea.style.alignItems = 'flex-start';
                    statusHtmlArea.style.gap = '4px';
                    statusHtmlArea.style.height = 'fit-content';
                    statusHtmlArea.style.padding = '5px';
                    statusHtmlArea.style.marginTop = "2px";
                    statusHtmlArea.style.borderRadius = '10px';
                    statusHtmlArea.style.overflow = 'hidden';
                    const datValue = cardDataManage.getReturnValue("cardstatus|text|html", dat, "status", "value");
                    const exactValueToEdit = cardDataManage.getReturnValue('cardstatus|text|html', dat, "status", "$");
                    var currentStatus = null;
                    if (typeof datValue === 'string') {
                        currentStatus = datValue;
                        const statusStringHtml = document.createElement('div');
                    }
                    if (currentStatus) {
                        const refStatus = defaultCardStatus.find(ds => ds.status === currentStatus);
                        if (refStatus) {
                            //Status Icon
                            const elStatusIconHolder = document.createElement('div');
                            elStatusIconHolder.classList.add('area-horizontal', 'area-center', 'element-flex-child-preserve', 'area-fit');
                            elStatusIconHolder.style.padding = '4px';
                            elStatusIconHolder.style.borderRadius = '10px';
                            elStatusIconHolder.style.backgroundColor = setColorPart(refStatus.color, null, null, null, 100);
                            elStatusIconHolder.style.boxShadow = 'var(--shadow-med)';
                            const elStatusIcon = document.createElement('span');
                            elStatusIcon.classList.add('icon', 'material-symbols-outlined');
                            elStatusIcon.textContent = refStatus.icon;
                            elStatusIcon.style.color = 'white';
                            elStatusIcon.style.fontSize = '15px';
                            elStatusIcon.style.textShadow = 'var(--shadow-med)';
                            elStatusIconHolder.appendChild(elStatusIcon);
                            statusHtmlArea.appendChild(elStatusIconHolder);

                            //Quick Buttons
                            if (refStatus.quickButtons) {
                                refStatus.quickButtons.forEach(qb => {
                                    const elQBHolder = document.createElement('div');
                                    elQBHolder.classList.add('area-horizontal', 'area-center', 'element-flex-child-preserve', 'area-fit');
                                    elQBHolder.style.padding = '4px';
                                    elQBHolder.style.borderRadius = '10px';
                                    elQBHolder.style.backgroundColor = setColorPart(refStatus.color, null, null, null, 20);
                                    elQBHolder.style.border = `${setColorPart(refStatus.color, null, null, null, 100)} 1px solid`;
                                    elQBHolder.style.cursor = 'pointer';
                                    elQBHolder.style.zIndex = '1';
                                    elQBHolder.addEventListener('click', ev => {
                                        ev.stopPropagation();
                                        if (exactValueToEdit) {
                                            cardDataManage.appendData(exactValueToEdit, qb.setStatus ?? defaultCardStatus[0].status);
                                            const parentCard = cardDataManage.getCardContainingData(exactValueToEdit);
                                            if (parentCard)
                                                localData.uploadCard(parentCard);
                                            forceRenderOpeningPage();
                                        }
                                    });
                                    const elQBIcon = document.createElement('span');
                                    elQBIcon.classList.add('icon', 'material-symbols-outlined');
                                    elQBIcon.textContent = qb.icon;
                                    elQBIcon.style.color = setColorPart(refStatus.color, null, null, null, 100);
                                    elQBIcon.style.fontSize = '15px';
                                    elQBIcon.style.textShadow = 'var(--shadow-min)';
                                    elQBHolder.appendChild(elQBIcon);
                                    statusHtmlArea.appendChild(elQBHolder);
                                });
                            }

                            //Separator
                            const separator = document.createElement('div');
                            separator.style.borderLeft = `${setColorPart("000000", null, null, null, 15)} 1.25px solid`;
                            separator.style.width = 0;
                            separator.style.height = '14px';
                            statusHtmlArea.appendChild(separator);

                            //Status Text
                            const statusText = document.createElement('div');
                            statusText.textContent = refStatus.status;
                            statusText.style.fontWeight = '700';
                            statusText.style.color = setColorPart(refStatus.color, null, null, null, 100);
                            statusText.style.textShadow = 'var(--shadow-min)';
                            statusText.style.marginLeft = '2px';
                            statusHtmlArea.appendChild(statusText);

                            //Floating Icons
                            const floatingIconCount = Math.max(Math.round(Math.random() * 20), 5);
                            const sideExtensionWidthPercent = 7;
                            for (var i = 0; i < floatingIconCount; i++) {
                                const elFloatIcon = document.createElement('span');
                                elFloatIcon.classList.add('icon', 'material-symbols-outlined');
                                elFloatIcon.textContent = refStatus.icon;
                                elFloatIcon.style.color = setColorPart(refStatus.color, null, null, null, 10);
                                elFloatIcon.style.position = 'absolute';
                                elFloatIcon.style.left = `${(Math.random() * (100 + sideExtensionWidthPercent * 2)) - sideExtensionWidthPercent}%`;
                                elFloatIcon.style.top = `${(Math.random() * (100 + sideExtensionWidthPercent * 2)) - sideExtensionWidthPercent}%`;
                                elFloatIcon.style.transform = `rotate(${Math.random() * 360}deg) scale(${0.75 + Math.random() * 1})`;
                                statusHtmlArea.insertBefore(elFloatIcon, statusHtmlArea.firstChild);
                            }

                            //Colorings
                            statusHtmlArea.style.backgroundColor = setColorPart(refStatus.color, null, null, null, 12);
                            statusHtmlArea.style.border = `${setColorPart(refStatus.color, null, null, null, 85)} 1.25px solid`;
                            
                        }
                    }
                    return statusHtmlArea;
                }
            },
            "block": {

            }
        }
    },
    //Fundamental Values
    {
        key: ["text"],
        icon: () => "abc",
        return: {
            "text": {
                value: (template, dat) => dat.value,
                editor:(valueTemplate, valueObject) => {
                    const textEditorHolder = document.createElement('span');
                    const textEditor = document.createElement('span');
                    textEditor.contentEditable = valueTemplate.isEditable !== false;
                    textEditor.role = 'textbox';
                    textEditor.classList.add('editor', 'input-text-minimum');
                    //console.log("0000000000000000000000000000Text displays: ", valueObject, valueObject?.value)
                    textEditor.textContent = valueObject?.value ?? "undefined";
                    textEditor.addEventListener('input', ev => {
                        valueObject.value = ev.target.textContent;
                    });
                    textEditor.addEventListener('keydown', ev => {
                        if (ev.key === 'Enter') {
                            ev.preventDefault();
                            ev.target.blur();
                        }
                    });
                    textEditorHolder.appendChild(textEditor);
                    return textEditorHolder;
                }
            }
        }
    },
    {
        key: ['boolean'],
        icon: () => "rule",
        value: [
            {
                refName: "$",
                initialValue: () => {
                    return {
                        key: "boolean",
                        value: true
                    }
                }    
            }
        ],
        return: {
            "boolean": {
                value: (template, dat) => dat.value,
                editor: (template, dat) => {
                    const boolCheckArea = document.createElement("span");
                    boolCheckArea.classList.add("editor", "inline-value-editor-bool");
                    const boolCheckSymbol = document.createElement('span');
                    boolCheckSymbol.classList.add('icon', 'material-symbols-outlined', 'inline-value-editor-bool-mark');
                    boolCheckArea.appendChild(boolCheckSymbol);
                    const boolValueTxt = document.createElement('span');
                    boolValueTxt.classList.add('editor', 'inline-value-editor-bool-valtext');
                    boolCheckArea.appendChild(boolValueTxt);
                    boolCheckArea.dataset.isChecked = dat.value;
                    boolValueTxt.textContent = dat.value.toString().toUpperCase();
                    boolCheckSymbol.textContent = boolCheckArea.dataset.isChecked === 'true' ? 'check' : 'close';
                    boolCheckArea.addEventListener('click', () => {
                        dat.value = !dat.value;
                        boolCheckArea.dataset.isChecked = dat.value;
                        boolValueTxt.textContent = dat.value.toString().toUpperCase();
                        boolCheckSymbol.textContent = boolCheckArea.dataset.isChecked === 'true' ? 'check' : 'close';
                    });
                    return boolCheckArea;
                },
                represent: ["text"]
            }
        }
    },
    {
        key: ["set"],
        icon: () => "data_array",
        value: [
            {
                refName: "$",
                initialValue: () => {
                    return {
                        key: "set",
                        value: []
                    }
                }
            }
        ],
        return: {
            "set": {
                value: (template, dat) => dat.value,
                editor: (template, dat, options) => {
                    const acceptedValueType = options?.innerValueType ?? "*";
                    const setFieldHtml = document.createElement('span');
                    setFieldHtml.classList.add('editor', 'inline-value-editor-set');
                    if (dat.value && dat.value.length > 0) {
                        dat.value.forEach((val, idx) => {
                            const valTemplate = elementTemplates.find(et => et.key.includes(val.key));
                            if (!valTemplate) return;
                            const valEditor = cardEditor.createEditor(setFieldHtml, val.key, dat.value, valTemplate, val);
                        });
                    }
                    const setValueInput = cardEditor.createInputCarret(setFieldHtml, dat.value, acceptedValueType, {
                        inline: true, 
                        additive: true,
                        forceDataToBeValue: true,
                        innerValueType: acceptedValueType
                    });
                    return setFieldHtml;
                }
            },
            "text": {
                value: (template, dat) => {
                    if (dat.value && Array.isArray(dat.value)) {
                        return "[" + dat.value.map(v => {
                            const txtVal = cardDataManage.getReturnValue("text", v, "*", "value");
                            return (txtVal !== undefined) ? txtVal : undefined;
                        }).filter(f => cardDataManage.isMatter(f)).join(", ") + "]";
                    }
                    else {
                        return "[]"
                    }
                }
            }
        }
    },
    {
        key: ["cardtype"],
        icon: () => "token",
        return: {
            "cardtype": {
                value: (template, dat) => dat.value,
                editor: (template, dat) => {
                    /*if (dat && dat.value) {
                        const parentUIDs = hyperflatArray(cardDataManage.getBlocks(cardDataManage.getCardContainingData(dat), "parent")?.map(pt => cardDataManage.getReturnValue("text", pt, "parent", "value")), {renderValues: true, excludedNulls: true});
                    }*/
                    return cardDataObjectEditor.getEditor_Enum(majorCardTypes.map(t => {return {text: t.type, icon: t.icon, prefixIcon: t.icon};}), template, {target: dat, vp: "value"}, "circle", "arrow_drop_down_circle");
                },
                represent: ["text"]
            }
        }
    },
    {
        key: ["cardstatus"],
        icon: () => "circle",
        return: {
            "cardstatus": {
                value: (template, dat) => dat.value,
                editor: (template, dat) => {
                    return cardDataObjectEditor.getEditor_Enum(defaultCardStatus.map(ds => {return {text: ds.status, icon: ds.icon, prefixIcon: ds.icon};}), template, {target: dat, vp: "value"}, "circle");
                },
                represent: ['text']
            }
        }
    },
    {
        key: ["refer"],
        icon: () => {
            var result = "graph_";
            const graphNumber = 7;
            result += (Math.floor(Math.random() * graphNumber) + 1);
            return result;
        },
        return: {
            "refer": {
                value: (template, dat) => {

                },
                editor: (template, dat) => {
                    const referAreaHtml = document.createElement('span');
                    referAreaHtml.classList.add('inline-value-display-refer-area');
                    if (template) {
                        const referIcon = document.createElement('span');
                        referIcon.classList.add('icon', 'material-symbols-outlined');
                        referIcon.textContent = template.icon();
                        referAreaHtml.appendChild(referIcon);
                    }
                    const referTxtArea = document.createElement('span');
                    referTxtArea.classList.add('input-inline-display-refer');
                    referTxtArea.role = 'textbox';
                    referTxtArea.contentEditable = true;
                    referAreaHtml.appendChild(referTxtArea);
                    return referAreaHtml;
                },
                represent: ["text"]
            }
        }
    },
    {
        key: ['style'],
        icon: () => "format_paint",
        value: [
            {
                refName: "$",
                initialValue: () => {
                    return {
                        key: "style",
                        value: {
                            styleName: "icon",
                            styleValue: {
                                key: "text",
                                value: "token"
                            }
                        }
                    }
                }
            }
        ],
        return: {
            "style": {
                value: (template, dat) => {
                    const styleName = dat?.value?.styleName ?? "";
                    const styleValue = cardDataManage.getReturnValue("text", dat?.value?.styleValue, "*", "value") ?? "";
                    return `${styleName}: ${styleValue}`;
                },
                editor: (template, dat) => {
                    const styleName = dat?.value?.styleName ?? "";
                    const styleValue = cardDataManage.getReturnValue("text", dat?.value?.styleValue, "*", "value") ?? "";
                    const styleTemplate = cardStyleList.find(sl => sl.styleName === styleName);

                    const styleAreaHtml = document.createElement('span');
                    styleAreaHtml.classList.add('inline-value-editor-style-area');
                    const styleIconHtml = document.createElement('span');
                    styleIconHtml.classList.add('icon', 'material-symbols-outlined', 'inline-value-editor-style-icon');
                    styleIconHtml.textContent = styleTemplate?.icon ?? "format_paint";
                    styleAreaHtml.appendChild(styleIconHtml);
                    const styleDomainAreaHtml = cardDataObjectEditor.getEditor_Enum(cardStyleList.map(ds => {return {text: ds.styleName, icon: ds.icon, prefixIcon: ds.icon};}), template, {target: dat.value, vp: "styleName"}, "circle");
                    styleDomainAreaHtml.classList.add('inline-value-editor-style-domain');
                    styleAreaHtml.appendChild(styleDomainAreaHtml);
                    //console.log("Rendering********", dat.value, dat.value.styleValue);
                    if (dat.value && dat.value.styleValue) {
                        const valElementTemplate = elementTemplates.find(f => f.key.includes(dat.value.styleValue.key));
                        if (valElementTemplate) {
                            //console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^", dat.value.styleValue, dat.value.styleValue.value, dat.value.styleValue.key)
                            const valueValueEditor = cardEditor.createEditor(styleAreaHtml, dat.value.styleValue.key, dat.value, valElementTemplate, dat.value.styleValue, {vp: "styleValue"});
                        }
                    }
                    const innerCaret = cardEditor.createInputCarret(styleAreaHtml, dat.value, "text", {inline: true, innerValueType: "text", vp: "styleValue"});
                    cardEditor.checkInlineCaretVisibility(styleAreaHtml);

                    
                    /* if (valElementTemplate) {
                            //Value > Value Editor
                            const valueValueEditor = createEditor(newValueEditor, valueTemplate.type, valueDat, valElementTemplate, valueDat.value);
                        }
                        //Value > Caret to select inner values
                        const innerCaret = createInputCarret(newValueEditor, valueDat, valueTemplate.type, {inline: true, innerValueType: valueTemplate.type});
                        checkInlineCaretVisibility(newValueEditor);*/
                    //const styleValueHtml = elementTemplates.find(et => et.key.includes('text'))?.return?.text?.editor(template, dat.value.styleValue);
                    return styleAreaHtml;
                },
                represent: ["text"]
            }
        }
    }
];

const cardStyleList = [
    {
        styleName: "title-prefix",
        icon: "abc",
        valueType: "text"
    },
    {
        styleName: "icon",
        icon: "nest_farsight_eco",
        valueType: "text"
    }
]

export function getModalCardCreation(cardDataArray = null) {
    const cardCreationWindowName = "Card Creation";
    const modal = createModalWindow(cardCreationWindowName);
    modal.classList.add("modal-card-creation");
    modal.style.maxWidth = '80%';
    modal.querySelector(".btn-modal-close").addEventListener('click', () => {
        //console.log("Saving a card: ", JSON.stringify(cardDataArray), userData.sheetID);
        localData.appendLocalCard(cardDataArray);
        localData.uploadCard(cardDataArray);
        forceRenderOpeningPage();
    });

    if (!cardDataArray) cardDataArray = [];
    cardDataManage.validateData(cardDataArray);
    cardEditor.renderExistingBlocks(modal, cardDataArray);
    cardEditor.createInputCarret(modal, cardDataArray, "html");
}