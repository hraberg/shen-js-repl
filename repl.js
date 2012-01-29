$(function() {
    var SHEN_history = [];
    var SHEN_history_pos = 0;
    var SHEN_set_history_pos = function(pos) {
        SHEN_history_pos = pos;
        $("label[for=stdin]").text("(" + pos + "-)");
        $("#stdin").val(SHEN_history[SHEN_history_pos]);
    }

    SHEN_write = function(c) {
        return $("#stdout").append(c);
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
                if (errorThrown) error = errorThrown
                else error = textStatus;
                throw error;
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
        SHEN_write('<div class="code">' + code + '</div>');
        SHEN_fn(shen_read_evaluate_print);
        SHEN_write('<p>');
    }
    var SHEN_fn = function (f) {
        try {
            return shen_tail_call(shen_get_fn_js(f));
        } catch (e) {
            SHEN_write("<div class='alert-message block-message error'>" + e.stack + "</div>");
            return e;
        }
    }

    var arrow = {left: 37, up: 38, right: 39, down: 40 };

    SHEN_fn(shen_credits);
    SHEN_write('<p>');
    SHEN_set_history_pos(0);

    $("#stdin").keyup(function(e) {
        if (e.ctrlKey) {
            if (e.keyCode == 13 && $.trim(this.value).length > 0) {
                var line = this.value;
                this.value = "";
                SHEN_eval(line);
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
});
