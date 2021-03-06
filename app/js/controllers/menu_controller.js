(function () {
    "use strict";

    //reloading angular module
    let main = angular.module("main");

    //CONTROLLERS
    main.controller("menuController", menuController);

    /**
     * Function that handle the menu interaction
     * @type {string[]}
     */
    menuController.$inject = ["$scope", "$mdSidenav"];

    function menuController($scope, $mdSidenav) {
        $scope.isSideMenuOpened = true;
        $scope.searchSource = "";
        $scope.searchDestination = "";
        $scope.selectedSourceCountries = [];
        $scope.selectedDestinationCountries = [];
        $scope.slider = {
            min: 1,
            max: 9,
            options: {
                floor: 0,
                ceil: 6,
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

       
        /**
         * Function that open and close the menu
         */
        $scope.toggleMenu = () => {
            $scope.isSideMenuOpened = $scope.isSideMenuOpened ? false : true;
        };

        $scope.clearSearch = () => {
            $scope.searchSource = "";
        };

        $scope.updateSearch = (event) => {
            event.stopPropagation();
        };

        $scope.genreButtons = [
            { value: "male", text: "Male" },
            { value: "female", text: "Female" },
            { value: "all", text: "All" },
        ];

        $scope.sectionButtons = [
            { value: "continent", text: "Continent" },
            { value: "region", text: "Region" },
            { value: "country", text: "Country" },
        ];

        $scope.countries = [
            { continent: "europe", name: "France" },
            { continent: "europe", name: "Italy" },
            { continent: "europe", name: "Spain" },
            { continent: "europe", name: "Finland" },
            { continent: "europe", name: "Portugal" },
            { continent: "africa", name: "Nigeria" },
            { continent: "africa", name: "Kenya" },
            { continent: "africa", name: "Etiopia" },
            { continent: "africa", name: "marocco" },
            { continent: "africa", name: "Uganda" },
        ];
        /**
         * Function that shows the location table
         */
        $scope.testItem = () => {};
    }
})();
