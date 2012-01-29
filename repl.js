$(function() {
    var SHEN_history = [];
    var SHEN_history_pos = 0;
    var SHEN_set_history_pos = function(pos) {
        SHEN_history_pos = pos;
        $("label[for=stdin]").text("(" + pos + "-)");
        $("#stdin").val(SHEN_history[SHEN_history_pos]);
    }

    var SHEN_out_buffer = "";
    SHEN_newline = function() {
        $("#stdout").append('<div class="line">');
    }
    SHEN_flush = function() {
        $("#stdout .line:last").append(SHEN_out_buffer);
        SHEN_out_buffer = "";
    }
    SHEN_write = function(c) {
        SHEN_out_buffer += c;
        if (c == '\n') SHEN_flush();
    }
    // For file:// to work in Chrome google-chrome --allow-file-access-from-files
    SHEN_read = function(fn) {
        var data;
        $.ajax({
            type: "GET",
            url: fn,
            async: false,
            dataType:"text",
            success: function(response) {
                data = response;
            },
            error: function(jqXHR, textStatus, errorThrown) {
                throw (errorThrown || textStatus);
            }
        });
        return data;
    };
    SHEN_readline = function() {
        return SHEN_history[SHEN_history.length - 1];
    }

    var SHEN_eval = function (code) {
        SHEN_history.push(code);
        SHEN_set_history_pos(SHEN_history.length);
        $("#stdout").append('<div class="code">' + code + '</div>');
        SHEN_newline();
        SHEN_fn(shen_read_evaluate_print);
        SHEN_flush();
    }
    var SHEN_fn = function (f) {
        try {
            return shen_tail_call(shen_get_fn_js(f));
        } catch (e) {
            $("#stdout").append("<div class='alert-message block-message error'>" + e.stack + "</div>");
            return e;
        }
    }
    var SHEN_eval_stdin = function() {
        SHEN_eval($("#stdin").val().trim());
    }

    var arrow = {left: 37, up: 38, right: 39, down: 40 };
    var enter = 13;

    $("#stdin").keyup(function(e) {
        if (e.ctrlKey) {
            if (e.keyCode == enter && $.trim(this.value).length > 0) {
                SHEN_eval_stdin();
            }
            if (e.keyCode == arrow.up && SHEN_history_pos > 0) {
                SHEN_set_history_pos(SHEN_history_pos - 1);
            }
            if (e.keyCode == arrow.down && SHEN_history_pos < SHEN_history.length) {
                SHEN_set_history_pos(SHEN_history_pos + 1);
            }
        }
    });

    $("#stdout").on("click", ".code", function(e) {
        SHEN_set_history_pos($("#stdout .code").index($(this)));
    });
    $("#stdout").on("dblclick", ".code", function(e) {
        SHEN_set_history_pos($("#stdout .code").index($(this)));
        SHEN_eval_stdin();
    });

    SHEN_newline();
    SHEN_fn(shen_credits);
    SHEN_set_history_pos(SHEN_history.length);
});
