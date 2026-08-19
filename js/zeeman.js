/* =========================================================
   PHYWE ZEEMAN EFFECT SIMULATION

   STEP 1 — Cd LAMP
   STEP 2 — ELECTROMAGNET / MAGNETIC FIELD
   STEP 3 — NORMAL / ANOMALOUS LINE
   STEP 4 — FABRY-PEROT INTERFERENCE RINGS
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {


    /* =====================================================
       ELEMENTS
       ===================================================== */

    const lampButton =
        document.getElementById("lampButton");

    const lampStatus =
        document.getElementById("lampStatus");

    const lampIndicator =
        document.getElementById(
            "setupLampIndicator"
        );

    const spectrumStatus =
        document.getElementById(
            "spectrumStatus"
        );


    const currentSlider =
        document.getElementById(
            "currentSlider"
        );

    const currentValue =
        document.getElementById(
            "currentValue"
        );

    const fieldDisplay =
        document.getElementById(
            "fieldDisplay"
        );

    const fieldControlValue =
        document.getElementById(
            "fieldControlValue"
        );

    const fieldStatus =
        document.getElementById(
            "fieldStatus"
        );

    const magnetIndicator =
        document.getElementById(
            "setupMagnetIndicator"
        );

    const observationField =
        document.getElementById(
            "observationField"
        );


    const zeemanMode =
        document.getElementById(
            "zeemanMode"
        );

    const selectedLine =
        document.getElementById(
            "selectedLine"
        );

    const effectType =
        document.getElementById(
            "effectType"
        );

    const wavelengthValue =
        document.getElementById(
            "wavelengthValue"
        );

    const componentCount =
        document.getElementById(
            "componentCount"
        );


    /* =====================================================
       FABRY-PEROT ELEMENTS
       ===================================================== */

    const fabryPerotMode =
        document.getElementById(
            "fabryPerotMode"
        );

    const canvas =
        document.getElementById(
            "spectrumCanvas"
        );

    const ctx =
        canvas.getContext("2d");

    /* =====================================================
       FRINGE MEASUREMENT ELEMENTS
       ===================================================== */

    const measuredRing =
        document.getElementById(
            "measuredRing"
        );

    const measuredRadius =
        document.getElementById(
            "measuredRadius"
        );

    const measuredRadiusSquared =
        document.getElementById(
            "measuredRadiusSquared"
        );

    const clearMeasurement =
        document.getElementById(
            "clearMeasurement"
        );
    const deltaLambdaValue =
        document.getElementById(
            "deltaLambdaValue"
        );
    /* =====================================================
       CONSTANTS
       ===================================================== */

    const MAGNET_FIELD_PER_AMP = 0.10;


    /* =====================================================
       STATE
       ===================================================== */

    let lampOn = false;

    let magnetCurrent =
        parseFloat(
            currentSlider.value
        ) || 0;

    let magneticField = 0;

    let currentZeemanMode =
        zeemanMode.value;
    function getFringeColor(alpha) {

        if (currentZeemanMode === "normal") {
            return `rgba(255, 50, 40, ${alpha})`;
        }

        return `rgba(50, 255, 100, ${alpha})`;
    }


    /* =====================================================
       SPECTRAL LINES
       ===================================================== */

    const spectralLines = {

        normal: {
            wavelength: 643.847,
            name: "Normal",
            components: 3
        },

        anomalous: {
            wavelength: 508.5,
            name: "Anomalous",
            components: 9
        }

    };
    /* =====================================================
       MAGNETIC FIELD
       ===================================================== */

    function calculateMagneticField(current) {

        return current *
            MAGNET_FIELD_PER_AMP;

    }


    function updateMagnet() {

        magnetCurrent =
            parseFloat(
                currentSlider.value
            ) || 0;


        magneticField =
            calculateMagneticField(
                magnetCurrent
            );


        currentValue.textContent =
            magnetCurrent.toFixed(1);


        fieldDisplay.textContent =
            magneticField.toFixed(3);


        fieldControlValue.textContent =
            magneticField.toFixed(3);


        if (observationField) {

            observationField.textContent =
                magneticField.toFixed(3);

        }


        if (magnetCurrent > 0) {

            fieldStatus.textContent =
                "ON";

            magnetIndicator.classList.add(
                "active"
            );

        } else {

            fieldStatus.textContent =
                "OFF";

            magnetIndicator.classList.remove(
                "active"
            );

        }


        window.zeemanMagneticField =
            magneticField;

        window.zeemanMagnetCurrent =
            magnetCurrent;


        drawSpectrum();

    }


    /* =====================================================
       LAMP
       ===================================================== */

    function updateLamp() {

        if (lampOn) {

            lampButton.textContent =
                "LAMP ON";

            lampButton.classList.add(
                "on"
            );

            lampStatus.textContent =
                "ON";

            lampIndicator.classList.add(
                "active"
            );

            if (spectrumStatus) {

                spectrumStatus.textContent =
                    "Cd lamp ON — optical signal available.";

            }

        } else {

            lampButton.textContent =
                "LAMP OFF";

            lampButton.classList.remove(
                "on"
            );

            lampStatus.textContent =
                "OFF";

            lampIndicator.classList.remove(
                "active"
            );

            if (spectrumStatus) {

                spectrumStatus.textContent =
                    "Lamp OFF";

            }

        }


        drawSpectrum();

    }


    /* =====================================================
       ZEEMAN MODE
       ===================================================== */

    function updateZeemanMode() {

        currentZeemanMode =
            zeemanMode.value;


        const line =
            spectralLines[
            currentZeemanMode
            ];


        selectedLine.textContent =
            line.wavelength.toFixed(1) +
            " nm";


        wavelengthValue.textContent =
            line.wavelength.toFixed(1) +
            " nm";


        effectType.textContent =
            line.name;


        componentCount.textContent =
            line.components;


        window.zeemanMode =
            currentZeemanMode;

        window.zeemanWavelength =
            line.wavelength;

        window.zeemanComponents =
            line.components;


        if (spectrumStatus) {

            if (
                currentZeemanMode ===
                "normal"
            ) {

                spectrumStatus.textContent =
                    "Normal Zeeman Effect selected — Cd 643.8 nm.";

            } else {

                spectrumStatus.textContent =
                    "Anomalous Zeeman Effect selected — Cd 508.6 nm.";

            }

        }


        drawSpectrum();

    }


    /* =====================================================
       FABRY-PEROT STATE
       ===================================================== */

    function isFabryPerotOn() {

        return (
            fabryPerotMode.value === "on"
        );

    }

    function drawSpectrum() {

        if (!canvas || !ctx) {
            return;
        }

        const width = canvas.width;
        const height = canvas.height;

        /* =====================================================
           CLEAR CCD
           ===================================================== */

        ctx.clearRect(0, 0, width, height);

        ctx.fillStyle = "#02070b";

        ctx.fillRect(
            0,
            0,
            width,
            height
        );


        /* =====================================================
           CHECK LAMP
           ===================================================== */

        if (!lampOn) {

            ctx.fillStyle = "#607383";

            ctx.font = "18px Arial";

            ctx.textAlign = "center";

            ctx.fillText(
                "Cd Lamp OFF",
                width / 2,
                height / 2
            );

            return;
        }


        /* =====================================================
           CHECK FABRY-PEROT
           ===================================================== */

        if (!isFabryPerotOn()) {

            ctx.fillStyle = "#607383";

            ctx.font = "18px Arial";

            ctx.textAlign = "center";

            ctx.fillText(
                "Fabry–Perot OFF",
                width / 2,
                height / 2
            );

            return;
        }


        /* =====================================================
           COMMON CENTRE
           ===================================================== */

        const centerX =
            width / 2;

        const centerY =
            height / 2;


        /* =====================================================
           SELECTED WAVELENGTH
           ===================================================== */

        const wavelength =
            spectralLines[
                currentZeemanMode
            ].wavelength;


        const wavelengthMeters =
            wavelength * 1e-9;


        /* =====================================================
           FABRY-PEROT BASE RING SPACING
           ===================================================== */

        const wavelengthFactor =
            wavelength / 643.847;


        const ringSpacing =
            34 * wavelengthFactor;


        /* =====================================================
           ZEEMAN PHYSICS
    
           Δν = μB B / h
    
           Δλ = μB λ² B / hc
    
           ===================================================== */

        const muB =
            9.2740100783e-24;
        const bohrMagnetonValue =
            document.getElementById(
                "bohrMagnetonValue"
            );

        const h =
            6.62607015e-34;

        const c =
            299792458;


        const deltaNu =
            (muB * magneticField) / h;
        if (bohrMagnetonValue) {

            bohrMagnetonValue.textContent =
                muB.toExponential(4) +
                " J/T";

        }


        const deltaLambda =
            (muB *
                wavelengthMeters *
                wavelengthMeters *
                magneticField)
            / (h * c);


        const deltaLambdaNm =
            deltaLambda * 1e9;


        /* =====================================================
           SAVE PHYSICAL RESULTS
    
           These will be used later by the calculation section.
           ===================================================== */

        window.zeemanDeltaNu =
            deltaNu;

        window.zeemanDeltaLambda =
            deltaLambdaNm;

        if (deltaLambdaValue) {

            deltaLambdaValue.textContent =
                deltaLambdaNm.toExponential(3) +
                " nm";

        }
        /* =====================================================
           CONVERT WAVELENGTH SHIFT TO RING-RADIUS SHIFT
    
           The real shift is extremely small, so we enlarge
           only the visual displacement.
    
           IMPORTANT:
           All components remain concentric.
           ===================================================== */

        const visualScale =
            900000;


        const radiusShift =
            deltaLambdaNm *
            visualScale;


        /* =====================================================
           COMPONENT RADIUS POSITIONS
           ===================================================== */

        let componentOffsets = [];


        /* =====================================================
           ZERO FIELD
    
           One unsplit ring system.
           ===================================================== */

        if (magneticField <= 0.000001) {

            componentOffsets = [0];

        }


        /* =====================================================
           NORMAL ZEEMAN
    
           Three components:
    
                  σ−   π   σ+
    
           All remain concentric.
           ===================================================== */

        else if (
            currentZeemanMode === "normal"
        ) {

            componentOffsets = [

                -radiusShift,

                0,

                radiusShift

            ];

        }


        /* =====================================================
           ANOMALOUS ZEEMAN
    
           Nine components represented as three groups
           of three closely spaced components.
    
           The important visual feature is radial splitting,
           not sideways displacement.
           ===================================================== */

        else {

            const group =
                radiusShift * 3;

            const fine =
                radiusShift * 0.45;


            componentOffsets = [

                -group - fine,
                -group,
                -group + fine,

                -fine,
                0,
                fine,

                group - fine,
                group,
                group + fine

            ];

        }


        /* =====================================================
           DRAW COMPONENT RINGS
           ===================================================== */

        componentOffsets.forEach(
            function (offset, index) {

                /*
                 * Base ring radius.
                 */

                let ringNumber = 1;


                const maxRadius =
                    Math.min(
                        width,
                        height
                    ) * 0.45;


                while (
                    ringNumber * ringSpacing
                    < maxRadius
                ) {

                    /*
                     * Convert component spectral shift
                     * into a small radial change.
                     */

                    const radius =
                        ringNumber *
                        ringSpacing +
                        offset *
                        (ringNumber * 0.035);


                    if (radius <= 0) {

                        ringNumber++;

                        continue;

                    }


                    /* -----------------------------------------
                       INTENSITY
                       ----------------------------------------- */

                    let alpha =
                        0.70 -
                        ringNumber * 0.035;


                    alpha =
                        Math.max(
                            0.10,
                            alpha
                        );


                    /* Slightly distinguish components */

                    if (
                        currentZeemanMode === "normal"
                    ) {

                        if (index === 1) {

                            alpha *= 1.15;

                        }

                    }


                    /* -----------------------------------------
                       RING
                       ----------------------------------------- */

                    ctx.beginPath();

                    ctx.arc(
                        centerX,
                        centerY,
                        radius,
                        0,
                        Math.PI * 2
                    );


                    ctx.lineWidth = 2;


                    /* =========================================
   ZEEMAN FRINGE COLOUR
   Normal     → Red
   Anomalous  → Green
   ========================================= */

                    let fringeColor;

                    if (currentZeemanMode === "normal") {

                        fringeColor = `rgba(255, 60, 40, ${alpha})`;

                    } else {

                        fringeColor = `rgba(60, 255, 120, ${alpha})`;

                    }

                    ctx.strokeStyle = fringeColor;


                    ctx.stroke();


                    ringNumber++;

                }

            }
        );


        /* =====================================================
           CENTRAL REFERENCE
           ===================================================== */

        ctx.beginPath();

        ctx.arc(
            centerX,
            centerY,
            3,
            0,
            Math.PI * 2
        );


        if (currentZeemanMode === "normal") {

            ctx.fillStyle =
                "rgba(255, 80, 60, 0.95)";

        } else {

            ctx.fillStyle =
                "rgba(80, 255, 130, 0.95)";

        }

        ctx.fill();


        /* =====================================================
           LABELS
           ===================================================== */

        ctx.fillStyle =
            "rgba(180,205,220,0.85)";

        ctx.font =
            "14px Arial";


        ctx.textAlign =
            "left";


        ctx.fillText(
            currentZeemanMode === "normal"
                ? "Normal Zeeman Effect"
                : "Anomalous Zeeman Effect",
            18,
            25
        );


        ctx.fillText(
            wavelength.toFixed(3) +
            " nm",
            18,
            45
        );


        /* =====================================================
           FIELD
           ===================================================== */

        ctx.textAlign =
            "right";


        ctx.fillText(
            "B = " +
            magneticField.toFixed(3) +
            " T",
            width - 18,
            25
        );


        /* =====================================================
           WAVE-NUMBER SPLITTING
           ===================================================== */

        const deltaWaveNumber =
            deltaNu / c;


        ctx.fillText(
            "Δν̄ = " +
            deltaWaveNumber.toExponential(3) +
            " m⁻¹",
            width - 18,
            45
        );

    }
    /* =====================================================
       FABRY-PEROT CHANGE
       ===================================================== */

    fabryPerotMode.addEventListener(
        "change",
        function () {

            drawSpectrum();

        }
    );


    /* =====================================================
       EVENT LISTENERS
       ===================================================== */

    lampButton.addEventListener(
        "click",
        function () {

            lampOn =
                !lampOn;

            updateLamp();

        }
    );


    currentSlider.addEventListener(
        "input",
        function () {

            updateMagnet();

        }
    );


    zeemanMode.addEventListener(
        "change",
        function () {

            updateZeemanMode();

        }
    );
    /* =====================================================
       FRINGE MEASUREMENT
       ===================================================== */

    canvas.addEventListener(
        "click",
        function (event) {

            /* Lamp must be ON */

            if (!lampOn) {
                return;
            }


            /* Fabry–Perot must be ON */

            if (!isFabryPerotOn()) {
                return;
            }


            /* ---------------------------------------------
               Mouse position relative to canvas
               --------------------------------------------- */

            const rect =
                canvas.getBoundingClientRect();


            const x =
                (event.clientX - rect.left) *
                (canvas.width / rect.width);


            const y =
                (event.clientY - rect.top) *
                (canvas.height / rect.height);


            /* ---------------------------------------------
               Centre of Fabry–Perot pattern
               --------------------------------------------- */

            const centerX =
                canvas.width / 2;

            const centerY =
                canvas.height / 2;


            /* ---------------------------------------------
               Distance from centre
               --------------------------------------------- */

            const radiusPixels =
                Math.sqrt(
                    Math.pow(
                        x - centerX,
                        2
                    ) +
                    Math.pow(
                        y - centerY,
                        2
                    )
                );


            /* ---------------------------------------------
               Ring spacing
               --------------------------------------------- */

            const wavelength =
                spectralLines[
                    currentZeemanMode
                ].wavelength;


            const wavelengthFactor =
                wavelength / 643.847;


            const ringSpacing =
                34 * wavelengthFactor;


            /* ---------------------------------------------
               Find nearest ring
               --------------------------------------------- */

            const ringNumber =
                Math.max(
                    1,
                    Math.round(
                        radiusPixels /
                        ringSpacing
                    )
                );


            const ringRadius =
                ringNumber *
                ringSpacing;


            const radiusSquared =
                ringRadius *
                ringRadius;


            /* ---------------------------------------------
               DISPLAY
               --------------------------------------------- */

            measuredRing.textContent =
                ringNumber;


            measuredRadius.textContent =
                ringRadius.toFixed(2) +
                " px";


            measuredRadiusSquared.textContent =
                radiusSquared.toFixed(2) +
                " px²";


            /* ---------------------------------------------
               EXISTING MEASUREMENT CARD
    
               We also use your existing
               Ring / Line Position field.
               --------------------------------------------- */

            const ringPosition =
                document.getElementById(
                    "ringPositionValue"
                );


            if (ringPosition) {

                ringPosition.textContent =
                    "Ring " +
                    ringNumber +
                    " : " +
                    ringRadius.toFixed(2) +
                    " px";

            }


            /* ---------------------------------------------
               SAVE MEASUREMENT
               --------------------------------------------- */

            window.selectedZeemanRing = {

                ringNumber:
                    ringNumber,

                radius:
                    ringRadius,

                radiusSquared:
                    radiusSquared

            };


            /* ---------------------------------------------
               STATUS MESSAGE
               --------------------------------------------- */

            const measurementStatus =
                document.getElementById(
                    "measurementStatus"
                );


            if (measurementStatus) {

                measurementStatus.textContent =
                    "Ring " +
                    ringNumber +
                    " selected. Radius = " +
                    ringRadius.toFixed(2) +
                    " px.";

            }

        }
    );


    /* =====================================================
       CLEAR FRINGE MEASUREMENT
       ===================================================== */

    clearMeasurement.addEventListener(
        "click",
        function () {

            measuredRing.textContent =
                "--";

            measuredRadius.textContent =
                "--";

            measuredRadiusSquared.textContent =
                "--";


            const ringPosition =
                document.getElementById(
                    "ringPositionValue"
                );


            if (ringPosition) {

                ringPosition.textContent =
                    "--";

            }


            window.selectedZeemanRing =
                null;


            const measurementStatus =
                document.getElementById(
                    "measurementStatus"
                );


            if (measurementStatus) {

                measurementStatus.textContent =
                    "Click on a fringe to measure its radius.";

            }

        }
    );

    /* =====================================================
       INITIALIZATION
       ===================================================== */

    updateLamp();

    updateMagnet();

    updateZeemanMode();

    drawSpectrum();

});