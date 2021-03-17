(function () {
    "use strict";

    function handleError(error) {
        console.log(error);  //Log the error.
        throw error;
    }

    // reloading angula module
    let main = angular.module("main");

    // creating the service
    main.service("countryService", countryService);

    // dependencies of country service
    countryService.$inject = ["$state", "dataService"];

    /** Function that handle the requests */
    function countryService($state, dataService) {

        let countryService = this;
        let selectedCountry = "Italy";

        dataService.totMigrByOriginDest.then(function (data) {
            countryService.selectedCountryInwardMigrData = data.filter(countryData => 
                countryData["Destination"]==selectedCountry);
            console.log("data ", countryService.selectedCountryInwardMigrData)
        }).catch(handleError);

        
        dataService.totPopulationByAgeSex.then(function (data) {
            countryService.selectedCountryTotPopulationData = data.filter(countryData => 
                countryData["Destination"]==selectedCountry);
            console.log("data 2 ", countryService.selectedCountryTotPopulationData)
        }).catch(handleError);

    }
})();
