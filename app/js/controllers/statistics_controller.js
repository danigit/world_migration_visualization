(function () {
    "use strict";

    // reloading the angular module
    angular.module("main").controller("statisticsController", statisticsController);

    /**
     * Function that handles the statistics page functionalities
     */
    statisticsController.$inject = ["$scope", "$state", "dataService"];

    function statisticsController($scope, $state, dataService) {
        $scope.selectedTopCountryValue = "";
        $scope.secondaryMenuSelectedValue = "world";
        $scope.statisticsButtons = dataService.menuButtons;
        $scope.visualizationTypes = dataService.visualizationTypes;
        $scope.topFlags = dataService.topFlags;
        $scope.selectedTopFlag = "";
        $scope.countriesData = null;

        $scope.$watch("countriesData", function (_new, _old) {
            if (_new !== _old) {
                drawMap($scope.geoObject);
                // $scope.geoObject.element
                //     .append("g")
                //     .attr("transform", "translate(610,20)")
                //     .append(() => legend({ color: colorScale, title: "antani", ticks: 8, tickFormat: ".0s", width: 260 }));
            }
        });

        $scope.$watch("activeYears", function (_new, _old) {
            if (_new !== _old) {
                drawMap($scope.geoObject, false);
            }
        });

        const BAD_COUNTRY_COLOR = "#ff5952";

        const colorScheme = d3.schemeBlues[9];
        let colorScale;
        let colorScaleBarChart;

        $scope.globalStatisticsVisName = "Global statistics";
        $scope.selectedMetric = "total_immigration";
        $scope.barChartInitialized = false;

        $scope.geoObject = null;
        $scope.activeYears = dataService.getActiveYears();

        $scope.globalStatistics = {};

        let selectedYear = -1;
        let barChartSvgElement;

        let isBadCountry = (props) => {
            return !props || !(props instanceof Country);
        };

        let initMap = (worldData) => {
            let mapContainer = d3.select("#map-container");
            mapContainer.html("");

            let svgWidth = mapContainer.node().getBoundingClientRect().width;
            let svgHeight = mapContainer.node().getBoundingClientRect().height;

            let svgPaddings = { top: 128, right: 0, bottom: 0, left: 0 };

            let mapProjection = d3
                .geoMercator()
                .scale(170)
                .translate([svgWidth / 2, svgHeight / 2 + svgPaddings.top]);

            let geoPath = d3.geoPath().projection(mapProjection);

            let svgMapContainer = mapContainer.append("svg").attr("width", svgWidth).attr("height", svgHeight);

            let svgMap = svgMapContainer.append("g").attr("id", "map");
            // let svgGraticule = svgMapContainer.append("g")
            //         .attr('id', 'graticule');

            let zoomMap = d3
                .zoom()
                .scaleExtent([1, 10])
                .on("zoom", (e) => svgMap.attr("transform", e.transform));

            let geoJson = worldData;

            geoJson.forEach((d) => {
                if (isBadCountry(d.properties)) return;

                d.properties.props["C"] = mapProjection(d3.geoCentroid(d));
            });

            svgMapContainer.call(zoomMap);
            svgMapContainer.call(zoomMap.transform, () => d3.zoomIdentity.scale(1));

            return {
                data: geoJson,
                element: svgMap,
                path: geoPath,
                projection: mapProjection,
            };
        };

        let drawMap = (geoObject, _statChanged = true) => {
            let getStatistics_avgByCountry = (activeYears, _reduceFunc) => {
                let statistics_groupByCountry = d3.group(
                    $scope.countriesData.filter((s) => activeYears.includes(+s.Year)),
                    (r) => r.Destination
                );

                let statistics_avgByCountry = map(statistics_groupByCountry, (v) => v.reduce(_reduceFunc, 0) / v.length);

                return statistics_avgByCountry;
            };

            let _reduceFunc = (sum, curr) => sum + +curr.Total;

            const statistics_avgByCountry = getStatistics_avgByCountry($scope.activeYears, _reduceFunc);

            console.log($scope.countriesData.filter((c) => c.Destination === "Russian Federation"));
            console.log(statistics_avgByCountry["Russian Federation"]);

            if (_statChanged) {
                let statistics_avgValues = null;

                if (equals($scope.activeYears, dataService.getActiveYears())) {
                    statistics_avgValues = Object.values(statistics_avgByCountry);
                } else {
                    let statistics_all_avgByCountry = getStatistics_avgByCountry(dataService.getActiveYears(), _reduceFunc);

                    statistics_avgValues = Object.values(statistics_all_avgByCountry);
                }

                colorScale = d3_scaleLogMinMax(statistics_avgValues, [colorScheme[0], colorScheme[8]]);
            }

            let _handleMapEnter = (_enter, _path, _statistics) => {
                _enter
                    .append("path")
                    .attr("d", _path)
                    .attr("class", "countries")
                    .attr("id", (d) => d.id)
                    .attr("fill", (d) => {
                        if (isBadCountry(d.properties)) {
                            return BAD_COUNTRY_COLOR;
                        }

                        const v = _statistics[d.properties.name];

                        if (isNaN(v)) {
                            return BAD_COUNTRY_COLOR;
                        }

                        // TODO: Change the fill attribute following
                        // the color scale on the current metric
                        return colorScale(v);
                    })
                    .on("click", (_, d) => {
                        if (isBadCountry(d.properties)) {
                            console.log("Unknown country:", d.id);
                            return;
                        }

                        $state.go("country", { countryName: slugify(d.properties.visName) });
                    })
                    .on("mouseover", function (_, d) {
                        d3.select(this).transition().duration(100).style("fill", "#800080");

                        if (isBadCountry(d.properties)) {
                            console.log("Unknown country:", d.id);
                            return;
                        }

                        let v = _statistics[d.properties.name];

                        if (isNaN(v)) {
                            console.log("Data not available:", d.id);
                            return;
                        }

                        console.log("Hovering over:", d.properties.visName, "-", v);

                        // TODO: Extract the current metric value
                        // solely for the hovered country.

                        // TODO: Fill the bottom-center section with
                        // relevant info on the hovered country.
                    })
                    .on("mouseout", function (_, d) {
                        let fillColor = null;

                        if (isBadCountry(d.properties)) {
                            fillColor = BAD_COUNTRY_COLOR;
                        } else {
                            // TODO: Fill the bottom-center section with
                            // a general template of insertion.

                            const v = _statistics[d.properties.name];

                            if (isNaN(v)) {
                                fillColor = BAD_COUNTRY_COLOR;
                            } else {
                                fillColor = colorScale(v);
                            }
                        }

                        // TODO: Change the fill attribute following
                        // the color scale on the current metric

                        d3.select(this).transition().duration(100).style("fill", fillColor);
                    });
            };

            let _handleMapUpdate = (_update, _statistics) => {
                _update
                    .on("mouseover", function (_, d) {
                        d3.select(this).transition().duration(100).style("fill", "#800080");

                        if (isBadCountry(d.properties)) {
                            console.log("Unknown country:", d.id);
                            return;
                        }

                        let v = _statistics[d.properties.name];

                        if (isNaN(v)) {
                            console.log("Data not available:", d.id);
                            return;
                        }

                        console.log("Hovering over:", d.properties.visName, "-", v);

                        // TODO: Extract the current metric value
                        // solely for the hovered country.

                        // TODO: Fill the bottom-center section with
                        // relevant info on the hovered country.
                    })
                    .on("mouseout", function (_, d) {
                        let fillColor = null;

                        if (isBadCountry(d.properties)) {
                            fillColor = BAD_COUNTRY_COLOR;
                        } else {
                            // TODO: Fill the bottom-center section with
                            // a general template of insertion.

                            const v = _statistics[d.properties.name];

                            if (isNaN(v)) {
                                fillColor = BAD_COUNTRY_COLOR;
                            } else {
                                fillColor = colorScale(v);
                            }
                        }

                        // TODO: Change the fill attribute following
                        // the color scale on the current metric

                        d3.select(this).transition().duration(100).style("fill", fillColor);
                    })
                    .transition()
                    .duration(1000)
                    .attr("fill", (d) => {
                        if (isBadCountry(d.properties)) {
                            return BAD_COUNTRY_COLOR;
                        }

                        const v = _statistics[d.properties.name];

                        if (isNaN(v)) {
                            return BAD_COUNTRY_COLOR;
                        }

                        // TODO: Change the fill attribute following
                        // the color scale on the current metric
                        return colorScale(v);
                    });
            };

            geoObject.element
                .selectAll("path")
                .data(geoObject.data)
                .join(
                    (enter) => _handleMapEnter(enter, geoObject.path, statistics_avgByCountry),

                    (update) => _handleMapUpdate(update, statistics_avgByCountry),

                    (exit) => exit.remove()
                );
        };

        let drawCentroids = (geoObject) => {
            // Centroids
            const geoCentroids = geoObject.element.selectAll("circle").data(geoObject.data.filter((d) => !isBadCountry(d.properties)));

            geoCentroids
                .enter()
                .append("circle")
                .attr("cx", (d) => d.properties.props.C[0])
                .attr("cy", (d) => d.properties.props.C[1])
                .attr("r", 2)
                .on("mouseover", function (_, d) {
                    d3.select(this).transition().duration(100).attr("r", 4);

                    console.log(d);
                })
                .on("mouseout", function () {
                    d3.select(this).transition().duration(100).attr("r", 2);
                });
        };

        let createGlobalStatisticsStructure = (data) => {
            let container = d3.select("#global-statistics");
            let margins = { top: 20, right: 20, bottom: 60, left: 20 };
            let commonWidth = container.node().getBoundingClientRect().width - margins.left - margins.right;
            let commonHeight = 350 - margins.top - margins.bottom;

            let svg = container
                .append("svg")
                .attr("width", commonWidth)
                .attr("height", commonHeight)
                .attr("class", "background-gray-transparent border-radius-10px padding-10-px");

            let mainGroup = svg.append("g").attr("transform", `translate(${margins.left}, ${margins.top})`).attr("class", "main-group");

            let xLabels = data.map((d) => d.label);
            let maxY = d3.max(data, (d) => d.val);

            let x = d3
                .scaleBand()
                .range([margins.left, commonWidth - margins.right])
                .padding(0.1)
                .domain(xLabels);

            let y = d3
                .scaleLinear()
                .domain([0, maxY])
                .range([commonHeight - margins.top - margins.bottom, 0]);

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

            return {
                svgElement: svg,
                mainGroup: mainGroup,
                x: x,
                y: y,
                height: commonHeight,
                width: commonWidth,
                margins: margins,
            };
        };

        let handleEnter = (enter, svgElement) => {
            enter
                .append("rect")
                .attr("fill", (d, i) => colorScheme[4])
                .attr("x", (d) => svgElement.x(d.label))
                .attr("y", svgElement.y(0))
                .attr("width", svgElement.x.bandwidth())
                .attr("y", svgElement.y(0))
                .transition()
                .duration(1000)
                .attr("y", (d) => svgElement.y(d.val))
                .attr("height", (d) => svgElement.height - svgElement.margins.bottom - svgElement.margins.top - svgElement.y(d.val));

            enter.selectAll("rect").on("click", function (e, d) {
                selectedYear = +d.label;
                if (d3.select(this).classed("selected")) {
                    d3.select(this)
                        .classed("selected", false)
                        .transition()
                        .duration(100)
                        .attr("fill", (datum, i) => {
                            return colorScheme[4];
                        });

                    $scope.activeYears = dataService.getActiveYears();
                } else {
                    d3.select("#global-statistics")
                        .selectAll("g rect.selected")
                        .classed("selected", false)
                        .transition()
                        .duration(100)
                        .attr("fill", (datum, i) => {
                            return colorScheme[4];
                        });

                    d3.select(this).classed("selected", true).transition().duration(100).attr("fill", "#ff9316");
                    $scope.activeYears = [selectedYear];
                }
            });
        };

        let handleLabelsEnter = (enter, svgElement) => {
            enter
                .append("text")
                .attr("stroke", "#FFFFFF")
                .attr("stroke-width", 0.5)
                .attr("font-size", "8px")
                .attr("x", (d) => svgElement.x(d.label))
                .attr("y", svgElement.y(0))
                .transition()
                .duration(1000)
                .attr("y", (d) => svgElement.y(d.val))
                .text((d) => {
                    return d.val !== "0.00" ? transformNumberFormat(d.val, false, 0) : "";
                });
        };

        let handleLabelsUpdate = (update, svgElement) => {
            update
                .transition()
                .duration(1000)
                .attr("y", (d) => svgElement.y(d.val))
                .text((d) => {
                    return d.val !== "0.00" ? transformNumberFormat(d.val, false, 0) : "";
                });
        };

        let handleUpdate = (update, data, svgElement) => {
            let maxY = d3.max(data, (d) => d.val);
            let y = svgElement.y.domain([0, maxY]);

            svgElement.svgElement
                .select("g.grid-lines.y-axis")
                .transition()
                .duration(1000)
                .call(d3.axisLeft(y).tickSize(-svgElement.width).tickSizeOuter(0).tickFormat(d3.format(".2s")));

            update
                .transition()
                .duration(1000)
                .attr("y", (d) => svgElement.y(d.val))
                .attr("height", (d) => svgElement.height - svgElement.margins.bottom - svgElement.margins.top - svgElement.y(d.val))
                .attr("fill", (datum, i) => colorScheme[4]);

            // update.selectAll("rect").on("click", function (e, d) {
            // selectedYear = +d.label;
            // if (d3.select(this).classed("selected")) {
            //     d3.select(this)
            //         .classed("selected", false)
            //         .transition()
            //         .duration(100)
            //         .attr("fill", (datum, i) => {
            //             return colorScheme[4];
            //         });

            //     $scope.activeYears = dataService.getActiveYears();
            // } else {
            //     d3.select("#global-statistics")
            //         .selectAll("g rect.selected")
            //         .classed("selected", false)
            //         .transition()
            //         .duration(100)
            //         .attr("fill", (datum, i) => {
            //             return colorScheme[4];
            //         });

            //     d3.select(this).classed("selected", true).transition().duration(100).attr("fill", "#ff9316");
            //     $scope.activeYears = [selectedYear];
            // }
            // });
        };

        let drawBarChart = (data, svgElement) => {
            svgElement.mainGroup
                .selectAll("rect")
                .data(data)
                .join(
                    (enter) => handleEnter(enter, svgElement),
                    (update) => handleUpdate(update, data, svgElement),
                    (exit) => exit.remove()
                );

            // Barchart labels
            svgElement.mainGroup
                .selectAll("text")
                .data(data)
                .join(
                    (enter) => handleLabelsEnter(enter, svgElement),
                    (update) => handleLabelsUpdate(update, svgElement)
                );
        };

        $scope.handleBarChartMetricChange = function () {
            if ($scope.barChartInitialized) {
                // Update map
                dataService.getCountriesStatistics($scope.selectedMetric).then((data) => {
                    $scope.countriesData = data;
                });

                // Update barchart
                let dataToBePlotted = $scope.globalStatistics.map((d) => ({ label: d.year, val: d.statistics[$scope.selectedMetric] }));

                drawBarChart(dataToBePlotted, barChartSvgElement);
            }
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
         * Function that handles the click on the top countries flags
         * @param {string} value
         */
        $scope.handleTopCountryClick = function (value, type) {
            $scope.selectedTopCountry = value;
            dataService.selectedCountryController = value;
            dataService.secondaryMenuSelectedValue = "country";
            dataService.changePage();
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

        $scope.handleBarChartMetricChange = function () {
            if ($scope.barChartInitialized) {
                // Update map
                dataService.getCountriesStatistics($scope.selectedMetric).then((data) => ($scope.countriesData = data));

                // Update barchart
                let dataToBePlotted = $scope.globalStatistics.map((d) => ({ label: d.year, val: d.statistics[$scope.selectedMetric] }));

                colorScaleBarChart = d3_scaleLogMinMax(
                    dataToBePlotted.map((d) => d.val),
                    [colorScheme[0], colorScheme[8]]
                );

                drawBarChart(dataToBePlotted, barChartSvgElement);
            }
        };
        /*
         * Initialization functions
         */
        dataService.loadWorldMap().then((worldData) => {
            $scope.geoObject = initMap(worldData);

            dataService.getCountriesStatistics($scope.selectedMetric).then((data) => {
                $scope.countriesData = data;
                $scope.$apply();
            });
        });

        dataService.getWorldStatistics().then((data) => {
            $scope.globalStatistics = data;

            let dataToBePlotted = $scope.globalStatistics.map((d) => ({ label: d.year, val: d.statistics[$scope.selectedMetric] }));

            if (!$scope.barChartInitialized) {
                barChartSvgElement = createGlobalStatisticsStructure(dataToBePlotted);
                $scope.barChartInitialized = true;
            }

            drawBarChart(dataToBePlotted, barChartSvgElement);
        });
    }
})();
