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
        let projection;
        let svgGroup;
        let svgMapWidth;
        let svgMapHeight;
        let yearsData = [];
        let pressed = false;
        let yearsInterval = ["1990-1995", "1995-2000", "2000-2005", "2005-2010", "2010-2015", "2015-2019"];
        let j = 0;

        $scope.playPauseBtn = null;
        $scope.isRunning = true;

        let isBadCountry = (props) => {
            return !props || !(props instanceof Country);
        };

        let pauseArcs = () => {
            $scope.geoObject.element
                .selectAll(".arch-path").interrupt();
        }


        dataService.loadWorldMap().then((data) => {
            // TODO: Enter, update and exit cycle
            $scope.geoObject = initMap(data);
            drawMap($scope.geoObject);

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
                    pauseArcs();
                } else {
                    // TODO: Unpause the map simulation
                }
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
                return "M0,0,l0,0z";
            }
        };
        
        // i := Single year range iterations counter
        // j := Different year ranges counter 
        let drawArcs = (map, i) => {
            if (j == 5) j = 0;

            let yearData = yearsData.filter((arc) =>
                arc.year == yearsInterval[j]);

            console.log("Update arcs", yearData.length);

            let arcElems = map.select(".arch-container")
                .selectAll(".arch-path")
                .data(yearData);

            arcElems.exit().remove();

            let arcElemsEnter = arcElems.enter()
                .append("path")
                .attr("class", "arch-path")
                .attr("stroke-width", 1);

            arcElems = arcElemsEnter
                .merge(arcElems)
                .attr("stroke", "none")
                .attr("fill", "none")
                .attr("d", (d) => 
                    defineArc(d.sourceCentroid,
                        d.destinationCentroid));
                // .call(moveMigrants, i, map);

            // console.log("init");
            // map.select(".arch-container").selectAll(".arch-path").remove();
            // if (j == 5) j = 0;
            // let yearData = yearsData.filter((arc) => arc.year == yearsInterval[j]);
            // console.log(yearData.length);
            // map.select(".arch-container")
            //     .selectAll(".arch-path")
            //     .data(yearData)
            //     .enter()
            //     .append("path")
            //     .attr("class", "arch-path")
            //     .attr("stroke", "none")
            //     .attr("fill", "none")
            //     .attr("stroke-width", 1)
            //     .attr("d", (d) => {
            //         return defineArc(d.sourceCentroid, d.destinationCentroid);
            //     });

            update(map, arcElems, i);
        };

        // function moveMigrants(d3Selection, _i, mapSelection) {
        //     let arcElemsTrans = d3Selection
        //         .transition()
        //         .duration(5000)
        //         .attr("stroke", "red")
        //         .attr("stroke-dashoffset", function () {
        //             return this.getTotalLength();
        //         })
        //         .attrTween("stroke-dasharray", tweenDash)
        //         .on("interrupt", function () {
        //             let currentElem = this;
        //             d3.select(this).on("mouseover", function () {
        //                 let arcData = d3.select(this).datum();
        //                 d3.select(this).attr("stroke", "blue");
        //                 localDashArray.set(currentElem, d3.select(this).attr("stroke-dasharray"));
        //                 d3.select(this)
        //                     // .transition()
        //                     // .duration(100)
        //                     .attr("stroke-dasharray", this.getTotalLength() + ", 0");
        //             });

        //             d3.select(this).on("mouseout", function () {
        //                 d3.select(this).attr("stroke", "red");
        //                 d3.select(this).attr("stroke-dasharray", localDashArray.get(currentElem));
        //                 d3.select(this)
        //                     // .transition().duration(100)
        //                     .attr("stroke-dashoffset", this.getTotalLength());
        //             });
        //         })
        // 
        //         arcElemsTrans.end().then(
        //             () => {
        //                 console.log("Update - then", _i, j);
        //                 if (_i > 1) {
        //                     j++;
        //                     drawArcs(mapSelection, 0);
        //                 } else {
        //                     moveMigrants(d3Selection, _i + 1,
        //                                  mapSelection);
        //                 }
        //             },
        //             (e) => {
        //                 console.log(e);
        //             }
        //         );
        // }

        function tweenDash() {
            var l = this.getTotalLength();
            var i = d3.interpolateString("0," + l, l + "," + l);
            return function (t) {
                return i(t);
            };
        }

        let localDashArray = d3.local();

        let update = (map, arcElems, i) => {
            console.log("Update");
            // map.select(".arch-container")
            //     .selectAll(".arch-path")
            let arcElemsTrans = arcElems
                .transition()
                .duration(5000)
                .attr("stroke", "red")
                .attr("stroke-dashoffset", function () {
                    return this.getTotalLength();
                })
                .attrTween("stroke-dasharray", tweenDash)
                .on("interrupt", function () {
                    let currentElem = this;
                    d3.select(this).on("mouseover", function () {
                        let arcData = d3.select(this).datum();
                        d3.select(this).attr("stroke", "blue");
                        localDashArray.set(currentElem, d3.select(this).attr("stroke-dasharray"));
                        d3.select(this)
                            // .transition()
                            // .duration(100)
                            .attr("stroke-dasharray", this.getTotalLength() + ", 0");
                    });

                    d3.select(this).on("mouseout", function () {
                        d3.select(this).attr("stroke", "red");
                        d3.select(this).attr("stroke-dasharray", localDashArray.get(currentElem));
                        d3.select(this)
                            // .transition().duration(100)
                            .attr("stroke-dashoffset", this.getTotalLength());
                    });
                })

                arcElemsTrans.end().then(
                    () => {
                        console.log("Update - then", i, j);
                        if (i > 1) {
                            j++;
                            drawArcs(map, 0);
                        } else {
                            update(map, arcElems, i + 1);
                        }
                    },
                    (e) => {
                        console.log(e);
                    }
                );
        };

        /**
         * Function that draws the migration on the map
         * @param {object} map
         */
        let initArcs = (map) => {
            dataService.getCountriesInwardOutwardMigrants().then((data) => {
                for (let c of data) {
                    let prev = c;
                    if (c.Year == 1995) break;
                    data.forEach((c1) => {
                        if (c.Destination == c1.Destination && c.Year != c1.Year) {
                            let keys = Object.keys(c1).slice(4);
                            keys.forEach((k) => {
                                let weight = 0;
                                if (k !== c.Destination) {
                                    let source = {
                                        sourceName: k,
                                        destinationName: c.Destination,
                                        radius: 2,
                                        year: prev.Year + "-" + c1.Year,
                                        sourceCentroid: data.find((e) => e.Destination === k).centroid,
                                        destinationCentroid: c.centroid,
                                    };

                                    weight = !(c in c) ? (weight = c1[k]) : c1[k] - c[k];

                                    if (weight > 100000) {
                                        source.weight = weight;
                                        yearsData.push(source);
                                    }
                                }
                            });
                            prev = c1;
                        }
                    });
                }

                if (!map.selectAll(".arch-container")._groups[0].length) {
                    map.append("g").attr("class", "arch-container");
                }

                drawArcs(map, 0);
            });
        };

        let initMap = (worldData) => {
            let mapContainer = d3.select("#map");
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

            let svgMap = svgMapContainer.append("g").attr("id", "map-group");
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

        let _handleMapEnter = (_enter, _path) => {
            _enter
                .append("path")
                .attr("d", _path)
                .attr("class", "countries")
                .attr("id", (d) => d.id)
                .attr("fill", "#b0b0b0")
                .attr("stroke", "#a0a0a0");
        };

        let drawMap = (geoObject) => {
            if (!geoObject.element.selectAll(".map-container")._groups[0].length) {
                geoObject.element.append("g").attr("class", "map-container");
            }
            geoObject.element
                .select(".map-container")
                .selectAll("path")
                .data(geoObject.data)
                .join(
                    (enter) => _handleMapEnter(enter, geoObject.path),
                    (exit) => exit.remove()
                );

            initArcs(geoObject.element);
        };

        let zoom = d3
            .zoom()
            .scaleExtent([1, 10])
            .on("zoom", (event) => {
                svgGroup.attr("transform", event.transform);
            });

        // TODO: Remove dummy area chart data
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
