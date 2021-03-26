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
            $scope.updateStatistics();
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
            return [1990, 1995, 2000, 2005, 2010, 2015, 2019].filter((year) => year >= +sliderMin && year <= +sliderMax);
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
            // getting the total migrants by origin and destination
            dataService
                .getTotMigrantsByOriginAndDestination($scope.selectedCountryController, sliderMin, sliderMax, $scope.genreFilterValue)
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

                let countryData = data.filter(obj => obj.name==$scope.selectedCountryController)[0];

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

            dataService
                .getRateOfChange($scope.selectedCountryController, sliderMin, sliderMax, $scope.genreFilterValue)
                .then((data) => {
                    let xLabels = Object.keys(data);
                    const reg = /(_\(mf\)|_\(m\)|_\(f\))/;
                    xLabels = xLabels.map(label => label.replace(reg, ''));
                    let yValues = Object.values(data).map(value => +value);
                    data = xLabels.map((elem, idx) => ({label:elem, value:yValues[idx]}))
                    dataService.getGlobalMinMaxRateOfChange()
                        .then(minMax => {
                            drawLineChart(data, "roc-linechart-country", minMax.MinRateOfChange, 
                                minMax.MaxRateOfChange, lineChartMargin, lineChartWidthHeight.width, lineChartWidthHeight.height);
                        });
                });
        };

        let initializeLineChart = (container, margin, lineChartId) => {
            
            let rateOfChangeLineChartContainer = d3.select("#" + container);
            rateOfChangeLineChartContainer.html("");

            let rateOfChangeLineChartContainerDim = rateOfChangeLineChartContainer.node().getBoundingClientRect();
            let width = rateOfChangeLineChartContainerDim.width - margin.left - margin.right;
            let height = rateOfChangeLineChartContainerDim.height - margin.top - margin.bottom;

            let svg =  rateOfChangeLineChartContainer
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .attr("id", lineChartId + "-svg");
            
                // .attr("class", "country-linechart")
            svg.append("g")
                .attr("id", lineChartId)
                .attr("class", "country-linechart");

            return {"width": width, "height": height};

        }
        
        const arcTweenEnter = (d, arc) => {
            var i = d3.interpolate(d.endAngle, d.startAngle);

            console.log("enter function");
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
                    return d.data.percentage !== "0.0" ? d.data.percentage + "%" : "";
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

        let drawLineChart = (data, lineChartId, globalMinY, globalMaxY, margin, lineChartWidth, lineChartHeight) => {

            let xScale = d3.scalePoint()
                .domain(data.map(rateOfChange => rateOfChange.label))
                .range([margin.left + margin.right, lineChartWidth]);

            let yScale = d3.scaleLinear()
                .domain([globalMinY, globalMaxY])
                .range([lineChartHeight, 0]);
            
            let updateTransitionDuration = 2000;
            let enterTransitionDuration = 1500;

            d3.select("#" + lineChartId + "-svg").append("g")
                .attr("transform", "translate(0," + lineChartHeight + margin.bottom + ")")
                .attr("color", "white")
                .style("font-size","12px")
                .attr("id", lineChartId + "-xaxis")
                .call(d3.axisBottom(xScale))
                .append("text")
                .classed("legend", true)
                .attr("transform", "translate(" + 410 + "," + 40 + ")")
                .style("text-anchor", "end")
                .text("Time Span");
            
            // d3.select()
            d3.select("#" + lineChartId + "-svg").append("g")
                .attr("color", "white")
                .attr("transform", "translate(" + (margin.left + margin.right) + ",0)")
                .style("font-size","12px")
                .attr("id", lineChartId + "-yaxis")
                .call(d3.axisLeft(yScale))
                .append("text")
                .classed("legend", true)
                .attr("transform", "rotate(-90) translate(0, " + -35 +  ")")
                .style("text-anchor", "end")
                .text("Rate Of Change, Migrant Stock");

            /* d3.select("#" + lineChartId + "xaxis")
                //.transition().duration(updateTransitionDuration)
                .call(d3.axisBottom(xScale))
                .append("text")
                .classed("legend", true)
                .attr("transform", "translate(" + 410 + "," + 40 + ")")
                .style("text-anchor", "end")
                .text("Time Span");

            d3.select("#" + lineChartId + "yaxis")
                //.transition().duration(updateTransitionDuration)
                .call(d3.axisLeft(yScale))
                .append("text")
                .classed("legend", true)
                .attr("transform", "rotate(-90) translate(0, " + -35 +  ")")
                .style("text-anchor", "end")
                .text("Rate Of Change, Migrant Stock"); */

            let lineGenerator = d3.line()
                .x(function (d) {
                    return xScale(d.label);
                })
                .y(function (d) {
                    return yScale(d.value);
                });

            d3.select("#" + lineChartId).selectAll("path").data([data]).join(
                (enter) => enter.append("path")
                    .attr("class", "country-linechart-path")
                    .call(enter => enter
                        .transition()
                        .duration(enterTransitionDuration)
                        .attr("d",(d) => lineGenerator(d))),
                    //.call(enter => { return isChartDefined ? enter : lineInitialTransition(enter);}),
                (update) => update
                    .call(update => update
                        .transition()
                        .duration(updateTransitionDuration)
                        .attr("d",(d) => lineGenerator(d))),
                (exit) => exit.remove()    
            ); 
        }

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
