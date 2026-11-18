
document.addEventListener("DOMContentLoaded", function () {

    const themeSelector = document.getElementById("themeSelector");

    if (!themeSelector) {
        console.error("Theme selector not found!");
        return;
    }

    // Default theme
    document.body.dataset.theme = "burgundy";

    themeSelector.value = "burgundy";

    // Change theme
    themeSelector.addEventListener("change", function () {

        document.body.dataset.theme = this.value;

    });

});
