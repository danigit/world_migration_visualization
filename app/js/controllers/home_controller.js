(function () {
    "use strict";

    // reloading the angular module
    angular.module("main").controller("homeController", homeController);

    /**
     * Function that handlle the user login
     */

    homeController.$inject = ["$scope", "$rootScope", "$state", "dataService", "feedService"];

    function homeController($scope, $rootScope, $state, dataService, feedService) {
        $scope.feeds = feedService.feeds;

        const ARCS_DURATION = 3 * TRANSITION_DURATION;

        let svgMapWidth;
        let svgMapHeight;

        let migrationMagnitudeColors = ["#FF3333", "#F1860C", "#C5B409", "#F8FF42", "F6F990"];

        let yearsInterval = ["1990-1995", "1995-2000", "2000-2005", "2005-2010", "2010-2015", "2015-2019"];
        let yearsData = [];

        let yearIdx = 0;
        let yearRep = 0;

        let localDashArray = d3.local();
        let countries;
        let homeInfoBox;
        let zoomMap;

        $scope.playPauseBtn = null;
        $scope.isRunning = true;

        let isBadCountry = (props) => {
            return !props || !(props instanceof Country);
        };

        let pauseArcs = () => {
            $scope.geoObject.element.selectAll(".arch-path").interrupt();
            $scope.geoObject.element.selectAll("circle").interrupt();
        };

        let resumedDuration = (currentElem) => {
            let dashArray = localDashArray.get(currentElem);
            let trajectoryEndpoints = dashArray.split(",").map(Number);

            let elapsedPct = trajectoryEndpoints[0] / trajectoryEndpoints[1];

            return ARCS_DURATION * (1 - elapsedPct);
        };

        let _handleArcsRepetition = (map, arcElems) => {
            if (yearRep == HOME_MAP_YEAR_REPS) {
                yearRep = 0;
                yearIdx++;

                drawArcs(map);
            } else {
                yearRep++;

                updateArcs(map, arcElems, true);
            }
        };

        let arcsMouseOver = (path, d, source, destination, homeInfoBox) => {
            d3.select("#" + source.id)
                .transition()
                .delay(400)
                .attr("fill", HOVERED_COLOR)
                .attr("stroke", "#63b3d4");
            d3.select("#" + destination.id)
                .transition()
                .delay(400)
                .attr("fill", HOVERED_COLOR)
                .attr("stroke", "#63b3d4");
            d3.select(path).attr("stroke", "#0093c4").style("stroke-linecap", "round").attr("stroke-width", 5);

            d3.select(path)
                .transition()
                .duration(500)
                .attr("stroke-dasharray", path.getTotalLength() + ", 0");

            $scope.geoObject.element
                .selectAll(".arch-path")
                .filter((c) => {
                    return !(c.sourceName === d.sourceName && c.destinationName === d.destinationName);
                })
                .transition()
                .duration(200)
                .style("opacity", 0.1);

            d3.select(path).style("opacity", 1);

            homeInfoBox.innerHTML = `
                        <div class="width-100 color-white font-size-medium">
                        <div class="display-flex padding-3-px"><div class="width-100-px color-darkcyan">Source:</div><div class="text-right width-100">${
                            d.sourceName
                        }</div></div>
                        <div class="display-flex padding-3-px"><div class="width-100-px color-darkcyan">Destination:</div><div class="text-right width-100"> ${
                            d.destinationName
                        }</div></div>
                        <div class="display-flex padding-3-px"><div class="width-100-px color-darkcyan">Migration:</div><div class="text-right width-100"> ${transformNumberFormat(
                            d.weight
                        )}</div></div>
                        <div class="display-flex padding-3-px"><div class="width-100-px color-darkcyan">Years:</div><div class="text-right width-100"> ${
                            d.year
                        }</div></div>
                        </div>
                        `;
        };

        let arcsMouseOut = (path, source, destination, homeInfoBox) => {
            d3.select("#" + source.id)
                .interrupt()
                .attr("fill", HOME_COUNTRY_COLOR)
                .attr("stroke", HOME_COUNTRY_MAP_STROKE);
            d3.select("#" + destination.id)
                .interrupt()
                .attr("fill", HOME_COUNTRY_COLOR)
                .attr("stroke", HOME_COUNTRY_MAP_STROKE);

            d3.select(path)
                .attr("stroke", getMigrationColor(d3.select(path).data()[0].weight))
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", localDashArray.get(path));

            d3.select(path).interrupt().attr("stroke-dashoffset", path.getTotalLength());

            $scope.geoObject.element.selectAll(".arch-path").interrupt().transition().duration(200).style("opacity", 1);
            homeInfoBox.innerHTML = "Information on hover will be shown here";
        };

        // FIXME: handle split on undefined (dashArray)
        let resumeArcs = () => {
            let map = $scope.geoObject.element;

            let arcElems = map.select(".arch-container").selectAll(".arch-path").on("mouseover", null).on("mouseout", null);

            let arcElemsTrans = arcElems
                .transition()
                .duration(function () {
                    return resumedDuration(this);
                })
                .ease(d3.easeLinear)
                .attr("stroke", (d) => getMigrationColor(d.weight))
                .attr("stroke-dashoffset", function () {
                    return this.getTotalLength();
                })
                .attrTween("stroke-dasharray", function () {
                    let dashArray = localDashArray.get(this);
                    let startP = dashArray.split(",").map(Number)[0];

                    return tweenDash(this, startP);
                })
                .on("interrupt", function (d) {
                    let source = countries.find((c) => c.properties.name === d.sourceName);
                    let destination = countries.find((c) => c.properties.name === d.destinationName);
                    localDashArray.set(this, d3.select(this).attr("stroke-dasharray"));

                    d3.select(this).on("mouseover", function () {
                        arcsMouseOver(this, d, source, destination, homeInfoBox);
                    });

                    d3.select(this).on("mouseout", function () {
                        arcsMouseOut(this, source, destination, homeInfoBox);
                    });
                });

            arcElemsTrans.end().then(
                () => {
                    _handleArcsRepetition(map, arcElems);
                },
                (e) => {
                    console.log(e);
                }
            );
        };

        dataService.loadWorldMap().then((data) => {
            // TODO: Enter, update and exit cycle
            countries = data;
            $scope.geoObject = initMap(data);
            drawMap($scope.geoObject);

            $scope.playPauseBtn = IC_PAUSE;
            $scope.$apply();

            document.getElementById("playpause-btn").addEventListener("click", () => {
                const isPaused = $scope.playPauseBtn === IC_PAUSE;

                $scope.playPauseBtn = isPaused ? IC_PLAY : IC_PAUSE;
                $scope.isRunning = !isPaused;
                $scope.$apply();
            });

            homeInfoBox = document.querySelector("#home-info-div");
        });

        $scope.$watch("isRunning", (newVal, oldVal) => {
            if (newVal != oldVal) {
                if (!newVal) {
                    pauseArcs();
                } else {
                    resumeArcs();
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

        let drawArcs = (map) => {
            if (yearIdx == yearsInterval.length - 1) {
                yearIdx = 0;
                updateAreaChartTick(yearIdx);
            }

            let yearData = yearsData.filter((arc) => arc.year == yearsInterval[yearIdx]);

            let arcElems = map
                .select(".arch-container")
                .selectAll(".arch-path")
                .data(yearData)
                .join("path")
                .attr("class", "arch-path")
                .attr("stroke-width", 2)
                .attr("stroke", "none")
                .attr("fill", "none")
                .attr("d", (d) => defineArc(d.sourceCentroid, d.destinationCentroid))
                .attr("stroke-dashoffset", null)
                .attr("stroke-dasharray", null);

            updateArcs(map, arcElems);
        };

        function tweenDash(node, startP) {
            var l = node.getTotalLength();
            var i = d3.interpolateString(`${startP},` + l, l + "," + l);

            return function (t) {
                return i(t);
            };
        }

        let drawCentroids = (geoObject, destinations, show) => {
            if (show) {
                // createGlows(geoObject.element);
                const geoCentroids = geoObject.element
                    .selectAll("circle")
                    .data(geoObject.data.filter((d) => destinations.some((dd) => dd === d.properties.name)));

                geoCentroids
                    .join("circle")
                    .attr("fill", "#63b3d4")
                    .style("fill-opacity", 0.5)
                    .attr("stroke", "#63b3d4")
                    .attr("cx", (d) => d.properties.props.C[0])
                    .attr("cy", (d) => d.properties.props.C[1])
                    .transition()
                    .duration(ARCS_DURATION / 2)
                    .attr("r", 5)
                    .transition()
                    .duration(ARCS_DURATION / 2)
                    .attr("r", 2);

                // geoCentroids.style("filter", "url(#glow)");
            }
        };

        let removeCentroids = (geoObject) => {
            geoObject.element.selectAll("circle").remove();
        };

        let updateArcs = (map, arcElems, delayTrans = false) => {
            let destinations = [];
            arcElems.each((d) => {
                if (!destinations.includes(d.destinationName)) destinations.push(d.destinationName);
            });

            removeCentroids($scope.geoObject);
            drawCentroids($scope.geoObject, destinations, delayTrans);
            let arcElemsTrans = arcElems
                .transition()
                .ease(d3.easeLinear)
                .duration(ARCS_DURATION)
                .delay(!delayTrans ? 0 : 500)
                .attr("stroke", (d) => {
                    return getMigrationColor(d.weight);
                })
                .attr("stroke-dashoffset", function () {
                    return this.getTotalLength();
                })
                .attrTween("stroke-dasharray", function (d) {
                    return tweenDash(this, 0);
                })
                .on("interrupt", function (d) {
                    let source = countries.find((c) => c.properties.name === d.sourceName);
                    let destination = countries.find((c) => c.properties.name === d.destinationName);
                    localDashArray.set(this, d3.select(this).attr("stroke-dasharray"));

                    d3.select(this).on("mouseover", function () {
                        arcsMouseOver(this, d, source, destination, homeInfoBox);
                    });

                    d3.select(this).on("mouseout", function () {
                        arcsMouseOut(this, source, destination, homeInfoBox);
                    });
                });

            arcElemsTrans.end().then(
                () => {
                    _handleArcsRepetition(map, arcElems);
                },
                (e) => {}
            );

            // arcElems.style("filter", "url(#glow)");
        };

        const createGlows = (map) => {
            const defs = map.append("defs");
            const filter = defs.append("filter").attr("id", "glow");

            filter.append("feGaussianBlur").attr("class", "blur").attr("stdDeviation", "7").attr("result", "coloredBlur");

            const feMerge = filter.append("feMerge");

            feMerge.append("feMergeNode").attr("in", "coloredBlur");
            feMerge.append("feMergeNode").attr("in", "SourceGraphic");
        };

        let getMigrationColor = (weight) => {
            if (weight > 5000000) {
                return migrationMagnitudeColors[0];
            } else if (weight > 1000000) {
                return migrationMagnitudeColors[1];
            } else if (weight > 100000) {
                return migrationMagnitudeColors[2];
            } else if (weight > 1000) {
                return migrationMagnitudeColors[3];
            } else {
                return migrationMagnitudeColors[4];
            }
        };

        /**
         * Function that draws the migration on the map
         * @param {object} map
         */
        let initArcs = (map) => {
            dataService.getCountriesInwardOutwardMigrants($rootScope.genderFilterValue).then((data) => {
                console.log("data is: ", data);
                for (let c of data) {
                    let prev = c;
                    if (c.Year == 1995) break;
                    data.forEach((c1) => {
                        if (c.Destination == c1.Destination && c.Year != c1.Year) {
                            let keys = Object.keys(c1).slice(4);
                            keys.forEach((k) => {
                                let weight = 0;
                                if (k !== c.Destination) {
                                    weight = !(c in c) ? (weight = c1[k]) : c1[k] - c[k];
                                    let source = {
                                        sourceName: k,
                                        destinationName: c.Destination,
                                        radius: 2,
                                        fill: getMigrationColor(weight),
                                        year: prev.Year + "-" + c1.Year,
                                        sourceCentroid: data.find((e) => e.Destination === k).centroid,
                                        destinationCentroid: c.centroid,
                                    };

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

                // createGlows($scope.geoObject.element);
                drawArcs(map);
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
            zoomMap = d3
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
                .attr("fill", HOME_COUNTRY_COLOR)
                .attr("stroke", HOME_COUNTRY_MAP_STROKE)
                .on("mouseover", (e, d) => {
                    d3.select(e.target).transition().duration(100).attr("fill", HOVERED_COLOR).attr("stroke", "#63b3d4");
                    homeInfoBox.innerHTML = `
                    <div>
                        <div class="display-flex">
                            <img width="40" height="30" class="margin-left-20px" src="${d.properties.flagPath}">
                            <div class="margin-left-20px color-white font-size-x-large margin-top-bottom-auto">${d.properties.name}</div>
                        </div>
                    </div>
                    `;
                })
                .on("mouseout", (e, d) => {
                    d3.select(e.target).transition().duration(100).attr("fill", HOME_COUNTRY_COLOR).attr("stroke", HOME_COUNTRY_MAP_STROKE);
                    homeInfoBox.innerHTML = "Information on hover will be shown here";
                });
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

        // TODO: Remove dummy area chart data
        let dummyData = [
            { year: "1990", value: 5000 },
            { year: "1995", value: 15000 },
            { year: "2000", value: 2000 },
            { year: "2005", value: 8000 },
            { year: "2010", value: 10000 },
            { year: "2015", value: 20000 },
            { year: "2019", value: 15000 },
        ];

        let drawAreaChart = (data) => {
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

        let updateAreaChartTick = (_yearIdx) => {};

        drawAreaChart(dummyData);

        $rootScope.$watch('genderFilterValue', (newVal, oldVal) => {
            if (newVal !== oldVal) {
                pauseArcs();
                yearsData = [];
                // PROPOSAL: restart the number of repetitions from scratch if you filter by gender
                yearRep = 0;
                initArcs($scope.geoObject.element);
            }
        });
    }
})();
