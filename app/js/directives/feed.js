angular.module("feed-chip", []).directive("feedChip", function () {
    return {
        require: "ngModel",
        replace: true,
        scope: {
            model: "=ngModel",
            feed: "=",
        },
        template:
            '<div layout="row">' +
            '<div class="feed-container">' +
            '<span class="margin-right-10-px">{{feed.title}}</span>' +
            '<img class="vertical-align-middle margin-right-10-px" src="{{feed.image}}">' +
            "<span>{{feed.value}}</span>" +
            "</div>" +
            "</div>",
    };
});
