(function () {
    "use strict";

    // reloading the angular module
    angular.module("main").controller("countryController", countryController);

    /**
     * Function that handle the country page logic
     */

    countryController.$inject = ["$scope", "$state", "dataService", "countryService"];

    function countryController($scope, $state, dataService, countryService) {
        $scope.countryInfoValue = "global_rank";
        $scope.selectedTopCountry = "";
        $scope.continents = dataService.continents;
        dataService.countries.then((data) => {
            $scope.countries = data;

            $scope.selectedCountryController =
                dataService.selectedCountryController == "" ? $scope.countries[0].visName : dataService.selectedCountryController;

            $scope.genreFilterValue = "menu-all";
            updateStatistics();
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
            minValue: 1990,
            maxValue: 2019,
            options: {
                floor: 4,
                ceil: 9,
                showTicksValues: true,
                stepsArray: dataService.sliderYears,
            },
        };

        // getting the min and max year in the slider
        let sliderMin = 1900;
        let sliderMax = 2019;

        // getting the years selected in the slider
        let consideredYears = [1990, 1995, 2000, 2005, 2010, 2015, 2019].filter((year) => year >= +sliderMin && year <= +sliderMax);

        // watcher that listens for the slider updates
        $scope.$on("slideEnded", () => {
            sliderMin = $scope.sliderCountry.minValue;
            sliderMax = $scope.sliderCountry.maxValue;
            updateStatistics();
        });

        /**
         * Function that updates the statistics
         */
        let updateStatistics = () => {
            console.log($scope.selectedCountryController);
            // getting the total migrants by origin and destination
            dataService
                .getTotMigrantsByOriginAndDestination($scope.selectedCountryController, sliderMin, sliderMax, $scope.genreFilterValue)
                .then((data) => {
                    $scope.countryStatisticsValues.totalImmigrations = "" + transformNumberFormat(data);
                    $scope.$apply();
                });

            // getting the total population by age and sex
            dataService
                .getTotPopulationByAgeAndSex(
                    $scope.selectedCountryController,
                    sliderMin,
                    sliderMax,
                    dataService.getSelectedGenderColumn($scope.genreFilterValue, "Total")
                )
                .then((data) => {
                    $scope.countryStatisticsValues.totalPopulation = "" + transformNumberFormat(data);
                    $scope.$apply();
                });

            // getting the migrants as percentage of population
            dataService
                .getMigrantsAsPercentageOfPopulationByAgeAndSex(
                    $scope.selectedCountryController,
                    sliderMin,
                    sliderMax,
                    dataService.getSelectedGenderColumn($scope.genreFilterValue, "Total")
                )
                .then((data) => {
                    $scope.countryStatisticsValues.immigrationVsPopulation = "" + transformNumberFormat(data);
                    $scope.$apply();
                });

            // getting the immigration average ag
            dataService
                .getImmigrationAverageAge(
                    $scope.selectedCountryController,
                    sliderMin,
                    sliderMax,
                    dataService.getSelectedGenderColumn($scope.genreFilterValue, "")
                )
                .then((data) => {
                    $scope.countryStatisticsValues.immigrationAverageAge = "" + transformNumberFormat(data);
                });

            // getting the estimated refugees
            dataService
                .getEstimatedRefugees(
                    $scope.selectedCountryController,
                    consideredYears,
                    dataService.getSelectedGenderColumn($scope.genreFilterValue, "_est")
                )
                .then((data) => {
                    if (isNaN(data)) {
                        $scope.countryStatisticsValues.refugeeVsImmigration = "Not available";
                    } else {
                        $scope.countryStatisticsValues.refugeeVsImmigration = "" + transformNumberFormat(data);
                    }
                    $scope.$apply();
                });

            dataService
                .getCountryDevelopmentStatistic($scope.selectedCountryController, consideredYears, $scope.genreFilterValue)
                .then((data) => {
                    drawPieChart(data, "development-piechart");
                });

            dataService
                .getCountryIncomeStatistic($scope.selectedCountryController, consideredYears, $scope.genreFilterValue)
                .then((data) => {
                    drawPieChart(data, "income-piechart");
                });
        };

        let drawPieChart = (data, container) => {
            const developmentContainer = d3.select("#" + container);
            const developmentContainerDim = developmentContainer.node().getBoundingClientRect();
            const width = developmentContainerDim.width;
            const height = developmentContainerDim.height;

            const svg = developmentContainer.append("svg").attr("width", width).attr("height", height);
            const pieChartGroup = svg.append("g").attr("transform", `translate(${width / 2}, ${height / 2})`);
            const pieChartLabels = svg
                .append("g")
                .attr("class", "labels")
                .attr("transform", `translate(${width / 2}, ${height / 2})`);
            const radius = Math.min(width, height) / 2;
            const colors = d3.scaleOrdinal(d3.schemePaired);
            const arc = d3
                .arc()
                .outerRadius(radius - 50)
                .innerRadius(0);
            const pie = d3.pie().value((d) => d.value);
            const piedData = pie(data);

            const arcs = pieChartGroup
                .selectAll(".arc")
                .data(piedData)
                .join((enter) => enter.append("path").attr("class", "arc").style("stroke", "white"))
                .attr("d", arc)
                .style("fill", (d, i) => colors(i));

            let legendIndex = 0;
            var labelGroups = pieChartLabels.selectAll(".label").data(piedData).enter().append("g").attr("class", "label");
            labelGroups
                .append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("rx", 0)
                .attr("ry", 0)
                .attr("width", 10)
                .attr("height", 10)
                .attr("stroke", "#FFFFFF")
                .attr("fill", (d, i) => colors(i))
                .attr("transform", (d, i) => {
                    if (i < data.length / 2) return `translate(${-(width / 2 - 50)}, ${height / 2 - 15 * (i + 1)})`;
                    else {
                        return `translate(${width / 4 - 100}, ${height / 2 - 15 * (legendIndex++ + 1)})`;
                    }
                })
                .attr("class", "label-circle");

            legendIndex = 0;
            let textLabels = labelGroups
                .append("text")
                .attr("x", "0")
                .attr("y", "5")
                .attr("transform", (d, i) => {
                    if (i < data.length / 2) {
                        return `translate(${-(width / 2 - 70)}, ${height / 2 - 15 * (i + 1)})`;
                    } else {
                        return `translate(${width / 4 - 80}, ${height / 2 - 15 * (legendIndex++ + 1)})`;
                    }
                })
                .attr("class", "label-text")
                .text((d) => d.data.type);
        };

        /**
         * Function that handles the click on the genre radio group filter in the menu
         * @param {string} value
         */
        $scope.handleGenreClick = function (value) {
            $scope.genreFilterValue = value;
            updateStatistics();
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

        /**
         * Function that handles the mouse enter on the top countries flags
         * @param {string} value
         */
        $scope.showTopCountryHint = function (value, event, type) {
            $scope.selectedTopFlag = value.toUpperCase();
            let tooltip = document.getElementById("top-flags-tooltip");
            tooltip.classList.remove("hide");
            tooltip.style.top = event.clientY - 50 + "px";
            tooltip.style.left = event.clientX + "px";
            tooltip.style.zIndex = 100;
        };

        /**
         * Function that handles the mouse out on the top countries flags
         * @param {string} value
         */
        $scope.hideTopCountryHint = function (type) {
            let tooltip = document.getElementById("top-flags-tooltip");
            tooltip.style.zIndex = -100;
        };
    }
})();
