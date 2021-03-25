(function () {
    "use strict";

    // reloading the angular module
    angular.module("main").controller("countryController", countryController);

    /**
     * Function that handle the country page logic
     */

    countryController.$inject = ["$scope", "$state", "dataService", "countryService", "$stateParams"];

    function countryController($scope, $state, dataService, countryService, $stateParams) {
        $scope.countryInfoValue = "global_rank";
        $scope.selectedTopCountry = "";
        $scope.continents = dataService.continents;

        dataService.countries.then((data) => {
            $scope.countries = data;

            let countryName = $stateParams.name;
            let selectedCountry = data.find((c) =>
                    countryName === c.visName.toLowerCase())

            if (selectedCountry) {
                dataService.selectedCountryController = selectedCountry;
            } else {
                dataService.selectedCountryController = "";
                $state.go($state.current, { name: null });
            }

            $scope.selectedCountryController = dataService.selectedCountryController == ""
                    ? $scope.countries[0]
                    : dataService.selectedCountryController;

            $scope.genreFilterValue = "menu-all";
            $scope.updateStatistics();
        });

        $scope.secondaryMenuSelectedValue =
            dataService.secondaryMenuSelectedValue != "" ? dataService.secondaryMenuSelectedValue : "country";
        $scope.secondaryMenuButtons = dataService.menuButtons;
        $scope.genreButtons = dataService.genreButtons;
        $scope.countryInfoTypeButtons = dataService.countryInfoTypeButtons;
        $scope.countryStatisticsValues = {
            totalImmigrations: "",
            totalPopulation: "",
            immigrationVsPopulation: "",
            immigrationAverageAge: "",
            refugeeVsImmigration: "",
        };
        $scope.globalRankCountryStatisticsValues = {
            totalImmigrationsGlobalRank: "",
            totalPopulationGlobalRank: "",
            immigrationVsPopulationGlobalRank: "",
            immigrationAverageAgeGlobalRank: "",
            refugeeVsImmigrationGlobalRank: "",
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
            return dataService.getActiveYears(sliderMin, sliderMax);
        };

        // getting the years selected in the slider
        let consideredYears = getSliderYears();

        // watcher that listens for the slider updates
        $scope.$on("slideEnded", () => {
            sliderMin = $scope.sliderCountry.minValue;
            sliderMax = $scope.sliderCountry.maxValue;
            consideredYears = getSliderYears();
            $scope.updateStatistics();
        });

        /**
         * Function that updates the statistics
         */
        $scope.updateStatistics = () => {
            console.log('Selected new country:');
            console.log($scope.selectedCountryController);

            dataService.selectedCountryController = $scope.selectedCountryController;

            // getting the total migrants by origin and destination
            dataService
                .getTotMigrantsByOriginAndDestination($scope.selectedCountryController.name, sliderMin, sliderMax, $scope.genreFilterValue)
                .then((data) => {
                    $scope.countryStatisticsValues.totalImmigrations = "" + transformNumberFormat(data);
                    $scope.$apply();
                });

            // $scope.selectedCountryController, sliderMin, sliderMax
        dataService
            .getGlobalRankStatistics(
                sliderMin, sliderMax,
                $scope.genreFilterValue
            )
            .then(data => {

                let countryData = data.filter(obj => obj.name==$scope.selectedCountryController.name)[0];

                let avgEstRefGlobalRank = "";
                if (isNaN(countryData.average_est_refugees_global_rank)) {
                    avgEstRefGlobalRank = "Not available";
                } else {
                    avgEstRefGlobalRank = "" + transformNumberFormat(countryData.average_est_refugees_global_rank, true);
                }

                $scope.globalRankCountryStatisticsValues.totalImmigrationsGlobalRank = 
                    "" + transformNumberFormat(countryData.average_tot_migrants_global_rank, true);

                $scope.globalRankCountryStatisticsValues.totalPopulationGlobalRank = 
                    "" + transformNumberFormat(countryData.average_tot_population_global_rank, true);

                $scope.globalRankCountryStatisticsValues.immigrationVsPopulationGlobalRank = 
                    "" + transformNumberFormat(countryData.average_perc_immigration_global_rank, true);

                $scope.globalRankCountryStatisticsValues.immigrationAverageAgeGlobalRank = 
                    "" + transformNumberFormat(countryData.average_age_migrants_global_rank, true);

                $scope.globalRankCountryStatisticsValues.refugeeVsImmigrationGlobalRank = avgEstRefGlobalRank;
                
                $scope.$apply();
            });

        
            // getting the total population by age and sex
            dataService
                .getTotPopulationByAgeAndSex(
                    $scope.selectedCountryController.name,
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
                    $scope.selectedCountryController.name,
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
                    $scope.selectedCountryController.name,
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
                    $scope.selectedCountryController.name,
                    consideredYears,
                    dataService.getSelectedGenderColumn($scope.genreFilterValue, "_pct")
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
                .getCountryDevelopmentStatistic($scope.selectedCountryController.name, consideredYears, $scope.genreFilterValue)
                .then((data) => {
                    drawPieChart(data, "development-piechart");
                });

            dataService
                .getCountryIncomeStatistic($scope.selectedCountryController.name, consideredYears, $scope.genreFilterValue)
                .then((data) => {
                    drawPieChart(data, "income-piechart");
                });

            const getDummyData = new Promise((resolve, _) => {
                const dummyData = [
                    { Year: "2006", Delicious: "10", McIntosh: "15", Oranges: "9", Pears: "6" },
                    { Year: "2007", Delicious: "12", McIntosh: "18", Oranges: "9", Pears: "4" },
                    { Year: "2008", Delicious: "05", McIntosh: "20", Oranges: "8", Pears: "2" },
                    { Year: "2009", Delicious: "01", McIntosh: "15", Oranges: "5", Pears: "4" },
                    { Year: "2010", Delicious: "02", McIntosh: "10", Oranges: "4", Pears: "2" },
                    { Year: "2011", Delicious: "03", McIntosh: "12", Oranges: "6", Pears: "3" },
                    { Year: "2012", Delicious: "04", McIntosh: "15", Oranges: "8", Pears: "1" },
                    { Year: "2013", Delicious: "06", McIntosh: "11", Oranges: "9", Pears: "4" },
                    { Year: "2014", Delicious: "10", McIntosh: "13", Oranges: "9", Pears: "5" },
                    { Year: "2015", Delicious: "16", McIntosh: "19", Oranges: "6", Pears: "9" },
                    { Year: "2016", Delicious: "19", McIntosh: "17", Oranges: "5", Pears: "7" },
                ];
    
                resolve(dummyData);
            });
    
            getDummyData.then((data) =>
                    drawAgeStackedBarchart(data, "age-stacked-barchart"));

            countryService.getTopCountries($scope.selectedCountryController.name,
                sliderMin, sliderMax,
                $scope.genreFilterValue).then((data) => {
                    const topCountries = data;

                    $scope.top5InwardCountries  = topCountries['topInward'];
                    $scope.top5OutwardCountries = topCountries['topOutward'];
                    
                    $scope.$apply();
                });
        };

        const arcTweenEnter = (d, arc) => {
            var i = d3.interpolate(d.endAngle, d.startAngle);

            return (t) => {
                d.startAngle = i(t);
                return arc(d);
            };
        };

        const arcTweenUpdate = (d, i, n, arc) => {
            var interpolate = d3.interpolate(n[i]._current, d);

            console.log("update function");
            n[i]._current = d;
            return (t) => {
                return arc(interpolate(t));
            };
        };

        let drawPieChart = (data, container) => {
            const developmentContainer = d3.select("#" + container);
            developmentContainer.html("");
            const developmentContainerDim = developmentContainer.node().getBoundingClientRect();
            const width = developmentContainerDim.width;
            const height = developmentContainerDim.height;

            const svg = developmentContainer.append("svg").attr("width", width).attr("height", height);
            const pieChartGroup = svg
                .append("g")
                .attr("class", "slices")
                .attr("transform", `translate(${width / 2}, ${height / 2})`);
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
                .selectAll("path")
                .data(piedData)
                .join(
                    (enter) => {
                        enter
                            .append("path")
                            .attr("class", "arc")
                            .style("stroke", "white")
                            .style("fill", (d, i) => colors(i))
                            .each((d) => (this._current = d))
                            .transition()
                            .duration(1000)
                            .attrTween("d", (d) => arcTweenEnter(d, arc));
                    },
                    (update) =>
                        update
                            .transition()
                            .duration(1000)
                            .attrTween("d", (d, i, n) => arcTweenUpdate(d, i, n, arc)),
                    (exit) => exit.remove()
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
                    if (d.value == 0) return arc.centroid[0];
                    let centroid = arc.centroid(d);
                    let midAngle = Math.atan2(centroid[1], centroid[0]);
                    let x = Math.cos(midAngle) * (radius - 45);
                    return x;
                })
                .attr("y2", (d, i) => {
                    if (d.value == 0) return arc.centroid[1];
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
                .attr("r", (d) => (d.value !== 0 ? 4 : 0))
                .attr("fill", (d, i) => colors(i));

            labelGroups
                .append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("rx", 0)
                .attr("ry", 0)
                .attr("width", 12)
                .attr("height", 12)
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
                    return d.data.percentage !== "0.0" ? d.data.percentage + "%" : "";
                });

            labelGroups
                .append("text")
                .attr("x", 0)
                .attr("y", 6)
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

        let drawAgeStackedBarchart = (data, containerId) => {
            const containerElem = d3.select("#" + containerId);
            containerElem.html("");

            const containerDims = containerElem.node().getBoundingClientRect();

            const legendMargin = 15;

            // Stack up the data
            const subgroups = Object.keys(data[0]).slice(1);
            const groups = d3.map(data, d => +d.Year);

            const stackedData = d3.stack().keys(
                subgroups)(data);

            // Setup Bostock's margin convention
            const svgMargins = { top: 48, right: 32, left: 32,
                    bottom: 96 + Math.floor(subgroups.length/3)*legendMargin }; // Legend labels are stacked at
                                                                                // the bottom in 3 separate columns

            const svgWidth  = containerDims.width
                    - svgMargins.left - svgMargins.right;

            const svgHeight = containerDims.height
                    - svgMargins.top  - svgMargins.bottom;

            const containerWidth  = svgWidth  + svgMargins.left
                    + svgMargins.right;

            const containerHeight = svgHeight + svgMargins.top
                    + svgMargins.bottom;

            const svgElem = containerElem.append("svg")
                    .attr("width",  containerWidth)
                    .attr("height", containerHeight)
                .append("g")
                    .attr("transform", "translate(" + svgMargins.left + "," + svgMargins.top + ")");

            const timeFormat = d3.timeFormat("%Y").parse;

            // Set all the scales
            let xScale = d3.scaleBand()
                .domain(groups)
                .rangeRound([4, svgWidth-2])
                .padding(0.02);

            let yScale = d3.scaleLinear()
                .domain([0, d3.max(stackedData, layerData =>
                    d3.max(layerData, d => d[1]))])
                .range([svgHeight, 0]);

            const colorScale = d3.scaleOrdinal(d3.schemePaired
                    .slice(0, subgroups.length));

            // Define and draw axes
            const yAxis = d3.axisLeft()
                .scale(yScale)
                .tickSize(-svgWidth, 0, 0)
                .tickFormat(d => d + "%");

            const xAxis = d3.axisBottom()
                .scale(xScale)
                .tickFormat(timeFormat);

            const yAxis_group = svgElem.append("g")
                    .classed("y", true)
                    .classed("axis", true)
                .call(yAxis);

            yAxis_group.selectAll(".tick line").remove();

            svgElem.append("g")
                    .classed("x", true)
                    .classed("axis", true)
                    .attr("transform", "translate(0," + svgHeight + ")")
                .call(xAxis);

            // Create groups for each series
            const groupsElem = svgElem.selectAll("g.age-group")
                .data(stackedData)
                .enter()
                    .append("g")
                        .classed("age-group", true)
                        .style("fill", (_, i) => colorScale(i));

            // Create the hover tooltip
            const tooltipElem = svgElem.append("g")
                    .classed("age-stacked-barchart-tooltip", true)
                    .classed("hide", true);

            tooltipElem.append("rect")
                    .attr("width", 30)
                    .attr("height", 20)
                    .attr("fill", "white")
                    .style("opacity", 0.5);

            tooltipElem.append("text")
                    .attr("x", 15)
                    .attr("dy", "1.2em")
                    .style("text-anchor", "middle")
                    .attr("font-size", "12px")
                    .attr("font-weight", "bold");

            // Create rects for each segment
            groupsElem.selectAll("rect")
                .data(d => d)
                .enter()
                    .append("rect")
                        .attr("x", d => xScale(+d.data.Year))
                        .attr("y", d => yScale(d[1]))
                        .attr("height", d => yScale(d[0]) - yScale(d[1]))
                        .attr("width", xScale.bandwidth())
                    .on("mouseover", () => tooltipElem.classed("hide", false))
                    .on("mouseout",  () => tooltipElem.classed("hide", true))
                    .on("mousemove", (e, d) => {
                        let xPos = d3.pointer(e)[0] - 15;
                        let yPos = d3.pointer(e)[1] - 25;

                        // Make the tooltip follow the mouse movement
                        // while hovering onto a rect
                        tooltipElem.attr("transform",
                                "translate(" + xPos + "," + yPos + ")");
                        tooltipElem.select("text").text(d[1] - d[0]);
                    });

            const getLegendTranslation = (datumId) => {
                const horizDelta = 16;
                const vertDelta  = 16;

                // Get legend row/col Id
                const r = Math.floor(datumId / 3);
                const c = datumId % 3;

                switch(c) {
                    case 0: return `translate(${-(svgWidth + horizDelta)},
                            ${svgHeight + vertDelta + legendMargin*(r + 1)})`;

                    case 1: return `translate(${-(svgWidth/2 + 2*horizDelta)},
                            ${svgHeight + vertDelta + legendMargin*(r + 1)})`;

                    case 2: return `translate(${-(0 + 4*horizDelta)},
                            ${svgHeight + vertDelta + legendMargin*(r + 1)})`;
                }
            };

            // Draw layers legend
            const legendElem = svgElem.selectAll(".legend")
                .data(colorScale.range())
                .enter().append("g")
                    .classed("age-stacked-barchart-legend", true)
                    .attr("width", 50)
                    .attr("height", 12)
                    // .attr("transform", (_, i) => "translate("
                    //         + i*legendMargin +",30)")
                    .attr("transform", (_, i) => getLegendTranslation(i))
            
            legendElem
                .append("rect")
                    .attr("x", svgWidth - 12)
                    .attr("width", 12)
                    .attr("height", 12)
                    .attr("stroke", "white")
                    .style("fill", (_, i) => colorScale(i));
            
            legendElem
                .append("text")
                    .attr("x", svgWidth + 5)
                    .attr("y", 7)
                    .classed("label-text", true)
                    .attr("dy", "-0em")
                    .style("text-anchor", "start")
                .text((_, i) => { switch(i) {
                    case 0: return "Anjou pears";
                    case 1: return "Naval oranges";
                    case 2: return "McIntosh apples";
                    case 3: return "Red Delicious apples";
                }});
        };

        /**
         * Function that handles the click on the genre radio group filter in the menu
         * @param {string} value
         */
        $scope.handleGenreClick = function (value) {
            $scope.genreFilterValue = value;
            $scope.updateStatistics();
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
            $scope.updateStatistics();
        };

        /**
         * Function that handles the mouse enter on the top countries flags
         * @param {string} value
         */
        $scope.showTopCountryHint = function (value, event, type) {
            $scope.selectedTopFlag = value;
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
