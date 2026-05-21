// =========================================
// Select Elements
// =========================================

const loginForm = document.getElementById('loginForm');

const loginMobile = document.getElementById('loginMobile');

const loginPin = document.getElementById('loginPin');

const toggleLoginPin = document.getElementById('toggleLoginPin');

const formErrorSummary = document.getElementById('formErrorSummary');


// =========================================
// 1. PIN Visibility Toggle
// =========================================

if (toggleLoginPin && loginPin) {

    toggleLoginPin.addEventListener('click', function () {

        const isPassword =
            loginPin.getAttribute('type') === 'password';

        loginPin.setAttribute(
            'type',
            isPassword ? 'text' : 'password'
        );

        this.textContent =
            isPassword
                ? 'visibility_off'
                : 'visibility';

    });

}


// =========================================
// 2. Allow Only Numbers
// =========================================

function allowOnlyDigits(e) {

    e.target.value =
        e.target.value.replace(/\D/g, '');

}

if (loginMobile) {

    loginMobile.addEventListener(
        'input',
        allowOnlyDigits
    );

}

if (loginPin) {

    loginPin.addEventListener(
        'input',
        allowOnlyDigits
    );

}


// =========================================
// 3. Login Submit
// =========================================

if (loginForm) {

    loginForm.addEventListener(

        'submit',

        async function (e) {

            // =====================================
            // STOP NORMAL FORM SUBMIT
            // =====================================

            e.preventDefault();

            let errorMessages = [];

            // =====================================
            // RESET ERRORS
            // =====================================

            if (formErrorSummary) {

                formErrorSummary.classList.remove('show');

                formErrorSummary.innerHTML = "";

            }

            document
                .querySelectorAll('input')
                .forEach(el => {
                    el.classList.remove('input-error');
                });


            // =====================================
            // VALIDATIONS
            // =====================================

            // MOBILE NUMBER

            if (loginMobile.value.length !== 10) {

                errorMessages.push(
                    "• Mobile number must be exactly 10 digits."
                );

                loginMobile.classList.add('input-error');

            }

            // PIN

            if (loginPin.value.length !== 6) {

                errorMessages.push(
                    "• Security PIN must be exactly 6 digits."
                );

                loginPin.classList.add('input-error');

            }


            // =====================================
            // SHOW VALIDATION ERRORS
            // =====================================

            if (errorMessages.length > 0) {

                formErrorSummary.innerHTML =
                    errorMessages.join('<br>');

                formErrorSummary.classList.add('show');

                return;

            }


            // =====================================
            // CREATE LOGIN DATA
            // =====================================

            const loginData = {

                mobileNumber: loginMobile.value,

                pin: loginPin.value

            };


            try {

                // =====================================
                // LOGIN API CALL
                // =====================================

                const response = await fetch(

                    `${CONFIG.API_BASE_URL}/login`,

                    {

                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify(loginData)

                    }

                );


                // =====================================
                // GET RESPONSE
                // =====================================

                const result = await response.json();

                console.log(result);


                // =====================================
                // SUCCESS
                // =====================================

                if (response.ok) {

                    // STORE USER DATA

                    localStorage.setItem(

                        "user_id",

                        result.user.id

                    );

                    localStorage.setItem(

                        "full_name",

                        result.user.full_name

                    );

                    localStorage.setItem(

                        "isLoggedIn",

                        "true"

                    );

                    // NAVIGATE

                    window.location.href = "options.html";

                }


                // =====================================
                // LOGIN FAILED
                // =====================================

                else {

                    formErrorSummary.innerHTML =

                        result.detail
                        ||
                        result.message
                        ||
                        "Invalid Mobile Number or PIN";

                    formErrorSummary.classList.add('show');

                }

            }


            // =====================================
            // SERVER ERROR
            // =====================================

            catch (error) {

                console.log(error);

                formErrorSummary.innerHTML =

                    "Server Error. Please try again.";

                formErrorSummary.classList.add('show');

            }

        }

    );

}
