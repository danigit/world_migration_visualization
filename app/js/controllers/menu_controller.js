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

        $scope.regionFilterValue = "menu-continent";
        $scope.continents = dataService.continents;
        dataService.countries.then((data) => { $scope.countries = data; });
        $scope.genderButtons = dataService.genderButtons;
        $scope.regionButtons = dataService.regionButtons;
        // $scope.selectedCountries = {
        //     source: [],
        //     destination: [],
        // };

        // variable that holds the values for the slider
        $scope.sliderYears = {
            minValue: 1990,
            maxValue: 2019,
            options: {
                floor: 0,
                ceil: 6,
                showTicksValues: true,
                stepsArray: dataService.sliderYears,
            },
        };

        // getting the min and max year in the slider
        let sliderMin = 1900;
        let sliderMax = 2019;

        // watcher that listens for the slider updates
        $scope.$on("slideEnded", () => {
            sliderMin = $scope.sliderYears.minValue;
            sliderMax = $scope.sliderYears.maxValue;
            updateStatistics();
        });

        /**
         * Function that updates the statistics
         */
        let updateMap = () => {
            
        };

        /**
         * Function that handles the click on the region radio group filter in the menu
         * @param {string} value
         */
        $scope.handleRegionClick = function (value) {
            $scope.regionFilterValue = value;
            updateStatistics();
        };

        /**
         * Function that open and close the menu
         */
        $scope.toggleMenu = () => {
            $scope.isSideMenuOpened = $scope.isSideMenuOpened ? false : true;
            resizeMenuPanel($scope.isSideMenuOpened);
        };

        $scope.updateSearch = (event) => {
            event.stopPropagation();
        };
    }
})();
