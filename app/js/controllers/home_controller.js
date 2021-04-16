(function () {
    "use strict";

    // reloading the angular module
    angular.module("main").controller("homeController", homeController);

    /**
     * Function that handlle the user login
     */

    homeController.$inject = ["$scope", "$state", "dataService", "feedService"];

    function homeController($scope, $state, dataService, feedService) {
        $scope.feeds = feedService.feeds;
        let geoData;
        let projection;

        $scope.playPauseBtn = null;
        $scope.isRunning = true;

        $scope.yearIntervalData = null;

        let isBadCountry = (props) => {
            return !props || !(props instanceof Country);
        };

        dataService.loadWorldMap().then((data) => {
            // TODO: Enter, update and exit cycle
            drawMap(data);

            $scope.playPauseBtn = IC_PAUSE;
            $scope.$apply();

            document.getElementById("playpause-btn")
                    .addEventListener("click", () => {
                        const isPaused = $scope.playPauseBtn === IC_PAUSE;

                        $scope.playPauseBtn = isPaused
                            ? IC_PLAY : IC_PAUSE;
                        $scope.isRunning = !isPaused;
                        $scope.$apply();
                    });
        });

        $scope.$watch('isRunning', (newVal, oldVal) => {
            if (newVal != oldVal) {
                if (!newVal) {
                    // TODO: Pause the map simulation
                } else {
                    // TODO: Unpause the map simulation
                }
            }
        });

        $scope.$watch('yearIntervalData', (newVal, oldVal) => {
            if (newVal != oldVal) {
                console.log("Updated interval data");
            }
        });

        const defineArc = (source, target) => {
            if (source && target) {
                const sourceX = source[0],
                    sourceY = source[1];

                const targetX = target[0],
                    targetY = target[1];
                const dx = targetX - sourceX,
                    dy = targetY - sourceY;

                let euclideanDistance = Math.sqrt(dx * dx + dy * dy);

                let sharpness = 0;
                if (euclideanDistance < 100) {
                    sharpness = 0.1;
                } else {
                    sharpness = 1.5;
                }

                const midXY = [(sourceX + targetX) / 2, (sourceY + targetY) / 2];

                return (
                    "M" +
                    sourceX +
                    "," +
                    sourceY +
                    "S" +
                    (midXY[0] + 50 * sharpness) +
                    "," +
                    (midXY[1] - 75 * sharpness) +
                    "," +
                    targetX +
                    "," +
                    targetY
                );
            } else {
                console.log(target);
                return "M0,0,l0,0z";
            }
        };

        /**
         * Function that draws the migration on the map
         * @param {object} map
         */
        let drawArcs = (map) => {
            dataService.getCountriesInwardOutwardMigrants().then((data) => {
                let yearIntervalData = [
                    { yearRange: "1990-1995", yearData: [] },
                    { yearRange: "1995-2000", yearData: [] },
                    { yearRange: "2000-2005", yearData: [] },
                    { yearRange: "2005-2010", yearData: [] },
                    { yearRange: "2010-2015", yearData: [] },
                    { yearRange: "2015-2019", yearData: [] },
                ];

                for (let o of yearIntervalData) {
                    for (let c of data) {
                        let prev = c;

                        if (c.Year == 1995) break;
                        let intervalData = {
                            destination: {
                                name: c.Destination,
                                radius: 2,
                                fillKey: "markers",
                                centroid: c.centroid,
                            },
                            origins: [],
                        };

                        data.forEach((c1) => {
                            if (c.Destination == c1.Destination && c.Year != c1.Year) {
                                let keys = Object.keys(c1).slice(4);
                                keys.forEach((k) => {
                                    let weight = 0;
                                    if (k !== c.Destination) {
                                        let source = {
                                            name: k,
                                            radius: 2,
                                            fillKey: "marker",
                                            year: prev.Year + "-" + c1.Year,
                                            centroid: data.find((e) => e.Destination === k).centroid,
                                        };

                                        if (!(k in c)) {
                                            source.weight = c1[k];
                                        } else {
                                            weight = c1[k] - c[k];
                                        }

                                        let yearRange = o.yearRange.split("-");
                                        if (prev.Year == +yearRange[0] && c1.Year == +yearRange[1]) {
                                            if (weight > 10000) {
                                                source.weight = weight;
                                                intervalData.origins.push(source);
                                            }
                                        }
                                    }
                                });
                                prev = c1;
                            }
                        });
                        o.yearData.push(intervalData);
                    }
                }

                $scope.yearIntervalData = yearIntervalData;

                if (!map.selectAll(".arch-container")._groups[0].length) {
                    map.append("g").attr("class", "arch-container");
                }

                for (let i = 0; i < yearIntervalData[0].yearData.length; i++) {
                    map.selectAll(".arch-container")
                        .data(yearIntervalData[0].yearData[i].origins)
                        .enter()
                        .append("svg:path")
                        .attr("class", (d) => d.name)
                        .style("stroke-linecap", "round")
                        .attr("stroke", () => "red")
                        .attr("stroke-width", () => 0.3)
                        .attr("fill", "none")
                        .attr("d", (d) => defineArc(d.centroid, yearIntervalData[0].yearData[i].destination.centroid));
                }
            });
        };

        let svgGroup;

        let drawMap = (data) => {
            let mapContainer = d3.select("#map");
            let svgWidth = mapContainer.node().getBoundingClientRect().width;
            let svgHeight = mapContainer.node().getBoundingClientRect().height;
            projection = d3
                .geoMercator()
                .scale(170)
                .translate([svgWidth / 2, svgHeight / 2 + 128]);

            data.forEach((d) => {
                if (isBadCountry(d.properties)) return;

                d.properties.props["C"] = projection(d3.geoCentroid(d));
            });

            let path = d3.geoPath().projection(projection);

            let svgMap = mapContainer.append("svg").attr("width", svgWidth).attr("height", svgHeight);
            svgGroup = svgMap.append("g");
            svgGroup
                .selectAll("path")
                .data(data)
                .enter()
                .append("path")
                .attr("d", path)
                .attr("stroke-width", 0.1)
                .attr("class", "countries-home")
                .attr("id", (d) => d.id)
                .on("click", (e, d) => {
                    console.log(e);
                    console.log(d);
                });

            svgMap.call(zoom);
            svgMap.call(zoom.transform, () => d3.zoomIdentity.scale(1));

            drawArcs(svgGroup);
        };

        let zoom = d3
            .zoom()
            .scaleExtent([1, 10])
            .on("zoom", (event) => {
                svgGroup.attr("transform", event.transform);
            });

        let data = [
            { year: "1990", value: 5000 },
            { year: "1995", value: 15000 },
            { year: "2000", value: 2000 },
            { year: "2005", value: 8000 },
            { year: "2010", value: 10000 },
            { year: "2015", value: 20000 },
            { year: "2019", value: 15000 },
        ];

        let drawAreaChart = () => {
            let margin = { left: 50, right: 10, top: 10, bottom: 20 };
            let areaChartContainer = d3.select("#home-line-chart");
            let svgWidth = areaChartContainer.node().getBoundingClientRect().width - margin.left - margin.right;
            let svgHeight = areaChartContainer.node().getBoundingClientRect().height - margin.top - margin.bottom;

            let parseDate = d3.timeParse("%Y");
            data.forEach(function (d) {
                d.year = parseDate(d.year);
            });

            // creating the x axis generator
            let x = d3
                .scaleTime()
                .domain([d3.timeMonth.offset(data[0].year, -4), d3.timeMonth.offset(data[6].year, +2)]) //parseDate("1990"), parseDate("2020")])
                .range([0, svgWidth - margin.right]);

            // creating the y axis generator
            let y = d3
                .scaleLinear()
                .domain([0, d3.max(data, (d) => d.value)])
                .range([svgHeight - margin.top - margin.bottom, 0]);

            // crating the area generator
            let areaGenerator = d3
                .area()
                .x((d, i) => x(d.year))
                .y1((d) => y(d.value))
                .y0(svgHeight - margin.top - margin.bottom);

            // creating the svg element
            let svgAreaChart = areaChartContainer
                .append("svg")
                .attr("width", svgWidth + margin.left)
                .attr("height", svgHeight)
                .append("g")
                .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

            // inserting the y axis
            svgAreaChart
                .append("g")
                .attr("class", "axis-dark-cyan")
                .call(d3.axisLeft(y).tickFormat(d3.format(".2s")));

            // inserting the x axis
            svgAreaChart
                .append("g")
                .attr("class", "axis-dark-cyan")
                .attr("transform", "translate(0, " + (svgHeight - margin.top - margin.bottom) + ")")
                .call(d3.axisBottom(x).ticks(data.length));

            // inserting the circles
            svgAreaChart
                .append("g")
                .selectAll(".year-circle")
                .data(data)
                .enter()
                .append("circle")
                .attr("class", "year-circle")
                .attr("cx", (d) => x(d.year))
                .attr("cy", (d) => y(d.value))
                .attr("r", 5);

            // inserting the years lines
            svgAreaChart
                .append("g")
                .selectAll(".year-line")
                .data(data)
                .enter()
                .append("line")
                .attr("class", "year-line")
                .attr("y1", y.range()[0])
                .attr("y2", y.range()[1])
                .attr("x1", (d) => x(d.year))
                .attr("x2", (d) => x(d.year));

            let area_a = svgAreaChart.selectAll("path").data(data);

            area_a.enter().append("path").attr("d", areaGenerator(data)).attr("class", "area-chart");
        };

        drawAreaChart();
    }
})();
