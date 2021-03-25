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
