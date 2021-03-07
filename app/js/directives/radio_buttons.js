angular.module("radio-button", []).directive("radioButtonGroup", function () {
    return {
        restrict: "E",
        require: "ngModel",
        scope: {
            model: "=ngModel",
            buttons: "=",
            radioButtonsClass: "=",
        },
        template:
            '<a class="radio-button-class {{radioButtonsClass}}" ' +
            '   ng-repeat="button in buttons" ' +
            "   ng-class=\"{'button-clicked': isActive(button.value), 'first-radius': $first, 'last-radius': $last }\" " +
            '   ng-click="handleButtonClicked(button.value)"> ' +
            "       {{button.text}} " +
            "</a>",
        controller: [
            "$scope",
            "$state",
            function ($scope, $state) {
                $scope.handleButtonClicked = function (value) {
                    console.log(value);
                    if (value === "compare") {
                        $state.go("compare");
                    } else if (value === "world") {
                        $state.go("statistics");
                    } else if (value === "country") {
                        $state.go("country");
                    }

                    $scope.value = value;
                };

                $scope.isActive = function (value) {
                    return $scope.value === value;
                };
            },
        ],
        link: function (scope, element, attributes, ngModel) {
            element.on("click", (e) => {
                scope.$apply(() => {
                    ngModel.$setViewValue(scope.value);
                });
            });

            scope.$watch("model", (newVal) => {
                element.removeClass("button-clicked");
                if (newVal === scope.value) {
                    element.addClass("button-clicked");
                }
            });
        },
    };
});
