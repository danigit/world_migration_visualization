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
        $scope.isSideMenuOpened = true;
        $scope.searchSource = "";
        $scope.searchDestination = "";
        $scope.genreFilterValue = "menu-male";
        $scope.regionFilterValue = "menu-continent";
        $scope.countries = dataService.countries;
        $scope.genreButtons = dataService.genreButtons;
        $scope.regionButtons = dataService.regionButtons;
        $scope.selectedCountries = {
            source: [],
            destination: [],
        };
        // variable that holds the values for the slider
        $scope.slider = {
            minValue: 1,
            maxValue: 7,
            options: {
                floor: 0,
                ceil: 6,
                showTicksValues: true,
                stepsArray: dataService.sliderYears,
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
    }
})();
