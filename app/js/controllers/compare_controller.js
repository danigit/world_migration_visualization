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
        let commonStructure;
        let firsCommonStructureCall = true;
        let firstLineChartStructureCall = true;
        let color;
        let lineChartStructure;

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
        let parseDate = d3.timeParse("%Y");

        /**
         * Function that updates the statistics
         */
        $scope.updateStatisticsLeft = () => {
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
                $scope.leftSendToRight = transformNumberFormat(data.countryOneSend);
                $scope.rightSendToLeft = transformNumberFormat(data.countryTwoSend);
                $scope.$apply();
            });

            dataService
                .getMutualCommonMigrationDestinations(
                    $scope.selectedCountry.left.name,
                    $scope.selectedCountry.right.name,
                    $scope.genreFilterValue
                )
                .then((data) => {
                    if (firsCommonStructureCall) {
                        commonStructure = createCommonMigrationStructure(data);
                        firsCommonStructureCall = false;
                    }
                    drawBarChart(data, commonStructure);
                });

            dataService.getRateOfChange($scope.selectedCountry.left.name, sliderMin, sliderMax, $scope.genreFilterValue).then((data) => {
                data = preprocessRateOfChange(data);
                data.forEach(function (d, i) {
                    d.label = parseDate(d.label.split("-")[1]);
                });
                dataService.getGlobalMinMaxRateOfChange().then((minMax) => {
                    if (firstLineChartStructureCall) {
                        lineChartStructure = initializeLineChart(data, minMax, "change-rate-container");
                        firstLineChartStructureCall = false;
                    }
                    drawLineChart(data, "left-line-chart", "left-line-chart-class");
                });
            });
        };

        let preprocessRateOfChange = (data) => {
            let xLabels = Object.keys(data);
            const reg = /(_\(mf\)|_\(m\)|_\(f\))/;
            xLabels = xLabels.map((label) => label.replace(reg, ""));
            let yValues = Object.values(data).map((value) => +value);
            return xLabels.map((elem, idx) => ({ label: elem, value: yValues[idx] }));
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

            dataService
                .getMutualCommonMigrationDestinations(
                    $scope.selectedCountry.left.name,
                    $scope.selectedCountry.right.name,
                    $scope.genreFilterValue
                )
                .then((data) => {
                    if (firsCommonStructureCall) {
                        commonStructure = createCommonMigrationStructure(data);
                        firsCommonStructureCall = false;
                    }
                    drawBarChart(data, commonStructure);
                });

            dataService.getRateOfChange($scope.selectedCountry.right.name, sliderMin, sliderMax, $scope.genreFilterValue).then((data) => {
                data = preprocessRateOfChange(data);
                data.forEach(function (d, i) {
                    d.label = parseDate(d.label.split("-")[1]);
                });

                dataService.getGlobalMinMaxRateOfChange().then((minMax) => {
                    if (firstLineChartStructureCall) {
                        lineChartStructure = initializeLineChart(data, minMax, "change-rate-container");
                        firstLineChartStructureCall = false;
                    }
                    drawLineChart(data, "right-line-chart", "right-line-chart-class");
                });
            });
        };

        let createCommonMigrationStructure = (data) => {
            let container = d3.select("#common-migration");
            let margins = { top: 20, right: 20, bottom: 60, left: 20 };
            let commonWidth = 500 - margins.left - margins.right;
            let commonHeight = 350 - margins.top - margins.bottom;

            let svg = container
                .append("svg")
                .attr("width", commonWidth)
                .attr("height", commonHeight)
                .attr("class", "background-gray-transparent border-radius-10px padding-10-px");

            svg.append("g").attr("transform", `translate(${margins.left}, ${margins.top})`).attr("class", "main-group");

            let subgroups = ["first", "second"];
            let groups = data.map((d) => d.label);

            let x = d3
                .scaleBand()
                .range([margins.left, commonWidth - margins.right])
                .domain(groups);

            let y = d3
                .scaleLinear()
                .domain([0, d3.max(data, (d) => Math.max(d.value.first[0], d.value.second[0]))])
                .range([commonHeight - margins.top - margins.bottom, 0]);

            let xSubGroup = d3
                .scaleBand()
                .domain(subgroups)
                .range([margins.left + margins.right, x.bandwidth()])
                .padding(0.1);

            color = d3.scaleOrdinal(d3.schemePaired);

            svg.append("g")
                .attr("class", "axis-dark-cyan")
                .attr("transform", `translate(${margins.left}, ${commonHeight - margins.bottom})`)
                .call(d3.axisBottom(x))
                .selectAll("text")
                .style("text-anchor", "start")
                .attr("font-weight", 100)
                .attr("transform", "rotate(45)");

            svg.append("g")
                .attr("class", "grid-lines y-axis")
                .attr("transform", `translate(${margins.left + margins.right}, ${margins.top})`)
                .call(d3.axisLeft(y).tickSize(-commonWidth).tickSizeOuter(0).tickFormat(d3.format(".2s")));

            let svgGroups = svg
                .select(".main-group")
                .selectAll("g")
                .data(data)
                .enter()
                .append("g")
                .attr("transform", (d) => `translate(${x(d.label) - margins.left}, ${0})`)
                .attr("class", "groups");

            let legend = svg
                .selectAll(".legend")
                .data([$scope.selectedCountry.left.visName, $scope.selectedCountry.right.visName])
                .enter()
                .append("g")
                .attr("class", "legend")
                .attr("transform", function (d, i) {
                    return `translate(${-commonWidth + margins.left + margins.right + i * 200}, ${commonHeight - 13} )`;
                });

            legend
                .append("rect")
                .attr("x", commonWidth + 10)
                .attr("width", 10)
                .attr("height", 10)
                .style("fill", (d, i) => color(i));

            legend
                .append("text")
                .attr("x", commonWidth + 40)
                .attr("y", 10)
                .attr("font-size", "small")
                .style("text-anchor", "start")
                .text(function (d) {
                    return d;
                });

            return {
                svgElement: svg,
                groups: svgGroups,
                x: x,
                y: y,
                height: commonHeight,
                width: commonWidth,
                subgroups: subgroups,
                xSubgroup: xSubGroup,
                margins: margins,
            };
        };

        let handleEnter = (enter, svgElement) => {
            console.log("calling enter", enter);
            enter
                .append("rect")
                .style("fill", (d, i) => color(i))
                .attr("x", (d) => svgElement.xSubgroup(d.key))
                .attr("y", svgElement.y(0))
                .attr("width", svgElement.xSubgroup.bandwidth())
                .attr("height", 0);
        };

        let handleLabelsEnter = (enter, svgElement) => {
            enter
                .append("text")
                .attr("stroke", "#FFFFFF")
                .attr("font-size", "10px")
                .attr("x", (d) => svgElement.xSubgroup(d.key))
                .attr("y", svgElement.y(0))
                .text((d) => {
                    console.log(d.percentage);
                    return d.percentage !== "0.00" ? d.percentage : "";
                });
            // .attr("width", svgElement.xSubgroup.bandwidth())
            // .attr("height", 0);
        };

        let handleLabelsUpdate = (update, svgElement) => {
            update
                .transition()
                .duration(1000)
                .attr("y", (d) => svgElement.y(d.val))
                .attr("transform", "rotate(-45, " + svgElement.xSubgroup(d.key) + ", " + svgElement.y(d.val) + ")")
                .attr("text-anchor", "middle")
                .attr("domain-baseline", "central");
        };

        let handleUpdate = (update, data, svgElement) => {
            console.log(data);
            let y = svgElement.y.domain([0, d3.max(data, (d) => Math.max(d.value.first[0], d.value.second[0]))]);
            svgElement.svgElement
                .select("g.grid-lines.y-axis")
                .transition()
                .duration(1000)
                .call(d3.axisLeft(y).tickSize(-svgElement.width).tickSizeOuter(0).tickFormat(d3.format(".2s")));

            update
                .transition()
                .duration(1000)
                .attr("y", (d) => svgElement.y(d.val))
                .attr("height", (d) => svgElement.height - svgElement.margins.bottom - svgElement.margins.top - svgElement.y(d.val));
        };

        let drawBarChart = (data, svgElement) => {
            svgElement.svgElement
                .selectAll(".groups")
                .data(data)
                .selectAll("rect")
                .data(function (d) {
                    return svgElement.subgroups.map(function (k) {
                        return { key: k, val: d.value[k][0], percentage: d.value[k][1] };
                    });
                })
                .join(
                    (enter) => handleEnter(enter, svgElement),
                    (update) => handleUpdate(update, data, svgElement),
                    (exit) => exit.remove()
                );

            // TODO - decide what information to show as labels for the bars
            svgElement.svgElement
                .selectAll(".groups")
                .data(data)
                .selectAll("text")
                .data(function (d) {
                    return svgElement.subgroups.map(function (k) {
                        return { key: k, val: d.value[k][0], percentage: d.value[k][1] };
                    });
                })
                .join
                // (enter) => handleLabelsEnter(enter, svgElement),
                // (update) => handleLabelsUpdate(update, svgElement)
                ();
        };

        /**
         * Function that initialize the svg containing the rate of change lineChart for the selected country
         * @param {string} container
         * @param {object} margin
         * @param {string} lineChartId
         * @returns
         */

        let margin = { top: 20, bottom: 60, left: 20, right: 20 };
        let initializeLineChart = (data, minMax, container) => {
            let lineChartContainer = d3.select("#" + container);

            let width = 500 - margin.left - margin.right;
            let height = 350 - margin.top - margin.bottom;

            let svg = lineChartContainer
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("class", "background-gray-transparent border-radius-10px padding-10-px");

            svg.append("g").attr("transform", `translate(${margin.left}, 0)`).attr("class", "left-line-chart");
            svg.append("g").attr("transform", `translate(${margin.left}, 0)`).attr("class", "right-line-chart");

            console.log(data);
            let xScale = d3
                .scaleTime()
                .domain([d3.timeYear.offset(data[0].label, -1), d3.timeYear.offset(data[5].label, +1)])
                .range([margin.left, width - margin.left - margin.right]);

            let yScale = d3
                .scaleLinear()
                .domain([minMax.MinRateOfChange, minMax.MaxRateOfChange])
                .range([height - margin.bottom - margin.top, 0]);

            svg.append("g")
                .attr("transform", `translate(${margin.left}, ${height - margin.bottom})`)
                .style("font-size", "12px")
                .attr("class", "axis-dark-cyan")
                .call(d3.axisBottom(xScale).ticks(data.length))
                .selectAll("text")
                .attr("transform", "rotate(45)")
                .attr("text-anchor", "start");

            svg.append("g")
                .attr("transform", `translate(${margin.left + margin.right}, ${margin.top})`)
                .style("font-size", "12px")
                .attr("class", "grid-lines y-axis")
                .call(d3.axisLeft(yScale).tickSize(-width).tickSizeOuter(0));

            let legend = svg
                .selectAll(".legend")
                .data([$scope.selectedCountry.left.visName, $scope.selectedCountry.right.visName])
                .enter()
                .append("g")
                .attr("class", "legend")
                .attr("transform", function (d, i) {
                    return `translate(${-width + margin.left + margin.right + i * 200}, ${height - 13} )`;
                });

            let colors = ["#1f78b4", "#a6cee3"];

            legend
                .append("rect")
                .attr("x", width + 10)
                .attr("width", 10)
                .attr("height", 10)
                .style("fill", (d, i) => colors[i]);

            legend
                .append("text")
                .attr("x", width + 40)
                .attr("y", 10)
                .attr("font-size", "small")
                .style("text-anchor", "start")
                .text(function (d) {
                    return d;
                });

            return { lineChartStructure: svg, xScale: xScale, yScale: yScale };
        };

        let drawLineChart = (data, structure, lineClass) => {
            console.log(data);
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
                                    .duration(1000)
                                    .attr("d", (d) => lineGenerator(d))
                            ),
                    //.call(enter => { return isChartDefined ? enter : lineInitialTransition(enter);}),
                    (update) =>
                        update.call((update) =>
                            update
                                .transition()
                                .duration(1000)
                                .attr("d", (d) => lineGenerator(d))
                        ),
                    (exit) => exit.remove()
                );
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
