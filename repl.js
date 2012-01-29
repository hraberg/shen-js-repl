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
                return data;
            },

            readline: function () {
                return SHEN.history.current();
            }
        };
    }());

    SHEN.history = (function () {
        var history = [], pos = 0;

        return {
            go:  function (to) {
                pos = to;
                $("label[for=stdin]").text("(" + pos + "-)");
                $("#stdin").val(history[pos]);
            },

            add: function (code) {
                history.push(code);
                this.go(history.length);
            },

            forward: function () {
                if (pos < history.length) this.go(pos + 1);
            },

            back: function () {
                if (pos > 0) this.go(pos - 1);
            },

            last: function () {
                this.go(history.length);
            },

            current: function () {
                return history[history.length - 1];
            }
        };
    }());

    var twipsy_opts = {placement: "left", offset: 16, delayIn: 1000};

    SHEN.error = (function () {
        return {
            hide_last: function () {
                $("#stdout div:last .stack").hide();
            },

            add: function (e) {
                var error = $('<div class="alert-message block-message error" title="Click to toggle stacktrace">')
                    .text(e.toString())
                    .twipsy(twipsy_opts)
                    .click(function () {
                        $(this).find(".stack").toggle();
                    })
                    .appendTo("#stdout");

                $("<p class='stack'>")
                    .text(e.stack.substring(e.stack.indexOf("\n") + 1))
                    .appendTo(error);
            }
        };
    }());

    SHEN.eval = function (code) {
        SHEN.history.add(code);
        SHEN.error.hide_last();
        $('<div class="code" title="Click to recall, Double click to evaluate">' + code + '</div>')
            .twipsy(twipsy_opts)
            .appendTo("#stdout");
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
        SHEN.eval($("#stdin").val().trim());
    };

    var arrow = {left: 37, up: 38, right: 39, down: 40 }, enter = 13;

    $("#stdin").keyup(function (e) {
        if (e.ctrlKey) {
            if (e.keyCode === enter && $.trim(this.value).length > 0) {
                SHEN.eval_stdin();
            }
            if (e.keyCode === arrow.up) SHEN.history.back();
            if (e.keyCode === arrow.down) SHEN.history.forward();
        }
    });

    $("#stdout").on("click", ".code", function (e) {
        SHEN.history.go($("#stdout .code").index($(this)));
    });
    $("#stdout").on("dblclick", ".code", function (e) {
        SHEN.history.go($("#stdout .code").index($(this)));
        SHEN.eval_stdin();
    });
    $("#prompt").click(function (e) {
        SHEN.history.last();
    });

    $("#repl #prompt").twipsy({placement: "left", delayIn: 1000});

    SHEN.io.newline();
    SHEN.fn(shen_credits);
    SHEN.fn(shen_initialise$_environment);
    SHEN.history.last();
});
