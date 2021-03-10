# Evolution of International Migrant Stock

`Authors`: _Daniel Surpanu_, _Federico Minutoli_, and _Matteo Ghirardelli_

1. `Dataset`

We chose the dataset #12, entitled International Migrant Stock. We chose it because it is the most suitable proposal out of the available datasets for the type of visualization that we have in mind, that is, a sequence of geo-referenced time series in motion from a source to a destination.
In particular, we decided to focus on the following Excel files:
• UN_MigrantStock_2017 – the set of tables used for time series visualization;
• UN_MigrantStockByOrigiAndDestination_2017 – the set of tables used for geo-referenced visualization.
The dataset also contains the UN_MigrantStockByAge, which we will further evaluate to see if and how it can be incorporated in our visualization.

2. `Project type`

Despite the dataset being listed within the medium category on AulaWeb, this project falls under the challenging category. Indeed, as specified in the corpus of its description on AulaWeb, it should be intended as challenging if implying graph-based visualizations. In our case, we do.

3. `Project description`

We propose an interactive visualization (see Figure 1 for reference), with the aim of tracking the evolution over time of international migrant stocks. The visualization is intended to support both data analysts, and regular users, in identifying patterns in the aforementioned migrant stock flux.
The visualization will also contain idioms that allow the user to focus on specific aspects of the data, be them a set of filters on the map or separate views.

4. `Tools and technologies`

The project will be developed using D3.js as core library, as requested by the specifics. We’re also going to use Bootstrap to provide some degree of responsiveness and improve the UX. We reserve the possibility of using other libraries to future stages of development.
The implementation will make use of D3 connection maps as a base line for further development. In particular, we will start from the example provided at https://www.d3-graph-gallery.com/connectionmap.html, and then we will animate path drawings by taking http://bl.ocks.org/dem42/e10e933990ee662c9cbd as a source of inspiration.

In order to do that, we will have to consider different parts of said paths in a different manner by means of interpolation as exemplified in the following resources:

1. https://www.tnoda.com/blog/2014-04-02/,
2. https://stackoverflow.com/questions/36927343/hide-some-parts-of-a-path-generated-with-a-curve-interpolation
3. https://stackoverflow.com/questions/56822311/is-there-a-way-to-get-a-subset-section-of-a-path-in-d3-js.

## TO DO

#### 1. First week

-   data preprocessing -> result two tables one for the dynamic part and one for the static part
-   GUI refinement
-   develop the country module

#### 2. Second week

-   develop compare module
-   develop world statistics module

#### 3. Third week

-   develop home module with the filters and the footer
