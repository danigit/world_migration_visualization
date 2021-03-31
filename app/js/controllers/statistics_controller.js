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
        console.log("|" + dataService.secondaryMenuSelectedValue + "|");
        $scope.secondaryMenuSelectedValue = dataService.secondaryMenuSelectedValue != "" ? dataService.secondaryMenuSelectedValue : "world";
        $scope.statisticsButtons = dataService.menuButtons;
        $scope.visualizationTypes = dataService.visualizationTypes;
        $scope.topFlags = dataService.topFlags;
        $scope.selectedTopFlag = "";

        let svgGroup;
        let colors = d3.scaleOrdinal(d3.schemeBlues[7]);

        let drawMap = (data) => {
            let mapContainer = d3.select("#map");
            let svgWidth = mapContainer.node().getBoundingClientRect().width;
            let svgHeight = mapContainer.node().getBoundingClientRect().height;
            let projection = d3
                .geoMercator()
                .scale(170)
                .translate([svgWidth / 2, svgHeight / 2]);
            let path = d3.geoPath().projection(projection);

            let zoom = d3
                .zoom()
                .scaleExtent([1, 10])
                .on("zoom", (event) => {
                    svgGroup.attr("transform", event.transform);
                });

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
                .attr("fill", (d) => {
                    let chars = d.id.split("");
                    return colors(d3.sum(chars, (c) => c.charCodeAt(c)));
                })
                .on("click", (e, d) => {
                    console.log(e);
                    console.log(d);
                })
                .on("mouseover", (e, d) => {
                    console.log(d);
                });

            svgMap.call(zoom);
            svgMap.call(zoom.transform, () => d3.zoomIdentity.scale(1));
        };

        dataService.loadWorldMap().then((data) => {
            drawMap(data);
        });

        
        dataService.getWorldStatistics().then(data => {
            // drawBarChart(data, selectedMetric);
        });

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
