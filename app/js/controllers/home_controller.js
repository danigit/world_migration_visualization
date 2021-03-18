(function () {
    "use strict";

    // reloading the angular module
    angular.module("main").controller("homeController", homeController);

    /**
     * Function that handlle the user login
     */

    homeController.$inject = ["$scope", "$state", "feedService"];

    function homeController($scope, $state, feedService) {
        // d3.csv("app/data/fifa-world-cup.csv", (data) => {
        //     console.log(data);
        // }).catch((error) => alert("Couldn't load fifa dataset: " + error));

        $scope.feeds = feedService.feeds; 
    }
})();
