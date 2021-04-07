(function () {
    "use strict";

    // reloading the angular module
    angular.module("main").controller("compareController", compareController);

    /**
     * Function that handle the compare page logic
     */

    compareController.$inject = ["$scope", "$state", "dataService"];

    function compareController($scope, $state, dataService) {
        $scope.secondaryMenuSelectedValue = "compare";
        $scope.secondaryMenuButtons = dataService.menuButtons;
        $scope.countryInfoTypeButtons = dataService.countryInfoTypeButtons;
        $scope.countryInfoValue = "global_rank";
        $scope.genderButtons = dataService.genderButtons;
        $scope.leftSendToRight;
        $scope.rightSendToLeft;
        $scope.searchSource = "";

        let commonStructure;
        let lineChartStructure;
        let firsCommonStructureCall = true;
        let firstLineChartStructureCall = true;
        let color = d3.scaleOrdinal(d3.schemePaired);
        let countryColors = ["#1f78b4", "#a6cee3"];
        let margins = { top: 20, bottom: 60, left: 20, right: 20 };
        let width = 500 - margins.left - margins.right;
        let height = 300 - margins.top - margins.bottom;

        let sliderMin = 1990;
        let sliderMax = 2019;
        let consideredYears = dataService.getActiveYears(sliderMin, sliderMax);
        let parseDate = d3.timeParse("%Y");

        // object that contain the statistics values for the left countries
        $scope.countryLeftStatisticsValues = {
            totalImmigrations: "",
            totalPopulation: "",
            immigrationVsPopulation: "",
            immigrationAverageAge: "",
            refugeeVsImmigration: "",
        };

        // object that contain the global statistics for the left countries
        $scope.globalRankCountryLeftStatisticsValues = {
            totalImmigrationsGlobalRank: "",
            totalPopulationGlobalRank: "",
            immigrationVsPopulationGlobalRank: "",
            immigrationAverageAgeGlobalRank: "",
            refugeeVsImmigrationGlobalRank: "",
        };

        // object that contain the statistics values for the right countries
        $scope.countryRightStatisticsValues = {
            totalImmigrations: "",
            totalPopulation: "",
            immigrationVsPopulation: "",
            immigrationAverageAge: "",
            refugeeVsImmigration: "",
        };

        // object that contain the global statistics for the right countries
        $scope.globalRankCountryRightStatisticsValues = {
            totalImmigrationsGlobalRank: "",
            totalPopulationGlobalRank: "",
            immigrationVsPopulationGlobalRank: "",
            immigrationAverageAgeGlobalRank: "",
            refugeeVsImmigrationGlobalRank: "",
        };

        // getting the countries from the service
        dataService.countries.then((data) => {
            $scope.countries = data;
            $scope.selectedCountry = {
                left: $scope.countries[0],
                right: $scope.countries[1],
            };

            $scope.genderFilterValue = "menu-all";
            $scope.updateStatisticsLeft();
            $scope.updateStatisticsRight();
            $scope.$apply();
        });

        /**
         * Function that updates the statistics for the left country
         */
        $scope.updateStatisticsLeft = () => {
            dataService
                .getGlobalRankStatistics($scope.selectedCountry.left.name, sliderMin, sliderMax, $scope.genderFilterValue)
                .then((data) => {
                    $scope.globalRankCountryLeftStatisticsValues.totalImmigrationsGlobalRank = setNotAvailable(
                        data.average_tot_migrants_global_rank,
                        true
                    );
                    $scope.globalRankCountryLeftStatisticsValues.totalPopulationGlobalRank = setNotAvailable(
                        data.average_tot_population_global_rank,
                        true
                    );
                    $scope.globalRankCountryLeftStatisticsValues.immigrationVsPopulationGlobalRank = setNotAvailable(
                        data.average_perc_immigration_global_rank,
                        true
                    );
                    $scope.globalRankCountryLeftStatisticsValues.immigrationAverageAgeGlobalRank = setNotAvailable(
                        data.average_age_migrants_global_rank,
                        true
                    );
                    $scope.globalRankCountryLeftStatisticsValues.refugeeVsImmigrationGlobalRank = setNotAvailable(
                        data.average_est_refugees_global_rank,
                        true
                    );
                    $scope.$apply();
                });

            // getting the total migrants by origin and destination
            dataService
                .getTotMigrantsByOriginAndDestination($scope.selectedCountry.left.name, sliderMin, sliderMax, $scope.genderFilterValue)
                .then((data) => {
                    $scope.countryLeftStatisticsValues.totalImmigrations = setNotAvailable(data, false);
                    $scope.$apply();
                });

            // getting the total population by age and sex
            dataService
                .getTotPopulationByAgeAndSex(
                    $scope.selectedCountry.left.name,
                    sliderMin,
                    sliderMax,
                    dataService.getSelectedGenderColumn($scope.genderFilterValue, "Total")
                )
                .then((data) => {
                    $scope.countryLeftStatisticsValues.totalPopulation = setNotAvailable(data, false);
                    $scope.$apply();
                });

            // getting the migrants as percentage of population
            dataService
                .getMigrantsAsPercentageOfPopulationByAgeAndSex(
                    $scope.selectedCountry.left.name,
                    sliderMin,
                    sliderMax,
                    dataService.getSelectedGenderColumn($scope.genderFilterValue, "Total")
                )
                .then((data) => {
                    $scope.countryLeftStatisticsValues.immigrationVsPopulation = setNotAvailable(data, false);
                    $scope.$apply();
                });

            // getting the immigration average ag
            dataService
                .getImmigrationAverageAge(
                    $scope.selectedCountry.left.name,
                    sliderMin,
                    sliderMax,
                    dataService.getSelectedGenderColumn($scope.genderFilterValue, "")
                )
                .then((data) => {
                    $scope.countryLeftStatisticsValues.immigrationAverageAge = setNotAvailable(data, false);
                });

            // getting the estimated refugees
            dataService
                .getEstimatedRefugees(
                    $scope.selectedCountry.left.name,
                    consideredYears,
                    dataService.getSelectedGenderColumn($scope.genderFilterValue, "_pct")
                )
                .then((data) => {
                    $scope.countryLeftStatisticsValues.refugeeVsImmigration = setNotAvailable(data, false);
                    $scope.$apply();
                });

            // getting the mutual migration statistics
            dataService.getMutualMigration($scope.selectedCountry.left.name, $scope.selectedCountry.right.name).then((data) => {
                $scope.leftSendToRight = transformNumberFormat(data.countryOneSend);
                $scope.rightSendToLeft = transformNumberFormat(data.countryTwoSend);
                $scope.$apply();
            });

            // getting the common regions destinations
            dataService
                .getMutualCommonMigrationDestinations(
                    $scope.selectedCountry.left.name,
                    $scope.selectedCountry.right.name,
                    $scope.genderFilterValue
                )
                .then((data) => {
                    if (firsCommonStructureCall) {
                        commonStructure = createCommonMigrationStructure(data);
                        firsCommonStructureCall = false;
                    }
                    drawBarChart(data, commonStructure);
                });

            // getting the rate of change for the right country
            dataService.getRateOfChange($scope.selectedCountry.left.name, sliderMin, sliderMax, $scope.genderFilterValue).then((data) => {
                data = preprocessRateOfChange(data).map((d) => ({ label: parseDate(d.label.split("-")[1]), value: +d.value }));
                dataService.getGlobalMinMaxRateOfChange().then((minMax) => {
                    if (firstLineChartStructureCall) {
                        lineChartStructure = initializeLineChart(data, minMax, "change-rate-container");
                        firstLineChartStructureCall = false;
                    }
                    drawLineChart(data, "left-line-chart", "left-line-chart-class");
                });
            });

            // getting the country migrants age statistics
            dataService
                .getChildBrainDrainStatistics($scope.selectedCountry.left.name, sliderMin, sliderMax, $scope.genderFilterValue)
                .then((data) => {
                    $scope.childLeftStatistics = transformNumberFormat(data["0-14"], false, 0);
                    $scope.childrenLeftPercentage = transformNumberFormat((data["0-14"] / data["Total"]) * 100, false, 0);
                    $scope.totalLeftMigrants = transformNumberFormat(data["Total"], false, 0);
                    $scope.brainDrainLeftStatistics = transformNumberFormat(data["20-34"], false, 0);
                    $scope.drainBrainLeftPercentage = transformNumberFormat((data["20-34"] / data["Total"]) * 100, false, 0);
                });
        };

        $scope.updateStatisticsRight = () => {
            // getting the ranking statistics
            dataService
                .getGlobalRankStatistics($scope.selectedCountry.right.name, sliderMin, sliderMax, $scope.genderFilterValue)
                .then((data) => {
                    $scope.globalRankCountryRightStatisticsValues.totalImmigrationsGlobalRank = setNotAvailable(
                        data.average_tot_migrants_global_rank,
                        true
                    );
                    $scope.globalRankCountryRightStatisticsValues.totalPopulationGlobalRank = setNotAvailable(
                        data.average_tot_population_global_rank,
                        true
                    );
                    $scope.globalRankCountryRightStatisticsValues.immigrationVsPopulationGlobalRank = setNotAvailable(
                        data.average_perc_immigration_global_rank,
                        true
                    );
                    $scope.globalRankCountryRightStatisticsValues.immigrationAverageAgeGlobalRank = setNotAvailable(
                        data.average_age_migrants_global_rank,
                        true
                    );
                    $scope.globalRankCountryRightStatisticsValues.refugeeVsImmigrationGlobalRank = setNotAvailable(
                        data.average_est_refugees_global_rank,
                        true
                    );
                    $scope.$apply();
                });

            // getting total migration by origin and destination statistics
            dataService
                .getTotMigrantsByOriginAndDestination($scope.selectedCountry.right.name, sliderMin, sliderMax, $scope.genderFilterValue)
                .then((data) => {
                    $scope.countryRightStatisticsValues.totalImmigrations = setNotAvailable(data, false);
                    $scope.$apply();
                });

            // getting the total population by age and sex
            dataService
                .getTotPopulationByAgeAndSex(
                    $scope.selectedCountry.right.name,
                    sliderMin,
                    sliderMax,
                    dataService.getSelectedGenderColumn($scope.genderFilterValue, "Total")
                )
                .then((data) => {
                    $scope.countryRightStatisticsValues.totalPopulation = setNotAvailable(data, false);
                    $scope.$apply();
                });

            // getting the migrants as percentage of population
            dataService
                .getMigrantsAsPercentageOfPopulationByAgeAndSex(
                    $scope.selectedCountry.right.name,
                    sliderMin,
                    sliderMax,
                    dataService.getSelectedGenderColumn($scope.genderFilterValue, "Total")
                )
                .then((data) => {
                    $scope.countryRightStatisticsValues.immigrationVsPopulation = setNotAvailable(data, false);
                    $scope.$apply();
                });

            // getting the immigration average ag
            dataService
                .getImmigrationAverageAge(
                    $scope.selectedCountry.right.name,
                    sliderMin,
                    sliderMax,
                    dataService.getSelectedGenderColumn($scope.genderFilterValue, "")
                )
                .then((data) => {
                    $scope.countryRightStatisticsValues.immigrationAverageAge = setNotAvailable(data, false);
                });

            // getting the estimated refugees
            dataService
                .getEstimatedRefugees(
                    $scope.selectedCountry.right.name,
                    consideredYears,
                    dataService.getSelectedGenderColumn($scope.genderFilterValue, "_pct")
                )
                .then((data) => {
                    $scope.countryRightStatisticsValues.refugeeVsImmigration = setNotAvailable(data, false);
                    $scope.$apply();
                });

            // getting the mutual migration statistics
            dataService.getMutualMigration($scope.selectedCountry.left.name, $scope.selectedCountry.right.name).then((data) => {
                $scope.leftSendToRight = transformNumberFormat(data.countryOneSend);
                $scope.rightSendToLeft = transformNumberFormat(data.countryTwoSend);
                $scope.$apply();
            });

            // getting the statistics for the common regions migration
            dataService
                .getMutualCommonMigrationDestinations(
                    $scope.selectedCountry.left.name,
                    $scope.selectedCountry.right.name,
                    $scope.genderFilterValue
                )
                .then((data) => {
                    if (firsCommonStructureCall) {
                        commonStructure = createCommonMigrationStructure(data);
                        firsCommonStructureCall = false;
                    }
                    drawBarChart(data, commonStructure);
                });

            // getting the migration rate of change for the left country
            dataService.getRateOfChange($scope.selectedCountry.right.name, sliderMin, sliderMax, $scope.genderFilterValue).then((data) => {
                data = preprocessRateOfChange(data).map((d) => ({ label: parseDate(d.label.split("-")[1]), value: d.value }));
                dataService.getGlobalMinMaxRateOfChange().then((minMax) => {
                    if (firstLineChartStructureCall) {
                        lineChartStructure = initializeLineChart(data, minMax, "change-rate-container");
                        firstLineChartStructureCall = false;
                    }
                    drawLineChart(data, "right-line-chart", "right-line-chart-class");
                });
            });

            dataService
                .getChildBrainDrainStatistics($scope.selectedCountry.right.name, sliderMin, sliderMax, $scope.genderFilterValue)
                .then((data) => {
                    $scope.childRightStatistics = transformNumberFormat(data["0-14"], false, 0);
                    $scope.childrenRightPercentage = transformNumberFormat((data["0-14"] / data["Total"]) * 100, false, 0);
                    $scope.brainDrainRightStatistics = transformNumberFormat(data["20-34"], false, 0);
                    $scope.drainBrainRightPercentage = transformNumberFormat((data["20-34"] / data["Total"]) * 100, false, 0);
                    $scope.totalRightMigrants = transformNumberFormat(data["Total"], false, 0);
                });
        };

        /**
         * Function that creates the svg structure for drawing the common regions grouped bar chart statistics
         * @param {array} data
         * @returns
         */
        let createCommonMigrationStructure = (data) => {
            let container = d3.select("#common-migration");

            let svg = container
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("class", "background-gray-transparent border-radius-10px padding-10-px");

            svg.append("g").attr("transform", `translate(${margins.left}, ${margins.top})`).attr("class", "main-group");

            let subgroups = ["left", "right"];
            let groups = data.map((d) => d.label);

            // creating the x axis
            let x = d3
                .scaleBand()
                .range([margins.left, width - margins.right])
                .domain(groups);

            // creating the y axis
            let y = d3
                .scaleLinear()
                .domain([0, d3.max(data, (d) => Math.max(d.value.left[0], d.value.right[0]))])
                .range([height - margins.top - margins.bottom, 0]);

            // creating the subgroups
            let xSubGroup = d3
                .scaleBand()
                .domain(subgroups)
                .range([margins.left, x.bandwidth() + margins.right])
                .padding(0.2);

            // creating the bars labels container
            svg.append("g")
                .attr("class", "axis-dark-cyan")
                .attr("transform", `translate(${margins.left}, ${height - margins.bottom})`)
                .call(d3.axisBottom(x))
                .selectAll("text")
                .attr("transform", "rotate(25)")
                .attr("text-anchor", "start");

            // inserting the x axis
            svg.append("g")
                .attr("class", "grid-lines y-axis")
                .attr("transform", `translate(${margins.left + margins.right}, ${margins.top})`)
                .call(d3.axisLeft(y).tickSize(-width).tickSizeOuter(0).tickFormat(d3.format(".2s")));

            let svgGroups = svg
                .select(".main-group")
                .selectAll("g")
                .data(data)
                .enter()
                .append("g")
                .attr("transform", (d) => `translate(${x(d.label) - margins.left}, 0)`)
                .attr("class", "groups");

            let legend = svg
                .selectAll(".legend")
                .data([$scope.selectedCountry.left.visName, $scope.selectedCountry.right.visName])
                .enter()
                .append("g")
                .attr("class", "legend")
                .attr("transform", (_, i) => `translate(${-width + margins.left + margins.right + i * 200}, ${height - 13} )`);

            legend
                .append("rect")
                .attr("x", width + 10)
                .attr("width", LEGEND_SQUARE_DIM)
                .attr("height", LEGEND_SQUARE_DIM)
                .style("fill", (_, i) => color(i));

            legend
                .append("text")
                .attr("x", width + 40)
                .attr("y", LEGEND_SQUARE_DIM)
                .attr("font-size", "small")
                .style("text-anchor", "start")
                .text((d) => d);

            return {
                svgElement: svg,
                groups: svgGroups,
                x: x,
                y: y,
                subgroups: subgroups,
                xSubgroup: xSubGroup,
            };
        };

        /**
         * Function that handles the enter set for the common migration grouped bar chart
         * @param {array} enter
         * @param {object} svgElement
         */
        let handleCommonMigrationEnter = (enter, svgElement) => {
            enter
                .append("rect")
                .style("fill", (_, i) => color(i))
                .attr("x", (d) => svgElement.xSubgroup(d.key))
                .attr("y", svgElement.y(0))
                .attr("width", svgElement.xSubgroup.bandwidth())
                .attr("height", 0);
        };

        /**
         * Function that handles the update set for the common migration grouped bar chart
         * @param {array} update
         * @param {number} yMax
         * @param {object} svgElement
         */
        let handleCommonMigrationUpdate = (update, yMax, svgElement) => {
            let y = svgElement.y.domain([0, yMax]);
            svgElement.svgElement
                .select("g.grid-lines.y-axis")
                .transition()
                .duration(TRANSITION_DURATION)
                .call(d3.axisLeft(y).tickSize(-width).tickSizeOuter(0).tickFormat(d3.format(".2s")));

            update
                .transition()
                .duration(TRANSITION_DURATION)
                .attr("y", (d) => svgElement.y(d.val))
                .attr("height", (d) => height - margins.bottom - margins.top - svgElement.y(d.val));
        };

        /**
         * Function that handles the enter set for the labels of the common migration bar chart
         * @param {array} enter
         * @param {object} svgElement
         */
        let handleCommonMigrationLabelsEnter = (enter, svgElement) => {
            enter
                .append("text")
                .attr("stroke", "#FFFFFF")
                .attr("stroke-width", 1)
                .attr("font-size", "10px")
                .attr("x", (d) => svgElement.xSubgroup(d.key))
                .attr("y", svgElement.y(0))
                .text((d) => transformNumberFormat(d.val, false, 0));
        };

        /**
         * Function that handles the update set for the labels of the common migration bar chart
         * @param {array} update
         * @param {object} svgElement
         */
        let handleCommonMigrationLabelsUpdate = (update, svgElement) => {
            update
                .transition()
                .duration(TRANSITION_DURATION)
                .attr("y", (d) => svgElement.y(d.val))
                .text((d) => transformNumberFormat(d.val, false, 0))
                .attr(
                    "transform",
                    (d) => `rotate(-25, ${svgElement.xSubgroup(d.key)},
                        ${svgElement.y(d.val) - svgElement.xSubgroup.bandwidth() / 2})`
                );
        };

        /**
         * Function that draws the common migration bar chart
         * @param {array} data
         * @param {object} svgElement
         */
        let drawBarChart = (data, svgElement) => {
            let yMax = d3.max(data, (d) => Math.max(d.value.left[0], d.value.right[0]));

            // drawing the bars
            svgElement.svgElement
                .selectAll(".groups")
                .data(data)
                .selectAll("rect")
                .data((d) => svgElement.subgroups.map((k) => ({ key: k, val: d.value[k][0], percentage: d.value[k][1] })))
                .join(
                    (enter) => handleCommonMigrationEnter(enter, svgElement),
                    (update) => handleCommonMigrationUpdate(update, yMax, svgElement),
                    (exit) => exit.remove()
                );

            // setting the labels for the bars
            svgElement.svgElement
                .selectAll(".groups")
                .data(data)
                .selectAll("text")
                .data((d) => svgElement.subgroups.map((k) => ({ key: k, val: d.value[k][0], percentage: d.value[k][1] })))
                .join(
                    (enter) => handleCommonMigrationLabelsEnter(enter, svgElement),
                    (update) => handleCommonMigrationLabelsUpdate(update, svgElement),
                    (exit) => exit.remove()
                );
        };

        /**
         * Function that initialize the svg containing for the rate of change lineChart for the selected country
         * @param {string} container
         * @param {object} margin
         * @param {string} lineChartId
         * @returns
         */
        let initializeLineChart = (data, minMax, container) => {
            let lineChartContainer = d3.select("#" + container);

            let svg = lineChartContainer
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("class", "background-gray-transparent border-radius-10px padding-10-px");

            svg.append("g").attr("transform", `translate(${margins.left}, 0)`).attr("class", "left-line-chart");
            svg.append("g").attr("transform", `translate(${margins.left}, 0)`).attr("class", "right-line-chart");

            let xScale = d3
                .scaleTime()
                .domain([d3.timeYear.offset(data[0].label, -1), d3.timeYear.offset(data[5].label, +1)])
                .range([margins.left, width - margins.right - 15]);

            let yScale = d3
                .scaleLinear()
                .domain([minMax.MinRateOfChange, minMax.MaxRateOfChange])
                .range([height - margins.bottom - margins.top, 0]);

            svg.append("g")
                .attr("transform", `translate(${margins.left}, ${height - margins.bottom})`)
                .style("font-size", "10px")
                .attr("class", "axis-dark-cyan")
                .call(d3.axisBottom(xScale).ticks(data.length))
                .selectAll("text")
                .attr("transform", "rotate(25)")
                .attr("text-anchor", "start");

            svg.append("g")
                .attr("transform", `translate(${margins.left + margins.right}, ${margins.top})`)
                .style("font-size", "10px")
                .attr("class", "grid-lines y-axis")
                .call(d3.axisLeft(yScale).tickSize(-width).tickSizeOuter(0).ticks(8));

            // inserting the circles
            svg.append("g").attr("transform", `translate(${margins.left}, 0)`).attr("class", "year-circles");

            let legend = svg
                .selectAll(".legend")
                .data([$scope.selectedCountry.left.visName, $scope.selectedCountry.right.visName])
                .enter()
                .append("g")
                .attr("class", "legend")
                .attr("transform", (_, i) => `translate(${-width + margins.left + margins.right + i * 200}, ${height - 13} )`);

            legend
                .append("rect")
                .attr("x", width + LEGEND_SQUARE_DIM)
                .attr("width", LEGEND_SQUARE_DIM)
                .attr("height", LEGEND_SQUARE_DIM)
                .style("fill", (_, i) => countryColors[i]);

            legend
                .append("text")
                .attr("x", width + 40)
                .attr("y", LEGEND_SQUARE_DIM)
                .attr("font-size", "small")
                .style("text-anchor", "start")
                .text((d) => d);

            return { lineChartStructure: svg, xScale: xScale, yScale: yScale };
        };

        /**
         * Function that creates the svg structure for the line chart plot
         * @param {array} data
         * @param {object} structure
         * @param {string} lineClass
         */
        let drawLineChart = (data, structure, lineClass) => {
            let lineGenerator = d3
                .line()
                .x((d) => lineChartStructure.xScale(d.label))
                .y((d) => lineChartStructure.yScale(d.value));

            lineChartStructure.lineChartStructure
                .select("." + structure)
                .selectAll("path")
                .data([data])
                .join(
                    (enter) =>
                        enter
                            .append("path")
                            .attr("class", lineClass)
                            .call((enter) =>
                                enter
                                    .transition()
                                    .duration(TRANSITION_DURATION)
                                    .attr("d", (d) => lineGenerator(d))
                            ),
                    (update) =>
                        update.call((update) =>
                            update
                                .transition()
                                .duration(TRANSITION_DURATION)
                                .attr("d", (d) => lineGenerator(d))
                        ),
                    (exit) => exit.remove()
                );

            lineChartStructure.lineChartStructure
                .select(".year-circles")
                .selectAll("." + lineClass + "year-circle")
                .data(data)
                .join(
                    (enter) => {
                        enter
                            .append("circle")
                            .attr("class", lineClass + "year-circle " + lineClass)
                            .attr("fill", "none")
                            .attr("stroke", countryColors[0])
                            .attr("cx", (d) => lineChartStructure.xScale(d.label))
                            .attr("cy", (d) => lineChartStructure.yScale(d.value))
                            .attr("r", 3);
                    },
                    (update) =>
                        update
                            .transition()
                            .duration(TRANSITION_DURATION)
                            .attr("cx", (d) => lineChartStructure.xScale(d.label))
                            .attr("cy", (d) => lineChartStructure.yScale(d.value)),
                    (exit) => exit.remove()
                );
        };

        /**
         * Function that controls the winner country for what concern the statistics comparison
         * @param {string} field
         * @param {boolean} left
         * @param {string} type
         * @returns
         */
        $scope.comparisonWinner = (field, left, type) => {
            if (left) {
                if (type == "rank") {
                    return (
                        parseInt($scope.globalRankCountryLeftStatisticsValues[field], 10) <
                        parseInt($scope.globalRankCountryRightStatisticsValues[field], 10)
                    );
                } else {
                    return (
                        parseInt($scope.countryLeftStatisticsValues[field], 10) < parseInt($scope.countryRightStatisticsValues[field], 10)
                    );
                }
            } else {
                if (type == "rank") {
                    return (
                        parseInt($scope.globalRankCountryRightStatisticsValues[field], 10) <
                        parseInt($scope.globalRankCountryLeftStatisticsValues[field], 10)
                    );
                } else
                    return (
                        parseInt($scope.countryRightStatisticsValues[field], 10) < parseInt($scope.countryLeftStatisticsValues[field], 10)
                    );
            }
        };

        /**
         * Function that handles the click on the gender radio group filter in the menu
         * @param {string} value
         */
        $scope.handleGenderClick = function (value) {
            $scope.genderFilterValue = value;
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

        /**
         * Function that stops the propagation of the event passed as parameter
         * @param {event} event
         */
        $scope.updateSearch = (event) => {
            event.stopPropagation();
        };
    }
})();
