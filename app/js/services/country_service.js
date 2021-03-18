(function () {
    "use strict";

    function handleError(error) {
        console.log(error); //Log the error.
        throw error;
    }

    // reloading angula module
    let main = angular.module("main");

    // creating the service
    main.service("countryService", countryService);

    // dependencies of country service
    countryService.$inject = ["$state"];

    /** Function that handle the requests */
    function countryService($state) {
        let country_service = this;
    }
})();
