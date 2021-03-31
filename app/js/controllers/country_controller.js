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
        $scope.searchSource = "";
        $scope.continents = dataService.continents;

        this.uiOnParamsChanged = (newParams) =>
                fetchData(newParams.countryName);

        let fetchData = (countryName) => {
            if (countryName === null) {
                dataService.selectedCountryController = "";
            } else {
                let selectedCountry = $scope.countries.find((c) =>
                    slugify(countryName) === slugify(c.visName));

                if (selectedCountry) {
                    dataService.selectedCountryController = selectedCountry;
                } else {
                    console.log('Invalid country name:',
                            capitalize(countryName));

                    $state.go($state.current, { countryName: null });
                }
            }

            // Update the statistics
            $scope.selectedCountryController = dataService.selectedCountryController == ""
                ? $scope.countries[0]
                : dataService.selectedCountryController;

            $scope.updateStatistics();
        }

        $scope.updateView = () => {
            const _countryName = $scope.selectedCountryController.visName;
            $state.go($state.current, { countryName: slugify(_countryName) });
        };

        let margin = {top:40, bottom:30, left:30, right:30};
        $scope.sendReceiveTopCountries = "";
        dataService.countries.then((data) => {
            $scope.countries = data;

            let countryName = $stateParams.countryName;

            if (countryName === null) {
                dataService.selectedCountryController = "";
            } else {
                let selectedCountry = data.find((c) =>
                    slugify(countryName) === slugify(c.visName));

                if (selectedCountry) {
                    dataService.selectedCountryController = selectedCountry;
                } else {
                    console.log('Invalid country name:',
                            capitalize(countryName));

                    $state.go($state.current, { countryName: null });
                }
            }

            $scope.selectedCountryController = dataService.selectedCountryController == ""
                ? $scope.countries[0]
                : dataService.selectedCountryController;

            $scope.genreFilterValue = "menu-all";
            
            lineChartStructure = initializeLineChart("roc-linechart-container",margin,"roc-linechart-country")
            developmentStructure = createPieStructure("development-piechart", "development");
            incomeStructure = createPieStructure("income-piechart", "income");

            $scope.updateStatistics();
        });

        $scope.secondaryMenuSelectedValue = "country";
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

        let svgWidth;
        let svgHeight;
        let radius;
        let arc;
        let sliderMin = 1900;
        let sliderMax = 2019;
        let lineChartStructure;
        let developmentStructure;
        let incomeStructure;
        let colors = d3.scaleOrdinal(d3.schemePaired);

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
            console.log("Selected new country:");
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
                .getGlobalRankStatistics($scope.selectedCountryController.name, sliderMin, sliderMax, $scope.genreFilterValue)
                .then((data) => {

                    let avgEstRefGlobalRank = "";
                    if (isNaN(data.average_est_refugees_global_rank)) {
                        avgEstRefGlobalRank = "Not available";
                    } else {
                        avgEstRefGlobalRank = "" + transformNumberFormat(data.average_est_refugees_global_rank, true);
                    }

                    $scope.globalRankCountryStatisticsValues.totalImmigrationsGlobalRank =
                        "" + transformNumberFormat(data.average_tot_migrants_global_rank, true);

                    $scope.globalRankCountryStatisticsValues.totalPopulationGlobalRank =
                        "" + transformNumberFormat(data.average_tot_population_global_rank, true);

                    $scope.globalRankCountryStatisticsValues.immigrationVsPopulationGlobalRank =
                        "" + transformNumberFormat(data.average_perc_immigration_global_rank, true);

                    $scope.globalRankCountryStatisticsValues.immigrationAverageAgeGlobalRank =
                        "" + transformNumberFormat(data.average_age_migrants_global_rank, true);

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
                    drawPieChart(data, developmentStructure, "development");
                });

            dataService
                .getCountryIncomeStatistic($scope.selectedCountryController.name, consideredYears, $scope.genreFilterValue)
                .then((data) => {
                    drawPieChart(data, incomeStructure, "income");
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

            // Extract the immigration by age groups:
            // 0-4, 5-18, 19-34, 35-54, 55-74, 75+
            dataService
                .getImmigrationByAgeGroups($scope.selectedCountryController.name, sliderMin, sliderMax, $scope.genreFilterValue)
                .then((ageGroupsData) => drawAgeStackedBarchart(ageGroupsData, ["Total", "Year"], "age-stacked-barchart"));

            // Extract Top 5 inward/outward migration countries
            countryService
                .getTopCountries($scope.selectedCountryController.name, sliderMin, sliderMax, $scope.genreFilterValue)
                .then((data) => {
                    const topCountries = data;

                    $scope.top5InwardCountries = topCountries["topInward"];
                    $scope.top5OutwardCountries = topCountries["topOutward"];

                    $scope.$apply();
                });
            
            dataService
                .getRateOfChange($scope.selectedCountryController.name, sliderMin, sliderMax, $scope.genreFilterValue)
                .then((data) => {
                    let xLabels = Object.keys(data);
                    const reg = /(_\(mf\)|_\(m\)|_\(f\))/;
                    xLabels = xLabels.map(label => label.replace(reg, ''));
                    let yValues = Object.values(data).map(value => +value);
                    data = xLabels.map((elem, idx) => ({label:elem, value:yValues[idx]}))
                    dataService.getGlobalMinMaxRateOfChange()
                        .then(minMax => {
                            drawLineChart(data, "roc-linechart-country", minMax.MinRateOfChange, 
                                minMax.MaxRateOfChange, margin, lineChartStructure.width, lineChartStructure.height);
                        });
                });
            };

        /**
         * Function that updates the pieChart values for the enter set
         * @param {array} data
         * @param {function} arc
         * @returns
         */
        let arcTweenEnter = (data) => {
            // let i = d3.interpolate(data.endAngle, data.startAngle);
            let i = d3.interpolate(this._current, data);

            this._current = i(0);
            return function (t) {
                // data.startAngle = i(t);
                // return arc(data);
                return arc(i(t));
            };
        };

        /**
         * Function that initialize the svg containing the rate of change lineChart for the selected country
         * @param {string} container 
         * @param {object} margin
         * @param {string} lineChartId
         * @returns
         */

         let initializeLineChart = (container, margin, lineChartId) => {
            
            let rateOfChangeLineChartContainer = d3.select("#" + container);
            rateOfChangeLineChartContainer.html("");

            let rateOfChangeLineChartContainerDim = rateOfChangeLineChartContainer.node().getBoundingClientRect();
            let width = rateOfChangeLineChartContainerDim.width - margin.left - margin.right;
            let height = rateOfChangeLineChartContainerDim.height - margin.top - margin.bottom;

            let svg =  rateOfChangeLineChartContainer
                .append("svg")
                .attr("width", width + 2*(margin.left + margin.right))
                .attr("height", height + 2*(margin.top + margin.bottom))
                .attr("id", lineChartId + "-svg");
            
            let lineChartStructure = svg.append("g")
                .attr("id", lineChartId)
                .attr("class", "country-linechart");

            d3.select("#" + lineChartId + "-svg").append("g")
                .attr("transform", "translate(0," + (height + margin.bottom/1.1)  + ")")
                .attr("color", "white")
                .style("font-size","12px")
                .attr("id", lineChartId + "-xaxis")
                .append("text")
                .classed("legend", true)
                .attr("transform", "translate(" + 410 + "," + 40 + ")")
                .style("text-anchor", "end")
                .text("Time Span");
            
            d3.select("#" + lineChartId + "-svg").append("g")
                .attr("color", "white")
                .attr("transform", "translate(" + (margin.left + margin.right) + "," + (margin.top/3) + ")")
                .style("font-size","12px")
                .attr("id", lineChartId + "-yaxis")
                .append("text")
                .classed("legend", true)
                .attr("transform", "rotate(-90) translate(" + -40 + "," + -35 +  ")")
                .style("text-anchor", "end")
                .text("Rate Of Change, Migrant Stock");

            return {"lineChartStructure": lineChartStructure, "width": width, "height": height};

        };

        /**
         * Function that creates the base html structure for visualizing a pieChart
         * @param {string} container
         * @param {string} type
         * @returns
         */
        let createPieStructure = (container, type) => {
            let svgContainer = d3.select("#" + container);
            svgWidth = svgContainer.node().getBoundingClientRect().width;
            svgHeight = svgContainer.node().getBoundingClientRect().height;
            radius = Math.min(svgWidth, svgHeight) / 2;

            let svg = svgContainer.append("svg").attr("width", svgWidth).attr("height", svgHeight);
            // .attr("transform", `translate(${svgWidth / 2}, ${svgHeight / 2})`);
            svg.append("g")
                .attr("class", type + "-slices")
                .attr("transform", `translate(${svgWidth / 2}, ${svgHeight / 2 - 50})`);
            svg.append("g")
                .attr("class", type + "-labels")
                .attr("transform", `translate(${svgWidth / 2}, ${svgHeight / 2 - 50})`);
            arc = d3
                .arc()
                .outerRadius(radius - 70)
                .innerRadius(0);

            return svg;
        };

        /**
         * Function that handles the enter set of the pieChart
         * @param {array} enter
         * @param {string} type
         */
        let handleEnter = (enter, type) => {
            enter
                .append("path")
                .attr("class", type + "-arc")
                .style("stroke", "white")
                .style("fill", (d, i) => colors(i))
                .transition()
                .duration(1000)
                .attrTween("d", arcTweenEnter);
        };

        /**
         * Function that handles the update set of the pieChart
         * @param {array} update
         */
        let handleUpdate = (update) => {
            update
                .transition()
                .duration(1000)
                .attrTween("d", function (d) {
                    this._current = this._current || d;
                    var interpolate = d3.interpolate(this._current, d);
                    this._current = interpolate(0);
                    return function (t) {
                        return arc(interpolate(t));
                    };
                });
        };

        /**
         * Function that handles the visualization of the labels
         * @param {array} enter
         * @param {number} dataLength
         * @param {string} type
         */
        let handleEnterLabels = (enter, dataLength, type) => {
            let legendIndex = 0;
            let enterLabel = enter.append("g").attr("class", type + "-label");

            // creating the inner circles for the labels
            enterLabel
                .append("circle")
                .attr("r", 2)
                .attr("fill", "#FFFFFF")
                .attr("class", type + "-label-inner-circle");

            // creating the line for the labels
            enterLabel
                .append("line")
                .attr("stroke-width", 1)
                .attr("stroke", "#FFFFFF")
                .attr("class", type + "-label-line");

            // creating the outer circles for the label
            enterLabel.append("circle").attr("class", type + "-label-outer-circle");

            // creating the colored rectangles for the legend
            enterLabel
                .append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("rx", 0)
                .attr("ry", 0)
                .attr("width", 10)
                .attr("height", 10)
                .attr("stroke", "#FFFFFF")
                .attr("fill", (d, i) => colors(i))
                .attr("class", type + "-legend-rect")
                .attr("transform", (d, i) => {
                    if (i < dataLength / 2) return `translate(${-(svgWidth / 2 - 50)}, ${svgHeight / 2 - 20 * (i + 1)})`;
                    else {
                        return `translate(${svgWidth / 4 - 55}, ${svgHeight / 2 - 20 * (legendIndex++ + 1)})`;
                    }
                });

            legendIndex = 0;

            // creating the text of the labels
            enterLabel
                .append("text")
                .attr("stroke", (d, i) => colors(i))
                .attr("class", type + "-label-text");

            // creating the text for the legend
            enterLabel
                .append("text")
                .attr("x", "0")
                .attr("y", "5")
                .attr("class", type + "-legend-text")
                .attr("class", "label-text")
                .attr("transform", (d, i) => {
                    if (i < dataLength / 2) {
                        return `translate(${-(svgWidth / 2 - 70)}, ${svgHeight / 2 - 20 * (i + 1)})`;
                    } else {
                        return `translate(${svgWidth / 4 - 35}, ${svgHeight / 2 - 20 * (legendIndex++ + 1)})`;
                    }
                })
                .text((d) => d.data.type);
        };

        /**
         * Function that handles the updating of the labels in the pieChart
         * @param {svg} svgElement
         * @param {array} piedData
         * @param {string} type
         */
        let handleUpdateLabels = (svgElement, piedData, type) => {
            // updating the inner circle label
            svgElement
                .selectAll("." + type + "-label-inner-circle")
                .data(piedData)
                .transition()
                .duration(1000)
                .attrTween("transform", function (d, i, n) {
                    n[i]._current = n[i]._current || d;
                    let interpolate = d3.interpolate(n[i]._current, d);
                    n[i]._current = interpolate(0);
                    return function (t) {
                        let inter = interpolate(t);
                        let pos = arc.centroid(inter);
                        return "translate(" + pos + ")";
                    };
                });

            // updating the label line
            svgElement
                .selectAll("." + type + "-label-line")
                .data(piedData)
                .transition()
                .duration(1000)
                .attr("x1", (d, i) => arc.centroid(d)[0])
                .attr("y1", (d, i) => arc.centroid(d)[1])
                .attr("x2", (d, i) => computePieChartEndOfLabelLineXY(d, arc, "x"))
                .attr("y2", (d, i) => computePieChartEndOfLabelLineXY(d, arc, "y"));

            // updating the label outer circle
            svgElement
                .selectAll("." + type + "-label-outer-circle")
                .data(piedData)
                .transition()
                .duration(1000)
                .attr("r", (d) => (d.value !== 0 ? 4 : 0))
                .attr("fill", (d, i) => colors(i))
                .attr("cx", (d, i) => computePieChartEndOfLabelLineXY(d, arc, "x"))
                .attr("cy", (d, i) => computePieChartEndOfLabelLineXY(d, arc, "y"));

            // updating the label text
            svgElement
                .selectAll("." + type + "-label-text")
                .data(piedData)
                .transition()
                .duration(1000)
                .attr("x", (d, i) => {
                    let x = computePieChartEndOfLabelLineXY(d, arc, "x");
                    if (x == undefined) x = 0;
                    let sign = x > 0 ? 1 : -1;
                    let xLabel = x + 10 * sign;
                    return xLabel;
                })
                .attr("y", (d, i) => {
                    let y = computePieChartEndOfLabelLineXY(d, arc, "y");
                    if (y == undefined) y = 0;
                    let sign = y > 0 ? 1 : -1;
                    let yLabel = y + 1 * sign;
                    return yLabel;
                })
                .attr("text-anchor", (d, i) => {
                    let centroid = arc.centroid(d);
                    let midAngle = Math.atan2(centroid[1], centroid[0]);
                    let x = Math.cos(midAngle) * (radius - 45);
                    return x > 0 ? "start" : "end";
                })
                .attr("font-size", "small")
                .text((d) => {
                    return d.data.percentage !== "0.0" ? d.data.percentage + "%" : "";
                });
        };

        /**
         * Function that computes the position of the outer circle in the pieChart
         * @param {object} d
         * @param {function} arc
         * @param {string} coord
         * @returns
         */
        let computePieChartEndOfLabelLineXY = (d, arc, coord) => {
            if (d.value == 0) {
                if (coord === "x") return arc.centroid[0];
                if (coord === "y") return arc.centroid[1];
            }
            let centroid = arc.centroid(d);
            let midAngle = Math.atan2(centroid[1], centroid[0]);
            let x = Math.cos(midAngle) * (radius - 55);
            let y = Math.sin(midAngle) * (radius - 55);

            if (coord === "x") return x;
            if (coord === "y") return y;
        };

        /**
         * Function that draws the pie chart
         * @param {array} data
         */
        let drawPieChart = (data, svgElement, type) => {
            const pie = d3.pie().value((d) => d.value);
            const piedData = pie(data);

            // variable used to split the legend in two columns
            svgElement
                .select("." + type + "-slices")
                .selectAll("path")
                .data(piedData)
                .join(
                    (enter) => handleEnter(enter, type),
                    (update) => handleUpdate(update),
                    (exit) => exit.remove()
                );

            svgElement
                .select("." + type + "-labels")
                .selectAll("." + type + "-label")
                .data(piedData)
                .join(
                    (enter) => handleEnterLabels(enter, data.length, type),
                    (update) => handleUpdateLabels(svgElement, piedData, type),
                    (exit) => exit.remove()
                );
        };

        let drawAgeStackedBarchart = (data, toExclude, containerId) => {
            const containerElem = d3.select("#" + containerId);
            containerElem.html("");

            const containerDims = containerElem.node().getBoundingClientRect();

            const legendMargin = 15;

            // Stack up the data
            const groups = d3.map(data, (d) => +d.Year);

            const subgroups = Object.keys(data[0]).filter((i) => !toExclude.includes(i));

            const stackedData = d3.stack().keys(subgroups)(data);

            // Setup Bostock's margin convention
            const svgMargins = { top: 8, right: 32, left: 32, bottom: 64 + Math.floor(subgroups.length / 3) * legendMargin }; // Legend labels are stacked at
            // the bottom in 3 separate columns

            const svgWidth = containerDims.width - svgMargins.left - svgMargins.right;

            const svgHeight = containerDims.height - svgMargins.top - svgMargins.bottom;

            const containerWidth = svgWidth + svgMargins.left + svgMargins.right;

            const containerHeight = svgHeight + svgMargins.top + svgMargins.bottom;

            const svgElem = containerElem
                .append("svg")
                .attr("width", containerWidth)
                .attr("height", containerHeight)
                .append("g")
                .attr("transform", "translate(" + svgMargins.left + "," + svgMargins.top + ")");

            const timeFormat = d3.timeFormat("%Y").parse;

            // Set all the scales
            let xScale = d3
                .scaleBand()
                .domain(groups)
                .rangeRound([4, svgWidth - 2])
                .padding(0.16);

            let yScale = d3
                .scaleLinear()
                .domain([0, d3.max(stackedData, (layerData) => d3.max(layerData, (d) => d[1]))])
                .range([svgHeight, 0]);

            const colorScale = d3.scaleOrdinal(d3.schemePaired.slice(0, subgroups.length));

            // Define and draw axes
            const yAxis = d3
                .axisLeft()
                .scale(yScale)
                .ticks(6)
                .tickSize(-svgWidth, 0, 0)
                .tickFormat((d) => d + "%");

            const xAxis = d3.axisBottom().scale(xScale).tickFormat(timeFormat);

            const yAxis_group = svgElem.append("g").classed("y", true).classed("axis", true).call(yAxis);

            yAxis_group.selectAll(".tick line").remove();

            svgElem
                .append("g")
                .classed("x", true)
                .classed("axis", true)
                .attr("transform", "translate(0," + svgHeight + ")")
                .call(xAxis);

            // Create groups for each series
            const groupsElem = svgElem
                .selectAll("g.age-group")
                .data(stackedData)
                .enter()
                .append("g")
                .classed("age-group", true)
                .style("fill", (_, i) => colorScale(i));

            // Create the hover tooltip
            const tooltipElem = svgElem.append("g").classed("age-stacked-barchart-tooltip", true).classed("hide", true);

            tooltipElem
                .append("rect")
                .attr("width", 40)
                .attr("height", 20)
                .attr("fill", "white")
                .style("padding", "1em")
                .style("opacity", 0.5);

            tooltipElem
                .append("text")
                .attr("x", 20)
                .attr("dy", "1.2em")
                .style("font-size", "12px")
                .style("font-weight", "bold")
                .style("text-anchor", "middle");

            // Create rects for each segment
            groupsElem
                .selectAll("rect")
                .data((d) => d)
                .enter()
                .append("rect")
                .attr("x", (d) => xScale(+d.data.Year))
                .attr("y", (d) => yScale(d[1]))
                .attr("height", (d) => yScale(d[0]) - yScale(d[1]))
                .attr("width", xScale.bandwidth())
                .on("mouseover", () => tooltipElem.classed("hide", false))
                .on("mouseout", () => tooltipElem.classed("hide", true))
                .on("mousemove", (e, d) => {
                    let xPos = d3.pointer(e)[0] - 15;
                    let yPos = d3.pointer(e)[1] - 25;

                    // Make the tooltip follow the mouse movement
                    // while hovering onto a rect
                    tooltipElem.attr("transform", "translate(" + xPos + "," + yPos + ")");
                    tooltipElem.select("text").text((d[1] - d[0]).toFixed(1) + "%");
                });

            const getLegendTranslation = (datumId) => {
                const horizDelta = 16;
                const vertDelta = 16;

                // Get legend row/col Id
                const r = Math.floor(datumId / 3);
                const c = datumId % 3;

                switch (c) {
                    case 0:
                        return `translate(${-(svgWidth + horizDelta)},
                            ${svgHeight + vertDelta + legendMargin * (r + 1)})`;

                    case 1:
                        return `translate(${-(svgWidth / 2 + 2 * horizDelta)},
                            ${svgHeight + vertDelta + legendMargin * (r + 1)})`;

                    case 2:
                        return `translate(${-(0 + 4 * horizDelta)},
                            ${svgHeight + vertDelta + legendMargin * (r + 1)})`;
                }
            };

            // Draw layers legend
            const legendElem = svgElem
                .selectAll(".legend")
                .data(colorScale.range())
                .enter()
                .append("g")
                .classed("age-stacked-barchart-legend", true)
                .attr("width", 50)
                .attr("height", 12)
                // .attr("transform", (_, i) => "translate("
                //         + i*legendMargin +",30)")
                .attr("transform", (_, i) => getLegendTranslation(i));

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
                .text((_, i) => subgroups[i] + " years");
        };
 
        let drawLineChart = (data, lineChartId, globalMinY, globalMaxY, margin, lineChartWidth, lineChartHeight) => {

            let xScale = d3.scalePoint()
                .domain(data.map(rateOfChange => rateOfChange.label))
                .range([margin.left + margin.right, lineChartWidth]);

            let yScale = d3.scaleLinear()
                .domain([globalMinY, globalMaxY])
                .range([lineChartHeight + margin.top/3, 0]);
            
            let updateTransitionDuration = 1500;
            let enterTransitionDuration = 1500;

            d3.select("#" + lineChartId + "-xaxis")
                .transition()
                .duration(updateTransitionDuration)
                .call(d3.axisBottom(xScale));

            d3.select("#" + lineChartId + "-yaxis")
                .transition()
                .duration(updateTransitionDuration)
                .call(d3.axisLeft(yScale));

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
                (exit) => exit.call(exit => exit
                    .transition()
                    .duration(updateTransitionDuration).remove())    
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
            // $scope.selectedTopCountry = value;
            $scope.selectedCountryController = value;
            $scope.updateView();
        };

        /**
         * Function that handles the mouse enter on the top countries flags
         * @param {string} value
         */
        $scope.showTopCountryHint = function (value, event, type) {
            $scope.selectedTopFlag = value;
            $scope.sendReceiveTopCountries = type;
            let tooltip = document.getElementById("top-flags-tooltip");
            let tooltip_text = document.getElementById("tooltip-text");
            if (type == "Send") {
                tooltip_text.classList.remove("color-red");
                tooltip_text.classList.add("color-green");
            } else {
                tooltip_text.classList.remove("color-green");
                tooltip_text.classList.add("color-red");
            }
            tooltip.classList.remove("display-none");
            tooltip.classList.add("display-block");
            tooltip.style.top = event.clientY - 50 + "px";
            tooltip.style.left = event.clientX + "px";
            tooltip.style.zIndex = 100;
        };

        /**
         * Function that handles the mouse out on the top countries flags
         * @param {string} value
         */
        $scope.hideTopCountryHint = function (event, type) {
            let tooltip = document.getElementById("top-flags-tooltip");
            tooltip.classList.remove("display-block");
            tooltip.classList.add("display-none");
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
