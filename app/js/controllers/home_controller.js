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

        let isBadCountry = (props) => {
            return !props || !(props instanceof Country);
        };

        
        dataService.loadWorldMap().then((data) => {
            $scope.geoObject = initMap(data);
            drawMap($scope.geoObject);
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

        const translateAlong = (path, direction) => {
            let l = path.getTotalLength();
            return function (d, i, a) {
                return function (t) {
                    let atLength = direction === 1 ? t * l : l - t * l,
                        p1 = path.getPointAtLength(atLength),
                        p2 = path.getPointAtLength(atLength + direction),
                        angle = 0,
                        rot_tran,
                        p;

                    // when it reached the end of the path, we need to get the point at the end of the path and a point before, else we would -90 degree since the point are the same
                    if (p2.y === p1.y && p2.x === p1.x) {
                        p1 = path.getPointAtLength(l - 1);
                        p2 = path.getPointAtLength(l);
                    }

                    angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI) - 90;

                    rot_tran = "rotate(" + angle + ")";
                    p = path.getPointAtLength(t * l);

                    return "translate(" + p.x + "," + p.y + ") " + rot_tran;
                };
            };
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

                if (!map.selectAll(".arch-container")._groups[0].length) {
                    map.append("g").attr("class", "arch-container");
                }

                let arcList = [];

                for (let yearObj of yearIntervalData) {
                    yearObj.yearData = yearObj.yearData.filter(destData => destData.origins.length!=0);
                    for (let i of yearObj.yearData) {
                        for (let src of i.origins) {
                            let temp = {};
                            Object.assign(temp,src);
                            temp.destination = i.destination.name;
                            temp.destinationCentroid = i.destination.centroid;
                            temp.sourceCentroid = temp.centroid;
                            delete temp.centroid;
                            arcList.push(temp);
                        }
                    }
                }


                // console.log("arcList ", arcList);
                //let yearData = yearIntervalData[0].yearData;

                let yearData = arcList.filter(arc => arc.year=="1990-1995");
                console.log(yearData.length);

                // console.log("one year data ", yearData.length);
                /* var width = 500,
                height = 500;
                var svg = d3.select("svg");

                var projection = d3.geoMercator()
                    .scale(2800)
                    .rotate([86, 0])
                    .center([0, 43.2])
                    .translate([width / 2, height / 2]);
                var path = d3.geoPath().projection(projection);

                var clipPath = svg.append("defs")
                    .append("clipPath").attr("id", "circle-clip")
                    .append("circle")
                    .attr("cy", "50%")
                    .attr("cx", "50%")
                    .attr("r", "50%")
                    .attr("fill", "transparent");

                var g = svg.append("g")
                    .attr("clip-path", "url(#circle-clip)");

                var aa = [-83.7377, 42.2733];
                var chi = [-87.732, 41.8338]; */


                /* function link(p1, p2) {
                    var start = projection(p1);
                    var end = projection(p2);
                    return "M" + start[0] + "," + start[1]
                        + "C" + (start[0] + end[0]) / 2 + "," + start[1]
                        + " " + (start[0] + end[0]) / 2 + "," + start[1]
                        + " " + end[0] + "," + end[1];
                } */

                function tweenDash() {
                    var l = this.getTotalLength();
                    var i = d3.interpolateString("0," + l, l + "," + l);
                    return function (t) { 
                        return i(t); 
                    };
                }

                // From https://bl.ocks.org/mbostock/5649592
                /* function transition(path, i) {
                    console.log("transition");
                    path.transition()
                        .delay(i*1000)
                        .duration(3000)
                        .on('start',function() {
                            console.log("sono qui");
                            path.style("opacity", 1);
                        })
                        .attrTween("stroke-dasharray", tweenDash);
                } */
            

                // console.log("tweenDash ", tweenDash());

                // https://bl.ocks.org/mbostock/1705868
                function translateAlong(path, attr) {
                    var l = path.getTotalLength();
                    return function (d, i, a) {
                        return function (t) {
                            var p = path.getPointAtLength(t * l);
                            return p[attr];
                        };
                    };
                }

                // ann arbor 42.2733, -83.7377
                // chicago 41.8338, -87.7320
                /* d3.json("us-states.json", function (error, us) {
                    if (error) throw error;

                    g.selectAll("path")
                        .data(us.features)
                        .enter().append("path")
                            .attr("class", "states")
                            .attr("d", path);

                    g.append("path")
                        .attr("class", "arc")
                        .attr("d", link(aa, chi))
                        .call(transition);

                    var pAA = projection(aa);
                    var circle = g.append("circle")
                        .attr("width", 0)
                        .attr("height", 0)
                        .attr("fill", "blue")
                        .attr("cx", pAA[0])
                        .attr("cy", pAA[1])
                        .attr("r", 15);

                    circle.transition()
                        .duration(1000)
                        .attrTween("cx", translateAlong(d3.select("path.arc").node(), "x"))
                        .attrTween("cy", translateAlong(d3.select("path.arc").node(), "y"));

                }); */

                // .on("end", myCallback);
                let arcContainers = map.selectAll(".arch-container");
                
                setInterval(function() {
                    arcContainers
                        .data(yearData)
                        .enter()
                        .append("path")
                        //.style("opacity", 0)
                        .attr("class", "path-arc")
                        .attr("stroke", "red")
                        .attr("fill", "none")
                        .attr("d", (d) => defineArc(d.sourceCentroid, d.destinationCentroid))
                        .transition()
                        //.delay((d, i)=>i*200)
                        .duration(3000)
                        /* .on('start',function() {
                            console.log("sono qui");
                            d3.select(this).style("opacity", 1);
                        })*/
                        .on('end', function() {
                            d3.select(this).remove();
                        }) 
                        .attrTween("stroke-dasharray", tweenDash);
                }, 3500);
                /* arcContainers
                        .data(yearData.slice(length-2))
                        .enter()
                        .append("path")
                        .style("opacity", 0)
                        .attr("class", "path-arc")
                        .attr("stroke", "red")
                        .attr("fill", "none")
                        .attr("d", (d) => defineArc(d.sourceCentroid, d.destinationCentroid))
                        .transition()
                        .delay((d, i)=>i*200)
                        .duration(3000)
                        .on('start',function() {
                            console.log("sono qui");
                            d3.select(this).style("opacity", 1);
                        })
                        .on('end', function() {
                            d3.select(this).remove();
                        })
                        .attrTween("stroke-dasharray", tweenDash) */;

               /*  let totalArcs = 0;
                for (let i = 0; i < yearData.length; i++) {
                    totalArcs += yearData[i].origins.length;
                    arcContainers
                        .data(yearData[i].origins)
                        .enter()
                        .append("path")
                        .attr("class", "path-arc")
                        .attr("stroke", "red")
                        .attr("fill", "none")
                        .attr("d", (d) => defineArc(d.centroid, yearData[i].destination.centroid))
                        .call(transition); */
                        // .on("end", myCallback)




                        /* map.selectAll(".arch-container").remove();
                        map.selectAll(".arch-container")
                            .data(yearData[i].origins)
                            .enter()
                            .append("svg:path")
                            .attr("class", "arc-path")
                            .style("stroke-linecap", "round")
                            .attr("stroke", "red")
                            .attr("stroke-width", 0.6)
                            .attr("fill", "none")
                            .attr("d", (d) => defineArc(d.centroid, yearData[i].destination.centroid))
                            .transition()
                            .ease(d3.easeLinear)
                            .attrTween("transform", (d)=>translateAlong(d, 1)); */
                            /* .style("fill", function () {
                                var length = this.getTotalLength();
                                this.style.transition = this.style.WebkitTransition = "none";
                                this.style.strokeDasharray = length / 4 + " " + (length + 10);
                                this.style.strokeDashoffset = length;
                                this.style.wetransition = this.style.WebkitTransition = "stroke-dashoffset 2000ms ease-out";
                                this.style.strokeDashoffset = -length;

                                    map.selectAll(".arch-container")
                                    .append("svg:path")
                                    .attr("class", "arch-arrow")
                                    .transition()
                                    .ease(d3.easeLinear)
                                    .attrTween("transform", translateAlong(this, 1)); 
                                return "none";
                            }); */
                /* } */

                // console.log("Total arcs", totalArcs);
            });
        };

        let svgGroup;
        let svgMapWidth;
        let svgMapHeight;

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

            let svgMap = svgMapContainer.append("g").attr("id", "map");
            svgGroup = svgMap.append("g");
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

        let _handleMapEnter = (_enter, _path) => {
            _enter
                .append("path")
                .attr("d", _path)
                .attr("class", "countries")
                .attr("id", (d) => d.id)
                .attr("fill", "gray")
                .attr("stroke", "black");
        };

        let drawMap = (geoObject) => {
            /* let mapContainer = d3.select("#map");
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
            svgMap.call(zoom.transform, () => d3.zoomIdentity.scale(1)); */

            geoObject.element
                .selectAll("path")
                .data(geoObject.data)
                .join(
                    (enter) => _handleMapEnter(enter, geoObject.path),
                    (exit) => exit.remove()
                );
            
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
