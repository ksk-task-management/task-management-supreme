import { formatBytes } from "../../utils/helpers";
import * as cardTemplate from "../../items/cards";
import * as contextMenu from "../context-menu";

export function getEditor_Enum(dataset, template, target, prefixIcon = null, suffixIcon = null) {
    const enumCardTypeArea = document.createElement('span');
    enumCardTypeArea.classList.add('editor', 'input-enum-area-minimum');
    //Prefix Icon
    var prefixEnumIcon = null;
    if (prefixIcon) {
        prefixEnumIcon = document.createElement('span');
        prefixEnumIcon.classList.add('icon', 'material-symbols-outlined', 'input-enum-area-dropdownselect');
        prefixEnumIcon.textContent = prefixIcon ? prefixIcon : 'arrow_drop_down_circle';
        enumCardTypeArea.appendChild(prefixEnumIcon);
    }
    //Text
    const enumTxtInputCaret = document.createElement('span');
    enumTxtInputCaret.classList.add('editor', 'input-text-minimum');
    enumTxtInputCaret.role = 'textbox';
    enumTxtInputCaret.contentEditable = true;
    enumTxtInputCaret.textContent = target?.target[target?.vp] ?? dataset[0].text;
    if (prefixEnumIcon) {
        prefixEnumIcon.textContent = dataset.find(ds => ds.text === enumTxtInputCaret.textContent)?.prefixIcon ?? dataset[0].prefixIcon;
    }
    const editingEvent = ev => {
        const menuItems = dataset.map(type => {
            const textParts = contextMenu.generateMatchedTextParts(type.text, ev.target.textContent)
            const menuItem = {
                textParts: textParts.map(tp => {
                    const newPart = {text: tp.text};
                    if (tp.addMode === true) {
                        newPart.highlightColor = 'var(--color-selected)';
                    }
                    return newPart;
                }),
                onClick: () => {
                    enumTxtInputCaret.textContent = type.text;
                    target.target[target.vp] = type.text;
                    console.log("Dat Set!!!!", target);
                    if (type.prefixIcon && prefixEnumIcon) {
                        prefixEnumIcon.textContent = type.prefixIcon;
                    }
                    enumTxtInputCaret.blur();
                }
            }
            if (type.icon) {
                menuItem.icon = type.icon;
            }
            const m1 = textParts.filter(p => p.addMode === true).map(p => p.text).join('');
            menuItem.score = m1.length;
            return menuItem;
        });
        contextMenu.createMenu(enumTxtInputCaret, menuItems);
    }
    enumTxtInputCaret.addEventListener('input', ev => {
        target.target[target.vp] = ev.target.textContent;
        editingEvent(ev);
    });
    enumTxtInputCaret.addEventListener('click', ev => {
        ev.stopPropagation();
        editingEvent(ev);
    });
    contextMenu.bindEventDefaultKeys(enumTxtInputCaret);
    /*enumTxtInputCaret.addEventListener('keydown', ev => {
        if (ev.key === 'Enter') {
            ev.preventDefault();
            ev.target.blur();
        }
    });*/
    enumCardTypeArea.appendChild(enumTxtInputCaret);
    //Enum Selector Icon
    if (suffixIcon) {
        const enumSelIcon = document.createElement('span');
        enumSelIcon.classList.add('icon', 'material-symbols-outlined', 'input-enum-area-dropdownselect');
        enumSelIcon.textContent = suffixIcon ? suffixIcon : 'arrow_drop_down_circle';
        enumCardTypeArea.appendChild(enumSelIcon);
    }
    return enumCardTypeArea;
}

export function getDisplay_AttachedFile(fileValue) {
    if (!fileValue) return undefined;
    const fileAreaHtml = document.createElement('div');
    const fileColor = cardTemplate.fileDataTemplateList.find(ft => ft.extension?.includes(fileValue.extension?.toLowerCase() ?? "<?>"))?.color ?? undefined;
    const fileColorStyle = fileColor ? `background-color: ${fileColor};` : "";
    fileAreaHtml.classList.add("display-block-file-strip");
    fileAreaHtml.setAttribute('style', `${fileColorStyle}`);
    fileAreaHtml.innerHTML =  
    `<div class="display-block-file-panel">
        <div class="display-block-file-thumbnail-holder">
            <div class="display-block-file-thumbnail-area">
                <img class="display-block-file-img-thumbnail" src="https://drive.google.com/thumbnail?id=${fileValue.id}"></img>
            </div>
            <span class="display-block-file-databubble fileext" style="${fileColorStyle}">${fileValue.extension}</span>
        </div>
        <div class="display-block-file-mainarea">
            <div class="display-block-file-name">${fileValue.name}</div>
            <div class="display-block-file-dataarea">
                <span class="display-block-file-detailbubble">${formatBytes(fileValue.size)}</span>
            </div>
        </div>
    </div>
    `;

    if (fileValue.url) {
        fileAreaHtml.querySelector(".display-block-file-name")?.addEventListener('click', ev => {
            window.open(fileValue.url, '_blank', 'noopener');
            ev.preventDefault();
            ev.stopPropagation();
        });
    }

    return fileAreaHtml;
}