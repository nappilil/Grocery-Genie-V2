(function ($) {
    // client-side validation for logging in 
    const checkEmail = (email, varName) => {
        if (!email) throw `Error: You must supply a ${varName}!`;
        if (typeof email !== 'string') throw `Error: ${varName} must be a string!`;
        email = email.trim();
        if (email.length === 0)
            throw `Error: ${varName} cannot be empty or just spaces`;
        // https://www.npmjs.com/package/email-validator imported npm that checks if valid email address
        /*
        if (!EmailValidator.validate(email))
          throw `Error: ${email} is an invalid ${varName}`;
        */
        return;
    }

    const checkPasswordLogin = (password, varName) => {
        // Check if password is at least 8 chars, and combo of upper & lower case char, at least 1 digit, at least 1 special char.
        if (!password) throw `Error: must supply a ${varName}`;
        if (typeof password !== 'string') throw `Error: ${varName} must be a string!`;
        password = password.trim();
        if (password.length === 0) throw `Error: must supply a ${varName}`;
        return;
    }

    // evert listener
    document.getElementById('login-form').addEventListener('submit', function (event) {
        //let errordiv = document.getElementById('error_div'); 
        // prevent submission 
        let password = document.getElementById('password').value;
        let email = document.getElementById('email').value;
        let perror = document.getElementById('perror');
        let eerror = document.getElementById('eerror');
        try {
            let result = checkEmail(email, "Email Address");
            eerror.classList.add('hidden');
        } catch (e) {
            event.preventDefault();
            eerror.classList.remove('hidden');
            eerror.textContent = e;
        }
        try {
            let result = checkPasswordLogin(password, "Password");
            perror.classList.add('hidden');
        } catch (e) {
            event.preventDefault();
            perror.classList.remove('hidden');
            perror.textContent = e;
        }
        //return; 
    });

    $('#login-form').submit(function (event) {
        event.preventDefault();

        let email = $('#login-email').val();
        let password = $('#login-password').val();
        let csrfToken = $('input[name="_csrf"]').val();
        try {
            checkEmail(email, 'Email Address');
            checkPasswordLogin(password, 'Password');


            $.ajax({
                method: 'POST',
                url: '/users/login',
                contentType: 'application/json',
                data: JSON.stringify({
                    email: email,
                    password: password,
                    _csrf: csrfToken
                })
            }).done(function (response) {

                window.location.href = '/users/profile';
            }).fail(function (error) {

                $('#login-error').text("Log in failed: " + error.responseJSON.message);
            });
        } catch (error) {

            $('#login-error').text(error);
        }
    });
})(window.jQuery);
