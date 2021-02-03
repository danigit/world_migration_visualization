(function() {
    'use strict';

    // reloading the angular module
    angular.module('main').controller('homeController', homeController);

    /**
     * Function that handlle the user login
     */

    homeController.$inject = ['$scope']

    function homeController($scope) {
        console.log('Home Controller')
    }
})();