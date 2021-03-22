(function () {
    "use strict";

    // reloading angula module
    let main = angular.module("main");

    // creating the service
    main.service("dataService", dataService);

    /** Function that handle the requests */

    dataService.$inject = ["$state"];
    function dataService($state) {
        // getting the service instance
        let data_service = this;
        data_service.secondaryMenuSelectedValue = "";
        data_service.selectedCountryController = "";

        data_service.loadCsv = (filePath) => {
            return d3
                .csv(filePath, (data) => {
                    return data;
                })
                .catch((error) => {
                    alert("Could not load dataset..." + "\nCheck the console for more details!");

                    console.log(error);
                });
        };

        data_service.loadJson = (filePath) => {
            return d3
                .json(filePath, (data) => {
                    return data;
                })
                .catch((error) => {
                    alert("Could not load file..." + "\nCheck the console for more details!");

                    console.log(error);
                });
        };

        // load data from all csv files
        data_service.countriesClassByRegion = data_service.loadCsv(countries_classes_by_region);
        data_service.totMigrByOriginDest = data_service.loadCsv(total_migrants_by_origin_and_destination);
        data_service.maleMigrByOriginDest = data_service.loadCsv(male_migrants_by_origin_and_destination);
        data_service.femaleMigrByOriginDest = data_service.loadCsv(female_migrants_by_origin_and_destination);
        data_service.estimatedRefugees = data_service.loadCsv(estimated_refugees);
        data_service.totMigrByAgeSex = data_service.loadCsv(total_migrants_by_age_and_sex);
        data_service.totPopulationByAgeSex = data_service.loadCsv(total_population_by_age_and_sex);
        data_service.migrAsPercOfPopulationAgeSex = data_service.loadCsv(migrants_as_percentage_of_total_population_by_age_and_sex);
        data_service.migrPercDistributionAgeSex = data_service.loadCsv(migrants_percentage_distribution_by_age_and_sex);

        // variable that defines the ticks of the slider
        data_service.sliderYears = [
            { value: 1990, legend: "1990" },
            { value: 1995, legend: "1995" },
            { value: 2000, legend: "2000" },
            { value: 2005, legend: "2005" },
            { value: 2010, legend: "2010" },
            { value: 2015, legend: "2015" },
            { value: 2019, legend: "2019" },
        ];

        // Variable that defines the genre buttons in the filter menu
        data_service.genreButtons = [
            { value: "menu-male", text: "Male" },
            { value: "menu-female", text: "Female" },
            { value: "menu-all", text: "All" },
        ];

        // Variable that defines the region buttons in the filter menu
        data_service.regionButtons = [
            { value: "menu-continent", text: "Continent" },
            { value: "menu-region", text: "Region" },
            { value: "menu-country", text: "Country" },
        ];

        // variable that defines the menu buttons
        data_service.menuButtons = [
            { value: "world", text: "World" },
            { value: "country", text: "Country" },
            { value: "compare", text: "Compare" },
        ];

        data_service.getTopCountries = () => {
            return [];
        };

        // variable that holds the top five countries with income and outcome migrants
        data_service.topFlags = [
            //data_service.getTopCountries()
            {
                name: "Italy",
                value: "italy",
                path: "../../../sketch/MicrosoftTeams-image_1.png",
            },
            {
                name: "France",
                value: "france",
                path: "../../../sketch/MicrosoftTeams-image_2.png",
            },
            {
                name: "Greece",
                value: "greece",
                path: "../../../sketch/MicrosoftTeams-image_3.png",
            },
            {
                name: "Spain",
                value: "spain",
                path: "../../../sketch/MicrosoftTeams-image_4.png",
            },
            {
                name: "Germany",
                value: "germany",
                path: "../../../sketch/MicrosoftTeams-image_5.png",
            },
        ];

        // variable that holds the types of visualization in the statistics page
        data_service.visualizationTypes = [
            { value: "total_immigration", text: "Total immigration" },
            { value: "total_population", text: "Total population" },
            {
                value: "immigration_vs_population",
                text: "Immigration vs. Population",
            },
            { value: "immigrants_avg_age", text: "Immigrants average age" },
            {
                value: "refugees_vs_immigrants",
                text: "Refugees vs. Immigrants",
            },
        ];

        /**
         * Function that returns the column postfix given the gender
         * @param {string} selectedGender
         * @param {string} columnPrefix
         * @returns {string}
         */
        data_service.getSelectedGenderColumn = (selectedGender, columnPrefix) => {
            let selectedGenderColumn = "";
            switch (selectedGender) {
                case "menu-all":
                    selectedGenderColumn = columnPrefix + "_(mf)";
                    break;
                case "menu-male":
                    selectedGenderColumn = columnPrefix + "_(m)";
                    break;
                case "menu-female":
                    selectedGenderColumn = columnPrefix + "_(f)";
                    break;
            }
            return selectedGenderColumn;
        };

        let getCountries = (visNames) => {
            let getVisName = (country) => {
                if (country in visNames) return visNames[country];
                else return country;
            };

            return data_service.loadJson(world_countries_hierarchy).then((data) => {
                let countries = [];

                const geoRegions = data["WORLD"]["Geographic regions"];
                const geoRegions_lc = geoRegions.map((region) => region.toLowerCase());

                for (const key in data) {
                    if (key === "WORLD") continue;

                    let regionId = geoRegions_lc.indexOf(key.toLowerCase());

                    if (regionId !== -1) {
                        const continent = geoRegions[regionId];

                        for (const region in data[key]) {
                            data[key][region].forEach((country) => {
                                countries.push(new Country(country, continent, region, getVisName(country)));
                            });
                        }
                    } else {
                        if (key.startsWith("EUROPE")) {
                            for (const i in data[key]) {
                                if (i === "EUROPE") {
                                    const continent = "Europe";

                                    for (const region in data[key][i]) {
                                        data[key][i][region].forEach((country) =>
                                            countries.push(new Country(country, continent, continent, getVisName(country)))
                                        );
                                    }
                                } else {
                                    const continent = "Northern America";

                                    data[key][i].forEach((country) =>
                                        countries.push(new Country(country, continent, continent, getVisName(country)))
                                    );
                                }
                            }
                        } else {
                            for (const region in data[key]) {
                                const continent = geoRegions.find((v) => region.includes(v));

                                data[key][region].forEach((country) => {
                                    countries.push(new Country(country, continent, region, getVisName(country)));
                                });
                            }
                        }
                    }
                }

                return countries.sort((a, b) => (a.visName > b.visName ? 1 : -1));
            });
        };

        data_service.countries = data_service.loadJson(world_countries_vis_name).then((data) => {
            return getCountries(data);
        });

        data_service.continents = ["Africa", "Asia", "Europe", "Latin America and the Caribbean", "Northern America", "Oceania"];

        // variable that defines the country info types buttons
        data_service.countryInfoTypeButtons = [
            { value: "global_rank", text: "Global rank" },
            { value: "value", text: "Value" },
        ];

        data_service.computePercentage = (values) => {
            let total = d3.sum(values);
            let percentages = [];
            values.forEach((val) => {
                percentages.push((val / total) * 100);
            });
            return percentages;
        };

        /**
         * Function that handles the routing for the secondary menu
         */
        data_service.changePage = () => {
            switch (data_service.secondaryMenuSelectedValue) {
                case "world":
                    $state.go("statistics");
                    break;
                case "country":
                    $state.go("country");
                    break;
                case "compare":
                    $state.go("compare");
                    break;
                default:
                    $state.go("home");
            }
        };

        /**
         * Function that filter the row of the country passed as parameter
         * @param {array} data
         * @param {string} selectedCountry
         * @returns {promise} - the row of the selectedCountry
         */
        let getSelectedCountryData = (data, selectedCountry) => {
            return data.filter((countryData) => countryData["Destination"] == selectedCountry);
        };

        /**
         * Function that returns the total migrants by origin and destination data
         * @param {string} selectedCountry
         * @returns {promise}
         */
        data_service.getTotalMigrantsByOriginAndDestination = (selectedCountry) => {
            return data_service.totMigrByOriginDest.then((data) => {
                return getSelectedCountryData(data, selectedCountry);
            });
        };

        /**
         * Function that filter the data passed as parameter using the elements passed as parameter also
         * @param {array} data
         * @param {string} selectedCountry
         * @param {number} yearMin
         * @param {number} yearMax
         * @returns {promise}
         */
        let filterData = (data, selectedCountry, yearMin, yearMax) => {
            return data.filter(
                (countryData) =>
                    countryData["Destination"] == selectedCountry && countryData["Year"] >= yearMin && countryData["Year"] <= yearMax
            );
        };

        /**
         * Function that filter the data passed as parameter using the elements passed as parameter also
         * @param {array} data
         * @param {string} selectedCountry
         * @param {number} yearMin
         * @param {number} yearMax
         * @returns {promise}
         */
        let filterColumn = (data, selectedCountry, yearMin, yearMax) => {
            console.log(data);
            return data[selectedCountry];
        };

        let getOriginAndDestinationByGender = (selectedGender) => {
            switch (selectedGender) {
                case "menu-all":
                    return data_service.totMigrByOriginDest;
                case "menu-male":
                    return data_service.maleMigrByOriginDest;
                case "menu-female":
                    return data_service.femaleMigrByOriginDest;
            }
        };
        /**
         * Function that returns the total number of migrants by origin and destination
         * @param {string} selectedCountry
         * @param {number} yearMin
         * @param {number} yearMax
         * @returns {promise}
         */
        data_service.getTotMigrantsByOriginAndDestination = (selectedCountry, yearMin, yearMax, selectedGender) => {
            return getOriginAndDestinationByGender(selectedGender).then((data) => {
                let filteredData = filterData(data, selectedCountry, yearMin, yearMax);
                return filteredData.reduce((sum, curr) => sum + +curr.Total, 0) / filteredData.length;
            });
        };

        /**
         * Function that returns the total population by age and sex
         * @param {string} selectedCountry
         * @param {number} yearMin
         * @param {number} yearMax
         * @param {string} selectedGender
         * @returns {promise}
         */
        data_service.getTotPopulationByAgeAndSex = (selectedCountry, yearMin, yearMax, selectedGender) => {
            return data_service.totPopulationByAgeSex.then((data) => {
                let filteredData = filterData(data, selectedCountry, yearMin, yearMax);
                return (filteredData.reduce((sum, curr) => sum + +curr[selectedGender], 0) / filteredData.length) * 1000;
            });
        };

        /**
         * Function that return the migrants by age and sex, as a percentage of the total population
         * @param {string} selectedCountry
         * @param {number} yearMin
         * @param {number} yearMax
         * @param {string} selectedGender
         * @returns {promise}
         */
        data_service.getMigrantsAsPercentageOfPopulationByAgeAndSex = (selectedCountry, yearMin, yearMax, selectedGender) => {
            return data_service.migrAsPercOfPopulationAgeSex.then((data) => {
                let filteredData = filterData(data, selectedCountry, yearMin, yearMax);
                return filteredData.reduce((sum, curr) => sum + +curr[selectedGender], 0) / filteredData.length;
            });
        };

        /**
         * Function that return the average age of the migrants
         * @param {string} selectedCountry
         * @param {number} yearMin
         * @param {number} yearMax
         * @param {string} selectedGender
         * @return {promise}
         */
        data_service.getImmigrationAverageAge = (selectedCountry, yearMin, yearMax, selectedGender) => {
            return data_service.totMigrByAgeSex.then((data) => {
                let filteredData = filterData(data, selectedCountry, yearMin, yearMax);
                let columns = Object.keys(filteredData[0]).filter((key) => {
                    if (typeof key === "string" && key !== "Total" + selectedGender) {
                        return key.includes(selectedGender);
                    }
                });

                columns = columns.map((col) => {
                    let colElem = col.split("_")[0];
                    let ages = colElem.split("-");
                    if (col == "75+" + selectedGender) return { key: col, value: 77 };
                    return { key: col, value: (+ages[0] + +ages[1]) / 2 };
                });

                let yearsSum = 0;
                Object.values(filteredData).forEach((row) => {
                    let yearAverage = 0;
                    columns.forEach((col) => {
                        yearAverage += col.value * row[col.key];
                    });
                    yearsSum += yearAverage / row["Total" + selectedGender];
                });

                return yearsSum / filteredData.length;
            });
        };

        /**
         * Function that returns the estimate refugees
         * @param {string} selectedCountry
         * @param {number} yearsColumns
         * @param {number} selectedGender
         * @returns {promise}
         */
        data_service.getEstimatedRefugees = (selectedCountry, yearsColumns, selectedGender) => {
            return data_service.estimatedRefugees.then((data) => {
                let selectedCountryData = getSelectedCountryData(data, selectedCountry);
                return yearsColumns.reduce((sum, elem) => sum + +selectedCountryData[0]["" + elem + selectedGender]) / yearsColumns.length;
            });
        };

    
        /**
         * Function that returns the global rank statistics for each country
         * @param {number} yearMin
         * @param {number} yearMax
         * @param {string} selectedGender
         * @returns {promise}
         */
         data_service.getGlobalRankStatistics = (yearMin, yearMax, selectedGender) => {
            return data_service.countries.then((data) => {
                let consideredYears = [1990, 1995, 2000, 2005, 2010, 2015, 2019].filter((year) => year >= +yearMin && year <= +yearMax);
                let globalRankStatisticsArray = [];
                for (let country_idx in data) {
                    let avgTotalMigrantsCountry = data_service.getTotMigrantsByOriginAndDestination(
                        data[country_idx].name, yearMin, 
                        yearMax, selectedGender)
                        .then(avgTotalMigrantsCountry => {
                            return avgTotalMigrantsCountry;
                            })
                    let avgTotPopulationCountry = data_service.getTotPopulationByAgeAndSex(
                        data[country_idx].name, yearMin, 
                        yearMax, data_service.getSelectedGenderColumn(selectedGender, "Total"))
                        .then(avgTotPopulationCountry => {
                            return avgTotPopulationCountry;
                        })
                    let avgMigrPercCountry = data_service.getMigrantsAsPercentageOfPopulationByAgeAndSex(
                        data[country_idx].name, yearMin, 
                        yearMax, data_service.getSelectedGenderColumn(selectedGender, "Total"))
                        .then(avgMigrPercCountry => { 
                            return avgMigrPercCountry;
                        })
                    let avgAgeCountry = data_service.getImmigrationAverageAge(
                        data[country_idx].name, yearMin, 
                        yearMax, data_service.getSelectedGenderColumn(selectedGender, ""))
                        .then(avgAgeCountry => {
                            return avgAgeCountry;
                        })
                    let averageEstRefugees = data_service.getEstimatedRefugees(
                        data[country_idx].name,
                        consideredYears,
                        data_service.getSelectedGenderColumn(selectedGender, "_est"))
                        .then(averageEstRefugees => {
                            /* if (isNaN(averageEstRefugees)) {
                                averageEstRefugees = "Not available";
                            } else {
                                averageEstRefugees = "" + transformNumberFormat(averageEstRefugees);
                            }  */
                            return averageEstRefugees;
                        })

                    let promisedResultsList = [avgTotalMigrantsCountry, avgTotPopulationCountry, avgMigrPercCountry,
                        avgAgeCountry, averageEstRefugees];

                    let computedStatistics = Promise.all(promisedResultsList).then(values => {
                        return {
                            "name":data[country_idx].name,
                            "average_tot_migrants": values[0],
                            "average_tot_population": values[1],
                            "average_perc_immigration": values[2],
                            "average_age_migrants": values[3],
                            "average_est_refugees": values[4]
                        };
                    });
                    globalRankStatisticsArray.push(computedStatistics);
                }
                return Promise.all(globalRankStatisticsArray).then(globalRanks => {

                    globalRanks.sort((a, b) => 
                        b.average_tot_migrants - a.average_tot_migrants);

                    globalRanks.forEach((destObj, destIdx) => {
                        destObj["average_tot_migrants_global_rank"] = destIdx + 1;
                    });

                    globalRanks.sort((a, b) => 
                        b.average_tot_population - a.average_tot_population);

                    globalRanks.forEach((destObj, destIdx) => {
                        destObj["average_tot_population_global_rank"] = destIdx + 1;
                    });

                    globalRanks.sort((a, b) => 
                        b.average_perc_immigration - a.average_perc_immigration);

                    globalRanks.forEach((destObj, destIdx) => {
                        destObj["average_perc_immigration_global_rank"] = destIdx + 1;
                    });

                    globalRanks.sort((a, b) => 
                        b.average_age_migrants - a.average_age_migrants);

                    globalRanks.forEach((destObj, destIdx) => {
                        destObj["average_age_migrants_global_rank"] = destIdx + 1;
                    });

                    if (selectedGender=='menu-all') {
                        globalRanks.sort((a, b) => 
                            b.average_est_refugees - a.average_est_refugees);
                            
                        globalRanks.forEach((destObj, destIdx) => {
                            destObj["average_est_refugees_global_rank"] = destIdx + 1;
                        });
                    }

                    return globalRanks;
                });

                });
        };
        data_service.getCountryDevelopmentStatistic = (selectedCountry, yearsColumns, selectedGender) => {
            return getOriginAndDestinationByGender(selectedGender).then((data) => {
                let development = [
                    { type: "Less Developed", value: [] },
                    { type: "More Developed", value: [] },
                ];
                console.log(yearsColumns);
                Object.values(data).forEach((elem) => {
                    if (elem["Destination"] === "More developed regions" && yearsColumns.indexOf(+elem["Year"]) > -1) {
                        console.log(elem["Year"]);
                        development[0].value.push(elem[selectedCountry]);
                    } else if (elem["Destination"] === "Less developed regions" && yearsColumns.indexOf(+elem["Year"]) > -1)
                        development[1].value.push(elem[selectedCountry]);
                });

                development[0].value = d3.mean(development[0].value).toFixed(2);
                development[1].value = d3.mean(development[1].value).toFixed(2);
                let percentages = data_service.computePercentage([development[0].value, development[1].value]);
                development[0].percentage = percentages[0].toFixed(1);
                development[1].percentage = percentages[1].toFixed(1);
                return development;
            });
        };

        data_service.getCountryIncomeStatistic = (selectedCountry, yearsColumns, selectedGender) => {
            return getOriginAndDestinationByGender(selectedGender).then((data) => {
                let income = [
                    { type: "High Income", value: [] },
                    { type: "Upper Middle Income", value: [] },
                    { type: "Lower Middle Income", value: [] },
                    { type: "Low Income", value: [] },
                    { type: "Other Income", value: [] },
                ];
                Object.values(data).forEach((elem) => {
                    if (elem["Destination"] === "High-income countries" && yearsColumns.indexOf(+elem["Year"]) > -1)
                        income[0].value.push(elem[selectedCountry]);
                    else if (elem["Destination"] === "Upper-middle-income countries" && yearsColumns.indexOf(+elem["Year"]) > -1)
                        income[1].value.push(elem[selectedCountry]);
                    else if (elem["Destination"] === "Lower-middle-income countries" && yearsColumns.indexOf(+elem["Year"]) > -1)
                        income[2].value.push(elem[selectedCountry]);
                    else if (elem["Destination"] === "Low-income countries" && yearsColumns.indexOf(+elem["Year"]) > -1)
                        income[3].value.push(elem[selectedCountry]);
                    else if (elem["Destination"] === "No income group available" && yearsColumns.indexOf(+elem["Year"]) > -1)
                        income[4].value.push(elem[selectedCountry]);
                });

                Object.values(income).forEach((elem, index) => {
                    income[index].value = d3.mean(income[index].value).toFixed(2);
                });

                let incomeValues = [];
                income.forEach((elem) => {
                    incomeValues.push(elem.value);
                });

                let percentages = data_service.computePercentage(incomeValues);
                income.forEach((elem, index) => {
                    income[index].percentage = percentages[index].toFixed(1);
                });

                return income;
            });
        };

        data_service.getRateOfChange = (selectedCountry, yearMin, yearMax, selectedGender) => {
            data_service.totMigrByOriginDest.then((data) => {
                let filteredData = filterData(data, selectedCountry, yearMin, yearMax);
                //Missing table
            });
        };
    }
})();
