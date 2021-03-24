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

        let svgWidth;
        let svgHeight;
        let projection;

        let drawMap = (data) => {
            let mapContainer = d3.select("#map");
            svgWidth = mapContainer.node().getBoundingClientRect().width;
            svgHeight = mapContainer.node().getBoundingClientRect().height;
            projection = d3
                .geoConicConformal()
                .scale(175)
                .translate([svgWidth / 2 - 100, svgHeight / 2 + 100]);
            let path = d3.geoPath().projection(projection);

            let svgMap = mapContainer.append("svg").attr("width", svgWidth).attr("height", svgHeight);
            svgMap
                .selectAll("path")
                .data(topojson.feature(data, data.objects.countries).features)
                .enter()
                .append("path")
                .attr("d", path)
                .attr("class", "countries")
                .attr("id", (d) => d.id);
        };
    }
})();
