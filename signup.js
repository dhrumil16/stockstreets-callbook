// =========================================
// 1. SELECT DOM ELEMENTS
// =========================================

// Main Form
const signupForm = document.getElementById('signupForm');

// Inputs
const mobileInput = document.getElementById('mobileNumber');
const pinCodeInput = document.getElementById('pinCode');
const pinInput = document.getElementById('pin');

// PIN Toggle
const togglePin = document.getElementById('togglePin');

// Error Box
const formErrorSummary =
    document.getElementById('formErrorSummary');


// =========================================
// EMAIL VERIFICATION ELEMENTS
// =========================================

const emailInput =
    document.getElementById('email');

const btnVerifyEmail =
    document.getElementById('btnVerifyEmail');

const otpSection =
    document.getElementById('otpSection');

const emailOtpInput =
    document.getElementById('emailOtp');

const btnVerifyOtp =
    document.getElementById('btnVerifyOtp');

const otpStatusText =
    document.getElementById('otpStatusText');


// =========================================
// GLOBAL STATE
// =========================================

let isEmailVerified = false;


// =========================================
// COMMON ERROR FUNCTION
// =========================================

function showError(message) {

    if (formErrorSummary) {

        formErrorSummary.innerHTML = message;

        formErrorSummary.classList.add('show');
    }
}

function clearError() {

    if (formErrorSummary) {

        formErrorSummary.innerHTML = "";

        formErrorSummary.classList.remove('show');
    }
}


// =========================================
// 2. PIN VISIBILITY TOGGLE
// =========================================

if (togglePin && pinInput) {

    togglePin.addEventListener('click', function () {

        // Check Current Type
        const isPassword =
            pinInput.getAttribute('type') === 'password';

        // Toggle Input Type
        pinInput.setAttribute(
            'type',
            isPassword ? 'text' : 'password'
        );

        // Toggle Icon
        this.textContent =
            isPassword
                ? 'visibility_off'
                : 'visibility';
    });
}


// =========================================
// 3. ALLOW ONLY NUMBERS
// =========================================

function allowOnlyDigits(e) {

    e.target.value =
        e.target.value.replace(/\D/g, '');
}


// =========================================
// APPLY NUMBER VALIDATION
// =========================================

if (mobileInput) {

    mobileInput.addEventListener(
        'input',
        allowOnlyDigits
    );
}

if (pinCodeInput) {

    pinCodeInput.addEventListener(
        'input',
        allowOnlyDigits
    );
}

if (pinInput) {

    pinInput.addEventListener(
        'input',
        allowOnlyDigits
    );
}

if (emailOtpInput) {

    emailOtpInput.addEventListener(
        'input',
        allowOnlyDigits
    );
}


// =========================================
// 4. EMAIL VERIFICATION LOGIC
// =========================================

if (emailInput && btnVerifyEmail) {

    // =========================================
    // ENABLE VERIFY BUTTON WHEN EMAIL VALID
    // =========================================
    emailInput.addEventListener(
        'input',
        function () {

            const emailRegex =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            // Reset Verification
            isEmailVerified = false;

            // Enable Verify Button
            if (
                emailRegex.test(this.value)
            ) {

                btnVerifyEmail.disabled = false;

            } else {

                btnVerifyEmail.disabled = true;
            }
        }
    );


    // =========================================
    // SEND OTP BUTTON
    // =========================================
    btnVerifyEmail.addEventListener(
        'click',
        async function () {

            clearError();

            try {

                // Loading State
                btnVerifyEmail.innerText =
                    "Sending...";

                btnVerifyEmail.disabled = true;


                // =========================================
                // SEND OTP API CALL
                // =========================================
                const response = await fetch(
                    `${CONFIG.API_BASE_URL}/send-otp`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            email: emailInput.value
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

                    // Hide Verify Button
                    btnVerifyEmail.style.display =
                        "none";

                    // Lock Email Input
                    emailInput.readOnly = true;

                    emailInput.style.opacity =
                        "0.7";

                    // Show OTP Section
                    otpSection.style.display =
                        "block";

                } else {

                    showError(
                        result.message
                        ||
                        "Failed to send OTP"
                    );

                    btnVerifyEmail.disabled =
                        false;

                    btnVerifyEmail.innerText =
                        "Verify Email";
                }

            } catch (error) {

                console.log(error);

                showError(
                    "Server Error While Sending OTP"
                );

                btnVerifyEmail.disabled = false;

                btnVerifyEmail.innerText =
                    "Verify Email";
            }
        }
    );
}


// =========================================
// 5. VERIFY OTP LOGIC
// =========================================

if (btnVerifyOtp && emailOtpInput) {

    btnVerifyOtp.addEventListener(
        'click',
        async function () {

            clearError();

            // =========================================
            // OTP LENGTH VALIDATION
            // =========================================
            if (emailOtpInput.value.length !== 6) {

                showError(
                    "Please enter valid 6 digit OTP"
                );

                return;
            }

            try {

                // Loading State
                btnVerifyOtp.innerText =
                    "Verifying...";

                btnVerifyOtp.disabled = true;


                // =========================================
                // VERIFY OTP API CALL
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

                            email: emailInput.value,

                            otp: emailOtpInput.value
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

                    // Mark Email Verified
                    isEmailVerified = true;

                    // Hide Verify OTP Button
                    btnVerifyOtp.style.display =
                        "none";

                    // Lock OTP Input
                    emailOtpInput.readOnly = true;

                    // Green Success Border
                    emailOtpInput.style.border =
                        "1px solid #0997d7";

                    // Show Success Text
                    otpStatusText.style.display =
                        "block";

                } else {

                    showError(
                        result.detail
                        ||
                        result.message
                        ||
                        "Failed to send OTP"
                    );

                    btnVerifyOtp.disabled =
                        false;

                    btnVerifyOtp.innerText =
                        "Verify";
                }

            } catch (error) {

                console.log(error);

                showError(
                    "Server Error While Verifying OTP"
                );

                btnVerifyOtp.disabled = false;

                btnVerifyOtp.innerText =
                    "Verify";
            }
        }
    );
}


// =========================================
// 6. FORM SUBMIT
// =========================================

if (signupForm) {

    signupForm.addEventListener(
        'submit',
        async function (e) {

            // Prevent Page Reload
            e.preventDefault();

            clearError();

            // Error Array
            let errorMessages = [];


            // =========================================
            // RESET OLD INPUT ERRORS
            // =========================================
            document
                .querySelectorAll('input')
                .forEach(el => {

                    el.classList.remove(
                        'input-error'
                    );
                });


            // =========================================
            // EMAIL NOT VERIFIED ERROR
            // =========================================
            if (!isEmailVerified) {

                errorMessages.push(
                    "• Please verify your email first."
                );

                emailInput.classList.add(
                    'input-error'
                );
            }


            // =========================================
            // MOBILE VALIDATION
            // =========================================
            if (mobileInput.value.length !== 10) {

                errorMessages.push(
                    "• Mobile number must be exactly 10 digits."
                );

                mobileInput.classList.add(
                    'input-error'
                );
            }


            // =========================================
            // PIN CODE VALIDATION
            // =========================================
            if (pinCodeInput.value.length !== 6) {

                errorMessages.push(
                    "• PIN code must be exactly 6 digits."
                );

                pinCodeInput.classList.add(
                    'input-error'
                );
            }


            // =========================================
            // SECURITY PIN VALIDATION
            // =========================================
            if (pinInput.value.length !== 6) {

                errorMessages.push(
                    "• Security PIN must be exactly 6 digits."
                );

                pinInput.classList.add(
                    'input-error'
                );
            }


            // =========================================
            // SHOW ERRORS
            // =========================================
            if (errorMessages.length > 0) {

                showError(
                    errorMessages.join('<br>')
                );

                return;
            }


            // =========================================
            // CREATE FORM DATA
            // =========================================
            const formData = {

                fullName:
                    document.getElementById(
                        'fullName'
                    ).value,

                mobileNumber:
                    document.getElementById(
                        'mobileNumber'
                    ).value,

                DOB:
                    document.getElementById(
                        'DOB'
                    ).value,

                pinCode:
                    document.getElementById(
                        'pinCode'
                    ).value,

                city:
                    document.getElementById(
                        'city'
                    ).value,

                email:
                    document.getElementById(
                        'email'
                    ).value,

                pin:
                    document.getElementById(
                        'pin'
                    ).value
            };


            try {

                // =========================================
                // SIGNUP API CALL
                // =========================================
                const response = await fetch(
                    `${CONFIG.API_BASE_URL}/signup`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify(
                            formData
                        )
                    }
                );

                const result =
                    await response.json();

                console.log(result);


                // =========================================
                // SUCCESS
                // =========================================
                if (response.ok) {

                    // Reset Form
                    signupForm.reset();

                    // Redirect
                    window.location.href =
                        "login";

                } else {

                    showError(
                        result.detail
                        ||
                        result.message
                        ||
                        "Signup Failed"
                    );
                }

            } catch (error) {

                console.log(error);

                showError(
                    "Server Error. Please try again."
                );
            }
        }
    );
}

// =========================================
// 7. PRE-FILL MOBILE NUMBER FROM URL
// =========================================
(function() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const mobileParam = urlParams.get('mobile');
        if (mobileParam && mobileInput) {
            const cleanedMobile = mobileParam.replace(/\D/g, '').substring(0, 10);
            mobileInput.value = cleanedMobile;
        }
    } catch (e) {
        console.error("Error pre-filling mobile number:", e);
    }
})();
