// =========================================
// SELECT ELEMENTS
// =========================================

const emailInput =
    document.getElementById('email');

const otpSection =
    document.getElementById('otpSection');

const otpInput =
    document.getElementById('otpInput');

const newPinSection =
    document.getElementById('newPinSection');

const newPinInput =
    document.getElementById('newPin');

const toggleNewPin =
    document.getElementById('toggleNewPin');

const formErrorSummary =
    document.getElementById('formErrorSummary');

const mainActionBtn =
    document.getElementById('mainActionBtn');


// =========================================
// FLOW STATE
// =========================================

let currentStep = "sendOtp";


// =========================================
// ALLOW ONLY DIGITS
// =========================================

function allowOnlyDigits(e) {

    e.target.value =
        e.target.value.replace(/\D/g, '');
}


// =========================================
// APPLY DIGIT VALIDATION
// =========================================

otpInput.addEventListener(
    'input',
    allowOnlyDigits
);

newPinInput.addEventListener(
    'input',
    allowOnlyDigits
);


// =========================================
// TOGGLE PIN VISIBILITY
// =========================================

toggleNewPin.addEventListener(
    'click',
    function () {

        const isPassword =
            newPinInput.type === 'password';

        newPinInput.type =
            isPassword
                ? 'text'
                : 'password';

        this.textContent =
            isPassword
                ? 'visibility_off'
                : 'visibility';
    }
);


// =========================================
// ERROR FUNCTIONS
// =========================================

function showError(message) {

    formErrorSummary.innerHTML =
        message;

    formErrorSummary.classList.add(
        'show'
    );
}

function resetError() {

    formErrorSummary.innerHTML = "";

    formErrorSummary.classList.remove(
        'show'
    );

    document
        .querySelectorAll('input')
        .forEach(el => {

            el.classList.remove(
                'input-error'
            );
        });
}


// =========================================
// MAIN BUTTON CLICK
// =========================================

mainActionBtn.addEventListener(
    'click',
    async function () {

        resetError();


        // =========================================
        // STEP 1 → SEND OTP
        // =========================================

        if (currentStep === "sendOtp") {

            const emailRegex =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (
                !emailRegex.test(
                    emailInput.value
                )
            ) {

                emailInput.classList.add(
                    'input-error'
                );

                showError(
                    "Please enter valid email."
                );

                return;
            }

            try {

                // Loading State
                mainActionBtn.disabled =
                    true;

                mainActionBtn.innerHTML =
                    "Sending OTP...";


                // =========================================
                // SEND OTP API
                // =========================================

                const response = await fetch(
                    `${CONFIG.API_BASE_URL}/forgot-pin-send-otp`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            email:
                                emailInput.value
                        })
                    }
                );

                const result =
                    await response.json();

                console.log(result);


                // =========================================
                // SUCCESS
                // =========================================

                if (response.ok) {

                    // Show OTP Section
                    otpSection.style.display =
                        "block";

                    // Lock Email
                    emailInput.readOnly =
                        true;

                    emailInput.style.opacity =
                        "0.7";

                    // Update Flow
                    currentStep =
                        "verifyOtp";

                    // Update Button
                    mainActionBtn.disabled =
                        false;

                    mainActionBtn.innerHTML = `

                        Verify OTP

                        <span class="material-symbols-outlined">
                            verified
                        </span>

                    `;

                } else {

                    showError(
                        result.detail
                        ||
                        result.message
                        ||
                        "Failed to send OTP"
                    );

                    mainActionBtn.disabled =
                        false;

                    mainActionBtn.innerHTML = `

                        Send OTP

                        <span class="material-symbols-outlined">
                            arrow_forward
                        </span>

                    `;
                }

            } catch (error) {

                console.log(error);

                showError(
                    "Server Error While Sending OTP"
                );

                mainActionBtn.disabled =
                    false;

                mainActionBtn.innerHTML = `

                    Send OTP

                    <span class="material-symbols-outlined">
                        arrow_forward
                    </span>

                `;
            }
        }


        // =========================================
        // STEP 2 → VERIFY OTP
        // =========================================

        else if (
            currentStep === "verifyOtp"
        ) {

            // OTP VALIDATION
            if (
                otpInput.value.length !== 6
            ) {

                otpInput.classList.add(
                    'input-error'
                );

                showError(
                    "OTP must be exactly 6 digits."
                );

                return;
            }

            try {

                // Loading State
                mainActionBtn.disabled =
                    true;

                mainActionBtn.innerHTML =
                    "Verifying OTP...";


                // =========================================
                // VERIFY OTP API
                // =========================================

                const response = await fetch(
                    `${CONFIG.API_BASE_URL}/verify-otp`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            email:
                                emailInput.value,

                            otp:
                                otpInput.value
                        })
                    }
                );

                const result =
                    await response.json();

                console.log(result);


                // =========================================
                // SUCCESS
                // =========================================

                if (response.ok) {

                    // Lock OTP
                    otpInput.readOnly =
                        true;

                    otpInput.classList.add(
                        'otp-success'
                    );

                    // Show PIN Section
                    newPinSection.style.display =
                        "block";

                    // Update Flow
                    currentStep =
                        "setPin";

                    // Update Button
                    mainActionBtn.disabled =
                        false;

                    mainActionBtn.innerHTML = `

                        Set New PIN

                        <span class="material-symbols-outlined">
                            lock_reset
                        </span>

                    `;

                } else {

                    showError(
                        result.detail
                        ||
                        result.message
                        ||
                        "Invalid OTP"
                    );

                    mainActionBtn.disabled =
                        false;

                    mainActionBtn.innerHTML = `

                        Verify OTP

                        <span class="material-symbols-outlined">
                            verified
                        </span>

                    `;
                }

            } catch (error) {

                console.log(error);

                showError(
                    "Server Error While Verifying OTP"
                );

                mainActionBtn.disabled =
                    false;

                mainActionBtn.innerHTML = `

                    Verify OTP

                    <span class="material-symbols-outlined">
                        verified
                    </span>

                `;
            }
        }


        // =========================================
        // STEP 3 → RESET PIN
        // =========================================

        else if (
            currentStep === "setPin"
        ) {

            // PIN VALIDATION
            if (
                newPinInput.value.length !== 6
            ) {

                newPinInput.classList.add(
                    'input-error'
                );

                showError(
                    "PIN must be exactly 6 digits."
                );

                return;
            }

            try {

                // Loading State
                mainActionBtn.disabled =
                    true;

                mainActionBtn.innerHTML =
                    "Updating PIN...";


                // =========================================
                // RESET PIN API
                // =========================================

                const response = await fetch(
                    `${CONFIG.API_BASE_URL}/reset-pin`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            email:
                                emailInput.value,

                            pin:
                                newPinInput.value
                        })
                    }
                );

                const result =
                    await response.json();

                console.log(result);


                // =========================================
                // SUCCESS
                // =========================================

                if (response.ok) {

                    mainActionBtn.innerHTML = `

                        PIN Updated Successfully

                        <span class="material-symbols-outlined">
                            check_circle
                        </span>

                    `;

                    // Redirect
                    setTimeout(() => {

                        window.location.href =
                            "login.html";

                    }, 1500);

                } else {

                    showError(
                        result.detail
                        ||
                        result.message
                        ||
                        "Failed to update PIN"
                    );

                    mainActionBtn.disabled =
                        false;

                    mainActionBtn.innerHTML = `

                        Set New PIN

                        <span class="material-symbols-outlined">
                            lock_reset
                        </span>

                    `;
                }

            } catch (error) {

                console.log(error);

                showError(
                    "Server Error While Updating PIN"
                );

                mainActionBtn.disabled =
                    false;

                mainActionBtn.innerHTML = `

                    Set New PIN

                    <span class="material-symbols-outlined">
                        lock_reset
                    </span>

                `;
            }
        }
    }
);
