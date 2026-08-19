/* =========================================================
   MAGNETOSTRICTION — MICHELSON INTERFEROMETER
   Visual Version
   ========================================================= */

const canvas = document.getElementById("fringeCanvas");
const ctx = canvas.getContext("2d");

const laserButton = document.getElementById("laserButton");
const laserStatus = document.getElementById("laserStatus");

const currentSlider = document.getElementById("currentSlider");
const currentValue = document.getElementById("currentValue");

const materialSelect = document.getElementById("materialSelect");

const fieldValue = document.getElementById("fieldValue");
const materialValue = document.getElementById("materialValue");

const fringeCount = document.getElementById("fringeCount");
const lengthChange = document.getElementById("lengthChange");
const magnetostrictionValue =
    document.getElementById("magnetostrictionValue");

const fringeMessage =
    document.getElementById("fringeMessage");

const measurementMessage =
    document.getElementById("measurementMessage");


/* =========================================================
   PHYSICAL PARAMETERS
   ========================================================= */

const wavelength = 632.8e-9;

const specimenLength = 0.050;

/*
   Illustrative field relation:

        B = kI

   This is a simulation value, not PHYWE calibration.
*/
const FIELD_PER_AMP = 0.20;


/*
   Illustrative material responses.

   Iron   : positive magnetostriction
   Nickel : negative magnetostriction
   Copper : zero
*/

const materials = {

    iron: {
        name: "Iron",
        saturation: 20e-6,
        fieldScale: 0.45,
        direction: 1
    },

    nickel: {
        name: "Nickel",
        saturation: -30e-6,
        fieldScale: 0.55,
        direction: -1
    },

    copper: {
        name: "Copper — No Magnetostriction",
        saturation: 0,
        fieldScale: 1,
        direction: 0
    }

};


/* =========================================================
   STATE
   ========================================================= */

let laserOn = false;

let current = 0;

let selectedMaterial = "iron";


/*
   Visual displacement.

   This is deliberately exaggerated compared with
   the real specimen displacement so that students
   can SEE the effect on screen.
*/

let visualDisplacement = 0;

let targetDisplacement = 0;


/* =========================================================
   LASER
   ========================================================= */

laserButton.addEventListener("click", function () {

    laserOn = !laserOn;

    updateLaser();

    updateSimulation();

});


function updateLaser() {

    if (laserOn) {

        laserButton.textContent = "LASER ON";

        laserButton.classList.add("on");

        laserStatus.textContent = "LASER ON";

        laserStatus.classList.add("on");

        fringeMessage.textContent =
            "Laser ON — Michelson interference fringes are visible.";

    }

    else {

        laserButton.textContent = "LASER OFF";

        laserButton.classList.remove("on");

        laserStatus.textContent = "LASER OFF";

        laserStatus.classList.remove("on");

        fringeMessage.textContent =
            "Turn ON the laser to observe interference fringes.";

    }

}


/* =========================================================
   CURRENT
   ========================================================= */

currentSlider.addEventListener("input", function () {

    current = parseFloat(currentSlider.value);

    updateSimulation();

});


/* =========================================================
   MATERIAL
   ========================================================= */

materialSelect.addEventListener("change", function () {

    selectedMaterial = materialSelect.value;

    updateSimulation();

});


/* =========================================================
   MAGNETIC FIELD
   ========================================================= */

function calculateField() {

    return current * FIELD_PER_AMP;

}


/* =========================================================
   MAGNETOSTRICTION
   ========================================================= */

function calculateMagnetostriction(field) {

    const material = materials[selectedMaterial];

    if (material.saturation === 0) {

        return 0;

    }

    const B0 = material.fieldScale;

    return material.saturation *
        Math.tanh(field / B0);

}


/* =========================================================
   LENGTH CHANGE
   ========================================================= */

function calculateLengthChange(magnetostriction) {

    return magnetostriction * specimenLength;

}


/* =========================================================
   FRINGE COUNT
   ========================================================= */

function calculateFringeCount(deltaL) {

    /*
        Michelson:

            Nλ = 2ΔL

        Therefore:

            N = 2ΔL / λ
    */

    return Math.abs(
        (2 * deltaL) / wavelength
    );

}


/* =========================================================
   VISUAL DISPLACEMENT
   ========================================================= */

function calculateVisualDisplacement() {

    const field = calculateField();

    const magnetostriction =
        calculateMagnetostriction(field);


    /*
       Use a deliberately enlarged scale.

       Real magnetostrictive displacement is extremely small,
       so direct pixel representation would not be visible.
    */

    const normalized =
        magnetostriction / 30e-6;


    /*
       Maximum visual displacement is about 45 pixels.
    */

    return normalized * 45;

}


/* =========================================================
   UPDATE TARGET
   ========================================================= */

function updateTargetDisplacement() {

    targetDisplacement =
        calculateVisualDisplacement();

}


/* =========================================================
   UPDATE DISPLAY
   ========================================================= */

function updateSimulation() {

    const field =
        calculateField();


    const magnetostriction =
        calculateMagnetostriction(field);


    const deltaL =
        calculateLengthChange(
            magnetostriction
        );


    const N =
        calculateFringeCount(deltaL);


    updateTargetDisplacement();


    /* Current */

    currentValue.textContent =
        current.toFixed(2) + " A";


    /* Field */

    fieldValue.textContent =
        field.toFixed(3);


    /* Material */

    materialValue.textContent =
        materials[selectedMaterial].name;


    /* Fringe count */

    fringeCount.textContent =
        N.toFixed(2);


    /* Length change */

    lengthChange.textContent =
        (deltaL * 1e9).toFixed(3)
        + " nm";


    /* Magnetostriction */

    magnetostrictionValue.textContent =
        (magnetostriction * 1e6).toFixed(2)
        + " × 10⁻⁶";


    /* Student message */

    if (!laserOn) {

        measurementMessage.textContent =
            "Turn ON the laser to observe the interference pattern.";

    }

    else if (
        selectedMaterial === "copper"
    ) {

        measurementMessage.textContent =
            "Copper is the control sample — no magnetostrictive fringe displacement.";

    }

    else if (current === 0) {

        measurementMessage.textContent =
            "Increase the current to produce a magnetic field.";

    }

    else if (
        selectedMaterial === "iron"
    ) {

        measurementMessage.textContent =
            "Iron expands along the magnetostrictive direction. The fringes move outward.";

    }

    else if (
        selectedMaterial === "nickel"
    ) {

        measurementMessage.textContent =
            "Nickel contracts along the magnetostrictive direction. The fringes move inward.";

    }

}


/* =========================================================
   DRAW FRINGES
   ========================================================= */

function drawFringes() {

    const width = canvas.width;

    const height = canvas.height;


    /* Clear */

    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    /* Background */

    ctx.fillStyle = "#020617";

    ctx.fillRect(
        0,
        0,
        width,
        height
    );


    /* Laser OFF */

    if (!laserOn) {

        ctx.fillStyle = "#64748b";

        ctx.font = "18px Arial";

        ctx.textAlign = "center";

        ctx.fillText(
            "LASER OFF",
            width / 2,
            height / 2
        );

        return;

    }


    /*
       Centre of Michelson pattern
    */

    const cx = width / 2;

    const cy = height / 2;


    /*
       Smooth visual displacement
    */

    visualDisplacement +=
        (
            targetDisplacement -
            visualDisplacement
        ) * 0.08;


    /*
       Direction is already included
       in visualDisplacement.
    */


    /*
       Reference circle.

       This DOES NOT move.

       It gives students a fixed reference
       against which the fringe movement
       can be seen.
    */

    const referenceRadius = 110;


    ctx.beginPath();

    ctx.arc(
        cx,
        cy,
        referenceRadius,
        0,
        2 * Math.PI
    );

    ctx.strokeStyle =
        "rgba(255,255,255,0.22)";

    ctx.lineWidth = 2;

    ctx.setLineDash([6, 6]);

    ctx.stroke();

    ctx.setLineDash([]);


    /*
       Draw moving interference rings.
    */

    const baseSpacing = 32;

    const maximumRadius =
        Math.min(
            width,
            height
        ) * 0.70;


    /*
       For the simulation we use the
       visual displacement to change the
       radius of each ring.

       This makes expansion/contraction
       immediately visible.
    */

    for (
        let ring = 1;
        ring <= 9;
        ring++
    ) {

        const originalRadius =
            ring * baseSpacing;


        let radius;


        if (
            selectedMaterial === "copper"
        ) {

            /*
               Copper:
               completely stationary.
            */

            radius =
                originalRadius;

        }

        else {

            /*
               Iron:
               radius increases.

               Nickel:
               radius decreases.
            */

            radius =
                originalRadius
                +
                visualDisplacement *
                (
                    ring / 6
                );

        }


        /*
           Keep rings inside canvas.
        */

        if (
            radius > maximumRadius
        ) {

            continue;

        }


        /*
           Brightness pattern.
        */

        const brightness =
            0.35 +
            (
                Math.sin(
                    ring * 1.7
                ) + 1
            ) * 0.25;


        ctx.beginPath();

        ctx.arc(
            cx,
            cy,
            radius,
            0,
            2 * Math.PI
        );


        ctx.strokeStyle =
            `rgba(220,240,255,${brightness})`;

        ctx.lineWidth = 2;

        ctx.stroke();

    }


    /*
       Central bright spot.
    */

    ctx.beginPath();

    ctx.arc(
        cx,
        cy,
        5,
        0,
        2 * Math.PI
    );

    ctx.fillStyle = "#ffffff";

    ctx.fill();


    /* =====================================================
       FIXED REFERENCE MARKER
       ===================================================== */

    const markerX =
        cx + referenceRadius;

    const markerY =
        cy;


    ctx.beginPath();

    ctx.moveTo(
        markerX - 7,
        markerY
    );

    ctx.lineTo(
        markerX + 7,
        markerY
    );

    ctx.strokeStyle =
        "#facc15";

    ctx.lineWidth = 3;

    ctx.stroke();


    ctx.beginPath();

    ctx.moveTo(
        markerX,
        markerY - 7
    );

    ctx.lineTo(
        markerX,
        markerY + 7
    );

    ctx.stroke();


    /*
       Reference label
    */

    ctx.font = "11px Arial";

    ctx.fillStyle = "#facc15";

    ctx.textAlign = "left";

    ctx.fillText(
        "Reference",
        markerX + 10,
        markerY + 4
    );


    /* =====================================================
       INFORMATION
       ===================================================== */

    const field =
        calculateField();


    const magnetostriction =
        calculateMagnetostriction(field);


    const deltaL =
        calculateLengthChange(
            magnetostriction
        );


    const N =
        calculateFringeCount(deltaL);


    /*
       Material
    */

    ctx.textAlign = "left";

    ctx.font = "13px Arial";

    ctx.fillStyle = "#cbd5e1";

    ctx.fillText(
        materials[selectedMaterial].name,
        15,
        22
    );


    /*
       Current
    */

    ctx.fillText(
        "Current = "
        + current.toFixed(2)
        + " A",
        15,
        42
    );


    /*
       Field
    */

    ctx.fillText(
        "B = "
        + field.toFixed(3)
        + " T",
        15,
        62
    );


    /*
       Right side
    */

    ctx.textAlign = "right";

    ctx.fillText(
        "N = "
        + N.toFixed(2),
        width - 15,
        22
    );


    ctx.fillText(
        "λm = "
        +
        (
            magnetostriction *
            1e6
        ).toFixed(2)
        +
        " × 10⁻⁶",
        width - 15,
        42
    );


    /* =====================================================
       LARGE MATERIAL INDICATOR
       ===================================================== */

    ctx.textAlign = "center";

    ctx.font = "bold 16px Arial";


    if (
        selectedMaterial === "iron"
        &&
        current > 0
    ) {

        ctx.fillStyle = "#4ade80";

        ctx.fillText(
            "IRON — FRINGES MOVING OUTWARD",
            cx,
            height - 38
        );

    }

    else if (
        selectedMaterial === "nickel"
        &&
        current > 0
    ) {

        ctx.fillStyle = "#60a5fa";

        ctx.fillText(
            "NICKEL — FRINGES MOVING INWARD",
            cx,
            height - 38
        );

    }

    else if (
        selectedMaterial === "copper"
        &&
        current > 0
    ) {

        ctx.fillStyle = "#facc15";

        ctx.fillText(
            "COPPER — NO FRINGE MOVEMENT",
            cx,
            height - 38
        );

    }

    else {

        ctx.fillStyle = "#94a3b8";

        ctx.fillText(
            "Increase current to observe fringe displacement",
            cx,
            height - 38
        );

    }

}


/* =========================================================
   ANIMATION
   ========================================================= */

function animate() {

    drawFringes();

    requestAnimationFrame(
        animate
    );

}


/* =========================================================
   INITIALISE
   ========================================================= */

updateLaser();

updateSimulation();

animate();
/* =========================================================
   MEASUREMENT INTERACTION
   ========================================================= */

const countFringeButton =
    document.getElementById("countFringeButton");

const calculateButton =
    document.getElementById("calculateButton");

const resetMeasurementButton =
    document.getElementById("resetMeasurementButton");

const measurementNote =
    document.getElementById("measurementNote");


let measuredFringes = 0;


/* =========================================================
   COUNT FRINGE
   ========================================================= */

countFringeButton.addEventListener(
    "click",
    function () {

        if (!laserOn) {

            measurementNote.textContent =
                "Turn ON the laser before counting fringes.";

            return;

        }


        if (current === 0) {

            measurementNote.textContent =
                "Increase the current before counting fringes.";

            return;

        }


        /*
           Use the simulated physical fringe count.
        */

        const field =
            calculateField();

        const magnetostriction =
            calculateMagnetostriction(field);

        const deltaL =
            calculateLengthChange(
                magnetostriction
            );

        measuredFringes =
            calculateFringeCount(deltaL);


        fringeCount.textContent =
            measuredFringes.toFixed(2);


        measurementNote.textContent =
            "Fringe count recorded: N = "
            +
            measuredFringes.toFixed(2)
            +
            ". Press CALCULATE to determine ΔL and magnetostriction.";

    }
);


/* =========================================================
   CALCULATE
   ========================================================= */

calculateButton.addEventListener(
    "click",
    function () {

        if (measuredFringes <= 0) {

            measurementNote.textContent =
                "First press COUNT FRINGE to record N.";

            return;

        }


        /*
           Michelson relation:

               ΔL = Nλ / 2
        */

        const calculatedDeltaL =
            (
                measuredFringes *
                wavelength
            ) / 2;


        /*
           Magnetostriction:

               λm = ΔL / L
        */

        const calculatedMagnetostriction =
            calculatedDeltaL /
            specimenLength;


        /*
           Display ΔL
        */

        lengthChange.textContent =
            (
                calculatedDeltaL *
                1e9
            ).toFixed(3)
            +
            " nm";


        /*
           Display magnetostriction
        */

        magnetostrictionValue.textContent =
            (
                calculatedMagnetostriction *
                1e6
            ).toFixed(2)
            +
            " × 10⁻⁶";


        measurementNote.textContent =
            "Calculation complete: ΔL = Nλ/2 and λm = ΔL/L.";

    }
);


/* =========================================================
   RESET MEASUREMENT
   ========================================================= */

resetMeasurementButton.addEventListener(
    "click",
    function () {

        measuredFringes = 0;

        fringeCount.textContent =
            "0";

        lengthChange.textContent =
            "0.000 nm";

        magnetostrictionValue.textContent =
            "0.00 × 10⁻⁶";


        measurementNote.textContent =
            "Measurement reset. Increase the current and observe the fringe movement.";

    }
);