/**
 * This file will contain all the configurations and the constants
 */

// this is the path for the components folder
const components_folder = "app/components/";
const controllers_folder = "app/controllers/";

// Path to data folders
const data_folder = 'app/data';

const data_csv_folder  = data_folder + '/csv/';
const data_json_folder = data_folder + '/json';

// Path to JSON tables
const world_countries_hierarchy = data_json_folder + '/world_countries_hierarchy.json';
const world_countries_vis_name  = data_json_folder + '/world_countries_vis_name.json';

// Path to image folders
const image_folder = "app/img/";

const image_countries_folder = image_folder + 'countries';

const IMAGE_COUNTRIES_OUTLINES_FOLDER = image_countries_folder + '/outlines';
const IMAGE_COUNTIRES_FLAGS_FOLDER    = image_countries_folder + '/flags';

// names of origin and destination tables
const total_migrants_by_origin_and_destination = 'app/data/csv/migrants_by_origin_and_destination_total.csv';
const male_migrants_by_origin_and_destination = 'app/data/csv/migrants_by_origin_and_destination_male.csv';
const female_migrants_by_origin_and_destination = 'app/data/csv/migrants_by_origin_and_destination_female.csv'; 

// paths for age and sex tables
const total_population_by_age_and_sex = 'app/data/csv/total_population_by_age_and_sex.csv';
const total_migrants_by_age_and_sex = 'app/data/csv/migrants_by_age_and_sex_total.csv';
const migrants_percentage_distribution_by_age_and_sex = 'app/data/csv/migrants_pct_distribution_by_age_and_sex.csv';
const migrants_as_percentage_of_total_population_by_age_and_sex = 'app/data/csv/migrants_pct_total_population_by_age_and_sex.csv'; 

// path for countries classes table
const countries_classes_by_region = 'app/data/csv/countries_class_by_region.csv';

// path for estimated refugee stock table
const estimated_refugees = 'app/data/csv/est_refugee_stock.csv';
