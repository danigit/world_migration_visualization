(function () {
    "use strict";

    // reloading the angular module
    angular.module("main").controller("statisticsController", statisticsController);

    /**
     * Function that handles the statistics page functionalities
     */
    statisticsController.$inject = ["$scope", "$state", "dataService"];

    function statisticsController($scope, $state, dataService) {
        $scope.visualizationType = "";
        $scope.selectedTopCountryValue = "";
        $scope.secondaryMenuSelectedValue = "world";
        $scope.statisticsButtons = dataService.menuButtons;
        $scope.visualizationTypes = dataService.visualizationTypes;
        $scope.topFlags = dataService.topFlags;
        $scope.selectedTopFlag = "";
        $scope.countriesData = null;
        

        $scope.$watch('countriesData', function(_new, _old) {
            if(_new !==_old) {
                dataService.loadWorldMap()
                    .then((data) => drawMap(data, _new));
            }
        });

        const BAD_COUNTRY_COLOR = '#b53737';

        $scope.globalStatisticsVisName = "Global statistics";
        $scope.selectedMetric = "total_immigration";
        $scope.barChartInitialized = false;
        $scope.globalStatistics = {
        };

        let selectedYear = 1990;
        let barChartSvgElement;
        let svgGroup;
        let colors = d3.scaleOrdinal(d3.schemeBlues[7]);

        let isBadCountry = (props) => {
            return !props || !(props instanceof Country)
        };

        let drawMap = (data, statistics) => {
            // TODO: Enter - update - exit pattern
            let mapContainer = d3.select("#map");
            mapContainer.html('');

            let svgWidth = mapContainer.node().getBoundingClientRect().width;
            let svgHeight = mapContainer.node().getBoundingClientRect().height;

            let projection = d3
                .geoMercator()
                .scale(170)
                .translate([svgWidth / 2, svgHeight / 2]);

            let path = d3.geoPath().projection(projection);

            let zoomMap = d3.zoom()
            .scaleExtent([1, 10])
            .on("zoom", (e) =>
                svgGroup.attr("transform", e.transform));

            let svgMap = mapContainer.append("svg").attr("width", svgWidth).attr("height", svgHeight);
            svgGroup = svgMap.append("g");

            let geoJson = data;

            geoJson.forEach(d => {
                if (isBadCountry(d.properties))
                    return;

                d.properties.props['C'] = projection(d3.geoCentroid(d))
            });

            svgGroup
                .selectAll("path")
                .data(geoJson)
                .enter()
                .append("path")
                .attr("d", path)
                .attr("class", "countries")
                .attr("id", d => d.id)
                .attr("fill", d => {
                    if (isBadCountry(d.properties)) {
                        return BAD_COUNTRY_COLOR;
                    }

                    const statsFiltered = statistics.filter(s =>
                            s.Destination === d.properties.name);

                    const statAvg = statsFiltered.reduce((sum, curr) =>
                            sum + +curr.Total, 0) / statsFiltered.length;

                    // TODO: Change the fill attribute following
                    // the color scale on the current metric
                    return colors(statAvg);
                })
                .on("click", (_, d) => {
                    if (isBadCountry(d.properties)) {
                        console.log('Unknown country:', d.id);
                        return;
                    }
                    
                    $state.go('country', { countryName:
                            slugify(d.properties.visName) });
                })
                .on("mouseover", function(_, d) {
                    if (isBadCountry(d.properties)) {
                        console.log('Unknown country:', d.id);
                        return;
                    }

                    console.log('Hovering over:', d.properties.visName);

                    // TODO: Extract the current metric value
                    // solely for the hovered country.

                    // TODO: Fill the bottom-center section with
                    // relevant info on the hovered country.

                    d3.select(this).transition()
                        .duration(1).style('fill', '#800080')
                })
                .on('mouseout',  function(_, d) {
                    if (isBadCountry(d.properties)) {
                        console.log('Unknown country:', d.id);
                        return;
                    }

                    // TODO: Fill the bottom-center section with
                    // a general template of insertion.

                    d3.select(this).transition()
                        .duration(1).style('fill',
                                colors(d3.sum(d.id.split(''), (c) => c.charCodeAt(c))))
                });

            // Centroids
            const geoCentroids = svgGroup.selectAll('circle')
                .data(geoJson.filter(d => !isBadCountry(d.properties)));

            geoCentroids.enter().append('circle')
                    .attr('cx', d => d.properties.props.C[0])
                    .attr('cy', d => d.properties.props.C[1])
                    .attr('r',  2)
                .on('mouseover', function(_, d) {
                    d3.select(this).transition()
                        .duration(1).attr('r', 4);
                    
                    console.log(d)})
                .on('mouseout',  function() {
                    d3.select(this).transition()
                        .duration(1).attr('r', 2)});

            svgMap.call(zoomMap);
            svgMap.call(zoomMap.transform,
                    () => d3.zoomIdentity.scale(1));
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
            let maxY = d3.max(data,
                (d) => d.val
            );

            let x = d3
                .scaleBand()
                .range([margins.left, commonWidth - margins.right])
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
                .attr("fill", (d, i) => colors(d.label))
                .attr("x", (d) => svgElement.x(d.label))
                .attr("y", svgElement.y(0))
                .attr("width", svgElement.x.bandwidth())
                .attr("y", svgElement.y(0))
                .transition()
                .duration(1000)
                .attr("y", (d) => svgElement.y(d.val))
                .attr("height", (d) => svgElement.height - svgElement.margins.bottom - svgElement.margins.top - svgElement.y(d.val));

            enter.selectAll("rect")
                .on("click", function(e, d) {
                    if (selectedYear!==-1) {
                        d3.select("#global-statistics").selectAll("g rect.selected")
                            .classed("selected", false)
                            .transition()
                            .duration(100) 
                            .attr("fill", (datum, i) => {
                                return colors(datum.label);
                            });
                    }
                    selectedYear=d.label;
                    d3.select(this)
                        .classed("selected", true)
                        .transition()
                        .duration(100)
                        .attr("fill", "#ff9316");
                    // updateMap();
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
                // .attr("transform", (d) => "rotate(-45, " + svgElement.x(d.label) + ", " + (svgElement.y(d.val) - 8) + ")")
                //.attr("text-anchor", "start");
        };

        let handleUpdate = (update, data, svgElement) => {
            let maxY = d3.max(data,
                (d) => d.val
            );
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
                .attr("fill", (d, i) => colors(d.label));
            
            update.selectAll("rect")
                .on("click", function(e, d) {
                    if (selectedYear!==-1) {
                        d3.select("#global-statistics").selectAll("g rect.selected")
                            .classed("selected", false)
                            .transition()
                            .duration(100) 
                            .attr("fill", (datum, i) => {
                                return colors(datum.label);
                            });
                    }
                    selectedYear=d.label;
                    d3.select(this)
                        .classed("selected", true)
                        .transition()
                        .duration(100)
                        .attr("fill", "#ff9316");
                    // updateMap();
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

        dataService.getWorldStatistics().then(data => {
            $scope.globalStatistics=data;

            let dataToBePlotted = $scope.globalStatistics.map((d) => ({label:d.year, val:d.statistics[$scope.selectedMetric]})); 

            
            if (!$scope.barChartInitialized) {
                barChartSvgElement = createGlobalStatisticsStructure(dataToBePlotted);
                $scope.barChartInitialized = true;
            }
            drawBarChart(dataToBePlotted, barChartSvgElement);
            
        });


        $scope.handleBarChartMetricChange = function() {
            if ($scope.barChartInitialized) {
                let dataToBePlotted = $scope.globalStatistics.map((d) => ({label:d.year, val:d.statistics[$scope.selectedMetric]})); 
                drawBarChart(dataToBePlotted, barChartSvgElement);
                dataService.getCountriesStatistics(
                    $scope.selectedMetric)
                .then(data => $scope.countriesData = data);
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
    }
})();
