export function createTextHeader(text) {
    const elHeader = document.createElement('div');
    elHeader.classList.add('txt-header')
    elHeader.textContent = text;
    return elHeader;
}

export function createIconizedTextHeader(icon, text) {
    const holder = document.createElement('div');
    holder.classList.add('area-horizontal', 'area-fit-horizontal');

    const ii = document.createElement('span');
    ii.classList.add('material-symbols-outlined', 'icon', 'txt-header');
    ii.style.fontWeight = '550';
    ii.style.fontSize = '1.4em';
    ii.textContent = icon;
    holder.appendChild(ii);

    const header = createTextHeader(text);
    holder.appendChild(header);

    return holder;
}

export function createTextDescription(text) {
    const elDescription = document.createElement('div');
    elDescription.classList.add('txt-header-description');
    elDescription.textContent = text;
    elDescription.style.marginTop = '-2px';
    elDescription.style.marginBottom = '7px';
    elDescription.style.maxWidth = '90%';
    return elDescription;
}

export function createIconizedButton(icon, text, action) {
    const btn = document.createElement('button');
    btn.classList.add('btn-normal', 'area-horizontal', 'area-center');

    const ii = document.createElement('span');
    ii.classList.add('material-symbols-outlined', 'icon', 'txt-header');
    ii.style.fontWeight = '550';
    ii.style.fontSize = '1.4em';
    ii.textContent = icon;
    btn.appendChild(ii);

    const txt = document.createElement('div');
    txt.classList.add('txt-header');
    txt.textContent = text;
    btn.appendChild(txt);

    if (action) {
        btn.onclick = action;
    }

    return btn;
}