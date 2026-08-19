/* =========================================================
   FOUR PROBE METHOD
   ENERGY BAND GAP SIMULATION
   ========================================================= */


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const materialSelect =
    document.getElementById("materialSelect");

const currentSlider =
    document.getElementById("currentSlider");

const currentValue =
    document.getElementById("currentValue");

const startOvenButton =
    document.getElementById("startOvenButton");

const startCoolingButton =
    document.getElementById("startCoolingButton");

const temperatureValue =
    document.getElementById("temperatureValue");

const ovenStatus =
    document.getElementById("ovenStatus");

const voltageValue =
    document.getElementById("voltageValue");

const measureButton =
    document.getElementById("measureButton");

const measurementMessage =
    document.getElementById("measurementMessage");

const measurementBody =
    document.getElementById("measurementBody");

const graphStatus =
    document.getElementById("graphStatus");

const calculateButton =
    document.getElementById("calculateButton");

const resetButton =
    document.getElementById("resetButton");

const slopeValue =
    document.getElementById("slopeValue");

const bandGapValue =
    document.getElementById("bandGapValue");

const resultMaterial =
    document.getElementById("resultMaterial");

const calculationMessage =
    document.getElementById("calculationMessage");

const canvas =
    document.getElementById("bandGapGraph");

const ctx =
    canvas.getContext("2d");


/* =========================================================
   EXPERIMENT CONSTANTS
   ========================================================= */

/*
   Adjacent probe spacing from the laboratory setup.
*/

const probeSpacingCm = 0.2;


/*
   Boltzmann constant in eV/K.
*/

const kB = 8.617333262e-5;


/*
   Maximum oven temperature.
*/

const maximumTemperature = 130;


/*
   Starting room temperature.
*/

const roomTemperature = 28;


/*
   Minimum useful cooling temperature.
*/

const minimumTemperature = 35;


/* =========================================================
   MATERIAL PARAMETERS
   ========================================================= */

/*
   These parameters create realistic-looking educational
   behaviour.

   The band-gap values are approximately:

   Germanium ≈ 0.67 eV
   Silicon   ≈ 1.10 eV
*/

const materialData = {

    germanium: {

        name: "Germanium",

        bandGap: 0.67,

        rhoAt300K: 45,

        referenceTemperature: 300

    },

    silicon: {

        name: "Silicon",

        bandGap: 1.10,

        rhoAt300K: 5000,

        referenceTemperature: 300

    }

};


/* =========================================================
   EXPERIMENT STATE
   ========================================================= */

let current_mA =
    parseFloat(currentSlider.value);

let temperatureC =
    roomTemperature;

let ovenRunning =
    false;

let cooling =
    false;

let experimentFinished =
    false;

let ovenTimer =
    null;

let measurements =
    [];


/* =========================================================
   CURRENT CONTROL
   ========================================================= */

currentSlider.addEventListener(
    "input",
    function () {

        current_mA =
            parseFloat(this.value);

        currentValue.textContent =
            current_mA.toFixed(1) + " mA";


        /*
           Voltage changes automatically because the
           current is changed.
        */

        updateVoltage();


        measurementMessage.textContent =
            "Current set to " +
            current_mA.toFixed(1) +
            " mA. Keep this current constant during measurement.";

    }
);


/* =========================================================
   MATERIAL SELECTION
   ========================================================= */

materialSelect.addEventListener(
    "change",
    function () {

        const material =
            materialData[this.value];

        resultMaterial.textContent =
            material.name;


        /*
           Clear previous measurements when changing sample.
        */

        measurements = [];

        measurementBody.innerHTML = "";

        slopeValue.textContent = "—";

        bandGapValue.textContent = "—";

        graphStatus.textContent =
            material.name +
            " selected. Set the current and start the oven.";


        drawGraph();


        updateVoltage();

    }
);


/* =========================================================
   START OVEN
   ========================================================= */

startOvenButton.addEventListener(
    "click",
    function () {

        if (ovenRunning) {
            return;
        }


        /*
           Make sure experiment starts from room temperature.
        */

        temperatureC =
            roomTemperature;

        ovenRunning =
            true;

        cooling =
            false;

        experimentFinished =
            false;


        startOvenButton.disabled =
            true;

        startCoolingButton.disabled =
            true;

        measureButton.disabled =
            true;


        ovenStatus.textContent =
            "Heating...";


        measurementMessage.textContent =
            "Oven heating. Wait until 130 °C is reached.";


        /*
           Heat slowly toward 130 °C.
        */

        ovenTimer =
            setInterval(
                heatOven,
                120
            );

    }
);


/* =========================================================
   HEATING FUNCTION
   ========================================================= */

function heatOven() {

    temperatureC += 1.2;


    if (temperatureC >= maximumTemperature) {

        temperatureC =
            maximumTemperature;


        clearInterval(ovenTimer);

        ovenTimer =
            null;

        ovenRunning =
            false;


        temperatureValue.textContent =
            temperatureC.toFixed(1);


        ovenStatus.textContent =
            "130 °C reached";


        startCoolingButton.disabled =
            false;


        measurementMessage.textContent =
            "Maximum temperature reached. Start cooling to begin measurements.";

        updateVoltage();

        return;
    }


    temperatureValue.textContent =
        temperatureC.toFixed(1);


    updateVoltage();

}


/* =========================================================
   START COOLING
   ========================================================= */

startCoolingButton.addEventListener(
    "click",
    function () {

        if (temperatureC < maximumTemperature) {

            measurementMessage.textContent =
                "Heat the oven to 130 °C first.";

            return;
        }


        cooling =
            true;


        startCoolingButton.disabled =
            true;

        measureButton.disabled =
            false;


        ovenStatus.textContent =
            "Cooling / Measurement";


        measurementMessage.textContent =
            "Cooling started. Record voltage at different temperatures while keeping current constant.";


        /*
           Slowly reduce temperature.
        */

        ovenTimer =
            setInterval(
                coolOven,
                500
            );

    }
);


/* =========================================================
   COOLING FUNCTION
   ========================================================= */

function coolOven() {

    temperatureC -= 1;


    if (temperatureC <= minimumTemperature) {

        temperatureC =
            minimumTemperature;

        clearInterval(ovenTimer);

        ovenTimer =
            null;

        cooling =
            false;

        experimentFinished =
            true;


        measureButton.disabled =
            false;


        ovenStatus.textContent =
            "Cooling complete";


        measurementMessage.textContent =
            "Cooling complete. You can calculate the energy band gap.";

        return;
    }


    temperatureValue.textContent =
        temperatureC.toFixed(1);


    updateVoltage();

}


/* =========================================================
   TEMPERATURE IN KELVIN
   ========================================================= */

function temperatureKelvin() {

    return temperatureC + 273.15;

}


/* =========================================================
   SIMULATED RESISTIVITY
   ========================================================= */

function calculateResistivity() {

    const material =
        materialData[
        materialSelect.value
        ];


    const T =
        temperatureKelvin();


    /*
       Semiconductor relation:

       ρ = ρ₀ exp[
           Eg / (2 k T)
       ]

       The reference value is normalized around 300 K.
    */

    const exponent =
        (
            material.bandGap /
            (2 * kB)
        ) *
        (
            1 / T -
            1 / material.referenceTemperature
        );


    return (
        material.rhoAt300K *
        Math.exp(exponent)
    );

}


/* =========================================================
   SIMULATED VOLTAGE
   ========================================================= */

function calculateVoltage() {

    const rho =
        calculateResistivity();


    /*
       Four-probe relation:

       ρ ≈ 2πS(V/I)

       Therefore:

       V = ρI / (2πS)
    */

    const current_A =
        current_mA / 1000;


    let voltage_V =
        (
            rho *
            current_A
        ) /
        (
            2 *
            Math.PI *
            probeSpacingCm
        );


    /*
       Convert V → mV.
    */

    let voltage_mV =
        voltage_V * 1000;


    /*
       Keep the displayed voltage in a practical
       laboratory range.
    */

    if (voltage_mV > 999) {

        voltage_mV = 999;

    }


    return voltage_mV;

}


/* =========================================================
   UPDATE VOLTAGE DISPLAY
   ========================================================= */

function updateVoltage() {

    const voltage =
        calculateVoltage();


    voltageValue.textContent =
        voltage.toFixed(2);

}


/* =========================================================
   MEASURE BUTTON
   ========================================================= */

measureButton.addEventListener(
    "click",
    function () {

        if (!cooling && !experimentFinished) {

            measurementMessage.textContent =
                "Start cooling before recording measurements.";

            return;
        }


        const T_C =
            temperatureC;


        const T_K =
            temperatureKelvin();


        const I_mA =
            current_mA;


        const V_mV =
            calculateVoltage();


        /*
           Calculate V/I.
        */

        const V_over_I =
            V_mV / I_mA;


        /*
           Four-probe resistivity:

           ρ = 2πS(V/I)

           Since V is in mV and I is in mA,
           V/I has the same numerical ratio as volts/amps.
        */

        const rho =
            2 *
            Math.PI *
            probeSpacingCm *
            V_over_I;


        /*
           Add small experimental variation.
        */

        const variation =
            1 +
            (Math.random() - 0.5) *
            0.015;


        const measuredRho =
            rho * variation;


        /*
           Store measurement.
        */

        measurements.push({

            temperatureC:
                T_C,

            temperatureK:
                T_K,

            current:
                I_mA,

            voltage:
                V_mV,

            vOverI:
                V_over_I,

            resistivity:
                measuredRho

        });


        /*
           Add table row.
        */

        addMeasurementRow(
            measurements[
            measurements.length - 1
            ]
        );


        /*
           Update graph.
        */

        drawGraph();


        graphStatus.textContent =
            measurements.length +
            " measurement" +
            (
                measurements.length === 1
                    ? ""
                    : "s"
            ) +
            " recorded.";


        /*
           Enable calculation after enough points.
        */

        if (measurements.length >= 4) {

            calculateButton.disabled =
                false;

        }


        measurementMessage.textContent =
            "Measurement recorded at " +
            T_C.toFixed(1) +
            " °C.";

    }
);


/* =========================================================
   ADD TABLE ROW
   ========================================================= */

function addMeasurementRow(data) {

    const row =
        document.createElement("tr");


    const number =
        measurements.length;


    row.innerHTML = `

        <td>${number}</td>

        <td>${data.temperatureC.toFixed(1)}</td>

        <td>${data.temperatureK.toFixed(1)}</td>

        <td>${data.current.toFixed(1)}</td>

        <td>${data.voltage.toFixed(2)}</td>

        <td>${data.vOverI.toFixed(4)}</td>

        <td>${data.resistivity.toFixed(3)}</td>

    `;


    measurementBody.appendChild(row);


    /*
       Automatically scroll to latest measurement.
    */

    const wrapper =
        document.querySelector(".table-wrapper");


    if (wrapper) {

        wrapper.scrollTop =
            wrapper.scrollHeight;

    }

}


/* =========================================================
   CALCULATE BAND GAP
   ========================================================= */

calculateButton.addEventListener(
    "click",
    function () {

        if (measurements.length < 4) {

            calculationMessage.textContent =
                "At least four measurements are required.";

            return;
        }


        /*
           We need:

           y = ln(ρ)

           x = 1000/T
        */

        const points =
            measurements.map(
                function (m) {

                    return {

                        x:
                            1000 /
                            m.temperatureK,

                        y:
                            Math.log(
                                m.resistivity
                            )

                    };

                }
            );


        /*
           Linear regression.
        */

        const regression =
            linearRegression(points);


        const slope =
            regression.slope;


        /*
           For:

           lnρ = constant +
                 Eg/(2kT)

           and x = 1000/T

           slope =
                 Eg/(2k × 1000)

           Therefore:

           Eg =
                 slope × 2k × 1000
        */

        const calculatedEg =
            slope *
            2 *
            kB *
            1000;


        slopeValue.textContent =
            slope.toFixed(3);


        bandGapValue.textContent =
            calculatedEg.toFixed(3);


        const material =
            materialData[
            materialSelect.value
            ];


        resultMaterial.textContent =
            material.name;


        calculationMessage.textContent =
            "Band gap calculated from the slope of ln ρ versus 1000/T.";


        graphStatus.textContent =
            "Linear fit completed. Calculated Eg = " +
            calculatedEg.toFixed(3) +
            " eV.";


        /*
           Redraw graph with fitted line.
        */

        drawGraph(
            regression
        );

    }
);


/* =========================================================
   LINEAR REGRESSION
   ========================================================= */

function linearRegression(points) {

    const n =
        points.length;


    let sumX =
        0;

    let sumY =
        0;

    let sumXY =
        0;

    let sumXX =
        0;


    points.forEach(
        function (point) {

            sumX += point.x;

            sumY += point.y;

            sumXY +=
                point.x *
                point.y;

            sumXX +=
                point.x *
                point.x;

        }
    );


    const denominator =
        (
            n * sumXX
        ) -
        (
            sumX * sumX
        );


    const slope =
        (
            n * sumXY -
            sumX * sumY
        ) /
        denominator;


    const intercept =
        (
            sumY -
            slope * sumX
        ) /
        n;


    return {

        slope:
            slope,

        intercept:
            intercept

    };

}


/* =========================================================
   GRAPH DRAWING
   ========================================================= */

function drawGraph(regression = null) {

    const rect =
        canvas.getBoundingClientRect();


    const width =
        rect.width;


    const height =
        rect.height;


    /*
       Handle high-DPI screens.
    */

    const dpr =
        window.devicePixelRatio || 1;


    canvas.width =
        width * dpr;

    canvas.height =
        height * dpr;


    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    /*
       Graph margins.
    */

    const left =
        55;

    const right =
        18;

    const top =
        18;

    const bottom =
        40;


    const graphWidth =
        width -
        left -
        right;


    const graphHeight =
        height -
        top -
        bottom;


    /*
       Background.
    */

    ctx.fillStyle =
        "#ffffff";

    ctx.fillRect(
        0,
        0,
        width,
        height
    );


    /*
       If no data, draw empty axes.
    */

    if (measurements.length === 0) {

        drawAxes(
            left,
            top,
            graphWidth,
            graphHeight,
            width,
            height
        );

        return;

    }


    /*
       Convert measurements to graph coordinates.
    */

    const points =
        measurements.map(
            function (m) {

                return {

                    x:
                        1000 /
                        m.temperatureK,

                    y:
                        Math.log(
                            m.resistivity
                        )

                };

            }
        );


    let minX =
        Math.min(
            ...points.map(
                p => p.x
            )
        );


    let maxX =
        Math.max(
            ...points.map(
                p => p.x
            )
        );


    let minY =
        Math.min(
            ...points.map(
                p => p.y
            )
        );


    let maxY =
        Math.max(
            ...points.map(
                p => p.y
            )
        );


    /*
       Add padding.
    */

    const xPadding =
        (maxX - minX) * 0.12 || 0.1;

    const yPadding =
        (maxY - minY) * 0.15 || 0.5;


    minX -= xPadding;

    maxX += xPadding;

    minY -= yPadding;

    maxY += yPadding;


    function mapX(x) {

        return left +
            (
                (x - minX) /
                (maxX - minX)
            ) *
            graphWidth;

    }


    function mapY(y) {

        return top +
            graphHeight -
            (
                (y - minY) /
                (maxY - minY)
            ) *
            graphHeight;

    }


    /*
       Draw axes.
    */

    drawAxes(
        left,
        top,
        graphWidth,
        graphHeight,
        width,
        height
    );


    /*
       Grid lines.
    */

    ctx.strokeStyle =
        "#e2e8f0";

    ctx.lineWidth =
        1;


    for (
        let i = 1;
        i < 5;
        i++
    ) {

        const y =
            top +
            (
                graphHeight *
                i / 5
            );


        ctx.beginPath();

        ctx.moveTo(
            left,
            y
        );

        ctx.lineTo(
            left + graphWidth,
            y
        );

        ctx.stroke();

    }


    /*
       Plot data points.
    */

    points.forEach(
        function (point) {

            const x =
                mapX(point.x);

            const y =
                mapY(point.y);


            ctx.beginPath();

            ctx.arc(
                x,
                y,
                4,
                0,
                2 * Math.PI
            );


            ctx.fillStyle =
                "#2563eb";

            ctx.fill();

        }
    );


    /*
       Draw best-fit line.
    */

    if (regression) {

        const y1 =
            regression.slope *
            minX +
            regression.intercept;


        const y2 =
            regression.slope *
            maxX +
            regression.intercept;


        ctx.beginPath();

        ctx.moveTo(
            mapX(minX),
            mapY(y1)
        );

        ctx.lineTo(
            mapX(maxX),
            mapY(y2)
        );


        ctx.strokeStyle =
            "#166534";

        ctx.lineWidth =
            2;

        ctx.stroke();

    }

}


/* =========================================================
   GRAPH AXES
   ========================================================= */

function drawAxes(
    left,
    top,
    graphWidth,
    graphHeight,
    width,
    height
) {

    ctx.strokeStyle =
        "#334155";

    ctx.lineWidth =
        1.5;


    /*
       Y axis
    */

    ctx.beginPath();

    ctx.moveTo(
        left,
        top
    );

    ctx.lineTo(
        left,
        top + graphHeight
    );

    ctx.stroke();


    /*
       X axis
    */

    ctx.beginPath();

    ctx.moveTo(
        left,
        top + graphHeight
    );

    ctx.lineTo(
        left + graphWidth,
        top + graphHeight
    );

    ctx.stroke();


    /*
       Labels
    */

    ctx.fillStyle =
        "#334155";

    ctx.font =
        "10px Arial";


    ctx.textAlign =
        "center";

    ctx.fillText(
        "1000 / T (K⁻¹)",
        left + graphWidth / 2,
        height - 8
    );


    ctx.save();

    ctx.translate(
        13,
        top + graphHeight / 2
    );

    ctx.rotate(
        -Math.PI / 2
    );

    ctx.fillText(
        "ln ρ",
        0,
        0
    );

    ctx.restore();

}


/* =========================================================
   RESET EXPERIMENT
   ========================================================= */

resetButton.addEventListener(
    "click",
    function () {

        /*
           Stop oven timer.
        */

        if (ovenTimer) {

            clearInterval(
                ovenTimer
            );

            ovenTimer =
                null;

        }


        /*
           Reset state.
        */

        temperatureC =
            roomTemperature;

        ovenRunning =
            false;

        cooling =
            false;

        experimentFinished =
            false;


        measurements = [];


        /*
           Reset controls.
        */

        currentSlider.value =
            10;

        current_mA =
            10;


        currentValue.textContent =
            "10.0 mA";


        materialSelect.value =
            "germanium";


        /*
           Reset displays.
        */

        temperatureValue.textContent =
            roomTemperature.toFixed(1);


        voltageValue.textContent =
            "0.00";


        ovenStatus.textContent =
            "Oven OFF";


        measurementBody.innerHTML =
            "";


        slopeValue.textContent =
            "—";


        bandGapValue.textContent =
            "—";


        resultMaterial.textContent =
            "Germanium";


        graphStatus.textContent =
            "No measurements recorded.";


        measurementMessage.textContent =
            "Set current and start the oven.";


        calculationMessage.textContent =
            "Record measurements during cooling to calculate the energy band gap.";


        /*
           Reset buttons.
        */

        startOvenButton.disabled =
            false;

        startCoolingButton.disabled =
            true;

        measureButton.disabled =
            true;

        calculateButton.disabled =
            true;


        drawGraph();

    }
);


/* =========================================================
   INITIALIZATION
   ========================================================= */

currentValue.textContent =
    current_mA.toFixed(1) +
    " mA";


temperatureValue.textContent =
    temperatureC.toFixed(1);


resultMaterial.textContent =
    materialData[
        materialSelect.value
    ].name;


drawGraph();


/* =========================================================
   WINDOW RESIZE
   ========================================================= */

window.addEventListener(
    "resize",
    function () {

        drawGraph();

    }
);