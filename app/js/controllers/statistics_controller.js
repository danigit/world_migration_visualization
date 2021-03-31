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

        dataService.loadWorldMap()
            .then((data) => drawMap(data));

        let svgGroup;
        let colors = d3.scaleOrdinal(d3.schemeBlues[7]);

        let isBadCountry = (props) => {
            return !props || !(props instanceof Country)
        };

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

            let geoJson = topojson.feature(data, data.objects.countries).features;

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
                    // TODO: Change the fill attribute following
                    // the color scale on the current metric
                    return colors(d3.sum(d.id.split(""),
                            (c) => c.charCodeAt(c)));
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
                    // relevant info on the hovered country.

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
                    .attr('r',  4)
                .on('mouseover', function() {
                    d3.select(this).transition()
                        .duration(1).attr('r', 6)})
                .on('mouseout',  function() {
                    d3.select(this).transition()
                        .duration(1).attr('r', 4)});

            svgMap.call(zoomMap);
            svgMap.call(zoomMap.transform,
                    () => d3.zoomIdentity.scale(1));
        };

        let zoomMap = d3.zoom()
            .scaleExtent([1, 10])
            .on("zoom", (e) =>
                svgGroup.attr("transform", e.transform));

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
