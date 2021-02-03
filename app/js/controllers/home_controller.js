(function() {
    'use strict';

    // reloading the angular module
    angular.module('main').controller('homeController', homeController);

    /**
     * Function that handlle the user login
     */

    homeController.$inject = ['$scope']

    function homeController($scope) {
        d3.csv("app/data/fifa-world-cup.csv", data => {
            console.log(data);
        })
        .catch(error => alert("Couldn't load fifa dataset: " + error));
    }
})();