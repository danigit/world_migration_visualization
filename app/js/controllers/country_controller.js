(function () {
    "use strict";

    // reloading the angular module
    angular.module("main").controller("countryController", countryController);

    /**
     * Function that handle the user login
     */

    countryController.$inject = ["$scope", "$state", "statisticsService"];

    function countryController($scope, $state, statisticsService) {
        $scope.statisticsButtons = statisticsService.statisticsButtons;
        $scope.countryButtons = statisticsService.countryButtons;
        $scope.topFlags = statisticsService.topFlags;

        $scope.sliderCountry = {
            min: 0,
            max: 7,
            options: {
                floor: 4,
                ceil: 9,
                showTicksValues: true,
                stepsArray: [
                    { value: 1, legend: "1990" },
                    { value: 3, legend: "1995" },
                    { value: 5, legend: "2000" },
                    { value: 7, legend: "2005" },
                    { value: 9, legend: "2010" },
                    { value: 9, legend: "2015" },
                    { value: 9, legend: "2017" },
                ],
            },
        };
    }
})();
