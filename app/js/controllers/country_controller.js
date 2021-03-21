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

        /**
         * Function that returns an array with the selected years in the slider
         * @returns selected years
         */
        let getSliderYears = () => {
            return [1990, 1995, 2000, 2005, 2010, 2015, 2019].filter((year) => year >= +sliderMin && year <= +sliderMax);
        };

        // getting the years selected in the slider
        let consideredYears = getSliderYears();

        // watcher that listens for the slider updates
        $scope.$on("slideEnded", () => {
            sliderMin = $scope.sliderCountry.minValue;
            sliderMax = $scope.sliderCountry.maxValue;
            consideredYears = getSliderYears();
            updateStatistics();
        });

        /**
         * Function that updates the statistics
         */
        let updateStatistics = () => {
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
                    console.log(data);
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
            developmentContainer.html("");
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
                .outerRadius(radius - 70)
                .innerRadius(0);
            const pie = d3.pie().value((d) => d.value);
            const piedData = pie(data);

            pieChartGroup
                .selectAll(".arc")
                .data(piedData)
                .join(
                    (enter) => {
                        enter
                            .append("path")
                            .attr("class", "arc")
                            .style("stroke", "white")
                            .style("fill", (d, i) => colors(i))
                            .attr("d", arc);
                    },
                    (update) => {
                        update.attr("d", arc);
                    }
                );

            let legendIndex = 0;
            var labelGroups = pieChartLabels.selectAll(".label").data(piedData).enter().append("g").attr("class", "label");

            labelGroups
                .append("circle")
                .attr("cx", 0)
                .attr("cy", 0)
                .attr("r", 2)
                .attr("fill", "#FFFFFF")
                .attr("transform", (d, i) => {
                    return "translate(" + arc.centroid(d) + ")";
                })
                .attr("class", "label-circle");

            labelGroups
                .append("line")
                .attr("x1", (d, i) => {
                    return arc.centroid(d)[0];
                })
                .attr("y1", (d, i) => {
                    return arc.centroid(d)[1];
                })
                .attr("x2", (d, i) => {
                    let centroid = arc.centroid(d);
                    let midAngle = Math.atan2(centroid[1], centroid[0]);
                    let x = Math.cos(midAngle) * (radius - 45);
                    return x;
                })
                .attr("y2", (d, i) => {
                    let centroid = arc.centroid(d);
                    let midAngle = Math.atan2(centroid[1], centroid[0]);
                    let y = Math.sin(midAngle) * (radius - 45);
                    return y;
                })
                .attr("class", "label-line");

            labelGroups
                .append("circle")
                .attr("cx", (d, i) => {
                    let centroid = arc.centroid(d);
                    let midAngle = Math.atan2(centroid[1], centroid[0]);
                    let x = Math.cos(midAngle) * (radius - 45);
                    return x;
                })
                .attr("cy", (d, i) => {
                    let centroid = arc.centroid(d);
                    let midAngle = Math.atan2(centroid[1], centroid[0]);
                    let y = Math.sin(midAngle) * (radius - 45);
                    return y;
                })
                .attr("r", 4)
                .attr("fill", (d, i) => colors(i));

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
                        return `translate(${width / 4 - 55}, ${height / 2 - 15 * (legendIndex++ + 1)})`;
                    }
                })
                .attr("class", "label-circle");

            legendIndex = 0;

            labelGroups
                .append("text")
                .attr("x", (d, i) => {
                    let centroid = arc.centroid(d);
                    let midAngle = Math.atan2(centroid[1], centroid[0]);
                    let x = Math.cos(midAngle) * (radius - 45);
                    let sign = x > 0 ? 1 : -1;
                    let labelX = x + 5 * sign;
                    return labelX;
                })
                .attr("y", (d, i) => {
                    let centroid = arc.centroid(d);
                    let midAngle = Math.atan2(centroid[1], centroid[0]);
                    let y = Math.sin(midAngle) * (radius - 45);
                    return y;
                })
                .attr("stroke", (d, i) => colors(i))
                .attr("text-anchor", (d, i) => {
                    let centroid = arc.centroid(d);
                    let midAngle = Math.atan2(centroid[1], centroid[0]);
                    let x = Math.cos(midAngle) * (radius - 45);
                    return x > 0 ? "start" : "end";
                })
                .attr("class", "label-text")
                .text((d) => {
                    console.log(typeof d.data.percentage);
                    return d.data.percentage !== "0.000" ? d.data.percentage + "%" : "";
                });

            labelGroups
                .append("text")
                .attr("x", "0")
                .attr("y", "5")
                .attr("transform", (d, i) => {
                    if (i < data.length / 2) {
                        return `translate(${-(width / 2 - 70)}, ${height / 2 - 15 * (i + 1)})`;
                    } else {
                        return `translate(${width / 4 - 35}, ${height / 2 - 15 * (legendIndex++ + 1)})`;
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
