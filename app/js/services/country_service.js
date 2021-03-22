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
    countryService.$inject = ["$state", "dataService"];

    /** Function that handle the requests */
    function countryService($state, dataService) {
        let country_service = this;

        country_service.getTopInwardCountries = (data, country,
                yearMin, yearMax, top=5) => {
            let jsonFiltered = dataService.filterData(data,
                    country, yearMin, yearMax);

            const allColumns  = Object.keys(jsonFiltered[0]);
            const badColumns  = ["Year", "Destination", "Total", "Other South", "Other North"];

            const goodColumns = allColumns.filter(item => !badColumns.includes(item))

            let jsonCountriesOnly = dataService.filterColumn(jsonFiltered, goodColumns);

            const timespan = jsonCountriesOnly.length;

            let avgImmigrants = []
            
            for (const column of goodColumns) {
                avgImmigrants.push([column, parseFloat((jsonCountriesOnly.reduce((sum, curr) =>
                        sum + +curr[column], 0) / timespan).toFixed(3))]);
            }

            avgImmigrants.sort(function(a,b) {
                if (a[1] < b[1]) return 1;
                return -1;
             });

            const topInwardCountries = avgImmigrants.slice(0, top);

            return dataService.countries.then((data) => {
                let countries = [];

                for (const cInfo of topInwardCountries) {
                    let country = data.find(o => o.name === cInfo[0]);
                    countries.push([country, cInfo[1]]);
                }

                return countries;
            });
        }

        country_service.getTopOutwardCountries = () => {};

        country_service.getTopCountries = (country, yearMin, yearMax, gender, top=5) => {
            return dataService
                    .getOriginAndDestinationByGender(gender)
                    .then((data) => country_service.getTopInwardCountries(data, country, yearMin, yearMax, top));
        };
    }
})();
