/**
 * Functions that handle the resizing of the lateral menu on different screens
 * @param {boolean} isMenuOpened
 */
function resizeMenuPanel(isMenuOpened) {
    if (!isMenuOpened) {
        document.getElementById("menu-container").classList.remove("width-25");
        document.getElementById("menu-container").classList.add("width-0");
    } else {
        document.getElementById("menu-container").classList.remove("width-0");
        document.getElementById("menu-container").classList.add("width-25");
    }
}

/**
 * Functions that changes the number format in "k", "M" notation
 * example 1000 -> 1k
 * @param {number} number
 * @returns
 */
function transformNumberFormat(number, order = false, decimals = 2) {
    if (!order) {
        let steps = [
            { value: 1, symbol: "" },
            { value: 1e3, symbol: "k" },
            { value: 1e6, symbol: "M" },
            { value: 1e9, symbol: "B" },
            { value: 1e12, symbol: "T" },
            { value: 1e15, symbol: "P" },
            { value: 1e18, symbol: "E" },
        ];

        let regularExpression = /\.0+$|(\.[0-9]*[1-9])0+$/;
        let i;
        for (i = steps.length - 1; i > 0; i--) {
            if (number >= steps[i].value) {
                break;
            }
        }
        return (number / steps[i].value).toFixed(decimals).replace(regularExpression, "$1") + " " + steps[i].symbol;
    } else {
        /*
          - st is used with numbers ending in 1 (e.g. 1st, pronounced first)
          - nd is used with numbers ending in 2 (e.g. 92nd, pronounced ninety-second)
          - rd is used with numbers ending in 3 (e.g. 33rd, pronounced thirty-third)
          - As an exception to the above rules, all the "teen" numbers ending with 11, 12 or 13 use -th
          (e.g. 11th, pronounced eleventh, 112th, pronounced one hundred [and] twelfth)
          - th is used for all other numbers (e.g. 9th, pronounced ninth).

        */
        let j = number % 10,
            k = number % 100;
        if (j == 1 && k != 11) {
            return number + "st";
        }
        if (j == 2 && k != 12) {
            return number + "nd";
        }
        if (j == 3 && k != 13) {
            return number + "rd";
        }
        return number + "th";
    }
}

const slugify = (text) => {
    return text.trim().split(" ").join("-").toLowerCase();
};

const capitalize = (text) => {
    return text.charAt(0).toUpperCase() + text.slice(1);
};

const map = (obj, callable) => {
    return Object.fromEntries(d3.map(obj, (r) => [r[0], callable(r[1])]));
};

/**
* Check whether two arrays are equal sets.

* @param {array} a    The first array.
* @param {array} b    The second array.
*/
const equals = (a, b) => {
    if (Array.isArray(a) && Array.isArray(b) && a.length == b.length) {
        a = a.concat().sort();
        b = b.concat().sort();

        return a.reduce((acc, e, i) => acc && e === b[i], true);
    } else {
        return false;
    }
};

/**
 * Wrapper of `d3.scaleLog` to produce a logarithmic scale from a (min, max) domain.
 *
 * @param {array} data   The original linear data.
 * @param {array} range  The range on which to project the logarithmic domain.
 */
let d3_scaleLogMinMax = (data, range) => {
    const data_minMax = [d3.min(data), d3.max(data)];

    return d3.scaleSymlog(data_minMax, range);
};

function ramp(color, n = 256) {
    const canvas = DOM.canvas(n, 1);
    const context = canvas.getContext("2d");
    for (let i = 0; i < n; ++i) {
        context.fillStyle = color(i / (n - 1));
        context.fillRect(i, 0, 1, 1);
    }
    return canvas;
}

function legend({
    color,
    title,
    tickSize = 6,
    width = 320,
    height = 44 + tickSize,
    marginTop = 18,
    marginRight = 0,
    marginBottom = 16 + tickSize,
    marginLeft = 0,
    ticks = width / 64,
    tickFormat,
    tickValues,
} = {}) {
    const svg = d3
        .create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .style("overflow", "visible")
        .style("display", "block");

    let x;

    console.log(color);
    // Continuous
    if (color.interpolator) {
        x = Object.assign(color.copy().interpolator(d3.interpolateRound(marginLeft, width - marginRight)), {
            range() {
                return [marginLeft, width - marginRight];
            },
        });

        svg.append("image")
            .attr("x", marginLeft)
            .attr("y", marginTop)
            .attr("width", width - marginLeft - marginRight)
            .attr("height", height - marginTop - marginBottom)
            .attr("preserveAspectRatio", "none")
            .attr("xlink:href", ramp(color.interpolator()).toDataURL());

        // scaleSequentialQuantile doesn’t implement ticks or tickFormat.
        if (!x.ticks) {
            if (tickValues === undefined) {
                const n = Math.round(ticks + 1);
                tickValues = d3.range(n).map((i) => d3.quantile(color.domain(), i / (n - 1)));
            }
            if (typeof tickFormat !== "function") {
                tickFormat = d3.format(tickFormat === undefined ? ",f" : tickFormat);
            }
        }
    }

    // Discrete
    else if (color.invertExtent) {
        const thresholds = color.thresholds
            ? color.thresholds() // scaleQuantize
            : color.quantiles
            ? color.quantiles() // scaleQuantile
            : color.domain(); // scaleThreshold

        const thresholdFormat = tickFormat === undefined ? (d) => d : typeof tickFormat === "string" ? d3.format(tickFormat) : tickFormat;

        x = d3
            .scaleLinear()
            .domain([-1, color.range().length - 1])
            .rangeRound([marginLeft, width - marginRight]);

        svg.append("g")
            .selectAll("rect")
            .data(color.range())
            .join("rect")
            .attr("x", (d, i) => x(i - 1))
            .attr("y", marginTop)
            .attr("width", (d, i) => x(i) - x(i - 1))
            .attr("height", height - marginTop - marginBottom)
            .attr("fill", (d) => d);

        tickValues = d3.range(thresholds.length);
        tickFormat = (i) => thresholdFormat(thresholds[i], i);
    }

    console.log(x);
    svg.append("g")
        .attr("transform", `translate(0, ${height - marginBottom})`)
        .call(
            d3
                .axisBottom(x)
                .ticks(ticks, typeof tickFormat === "string" ? tickFormat : undefined)
                .tickFormat(typeof tickFormat === "function" ? tickFormat : undefined)
                .tickSize(tickSize)
                .tickValues(tickValues)
        )
        .call((g) => g.selectAll(".tick line").attr("y1", marginTop + marginBottom - height))
        .call((g) => g.select(".domain").remove())
        .call((g) =>
            g
                .append("text")
                .attr("y", marginTop + marginBottom - height - 6)
                .attr("fill", "currentColor")
                .attr("text-anchor", "start")
                .attr("font-weight", "bold")
                .text(title)
        );

    return svg.node();
}
