(function () {
    "use strict";

    // reloading angula module
    let main = angular.module("main");

    // creating the service
    main.service("feedService", feedService);
    main.service("statisticsService", statisticsService);

    /** Function that handle the requests */
    function feedService() {
        // getting the service instance
        let feed_service = this;
        feed_service.feeds = [
            {
                title: "Burundi",
                image: "app/img/home/down.png",
                value: "4.232 M",
            },
            {
                title: "Italy",
                image: "app/img/home/up.png",
                value: "4.232 M",
            },
            {
                title: "Kenya",
                image: "app/img/home/down.png",
                value: "4.232 M",
            },
            {
                title: "France",
                image: "app/img/home/down.png",
                value: "4.232 M",
            },
            {
                title: "Germany",
                image: "app/img/home/up.png",
                value: "432 M",
            },
            {
                title: "Marocco",
                image: "app/img/home/up.png",
                value: "432 M",
            },
        ];
    }

    function statisticsService() {
        let statistics_service = this;

        statistics_service.statisticsButtons = [
            { value: "world", text: "World" },
            { value: "country", text: "Country" },
            { value: "compare", text: "Compare" },
        ];

        statistics_service.countryButtons = [
            { value: "global_rank", text: "Global rank" },
            { value: "value", text: "Value" },
        ];

        statistics_service.visualizationTypes = [
            { value: "total_immigrations", text: "Total immigrations" },
            { value: "total_population", text: "Total population" },
            {
                value: "immigration_vs_population",
                text: "Immigration vs. Population",
            },
            { value: "immigration_avg_age", text: "Immigration average age" },
            {
                value: "refugees_vs_immigration",
                text: "Refugees vs. Immigrates",
            },
        ];

        statistics_service.topFlags = [
            {
                name: "Italy",
                path: "../../../sketch/MicrosoftTeams-image_1.png",
            },
            {
                name: "France",
                path: "../../../sketch/MicrosoftTeams-image_2.png",
            },
            {
                name: "Greece",
                path: "../../../sketch/MicrosoftTeams-image_3.png",
            },
            {
                name: "Spain",
                path: "../../../sketch/MicrosoftTeams-image_4.png",
            },
            {
                name: "Germany",
                path: "../../../sketch/MicrosoftTeams-image_5.png",
            },
        ];
    }
})();
