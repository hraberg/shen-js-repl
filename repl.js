$(function() {
    SHEN_history = [];
    SHEN_history_pos = 0;
    SHEN_set_history_pos = function(pos) {
        SHEN_history_pos = pos;
        $("label[for=stdin]").text("(" + pos + " -)");
    }

    SHEN_write = function(c) { return $("#stdout").text($("#stdout").text() + c) }
    SHEN_readline = function() { return SHEN_history[SHEN_history.length - 1]; }

    SHEN_eval = function (code) {
        SHEN_history.push(code);
        SHEN_set_history_pos(SHEN_history.length);
        SHEN_fn(shen_read_evaluate_print);
        SHEN_write('\n');
    }
    SHEN_fn = function (f) { return shen_tail_call(shen_get_fn_js(f)); }

    var arrow = {left: 37, up: 38, right: 39, down: 40 };

    SHEN_fn(shen_credits);
    SHEN_write('\n');
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
                $("#stdin").val(SHEN_history[SHEN_history_pos]);
            }
            if (e.keyCode == arrow.down && SHEN_history_pos < SHEN_history.length) {
                SHEN_set_history_pos(SHEN_history_pos + 1);
                $("#stdin").val(SHEN_history[SHEN_history_pos]);
            }
        }
    });
});
