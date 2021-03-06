(function () {
    "use strict";

    // loading framework and dependencies
    let main = angular.module("main", [
        "ngMaterial",
        "ui.router",
        "radio-button",
        "rzSlider",
        "feed-chip",
    ]);

    // configurating the routing
    main.config(RoutesConfiguration);

    RoutesConfiguration.$inject = ["$stateProvider", "$urlRouterProvider"];

    function RoutesConfiguration($stateProvider, $urlRouterProvider) {
        // setting the default page for the routing
        $urlRouterProvider.otherwise("/home");

        // setting the routing pages
        $stateProvider
            // defining routing to the login page
            .state("home", {
                url: "/home",
                templateUrl: components_folder + "home.html",
                controller: "homeController as homeCtrl",
                resolve: {},
            });
    }
})();
