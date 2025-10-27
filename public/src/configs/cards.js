import { setColorOpacity, generateShortId, setColorPart, hyperflatArray, formatBytes, extractMilliseconds, ColorHSL, getUpperColor } from "../utils/helpers";
import { closeModalByID, createModalWindow } from "../views/modals";
import * as cardEditor from "../views/editors/card-editor";
import * as cardDataObjectEditor from "../views/editors/card-data-obj-editor";
import * as cardDataManage from "./card-data-manage";
import * as localData from "../databases/local-data";
import * as constants from "./constants";
import * as contextMenu from "../views/context-menu";
import * as settings from "../views/editors/view-card-settings";
import { userData } from "../main";
import { appendEvent } from "../events/events";
import { postCloudData } from "../databases/google-sheets";
import { forceRenderOpeningPage, toggleNotification } from "../views/pages";
import { getModalCardEditor } from "../views/editors/view-card-editor";

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
        scoreAdjust: 10,
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
        scoreAdjust: 25,
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
        scoreAdjust: 450,
        progressPercent: 100,
    },
    {
        status: "Final Touch",
        icon: "nest_farsight_heat",
        color: "#1bdabaff",
        progressPercent: 100,
        scoreAdjust: 15, 
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
        scoreAdjust: 75,
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
        isSingular: true,
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
        isSingular: true,
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
                type: "set-html",
                isOmittable: true,
                initialValue: () => {
                    return {
                        key: "set",
                        value: []
                    }
                }
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
        isSingular: true,
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
                value: (template, dat, options) => {
                    const newHtml = document.createElement('div');
                    newHtml.classList.add('area-horizontal');
                    var titleElement = cardDataManage.getReturnValue("text", dat, "title", "value", options) ?? "Untitled";

                    const newStringDisplay = document.createElement('span');
                    newStringDisplay.classList.add('txt-title');
                    newStringDisplay.textContent = titleElement;
                    newHtml.appendChild(newStringDisplay);

                    if (options && options.cardHtml) {
                        const cardColor = getUpperColor(options.cardHtml);
                        const colTitle = new ColorHSL().fromHex(cardColor).modifyL(-65).modifyS(-20);
                        newStringDisplay.style.color = colTitle.getHSLString();
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
        key: ["header"],
        icon: () => "format_h1",
        value: [
            {
                name: "Text",
                refName: "text",
                type: "text",
                initialValue: () => {
                    const descArray = ["This is the header!", "Header time!", "Let's add this header", "A header!"]
                    return {key: "text", value: descArray[Math.floor(Math.random() * descArray.length)]};
                },
            },
            {
                name: "Format",
                refName: "format",
                type: "text",
                isOmittable: true,
                initialValue: () => {
                    return {
                        key: "text",
                        value: "H3"
                    }
                }
            }
        ],
        return: {
            "html": {
                value: (template, dat, options) => {
                    const headerText = cardDataManage.getReturnValue("text", dat, "text", "value") ?? "<Header>";
                    let headerFormat = cardDataManage.getReturnValue("text", dat, "format", "value")?.toLowerCase() ?? "h3";
                    if (headerFormat.trim().length <= 0)
                        headerFormat = "h3";

                    const headerModifiers = [
                        {
                            format: ["h1", "h2", "h3", "h4"],
                            lMod: -65
                        },
                        {
                            format: ["h5"],
                            lMod: -58
                        },
                        {
                            format: ["h6"],
                            lMod: -45
                        }
                    ];

                    const headerHtml = document.createElement("div");
                    headerHtml.classList.add('txt-header', headerFormat);
                    headerHtml.textContent = headerText;
                    const cardColor = options && options.cardHtml ? getUpperColor(options.cardHtml) : "#ffffff";
                    let colHeader = new ColorHSL().fromHex(cardColor).modifyS(-20);
                    if (headerFormat) {
                        const modifier = headerModifiers.find(mod => mod.format.includes(headerFormat.toLowerCase()));
                        if (modifier) {
                            if (modifier.lMod) {
                                colHeader = colHeader.modifyL(modifier.lMod);
                            }
                        }
                    }
                    headerHtml.style.color = colHeader.getHSLString();
                    return headerHtml;
                }
            },
            "block": {

            },
            "text": {
                value: (template, dat) => {
                    var titleElement = cardDataManage.getReturnValue("text", dat, "text", "value") ?? "";
                    return titleElement;
                }
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
                    const descArray = ["Type something!", "Let's explain!", "Provide Info!", "Label me!", "Write that down!", 
                        "Detail it for me!", "Give the rundown!", "Define this!", "What's the meaning?", "Tell me about it!",
                        "Elaborate, please!", "Break it down!", "Need the specifics!",
                        "Input the text!", "Explain the idea!", "Supply the data!", "Identify the subject!"]
                    return {key: "text", value: descArray[Math.floor(Math.random() * descArray.length)]};
                },
            }
        ],
        return: {
            "html": {
                value: (template, dat) => {
                    const newHtml = document.createElement('div');
                    newHtml.classList.add('area-horizontal');
                    var titleElement = cardDataManage.getReturnValue("text", dat, "text", "value");
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
                value: (template, dat) => {
                    var titleElement = cardDataManage.getReturnValue("text", dat, "text", "value") ?? "";
                    return titleElement;
                }
            }
        }
    },/*,
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
    },*/
    {
        key: ["end-date", "deadline"],
        icon: () => "calendar_clock",
        value: [
            {
                name: "Start Date",
                refName: "date_start",
                type: "datetime",
                initialValue: () => {
                    return {
                        key: "datetime",
                        value: new Date().toISOString()
                    }
                },
                isOmittable: true
            },
            {
                name: "End Date",
                refName: "date_end",
                type: "datetime",
                initialValue: () => {
                    return {
                        key: "datetime",
                        value: new Date().toISOString()
                    }
                }
            }
        ],
        return: {
            "html": {
                value: (template, dat, options) => {
                    let colBase = undefined;
                    let colBaseBorder = undefined;
                    if (options && options.cardHtml) {
                        const cardColor = getUpperColor(options.cardHtml);
                        colBase = new ColorHSL().fromHex(cardColor).modifyL(-10).modifyS(-10);
                    }
                    if (colBase) {
                        colBaseBorder = colBase.modifyL(-15).modifyS(-20);
                    }
                    const deadlineAreaHtml = document.createElement('div');
                    deadlineAreaHtml.classList.add('display-block-enddate-area');
                    if (colBase) {
                        deadlineAreaHtml.style.backgroundColor = colBase.getHSLString();
                        deadlineAreaHtml.style.borderColor = colBaseBorder.getHSLString();
                    }

                    let lastReloadTime = undefined;
                    const endDateRenderFunc = () => {
                        deadlineAreaHtml.innerHTML = '';
                        const dateStartString = cardDataManage.getReturnValue('datetime', dat, "date_start", "value") ?? undefined;
                        const dateEndString = cardDataManage.getReturnValue('datetime', dat, "date_end", "value") ?? undefined;
                        const dateStart = dateStartString ? new Date(dateStartString) : undefined;
                        const dateEnd = dateEndString ? new Date(dateEndString) : undefined;

                        const today = new Date();
                        const totalTimeUnits = [];
                        if (dateStart && dateEnd) {
                            if (dateStart > today) {
                                const tTS = extractMilliseconds(dateStart - today);
                                totalTimeUnits.push(tTS);
                            }

                            if (dateEnd > dateStart) {
                                const tSE = extractMilliseconds(dateEnd - (today > dateStart ? today : dateStart));
                                tSE.forEach(tseu => {
                                    tseu.customClass = "tse";
                                });
                                totalTimeUnits.push(tSE);
                            }
                        }
                        else if (dateEnd) {
                            if (dateEnd > today) {
                                const tTE = extractMilliseconds(dateEnd - today);
                                totalTimeUnits.push(tTE);
                            }
                        }

                        
                        if (totalTimeUnits.length > 0) {
                            //Slider
                            const timeSliderHolderHtml = document.createElement('div');
                            timeSliderHolderHtml.classList.add('display-block-enddate-slider');
                            deadlineAreaHtml.appendChild(timeSliderHolderHtml);

                            const timeRemainingHolderHtml = document.createElement('div');
                            timeRemainingHolderHtml.classList.add('display-block-enddate-slider');
                            deadlineAreaHtml.appendChild(timeRemainingHolderHtml);

                            totalTimeUnits.forEach(unitset => {
                                unitset.forEach(unit => {
                                    const timeSliderUnitHtml = document.createElement('div');
                                    timeSliderUnitHtml.classList.add('display-block-enddate-slider-unit');
                                    timeSliderUnitHtml.style.flexGrow = unit.unit.value * Math.ceil(unit.value);
                                    timeSliderHolderHtml.appendChild(timeSliderUnitHtml);

                                    if (unit.customClass) {
                                        timeSliderUnitHtml.classList.add(unit.customClass.toLowerCase());
                                    }

                                    const perUnitRatio = Math.min(1, unit.value);
                                    const timeSliderUnitPercentHtml = document.createElement('div');
                                    timeSliderUnitPercentHtml.classList.add('percent-fill');
                                    timeSliderUnitPercentHtml.style.width = `${perUnitRatio * 100}%`;
                                    timeSliderUnitHtml.appendChild(timeSliderUnitPercentHtml);

                                    if (colBase) {
                                        const colUnitBG = colBase.modifyL(-10).modifyS(-5);
                                        timeSliderUnitHtml.style.backgroundColor = colUnitBG.getHSLString();
                                        timeSliderUnitHtml.style.borderColor = colUnitBG.modifyL(-20).modifyS(-20).getHSLString();
                                        timeSliderUnitPercentHtml.style.backgroundColor = colBase.modifyL(5).getHSLString();                                    
                                    }
                                });

                                //Time Remains
                                const conjoinedUnits = [];
                                let totalUnitRatio = 0;
                                unitset.forEach(unit => {
                                    totalUnitRatio += unit.value * unit.unit.value;
                                    if (conjoinedUnits.length > 0 && conjoinedUnits[conjoinedUnits.length - 1].unit.name === unit.unit.name) {
                                        conjoinedUnits[conjoinedUnits.length - 1].value += unit.value;
                                    }
                                    else {
                                        conjoinedUnits.push(unit);
                                    }
                                });
                                const timeRemainUnitHtml = document.createElement('div');
                                timeRemainUnitHtml.classList.add('display-block-enddate-slider-unit', 'remain-time');
                                timeRemainUnitHtml.style.flexGrow = totalUnitRatio;
                                timeRemainingHolderHtml.appendChild(timeRemainUnitHtml);

                                if (colBase) {
                                    const colUnitBG = colBase.modifyL(-20).modifyS(-25);
                                    timeRemainUnitHtml.style.backgroundColor = colUnitBG.getHSLString();
                                    timeRemainUnitHtml.style.borderColor = colUnitBG.modifyL(-10).modifyS(-10).getHSLString();
                                }

                                conjoinedUnits.forEach((unit, idx) => {
                                    const rUHtml = document.createElement('span');
                                    rUHtml.classList.add('display-block-enddate-rt-unit');
                                    const uVal = unit.value - Math.floor(unit.value) > 0 ? (unit.value - Math.floor(unit.value) > 0 ? unit.value.toFixed(1) : unit.value) : unit.value;
                                    rUHtml.textContent = `${uVal}${unit.unit.abbreviation}`;
                                    timeRemainUnitHtml.appendChild(rUHtml);
                                    rUHtml.style.transform = `rotate(${(Math.random() * 2 - 1) * 1}deg)`;

                                    if (colBase) {
                                        let colRUBG = colBase.modifyL(-7).modifyS(-15);
                                        rUHtml.style.borderColor = colRUBG.modifyL(-25).modifyS(-20).getHSLString();
                                        if (idx === 0) {
                                            colRUBG = colRUBG.modifyL(10);
                                        }
                                        rUHtml.style.backgroundColor = colRUBG.getHSLString();
                                    }
                                });
                            });
                        }

                        //Actual deadline
                        const totalDeadlines = [];
                        if (dateStart && dateStart > today) totalDeadlines.push(dateStart);
                        if (dateEnd) totalDeadlines.push(dateEnd);
                        if (totalDeadlines.length > 0) {
                            const deadlineHolderHtml = document.createElement('div');
                            deadlineHolderHtml.classList.add('display-block-enddate-deadline-area');
                            totalDeadlines.forEach(dl => {
                                const deadlineGroupHtml = document.createElement('div');
                                deadlineGroupHtml.classList.add('display-block-enddate-deadline-group');
                                const totalDateItems = [];
                                const dayOfWeek = dl.toLocaleDateString('en-US', { weekday: 'short' });
                                const customColor = constants.dayOfWeekList.find(dow => dow.abbreviation === dayOfWeek)?.colorHex ?? undefined;
                                totalDateItems.push({value: `${dayOfWeek} ${dl.getDate()}`, customColor: customColor});
                                totalDateItems.push({value: `${["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                                                                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][dl.getMonth()]} ${dl.getFullYear()}`});
                                totalDateItems.push({value: `${dl.getHours()}:${dl.getMinutes()}`});
                                totalDateItems.forEach(tdi => {
                                    const tdiHtml = document.createElement('span');
                                    tdiHtml.classList.add('display-block-enddate-deadline-item');
                                    tdiHtml.textContent = tdi.value;
                                    deadlineGroupHtml.appendChild(tdiHtml);

                                    if (tdi.customColor) {
                                        const newColorHSL = new ColorHSL().fromHex(tdi.customColor);
                                        tdiHtml.style.backgroundColor = newColorHSL.getHSLString();

                                        const borderColorHSL = newColorHSL.modifyL(-20);
                                        tdiHtml.style.borderColor = borderColorHSL.getHSLString();

                                        tdiHtml.style.color = 'white';
                                        tdiHtml.style.fontWeight = 'bold';
                                        tdiHtml.style.textShadow = 'var(--shadow-min)'
                                        tdiHtml.style.transform = `rotate(${(Math.random() * 2 - 1) * 0.6}deg)`;
                                    }
                                    else if (colBase) {
                                        const colTDIBG = colBase.modifyL(10);
                                        tdiHtml.style.backgroundColor = colTDIBG.getHSLString();
                                        tdiHtml.style.borderColor = colTDIBG.modifyL(-25).modifyS(-20).getHSLString();
                                    }
                                });
                                deadlineHolderHtml.appendChild(deadlineGroupHtml);
                            });
                            deadlineAreaHtml.appendChild(deadlineHolderHtml);
                        }
                        else {

                        }
                        lastReloadTime = new Date();
                    }
                    endDateRenderFunc();

                    //Hot reload
                    const reloadTimeThreshold = 1000 * 60 * 5;
                    deadlineAreaHtml.addEventListener('mouseenter', ev => {
                        const currentTime = new Date();
                        if (lastReloadTime !== undefined && currentTime - lastReloadTime < reloadTimeThreshold) {
                            return;
                        }
                        ev.preventDefault();
                        ev.stopPropagation();
                        endDateRenderFunc();
                    });

                    return deadlineAreaHtml;
                }
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
                type: "set-*",
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
                type: "set-*",
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
                value: (template, dat, options) => 
                {
                    const arrayContainerHtml = document.createElement('div');
                    arrayContainerHtml.classList.add('display-container');
                    arrayContainerHtml.style.width = '100%';
                    arrayContainerHtml.style.height = 'fit-content';

                    const initialValue = cardDataManage.getReturnValue("html|set-*", dat, "items", "value", options);
                    const setValue = [initialValue];
                    while (setValue.some(v => cardDataManage.isMatter(v) && (v.valueID || Array.isArray(v)))) {
                        const idxNestedArray = setValue.findIndex(v => cardDataManage.isMatter(v) && (v.valueID || Array.isArray(v)));
                        const nestedValue = Array.isArray(setValue[idxNestedArray]) ? setValue[idxNestedArray] : [setValue[idxNestedArray]];
                        const tempResult = [];
                        nestedValue.forEach(nv => {
                            if (!cardDataManage.isMatter(nv))
                                return;
                            const r = cardDataManage.getReturnValue("html|*", nv, "*", "value", options);
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
                        if (!valValue) return;
                        const valContainer = document.createElement('div');
                        valContainer.classList.add('display-block-array-item');
                        arrayContainerHtml.appendChild(valContainer);

                        if (options && options.cardHtml) {
                            const cardColor = getUpperColor(options.cardHtml);
                            const colItemBG = new ColorHSL().fromHex(cardColor);
                            valContainer.style.backgroundColor = colItemBG.getHex();
                            const colItemBorder = colItemBG.modifyL(-20).modifyS(-20);
                            valContainer.style.borderColor = colItemBorder.getHex();
                        }

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
                type: "set-*",
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
                value: (template, dat, options) => {
                    var setValue = cardDataManage.getReturnValue("html|set-*", dat, "items", "value", options);
                    const itemHtmlArray = [];
                    if (setValue && !(setValue instanceof Node)) {
                        if (Array.isArray(setValue)) {
                            const arrayDistTemplate = elementTemplates.find(et => et.key.includes("array"));
                            const arraySatisfy = cardDataManage.checkValueReturnSatisfaction(arrayDistTemplate, "html");
                            if (arraySatisfy && arraySatisfy.length > 0) {
                                setValue = arraySatisfy[0].value(arrayDistTemplate, dat, options) ?? null;
                            }
                        }
                    }

                    const candidateParents = [];
                    if (setValue && setValue instanceof Node) {
                        const unclearedEntry = [setValue];
                        while (unclearedEntry.some(u => Array.isArray(u) || u.classList.contains('display-container'))) {
                            const containerIdx = unclearedEntry.findIndex(u => Array.isArray(u) || u.classList.contains('display-container'));
                            const newItems = [];
                            if (Array.isArray(unclearedEntry[containerIdx])) {
                                unclearedEntry[containerIdx].forEach(i => {
                                    newItems.push(i);
                                });
                            }
                            else if (unclearedEntry[containerIdx] instanceof Node) {
                                unclearedEntry[containerIdx].childNodes.forEach(i => {
                                    newItems.push(i);
                                });
                                candidateParents.push(unclearedEntry[containerIdx]);
                            }
                            unclearedEntry.splice(containerIdx, 1, ...newItems).forEach(el => {
                                el.remove();
                            });
                        }

                        unclearedEntry.forEach(i => {
                            if (i instanceof HTMLElement) {
                                itemHtmlArray.push(i);
                            }
                        });
                    }

                    if (itemHtmlArray.length > 0){
                        itemHtmlArray.forEach((ve, idx) => {
                            if (ve.classList.contains('item-bare')) {
                                return;
                            }

                            const numBadge = document.createElement('span');
                            numBadge.classList.add('display-block-numberedlist-numbadge', );
                            numBadge.textContent = (idx + 1).toString();
                            ve.prepend(numBadge);

                            if (options && options.cardHtml) {
                                const cardColor = getUpperColor(options.cardHtml);
                                const colNumBadgeBG = new ColorHSL().fromHex(cardColor).modifyL(-52);
                                numBadge.style.backgroundColor = colNumBadgeBG.getHSLString();
                            }
                        });
                    }
                    return setValue;
                }
            },
            "block": {
            },
            "set": {
                value: (template, dat) => cardDataManage.getReturnValue('set-*', dat, 'items', 'value')
            }
        }
    },
    {
        key: ["checklist-entry"],
        icon: () => "checklist",
        value: [
            {
                name: "Items",
                refName: "items",
                type: "set-*",
                initialValue: () => {
                    return {
                        key: "set",
                        value: []
                    }
                }
            },
            {
                name: "Display Only Incomplete Items",
                refName: "display_only_incomplete",
                type: "boolean",
                isOmittable: true,
                initialValue: () => {
                    return {
                        key: "boolean",
                        value: true
                    }
                }
            }
        ],
        return: {
            "html": {
                value: (template, dat, options) => {
                    const itemArray = [cardDataManage.getReturnValue("set-*", dat, "items", "value", options)];
                    //console.log("Test Checklist Set: ", itemArray);
                    const displayOnlyUnfinished = cardDataManage.getReturnValue('boolean', dat, 'display_only_incomplete', "value") ?? true;
                    //Unpack Set/Array
                    let arrayIdx = itemArray.findIndex(ia => Array.isArray(ia) || (ia.value && Array.isArray(ia.value)) || !cardDataManage.isMatter(ia));
                    while (arrayIdx >= 0) {
                        const newItems = [];
                        if (Array.isArray(itemArray[arrayIdx])) {
                            newItems.push(...itemArray[arrayIdx]);
                        }
                        else if (itemArray[arrayIdx].value && Array.isArray(itemArray[arrayIdx].value)) {
                            newItems.push(...itemArray[arrayIdx].value);
                        }
                        itemArray.splice(arrayIdx, 1, ...newItems);
                        arrayIdx =  itemArray.findIndex(ia => Array.isArray(ia) || (ia.value && Array.isArray(ia.value)) || !cardDataManage.isMatter(ia));
                    }

                    const itemToggleFunc = (item) => {
                        if (!item) return;
                        const value = !(item.isComplete === true);
                        if (value) {
                            item.isComplete = true;
                        }
                        else if (item.isComplete) {
                            item.isComplete = false;
                        }
                        const card = cardDataManage.getCardContainingData(dat);
                        if (card) {
                            localData.appendLocalCard(card);
                            localData.saveCloudCard(card);
                            forceRenderOpeningPage();
                        }
                    }

                    const containerHtml = document.createElement('div');
                    containerHtml.classList.add('display-container');
                    containerHtml.style.width = '100%';
                    containerHtml.style.height = 'fit-content';
                    itemArray.forEach(item => {
                        if (!item.key || !item.value || cardDataManage.isBlock(item))
                            return;
                        if (displayOnlyUnfinished && item.isComplete === true) {
                            const checklistCompleteMarkerHtml = document.createElement('div');
                            checklistCompleteMarkerHtml.classList.add('icon', 'material-symbols-outlined', 'display-block-checklist-completeplaceholder', 'item-bare');
                            checklistCompleteMarkerHtml.textContent = 'close';
                            checklistCompleteMarkerHtml.addEventListener('click', ev => {
                                ev.stopPropagation();
                                ev.preventDefault();
                                itemToggleFunc(item);
                            });
                            containerHtml.appendChild(checklistCompleteMarkerHtml);
                            if (options && options.cardHtml) {
                                const cardColor = getUpperColor(options.cardHtml);
                                const colItemCompleteMarker = new ColorHSL().fromHex(cardColor).modifyL(-15).modifyS(-15);
                                checklistCompleteMarkerHtml.style.color = colItemCompleteMarker.getHex();
                            }
                            return;
                        }
                        let itemDisplayHtml = cardDataManage.getReturnValue('html|text', item, null, "value", options) ?? undefined;
                        if (itemDisplayHtml && typeof itemDisplayHtml === 'string') {
                            const stringHtml = document.createElement('span');
                            stringHtml.textContent = itemDisplayHtml;
                            itemDisplayHtml = stringHtml;
                        }
                        if (!cardDataManage.isMatter(itemDisplayHtml))
                            return;

                        const itemHtml = document.createElement('span');
                        itemHtml.classList.add('display-block-array-item');

                        const checkListToggleHtml = document.createElement('span');
                        checkListToggleHtml.classList.add('display-block-checklist-toggle-area');
                        itemHtml.appendChild(checkListToggleHtml);
                        const renderToggleFunc = () => {
                            if (item.isComplete === true) {
                                checkListToggleHtml.classList.add("checked");
                            }
                            else {
                                checkListToggleHtml.classList.remove("checked");
                            }
                        }
                        renderToggleFunc();
                        checkListToggleHtml.addEventListener('click', ev => {
                            ev.stopPropagation();
                            ev.preventDefault();
                            itemToggleFunc(item);
                        });
                        itemHtml.appendChild(itemDisplayHtml);
                        if (options && options.cardHtml) {
                            const cardColor = getUpperColor(options.cardHtml);
                            const colItemBG = new ColorHSL().fromHex(cardColor);
                            itemHtml.style.backgroundColor = colItemBG.getHex();
                            const colItemBorder = colItemBG.modifyL(-20).modifyS(-20);
                            itemHtml.style.borderColor = colItemBorder.getHex();

                            if (!item.isComplete) {
                                checkListToggleHtml.style.backgroundColor = colItemBorder.getHex();
                            }
                        }

                        containerHtml.appendChild(itemHtml);
                    });
                    return containerHtml;
                }
            },
            "block": {

            },
            "set": {
                value: (template, dat) => cardDataManage.getReturnValue("set-*", dat, "items", "value")
            },
            "text": {

            }
        }
    },
    {
        key: ["horizontal-gallery-entry"],
        icon: () => "flex_no_wrap",
        value: [
            {
                name: "Items",
                refName: "items",
                type: "html|set-html"
            }
        ],
        return: {
            "html": {
                value: (template, dat, options) => {
                    let htmlArray = cardDataManage.getReturnValue("html|set-html", dat, "*", "value", options) ?? [];
                    if (!Array.isArray(htmlArray))
                        htmlArray = [htmlArray];
                    htmlArray = htmlArray.map(html => html instanceof HTMLElement ? html : cardDataManage.getReturnValue("html", html, null, "value", options)).filter(el => cardDataManage.isMatter(el));
                    const galleryHtml = document.createElement('div');
                    galleryHtml.classList.add('display-block-list-gallery-horz-holder');

                    const galleryScrollerHtml = document.createElement('div');
                    galleryScrollerHtml.classList.add("display-block-list-gallery-horz");
                    galleryHtml.appendChild(galleryScrollerHtml);

                    htmlArray.forEach(el => {
                        if (!(el instanceof HTMLElement))
                            return;
                        const galleryItemHtml = document.createElement('div');
                        galleryItemHtml.classList.add("display-block-list-gallery-horz-item");
                        if (htmlArray.length > 1) 
                            galleryItemHtml.classList.add("multiple");
                        galleryScrollerHtml.appendChild(galleryItemHtml);
                        el.style.borderColor = 'rgb(197, 197, 197)';
                        el.style.borderWidth = '1.5px';
                        el.style.borderStyle = 'solid';
                        el.style.borderRadius = "5px";
                        galleryItemHtml.appendChild(el);
                    });

                    if (options && options.cardHtml) {
                        const cardColor = getUpperColor(options.cardHtml);
                        const colGalleryBG = new ColorHSL().fromHex(cardColor).modifyL(-6).modifyS(-18);
                        const colGalleryItemBorder = colGalleryBG.modifyL(-25);
                        galleryHtml.style.backgroundColor = colGalleryBG.getHex();
                        galleryScrollerHtml.querySelectorAll('.display-block-img-container')?.forEach(el => {
                            el.style.borderColor = colGalleryItemBorder.getHex();
                        })
                    }

                    let currentIndex = 0;
                    const galleryItemCount = htmlArray.length;
                    if (galleryItemCount > 1) {
                        const scrollButtonArea = document.createElement('div');
                        scrollButtonArea.classList.add("display-block-list-gallery-horz-btn-area");
                        galleryHtml.appendChild(scrollButtonArea);

                        const scrollButtonBackHtml = document.createElement('div');
                        scrollButtonBackHtml.classList.add('icon', 'material-symbols-outlined');
                        scrollButtonBackHtml.textContent = 'arrow_left';
                        scrollButtonBackHtml.addEventListener('click', ev => {
                            ev.preventDefault();
                            ev.stopPropagation();
                            const itemCount = galleryScrollerHtml.children.length;
                            const prevIndex = (currentIndex - 1 + itemCount) % itemCount;
                            const prevItem = galleryScrollerHtml.children[prevIndex];
                            const targetScrollLeft = prevItem.offsetLeft;
                            galleryScrollerHtml.scroll({
                                left: targetScrollLeft,
                                behavior: 'smooth'
                            });
                            currentIndex = prevIndex;
                        });
                        scrollButtonArea.appendChild(scrollButtonBackHtml);

                        const scrollButtonForwardHtml = document.createElement('div');
                        scrollButtonForwardHtml.classList.add('icon', 'material-symbols-outlined');
                        scrollButtonForwardHtml.textContent = 'arrow_right';
                        scrollButtonForwardHtml.addEventListener('click', ev => {
                            ev.preventDefault();
                            ev.stopPropagation();
                            const itemCount = galleryScrollerHtml.children.length;
                            const nextIndex = (currentIndex + 1) % itemCount;
                            const nextItem = galleryScrollerHtml.children[nextIndex];
                            const targetScrollLeft = nextItem.offsetLeft;
                            galleryScrollerHtml.scroll({
                                left: targetScrollLeft,
                                behavior: 'smooth'
                            });
                            currentIndex = nextIndex;
                        });
                        scrollButtonArea.appendChild(scrollButtonForwardHtml);
                    }

                    return galleryHtml;


                    /*const panelHtml = document.createElement('div');
                    panelHtml.classList.add("display-block-panel");
                    htmlArray?.forEach(el => {
                        if (!(el instanceof HTMLElement)) {
                            el = cardDataManage.getReturnValue("html", el, null, "value")
                        }

                        if (el && el instanceof HTMLElement) {
                            panelHtml.appendChild(el);
                        }
                    });*/
                    //return panelHtml;
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
                type: "filebase|text",
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
                    //For GG-drive preview: https://drive.google.com/thumbnail?id=${fileId}&sz=w800
                    let imgVal = cardDataManage.getReturnValue('filebase|text', dat, "source", "value");
                    let fullScreenUrl = imgVal ?? undefined;
                    if (imgVal && imgVal.id && imgVal.url) {
                        fullScreenUrl = imgVal.url;
                        imgVal = `https://drive.google.com/thumbnail?id=${imgVal.id}`;
                    }

                    const cropVal = cardDataManage.getReturnValue('text', dat, "crop_position", "value") ?? null;
                    if (imgVal && imgVal.trim().length > 0) {
                        const imgContainerHtml = document.createElement('div');
                        imgContainerHtml.classList.add("display-block-img-container");

                        const imgHtml = document.createElement('img');
                        imgHtml.classList.add("display-block-image");
                        imgContainerHtml.appendChild(imgHtml);

                        const imgDropEffect = document.createElement("div");
                        imgDropEffect.classList.add("display-block-image-drop");
                        imgContainerHtml.appendChild(imgDropEffect);
                        
                        if (fullScreenUrl) {
                           /* const btnFullScreen = document.createElement('div');
                            btnFullScreen.classList.add('icon', 'material-symbols-outlined', 'display-block-image-btn-fullscreen');
                            btnFullScreen.textContent = "expand_content";
                            imgContainerHtml.appendChild(btnFullScreen);*/
                            imgContainerHtml.style.cursor = "pointer";
                            imgContainerHtml.addEventListener('click', e => {
                                window.open(fullScreenUrl, '_blank', 'noopener');
                                e.stopPropagation();
                                e.preventDefault();
                            });
                        }

                        imgHtml.src = imgVal;
                        //imgContainerHtml.style.marginTop = '2px';
                        //imgContainerHtml.style.borderRadius = '5px';
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
                        else {
                            imgHtml.style.width = "100%";
                            imgHtml.style.height = "auto";
                        }

                        return imgContainerHtml;
                    }
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
        key: ["file-attachments"],
        icon: () => "attach_file",
        value: [
            {
                name: "File",
                refName: "file",
                type: "filebase|set-filebase"
            }
        ],
        return: {
            "html": {
                value: (template, dat, options) => {
                    let fileValues = cardDataManage.getReturnValue("filebase|set-filebase", dat, "*", "value") ?? [];
                    fileValues = Array.isArray(fileValues) ? fileValues?.map(d => d.value ?? undefined).filter(d => cardDataManage.isMatter(d)) : [fileValues];
                    console.log(fileValues);
                    if (fileValues && fileValues.length > 0) {
                        const fileRackHtml = document.createElement('div');
                        fileRackHtml.classList.add('display-block-fileattachments-area');
                        fileValues.forEach(fileValue => {
                            if (cardDataManage.isMatter(fileValue) && fileValue && fileValue.id) {
                                const fileStripHtml = cardDataObjectEditor.getDisplay_AttachedFile(fileValue);
                                if (fileStripHtml) {
                                    fileRackHtml.appendChild(fileStripHtml);
                                }
                            }
                        });
                        if (options && options.cardHtml) {
                            const cardColor = getUpperColor(options.cardHtml);
                            const colRackBG = new ColorHSL().fromHex(cardColor).modifyL(-10).modifyS(-15);
                            fileRackHtml.style.backgroundColor = colRackBG.getHSLString();
                        }
                        return fileRackHtml;
                    }
                }
            },
            "block": {

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
            }
        ],
        return: {
            "html": {
                value: (templatem, dat) => {
                    const code = cardDataManage.getReturnValue('text', dat, "code", "value") ?? "Empty Code.";
                    const language = cardDataManage.getReturnValue('text', dat, "language", "value")?.toLowerCase() ?? "javascript";
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
        key: ["markdown-block"],
        icon: () => "markdown",
        value: [
            {
                name: "Markdown",
                refName: "markdown",
                type: "text",
                initialValue: () => {
                    return {
                        key: "text",
                        value: "**Markdown Content**"
                    }
                }
            }
        ],
        return: {
            "html": {
                value: (template, dat) => {
                    const markdownText = cardDataManage.getReturnValue('text', dat, "markdown", "value") ?? "";
                    const markdownHtml = document.createElement('div');
                    markdownHtml.classList.add('markdown-display');
                    markdownHtml.innerHTML = marked.parse(markdownText);
                    //Apply Prism to code blocks inside markdown
                    const codeBlocks = markdownHtml.querySelectorAll('pre code');
                    codeBlocks.forEach(block => {
                        const language = block.className.match(/language-(\w+)/);
                        if (language) {
                            block.classList.add(`language-${language[1]}`);
                            Prism.highlightElement(block);
                        }
                    });
                    return markdownHtml;
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
                type: "text",
                initialValue: () => {
                    return {
                        type: "text",
                        value: "url text"
                    }
                }
            }
        ],
        return: {
            "html": {
                value: (template, dat) => {
                    const value = cardDataManage.getReturnValue("text", dat, "content", "value") ?? "<Empty Content>";
                    const qrBlock = document.createElement('div');
                    qrBlock.classList.add("display-block-image-qr-area");
                    /*qrBlock.style.width = "100%";
                    qrBlock.style.padding = "7px";
                    qrBlock.style.marginTop = "2px";
                    qrBlock.style.border = "#d6d6d6 1px solid";
                    qrBlock.style.borderRadius = "5px";*/
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
                type: "text",
                initialValue: () => {
                    return {
                        key: "text",
                        value: "https://example.com"
                    }
                }
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
                value: (template, dat, options) => {
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

                    if (options && options.cardHtml) {
                        const cardColor = getUpperColor(options.cardHtml);
                        const colAmb = new ColorHSL().fromHex(cardColor).modifyL(-20).modifyS(-10);
                        contentHtml.style.color = colAmb.getHSLString();
                        contentHtml.style.borderColor = colAmb.getHSLString();
                    }

                    return contentHtml;
                }
            },
            "block": {

            }
        }
    },
    {
        key: ["panel"],
        icon: () => "clarify",
        value: [
            {
                name: "Content",
                refName: "content",
                type: "html|set-html",
                initialValue: () => {
                    return {
                        key: "set",
                        value: []
                    }
                }
            },
            {
                name: "CSS Style",
                refName: "css_style",
                type: "text",
                isOmittable: true,
                initialValue: () => {
                    return {
                        key: "text",
                        value: "padding: 4px"
                    }
                }
            }
        ],
        return: {
            "html": {
                value: (template, dat, options) => {
                    let htmlArray = cardDataManage.getReturnValue("html|set-html", dat, "content", "value", options) ?? [];
                    if (!Array.isArray(htmlArray))
                        htmlArray = [htmlArray];
                    const panelHtml = document.createElement('div');
                    panelHtml.classList.add("display-block-panel");
                    htmlArray?.forEach(el => {
                        if (!(el instanceof HTMLElement)) {
                            el = cardDataManage.getReturnValue("html", el, null, "value", options)
                        }
                        if (el && el instanceof HTMLElement) {
                            panelHtml.appendChild(el);
                        }
                    });

                    const panelStyle = cardDataManage.getReturnValue("text", dat, "css_style", "value");
                    if (panelStyle) {
                        panelHtml.setAttribute('style', (panelHtml.getAttribute('style') ?? "") + panelStyle);
                    }

                    return panelHtml;
                }
            },
            "block": {

            }
        }
    },
    {
        key: ["horizontal-divider"],
        icon: () => "splitscreen_bottom",
        value: [
            {
                name: "Below Text",
                refName: "text_below",
                type: "text",
                initialValue: () => {
                    return {
                        key: "text",
                        value: "Below Text!"
                    }
                },
                isOmittable: true
            },
            {
                name: "Above Text",
                refName: "text_above",
                type: "text",
                initialValue: () => {
                    return {
                        key: "text",
                        value: "Above Text!"
                    }
                },
                isOmittable: true
            },
            {
                name: "Line Style",
                refName: "line_style",
                type: "text",
                initialValue: () => {
                    return {
                        key: "text",
                        value: "dashed"
                    }
                },
                isOmittable: true
            },
            {
                name: "Line Width",
                refName: "line_width",
                type: "text|number",
                initialValue: () => {
                    return {
                        key: "text",
                        value: "2px"
                    }
                },
                isOmittable: true
            },
            {
                name: "Line Color",
                refName: "line_color",
                type: "text|color",
                initialValue: () => {
                    return {
                        key: "text",
                        value: "rgb(219, 219, 219)"
                    }
                },
                isOmittable: true
            }
        ],
        return: {
            "html": {
                value: (template, dat, options) => {
                    const txtAbove = cardDataManage.getReturnValue("text", dat, "text_above", "value") ?? undefined;
                    const txtBelow = cardDataManage.getReturnValue("text", dat, "text_below", "value") ?? undefined;
                    const lineStyle = cardDataManage.getReturnValue("text", dat, "line_style", "value") ?? undefined;
                    const lineWidth = cardDataManage.getReturnValue("text", dat, "line_width", "value") ?? undefined;
                    const lineColor = cardDataManage.getReturnValue("text", dat, "line_color", "value") ?? undefined;

                    let colDividerBase = undefined;
                    if (options && options.cardHtml) {
                        const cardColor = getUpperColor(options.cardHtml);
                        colDividerBase = new ColorHSL().fromHex(cardColor).modifyL(-15).modifyS(-20);
                       // colDividerBase.a = 0.8;
                    }
                    const colDividerTxt = colDividerBase ? colDividerBase.modifyL(-10) : undefined;

                    const horzDividerHtml = document.createElement('div');
                    horzDividerHtml.classList.add('display-block-divider-horz-area');
                    if (txtAbove) {
                        const txtAboveHtml = document.createElement('div');
                        txtAboveHtml.classList.add('display-block-divider-horz-txt');
                        txtAboveHtml.textContent = txtAbove;
                        horzDividerHtml.appendChild(txtAboveHtml);

                        if (colDividerTxt) {
                            txtAboveHtml.style.color = colDividerTxt.getHSLString();
                        }
                    }

                    const horzLineHtml = document.createElement('div');
                    horzLineHtml.classList.add("display-block-divider-horz-line");
                    horzDividerHtml.appendChild(horzLineHtml);
                    const lineStylings = [];
                    if (lineStyle)
                        lineStylings.push(`border-style: ${lineStyle}`);
                    if (lineWidth)
                        lineStylings.push(`border-width: ${lineWidth}`);
                    if (lineColor) {
                        lineStylings.push(`border-color: ${lineColor}`);
                    }
                    else if (colDividerBase) {
                        lineStylings.push(`border-color: ${colDividerBase.getHSLString()}`);
                    }
                    if (lineStylings.length > 0) {
                        horzLineHtml.setAttribute('style', lineStylings.join("; "));
                    }

                    if (txtBelow) {
                        const txtBelowHtml = document.createElement('div');
                        txtBelowHtml.classList.add('display-block-divider-horz-txt');
                        txtBelowHtml.textContent = txtBelow;
                        horzDividerHtml.appendChild(txtBelowHtml);

                        if (colDividerTxt) {
                            txtBelowHtml.style.color = colDividerTxt.getHSLString();
                        }
                    }

                    return horzDividerHtml;
                }
            },
            "block": {

            }
        }
    },
    {
        key: ["incomplete-area"],
        icon: () => "deployed_code_alert",
        value: [
            {
                name: "Text",
                refName: "text",
                type: "text",
                isOmittable: true,
                initialValue: () => {
                    return {
                        key: "text",
                        value: "Information Required"
                    }
                }
            },
            {
                name: "Icon",
                refName: "icon",
                type: "text",
                isOmittable: true,
                initialValue: () => {
                    return {
                        key: "text",
                        value: "extension"
                    }
                }
            },
            {
                name: "Inside Content",
                refName: "inside_content",
                type: "set-html",
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
                value: (template, dat, options) => {
                    let contentArray = cardDataManage.getReturnValue('set-html', dat, "inside_content", "value", options) ?? [];
                    if (!Array.isArray(contentArray))
                        contentArray = [contentArray];
                    contentArray = contentArray.map(html => html instanceof HTMLElement ? html : cardDataManage.getReturnValue("html", html, null, "value", options) ?? undefined).filter(el => cardDataManage.isMatter(el));

                    if (contentArray) {
                        const txtIcon = cardDataManage.getReturnValue("text", dat, "icon", "value") ?? "extension";
                        const txtText = cardDataManage.getReturnValue("text", dat, "text", "value") ?? "Incomplete";

                        const alertHtml = document.createElement('div');
                        alertHtml.classList.add('display-block-areaincomplete');
                        const clickEditFunc = ev => {
                            ev.stopPropagation();
                            ev.preventDefault();
                            const insideArray = cardDataManage.getReturnValue('set-html', dat, "inside_content", "value", options);
                            const modal = getModalCardEditor(insideArray, {bypassValidation: true, isValueArray: true});
                            modal.style.border = "rgb(253, 1, 123) 2px dashed";
                            modal.querySelector('.txt-modal-title').textContent = "Edit Incomplete Area";
                            const btnApplyHtml = modal.querySelector('.btn-card-editor.btn-save');
                            if (btnApplyHtml) {
                                btnApplyHtml.querySelector('.txt').textContent = "Save this Area";
                            }

                            const btnInnerFinishHtml = modal.querySelector('.btn-card-editor.btn-delete');
                            if (btnInnerFinishHtml) {
                                btnInnerFinishHtml.querySelector('.icon').textContent = "check_circle";
                                btnInnerFinishHtml.onclick = () => {
                                    console.log("Area Finished");
                                }
                            }
                        }
                        alertHtml.addEventListener('click', ev => clickEditFunc(ev));

                        const topPanelHtml = document.createElement('div');
                        topPanelHtml.classList.add('display-block-areaincomplete-toparea');
                        alertHtml.appendChild(topPanelHtml);

                        const icnHtml = document.createElement('span');
                        icnHtml.classList.add('icon', 'material-symbols-outlined', 'display-block-areaincomplete-toparea-icon');
                        icnHtml.textContent = txtIcon;
                        topPanelHtml.appendChild(icnHtml);

                        const topTextHtml = document.createElement('span');
                        topTextHtml.classList.add('display-block-areaincomplete-toparea-text');
                        topTextHtml.textContent = txtText;
                        topPanelHtml.appendChild(topTextHtml);

                        const contentHtml = document.createElement('div');
                        contentHtml.classList.add('display-block-areaincomplete-contentarea');
                        alertHtml.appendChild(contentHtml);

                        contentArray.forEach(el => {
                            if (el instanceof HTMLElement) {
                                contentHtml.appendChild(el);
                            }
                        });

                        const bottomPanelHtml = document.createElement('div');
                        bottomPanelHtml.classList.add('display-block-areaincomplete-bottomarea');
                        alertHtml.appendChild(bottomPanelHtml);

                        if (contentArray.length > 0) {
                            const btnCompletionHtml = document.createElement('span');
                            btnCompletionHtml.classList.add('icon', 'material-symbols-outlined', 'display-block-areaincomplete-bottomarea-btn');
                            btnCompletionHtml.textContent = "check_circle";
                            bottomPanelHtml.appendChild(btnCompletionHtml);
                            const completeFunc = ev => {
                                ev.stopPropagation();
                                ev.preventDefault();
                                const card = cardDataManage.getCardContainingData(dat);
                                const insideArray = cardDataManage.getReturnValue('set-html', dat, "inside_content", "value", options) ?? [];
                                if (card) {
                                    let refDat = cardDataManage.getDataReference(card, dat, "$");
                                    if (refDat.parent.value && refDat.parent.value === dat) {
                                        refDat = cardDataManage.getDataReference(card, refDat.parent, "$");
                                    }
                                    if (refDat) {
                                        if (Array.isArray(refDat.parent)) {
                                            const datID = refDat.value["uid"] ? "uid" : "valueID";
                                            const matchIdx = refDat.parent.findIndex(block => block[datID] === refDat.value[datID]);
                                            if (matchIdx >= 0) {
                                                refDat.parent.splice(matchIdx, 1, ...insideArray);
                                            }
                                        }
                                        else {
                                            if (insideArray.length === 1) {
                                                refDat.parent.value = insideArray.shift();
                                            }
                                            else {
                                                if (confirm("The result section will be converted into a panel")) {
                                                    const newPanelBlock = cardDataManage.makeBlock("panel", [{
                                                        refName: "content", 
                                                        value: {
                                                            key: "set",
                                                            value: insideArray
                                                        }
                                                    }]);
                                                    refDat.parent.value = cardDataManage.makeValue("panel", newPanelBlock);
                                                }
                                            }
                                        }
                                        localData.appendLocalCard(card);
                                        localData.saveCloudCard(card);
                                        forceRenderOpeningPage();
                                    }
                                }
                            }
                            btnCompletionHtml.addEventListener('click', ev => completeFunc(ev));
                        }

                        const btnEditHtml = document.createElement('span');
                        btnEditHtml.classList.add('icon', 'material-symbols-outlined', 'display-block-areaincomplete-bottomarea-btn');
                        btnEditHtml.textContent = "add_circle";
                        bottomPanelHtml.appendChild(btnEditHtml);
                        btnEditHtml.addEventListener('click', ev => {
                            
                            clickEditFunc(ev);
                        });

                        if (options && options.cardHtml) {
                            const cardColor = getUpperColor(options.cardHtml);
                            const colTxtBG = new ColorHSL().fromHex(cardColor);
                            topPanelHtml.style.backgroundColor = colTxtBG.getHSLString();
                            bottomPanelHtml.style.backgroundColor = colTxtBG.getHSLString();
                        }

                        return alertHtml;
                    }
                }
            },
            "block": {

            }
        }
    },
    //Supplementaries
    {
        key: ['status'],
        icon: () => "circle",
        isSingular: true,
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
                                                localData.saveCloudCard(parentCard);
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
                            const valEditor = cardEditor.createEditor(setFieldHtml, val.key, dat.value, valTemplate, val, {
                                dataSlot: dat,
                                dataSlotType: acceptedValueType
                            });
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
        key: ["filebase"],
        icon: () => "attach_file",
        return: {
            "filebase": {
                value: (template, dat) => dat.value,
                editor: (template, dat) => {
                    const fileAreaHtml = document.createElement('span');
                    fileAreaHtml.classList.add('inline-value-display-filebase-area');

                    //Extension
                    const fileExtensionHtml = document.createElement('span');
                    fileExtensionHtml.classList.add('inline-value-display-filebase-ext');
                    fileAreaHtml.appendChild(fileExtensionHtml);

                    //Main Data Area
                    const fileDataHolderHtml = document.createElement('span');
                    fileDataHolderHtml.classList.add('inline-value-display-filebase-dataholder');
                    fileAreaHtml.appendChild(fileDataHolderHtml);

                    const fileTitleHtml = document.createElement('span');
                    fileTitleHtml.classList.add('inline-value-display-filebase-title');
                    fileDataHolderHtml.appendChild(fileTitleHtml);

                    const fileSizeHtml = document.createElement('span');
                    fileSizeHtml.classList.add('inline-value-display-filebase-size');
                    fileDataHolderHtml.appendChild(fileSizeHtml);

                    //Edit Button
                    const editButtonHtml = document.createElement('span');
                    editButtonHtml.classList.add('icon', 'material-symbols-outlined', 'inline-value-display-filebase-btn-attach');
                    editButtonHtml.textContent = "attach_file";
                    fileDataHolderHtml.appendChild(editButtonHtml);

                    const renderFileFunction = (fileDat) => {
                        const fileColor = fileDataTemplateList.find(ft => ft.extension?.includes(fileDat?.extension?.toLowerCase() ?? "<?>"))?.color ?? undefined;
                        const fileColorStyle = fileColor ? `background-color: ${fileColor};` : "";
                        fileAreaHtml.setAttribute('style', `${fileColorStyle}`);
                        fileAreaHtml.dataset.extension = fileDat?.extension.toUpperCase() ?? "?";
                        fileTitleHtml.textContent = fileDat?.name ?? "";
                        fileSizeHtml.textContent = fileDat?.size ? formatBytes(fileDat.size) : "-- Bytes";

                        if (fileDat && fileDat.url) {
                            fileTitleHtml.onclick = (e) => {
                                window.open(fileDat.url, '_blank', 'noopener');
                                e.stopPropagation();
                                e.preventDefault();
                            }
                        }
                    }
                    renderFileFunction(dat.value);

                    //File Attach Behavior
                    editButtonHtml.addEventListener('click', ev => {
                        ev.stopPropagation();
                        const cloudFolderIDs = (settings.getSettingModuleValue("ONLINE_STORAGE_FOLDER_ID") ?? []).map(f => f.folderID).join(", ");
                        if (cloudFolderIDs.trim().length <= 0) {
                            alert("No Cloud Storage Folder is set. Please set up a cloud storage folder first.");
                            settings.getModalSettings();
                            return;
                        }
                        
                        const fileEditorModal = createModalWindow("File Attachment");

                        //Drag Drop Attach Area
                        const dragAndDropArea = document.createElement('div');
                        dragAndDropArea.classList.add('inline-value-editor-filebase-modal-draganddrop');
                        dragAndDropArea.textContent = "Drag and drop file here...";
                        fileEditorModal.appendChild(dragAndDropArea);

                        const lowerToolbarArea = document.createElement('div');
                        lowerToolbarArea.classList.add('inline-value-editor-filebase-modal-lwtb');
                        fileEditorModal.appendChild(lowerToolbarArea);

                        //Input-paste field
                        const btnFilePaste = document.createElement('div');
                        btnFilePaste.classList.add('inline-value-editor-filebase-modal-btn-label-filesearch');
                        lowerToolbarArea.appendChild(btnFilePaste);
                        const icnFilePaste = document.createElement('span');
                        icnFilePaste.classList.add("icon", "material-symbols-outlined");
                        icnFilePaste.textContent = "content_paste";
                        btnFilePaste.appendChild(icnFilePaste);
                        /*const filePasteInput = document.createElement('input');
                        filePasteInput.classList.add("inline-value-editor-filebase-modal-inputpaste");
                        filePasteInput.type = "text";
                        filePasteInput.placeholder = ": Text/Image/Drive File ID....";
                        lowerToolbarArea.appendChild(filePasteInput);*/

                        //Input - Select File <Manually>
                        const selFileLabel = document.createElement('label');
                        selFileLabel.for = "input-file-select";
                        selFileLabel.classList.add("inline-value-editor-filebase-modal-btn-label-filesearch");
                        lowerToolbarArea.appendChild(selFileLabel);
                        const icnFileAdd = document.createElement('span');
                        icnFileAdd.classList.add("icon", "material-symbols-outlined");
                        icnFileAdd.textContent = "add";
                        selFileLabel.appendChild(icnFileAdd);

                        //Button: Upload File
                        let attachedLocalFile = undefined;
                        const btnUploadFileHtml = document.createElement('button');
                        btnUploadFileHtml.classList.add("btn-normal", "btn-primary", "area-fill-horizontal", "btn-stack", "hidden");
                        btnUploadFileHtml.textContent = "Upload File";
                        fileEditorModal.appendChild(btnUploadFileHtml);

                        //Function: Render Local File
                        //Pseudo-attached file
                        let uploadedFileHtml = undefined;
                        let uploadedFileEditorHtml = undefined;
                        let attachedLocalFileHtml = undefined;
                        const renderAttachedFileFunc = () => {
                            uploadedFileHtml?.remove();
                            uploadedFileEditorHtml?.remove();
                            attachedLocalFileHtml?.remove();
                            if (dat.value) {
                                console.log("Have file uploaded", dat.value);
                                uploadedFileHtml = cardDataObjectEditor.getDisplay_AttachedFile(dat.value);
                                if (uploadedFileHtml) {
                                    fileEditorModal.insertBefore(uploadedFileHtml, lowerToolbarArea);

                                    //Editor Zone
                                    uploadedFileEditorHtml = document.createElement('div');
                                    uploadedFileEditorHtml.classList.add("display-block-file-editorarea");
                                    fileEditorModal.insertBefore(uploadedFileEditorHtml, lowerToolbarArea);

                                    //Button: Rename
                                    if (dat.value.id) {
                                        const btnFileRename = document.createElement('div');
                                        btnFileRename.classList.add("icon", "material-symbols-outlined", "btn-file-editor");
                                        btnFileRename.textContent = "edit";
                                        uploadedFileEditorHtml.appendChild(btnFileRename);
                                    }

                                    //Button: Download
                                    if (dat.value.downloadUrl) {
                                        const btnFileDownload = document.createElement('div');
                                        btnFileDownload.classList.add("icon", "material-symbols-outlined", "btn-file-editor");
                                        btnFileDownload.textContent = "download";
                                        uploadedFileEditorHtml.appendChild(btnFileDownload);
                                        btnFileDownload.addEventListener('click', ev => {
                                            window.open(dat.value.downloadUrl, '_blank', 'noopener');
                                            ev.preventDefault();
                                            ev.stopPropagation();
                                        });
                                    }

                                    //Button: Delete
                                    if (dat.value.id) {
                                        const btnFileDelete = document.createElement('div');
                                        btnFileDelete.classList.add("icon", "material-symbols-outlined", "btn-file-editor");
                                        btnFileDelete.textContent = "delete_forever";
                                        uploadedFileEditorHtml.appendChild(btnFileDelete);
                                        btnFileDelete.addEventListener('click', ev => {
                                            confirm(`Do you want to put ${dat.value.name} to the Google Drive trash? the file will be there but it will lose the linked reference, so we will not be able to find it again. Technically the file is lost from the system forever`);
                                            appendEvent(`Deleting ${dat.value.name}`, async () => {
                                                 const result = await postCloudData('deleteDriveFile', {fileID: dat.value.id});
                                                toggleNotification(result.status, result.message);
                                                if (result.status === 'success') {
                                                    dat.value = undefined;
                                                    renderAttachedFileFunc();
                                                    renderFileFunction();
                                                }
                                                ev.preventDefault();
                                                ev.stopPropagation();
                                            });
                                        });
                                    }
                                }

                                dragAndDropArea.classList.add('hidden');
                                lowerToolbarArea.classList.add('hidden');
                                btnUploadFileHtml.classList.add('hidden');
                                return;
                            }

                            if (attachedLocalFile) {
                                const fileExtension = attachedLocalFile.name.split('.').pop().toUpperCase();
                                attachedLocalFileHtml = document.createElement('div');
                                attachedLocalFileHtml.classList.add("inline-value-editor-filebase-modal-localfile-strip");
                                attachedLocalFileHtml.innerHTML =  
                                `<div class="inline-value-editor-filebase-modal-localfile-panel">
                                    <div class="inline-value-editor-filebase-modal-localfile-name">${attachedLocalFile.name}</div>
                                    <div class="inline-value-editor-filebase-modal-localfile-dataarea">
                                        <span class="inline-value-editor-filebase-modal-localfile-databubble fileext">${fileExtension}</span>
                                        <span class="inline-value-editor-filebase-modal-localfile-databubble">${formatBytes(attachedLocalFile.size)}</span>
                                        <span style="font-size: 13px; font-weight: bold; color: #ba1457ff">Unuploaded</span>
                                    </div>
                                </div>
                                `;

                                const btnLocalFileRemove = document.createElement('div');
                                btnLocalFileRemove.classList.add('icon', 'material-symbols-outlined', 'inline-value-editor-filebase-modal-localfile-btn-remove');
                                btnLocalFileRemove.textContent = 'close';
                                attachedLocalFileHtml.appendChild(btnLocalFileRemove);
                                btnLocalFileRemove.addEventListener('click', ev => {
                                    attachedLocalFile = undefined;
                                    ev.stopPropagation();
                                    ev.preventDefault();
                                    renderAttachedFileFunc();
                                });

                                fileEditorModal.insertBefore(attachedLocalFileHtml, lowerToolbarArea);
                                dragAndDropArea.classList.add('hidden');
                                lowerToolbarArea.classList.add('hidden');
                                btnUploadFileHtml.classList.remove('hidden');
                                return;
                            }

                            dragAndDropArea.classList.remove('hidden');
                            lowerToolbarArea.classList.remove('hidden');
                            btnUploadFileHtml.classList.add('hidden');
                        }
                        renderAttachedFileFunc();

                        let pastedData = {
                            type: null, // 'text' or 'image'
                            content: null, // string for text / dataUrl for image
                            mimeType: null // 'text/plain' or 'image/png' etc.
                        };
                        const convertPastedContentFunc = () => {
                            if (pastedData) {

                            }
                        }
                        btnFilePaste.addEventListener("click", async ev => {
                            try {
                                // Check if the API is supported
                                if (!navigator.clipboard || !navigator.clipboard.read) {
                                    throw new Error("Clipboard API not supported by this browser.");
                                }

                                const items = await navigator.clipboard.read();

                                for (const item of items) {
                                    // Check for image data first (e.g., image/png, image/jpeg)
                                    const imageType = Array.from(item.types).find(type => type.startsWith('image/'));
                                    if (imageType) {
                                        const blob = await item.getType(imageType);
                                        pastedData.mimeType = imageType;

                                        // Convert Blob to Data URL asynchronously
                                        pastedData.content = await new Promise((resolve, reject) => {
                                            const reader = new FileReader();
                                            reader.onload = (e) => resolve(e.target.result);
                                            reader.onerror = reject;
                                            reader.readAsDataURL(blob);
                                        });

                                        pastedData.type = 'image';
                                        console.log("Pasted: ", pastedData);
                                        //updateUI();
                                        return; // Found image, stop processing
                                    }

                                    // Check for text data
                                    if (item.types.includes('text/plain')) {
                                        const blob = await item.getType('text/plain');
                                        pastedData.content = await blob.text();
                                        pastedData.mimeType = 'text/plain';

                                        if (pastedData.content.trim().length > 0) {
                                            pastedData.type = 'text';
                                            console.log("Pasted: ", pastedData);
                                            //updateUI();
                                            return; // Found text, stop processing
                                        }
                                    }
                                }

                                // If loop completes without finding usable data
                                pastedData.type = 'none';
                                console.log("Pasted: ", pastedData);
                                //updateUI();

                            } catch (err) {
                                console.error("Clipboard Read Error:", err);
                                
                                let message = '❌ Clipboard access failed. ';

                                if (err.name === 'NotAllowedError' || (err.message && (err.message.includes('permission') || err.message.includes('denied')))) {
                                    message = '❌ Permission Denied. Please grant clipboard read permission when prompted by the browser.';
                                } else if (err.message && err.message.includes('supported')) {
                                    message = '❌ Clipboard API not fully supported by this browser.';
                                } else if (!window.isSecureContext) {
                                    message = '❌ Cannot access clipboard directly. This feature requires a Secure Context (HTTPS).';
                                } else {
                                    message += 'Please check your browser settings.';
                                }
                                console.error(message);
                            } 
                        });

                        /*filePasteInput.addEventListener('keydown', ev => {
                            const items = (ev.clipboardData || ev.originalEvent.clipboardData).items;
                            for (let i = 0; i < items.length; i++) {
                                const item = items[i];
                                if (item.type.indexOf('image') !== -1) {
                                    const blob = item.getAsFile();
                                    if (blob) {
                                        const fileName = `pasted_image_${Date.now()}.png`;
                                        const fileWithCustomName = new File([blob], fileName, {
                                            type: blob.type,
                                            lastModified: Date.now()
                                        });
                                        attachedLocalFile = fileWithCustomName;
                                        renderAttachedFileFunc();
                                        return;
                                    }
                                } 
                            }
                            ev.stopPropagation();
                            ev.preventDefault();

                        });*/

                        btnUploadFileHtml.addEventListener('click', ev => {
                            if (!attachedLocalFile)
                                return;
                            const reader = new FileReader();
                            reader.onload = async function(ev) {
                                const fileDataUrl = ev.target.result;
                                const fileExtension = attachedLocalFile.name.split('.').pop().toLowerCase();
                                appendEvent("Uploading file...", async () => {
                                    const uploadResult = await postCloudData('uploadDriveFile', {
                                        folderIDs: cloudFolderIDs,
                                        fileName: attachedLocalFile.name,
                                        fileData: fileDataUrl,
                                        mimeType: attachedLocalFile.type
                                    });

                                    if (uploadResult.status === 'success') {
                                        const fileDat = {
                                            name: uploadResult.data.fileName,
                                            id: uploadResult.data.fileID,
                                            url: uploadResult.data.fileUrl,
                                            downloadUrl: uploadResult.data.fileDownloadUrl,
                                            mimeType: uploadResult.data.fileMimeType,
                                            size: uploadResult.data.fileSize,
                                            extension: fileExtension
                                        };
                                        dat.value = fileDat;
                                        renderFileFunction(fileDat);
                                    }
                                    renderAttachedFileFunc();
                                    //closeModalByID(fileEditorModal.dataset.modalId);
                                });
                            };
                            reader.readAsDataURL(attachedLocalFile);
                            ev.stopPropagation();
                            ev.preventDefault();
                        });

                        //File Input
                        const fileInput = document.createElement('input');
                        fileInput.id = "input-file-select";
                        fileInput.type = 'file';
                        fileInput.multiple = false;
                        fileInput.style.display = "none";
                        fileInput.addEventListener('change', ev => {
                            const file = ev.target.files[0];
                            if (file) {
                                attachedLocalFile = file;
                                renderAttachedFileFunc();
                            }
                        });
                        selFileLabel.appendChild(fileInput);
                    });
                    return fileAreaHtml;
                },
            },
            "text": {
                value: (template, dat) => {
                    if (dat.value) {
                        let result = dat.value.name;
                        if (dat.value.size) {
                            result += ` (${formatBytes(dat.value.size)})`;
                        }
                        return result;
                    }
                    return "No file selected";
                }
            }
        }
    },
    {
        key: ["datetime"],
        icon: () => "date_range",
        return: {
            "datetime": {
                value: (template, dat) => dat.value,
                editor: (template, dat) => {
                    let dateValue = undefined;
                    if (dat.value) {
                        dateValue = new Date(dat.value);
                    }
                    else {
                        dateValue = new Date();
                        dat.value = dateValue.toISOString();
                    }
                    const formatDateForInputFunc = (date) => {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const hours = String(date.getHours()).padStart(2, '0');
                        const minutes = String(date.getMinutes()).padStart(2, '0');
                        return `${year}-${month}-${day}T${hours}:${minutes}`;
                    };

                    const dateAreaHtml = document.createElement('span');
                    dateAreaHtml.classList.add('inline-value-editor-datetime-area');

                    //File Input
                    const fileInput = document.createElement('input');
                    fileInput.classList.add('inline-value-editor-datetime-input');
                    fileInput.id = "input-date-select";
                    fileInput.type = 'datetime-local';
                    fileInput.addEventListener('change', ev => {
                        const date = new Date(ev.target.value);
                        dat.value = date.toISOString();
                    });
                    fileInput.value = formatDateForInputFunc(dateValue);
                    dateAreaHtml.appendChild(fileInput);
                    return dateAreaHtml;
                }
            },
            "text": {
                value: (template, dat) => {
                    let dateValue = undefined;
                    if (dat.value) {
                        dateValue = new Date(dat.value);
                    }
                    else {
                        dateValue = new Date();
                    }
                    if (!dateValue)
                        return "Unknown Date Format";
                    const formatDateForInputFunc = (date) => {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const hours = String(date.getHours()).padStart(2, '0');
                        const minutes = String(date.getMinutes()).padStart(2, '0');
                        return `${day}/${month}/${year} ${hours}:${minutes}`;
                    };
                    return formatDateForInputFunc(dateValue);
                }
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
                            const valueValueEditor = cardEditor.createEditor(styleAreaHtml, dat.value.styleValue.key, dat.value, valElementTemplate, dat.value.styleValue, {
                                vp: "styleValue",
                                dataSlot: dat,
                                dataSlotType: "text"
                            });
                        }
                    }
                   /* styleDomainAreaHtml.querySelector('.editor.input-text-minimum').addEventListener('resize', () => {
                        console.log("Reesized!");
                    })*/ //เดี๋ยวไป set ไว้กับการสร้าง domain editor ด้านบน เปลี่ยนให้เป็น options
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
        valueType: "text",
        initialValue: () => "Prefix"
    },
    {
        styleName: "icon",
        icon: "nest_farsight_eco",
        valueType: "text",
        initialValue: () => "token"
    },
    {
        styleName: "field-blurred",
        icon: "blur_on",
        valueType: "text",
        initialValue: () => "revealable"
    },
    {
        styleName: "base-color",
        icon: "colors",
        valueType: "colorbase|text",
        initialValue: () => "#ffffff"
    }
];

export const fileDataTemplateList = [
    {
        extension: ["pdf"],
        color: "#cc3876ff"
    },
    {
        extension: ["doc", "docx", "docm", "dotx", "dotm", "dot"],
        color: "#3d5fc4ff"
    },
    {
        extension: ["xlsx", "xlsm", "xlsb", "xlt", "xltx", "xltm", "xls"],
        color: "#0f915fff"
    },
    {
        extension: ["xml", "csv"],
        color: "#b15f36ff"
    },
    {
        extension: ["jpg",  "jpeg", "png", "gif", "bmp", "tiff", "tif", "webp", "svg", "heic", "heif"],
        color: "#e2ba1eff"
    },
    {
        extension: ["txt", "goodnote"],
        color: "#bbae8dff"
    }
]