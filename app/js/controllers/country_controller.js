(function () {
    "use strict";

    // reloading the angular module
    angular.module("main").controller("countryController", countryController);

    /**
     * Function that handle the country page logic
     */

    countryController.$inject = ["$scope", "$state", "dataService", "countryService"];

    function countryController($scope, $state, dataService, countryService) {
        $scope.genreFilterValue = "menu-all";
        $scope.countryInfoValue = "global_rank";
        $scope.selectedTopCountry = "";
        dataService.countries.then((data) => {
            $scope.countries = data;

            $scope.selectedCountryController = dataService.selectedCountryController == ""
                    ? $scope.countries[0].visName : dataService.selectedCountryController;
        });
        
        $scope.secondaryMenuSelectedValue =
            dataService.secondaryMenuSelectedValue != "" ? dataService.secondaryMenuSelectedValue : "country";
        $scope.secondaryMenuButtons = dataService.menuButtons;
        $scope.genreButtons = dataService.genreButtons;
        $scope.countryInfoTypeButtons = dataService.countryInfoTypeButtons;
        $scope.topFlags = dataService.topFlags;
        $scope.countryStatisticsValues = {
            totalImmigrations: "",
            totalPopulation: "",
            immigrationVsPopulation: "",
            immigrationAverageAge: "",
            refugeeVsImmigration: "",
        };

        // variable that holds the slider values
        $scope.sliderCountry = {
            minValue: 1,
            maxValue: 5,
            options: {
                floor: 4,
                ceil: 9,
                showTicksValues: true,
                stepsArray: dataService.sliderYears,
            },
        };

        // getting the min and max year in the slider
        let sliderMin = dataService.sliderYears.find((sliderYear) => sliderYear.value == $scope.sliderCountry.minValue).legend;
        let sliderMax = dataService.sliderYears.find((sliderYear) => sliderYear.value == $scope.sliderCountry.maxValue).legend;
        // getting the years selected in the slider
        let consideredYears = [1990, 1995, 2000, 2005, 2010, 2015, 2019].filter((year) => year >= +sliderMin && year <= +sliderMax);

        /**
         * Function that returns the column postfix given the gender
         * @param {string} selectedGender
         * @param {string} columnPrefix
         * @returns {string}
         */
        let getSelectedGenderColumn = (selectedGender, columnPrefix) => {
            let selectedGenderColumn = "";
            switch (selectedGender) {
                case "menu-all":
                    selectedGenderColumn = columnPrefix + "_(mf)";
                    break;
                case "menu-male":
                    selectedGenderColumn = columnPrefix + "_(m)";
                    break;
                case "menu-female":
                    selectedGenderColumn = columnPrefix + "_(f)";
                    break;
            }
            return selectedGenderColumn;
        };

        // getting the total migrants by origin and destination
        dataService.getTotMigrantsByOriginAndDestination($scope.selectedCountryController, sliderMin, sliderMax).then((data) => {
            $scope.countryStatisticsValues.totalImmigrations = "" + data;
            $scope.$apply();
        });

        // getting the total population by age and sex
        dataService
            .getTotPopulationByAgeAndSex(
                $scope.selectedCountryController,
                sliderMin,
                sliderMax,
                getSelectedGenderColumn($scope.genreFilterValue, "Total")
            )
            .then((data) => {
                $scope.countryStatisticsValues.totalPopulation = "" + data;
                $scope.$apply();
            });

        // getting the migrants as percentage of population
        dataService
            .getMigrantsAsPercentageOfPopulationByAgeAndSex(
                $scope.selectedCountryController,
                sliderMin,
                sliderMax,
                getSelectedGenderColumn($scope.genreFilterValue, "Total")
            )
            .then((data) => {
                $scope.countryStatisticsValues.immigrationVsPopulation = "" + data.toFixed(2);
                $scope.$apply();
            });

        // getting the immigration average age
        // TODO

        // getting the estimated refugees
        dataService
            .getEstimatedRefugees(
                $scope.selectedCountryController,
                consideredYears,
                getSelectedGenderColumn($scope.genreFilterValue, "_est")
            )
            .then((data) => {
                $scope.countryStatisticsValues.refugeeVsImmigration = "" + data;
                $scope.$apply();
                console.log("getEstimatedRefugees: " + data);
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

        // dataService.totMigrByOriginDest.then(function (data) {
        //     $scope.selectedCountryInwardMigrData = data.filter(
        //         (countryData) =>
        //             countryData["Destination"] ==
        //                 $scope.selectedCountryController &&
        //             countryData["Year"] >= sliderMin &&
        //             countryData["Year"] <= sliderMax
        //     );
        //     console.log("data ", $scope.selectedCountryInwardMigrData);
        //     $scope.AverageInwardMigrants =
        //         $scope.selectedCountryInwardMigrData.reduce(
        //             (sum, curr) => sum + +curr.Total,
        //             0
        //         ) / $scope.selectedCountryInwardMigrData.length;
        //     console.log("Average migrants ", $scope.AverageInwardMigrants);
        // });

        // dataService.totPopulationByAgeSex.then(function (data) {
        //     $scope.selectedCountryTotPopulationData = data.filter(
        //         (countryData) =>
        //             countryData["Destination"] == $scope.selectedCountry &&
        //             countryData["Year"] >= sliderMin &&
        //             countryData["Year"] <= sliderMax
        //     );

        //     $scope.AveragePopulation =
        //         ($scope.selectedCountryTotPopulationData.reduce((sum, curr) => sum + +curr[selectedGender], 0) /
        //             $scope.selectedCountryTotPopulationData.length) *
        //         1000;
        //     console.log("Average population ", $scope.AveragePopulation);
        // });

        // var selectedGender = "";
        // if ($scope.genreFilterValue == "menu-all") {
        //     selectedGender = "Total_(mf)";
        // } else if ($scope.genreFilterValue == "menu-male") {
        //     selectedGender = "Total_(m)";
        // } else if ($scope.genreFilterValue == "menu-female") {
        //     selectedGender = "Total_(f)";
        // }

        // dataService.migrAsPercOfPopulationAgeSex.then(function (data) {
        //     $scope.selectedCountryMigrPerc = data.filter(
        //         (countryData) =>
        //             countryData["Destination"] == $scope.selectedCountry &&
        //             countryData["Year"] >= sliderMin &&
        //             countryData["Year"] <= sliderMax
        //     );

        //     $scope.averagePercOfMigr =
        //         $scope.selectedCountryMigrPerc.reduce((sum, curr) => sum + +curr[selectedGender], 0) /
        //         $scope.selectedCountryMigrPerc.length;
        //     console.log("Average percentage of migrants ", $scope.averagePercOfMigr);
        // });

        // dataService.estimatedRefugees.then(function (data) {
        //     let selected = "";
        //     if ($scope.genreFilterValue == "menu-all") {
        //         selected = "_est_(mf)";
        //     } else if ($scope.genreFilterValue == "menu-male") {
        //         selected = "_est_(m)";
        //     } else if ($scope.genreFilterValue == "menu-female") {
        //         selected = "_est_(f)";
        //     }

        //     $scope.selectedCountryEstRefugees = data.filter(
        //         (countryData) => countryData["Destination"] == $scope.selectedCountryController
        //     );
        //     var leftLimit = +sliderMin;
        //     var rightLimit = +sliderMax;
        //     $scope.averageEstRefugees = 0;
        //     let boundaries = [1990, 1995, 2000, 2005, 2010, 2015, 2019];
        //     var numYears = 0;
        //     boundaries.forEach((year) => {
        //         if (year >= leftLimit && year <= rightLimit) {
        //             $scope.averageEstRefugees += +$scope.selectedCountryEstRefugees[0]["" + year + selected];
        //             numYears = numYears + 1;
        //         }
        //     });

        //     $scope.averageEstRefugees = $scope.averageEstRefugees / numYears;
        //     console.log("Average estimated of refugees", $scope.averageEstRefugees);
        // });
    }
})();
