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

    countryService.$inject = [$state, "dataService"];

    /** Function that handle the requests */
    function countryService() {

        let countryService = this;
        let defaultCountry = "Italy";

        var origDestData;
        var totalPopulationData;

        d3.csv(total_migrants_by_origin_and_destination).then(function (data) {
            origDestData = data;

            var countryInwardMigrData = origDestData.filter(destCountryData => destCountryData["Destination"]==defaultCountry);
            var countryPopulationData = origDestData.filter(destCountryData => destCountryData["Destination"]==defaultCountry);
    
    
            countryInwardMigrData["Total"]
            countryPopulationData["Total_(mf)"]
        }).catch(handleError);
        
        d3.csv(total_population_by_age_and_sex).then(function (data) {
            origDestData = data;
            countryInwardMigrData["Total"]
            countryPopulationData["Total_(mf)"]
           /*  countryService.selectedCountry = defaultCountry;
            countryService.origDestData = data; */
            
        }).catch(handleError);


        d3.csv(total_migrants_by_age_and_sex).then(function (data) {
            origDestData = data;
            countryInwardMigrData["Total"]
            countryPopulationData["Total_(mf)"]
           /*  countryService.selectedCountry = defaultCountry;
            countryService.origDestData = data; */
            
        }).catch(handleError);
    }
})();
