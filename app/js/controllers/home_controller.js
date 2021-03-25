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
                .attr("class", "countries")
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
    }
})();
