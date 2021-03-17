(function () {
    "use strict";

    // reloading angula module
    let main = angular.module("main");

    // creating the service
    main.service("dataService", dataService);

    /** Function that handle the requests */

    dataService.$inject = ["$state"];
    function dataService($state) {
        // getting the service instance
        let data_service = this;

        data_service.loadCsv = (filePath) => {
            return d3
                .csv(filePath, (data) => {
                    return data;
                })
                .catch((error) =>
                    alert("Couldn't load dataset: " + error)
                );
        };

        
        data_service.secondaryMenuSelectedValue = "";

        // load data from all csv files
        data_service.countriesClassByRegion = data_service.loadCsv(
            countries_classes_by_region
        );
        data_service.totMigrByOriginDest = data_service.loadCsv(
            total_migrants_by_origin_and_destination
        );
        data_service.maleMigrByOriginDest = data_service.loadCsv(
            male_migrants_by_origin_and_destination
        );
        data_service.femaleMigrByOriginDest = data_service.loadCsv(
            female_migrants_by_origin_and_destination
        );
        data_service.estimatedRefugees = data_service.loadCsv(
            estimated_refugees
        );
        data_service.totMigrByAgeSex = data_service.loadCsv(
            total_migrants_by_age_and_sex
        );
        data_service.totPopulationByAgeSex = data_service.loadCsv(
            total_population_by_age_and_sex
        );
        data_service.migrAsPercOfPopulationAgeSex = data_service.loadCsv(
            migrants_as_percentage_of_total_population_by_age_and_sex
        );
        data_service.migrPercDistributionAgeSex = data_service.loadCsv(
            migrants_percentage_distribution_by_age_and_sex
        );


        // variable that defines the ticks of the slider
        data_service.sliderYears = [
            { value: 1, legend: "1990" },
            { value: 2, legend: "1995" },
            { value: 3, legend: "2000" },
            { value: 4, legend: "2005" },
            { value: 5, legend: "2010" },
            { value: 6, legend: "2015" },
            { value: 7, legend: "2019" },
        ];

        // Variable that defines the genre buttons in the filter menu
        data_service.genreButtons = [
            { value: "menu-male", text: "Male" },
            { value: "menu-female", text: "Female" },
            { value: "menu-all", text: "All" },
        ];

        // Variable that defines the region buttons in the filter menu
        data_service.regionButtons = [
            { value: "menu-continent", text: "Continent" },
            { value: "menu-region", text: "Region" },
            { value: "menu-country", text: "Country" },
        ];

        // variable that defines the menu buttons
        data_service.menuButtons = [
            { value: "world", text: "World" },
            { value: "country", text: "Country" },
            { value: "compare", text: "Compare" },
        ];

        // variable that holds the top five countries with income and outcome migrants
        data_service.topFlags = [
            {
                name: "Italy",
                value: "italy",
                path: "../../../sketch/MicrosoftTeams-image_1.png",
            },
            {
                name: "France",
                value: "france",
                path: "../../../sketch/MicrosoftTeams-image_2.png",
            },
            {
                name: "Greece",
                value: "greece",
                path: "../../../sketch/MicrosoftTeams-image_3.png",
            },
            {
                name: "Spain",
                value: "spain",
                path: "../../../sketch/MicrosoftTeams-image_4.png",
            },
            {
                name: "Germany",
                value: "germany",
                path: "../../../sketch/MicrosoftTeams-image_5.png",
            },
        ];

        // variable that holds the types of visualization in the statistics page
        data_service.visualizationTypes = [
            { value: "total_immigrations", text: "Total immigrations" },
            { value: "total_population", text: "Total population" },
            {
                value: "immigration_vs_population",
                text: "Immigration vs. Population",
            },
            { value: "immigration_avg_age", text: "Immigration average age" },
            {
                value: "refugees_vs_immigration",
                text: "Refugees vs. Immigrates",
            },
        ];
        // variable that hold the countries
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

        // variable that defines the country info types buttons
        data_service.countryInfoTypeButtons = [
            { value: "global_rank", text: "Global rank" },
            { value: "value", text: "Value" },
        ];

        /**
         * Function that handles the routing for the secondary menu
         */
        data_service.changePage = () => {
            switch (data_service.secondaryMenuSelectedValue) {
                case "world":
                    $state.go("statistics");
                    break;
                case "country":
                    $state.go("country");
                    break;
                case "compare":
                    $state.go("compare");
                    break;
                default:
                    $state.go("home");
            }
        };
    }
})();
