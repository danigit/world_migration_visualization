(function () {
    "use strict";

    //reloading angular module
    let main = angular.module("main");

    //CONTROLLERS
    main.controller("menuController", menuController);

    /**
     * Function that handle the menu interaction
     * @type {string[]}
     */
    menuController.$inject = ["$scope", "$mdSidenav", "dataService"];

    function menuController($scope, $mdSidenav, dataService) {
        $scope.searchSource = "";
        $scope.searchDestination = "";
        $scope.genreFilterValue = "menu-male";
        $scope.regionFilterValue = "menu-continent";
        $scope.countries = dataService.countries;
        $scope.selectedCountries = {
            source: [],
            destination: [],
        };
        $scope.isSideMenuOpened = true;

        $scope.slider = {
            min: 1,
            max: 7,
            options: {
                floor: 0,
                ceil: 6,
                showTicksValues: true,
                stepsArray: dataService.slider_years,
            },
        };

        /**
         * Function that handles the click on the genre radio group filter in the menu
         * @param {string} value
         */
        $scope.handleGenreClick = function (value) {
            $scope.genreFilterValue = value;
        };

        /**
         * Function that handles the click on the region radio group filter in the menu
         * @param {string} value
         */
        $scope.handleRegionClick = function (value) {
            $scope.regionFilterValue = value;
            console.log($scope.selectedCountries);
        };

        /**
         * Function that open and close the menu
         */
        $scope.toggleMenu = () => {
            $scope.isSideMenuOpened = $scope.isSideMenuOpened ? false : true;
            resizeMenuPanel($scope.isSideMenuOpened);
        };

        /**
         * Function that clears the search box in the source select filter
         */
        $scope.clearSearch = () => {
            $scope.searchSource = "";
            $scope.searchDestination = "";
        };

        $scope.updateSearch = (event) => {
            event.stopPropagation();
        };

        /**
         * Variable that defines the genre buttons in the filter menu
         */
        $scope.genreButtons = [
            { value: "menu-male", text: "Male" },
            { value: "menu-female", text: "Female" },
            { value: "menu-all", text: "All" },
        ];

        /**
         * Variable that defines the region buttons in the filter menu
         */
        $scope.sectionButtons = [
            { value: "menu-continent", text: "Continent" },
            { value: "menu-region", text: "Region" },
            { value: "menu-country", text: "Country" },
        ];
    }
})();
