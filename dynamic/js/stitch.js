
const client = stitch.Stitch.initializeDefaultAppClient('testapplication-zhxbq');

if (client.auth.isLoggedIn) {
    client.callFunction("confirmUser", [client.auth.currentUser.profile.email])
        .then(confirmRes => {
            if (confirmRes.length > 0) {
                //console.log('already logged in');
                // if (document.referrer.slice(-10) == 'login.html') {
                //     window.location.replace("/dynamic/pages/strategies.html");
                // }
            } else {
                if (window.location.pathname.slice(-12) != "indexap.html") {
                    window.location.replace("/dynamic/pages/indexap.html");
                }
            }
        })
} else {
    window.location.replace("/dynamic/pages/login.html");
}


function logoutFunction() {
    client.auth.logout().then(function () {
        location = self.location;
    });
};



