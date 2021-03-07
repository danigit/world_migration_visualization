(function () {
    "use strict";

    // reloading the angular module
    angular.module("main").controller("navbarController", navbarController);

    /**
     * Function that handle the user login
     */

    navbarController.$inject = ["$scope", "$state", "statisticsService"];

    function navbarController($scope, $state, statisticsService) {
        $scope.statisticsButtons = statisticsService.statisticsButtons;

        $scope.loadStatistics = () => {
            $state.go("statistics");
        };

        $scope.loadMap = () => {
            $state.go("map");
        };
    }
})();
