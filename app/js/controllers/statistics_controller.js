(function () {
    "use strict";

    // reloading the angular module
    angular
        .module("main")
        .controller("statisticsController", statisticsController);

    /**
     * Function that handlle the user login
     */

    statisticsController.$inject = ["$scope", "$state", "statisticsService"];

    function statisticsController($scope, $state, statisticsService) {
        $scope.statisticsButtons = statisticsService.statisticsButtons;
        $scope.visualizationTypes = statisticsService.visualizationTypes;
        $scope.topFlags = statisticsService.topFlags;

        $scope.loadMap = () => {
            $state.go("map");
        };
    }
})();
