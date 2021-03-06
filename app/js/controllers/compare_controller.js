(function () {
    "use strict";

    // reloading the angular module
    angular.module("main").controller("compareController", compareController);

    /**
     * Function that handle the user login
     */

    compareController.$inject = ["$scope", "$state", "statisticsService"];

    function compareController($scope, $state, statisticsService) {
        $scope.statisticsButtons = statisticsService.statisticsButtons;

        $scope.loadMap = () => {
            $state.go("map");
        };
    }
})();
