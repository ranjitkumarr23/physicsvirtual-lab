// ============================================
// MICROWAVE VIRTUAL LAB
// ============================================


// --------------------------------------------
// ELEMENTS
// --------------------------------------------

const canvas =
    document.getElementById("croCanvas");

const ctx =
    canvas.getContext("2d");


const powerButton =
    document.getElementById("powerButton");

const klystronStatus =
    document.getElementById("klystronStatus");


const frequencySlider =
    document.getElementById("frequencySlider");

const frequencyValue =
    document.getElementById("frequencyValue");

const frequencyDisplay =
    document.getElementById("frequencyDisplay");


const attenuatorSlider =
    document.getElementById("attenuatorSlider");

const attenuatorValue =
    document.getElementById("attenuatorValue");


const probeSlider =
    document.getElementById("probeSlider");

const probeValue =
    document.getElementById("probeValue");

const probe =
    document.getElementById("probe");


const sampleSelect =
    document.getElementById("sampleSelect");
const sampleThickness =
    document.getElementById(
        "sampleThickness"
    );
// --------------------------------------------
// SIMULATION MATERIAL PARAMETERS
// --------------------------------------------

function getSimulationEpsilon() {

    if (
        sampleSelect.value ===
        "teflon"
    ) {
        return 2.10;
    }


    if (
        sampleSelect.value ===
        "perspex"
    ) {
        return 2.60;
    }


    if (
        sampleSelect.value ===
        "glass"
    ) {
        return 4.70;
    }


    return 1.00;
}
// --------------------------------------------
// GUIDE WAVELENGTH INSIDE SAMPLE
// --------------------------------------------

function getDielectricGuideWavelength() {

    const epsilon =
        getSimulationEpsilon();

    const f =
        frequency * 1e9;


    if (
        epsilon <= 1
    ) {
        return getGuideWavelength();
    }


    const lambda0 =
        getFreeSpaceWavelength();


    const ratio =
        CUTOFF_FREQUENCY / f;


    const denominator =
        Math.sqrt(
            epsilon -
            ratio * ratio
        );


    return (
        lambda0 /
        denominator
    );

}

// --------------------------------------------
// CALCULATE SAMPLE MINIMUM SHIFT
// --------------------------------------------

function getSampleMinimumPosition() {

    if (
        referenceMinimum === null
    ) {
        return null;
    }


    if (
        sampleSelect.value ===
        "none"
    ) {
        return referenceMinimum;
    }


    const lambdaAir =
        getGuideWavelength();


    const lambdaDielectric =
        getDielectricGuideWavelength();


    const thickness =
        Number(
            sampleThickness.value
        );


    // Phase difference produced by
    // dielectric section

    const phaseDifference =
        2 * Math.PI *
        thickness *
        (
            1 / lambdaDielectric -
            1 / lambdaAir
        );


    // Convert phase shift into
    // equivalent movement of the minimum

    const shift =
        (
            phaseDifference /
            (2 * Math.PI)
        ) *
        lambdaAir;


    return (
        referenceMinimum -
        shift / 10
    );

}

const sample =
    document.getElementById("sample");


const resetButton =
    document.getElementById("resetButton");
const markMinimumButton =
    document.getElementById(
        "markMinimumButton"
    );

const saveReferenceButton =
    document.getElementById(
        "saveReferenceButton"
    );
const calculateEpsilonButton =
    document.getElementById(
        "calculateEpsilonButton"
    );


const betaValue =
    document.getElementById(
        "betaValue"
    );

const shiftValue =
    document.getElementById(
        "shiftValue"
    );

const phaseValue =
    document.getElementById(
        "phaseValue"
    );

const xValue =
    document.getElementById(
        "xValue"
    );

const epsilonValue =
    document.getElementById(
        "epsilonValue"
    );

const calculationStatus =
    document.getElementById(
        "calculationStatus"
    );
// ============================================
// TRANSCENDENTAL EQUATION SOLVER
// ============================================

function solveForX(target) {

    function equation(x) {

        return (
            Math.tan(x) / x
        ) - target;

    }


    const roots = [];

    const step = 0.002;

    let previousX = 0.001;
    let previousY =
        equation(previousX);


    for (
        let x = step;
        x <= 30;
        x += step
    ) {

        // Avoid points too close to tan(x)
        // discontinuities

        const cosX =
            Math.cos(x);


        if (
            Math.abs(cosX) < 0.01
        ) {

            previousX = x + step;
            previousY =
                equation(previousX);

            continue;

        }


        const y =
            equation(x);


        if (
            Number.isFinite(y) &&
            Number.isFinite(previousY) &&
            previousY * y < 0
        ) {

            let low =
                previousX;

            let high =
                x;


            // Bisection refinement

            for (
                let i = 0;
                i < 50;
                i++
            ) {

                const mid =
                    (low + high) / 2;

                const midY =
                    equation(mid);

                const lowY =
                    equation(low);


                if (
                    lowY * midY <= 0
                ) {

                    high = mid;

                }
                else {

                    low = mid;

                }

            }


            roots.push(
                (low + high) / 2
            );

        }


        previousX = x;
        previousY = y;

    }


    return roots;

}
// ============================================
// DIELECTRIC CONSTANT CALCULATION
// ============================================

function calculateDielectricConstant() {

    if (
        referenceMinimum === null
    ) {

        calculationStatus.textContent =
            "First save the reference minimum DR.";

        return;

    }


    if (
        sampleMinimum === null
    ) {

        calculationStatus.textContent =
            "First mark the minimum after inserting the sample.";

        return;

    }


    if (
        sampleSelect.value === "none"
    ) {

        calculationStatus.textContent =
            "Select a dielectric sample.";

        return;

    }


    // ----------------------------------------
    // Measurements
    // ----------------------------------------

    const DR =
        referenceMinimum * 10; // cm → mm


    const D =
        sampleMinimum * 10; // cm → mm


    const l =
        Number(
            sampleThickness.value
        ) * 10; // cm → mm


    if (
        l <= 0
    ) {

        calculationStatus.textContent =
            "Enter a valid sample thickness.";

        return;

    }


    // ----------------------------------------
    // Guide wavelength
    // ----------------------------------------

    const lambdaG =
        getGuideWavelength();


    const lambda0 =
        getFreeSpaceWavelength() * 1000;


    const beta =
        2 * Math.PI /
        lambdaG;


    // ----------------------------------------
    // DR - D
    // ----------------------------------------

    const shift =
        DR - D;


    // ----------------------------------------
    // Left side of transcendental equation
    // ----------------------------------------

    const phase =
        beta *
        (
            l +
            shift
        );


    const target =
        Math.tan(phase) /
        (beta * l);


    // ----------------------------------------
    // Solve tan(X)/X = target
    // ----------------------------------------

    const roots =
        solveForX(target);


    if (
        roots.length === 0
    ) {

        calculationStatus.textContent =
            "No physical root found. Check DR, D and sample thickness.";

        return;

    }


    // ----------------------------------------
    // Calculate epsilon for each root
    // ----------------------------------------

    const a =
        WAVEGUIDE_A * 1000; // mm


    const possibleResults = [];


    roots.forEach(
        function (X) {

            const betaE =
                X / l;


            const k0 =
                2 * Math.PI /
                lambda0;


            const epsilon =
                (
                    betaE * betaE +
                    (
                        Math.PI / a
                    ) *
                    (
                        Math.PI / a
                    )
                ) /
                (
                    k0 * k0
                );


            if (
                epsilon > 1 &&
                epsilon < 20
            ) {

                possibleResults.push({

                    X: X,

                    epsilon:
                        epsilon

                });

            }

        }
    );


    if (
        possibleResults.length === 0
    ) {

        calculationStatus.textContent =
            "No physically meaningful εr found.";

        return;

    }


    // Choose first physical solution

    const result =
        possibleResults[0];


    // ----------------------------------------
    // Display
    // ----------------------------------------

    betaValue.textContent =
        beta.toFixed(5);


    shiftValue.textContent =
        shift.toFixed(3);


    phaseValue.textContent =
        phase.toFixed(4);


    xValue.textContent =
        result.X.toFixed(4);


    epsilonValue.textContent =
        result.epsilon.toFixed(3);


    calculationStatus.textContent =
        "Calculation completed.";

}
calculateEpsilonButton.addEventListener(
    "click",
    function () {

        calculateDielectricConstant();

    }
);

const referenceMinimumValue =
    document.getElementById(
        "referenceMinimumValue"
    );

const sampleMinimumValue =
    document.getElementById(
        "sampleMinimumValue"
    );

markMinimumButton.addEventListener(
    "click",
    function () {

        // Reference measurement
        if (
            measurementMode ===
            "REFERENCE"
        ) {

            sampleMinimum =
                probePosition;

            sampleMinimumValue.textContent =
                sampleMinimum.toFixed(2)
                + " cm";


            calculationStatus.textContent =
                "Reference minimum found. Press SAVE REFERENCE.";

            return;
        }


        // Sample measurement
        if (
            measurementMode ===
            "SAMPLE"
        ) {

            if (
                sampleSelect.value ===
                "none"
            ) {

                alert(
                    "Please select a dielectric sample first."
                );

                return;
            }


            sampleMinimum =
                probePosition;

            sampleMinimumValue.textContent =
                sampleMinimum.toFixed(2)
                + " cm";
            calculateEpsilonButton.disabled =
                false;

            calculationStatus.textContent =
                "Sample minimum D recorded. You can now calculate εr.";

        }

    }
);
saveReferenceButton.addEventListener(
    "click",
    function () {

        if (
            sampleMinimum === null
        ) {

            alert(
                "First find and mark a minimum."
            );

            return;

        }


        referenceMinimum =
            sampleMinimum;

        referenceMinimumValue.textContent =
            referenceMinimum.toFixed(2)
            + " cm";

        measurementMode =
            "SAMPLE";
        saveReferenceButton.disabled =
            true;

        sampleMinimum =
            null;

        sampleMinimumValue.textContent =
            "---";

        calculateEpsilonButton.disabled =
            true;

        calculationStatus.textContent =
            "Reference saved. Select the dielectric sample and find the shifted minimum.";

    }
);


// --------------------------------------------
// STATE
// --------------------------------------------

let klystronOn = false;

let frequency = 9.50;

let probePosition = 0;

let attenuation = 50;
// --------------------------------------------
// MEASUREMENT STATE
// --------------------------------------------

let referenceMinimum = null;
let sampleMinimum = null;
let measurementMode = "REFERENCE";
// ============================================
// ACTUAL WAVEGUIDE PARAMETERS
// ============================================

// Waveguide dimensions
// Width  = 22.86 mm
// Height = 10.16 mm

const WAVEGUIDE_A = 22.86e-3; // metres
const WAVEGUIDE_B = 10.16e-3; // metres

// Speed of light
const C = 299792458; // m/s

// Dominant TE10 cutoff frequency
const CUTOFF_FREQUENCY =
    C / (2 * WAVEGUIDE_A);
// ============================================
// FREE-SPACE WAVELENGTH
// ============================================

function getFreeSpaceWavelength() {

    const f =
        frequency * 1e9;

    return C / f;
}
// ============================================
// GUIDE WAVELENGTH
// TE10 MODE
// ============================================

function getGuideWavelength() {

    const f =
        frequency * 1e9;


    // Below cutoff → no propagation

    if (
        f <= CUTOFF_FREQUENCY
    ) {

        return 0;

    }


    const lambda0 =
        getFreeSpaceWavelength();


    const cutoffRatio =
        CUTOFF_FREQUENCY / f;


    return (
        lambda0 /
        Math.sqrt(
            1 -
            cutoffRatio *
            cutoffRatio
        )
    );

}

// --------------------------------------------
// POWER
// --------------------------------------------

powerButton.addEventListener(
    "click",
    function () {

        klystronOn =
            !klystronOn;


        if (klystronOn) {

            powerButton.textContent =
                "KLYSTRON ON";

            powerButton.classList.add(
                "power-on"
            );

            klystronStatus.textContent =
                "ON";

            klystronStatus.classList.add(
                "on"
            );

        }
        else {

            powerButton.textContent =
                "KLYSTRON OFF";

            powerButton.classList.remove(
                "power-on"
            );

            klystronStatus.textContent =
                "OFF";

            klystronStatus.classList.remove(
                "on"
            );

        }


        drawCRO();

    }
);


// --------------------------------------------
// FREQUENCY
// --------------------------------------------

frequencySlider.addEventListener(
    "input",
    function () {

        frequency =
            Number(
                frequencySlider.value
            );


        const text =
            frequency.toFixed(2)
            + " GHz";


        frequencyValue.textContent =
            text;


        frequencyDisplay.textContent =
            text;


        drawCRO();

    }
);


// --------------------------------------------
// ATTENUATOR
// --------------------------------------------

attenuatorSlider.addEventListener(
    "input",
    function () {

        attenuation =
            Number(
                attenuatorSlider.value
            );


        attenuatorValue.textContent =
            attenuation
            + " %";


        drawCRO();

    }
);


// --------------------------------------------
// PROBE POSITION
// --------------------------------------------

probeSlider.addEventListener(
    "input",
    function () {

        probePosition =
            Number(
                probeSlider.value
            );


        probeValue.textContent =
            probePosition.toFixed(1)
            + " cm";


        updateProbePosition();

        drawCRO();

    }
);


// --------------------------------------------
// SAMPLE
// --------------------------------------------

sampleSelect.addEventListener(
    "change",
    function () {

        const selected =
            sampleSelect.value;


        if (selected === "none") {

            sample.textContent =
                "No Sample";

        }
        else if (selected === "teflon") {

            sample.textContent =
                "Teflon";

        }
        else if (selected === "perspex") {

            sample.textContent =
                "Perspex";

        }
        else if (selected === "glass") {

            sample.textContent =
                "Glass";

        }
        if (
            measurementMode ===
            "SAMPLE"
        ) {

            sampleMinimum =
                null;

            sampleMinimumValue.textContent =
                "---";

            calculateEpsilonButton.disabled =
                true;

            calculationStatus.textContent =
                "Sample selected. Move the probe to the shifted minimum and press MARK MINIMUM.";
        }

        drawCRO();

    }
);


// --------------------------------------------
// PROBE VISUAL POSITION
// --------------------------------------------

function updateProbePosition() {

    const trackWidth =
        200;

    const percentage =
        probePosition / 20;


    probe.style.left =
        (
            percentage *
            (
                trackWidth - 8
            )
        )
        + "px";

}


// --------------------------------------------
// RESET
// --------------------------------------------

resetButton.addEventListener(
    "click",
    function () {

        klystronOn =
            false;

        frequency =
            9.50;

        attenuation =
            50;

        probePosition =
            0;


        powerButton.textContent =
            "KLYSTRON OFF";

        powerButton.classList.remove(
            "power-on"
        );


        klystronStatus.textContent =
            "OFF";

        klystronStatus.classList.remove(
            "on"
        );


        frequencySlider.value =
            9.50;

        frequencyValue.textContent =
            "9.50 GHz";

        frequencyDisplay.textContent =
            "9.50 GHz";


        attenuatorSlider.value =
            50;

        attenuatorValue.textContent =
            "50 %";


        probeSlider.value =
            0;

        probeValue.textContent =
            "0.0 cm";


        sampleSelect.value =
            "none";

        sample.textContent =
            "No Sample";

        referenceMinimum = null;
        sampleMinimum = null;

        measurementMode =
            "REFERENCE";

        referenceMinimumValue.textContent =
            "---";

        sampleMinimumValue.textContent =
            "---";


        updateProbePosition();

        drawCRO();

    }
);


// ============================================
// CRO
// ============================================

function drawCRO() {

    const width =
        canvas.width;

    const height =
        canvas.height;


    // ----------------------------------------
    // Background
    // ----------------------------------------

    ctx.fillStyle =
        "#02080f";

    ctx.fillRect(
        0,
        0,
        width,
        height
    );


    // ----------------------------------------
    // Grid
    // ----------------------------------------

    ctx.strokeStyle =
        "#193449";

    ctx.lineWidth =
        1;


    for (
        let x = 0;
        x <= width;
        x += 35
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x,
            0
        );

        ctx.lineTo(
            x,
            height
        );

        ctx.stroke();

    }


    for (
        let y = 0;
        y <= height;
        y += 30
    ) {

        ctx.beginPath();

        ctx.moveTo(
            0,
            y
        );

        ctx.lineTo(
            width,
            y
        );

        ctx.stroke();

    }


    // ----------------------------------------
    // Centre line
    // ----------------------------------------

    ctx.strokeStyle =
        "#426277";

    ctx.beginPath();

    ctx.moveTo(
        0,
        height / 2
    );

    ctx.lineTo(
        width,
        height / 2
    );

    ctx.stroke();


    // ----------------------------------------
    // Klystron OFF
    // ----------------------------------------

    if (!klystronOn) {

        ctx.fillStyle =
            "#9aa8b5";

        ctx.font =
            "18px Arial";

        ctx.fillText(
            "Klystron OFF",
            25,
            30
        );

        return;

    }


    // ----------------------------------------
    // Standing wave
    // ----------------------------------------

    const attenuationFactor =
        1 -
        attenuation / 120;


    const frequencyFactor =
        frequency /
        9.50;


    const sampleFactor =
        getSampleFactor();


    const amplitude =
        85 *
        attenuationFactor *
        sampleFactor;


    const guideWavelength =
        getGuideWavelength();


    // Convert metres → millimetres

    const wavelength =
        guideWavelength * 1000;
    // ----------------------------------------
    // Probe measurement
    // ----------------------------------------

    const probeDistance =
        probePosition * 10;   // cm → mm

    let effectiveProbeDistance =
        probeDistance;


    // ----------------------------------------
    // Sample-induced minimum shift
    // ----------------------------------------

    const shiftedMinimum =
        getSampleMinimumPosition();


    if (
        shiftedMinimum !== null &&
        sampleSelect.value !== "none"
    ) {

        effectiveProbeDistance =
            probeDistance -
            shiftedMinimum * 10;

    }
    const probePhase =
        Math.PI *
        effectiveProbeDistance /
        wavelength;
    if (
        referenceMinimum !== null
    ) {

        const shifted =
            getSampleMinimumPosition();


        sampleMinimumValue.textContent =
            shifted.toFixed(2)
            + " cm";

    }

    const probeField =
        Math.abs(
            Math.sin(
                2 *
                Math.PI *
                probeDistance /
                wavelength
            )
        );


    const probeIntensity =
        probeField *
        probeField;


    ctx.beginPath();


    for (
        let x = 0;
        x < width;
        x++
    ) {

        const position =
            (x / width) * 200;   // physical position in mm


        const envelope =
            Math.abs(
                Math.sin(
                    2 *
                    Math.PI *
                    position /
                    wavelength
                )
            );


        const y =
            height / 2 -
            amplitude * envelope;




        if (x === 0) {

            ctx.moveTo(
                x,
                y
            );

        }
        else {

            ctx.lineTo(
                x,
                y
            );

        }

    }


    ctx.strokeStyle =
        "#62e6ff";

    ctx.lineWidth =
        2;

    ctx.stroke();

    // ----------------------------------------
    // Probe marker
    // ----------------------------------------

    const probeX =
        (
            probePosition / 20
        ) * width;


    ctx.strokeStyle =
        "#ffcf4a";

    ctx.lineWidth =
        2;

    ctx.beginPath();

    ctx.moveTo(
        probeX,
        0
    );

    ctx.lineTo(
        probeX,
        height
    );

    ctx.stroke();


    // ----------------------------------------
    // CRO information
    // ----------------------------------------

    ctx.fillStyle =
        "#bfefff";

    ctx.font =
        "14px Arial";

    ctx.fillText(
        "Standing-wave pattern",
        20,
        25
    );

    // ----------------------------------------
    // Probe reading
    // ----------------------------------------

    ctx.fillStyle =
        "#ffcf4a";

    ctx.font =
        "14px Arial";


    ctx.fillText(
        "Probe = "
        + probePosition.toFixed(1)
        + " cm",
        20,
        50
    );


    ctx.fillText(
        "Intensity = "
        + probeIntensity.toFixed(3),
        20,
        70
    );

    ctx.fillText(
        "f = "
        + frequency.toFixed(2)
        + " GHz",
        20,
        height - 15
    );



    if (guideWavelength > 0) {

        ctx.fillText(
            "λg = "
            + (
                guideWavelength * 1000
            ).toFixed(2)
            + " mm",
            150,
            height - 15
        );

    }
    else {

        ctx.fillText(
            "Below cutoff",
            150,
            height - 15
        );

    }

}


// --------------------------------------------
// SAMPLE EFFECT
// --------------------------------------------

function getSampleFactor() {

    if (
        sampleSelect.value ===
        "none"
    ) {

        return 1.0;

    }


    if (
        sampleSelect.value ===
        "teflon"
    ) {

        return 0.85;

    }


    if (
        sampleSelect.value ===
        "perspex"
    ) {

        return 0.75;

    }


    if (
        sampleSelect.value ===
        "glass"
    ) {

        return 0.65;

    }


    return 1.0;

}


// ============================================
// INITIAL DISPLAY
// ============================================

updateProbePosition();

drawCRO();