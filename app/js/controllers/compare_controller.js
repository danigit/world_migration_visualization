(function () {
    "use strict";

    // reloading the angular module
    angular.module("main").controller("compareController", compareController);

    /**
     * Function that handle the compare page logic
     */

    compareController.$inject = ["$scope", "$state", "dataService"];

    function compareController($scope, $state, dataService) {
        $scope.secondaryMenuSelectedValue =
            dataService.secondaryMenuSelectedValue != "" ? dataService.secondaryMenuSelectedValue : "compare";
        $scope.secondaryMenuButtons = dataService.menuButtons;
        $scope.continents = dataService.continents;
        dataService.countries.then((data) => {
            $scope.countries = data;
            $scope.selectedCountry = {
                left: $scope.countries[0].visName,
                right: $scope.countries[1].visName,
            };
        });

        /**
         * Function that handles the click on the secondary menu buttons
         * @param {string} value
         */
        $scope.handleSecondaryMenuClick = function (value) {
            $scope.secondaryMenuSelectedValue = value;
            dataService.secondaryMenuSelectedValue = value;
            dataService.changePage();
        };
    }
})();
