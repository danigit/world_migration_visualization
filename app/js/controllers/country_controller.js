(function () {
    "use strict";

    // reloading the angular module
    angular.module("main").controller("countryController", countryController);

    /**
     * Function that handle the country page logic
     */

    countryController.$inject = ["$scope", "$state", "dataService"];

    function countryController($scope, $state, dataService) {
        $scope.genreFilterValue = "menu-male";
        $scope.countryInfoValue = "global_rank";
        $scope.selectedTopCountry = "";
        $scope.countries = dataService.countries;
        $scope.selectedCountryController =
            dataService.selectedCountryController == ""
                ? $scope.countries[0].name
                : dataService.selectedCountryController;
        $scope.secondaryMenuSelectedValue =
            dataService.secondaryMenuSelectedValue != ""
                ? dataService.secondaryMenuSelectedValue
                : "country";
        $scope.secondaryMenuButtons = dataService.menuButtons;
        $scope.genreButtons = dataService.genreButtons;
        $scope.countryInfoTypeButtons = dataService.countryInfoTypeButtons;
        $scope.topFlags = dataService.topFlags;

        // getting the countries class by region data
        dataService.countriesClassByRegion.then((data) => {
            $scope.countriesClassByRegion = data;
            console.log(data);
        });

        // variable that holds the slider values
        $scope.sliderCountry = {
            minValue: 0,
            maxValue: 7,
            options: {
                floor: 4,
                ceil: 9,
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
         * Function that handles the click on the secondary menu buttons
         * @param {string} value
         */
        $scope.handleSecondaryMenuClick = function (value) {
            $scope.secondaryMenuSelectedValue = value;
            dataService.secondaryMenuSelectedValue = value;
            dataService.changePage();
        };

        /**
         * Function that handles the click on the secondary menu buttons
         * @param {string} value
         */
        $scope.handleCountryInfoClick = function (value) {
            $scope.countryInfoValue = value;
        };

        /**
         * Function that handles the click on the top countries flags
         * @param {string} value
         */
        $scope.handleTopCountryClick = function (value, type) {
            $scope.selectedTopCountry = value;
            $scope.selectedCountryController = value;
        };
    }
})();
