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

        dataService.loadWorldMap().then((data) => {
            drawMap(data);
        });

        let svgGroup;

        let drawMap = (data) => {
            let mapContainer = d3.select("#map");
            let svgWidth = mapContainer.node().getBoundingClientRect().width;
            let svgHeight = mapContainer.node().getBoundingClientRect().height;
            let projection = d3
                .geoMercator()
                .scale(170)
                .translate([svgWidth / 2, svgHeight / 2]);
            let path = d3.geoPath().projection(projection);

            let svgMap = mapContainer.append("svg").attr("width", svgWidth).attr("height", svgHeight);
            svgGroup = svgMap.append("g");
            svgGroup
                .selectAll("path")
                .data(topojson.feature(data, data.objects.countries).features)
                .enter()
                .append("path")
                .attr("d", path)
                .attr("class", "countries-home")
                .attr("id", (d) => d.id)
                .on("click", (e, d) => {
                    console.log(e);
                    console.log(d);
                });

            svgMap.call(zoom);
            svgMap.call(zoom.transform, () => d3.zoomIdentity.scale(1));
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
