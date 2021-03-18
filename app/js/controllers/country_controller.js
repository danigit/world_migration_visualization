(function () {
    "use strict";

    // reloading the angular module
    angular.module("main").controller("countryController", countryController);

    /**
     * Function that handle the country page logic
     */

    countryController.$inject = ["$scope", "$state", "dataService"];

    function countryController($scope, $state, dataService, countryService) {
        $scope.genreFilterValue = "menu-all";
        $scope.countryInfoValue = "global_rank";
        $scope.selectedTopCountry = "";
        $scope.countries = dataService.countries;
        $scope.selectedCountryController =
            dataService.selectedCountryController == ""
                ? $scope.countries[0].name
                : dataService.selectedCountryController;
        $scope.secondaryMenuSelectedValue =
            dataService.secondaryMenuSelectedValue != ""
                ? dataService.secondaryMenuSelectedValue
                : "country";
        $scope.secondaryMenuButtons = dataService.menuButtons;
        $scope.genreButtons = dataService.genreButtons;
        $scope.countryInfoTypeButtons = dataService.countryInfoTypeButtons;
        $scope.topFlags = dataService.topFlags;

        // getting the countries class by region data
        /* dataService.countriesClassByRegion.then((data) => {
            $scope.countriesClassByRegion = data;
            console.log(data);
        }); */

        // variable that holds the slider values
        $scope.sliderCountry = {
            minValue: 1,
            maxValue: 7,
            options: {
                floor: 4,
                ceil: 9,
                showTicksValues: true,
                stepsArray: dataService.sliderYears,
            },
        };

        
        var sliderMin = dataService.sliderYears.find(sliderYear => sliderYear.value == $scope.sliderCountry.minValue).legend;
        console.log(sliderMin);
        var sliderMax =  dataService.sliderYears.find(sliderYear => sliderYear.value == $scope.sliderCountry.maxValue).legend;
        console.log(sliderMax);

        

       /*  var selectedCountryInwardMigrData;
        var selectedCountryTotPopulationData; */

        dataService.totMigrByOriginDest.then(function (data) {
            $scope.selectedCountryInwardMigrData = data.filter(countryData => 
                countryData["Destination"]==$scope.selectedCountry 
                && countryData["Year"] >=sliderMin && countryData["Year"] <=sliderMax);
            console.log("data ", $scope.selectedCountryInwardMigrData);
            $scope.AverageInwardMigrants = $scope.selectedCountryInwardMigrData.
                reduce((sum, curr) => sum + (+curr.Total), 0) / $scope.selectedCountryInwardMigrData.length;
            console.log("Average migrants ", $scope.AverageInwardMigrants);
        });

        var selectedGender = "";
        if ($scope.genreFilterValue == "menu-all") {
            selectedGender = "Total_(mf)"
        }
        else if ($scope.genreFilterValue == "menu-male") {
            selectedGender = "Total_(m)"
        }
        else if ($scope.genreFilterValue == "menu-female") {
            selectedGender = "Total_(f)"
        }

        dataService.totPopulationByAgeSex.then(function (data) {
            $scope.selectedCountryTotPopulationData = data.filter(countryData => 
                countryData["Destination"]==$scope.selectedCountry
                && countryData["Year"] >=sliderMin && countryData["Year"] <=sliderMax);
            
            $scope.AveragePopulation = ($scope.selectedCountryTotPopulationData.
                reduce((sum, curr) => sum + (+curr[selectedGender]), 0) / $scope.selectedCountryTotPopulationData.length) * 1000;
            console.log("Average population ", $scope.AveragePopulation);
        });

        dataService.migrAsPercOfPopulationAgeSex.then(function (data) {
            $scope.selectedCountryMigrPerc = data.filter(countryData => 
            countryData["Destination"]==$scope.selectedCountry
            && countryData["Year"] >=sliderMin && countryData["Year"] <=sliderMax);
        
        $scope.averagePercOfMigr = $scope.selectedCountryMigrPerc
            .reduce((sum, curr) => sum + (+curr[selectedGender]), 0) / $scope.selectedCountryMigrPerc.length
        console.log("Average percentage of migrants ", $scope.averagePercOfMigr);
        });


        dataService.estimatedRefugees.then(function (data) {

            let selected = "";
            if ($scope.genreFilterValue == "menu-all") {
                selected = "_est_(mf)"
            }
            else if ($scope.genreFilterValue == "menu-male") {
                selected = "_est_(m)"
            }
            else if ($scope.genreFilterValue == "menu-female") {
                selected = "_est_(f)"
            }

            $scope.selectedCountryEstRefugees = data.filter(countryData => 
                countryData["Destination"]==$scope.selectedCountry);
            var leftLimit = (+sliderMin);
            var rightLimit = (+sliderMax);
            $scope.averageEstRefugees = 0;
            let boundaries = [1990, 1995, 2000, 2005, 2010, 2015, 2019]
            var numYears = 0;
            boundaries.forEach(year => {
                if (year >=leftLimit && year <=rightLimit) {
                    $scope.averageEstRefugees += (+$scope.selectedCountryEstRefugees[0]["" + year + selected])
                    numYears = numYears + 1;
                }
            });
           
            $scope.averageEstRefugees = $scope.averageEstRefugees / numYears;
            console.log("Average estimated of refugees", $scope.averageEstRefugees);
        });


        /**
         * Function that handles the click on the genre radio group filter in the menu
         * @param {string} value
         */
        $scope.handleGenreClick = function (value) {
            $scope.genreFilterValue = value;
        };

        /**
         * Function that handles the click on the secondary menu buttons
         * @param {string} value
         */
        $scope.handleSecondaryMenuClick = function (value) {
            $scope.secondaryMenuSelectedValue = value;
            dataService.secondaryMenuSelectedValue = value;
            dataService.changePage();
        };

        /**
         * Function that handles the click on the secondary menu buttons
         * @param {string} value
         */
        $scope.handleCountryInfoClick = function (value) {
            $scope.countryInfoValue = value;
        };

        /**
         * Function that handles the click on the top countries flags
         * @param {string} value
         */
        $scope.handleTopCountryClick = function (value, type) {
            $scope.selectedTopCountry = value;
            $scope.selectedCountryController = value;
        };
    }
})();
