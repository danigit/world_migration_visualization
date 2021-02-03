(function() {
    'use strict';

    //reloading angular module
    let main = angular.module('main');

    //CONTROLLERS
    main.controller('menuController', menuController);

    /**
     * Function that handle the menu interaction
     * @type {string[]}
     */
    menuController.$inject = ['$scope', '$mdSidenav'];

    function menuController($scope, $mdSidenav) {

      /**
       * Function that open and close the menu
       */
      $scope.toggleLeft = () => {
          $mdSidenav('left').toggle();
      };

      /**
       * Function that shows the location table
       */
      $scope.testItem = () => {
          
      };
        
    }
})();