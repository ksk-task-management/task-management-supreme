export function makeAction_ButtonSwitch(button, action, actionStoredDataName, buttonStateCount){
    if (!button || !action || !actionStoredDataName || buttonStateCount <= 0) {
        console.error("[#] makeAction_ButtonSwitch: Missing required parameters.");
        return;
    }

    button.dataset[actionStoredDataName] = 0;
    button.onclick = () => {
        const currentButtonState = ((parseInt(button.dataset[actionStoredDataName]) + 1) % buttonStateCount) || 0;
        button.dataset[actionStoredDataName] = currentButtonState;
        action(currentButtonState);
    };
}