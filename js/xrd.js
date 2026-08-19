// ============================================
// PHYWE XR 4.0 X-RAY DIFFRACTION
// Characteristic X-rays of Copper
// ============================================


// --------------------------------------------
// HTML ELEMENTS
// --------------------------------------------

const xrayPowerButton =
    document.getElementById("xrayPowerButton");

const anodeVoltage =
    document.getElementById("anodeVoltage");

const anodeCurrent =
    document.getElementById("anodeCurrent");

const voltageValue =
    document.getElementById("voltageValue");

const currentValue =
    document.getElementById("currentValue");

const crystalSelect =
    document.getElementById("crystalSelect");
const measurementMode =
    document.getElementById("measurementMode");

const filterSelect =
    document.getElementById("filterSelect");

const fixedAngleControl =
    document.getElementById("fixedAngleControl");

const fixedAngle =
    document.getElementById("fixedAngle");

const fixedAngleValue =
    document.getElementById("fixedAngleValue");

const scanButton =
    document.getElementById("scanButton");

const resetButton =
    document.getElementById("resetButton");

const xrayStatus =
    document.getElementById("xrayStatus");

const scanStatus =
    document.getElementById("scanStatus");

const canvas =
    document.getElementById("xrdCanvas");

const ctx =
    canvas.getContext("2d");

const angleReadout =
    document.getElementById("angleReadout");

const intensityReadout =
    document.getElementById("intensityReadout");
const detector =
    document.querySelector(".detector");


// --------------------------------------------
// STATE
// --------------------------------------------

let xrayOn = false;

let scanning = false;
// Stores intensity measured during the scan
let scanData = [];

let scanTimer = null;

let currentAngle = 0;
// ============================================
// DETECTOR MOVEMENT
// ============================================
//
// PHYWE uses 1:2 coupling.
// Crystal angle = θ
// Detector movement = 2θ
//
// For the visual simulation we rotate the
// detector progressively during the scan.
// ============================================

function updateDetectorPosition() {

    if (!detector) {
        return;
    }


    const range =
        getScanRange();


    // Movement relative to the beginning
    // of the scan.

    const relativeAngle =
        currentAngle - range.start;


    // 1:2 coupling
    // detector movement = 2 × theta

    const detectorAngle =
        relativeAngle * 2;


    detector.style.transform =
        `rotate(${-detectorAngle}deg)`;
}


// --------------------------------------------
// PHYSICAL CONSTANTS
// --------------------------------------------

const PLANCK = 6.6256e-34;

const LIGHT_SPEED = 2.9979e8;

const ELECTRON_CHARGE = 1.6021e-19;


// Cu characteristic X-ray energies

const CU_K_ALPHA = 8.038; // keV

const CU_K_BETA = 8.905;  // keV


// Analyzer crystal spacings

const D_LIF = 2.014e-10; // m

const D_KBR = 3.290e-10; // m
// NaCl lattice constant
// approximately 564 pm

const A_NACL = 5.64e-10; // m


// --------------------------------------------
// SCAN SETTINGS
// --------------------------------------------

const STEP_SIZE = 0.1;


// LiF: 4° to 55°
// KBr: 3° to 75°

function getScanRange() {

    if (crystalSelect.value === "KBr") {

        return {
            start: 3,
            end: 75
        };

    }


    if (
        crystalSelect.value === "NaCl100" ||
        crystalSelect.value === "NaCl110" ||
        crystalSelect.value === "NaCl111"
    ) {

        return {
            start: 5,
            end: 60
        };

    }


    // LiF

    return {
        start: 4,
        end: 55
    };
}
function updateMeasurementMode() {

    if (measurementMode.value === "fixed") {

        fixedAngleControl.style.display =
            "block";

        scanButton.textContent =
            "SET FIXED ANGLE";

    }
    else {

        fixedAngleControl.style.display =
            "none";

        scanButton.textContent =
            "START SCAN";

    }

}
measurementMode.addEventListener(
    "change",
    updateMeasurementMode
);
fixedAngle.addEventListener(
    "input",
    function () {

        fixedAngleValue.textContent =
            Number(
                fixedAngle.value
            ).toFixed(1);

    }
);

// --------------------------------------------
// BRAGG LAW
// --------------------------------------------
//
// 2 d sin(theta) = n lambda
//
// lambda = hc/E
// --------------------------------------------

function calculateWavelength(energyKeV) {

    const energyJ =
        energyKeV *
        1000 *
        ELECTRON_CHARGE;

    return (
        PLANCK *
        LIGHT_SPEED
    ) / energyJ;
}


function calculatePeakAngle(
    energyKeV,
    d,
    order
) {

    const wavelength =
        calculateWavelength(energyKeV);

    const value =
        (order * wavelength) /
        (2 * d);


    if (value >= 1) {

        return null;

    }


    return (
        Math.asin(value) *
        180 /
        Math.PI
    );
}


// --------------------------------------------
// PEAK LIST
// --------------------------------------------
function getPeaks() {

    // ========================================
    // NaCl single crystal
    // ========================================

    if (
        crystalSelect.value === "NaCl100" ||
        crystalSelect.value === "NaCl110" ||
        crystalSelect.value === "NaCl111"
    ) {

        const peaks = [];


        let planes = [];


        // ------------------------------------
        // [100] orientation
        // Reflections:
        // (200), (400), (600)
        // ------------------------------------

        if (crystalSelect.value === "NaCl100") {

            planes = [
                {
                    h: 2,
                    k: 0,
                    l: 0,
                    order: 1,
                    strength: 1.0
                },

                {
                    h: 4,
                    k: 0,
                    l: 0,
                    order: 2,
                    strength: 0.28
                },

                {
                    h: 6,
                    k: 0,
                    l: 0,
                    order: 3,
                    strength: 0.10
                }
            ];

        }


        // ------------------------------------
        // [110] orientation
        // Reflections:
        // (220), (440)
        // ------------------------------------

        if (crystalSelect.value === "NaCl110") {

            planes = [
                {
                    h: 2,
                    k: 2,
                    l: 0,
                    order: 1,
                    strength: 0.75
                },

                {
                    h: 4,
                    k: 4,
                    l: 0,
                    order: 2,
                    strength: 0.25
                }
            ];

        }


        // ------------------------------------
        // [111] orientation
        // Reflections:
        // (111), (222), (333), (444)
        //
        // PHYWE manual notes that the n=2
        // reflection is particularly strong.
        // ------------------------------------

        if (crystalSelect.value === "NaCl111") {

            planes = [
                {
                    h: 1,
                    k: 1,
                    l: 1,
                    order: 1,
                    strength: 0.35
                },

                {
                    h: 2,
                    k: 2,
                    l: 2,
                    order: 2,
                    strength: 1.0
                },

                {
                    h: 3,
                    k: 3,
                    l: 3,
                    order: 3,
                    strength: 0.18
                },

                {
                    h: 4,
                    k: 4,
                    l: 4,
                    order: 4,
                    strength: 0.08
                }
            ];

        }


        // ------------------------------------
        // Calculate diffraction angles
        // ------------------------------------

        for (const plane of planes) {

            const hklSquared =
                plane.h * plane.h +
                plane.k * plane.k +
                plane.l * plane.l;


            const d =
                A_NACL /
                Math.sqrt(hklSquared);


            // Cu K-alpha

            const alpha =
                calculatePeakAngle(
                    CU_K_ALPHA,
                    d,
                    1
                );


            // Cu K-beta

            const beta =
                calculatePeakAngle(
                    CU_K_BETA,
                    d,
                    1
                );


            if (alpha !== null) {

                peaks.push({

                    angle: alpha,

                    type: "Kα",

                    order: plane.order,

                    energy: CU_K_ALPHA,

                    h: plane.h,

                    k: plane.k,

                    l: plane.l,

                    strength: plane.strength

                });

            }


            if (beta !== null) {

                peaks.push({

                    angle: beta,

                    type: "Kβ",

                    order: plane.order,

                    energy: CU_K_BETA,

                    h: plane.h,

                    k: plane.k,

                    l: plane.l,

                    strength:
                        plane.strength * 0.35

                });

            }

        }


        return peaks;

    }


    // ========================================
    // EXISTING LiF / KBr CODE
    // ========================================

    const d =
        crystalSelect.value === "KBr"
            ? D_KBR
            : D_LIF;


    const peaks = [];


    const maxOrder =
        crystalSelect.value === "KBr"
            ? 4
            : 2;


    for (
        let order = 1;
        order <= maxOrder;
        order++
    ) {

        const alpha =
            calculatePeakAngle(
                CU_K_ALPHA,
                d,
                order
            );


        const beta =
            calculatePeakAngle(
                CU_K_BETA,
                d,
                order
            );


        if (alpha !== null) {

            peaks.push({

                angle: alpha,

                type: "Kα",

                order: order,

                energy: CU_K_ALPHA

            });

        }


        if (beta !== null) {

            peaks.push({

                angle: beta,

                type: "Kβ",

                order: order,

                energy: CU_K_BETA

            });

        }

    }


    return peaks;
}

// --------------------------------------------
// CHARACTERISTIC LINE STRENGTH
// --------------------------------------------

function characteristicStrength() {

    const voltage =
        Number(anodeVoltage.value);

    const current =
        Number(anodeCurrent.value);


    // Cu K lines require sufficient
    // accelerating voltage.


    if (voltage < 10) {

        return 0;

    }


    const voltageFactor =
        Math.max(
            0,
            (voltage - 9) / 26
        );


    const currentFactor =
        current / 1.0;


    return (
        voltageFactor *
        currentFactor
    );
}


// --------------------------------------------
// BREMSSTRAHLUNG BACKGROUND
// --------------------------------------------

function backgroundIntensity(angle) {

    const voltage =
        Number(anodeVoltage.value);


    const current =
        Number(anodeCurrent.value);


    const range =
        getScanRange();


    // Smooth continuous background

    const normalized =
        (angle - range.start) /
        (range.end - range.start);


    const shape =
        0.65 +
        0.35 *
        Math.sin(
            normalized * Math.PI
        );


    return (
        80 *
        (voltage / 35) *
        (current / 1.0) *
        shape
    );
}


// --------------------------------------------
// GAUSSIAN PEAK
// --------------------------------------------

function gaussian(
    x,
    center,
    width
) {

    const difference =
        x - center;


    return Math.exp(
        -(
            difference *
            difference
        ) /
        (
            2 *
            width *
            width
        )
    );
}

// --------------------------------------------
// NI FILTER TRANSMISSION
// --------------------------------------------
//
// The PHYWE experiment uses a nickel filter
// to strongly suppress the Cu Kβ component.
//
// These are simulation transmission factors,
// not measured filter specifications.
// --------------------------------------------

function getFilterTransmission(lineType) {

    if (filterSelect.value !== "ni") {

        return 1.0;

    }


    if (lineType === "Kβ") {

        // Strong suppression of Kβ

        return 0.05;

    }


    if (lineType === "Kα") {

        // Kα passes much more effectively

        return 0.90;

    }


    return 1.0;
}
// --------------------------------------------
// INTENSITY AT ANGLE
// --------------------------------------------

function calculateIntensity(angle) {

    let intensity =
        backgroundIntensity(angle);


    const lineStrength =
        characteristicStrength();


    const peaks =
        getPeaks();


    for (const peak of peaks) {

        let relativeStrength;


        // K-alpha is stronger than K-beta

        if (peak.type === "Kα") {

            relativeStrength = 1.0;

        }
        else {

            relativeStrength = 0.25;

        }
        // Apply filter transmission
        relativeStrength *=
            getFilterTransmission(
                peak.type
            );

        // Higher orders weaker

        // Higher orders are generally weaker.
        // NaCl peaks can have their own
        // orientation-dependent strength.

        if (peak.strength !== undefined) {

            relativeStrength =
                peak.strength;

        }
        else {

            relativeStrength /=
                peak.order;

        }

        const peakHeight =
            1200 *
            lineStrength *
            relativeStrength;


        intensity +=
            peakHeight *
            gaussian(
                angle,
                peak.angle,
                0.22
            );

    }


    return Math.max(
        0,
        intensity
    );
}


// --------------------------------------------
// CANVAS SIZE
// --------------------------------------------

function resizeCanvas() {

    canvas.width =
        canvas.clientWidth;

    canvas.height =
        canvas.clientHeight;


    drawSpectrum();

}


// --------------------------------------------
// DRAW AXES
// --------------------------------------------

function drawAxes() {

    const width =
        canvas.width;

    const height =
        canvas.height;


    const left = 60;

    const right = 20;

    const top = 20;

    const bottom = 45;


    ctx.strokeStyle =
        "#557080";

    ctx.lineWidth = 1;


    // Y axis

    ctx.beginPath();

    ctx.moveTo(
        left,
        top
    );

    ctx.lineTo(
        left,
        height - bottom
    );

    ctx.stroke();


    // X axis

    ctx.beginPath();

    ctx.moveTo(
        left,
        height - bottom
    );

    ctx.lineTo(
        width - right,
        height - bottom
    );

    ctx.stroke();


    // Labels

    ctx.fillStyle =
        "#9fc5d8";

    ctx.font =
        "12px Arial";


    ctx.fillText(
        "Intensity",
        8,
        20
    );


    ctx.fillText(
        "Bragg angle θ (°)",
        width - 120,
        height - 10
    );

}

// --------------------------------------------
// DRAW PEAK LABELS
// --------------------------------------------

function drawPeakLabels() {

    const range = getScanRange();

    const width = canvas.width;
    const height = canvas.height;

    const left = 60;
    const right = 20;
    const top = 20;
    const bottom = 45;

    const plotWidth =
        width - left - right;

    const plotHeight =
        height - top - bottom;

    const maxIntensity = 1400;

    const peaks = getPeaks();

    ctx.font = "11px Arial";
    ctx.textAlign = "center";

    for (const peak of peaks) {

        // Ignore peaks outside the current scan range

        if (
            peak.angle < range.start ||
            peak.angle > range.end
        ) {
            continue;
        }


        const x =
            left +
            (
                (peak.angle - range.start) /
                (range.end - range.start)
            ) *
            plotWidth;


        const intensity =
            calculateIntensity(peak.angle);


        const y =
            height -
            bottom -
            (
                intensity /
                maxIntensity
            ) *
            plotHeight;


        // Keep label inside graph

        const labelY =
            Math.max(
                top + 35,
                y - 28
            );


        // Vertical marker

        ctx.strokeStyle =
            "#9fc5d8";

        ctx.lineWidth = 1;

        ctx.beginPath();

        ctx.moveTo(
            x,
            y
        );

        ctx.lineTo(
            x,
            labelY + 5
        );

        ctx.stroke();


        // Peak name

        ctx.fillStyle =
            "#f5d76e";

        ctx.fillText(
            peak.type,
            x,
            labelY
        );


        // Miller index for NaCl

        if (
            peak.h !== undefined &&
            peak.k !== undefined &&
            peak.l !== undefined
        ) {

            ctx.fillStyle =
                "#ffffff";

            ctx.fillText(
                `(${peak.h}${peak.k}${peak.l})`,
                x,
                labelY + 13
            );

        }


        // Angle

        ctx.fillStyle =
            "#73d8ff";

        ctx.fillText(
            peak.angle.toFixed(1) + "°",
            x,
            labelY + 26
        );

    }


    ctx.textAlign = "left";

}
// --------------------------------------------
// DRAW SPECTRUM
// --------------------------------------------

function drawSpectrum() {
    if (scanning) {

        drawAxes();

        drawLiveScan();

        return;
    }

    const width =
        canvas.width;

    const height =
        canvas.height;


    ctx.fillStyle =
        "#02070d";

    ctx.fillRect(
        0,
        0,
        width,
        height
    );


    drawAxes();


    const range =
        getScanRange();


    const left = 60;

    const right = 20;

    const top = 20;

    const bottom = 45;


    const plotWidth =
        width - left - right;

    const plotHeight =
        height - top - bottom;


    const maxIntensity =
        1400;

    // --------------------------------------------
    // DRAW LIVE SCAN DATA
    // --------------------------------------------

    function drawLiveScan() {

        if (scanData.length < 2) {
            return;
        }


        const range = getScanRange();

        const width = canvas.width;
        const height = canvas.height;

        const left = 60;
        const right = 20;
        const top = 20;
        const bottom = 45;

        const plotWidth =
            width - left - right;

        const plotHeight =
            height - top - bottom;

        const maxIntensity = 1400;


        ctx.beginPath();


        scanData.forEach((point, index) => {

            const x =
                left +
                (
                    (point.angle - range.start) /
                    (range.end - range.start)
                ) *
                plotWidth;


            const y =
                height -
                bottom -
                (
                    point.intensity /
                    maxIntensity
                ) *
                plotHeight;


            if (index === 0) {

                ctx.moveTo(x, y);

            } else {

                ctx.lineTo(x, y);

            }

        });


        ctx.strokeStyle =
            "#73d8ff";

        ctx.lineWidth = 2;

        ctx.stroke();


        // Measurement points

        ctx.fillStyle =
            "#ffffff";


        scanData.forEach(point => {

            const x =
                left +
                (
                    (point.angle - range.start) /
                    (range.end - range.start)
                ) *
                plotWidth;


            const y =
                height -
                bottom -
                (
                    point.intensity /
                    maxIntensity
                ) *
                plotHeight;


            ctx.beginPath();

            ctx.arc(
                x,
                y,
                1.5,
                0,
                Math.PI * 2
            );

            ctx.fill();

        });

    }
    // ----------------------------------------
    // Spectrum curve
    // ----------------------------------------

    ctx.beginPath();


    const points =
        Math.ceil(
            (
                range.end -
                range.start
            ) / STEP_SIZE
        );


    for (
        let i = 0;
        i <= points;
        i++
    ) {

        const angle =
            range.start +
            i * STEP_SIZE;


        const intensity =
            calculateIntensity(angle);


        const x =
            left +
            (
                (angle - range.start) /
                (
                    range.end -
                    range.start
                )
            ) *
            plotWidth;


        const y =
            height -
            bottom -
            (
                intensity /
                maxIntensity
            ) *
            plotHeight;


        if (i === 0) {

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
        "#73d8ff";

    ctx.lineWidth = 2;

    ctx.stroke();
    // Draw diffraction peak labels
    if (!scanning) {

        drawPeakLabels();

    }


    // ----------------------------------------
    // Current scan position
    // ----------------------------------------

    if (scanning) {

        const scanX =
            left +
            (
                (
                    currentAngle -
                    range.start
                ) /
                (
                    range.end -
                    range.start
                )
            ) *
            plotWidth;


        ctx.strokeStyle =
            "#f5d76e";

        ctx.lineWidth = 1;


        ctx.beginPath();

        ctx.moveTo(
            scanX,
            top
        );

        ctx.lineTo(
            scanX,
            height - bottom
        );

        ctx.stroke();

    }

}
// ============================================
// FIXED CRYSTAL ANGLE MODE
// ============================================
//
// PHYWE Task 2:
// LiF crystal fixed at 22.6°
// Detector scans independently.
//
// Detector range:
// 20° → 70°
// Increment: 0.1°
//
// ============================================
// ============================================
// FIXED-ANGLE INTENSITY
// ============================================

function calculateFixedAngleIntensity(
    crystalAngle,
    detectorAngle
) {

    const voltage =
        Number(anodeVoltage.value);

    const current =
        Number(anodeCurrent.value);


    // No characteristic radiation
    // below the Cu K-line threshold
    if (voltage < 10) {
        return 0;
    }


    // Basic X-ray intensity factor
    const sourceFactor =
        characteristicStrength();


    // Fixed crystal selects the Bragg angle.
    //
    // For a fixed crystal angle theta,
    // the detector position is approximately 2 theta.

    const expectedDetectorAngle =
        2 * crystalAngle;


    // Width of detector response
    const width = 0.45;


    const difference =
        detectorAngle -
        expectedDetectorAngle;


    const diffractionPeak =
        Math.exp(
            -(
                difference *
                difference
            ) /
            (
                2 *
                width *
                width
            )
        );


    // Background
    const background =
        30 *
        (voltage / 35) *
        (current / 1.0);


    // K-alpha selected by LiF at 22.6°
    const peakIntensity =
        1200 *
        sourceFactor *
        diffractionPeak;


    return Math.max(
        0,
        background + peakIntensity
    );
}
// ============================================
// FIXED-ANGLE DETECTOR MOVEMENT
// ============================================

function updateFixedDetectorPosition(
    detectorAngle
) {

    if (!detector) {
        return;
    }


    // Visual movement only.
    // The detector scans from 20° to 70°.

    const relativeAngle =
        detectorAngle - 20;


    detector.style.transform =
        `rotate(${-relativeAngle}deg)`;
}

function startFixedAngleMeasurement() {

    if (!xrayOn) {

        scanStatus.textContent =
            "Turn X-Ray ON first";

        return;

    }


    if (crystalSelect.value !== "LiF") {

        scanStatus.textContent =
            "Fixed-angle mode uses LiF";

        return;

    }


    scanning = true;


    scanData = [];


    // Fixed analyzer crystal angle

    const crystalAngle =
        Number(
            fixedAngle.value
        );


    // PHYWE recommended setting:
    // 22.6° for Cu Kα

    const detectorStart = 20;

    const detectorStop = 70;

    const detectorStep = 0.1;


    currentAngle =
        detectorStart;


    scanStatus.textContent =
        "Fixed-angle measurement";


    scanButton.textContent =
        "MEASURING";


    fixedAngleValue.textContent =
        crystalAngle.toFixed(1);


    fixedAngleMeasurementStep(
        crystalAngle,
        detectorStart,
        detectorStop,
        detectorStep
    );

}
function fixedAngleMeasurementStep(
    crystalAngle,
    detectorStart,
    detectorStop,
    detectorStep
) {

    if (!scanning) {

        return;

    }


    // ----------------------------------------
    // Fixed analyzer angle
    // ----------------------------------------

    const theta =
        crystalAngle;


    // ----------------------------------------
    // Detector angle
    // ----------------------------------------

    const detectorAngle =
        currentAngle;


    // ----------------------------------------
    // Calculate monochromatized intensity
    // ----------------------------------------

    const intensity =
        calculateFixedAngleIntensity(
            theta,
            detectorAngle
        );


    // Store measured point

    scanData.push({

        angle: detectorAngle,

        intensity: intensity

    });


    angleReadout.textContent =
        detectorAngle.toFixed(1)
        + "°";


    intensityReadout.textContent =
        Math.round(
            intensity
        );


    // Update detector visually

    updateFixedDetectorPosition(
        detectorAngle
    );


    drawFixedAngleSpectrum();


    // ----------------------------------------
    // Next detector position
    // ----------------------------------------

    currentAngle +=
        detectorStep;


    if (
        currentAngle >
        detectorStop
    ) {

        scanning = false;


        scanButton.textContent =
            "SET FIXED ANGLE";


        scanStatus.textContent =
            "Fixed-angle measurement complete";


        drawFixedAngleSpectrum();


        return;

    }


    scanTimer =
        setTimeout(
            function () {

                fixedAngleMeasurementStep(
                    crystalAngle,
                    detectorStart,
                    detectorStop,
                    detectorStep
                );

            },
            25
        );

}

// ============================================
// DRAW FIXED-ANGLE SPECTRUM
// ============================================

function drawFixedAngleSpectrum() {

    const width = canvas.width;
    const height = canvas.height;

    const left = 60;
    const right = 20;
    const top = 20;
    const bottom = 45;

    const plotWidth =
        width - left - right;

    const plotHeight =
        height - top - bottom;

    const detectorStart = 20;
    const detectorStop = 70;

    const maxIntensity = 1400;


    // Clear graph

    ctx.fillStyle = "#02070d";

    ctx.fillRect(
        0,
        0,
        width,
        height
    );


    // Axes

    drawAxes();


    // ----------------------------------------
    // Plot measured detector data
    // ----------------------------------------

    if (scanData.length < 2) {

        return;

    }


    ctx.beginPath();


    scanData.forEach(
        (point, index) => {

            const x =
                left +
                (
                    (point.angle - detectorStart) /
                    (detectorStop - detectorStart)
                ) *
                plotWidth;


            const y =
                height -
                bottom -
                (
                    point.intensity /
                    maxIntensity
                ) *
                plotHeight;


            if (index === 0) {

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
    );


    ctx.strokeStyle =
        "#73d8ff";

    ctx.lineWidth = 2;

    ctx.stroke();


    // ----------------------------------------
    // Measurement points
    // ----------------------------------------

    ctx.fillStyle =
        "#ffffff";


    scanData.forEach(
        point => {

            const x =
                left +
                (
                    (point.angle - detectorStart) /
                    (detectorStop - detectorStart)
                ) *
                plotWidth;


            const y =
                height -
                bottom -
                (
                    point.intensity /
                    maxIntensity
                ) *
                plotHeight;


            ctx.beginPath();

            ctx.arc(
                x,
                y,
                1.5,
                0,
                Math.PI * 2
            );

            ctx.fill();

        }
    );


    // ----------------------------------------
    // Fixed crystal information
    // ----------------------------------------

    ctx.fillStyle =
        "#f5d76e";

    ctx.font =
        "12px Arial";

    ctx.fillText(
        "Fixed crystal angle θ = " +
        Number(
            fixedAngle.value
        ).toFixed(1) +
        "°",
        70,
        35
    );

}
// --------------------------------------------
// START SCAN
// --------------------------------------------

function startScan() {
    // Fixed crystal angle mode
    if (measurementMode.value === "fixed") {

        startFixedAngleMeasurement();

        return;
    }

    if (!xrayOn) {

        scanStatus.textContent =
            "Turn X-Ray ON first";

        return;

    }


    if (scanning) {

        return;

    }

    // Clear previous measurement
    scanData = [];
    scanning = true;


    const range =
        getScanRange();


    currentAngle =
        range.start;


    scanStatus.textContent =
        "Scanning...";


    scanButton.textContent =
        "SCANNING";


    scanStep();

}


// --------------------------------------------
// SCAN STEP
// --------------------------------------------

function scanStep() {

    if (!scanning) {

        return;

    }


    const range =
        getScanRange();


    const intensity =
        calculateIntensity(
            currentAngle
        );
    // Store the measured point
    scanData.push({
        angle: currentAngle,
        intensity: intensity
    });


    angleReadout.textContent =
        currentAngle.toFixed(1)
        + "°";


    intensityReadout.textContent =
        Math.round(
            intensity
        );


    // Move detector according to
    // the 1:2 coupling

    updateDetectorPosition();


    drawSpectrum();


    currentAngle +=
        STEP_SIZE;


    if (
        currentAngle >
        range.end
    ) {

        currentAngle =
            range.end;


        scanning = false;


        scanButton.textContent =
            "START SCAN";
        detector.style.transform =
            "rotate(0deg)";

        scanStatus.textContent =
            "Scan complete";


        drawSpectrum();

        return;

    }


    // Fast virtual scan.
    //
    // The real experiment uses
    // a 2 s gate time and 0.1°
    // angle step. We do not wait
    // 2 real seconds per point,
    // otherwise a complete scan
    // would take many minutes.


    scanTimer =
        setTimeout(
            scanStep,
            25
        );

}


// --------------------------------------------
// POWER BUTTON
// --------------------------------------------

xrayPowerButton.addEventListener(
    "click",
    function () {

        xrayOn =
            !xrayOn;


        if (xrayOn) {

            xrayPowerButton.textContent =
                "X-RAY ON";

            xrayPowerButton.classList.add(
                "on"
            );

            xrayStatus.textContent =
                "X-Ray ON";

        }
        else {

            xrayPowerButton.textContent =
                "X-RAY OFF";

            xrayPowerButton.classList.remove(
                "on"
            );

            xrayStatus.textContent =
                "X-Ray OFF";


            scanning = false;


            if (scanTimer !== null) {

                clearTimeout(
                    scanTimer
                );

            }


            scanButton.textContent =
                "START SCAN";

            scanStatus.textContent =
                "Ready";
            detector.style.transform =
                "rotate(0deg)";

        }

    }
);


// --------------------------------------------
// VOLTAGE
// --------------------------------------------

anodeVoltage.addEventListener(
    "input",
    function () {

        voltageValue.textContent =
            anodeVoltage.value;


        drawSpectrum();

    }
);


// --------------------------------------------
// CURRENT
// --------------------------------------------

anodeCurrent.addEventListener(
    "input",
    function () {

        currentValue.textContent =
            Number(
                anodeCurrent.value
            ).toFixed(1);


        drawSpectrum();

    }
);


// --------------------------------------------
// CRYSTAL
// --------------------------------------------

crystalSelect.addEventListener(
    "change",
    function () {

        drawSpectrum();


        const range =
            getScanRange();


        currentAngle =
            range.start;


        angleReadout.textContent =
            range.start.toFixed(1)
            + "°";

    }
);


// --------------------------------------------
// SCAN BUTTON
// --------------------------------------------

scanButton.addEventListener(
    "click",
    startScan
);


// --------------------------------------------
// RESET
// --------------------------------------------

resetButton.addEventListener(
    "click",
    function () {

        scanning = false;


        if (scanTimer !== null) {

            clearTimeout(
                scanTimer
            );

        }


        xrayOn = false;


        xrayPowerButton.textContent =
            "X-RAY OFF";

        xrayPowerButton.classList.remove(
            "on"
        );


        xrayStatus.textContent =
            "X-Ray OFF";


        scanStatus.textContent =
            "Ready";


        anodeVoltage.value =
            35;


        anodeCurrent.value =
            1.0;


        crystalSelect.value =
            "LiF";


        voltageValue.textContent =
            "35";


        currentValue.textContent =
            "1.0";


        const range =
            getScanRange();


        currentAngle =
            range.start;


        angleReadout.textContent =
            range.start.toFixed(1)
            + "°";


        intensityReadout.textContent =
            "0";


        scanButton.textContent =
            "START SCAN";


        drawSpectrum();

    }
);


// --------------------------------------------
// WINDOW RESIZE
// --------------------------------------------

window.addEventListener(
    "resize",
    resizeCanvas
);


// --------------------------------------------
// INITIALIZE
// --------------------------------------------

resizeCanvas();
updateMeasurementMode();
updateDetectorPosition();