(function () {
    "use strict";

    // reloading angula module
    let main = angular.module("main");

    // creating the service
    main.service("countryService", countryService);

    /** Function that handle the requests */
    function countryService() {
        let countryService = this;

        countryService.americanCountries = [];
    }
});
