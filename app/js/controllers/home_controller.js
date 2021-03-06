(function () {
    "use strict";

    // reloading the angular module
    angular.module("main").controller("homeController", homeController);

    /**
     * Function that handlle the user login
     */

    homeController.$inject = ["$scope"];

    function homeController($scope) {
        d3.csv("app/data/fifa-world-cup.csv", (data) => {
            console.log(data);
        }).catch((error) => alert("Couldn't load fifa dataset: " + error));

        $scope.feeds = [
            {
                title: "Burundi",
                image: "app/img/home/down.png",
                value: "4.232 M",
            },
            {
                title: "Italy",
                image: "app/img/home/up.png",
                value: "4.232 M",
            },
            {
                title: "Kenya",
                image: "app/img/home/down.png",
                value: "4.232 M",
            },
            {
                title: "France",
                image: "app/img/home/down.png",
                value: "4.232 M",
            },
            {
                title: "Germany",
                image: "app/img/home/up.png",
                value: "432 M",
            },
            {
                title: "Marocco",
                image: "app/img/home/up.png",
                value: "432 M",
            },
        ];
    }
})();
