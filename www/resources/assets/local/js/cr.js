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
            xhr.open(httpMethod, action);
            xhr.setRequestHeader('Accept', 'application/json');
            xhr.send(data);
            return false;
        });
    }
})();