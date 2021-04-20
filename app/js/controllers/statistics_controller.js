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
        $scope.top5Countries = [];
        $scope.flop5Countries = [];
        $scope.selectedTopFlag = "";
        $scope.countriesData = null;

        let _updateTitle = () => {
            titleLabel.innerHTML = $scope.visualizationTypes.find((t) => t.value === $scope.selectedMetric).text;

            let yearText = null;
            let activeLength = $scope.activeYears.length;

            if (activeLength == 1) {
                yearText = $scope.activeYears[0];
            } else {
                yearText = `${$scope.activeYears[0]} - ${$scope.activeYears[activeLength - 1]}`;
            }

            titleYear.innerHTML = yearText;
        };

        $scope.$watch("countriesData", function (_new, _old) {
            if (_new !== _old) {
                _updateTitle();

                drawMap($scope.geoObject);
            }
        });

        $scope.$watch("activeYears", function (_new, _old) {
            if (_new !== _old) {
                _updateTitle();

                drawMap($scope.geoObject, false);
            }
        });

        const titleYear = document.getElementById("title-year");
        const titleLabel = document.getElementById("title-label");

        const BAD_COUNTRY_COLOR = "#ff5952";
        const HIGHLIGHTED_COLOR = "#ff9316";

        const colorScheme = d3.schemeBlues[9];
        let colorScale, colorTicks;

        $scope.globalStatisticsVisName = "Global statistics";
        $scope.selectedMetric = "total_immigration";
        $scope.barChartInitialized = false;

        $scope.geoObject = null;
        $scope.activeYears = dataService.getActiveYears();

        $scope.globalStatistics = {};

        // let selectedYear = -1;
        let barChartSvgElement;

        let isBadCountry = (props) => {
            return !props || !(props instanceof Country);
        };

        let svgMapWidth;
        let svgMapHeight;

        let initMap = (worldData) => {
            let mapContainer = d3.select("#map-container");
            mapContainer.html("");

            svgMapWidth = mapContainer.node().getBoundingClientRect().width;
            svgMapHeight = mapContainer.node().getBoundingClientRect().height;

            let svgPaddings = { top: 128, right: 0, bottom: 0, left: 0 };

            let mapProjection = d3
                .geoMercator()
                .scale(170)
                .translate([svgMapWidth / 2, svgMapHeight / 2 + svgPaddings.top]);

            let geoPath = d3.geoPath().projection(mapProjection);

            let svgMapContainer = mapContainer.append("svg").attr("width", svgMapWidth).attr("height", svgMapHeight);

            let svgMap = svgMapContainer.append("g").attr("id", "map");
            svgMapContainer.append("g").classed("legends", true);
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
                mapContainer: svgMapContainer,
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

            // Extract Top 5 and Flop 5 countries
            const sorted_avgByCountry = Object.entries(statistics_avgByCountry).sort((a, b) => d3.descending(a[1], b[1]));

            let top5Countries = sorted_avgByCountry.slice(0, 5);
            let flop5Countries = sorted_avgByCountry.slice(-5);

            // Extract Country objects from the name
            dataService.countries.then((data) => {
                top5Countries.forEach((o, i, a) => (a[i][0] = data.find((c) => o[0] === c.name)));

                flop5Countries.forEach((o, i, a) => (a[i][0] = data.find((c) => o[0] === c.name)));

                $scope.top5Countries = top5Countries;
                $scope.flop5Countries = flop5Countries;

                $scope.$apply();
            });

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

            let _handleMapOnMouseOver = (e, d, _statistics) => {
                d3.select(e.target).transition().duration(100).attr("fill", HOVERED_COLOR);

                if (isBadCountry(d.properties)) {
                    $scope.hoveredCountry = {
                        visName: "Unknown country",
                    };
                } else {
                    let v = _statistics[d.properties.name];

                    $scope.hoveredCountry = Object.assign({}, d.properties);

                    if (isNaN(v)) {
                        console.log("Data not available:", d.id);
                        $scope.hoveredCountry.value = "Data not available";
                    } else {
                        $scope.hoveredCountry.value = transformNumberFormat(v, false, 1, $scope.selectedMetric);
                    }

                    console.log("Hovering over:", d.properties.visName, "-", v);
                }

                // Check if a dispatch is under way
                if (!$scope.$$phase) $scope.$apply();
            };

            let _handleMapOnMouseOut = (e, d, _statistics) => {
                let fillColor = null;

                $scope.hoveredCountry = {};

                // Check if a dispatch is under way
                if (!$scope.$$phase) $scope.$apply();

                if (isBadCountry(d.properties)) {
                    fillColor = BAD_COUNTRY_COLOR;
                } else {
                    const v = _statistics[d.properties.name];

                    if (isNaN(v)) {
                        fillColor = BAD_COUNTRY_COLOR;
                    } else {
                        fillColor = colorScale(v);
                    }
                }

                d3.select(e.target).transition().duration(100).attr("fill", fillColor);
            };

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

                        return colorScale(v);
                    })
                    .on("click", (_, d) => {
                        if (isBadCountry(d.properties)) {
                            console.log("Unknown country:", d.id);
                            return;
                        }

                        $state.go("country", { countryName: slugify(d.properties.visName) });
                    })
                    .on("mouseover", (e, d) => _handleMapOnMouseOver(e, d, _statistics))
                    .on("mouseout", (e, d) => _handleMapOnMouseOut(e, d, _statistics));
            };

            let _handleMapUpdate = (_update, _statistics) => {
                _update
                    .on("mouseover", (e, d) => _handleMapOnMouseOver(e, d, _statistics))
                    .on("mouseout", (e, d) => _handleMapOnMouseOut(e, d, _statistics))
                    .transition()
                    .duration(TRANSITION_DURATION)
                    .attr("fill", (d) => {
                        if (isBadCountry(d.properties)) {
                            return BAD_COUNTRY_COLOR;
                        }

                        const v = _statistics[d.properties.name];

                        if (isNaN(v)) {
                            return BAD_COUNTRY_COLOR;
                        }

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

            // Create color legend
            colorTicks = colorScale.ticks(9);
            // console.log(colorTicks.map(d => colorScale(d)));

            const rectWidth = 35;
            const rectMargin = 25;

            geoObject.mapContainer
                .select(".legends")
                .selectAll(".legend-group")
                .data(colorTicks)
                .join(
                    (enter) => {
                        let groups = enter
                            .append("g")
                            .attr("class", "legend-group")
                            .attr(
                                "transform",
                                (d, i) =>
                                    "translate(" +
                                    (svgMapWidth - rectWidth * colorTicks.length + i * rectWidth - rectMargin) +
                                    ", " +
                                    (svgMapHeight - 45) +
                                    ")"
                            );

                        groups
                            .append("rect")
                            .classed("legend", true)
                            .attr("width", rectWidth)
                            .attr("height", 20)
                            .attr("stroke", "#000000")
                            .style("fill", (d) => colorScale(d));

                        groups
                            .append("text")
                            .attr("stroke", "white")
                            .attr("font-size", "10px")
                            .attr("transform", "translate(10, 35)")
                            .text((d) => transformNumberFormat(d, false, 0, $scope.selectedMetric));
                    },

                    (update) => {
                        update.attr(
                            "transform",
                            (d, i) =>
                                "translate(" +
                                (svgMapWidth - rectWidth * colorTicks.length + i * rectWidth - rectMargin) +
                                ", " +
                                (svgMapHeight - 45) +
                                ")"
                        );
                        update.each(function (d, i) {
                            let group = d3.select(this);
                            group.select("text").text(transformNumberFormat(d, false, 0, $scope.selectedMetric));

                            group.select("rect").style("fill", colorScale(d));
                        });
                    },
                    (exit) => exit.remove()
                );

            geoObject.mapContainer
                .select(".legends")
                .selectAll(".legend-group-unk")
                .data([colorTicks.length])
                .join(
                    (enter) => {
                        let unknownGroup = enter
                            .append("g")
                            .attr("class", "legend-group-unk")
                            .attr(
                                "transform",
                                (d) => "translate(" + (svgMapWidth - rectWidth * d - 4 * rectMargin) + ", " + (svgMapHeight - 45) + ")"
                            );

                        unknownGroup
                            .append("rect")
                            .classed("legend-unk", true)
                            .attr("width", rectWidth)
                            .attr("height", 20)
                            .style("fill", BAD_COUNTRY_COLOR);

                        unknownGroup
                            .append("text")
                            .attr("stroke", "white")
                            .attr("font-size", "10px")
                            .attr("transform", (d) => "translate(10, 35)")
                            .text("N.A.");
                    },
                    (update) => {
                        update.attr(
                            "transform",
                            (d, i) => "translate(" + (svgMapWidth - rectWidth * d - 4 * rectMargin) + ", " + (svgMapHeight - 45) + ")"
                        );
                    }
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
                })
                .on("mouseout", function () {
                    d3.select(this).transition().duration(100).attr("r", 2);
                });
        };

        let createGlobalStatisticsStructure = (data) => {
            let container = d3.select("#global-statistics");
            let margins = { top: 20, right: 20, bottom: 60, left: 20 };
            let commonWidth = 360 - margins.left - margins.right;
            let commonHeight = 300 - margins.top - margins.bottom;

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
                .padding(0.3)
                .domain(xLabels);

            let y = d3
                .scaleLinear()
                .domain([0, maxY])
                .range([commonHeight - margins.top - margins.bottom, 0]);

            /* let tickInterval = ;
            let tickValues = data.map(function(d) { return d.val; }).filter(function(d, i) { return i % tickInterval === 0 });
            let xAxisLower = d3.axisBottom(x)
                .tickFormat(d3.timeFormat("%m-%d"))
                .tickValues(tickValues)
                .tickPadding(15);  */

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
                .call(d3.axisLeft(y).ticks(8).tickSize(-commonWidth).tickSizeOuter(0).tickFormat(d3.format(".2s")));

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
                .attr("fill", colorScheme[4])
                .attr("x", (d) => svgElement.x(d.label))
                .attr("width", svgElement.x.bandwidth())
                .attr("y", (d) => svgElement.y(d.val))
                .attr("height", (d) => svgElement.height - svgElement.margins.bottom - svgElement.margins.top - svgElement.y(d.val))
                .attr("fill", colorScheme[4]);

            enter.selectAll("rect").on("click", function (e, d) {
                if (d3.select(this).classed("selected")) {
                    d3.select(this)
                        .classed("selected", false)
                        .transition()
                        .duration(100)
                        .attr("fill", (datum, i) => {
                            return colorScheme[4];
                        });

                    $scope.activeYears = dataService.getActiveYears();
                    $scope.$apply();
                } else {
                    d3.select("#global-statistics")
                        .selectAll("g rect.selected")
                        .classed("selected", false)
                        .transition()
                        .duration(100)
                        .attr("fill", (datum, i) => {
                            return colorScheme[4];
                        });

                    d3.select(this).classed("selected", true).transition().duration(100).attr("fill", HIGHLIGHTED_COLOR);

                    $scope.activeYears = [+d.label];
                    $scope.$apply();
                }
            });
        };

        let handleUpdate = (update, data, svgElement) => {
            let maxY = d3.max(data, (d) => d.val);
            let y = svgElement.y.domain([0, maxY]);

            svgElement.svgElement
                .select("g.grid-lines.y-axis")
                .transition()
                .duration(TRANSITION_DURATION)
                .call(d3.axisLeft(y).ticks(8).tickSize(-svgElement.width).tickSizeOuter(0).tickFormat(d3.format(".2s")));

            update
                .transition()
                .duration(TRANSITION_DURATION)
                .attr("y", (d) => svgElement.y(d.val))
                .attr("height", (d) => svgElement.height - svgElement.margins.bottom - svgElement.margins.top - svgElement.y(d.val))
                .attr("fill", function (datum, i) {
                    if (!d3.select(this).classed("selected")) return colorScheme[4];

                    return HIGHLIGHTED_COLOR;
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
                .attr("y", (d) => svgElement.y(d.val) - 4)
                .text((d) => {
                    return d.val !== "0.00" ? transformNumberFormat(d.val, false, 1, $scope.selectedMetric) : "";
                });
        };

        let handleLabelsUpdate = (update, svgElement) => {
            update
                .transition()
                .duration(TRANSITION_DURATION)
                .attr("y", (d) => svgElement.y(d.val) - 4)
                .text((d) => {
                    return d.val !== "0.00" ? transformNumberFormat(d.val, false, 1, $scope.selectedMetric) : "";
                });
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

            svgElement.mainGroup
                .selectAll("text")
                .data(data)
                .join(
                    (enter) => handleLabelsEnter(enter, svgElement),
                    (update) => handleLabelsUpdate(update, svgElement)
                );
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
            const _countryName = value.visName;
            $state.go("country", { countryName: slugify(_countryName) });
        };

        /**
         * Function that handles the mouse enter on the top countries flags
         * @param {string} value
         */
        $scope.showTopCountryHint = function (value, event, type) {
            const country = value[0];
            const isoAlpha3 = country.props.isoAlpha3;

            $scope.selectedTopFlag = capitalize(country.visName);

            // FIXME: Holy See is not present
            // in the TopoJSON file
            if (!(isoAlpha3 === "VAT")) {
                $scope.geoObject.element.select(`path#${isoAlpha3}`).dispatch("mouseover");
            } else {
                $scope.hoveredCountry = {
                    visName: "Country not available",
                };

                if (!$scope.$$phase) $scope.$apply();
            }

            let tooltip = document.getElementById("top-flags-tooltip");

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
        $scope.hideTopCountryHint = function (type, value) {
            const country = value[0];
            const isoAlpha3 = country.props.isoAlpha3;

            if (!(isoAlpha3 === "VAT")) {
                $scope.geoObject.element.select(`path#${isoAlpha3}`).dispatch("mouseout");
            } else {
                $scope.hoveredCountry = {};

                if (!$scope.$$phase) $scope.$apply();
            }

            let tooltip = document.getElementById("top-flags-tooltip");

            tooltip.classList.remove("display-block");
            tooltip.classList.add("display-none");

            tooltip.style.zIndex = -100;
        };

        $scope.handleBarChartMetricChange = function () {
            if ($scope.barChartInitialized) {
                // Update map
                dataService.getCountriesStatistics($scope.selectedMetric).then((data) => ($scope.countriesData = data));

                // Update barchart
                let dataToBePlotted = $scope.globalStatistics.map((d) => ({
                    label: d.year,
                    val: d.statistics[$scope.selectedMetric],
                }));

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

        _updateTitle();
    }
})();
