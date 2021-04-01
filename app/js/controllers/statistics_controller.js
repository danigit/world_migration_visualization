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
        $scope.countriesData = null;
        
        $scope.$watch('countriesData', function(_new, _old) {
            if(_new !==_old) {
                let years = dataService.getActiveYears();

                dataService.loadWorldMap()
                    .then((data) => drawMap(data, _new, years));
            }
        });

        const BAD_COUNTRY_COLOR = '#ff5952';

        let mapProjection;
        
        const colorScheme = d3.schemeBlues[9];
        let colorScale;

        let isBadCountry = (props) => {
            return !props || !(props instanceof Country)
        };

        let drawMap = (data, statistics, years) => {
            // TODO: Enter - update - exit pattern
            let mapContainer = d3.select("#map-container");
            mapContainer.html('');

            let svgWidth = mapContainer.node().getBoundingClientRect().width;
            let svgHeight = mapContainer.node().getBoundingClientRect().height;

            let svgPaddings = { top: 128, right: 0,
                    bottom: 0, left: 0 };

            mapProjection = d3
                .geoMercator()
                .scale(170)
                .translate([svgWidth/2, svgHeight/2
                        + svgPaddings.top]);

            let geoPath = d3.geoPath().projection(mapProjection);

            let svgMap = mapContainer.append("svg").attr("width", svgWidth).attr("height", svgHeight);

            let svgMapGroup = svgMap.append("g").attr('id', 'map');
            // let svgGraticuleGroup = svgMap.append("g").attr('id', 'graticule');

            let zoomMap = d3.zoom()
                .scaleExtent([1, 10])
                .on("zoom", (e) =>
                    svgMapGroup.attr("transform", e.transform));

            let geoJson = data;

            geoJson.forEach(d => {
                if (isBadCountry(d.properties))
                    return;

                d.properties.props['C'] = mapProjection(d3.geoCentroid(d))
            });

            const statistics_groupByCountry = d3.group(statistics.filter(s =>
                years.includes(+s.Year)), r => r.Destination);

            const statistics_avgByCountry = map(statistics_groupByCountry,
                v => Math.round(v.reduce((sum, curr) => sum + +curr.Total, 0)/v.length));

            const statistics_avgValues = Object.values(statistics_avgByCountry);

            colorScale = d3_scaleLogMinMax(statistics_avgValues,
                    [colorScheme[0], colorScheme[8]]);
                
            svgMapGroup
                .selectAll("path")
                .data(geoJson)
                .enter()
                .append("path")
                .attr("d", geoPath)
                .attr("class", "countries")
                .attr("id", d => d.id)
                .attr("fill", d => {
                    if (isBadCountry(d.properties)) {
                        return BAD_COUNTRY_COLOR;
                    }

                    const v = statistics_avgByCountry[d.properties.name]

                    // TODO: Change the fill attribute following
                    // the color scale on the current metric
                    return colorScale(v);
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

                    console.log('Hovering over:', d.properties.visName,
                            '-', statistics_avgByCountry[d.properties.name]);

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
                    // a general template of insertion.

                    const v = statistics_avgByCountry[d.properties.name]

                    // TODO: Change the fill attribute following
                    // the color scale on the current metric

                    d3.select(this).transition()
                        .duration(1).style('fill',
                        colorScale(v));
                });

            // Centroids
            const geoCentroids = svgMapGroup.selectAll('circle')
                .data(geoJson.filter(d => !isBadCountry(d.properties)));

            geoCentroids.enter().append('circle')
                    .attr('cx', d => d.properties.props.C[0])
                    .attr('cy', d => d.properties.props.C[1])
                    .attr('r',  2)
                .on('mouseover', function(_, d) {
                    d3.select(this).transition()
                        .duration(1).attr('r', 4);
                    
                    console.log(d)})
                .on('mouseout',  function() {
                    d3.select(this).transition()
                        .duration(1).attr('r', 2)});

            // // TODO: Keep the graticule?
            // let geoGraticule = d3.geoGraticule();

            // // Display lat and lon grids on the map.
            // svgGraticuleGroup.append("path")
            //     .datum(geoGraticule)
            //     .classed("graticule", true)
            //     .attr("d", geoPath)

            svgMap.call(zoomMap);
            svgMap.call(zoomMap.transform,
                    () => d3.zoomIdentity.scale(1));
        };
        
        dataService.getWorldStatistics().then(data => {
            // drawBarChart(data, selectedMetric);
        });

        $scope.changeMetric = () => {
            dataService.getCountriesStatistics(
                    $scope.visualizationType)
                .then(a => $scope.countriesData = a);
        }

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
