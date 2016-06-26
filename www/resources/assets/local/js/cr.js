(function() {
    var elems = document.querySelectorAll('[data-submit-ajax]');

    for (var i = 0; i < elems.length; i++) {
        var elem = elems[i];
        elem.addEventListener("submit", function(e) {
            e.preventDefault();
            var form = e.target;
            var httpMethod = form.getAttribute('method');
            var action = form.getAttribute('action');
            var data = new FormData(form);

            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function() {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    document.querySelector('[data-submit-ajax-btn]').style.display = 'block';
                    document.querySelector('[data-submit-ajax-load-indicator]').style.display = 'none';

                    var message = '';
                    if (xhr.status === 200) {
                        message = 'Your message has been sent';
                    } else {
                        message = 'Unable to send message';
                    }

                    document.querySelector('#global-snackbar').MaterialSnackbar.showSnackbar({
                        'message': message
                    });
                }
            };
            xhr.open(httpMethod, action);
            xhr.setRequestHeader('Accept', 'application/json');
            xhr.send(data);
            document.querySelector('[data-submit-ajax-btn]').style.display = 'none';
            document.querySelector('[data-submit-ajax-load-indicator]').style.display = 'block';
            return false;
        });
    }
})();