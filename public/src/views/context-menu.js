import { isExceedingViewport, isPartiallyInViewport } from "../utils/helpers";

export var activeMenu = null;
/**
 * @param {This is the array of the object consist of icon, text} menuItems 
*/
export function createMenu(callerHtml, menuItems, options = null) {
    //Default settings
    if (activeMenu) {
        activeMenu.classList.remove('horizontal');
    }

    const clearCaller = options?.clearCaller ?? false;
    const menuDirection = options?.direction ?? "vertical";
    const forcedWidth = options?.forcedWidth ?? false;
    const alignItems = options?.alignItems ?? false;
    const firstSelected = options?.firstSelected ?? true;

    if (!activeMenu) {
        activeMenu = document.createElement('div');
        activeMenu.classList.add('editor', 'context-menu', 'glassmorphism');
        activeMenu.contentEditable = false;
        document.addEventListener('click', ev => {
            if (activeMenu && !activeMenu.contains(ev.target) && activeMenu.style.visibility === 'visible') {
                activeMenu.style.visibility = 'hidden';
            }
        });
        console.log('Create the menu', activeMenu);
         /*document.addEventListener('click', (ev) => {
            if (contextMenu && !contextMenu.contains(ev.target as Node) && contextMenu.style.visibility === 'visible') {
                contextMenu.style.visibility = 'hidden';
            }
        });*/
    }

    if (activeMenu) {
        activeMenu.classList.add(menuDirection);
    }
    
    if (!menuItems || menuItems.length <= 0) {
        console.log("made menu hidden");
        activeMenu.style.visibility = 'hidden';
    }
    else {
        console.log("Called the menu");
        activeMenu.style.visibility = 'visible';
        activeMenu.innerHTML = '';
        menuItems = menuItems.sort((a, b) => (b.score || 0) - (a.score || 0));
        menuItems.forEach((item, index) => {
            console.log("I ", item);
            const newItem = document.createElement('div');
            newItem.classList.add('area-horizontal', 'area-fit-horizontal', 'editor', 'btn-context-menu-item');
            if (forcedWidth) newItem.style.width = forcedWidth;
            if (alignItems) newItem.style.justifyItems = alignItems;
            if (firstSelected && index === 0) {
                newItem.classList.add('selected');
            }
            if (item.icon) {
                const newItemIcon = document.createElement('span');
                newItemIcon.classList.add('material-symbols-outlined', 'icon');
                newItemIcon.textContent = item.icon;
                newItem.appendChild(newItemIcon);
            }

            if (item.text) {
                const newItemtext = document.createElement('span');
                newItemtext.innerHTML = item.text;
                newItem.appendChild(newItemtext);
            }

            if (item.textParts) {
                const textPartArea = document.createElement('span');
                textPartArea.classList.add('area-horizontal', 'area-fit-horizontal', 'area-center');
                item.textParts.forEach(part => {
                    const partSpan = document.createElement('span');
                    if (part.text) {
                        partSpan.textContent = part.text;
                    }

                    if (part.highlightColor) {
                        partSpan.style.color = part.highlightColor;
                        partSpan.classList.add('txt-highlighted');
                    }
                    textPartArea.appendChild(partSpan);
                });
                newItem.appendChild(textPartArea);
            }

            if (item.color) {
                newItem.querySelectorAll('span').forEach(s => s.style.color = item.color);
            }

            if (item.fontSize) {
                newItem.querySelectorAll('span').forEach(s => s.style.fontSize = item.fontSize);
            }

            if (item.onClick) {
                newItem.addEventListener('click', ev => {
                    item.onClick();
                    if (clearCaller && callerHtml) {
                        var editableContent = callerHtml;
                        while (editableContent.contentEditable !== true && editableContent.children.length > 0) {
                            editableContent = editableContent.children[0];
                        }
                        if (editableContent.contentEditable) {
                            editableContent.textContent = '';
                        }
                    }

                    if (item.closeMenuAfterClicked !== false)
                        closeMenu();
                    ev.stopPropagation();
                });
            }

            activeMenu.appendChild(newItem);
        });
    }
    console.log(activeMenu);
    activeMenu.dataset.currentSelected = 0;
    adjustMenuPosition(callerHtml);
    return activeMenu;
}

export function closeMenu() {
    if (!activeMenu) return;
    activeMenu.style.visibility = 'hidden';
    document.getElementById('main-container').appendChild(activeMenu);
}

export function scrollSelection(amount) {
    if (!activeMenu)
        return;

    var currentSelected = activeMenu.dataset.currentSelected ? parseInt(activeMenu.dataset.currentSelected) : 0;
    activeMenu.children[currentSelected].classList.remove("selected");
    currentSelected += -amount;
    if (currentSelected < 0) {
        currentSelected = activeMenu.children.length - 1;
    }
    else if (currentSelected > activeMenu.children.length - 1){
        currentSelected %= activeMenu.children.length;
    }
    activeMenu.children[currentSelected].classList.add("selected");
    activeMenu.dataset.currentSelected = currentSelected;
}

export function getSelectedItemHtml() {
    if (activeMenu && activeMenu.dataset.currentSelected) {
        return activeMenu.children[parseInt(activeMenu.dataset.currentSelected)];
    }
    return null;
}

export function adjustMenuPosition(parentHtml) {
    parentHtml.appendChild(activeMenu);

    /*if (activeMenu) {
        const parentBound = parentHtml.getBoundingClientRect();
        const menuBound = activeMenu.getBoundingClientRect();
        parentHtml.appendChild(activeMenu);
        activeMenu.style.left = `${parentHtml.offsetLeft}px`;
        activeMenu.style.top = `-${menuBound.height}px`;
        /*activeMenu.style.left = parentBound.left + 'px';
        activeMenu.style.top = (parentBound.top + parentBound.height) + 'px';
        const elementBound = activeMenu.getBoundingClientRect();
        if (isPartiallyInViewport(elementBound)) {
            activeMenu.style.top = (parentBound.top - elementBound.height) + 'px';
        }/
    }*/
}

export function adjustCustomPosition(parentHtml, left, top, width, height) {
    parentHtml.appendChild(activeMenu);
    //const parentBound = parentHtml.getBoundingClientRect();
   // activeMenu.style.left = `${left - parentBound.left}px`

    /*if (activeMenu) {
        const parentBound = parentHtml.getBoundingClientRect();
        const menuBound = activeMenu.getBoundingClientRect();
        parentHtml.appendChild(activeMenu);
        activeMenu.style.left = `${left-parentBound.left}px`;
        activeMenu.style.top = `-${menuBound.height}px`;
        /*console.log("Custom Adjusting: ", left, top, width, height);
        activeMenu.style.left = left + 'px';
        activeMenu.style.top = (top + height) + 'px';
        const elementBound = activeMenu.getBoundingClientRect();
        if (isPartiallyInViewport(elementBound)) {
            activeMenu.style.top = (top - elementBound.height) + 'px';
        }*
    }*/
}

export function generateMatchedTextParts(original, comparator) {
    var textParts = [];
                var pracT0 = original.split('');
                var pracT1 = comparator.split('');
                var cur0 = pracT0.shift();
                var cur1 = pracT1.shift();
                while (cur0) {
                    if (cur1) {
                        var addMode = cur0 === cur1;
                        if (textParts.length > 0 && textParts[textParts.length - 1].addMode === addMode) {
                            textParts[textParts.length - 1].text += cur0;
                        }
                        else {
                            textParts.push({
                                text: cur0,
                                addMode: addMode
                            });
                        }
                    }
                    
                    if (addMode) {
                        cur1 = pracT1.shift();
                        if (!cur1 && pracT0.length > 0) {
                            textParts.push({
                                text: pracT0.join('')
                            });
                            break;
                        }
                    }
                    cur0 = pracT0.shift();
                }
    return textParts;
}

export function bindEventDefaultKeys(targetHtml, keydownCallback = null) {
    targetHtml.addEventListener('keydown', ev => {
        if (ev.key === 'ArrowUp') {
            scrollSelection(1);
            ev.preventDefault();
        }
        else if (ev.key === 'ArrowDown') {
            scrollSelection(-1);
            ev.preventDefault();
        }
        else if (ev.key === 'Enter') {
            var currentInputState = 0;
            if (targetHtml.tagName === 'INPUT') {
                currentInputState = ev.target.value.length;
            }
            else {
                currentInputState = ev.target.textContent.length;
            }
            //console.log(targetHtml.tagName, currentInputState);
            if (currentInputState > 0) {
                const selectedItem = getSelectedItemHtml();
                if (selectedItem) {
                    selectedItem.click();
                    ev.preventDefault();
                }
            }
        }

        if (keydownCallback) {
            keydownCallback();
        }
    });
    
}