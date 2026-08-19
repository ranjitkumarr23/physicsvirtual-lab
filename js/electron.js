const canvas = document.getElementById("diffractionCanvas");

const ctx = canvas.getContext("2d");

const powerButton = document.getElementById("powerButton");

const voltageSlider = document.getElementById("voltageSlider");

const voltageValue = document.getElementById("voltageValue");

const brightnessSlider = document.getElementById("brightnessSlider");

const resetButton = document.getElementById("resetButton");

const screenStatus = document.getElementById("screenStatus");

const readoutVoltage =
    document.getElementById("readoutVoltage");

const readoutWavelength =
    document.getElementById("readoutWavelength");

const readoutRing1 =
    document.getElementById("readoutRing1");

const readoutRing2 =
    document.getElementById("readoutRing2");


let powerOn = false;


// ============================================
// PHYWE / ELECTRON DIFFRACTION CONSTANTS
// ============================================

const PLANCK = 6.62607015e-34;

const ELECTRON_MASS = 9.1093837e-31;

const ELECTRON_CHARGE = 1.602176634e-19;


// Graphite lattice spacings

const D_GRAPHITE_1 = 123e-12;

const D_GRAPHITE_2 = 213e-12;


// Screen geometry

const SCREEN_DISTANCE = 0.130;

const SPHERE_DIAMETER = 0.100;


// ============================================
// ELECTRON WAVELENGTH
// ============================================

function calculateElectronWavelength(voltageKV) {

    const voltageV = voltageKV * 1000;

    if (voltageV <= 0) {

        return 0;

    }

    const wavelength =
        PLANCK /
        Math.sqrt(
            2 *
            ELECTRON_MASS *
            ELECTRON_CHARGE *
            voltageV
        );

    return wavelength;
}


// ============================================
// BRAGG ANGLE
// ============================================

function calculateBraggAngle(
    wavelength,
    latticeSpacing
) {

    const value =
        wavelength /
        (2 * latticeSpacing);


    if (value >= 1) {

        return 0;

    }


    return Math.asin(value);
}


// ============================================
// RING DIAMETER
// ============================================

function calculateRingDiameter(
    wavelength,
    latticeSpacing
) {

    const theta =
        calculateBraggAngle(
            wavelength,
            latticeSpacing
        );


    if (theta === 0) {

        return 0;

    }


    const diameter =
        2 *
        SCREEN_DISTANCE *
        Math.tan(2 * theta);


    return diameter;
}


// ============================================
// RESIZE CANVAS
// ============================================

function resizeCanvas() {

    const size = canvas.clientWidth;

    canvas.width = size;

    canvas.height = size;

    drawScreen();
}


// ============================================
// DRAW RING
// ============================================

function drawRing(
    centerX,
    centerY,
    radius,
    brightness
) {

    ctx.beginPath();

    ctx.arc(
        centerX,
        centerY,
        radius,
        0,
        Math.PI * 2
    );


    ctx.strokeStyle =
        `rgba(100, 255, 170, ${brightness * 0.8})`;


    ctx.lineWidth = 2;

    ctx.shadowBlur = 12;

    ctx.shadowColor = "#55ff99";

    ctx.stroke();

    ctx.shadowBlur = 0;
}


// ============================================
// PHYSICS READOUT
// ============================================

function updatePhysicsReadout() {

    const voltage =
        Number(voltageSlider.value);


    readoutVoltage.textContent =
        voltage.toFixed(2) + " kV";


    if (voltage <= 0) {

        readoutWavelength.textContent = "—";

        readoutRing1.textContent = "—";

        readoutRing2.textContent = "—";

        return;
    }


    // Electron wavelength

    const wavelength =
        calculateElectronWavelength(voltage);


    // Ring diameters

    const diameter1 =
        calculateRingDiameter(
            wavelength,
            D_GRAPHITE_1
        );


    const diameter2 =
        calculateRingDiameter(
            wavelength,
            D_GRAPHITE_2
        );


    // Convert wavelength to pm

    readoutWavelength.textContent =
        (wavelength * 1e12).toFixed(2) + " pm";


    // Convert diameter to mm

    readoutRing1.textContent =
        (diameter1 * 1000).toFixed(2) + " mm";


    readoutRing2.textContent =
        (diameter2 * 1000).toFixed(2) + " mm";
}


// ============================================
// DRAW CRT SCREEN
// ============================================

function drawScreen() {

    const width = canvas.width;

    const height = canvas.height;

    const centerX = width / 2;

    const centerY = height / 2;


    // Clear screen

    ctx.fillStyle = "#000";

    ctx.fillRect(
        0,
        0,
        width,
        height
    );


    // Power OFF

    if (!powerOn) {

        return;

    }


    const voltage =
        Number(voltageSlider.value);


    const brightness =
        Number(brightnessSlider.value) / 100;


    // ========================================
    // CENTER SPOT
    // ========================================

    ctx.beginPath();

    ctx.arc(
        centerX,
        centerY,
        3,
        0,
        Math.PI * 2
    );


    ctx.fillStyle =
        `rgba(120, 255, 180, ${brightness})`;


    ctx.shadowBlur = 15;

    ctx.shadowColor = "#55ff99";

    ctx.fill();

    ctx.shadowBlur = 0;


    // No rings at zero voltage

    if (voltage <= 0) {

        return;

    }


    // ========================================
    // PHYSICS-BASED RING DIAMETERS
    // ========================================

    const wavelength =
        calculateElectronWavelength(voltage);


    const diameter1 =
        calculateRingDiameter(
            wavelength,
            D_GRAPHITE_1
        );


    const diameter2 =
        calculateRingDiameter(
            wavelength,
            D_GRAPHITE_2
        );


    // Convert physical diameter
    // to screen pixels

    const ring1Radius =
        (diameter1 / SPHERE_DIAMETER)
        * (width / 2);


    const ring2Radius =
        (diameter2 / SPHERE_DIAMETER)
        * (width / 2);


    // ========================================
    // DRAW TWO DIFFRACTION RINGS
    // ========================================

    drawRing(
        centerX,
        centerY,
        ring1Radius,
        brightness
    );


    drawRing(
        centerX,
        centerY,
        ring2Radius,
        brightness
    );
}


// ============================================
// POWER BUTTON
// ============================================

powerButton.addEventListener(
    "click",
    function () {

        powerOn = !powerOn;


        if (powerOn) {

            powerButton.textContent = "ON";

            powerButton.classList.add("on");

            screenStatus.textContent =
                "Power ON";

        }
        else {

            powerButton.textContent = "OFF";

            powerButton.classList.remove("on");

            screenStatus.textContent =
                "Power OFF";

        }


        drawScreen();

    }
);


// ============================================
// VOLTAGE CONTROL
// ============================================

voltageSlider.addEventListener(
    "input",
    function () {

        voltageValue.textContent =
            Number(
                voltageSlider.value
            ).toFixed(1);


        updatePhysicsReadout();

        drawScreen();

    }
);


// ============================================
// BRIGHTNESS CONTROL
// ============================================

brightnessSlider.addEventListener(
    "input",
    function () {

        drawScreen();

    }
);


// ============================================
// RESET
// ============================================

resetButton.addEventListener(
    "click",
    function () {

        powerOn = false;

        voltageSlider.value = 0;

        brightnessSlider.value = 70;


        powerButton.textContent = "OFF";

        powerButton.classList.remove("on");


        voltageValue.textContent = "0.0";

        screenStatus.textContent =
            "Power OFF";


        updatePhysicsReadout();

        drawScreen();

    }
);


// ============================================
// WINDOW RESIZE
// ============================================

window.addEventListener(
    "resize",
    resizeCanvas
);


// ============================================
// START
// ============================================

resizeCanvas();

updatePhysicsReadout();