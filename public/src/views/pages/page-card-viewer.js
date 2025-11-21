import * as cardDisplayer from "../renders/card-displayers";
import * as viewCardEditor from "../editors/view-card-editor";
import * as pages from "../pages";
import * as cardDataManage from "../../configs/card-data-manage";
import * as localData from "../../databases/local-data";

export const cardViewerPage = document.getElementById('page-card-viewer');
const cardHandler = document.getElementById('card-viewer-handler');
// Maximum degree of rotation (sensitivity)
const MAX_ROTATION = 15; // degrees

let openingUID = undefined;
let savedCardJSON = undefined;
let isEdited = false;
export function setupCardViewerPage() {
    document.getElementById('btn-cardviewer-back')?.addEventListener('click', ev => {
        ev.preventDefault();
        ev.stopPropagation();
        pages.gotoPreviousPage(isEdited);
        openingUID = undefined;
        savedCardJSON = undefined;
        isEdited = false;
    });

    document.getElementById('btn-cardviewer-delete')?.addEventListener('click', ev => {
        ev.preventDefault();
        ev.stopPropagation();
        if (openingUID) {
            const matchCard = localData.localCardData.find(card => cardDataManage.getDataUID(card) === openingUID);
            if (matchCard)
                cardDataManage.deleteCard(matchCard);
        }
        pages.gotoPreviousPage();
        openingUID = undefined;
        savedCardJSON = undefined;
        isEdited = false;
    });

    document.getElementById('btn-cardviewer-edit')?.addEventListener('click', ev => {
        ev.stopPropagation();
        ev.preventDefault();
        if (openingUID !== undefined) {
            const matchCard = localData.localCardData.find(card => cardDataManage.getDataUID(card) === openingUID);
            if (matchCard)
                viewCardEditor.getModalCardEditor(matchCard);
        }
    });

    handleCardRotation();
}

export function render(pageObject, options = null) {
    if (!options || !options.card)
        return;

    if (!cardHandler || !cardViewerPage)
        return;
    //cardViewerPage.classList.remove('hidden');

    //console.log(originalCardDataArray);
    //openingCardData = options.card.orgCard;
    openingUID = cardDataManage.getDataUID(options.card.orgCard) ?? undefined;
    if (!openingUID)
        return;
    const matchCard = localData.localCardData.find(card => cardDataManage.getDataUID(card) === openingUID);
    if (!matchCard) {
        pages.gotoPreviousPage();
        return;
    }

    const newCardJSON = JSON.stringify(matchCard);
    if (savedCardJSON !== undefined && newCardJSON !== savedCardJSON) {
        isEdited = true;
    }
    savedCardJSON = newCardJSON;

    const cardHtml = cardDisplayer.displayCard(cardDisplayer.getComputedCard(matchCard));
    cardHandler.innerHTML = '';
    cardHandler.appendChild(cardHtml);
}

function handleCardRotation() {
    cardHandler.addEventListener('mousemove', ev => {
    const rect = cardHandler.getBoundingClientRect();
                
    // Calculate the center coordinates of the card
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

        // Calculate the distance of the mouse from the center of the card
        // offsetX is negative on the left half, positive on the right half
        const offsetX = ev.clientX - centerX;
        // offsetY is negative on the top half, positive on the bottom half
        const offsetY = ev.clientY - centerY;
                
        // Normalize the offset to a value between -1 and 1
        const normalizedX = offsetX / (rect.width / 2);
        const normalizedY = offsetY / (rect.height / 2);

                /*
                 * Calculate the rotation degrees:
                 * - X-axis rotation (rotateX) is controlled by vertical mouse movement (Y offset).
                 * If the mouse is above center (negative Y offset), the card should tilt forward (positive X rotation).
                 * We reverse the Y rotation by multiplying by -1 to get the standard tilt effect.
                 * - Y-axis rotation (rotateY) is controlled by horizontal mouse movement (X offset).
                 * If the mouse is on the right (positive X offset), the card should tilt its right edge back (negative Y rotation).
                 * We reverse the X rotation by multiplying by -1.
                 */
                const rotateX = normalizedY * MAX_ROTATION * -1;
                const rotateY = normalizedX * MAX_ROTATION;
                
                // Apply the transformation
                cardHandler.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

                // Optional: Adjust shadow for a 'light source' effect
                // The light source is implicitly opposite to the rotation.
                // Shadow calculation is simplified for illustrative purposes
                const shadowX = -normalizedX * 10;
                const shadowY = -normalizedY * 10;
                cardHandler.firstChild.style.boxShadow = `
                    ${shadowX}px ${shadowY}px 40px rgba(0, 0, 0, 0.4),
                    0 0 10px rgba(0, 0, 0, 0.1)
                `;
    });
    cardHandler.addEventListener('mouseleave', ev => {
        cardHandler.style.transform = 'rotateX(0deg) rotateY(0deg)';
        cardHandler.firstChild.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.08)';
    });
}
