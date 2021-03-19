/**
 * Functions that handle the resizing of the lateral menu on different screens
 * @param {boolean} isMenuOpened
 */
function resizeMenuPanel(isMenuOpened) {
    if (!isMenuOpened) {
        document.getElementById("menu-container").classList.remove("width-25");
        document.getElementById("menu-container").classList.add("width-0");
    } else {
        document.getElementById("menu-container").classList.remove("width-0");
        document.getElementById("menu-container").classList.add("width-25");
    }
}

/**
 * Functions that changes the number format in "k", "M" notation
 * example 1000 -> 1k
 * @param {number} number
 * @returns
 */
function transformNumberFormat(number) {
    let steps = [
        { value: 1, symbol: "" },
        { value: 1e3, symbol: "k" },
        { value: 1e6, symbol: "M" },
        { value: 1e9, symbol: "G" },
        { value: 1e12, symbol: "T" },
        { value: 1e15, symbol: "P" },
        { value: 1e18, symbol: "E" },
    ];

    let regularExpression = /\.0+$|(\.[0-9]*[1-9])0+$/;
    let i;
    for (i = steps.length - 1; i > 0; i--) {
        if (number >= steps[i].value) {
            break;
        }
    }
    return (number / steps[i].value).toFixed(2).replace(regularExpression, "$1") + steps[i].symbol;
}
