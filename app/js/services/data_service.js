(function () {
    "use strict";

    // reloading angula module
    let main = angular.module("main");

    // creating the service
    main.service("dataService", dataService);

    /** Function that handle the requests */
    function dataService() {
        // getting the service instance
        let data_service = this;

        data_service.slider_years = [
            { value: 1, legend: "1990" },
            { value: 3, legend: "1995" },
            { value: 5, legend: "2000" },
            { value: 7, legend: "2005" },
            { value: 9, legend: "2010" },
            { value: 9, legend: "2015" },
            { value: 9, legend: "2017" },
        ];

        data_service.countries = [
            // here we have to recover the countries
            { continent: "europe", name: "France" },
            { continent: "europe", name: "Italy" },
            { continent: "europe", name: "Spain" },
            { continent: "europe", name: "Finland" },
            { continent: "europe", name: "Portugal" },
            { continent: "africa", name: "Nigeria" },
            { continent: "africa", name: "Kenya" },
            { continent: "africa", name: "Etiopia" },
            { continent: "africa", name: "marocco" },
            { continent: "africa", name: "Uganda" },
        ];
    }
})();
