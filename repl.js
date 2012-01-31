$(function () {
    SHEN = {};
    SHEN.io = (function () {
        var out_buffer = "";

        return {
            newline: function () {
                $('<div class="line">')
                    .appendTo("#stdout");
            },

            flush: function () {
                $('<span>' + out_buffer  + '</span>')
                    .appendTo("#stdout .line:last");
                out_buffer = "";
            },

            write: function (c) {
                out_buffer += c;
                if (c === '\n') this.flush();
            },

            // For file:// to work in Chrome google-chrome --allow-file-access-from-files
            read: function (fn) {
                var data;
                $.ajax({
                    type: "GET",
                    url: fn,
                    async: false,
                    dataType: "text",
                    success: function (response) {
                        data = response;
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        throw (errorThrown || textStatus);
                    }
                });

                if (fn.match(/.shen$/)) {
                    var source = $('<div title="Click to toggle source view"><a class="label" href=#>' + fn + '</a></div>')
                        .twipsy(twipsy_opts)
                        .click(function () {
                            $(this).twipsy("hide");
                            $(this).find(".loaded-file").slideToggle("fast").toggleClass("active");
                        })
                        .insertBefore("#stdout div.line:last");

                    $('<pre class="loaded-file prettyprint lang-shen">' + data + '</div>')
                        .appendTo(source);

                    prettyPrint();
                }

                return data;
            },

            readline: function () {
                return SHEN.history.current();
            }
        };
    }());


    var twipsy_opts = {placement: "left", offset: 16, delayIn: 1500};

    SHEN.error = (function () {
        return {
            hide_last: function () {
                $("#stdout .code:last +* .stack").slideUp("fast");
                $("#stdout .code:last +* .loaded-file").slideUp("fast");
            },

            add: function (e) {
                $("#stdout div.line:last").detach();
                var error = $('<div class="alert-message block-message error" title="Click to toggle stacktrace">')
                    .html('<a class="message" href="#">' + e.toString() + "</a>")
                    .twipsy(twipsy_opts)
                    .click(function () {
                        $(this).twipsy("hide");
                        $(this).find(".stack").slideToggle("fast");
                    })
                    .appendTo("#stdout");

                $('<p class="stack">')
                    .text(e.stack.substring(e.stack.indexOf("\n") + 1))
                    .appendTo(error);
            }
        };
    }());

    SHEN.history = (function () {
        var history = [], pos = 0;
        try {
            history = JSON.parse(localStorage.getItem("history")) || history;
            pos = history.length;
        } catch (e) {
            SHEN.error.add(e);
        }

        return {
            go:  function (to) {
                pos = to;
                $("label[for=stdin]").text('(' + pos + '-)');
                $("#stdin").val(history[pos]).change().focus();
            },

            go_from_end:  function (to) {
                SHEN.history.go(history.length - to);
            },

            add: function (code) {
                history.push(code);
                localStorage.setItem("history", JSON.stringify(history))
                this.go(history.length);
            },

            forward: function () {
                if (pos < history.length) this.go(pos + 1);
            },

            back: function () {
                if (pos > 0) this.go(pos - 1);
            },

            first: function () {
                this.go(0);
            },

            last: function () {
                this.go(history.length);
            },

            current: function () {
                return history[history.length - 1];
            },

            length: function () {
                return history.length - 1;
            }
        };
    }());

    SHEN.display_code = function (code) {
    }

    SHEN.eval = function (code) {
        SHEN.history.add(code);
        SHEN.error.hide_last();

        var code = $('<br><pre class="code prettyprint lang-shen" title="Click to recall, Double click to evaluate">' + code + '</div>')
            .twipsy(twipsy_opts)
            .appendTo("#stdout");
        $('<span class="span1 muted prompt">(' + SHEN.history.length() + '-) </span>')
            .prependTo(code);
        prettyPrint();

        SHEN.io.newline();
        SHEN.fn(shen_read_evaluate_print);
        SHEN.io.flush();
    };
    SHEN.fn = function (f) {
        try {
            return shen_tail_call(shen_get_fn_js(f));
        } catch (e) {
            SHEN.error.add(e);
            return e;
        }
    };
    SHEN.eval_stdin = function () {
        var stdin = $("#stdin").val().trim();
        if (stdin.length > 0) SHEN.eval(stdin);
        $("footer")[0].scrollIntoView(false);
        $("#stdin").attr("placeholder", "");
    };

    var key = {end: 35, home: 36, left: 37, up: 38, right: 39, down: 40, enter: 13};

    var resize_stdin = function () {
        var min_rows = 4;
        var rows = $("#stdin").val().split(/\r\n|\r|\n/).length + 1;
        $("#stdin").attr('rows', rows > min_rows ? rows : min_rows);
    };

    $("#stdin").keydown(function (e) {
        if (e.ctrlKey) {
            if (e.keyCode === key.enter) SHEN.eval_stdin();
            if (e.keyCode === key.home) SHEN.history.first();
            if (e.keyCode === key.up) SHEN.history.back();
            if (e.keyCode === key.end) SHEN.history.last();
            if (e.keyCode === key.down) SHEN.history.forward();
        }
    }).keyup(resize_stdin).change(resize_stdin);

    $("#stdout").on("click", ".code", function (e) {
        $(this).twipsy("hide");
        SHEN.history.go_from_end($("#stdout .code").length - $("#stdout .code").index($(this)));
        $("#stdin").focus();
        $("footer")[0].scrollIntoView(false);
    }).on("dblclick", ".code", function (e) {
        SHEN.eval_stdin();
    }).on("mousedown", ".code", function (e) {
        return false;
    });

    $("#prompt").click(function (e) {
        SHEN.history.last();
    }).twipsy({placement: "left", offset: 8, delayIn: 1500});


    $("#repl input[type=submit]").click(function () {
        SHEN.eval_stdin();
        $("#stdin").focus();
        return false;
    });
    $("#repl button[type=reset]").click(function () {
        $("#stdin").focus().val("").change();
        return false;
    });

    SHEN.io.newline();
    SHEN.fn(shen_credits);
    SHEN.io.write('\n');
    SHEN.fn(shen_initialise$_environment);
    SHEN.history.last();
});
