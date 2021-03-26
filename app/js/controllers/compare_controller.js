(function () {
    "use strict";

    // reloading the angular module
    angular.module("main").controller("compareController", compareController);

    /**
     * Function that handle the compare page logic
     */

    compareController.$inject = ["$scope", "$state", "dataService"];

    function compareController($scope, $state, dataService) {
        $scope.secondaryMenuSelectedValue =
            dataService.secondaryMenuSelectedValue != "" ? dataService.secondaryMenuSelectedValue : "compare";
        $scope.secondaryMenuButtons = dataService.menuButtons;
        $scope.searchSource = "";
        $scope.continents = dataService.continents;
        $scope.countryInfoTypeButtons = dataService.countryInfoTypeButtons;
        $scope.countryInfoValue = "global_rank";
        $scope.genreButtons = dataService.genreButtons;
        $scope.leftSendToRight;
        $scope.rightSendToLeft;
        let mutualMigrationInformation;

        $scope.countryLeftStatisticsValues = {
            totalImmigrations: "",
            totalPopulation: "",
            immigrationVsPopulation: "",
            immigrationAverageAge: "",
            refugeeVsImmigration: "",
        };
        $scope.globalRankCountryLeftStatisticsValues = {
            totalImmigrationsGlobalRank: "",
            totalPopulationGlobalRank: "",
            immigrationVsPopulationGlobalRank: "",
            immigrationAverageAgeGlobalRank: "",
            refugeeVsImmigrationGlobalRank: "",
        };

        $scope.countryRightStatisticsValues = {
            totalImmigrations: "",
            totalPopulation: "",
            immigrationVsPopulation: "",
            immigrationAverageAge: "",
            refugeeVsImmigration: "",
        };
        $scope.globalRankCountryRightStatisticsValues = {
            totalImmigrationsGlobalRank: "",
            totalPopulationGlobalRank: "",
            immigrationVsPopulationGlobalRank: "",
            immigrationAverageAgeGlobalRank: "",
            refugeeVsImmigrationGlobalRank: "",
        };

        dataService.countries.then((data) => {
            $scope.countries = data;
            $scope.selectedCountry = {
                left: $scope.countries[0],
                right: $scope.countries[1],
            };

            $scope.genreFilterValue = "menu-all";
            $scope.updateStatisticsLeft();
            $scope.updateStatisticsRight();
            $scope.$apply();
        });

        let sliderMin = 1990;
        let sliderMax = 2019;
        let consideredYears = [1990, 1995, 2000, 2005, 2010, 2015, 2019];

        /**
         * Function that updates the statistics
         */
        $scope.updateStatisticsLeft = () => {
            console.log("updating statistics left");
            // getting the total migrants by origin and destination
            dataService
                .getTotMigrantsByOriginAndDestination($scope.selectedCountry.left.name, sliderMin, sliderMax, $scope.genreFilterValue)
                .then((data) => {
                    $scope.countryLeftStatisticsValues.totalImmigrations = "" + transformNumberFormat(data);
                    $scope.$apply();
                });

            // $scope.selectedCountryController, sliderMin, sliderMax
            dataService
                .getGlobalRankStatistics($scope.selectedCountry.left.name, sliderMin, sliderMax, $scope.genreFilterValue)
                .then((data) => {
                    let avgEstRefGlobalRank = "";
                    if (isNaN(data.average_est_refugees_global_rank)) {
                        avgEstRefGlobalRank = "Not available";
                    } else {
                        avgEstRefGlobalRank = "" + transformNumberFormat(data.average_est_refugees_global_rank, true);
                    }

                    $scope.globalRankCountryLeftStatisticsValues.totalImmigrationsGlobalRank =
                        "" + transformNumberFormat(data.average_tot_migrants_global_rank, true);

                    $scope.globalRankCountryLeftStatisticsValues.totalPopulationGlobalRank =
                        "" + transformNumberFormat(data.average_tot_population_global_rank, true);

                    $scope.globalRankCountryLeftStatisticsValues.immigrationVsPopulationGlobalRank =
                        "" + transformNumberFormat(data.average_perc_immigration_global_rank, true);

                    $scope.globalRankCountryLeftStatisticsValues.immigrationAverageAgeGlobalRank =
                        "" + transformNumberFormat(data.average_age_migrants_global_rank, true);

                    $scope.globalRankCountryLeftStatisticsValues.refugeeVsImmigrationGlobalRank = avgEstRefGlobalRank;

                    $scope.$apply();
                });

            // getting the total population by age and sex
            dataService
                .getTotPopulationByAgeAndSex(
                    $scope.selectedCountry.left.name,
                    sliderMin,
                    sliderMax,
                    dataService.getSelectedGenderColumn($scope.genreFilterValue, "Total")
                )
                .then((data) => {
                    $scope.countryLeftStatisticsValues.totalPopulation = "" + transformNumberFormat(data);
                    $scope.$apply();
                });

            // getting the migrants as percentage of population
            dataService
                .getMigrantsAsPercentageOfPopulationByAgeAndSex(
                    $scope.selectedCountry.left.name,
                    sliderMin,
                    sliderMax,
                    dataService.getSelectedGenderColumn($scope.genreFilterValue, "Total")
                )
                .then((data) => {
                    $scope.countryLeftStatisticsValues.immigrationVsPopulation = "" + transformNumberFormat(data);
                    $scope.$apply();
                });

            // getting the immigration average ag
            dataService
                .getImmigrationAverageAge(
                    $scope.selectedCountry.left.name,
                    sliderMin,
                    sliderMax,
                    dataService.getSelectedGenderColumn($scope.genreFilterValue, "")
                )
                .then((data) => {
                    $scope.countryLeftStatisticsValues.immigrationAverageAge = "" + transformNumberFormat(data);
                });

            // getting the estimated refugees
            dataService
                .getEstimatedRefugees(
                    $scope.selectedCountry.left.name,
                    consideredYears,
                    dataService.getSelectedGenderColumn($scope.genreFilterValue, "_pct")
                )
                .then((data) => {
                    if (isNaN(data)) {
                        $scope.countryLeftStatisticsValues.refugeeVsImmigration = "Not available";
                    } else {
                        $scope.countryLeftStatisticsValues.refugeeVsImmigration = "" + transformNumberFormat(data);
                    }
                    $scope.$apply();
                });

            dataService.getMutualMigration($scope.selectedCountry.left.name, $scope.selectedCountry.right.name).then((data) => {
                $scope.leftSendToRight = data.countryOneSend;
                $scope.rightSendToLeft = data.countryTwoSend;
                $scope.$apply();
            });
        };

        $scope.updateStatisticsRight = () => {
            // $scope.selectedCountryController, sliderMin, sliderMax
            dataService
                .getGlobalRankStatistics($scope.selectedCountry.right.name, sliderMin, sliderMax, $scope.genreFilterValue)
                .then((data) => {
                    let avgEstRefGlobalRank = "";
                    if (isNaN(data.average_est_refugees_global_rank)) {
                        avgEstRefGlobalRank = "Not available";
                    } else {
                        avgEstRefGlobalRank = "" + transformNumberFormat(data.average_est_refugees_global_rank, true);
                    }
                    $scope.globalRankCountryRightStatisticsValues.totalImmigrationsGlobalRank =
                        "" + transformNumberFormat(data.average_tot_migrants_global_rank, true);
                    $scope.globalRankCountryRightStatisticsValues.totalPopulationGlobalRank =
                        "" + transformNumberFormat(data.average_tot_population_global_rank, true);
                    $scope.globalRankCountryRightStatisticsValues.immigrationVsPopulationGlobalRank =
                        "" + transformNumberFormat(data.average_perc_immigration_global_rank, true);
                    $scope.globalRankCountryRightStatisticsValues.immigrationAverageAgeGlobalRank =
                        "" + transformNumberFormat(data.average_age_migrants_global_rank, true);
                    $scope.globalRankCountryRightStatisticsValues.refugeeVsImmigrationGlobalRank = avgEstRefGlobalRank;
                    $scope.$apply();
                });

            dataService
                .getTotMigrantsByOriginAndDestination($scope.selectedCountry.right.name, sliderMin, sliderMax, $scope.genreFilterValue)
                .then((data) => {
                    $scope.countryRightStatisticsValues.totalImmigrations = "" + transformNumberFormat(data);
                    $scope.$apply();
                });

            // getting the total population by age and sex
            dataService
                .getTotPopulationByAgeAndSex(
                    $scope.selectedCountry.right.name,
                    sliderMin,
                    sliderMax,
                    dataService.getSelectedGenderColumn($scope.genreFilterValue, "Total")
                )
                .then((data) => {
                    $scope.countryRightStatisticsValues.totalPopulation = "" + transformNumberFormat(data);
                    $scope.$apply();
                });
            // getting the migrants as percentage of population
            dataService
                .getMigrantsAsPercentageOfPopulationByAgeAndSex(
                    $scope.selectedCountry.right.name,
                    sliderMin,
                    sliderMax,
                    dataService.getSelectedGenderColumn($scope.genreFilterValue, "Total")
                )
                .then((data) => {
                    $scope.countryRightStatisticsValues.immigrationVsPopulation = "" + transformNumberFormat(data);
                    $scope.$apply();
                });
            // getting the immigration average ag
            dataService
                .getImmigrationAverageAge(
                    $scope.selectedCountry.right.name,
                    sliderMin,
                    sliderMax,
                    dataService.getSelectedGenderColumn($scope.genreFilterValue, "")
                )
                .then((data) => {
                    $scope.countryRightStatisticsValues.immigrationAverageAge = "" + transformNumberFormat(data);
                });
            // getting the estimated refugees
            dataService
                .getEstimatedRefugees(
                    $scope.selectedCountry.right.name,
                    consideredYears,
                    dataService.getSelectedGenderColumn($scope.genreFilterValue, "_pct")
                )
                .then((data) => {
                    if (isNaN(data)) {
                        $scope.countryRightStatisticsValues.refugeeVsImmigration = "Not available";
                    } else {
                        $scope.countryRightStatisticsValues.refugeeVsImmigration = "" + transformNumberFormat(data);
                    }
                    $scope.$apply();
                });

            dataService.getMutualMigration($scope.selectedCountry.left.name, $scope.selectedCountry.right.name).then((data) => {
                $scope.leftSendToRight = transformNumberFormat(data.countryOneSend);
                $scope.rightSendToLeft = transformNumberFormat(data.countryTwoSend);
                $scope.$apply();
            });
        };

        $scope.comparisonWinner = (field, left) => {
            if (left) {
                return $scope.globalRankCountryLeftStatisticsValues[field] < $scope.globalRankCountryRightStatisticsValues[field];
            } else {
                return $scope.globalRankCountryRightStatisticsValues[field] < $scope.globalRankCountryLeftStatisticsValues[field];
            }
        };

        $scope.countryChanged = () => {
            console.log($scope.selectedCountry.left);
            console.log($scope.selectedCountry.right);
        };

        /**
         * Function that handles the click on the genre radio group filter in the menu
         * @param {string} value
         */
        $scope.handleGenreClick = function (value) {
            $scope.genreFilterValue = value;
            $scope.updateStatisticsLeft();
            $scope.updateStatisticsRight();
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
         * Function that clears the search box in the source select filter
         */
        $scope.clearSearch = () => {
            $scope.searchSource = "";
            $scope.searchDestination = "";
        };

        $scope.updateSearch = (event) => {
            event.stopPropagation();
        };
    }
})();
