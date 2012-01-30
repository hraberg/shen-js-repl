/*
Copyright 2012 Ramil Farkhshatov
Distributed under Shen License[1] conditions.

1. http://shenlanguage.org/license.html
*/


//## FILE runtime.js

Shen_tco_obj = function(fn) {this.fn = fn}

shen_fail_obj = new Object
shen_globals = []

shen_counter_type = 0
shen_type_symbol = --shen_counter_type
shen_type_cons = --shen_counter_type
shen_type_stream_in = --shen_counter_type
shen_type_stream_out = --shen_counter_type
shen_type_error = --shen_counter_type

shen_true = true
shen_false = false

function shen_tail_call(fn, arg, printret) {
	if (typeof(fn) != "function")
		fn = shen_get_fn_js(fn)
  var ret = fn(arg)
  while (ret instanceof Shen_tco_obj)
    ret = ret.fn()
	if (printret != undefined)
		dbg_output(printret + " => ~A", ret)
  return ret
}

function shen_error(s) {
	if (is_true_js(shen_globals['shen_$asterisk$show_error_js$asterisk$']))
		puts_js("# err: " + s + "\n")
  throw new Error(s);
	return shen_fail_obj
}

function shen_error_to_string (s) {
	var stack = s.stack;
	return "" + s + " " + stack;
}

function shen_get_time(x) {
	return (new Date()).getTime()
}

shen_simple_error = shen_error

shen_log_eq_js = false

function trap_error_js(fn, handler) {
	try {
		return fn()
	} catch (e) {
		return handler(e)
	}
}

function shen_equal_boolean_js(b, x) {
	return ((x instanceof Array)
					&& x[0] == shen_type_symbol
					&& ((x[1] == "true" && b === true)
					 	  || (x[1] == "false" && b === false)))
}

function shen_equal_function_js(f, x) {
	return ((f.name.length > 0)
					 && (x instanceof Array)
					 && x[0] == shen_type_symbol
					 && x[1] == f.name)
}

function shen_equal$question$_js(x, y) {
	var tx = typeof(x)
	var ty = typeof(y)
  if (tx != ty)
		return ((tx == "boolean" && shen_equal_boolean_js(x, y))
						|| (ty == "boolean" && shen_equal_boolean_js(y, x))
						|| (tx == "function" && shen_equal_function_js(x, y))
						|| (ty == "function" && shen_equal_function_js(y, x)))
	switch (tx) {
	case "number":
	case "boolean":
	case "function":
	case "string": 
		return x == y;

	case "object":
		if (((x instanceof Array) ^ (y instanceof Array))
				|| (x.length != y.length))
			return false;
		if (x.length == 0)
			return true;
		if (x == shen_fail_obj && y == shen_fail_obj)
			return true;
		if (x[0] != y[0])
			return false;
		switch (x[0]) {
		case shen_type_symbol: return x[1] == y[1];
		case shen_type_cons:
			var r = shen_tail_call(function() {
				return shen_equal$question$_js(x[1], y[1])
			})
			if (!r)
				return false
			return new Shen_tco_obj(function () {
				return shen_equal$question$_js(x[2], y[2]);
			});
		case shen_type_stream_out:
		case shen_type_stream_in: return x[1] == y[1] && x[2] == y[2];
		default: 
			for (var i = 1; i < x.length; ++i) {
				var r = shen_tail_call(function() {
					return shen_equal$question$_js(x[i], y[i])
				})
				if (!r)
					return false;
			}
			return true;
		}
		break;
	default: return false;
	}
}

function shen_get_fn_js(x) {
  if (typeof(x) == "function")
    return x
  if ((x instanceof Array) && x[0] == shen_type_symbol) {
		try {
			return eval(x[1])
		} catch (e) {
			try {
			return eval("shen_" + x[1])
			} catch (e) {
				shen_error("Cannot find (|shen_)'" + x[1] + "'")
			}
		}
    return 
	}
	if (x instanceof Shen_tco_obj)
		return x.fn

	throw new Error("function " + str_shen_from_js_js(x[1]) + " not found")
}

function shen_empty$question$_js(x) {
  return ((x instanceof Array) && ! x.length)
}

function shen_is_type_js(x, type) {
	if (type == shen_type_symbol && (x === true || x === false))
		return true
  return ((x instanceof Array) && x[0] == type)
}

function shen_boolean$question$_js(x) {
  return (typeof(x) == "boolean") || (shen_is_type_js(x, shen_type_symbol)
                                      && (x[1] == "true" || x[1] == "false"))
}

function shen_n_$gt$string_js(x) {
  return String.fromCharCode(x)
}

function shen_vector$question$_js(x) {
  return ((x instanceof Array) && x[0] > 0)
}

function shen_absvector$question$_js(x) {
  return ((x instanceof Array) && x.length > 0 
	        && ((typeof(x[0]) != "number")
					    || x[0] >= 0 || x[0] <= shen_counter_type))
}

function shen_absvector_js(n) {
  var ret = new Array(n)
  for (var i = 0; i < n; ++i)
    ret[i] = shen_fail_obj
  return ret
}

function dbg_princ(s, x) {
	dbg_print(" " + s + x)
	return x
}

function dbg_print(s) {
	if (is_true_js(shen_globals['shen_$asterisk$show_error_js$asterisk$']))
		puts_js(s + "\n")
}

function is_true_js(x) {
	return x != false || ((x instanceof Array) 
	                      && (x[0] == shen_type_symbol)
										    && (x[1] != "false"))
}

function shen_absvector_ref_js(x, i) {
  if (x.length <= i || i < 0)
    shen_error("out of range")
  return x[i]
}

function shen_absvector_set_js(x, i, v) {
  if (x.length <= i)
    shen_error("out of range")
  x[i] = v
  return x
}

function shen_value_js(s) {
  var x = shen_globals[s[1]]
  if (x == undefined)
    shen_error("The variable " + s + " is unbound.")
  else
    return x
}

function shen_vector_js(n) {
  var r = new Array(n + 1)
  r[0] = n
  for (var i = 1; i <= n; ++i)
    r[i] = shen_fail_obj
  return r
}

function shen_esc_js(x) {
  var ret = ""
  for (var i = 0; i < x.length; ++i)
    switch (x[i]) {
      case '"': ret += '\\"'; break;
      default: ret += x[i]; break
    }
  return ret
}

function shen_str_starts_with(s, start) {
  var len = start.length
  if (s.length < len)
    return false
  return (s.substring(0, len) == start)
}

shen_sym_map = []
js_sym_map = []
shen_word_map = []
js_word_map = []

function shen_register_sym_map(js, shen) {
	js_sym_map[shen] = js
	shen_sym_map[js] = shen
}

function shen_register_word_map(js, shen) {
	js_word_map[shen] = js
	shen_word_map[js] = shen
}

shen_register_sym_map("_", "-")
shen_register_sym_map("$_", "_")
shen_register_sym_map("$$", "$")
shen_register_sym_map("$quote$", "'")
shen_register_sym_map("$bquote$", "`")
shen_register_sym_map("$slash$", "/")
shen_register_sym_map("$asterisk$", "*")
shen_register_sym_map("$plus$", "+")
shen_register_sym_map("$percent$", "%")
shen_register_sym_map("$eq$", "=")
shen_register_sym_map("$question$", "?")
shen_register_sym_map("$excl$", "!")
shen_register_sym_map("$gt$", ">")
shen_register_sym_map("$lt$", "<")
shen_register_sym_map("$dot$", ".")
shen_register_sym_map("$bar$", "|")
shen_register_sym_map("$sharp$", "#")
shen_register_sym_map("$tilde$", "~")
shen_register_sym_map("$colon$", ":")
shen_register_sym_map("$sc$", ";")
shen_register_sym_map("$amp$", "&")
shen_register_sym_map("$at$", "@")
shen_register_sym_map("$cbraceopen$", "{")
shen_register_sym_map("$cbraceclose$", "}")

shen_register_word_map("shen_return", "return")
shen_register_word_map("shen_new", "new")
shen_register_word_map("shen_delete", "delete")
shen_register_word_map("shen_function", "function")
shen_register_word_map("shen_while", "while")
shen_register_word_map("shen_for", "for")
shen_register_word_map("shen_var", "var")
shen_register_word_map("shen_if", "if")
shen_register_word_map("shen_do", "do")
shen_register_word_map("shen_in", "in")
shen_register_word_map("shen_super", "super")

function str_map_js(word_tbl, sym_tbl, s) {
  var ret = ""
  var replaced = false
	for (k in word_tbl)
		if (k == s)
			return word_tbl[k];
  while (s != "") {
   replaced = false
    for (k in sym_tbl)
      if (shen_str_starts_with(s, k)) {
        ret += sym_tbl[k]
        s = s.substring(k.length, s.length)
        replaced = true
        break
      }
    if (!replaced) {
      ret += s[0]
      s = s.substring(1, s.length)
    }
  }
  return ret
}

function str_shen_from_js_js(s) {
	return str_map_js(shen_word_map, shen_sym_map, s)
}

function str_js_from_shen_js(s) {
	return str_map_js(js_word_map, js_sym_map, s)
}

function shen_str_js(x) {
  var err = " is not an atom in Shen; str cannot print it to a string."
  switch (typeof(x)) {
    case "string": return "\"" + shen_esc_js(x) + "\""
    case "number":
    case "boolean": return "" + x
    case "function": 
			if (x.name.length > 0)
				return str_shen_from_js_js(x.name)
			return "#<function>"
    case "object":
      if (x == shen_fail_obj)
        return "fail!"
      if (x instanceof Array) {
        if (x.length <= 0) {
          shen_error("[]" + err)
          return shen_fail_obj
        }
				switch (x[0]) {
					case shen_type_symbol: return str_shen_from_js_js(x[1]);
				}
      }
  }
  shen_error(x + err)
  return shen_fail_obj
}

function shen_intern_js(s) {
	switch (s) {
	case "true": return true
	case "false": return false
	default: return [shen_type_symbol, str_js_from_shen_js(s)]
	}
}

function shen_tlstr_js(x) {
  if (x == "")
    return [shen_type_symbol, "shen_eos"]
  return x.substring(1, x.length)
}

function eval_in_global_js(x) {
	try {
		var g = window;
	} catch (e) {
		var g = this;
	}
	if (g.execScript) // eval in global scope for IE
		return g.execScript(x);
	else // other browsers
		return eval.call(null, x);
}

function shen_eval_without_macros(x) {
	var log = false

	if (is_true_js(shen_globals['shen_$asterisk$show_eval_js$asterisk$']))
		log = true
	if (log) {
		puts_js("# eval_without_macros[Shen]: " + "\n")
		puts_js(shen_tail_call(shen_tail_call(shen_intmake_string, "~R~%"),
													 [shen_tuple, x, []]))
	}
  try {
    shen_out
  } catch(e) {
    shen_out = shen_shen_out
  }
  var kl = shen_tail_call(shen_tail_call(js_fix_eval, shen_out), x)
	if (log) {
		puts_js("# eval_without_macros[KL]: " + "\n")
		puts_js(shen_tail_call(shen_tail_call(shen_intmake_string, "~R~%"),
													 [shen_tuple, kl, []]))
	}
	var js = shen_tail_call(js_from_kl, kl)
	if (log)
		puts_js("eval_without_macros[JS]:\n" + js + "\n\n")

	if (shen_is_type_js(kl, shen_type_cons) && kl[0][1] == "defun") {
		eval(js)
		//var ret = shen_get_fn_js(kl[2][1])
		var ret = kl[2][1]
	} else
		var ret = eval_in_global_js(js)
	if (log)
		puts_js("eval_without_macros => " + ret + "\n")
	if (ret == undefined)
		shen_error("evaluated '" + js + "' to undefined")
  return ret
}

shen_globals[str_js_from_shen_js("*language*")] = "Javascript"
shen_globals[str_js_from_shen_js("*implementation*")] = "cli"
shen_globals[str_js_from_shen_js("*port*")] = "0.1"
shen_globals[str_js_from_shen_js("*porters*")] = "Ramil Farkhshatov"
shen_globals[str_js_from_shen_js("js-skip-internals")] = true

shen_globals[str_js_from_shen_js("shen-*show-error-js*")] = false
shen_globals[str_js_from_shen_js("shen-*show-eval-js*")] = false


//## FILE runtime-primitives.js

shen_hd = (function lambda3994(X) {return (X == undefined) ? lambda3994 : new Shen_tco_obj(function() {return X[1];});});

shen_tl = (function lambda3995(X) {return (X == undefined) ? lambda3995 : new Shen_tco_obj(function() {return X[2];});});

shen_not = (function lambda3996(X) {return (X == undefined) ? lambda3996 : new Shen_tco_obj(function() {return (!X);});});

shen_thaw = (function lambda3997(X) {return (X == undefined) ? lambda3997 : new Shen_tco_obj(function() {return (X)();});});

shen_string$question$ = (function lambda3998(X) {return (X == undefined) ? lambda3998 : new Shen_tco_obj(function() {return (typeof(X) == 'string');});});

shen_number$question$ = (function lambda3999(X) {return (X == undefined) ? lambda3999 : new Shen_tco_obj(function() {return (typeof(X) == 'number');});});

shen_symbol$question$ = (function lambda4000(X) {return (X == undefined) ? lambda4000 : new Shen_tco_obj(function() {return shen_is_type_js(X, shen_type_symbol);});});

shen_cons$question$ = (function lambda4001(X) {return (X == undefined) ? lambda4001 : new Shen_tco_obj(function() {return shen_is_type_js(X, shen_type_cons);});});

shen_vector$question$ = (function lambda4002(X) {return (X == undefined) ? lambda4002 : new Shen_tco_obj(function() {return shen_vector$question$_js(X);});});

shen_absvector$question$ = (function lambda4003(X) {return (X == undefined) ? lambda4003 : new Shen_tco_obj(function() {return shen_absvector$question$_js(X);});});

shen_value = (function lambda4004(X) {return (X == undefined) ? lambda4004 : new Shen_tco_obj(function() {return shen_tail_call(shen_value_js, X);});});

shen_intern = (function lambda4005(X) {return (X == undefined) ? lambda4005 : new Shen_tco_obj(function() {return shen_intern_js(X);});});

shen_vector = (function lambda4006(X) {return (X == undefined) ? lambda4006 : new Shen_tco_obj(function() {return shen_tail_call(shen_vector_js, X);});});

shen_read_byte = (function lambda4007(X) {return (X == undefined) ? lambda4007 : new Shen_tco_obj(function() {return shen_read_byte_js(X);});});

shen_close = (function lambda4008(X) {return (X == undefined) ? lambda4008 : new Shen_tco_obj(function() {return shen_tail_call(shen_close_js, X);});});

shen_absvector = (function lambda4009(X) {return (X == undefined) ? lambda4009 : new Shen_tco_obj(function() {return shen_tail_call(shen_absvector_js, X);});});

shen_str = (function lambda4010(X) {return (X == undefined) ? lambda4010 : new Shen_tco_obj(function() {return shen_tail_call(shen_str_js, X);});});

shen_tlstr = (function lambda4011(X) {return (X == undefined) ? lambda4011 : new Shen_tco_obj(function() {return shen_tail_call(shen_tlstr_js, X);});});

shen_n_$gt$string = (function lambda4012(X) {return (X == undefined) ? lambda4012 : new Shen_tco_obj(function() {return shen_tail_call(shen_n_$gt$string_js, X);});});

shen_empty$question$ = (function lambda4013(X) {return (X == undefined) ? lambda4013 : new Shen_tco_obj(function() {return shen_tail_call(shen_empty$question$_js, X);});});

shen_$plus$ = (function lambda4015(X) {return (X == undefined) ? lambda4015 : new Shen_tco_obj(function() {return (function lambda4014(Y) {return (Y == undefined) ? lambda4014 : new Shen_tco_obj(function() {return (X + Y);});});});});

shen__ = (function lambda4017(X) {return (X == undefined) ? lambda4017 : new Shen_tco_obj(function() {return (function lambda4016(Y) {return (Y == undefined) ? lambda4016 : new Shen_tco_obj(function() {return (X - Y);});});});});

shen_$asterisk$ = (function lambda4019(X) {return (X == undefined) ? lambda4019 : new Shen_tco_obj(function() {return (function lambda4018(Y) {return (Y == undefined) ? lambda4018 : new Shen_tco_obj(function() {return (X * Y);});});});});

shen_$slash$ = (function lambda4021(X) {return (X == undefined) ? lambda4021 : new Shen_tco_obj(function() {return (function lambda4020(Y) {return (Y == undefined) ? lambda4020 : new Shen_tco_obj(function() {return (X / Y);});});});});

shen_and = (function lambda4023(X) {return (X == undefined) ? lambda4023 : new Shen_tco_obj(function() {return (function lambda4022(Y) {return (Y == undefined) ? lambda4022 : new Shen_tco_obj(function() {return (X && Y);});});});});

shen_or = (function lambda4025(X) {return (X == undefined) ? lambda4025 : new Shen_tco_obj(function() {return (function lambda4024(Y) {return (Y == undefined) ? lambda4024 : new Shen_tco_obj(function() {return (X || Y);});});});});

shen_$eq$ = (function lambda4027(X) {return (X == undefined) ? lambda4027 : new Shen_tco_obj(function() {return (function lambda4026(Y) {return (Y == undefined) ? lambda4026 : new Shen_tco_obj(function() {return shen_equal$question$_js(X, Y);});});});});

shen_$gt$ = (function lambda4029(X) {return (X == undefined) ? lambda4029 : new Shen_tco_obj(function() {return (function lambda4028(Y) {return (Y == undefined) ? lambda4028 : new Shen_tco_obj(function() {return (X > Y);});});});});

shen_$gt$$eq$ = (function lambda4031(X) {return (X == undefined) ? lambda4031 : new Shen_tco_obj(function() {return (function lambda4030(Y) {return (Y == undefined) ? lambda4030 : new Shen_tco_obj(function() {return (X >= Y);});});});});

shen_$lt$ = (function lambda4033(X) {return (X == undefined) ? lambda4033 : new Shen_tco_obj(function() {return (function lambda4032(Y) {return (Y == undefined) ? lambda4032 : new Shen_tco_obj(function() {return (X < Y);});});});});

shen_$lt$$eq$ = (function lambda4035(X) {return (X == undefined) ? lambda4035 : new Shen_tco_obj(function() {return (function lambda4034(Y) {return (Y == undefined) ? lambda4034 : new Shen_tco_obj(function() {return (X <= Y);});});});});

shen_cons = (function lambda4037(X) {return (X == undefined) ? lambda4037 : new Shen_tco_obj(function() {return (function lambda4036(Y) {return (Y == undefined) ? lambda4036 : new Shen_tco_obj(function() {return [shen_type_cons, X, Y];});});});});

shen_set = (function lambda4039(X) {return (X == undefined) ? lambda4039 : new Shen_tco_obj(function() {return (function lambda4038(Y) {return (Y == undefined) ? lambda4038 : new Shen_tco_obj(function() {return (shen_globals[X[1]] = Y);});});});});

shen_$lt$_address = (function lambda4041(X) {return (X == undefined) ? lambda4041 : new Shen_tco_obj(function() {return (function lambda4040(Y) {return (Y == undefined) ? lambda4040 : new Shen_tco_obj(function() {return shen_absvector_ref_js(X, Y);});});});});

shen_cn = (function lambda4043(X) {return (X == undefined) ? lambda4043 : new Shen_tco_obj(function() {return (function lambda4042(Y) {return (Y == undefined) ? lambda4042 : new Shen_tco_obj(function() {return (X + Y);});});});});

shen_pos = (function lambda4045(X) {return (X == undefined) ? lambda4045 : new Shen_tco_obj(function() {return (function lambda4044(Y) {return (Y == undefined) ? lambda4044 : new Shen_tco_obj(function() {return X[Y];});});});});

shen_$at$p = (function lambda4047(X) {return (X == undefined) ? lambda4047 : new Shen_tco_obj(function() {return (function lambda4046(Y) {return (Y == undefined) ? lambda4046 : new Shen_tco_obj(function() {return [shen_tuple, X, Y];});});});});

shen_address_$gt$ = (function lambda4052(X) {return (X == undefined) ? lambda4052 : new Shen_tco_obj(function() {return (function lambda4051(Y) {return (Y == undefined) ? lambda4051 : new Shen_tco_obj(function() {return (function lambda4050(Z) {return (Z == undefined) ? lambda4050 : new Shen_tco_obj(function() {return shen_absvector_set_js(X, Y, Z);});});});});});});


//## FILE io.js

shen_globals[str_js_from_shen_js("*home-directory*")] = ""

/*
stream_in -> [tag, get]
stream_out -> [tag, put]
*/

function shen_open_js(type, name, dir) {
	//puts_js("shen_open_js " + type + " '" + name + "' " + dir + "\n")
  if (type[1] != "file")
    return shen_fail_obj
  var fn = shen_globals["$asterisk$home_directory$asterisk$"] + name
  if (dir[1] == "shen_in") {
		//puts_js("  opening file '" + fn + "'\n");
		try {
			var s = read(fn)
		} catch(e) {
			shen_error(e)
			return shen_fail_obj
		}
		//puts_js("  read " + s.length + " b\n")
    return [shen_type_stream_in,
            function(stream) {
              return shen_file_instream_get_js(stream, s, 0)
            }]
  } else if (dir[1] == "shen_out") {
		//puts_js("  !! out\n")
		shen_error("Writing files is not supported in cli interpreter")
    return shen_fail_obj
  }
	//puts_js("  !! unsupported open flags\n")
	shen_error("Unsupported open flags")
	return shen_fail_obj
}

function shen_open(X) {
	if (X == undefined) return lambda4055;
	return new Shen_tco_obj(function() {return (function lambda4054(Y) {return (Y == undefined) ? lambda4054 : new Shen_tco_obj(function() {return (function lambda4053(Z) {return (Z == undefined) ? lambda4053 : new Shen_tco_obj(function() {
	  var ret = shen_open_js(X, Y, Z);
		return ret});});});});});
}

function shen_file_instream_get_js(stream, s, pos) {
  if (s.length <= pos) {
    stream[1] = (function(stream) {return -1})
    return -1
  }
  stream[1] = (function(stream) {
    return shen_file_instream_get_js(stream, s, pos + 1)
  })

  return s[pos].charCodeAt(0)
}

function shen_read_byte_js(stream) {
  return stream[1](stream)
}

function shen_close_js(stream) {
  switch (stream[0]) {
    case shen_type_stream_in:
      stream[1] = (function(stream) {return -1});
      break;
  }
  return []
}

try {
  puts_js = putstr;
} catch (e) {
  puts_js = write;
}

function shen_write_byte_js(byte, stream) {
	//print("# write_byte '" + byte + "' " + stream + "")
  if (stream == shen_globals["$asterisk$stoutput$asterisk$"]) {
    puts_js(String.fromCharCode(byte))
    return []
  }
}

shen_write_byte = (function lambda4049(X) {return (X == undefined) ? lambda4049 : new Shen_tco_obj(function() {return (function lambda4048(Y) {return (Y == undefined) ? lambda4048 : new Shen_tco_obj(function() {return shen_write_byte_js(X, Y);});});});});

function shen_repl_read_byte_js(stream, s, pos) {
	if (s == null) {
		stream[1] = (function(stream) {return -1})
		return -1
	} else if (s.length <= pos) {
    stream[1] = (function(stream) {
      return shen_repl_read_byte_js(stream, readline(), 0)
    })
		return shen_newline()
  } else {
    stream[1] = (function(stream) {
      return shen_repl_read_byte_js(stream, s, pos + 1)
    })
	}
  return s[pos].charCodeAt(0)
}

function
shen_open_repl_js()
{
  var fin = [shen_type_stream_in,
              (function(stream) {
                return shen_repl_read_byte_js(stream, readline(), 0)
              })];
  var fout = [shen_type_stream_out, (function() {return -1})]

  shen_globals[str_js_from_shen_js("*stinput*")] = fin
  shen_globals[str_js_from_shen_js("*stoutput*")] = fout
}

shen_open_repl_js()


//## FILE js/translator.js

function js_str_js_from_shen$asterisk$(V873) {
  if (V873 == undefined) return js_str_js_from_shen$asterisk$;
  return (function lambda1301(V874) {return (V874 == undefined) ? lambda1301 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js("", V873);})) ? V874 : (((shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), V873) && shen_tail_call(function() {return shen_equal$question$_js("-", V873[0]);}))) ? (shen_tail_call(shen_get_fn_js(js_str_js_from_shen$asterisk$), shen_tail_call(shen_tlstr, V873))((V874 + "_"))) : (((shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), V873) && shen_tail_call(function() {return shen_equal$question$_js("_", V873[0]);}))) ? (shen_tail_call(shen_get_fn_js(js_str_js_from_shen$asterisk$), shen_tail_call(shen_tlstr, V873))((V874 + "$_"))) : (((shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), V873) && shen_tail_call(function() {return shen_equal$question$_js("$", V873[0]);}))) ? (shen_tail_call(shen_get_fn_js(js_str_js_from_shen$asterisk$), shen_tail_call(shen_tlstr, V873))((V874 + "$$"))) : (((shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), V873) && shen_tail_call(function() {return shen_equal$question$_js("'", V873[0]);}))) ? (shen_tail_call(shen_get_fn_js(js_str_js_from_shen$asterisk$), shen_tail_call(shen_tlstr, V873))((V874 + "$quote$"))) : (((shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), V873) && shen_tail_call(function() {return shen_equal$question$_js("`", V873[0]);}))) ? (shen_tail_call(shen_get_fn_js(js_str_js_from_shen$asterisk$), shen_tail_call(shen_tlstr, V873))((V874 + "$bquote$"))) : (((shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), V873) && shen_tail_call(function() {return shen_equal$question$_js("/", V873[0]);}))) ? (shen_tail_call(shen_get_fn_js(js_str_js_from_shen$asterisk$), shen_tail_call(shen_tlstr, V873))((V874 + "$slash$"))) : (((shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), V873) && shen_tail_call(function() {return shen_equal$question$_js("*", V873[0]);}))) ? (shen_tail_call(shen_get_fn_js(js_str_js_from_shen$asterisk$), shen_tail_call(shen_tlstr, V873))((V874 + "$asterisk$"))) : (((shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), V873) && shen_tail_call(function() {return shen_equal$question$_js("+", V873[0]);}))) ? (shen_tail_call(shen_get_fn_js(js_str_js_from_shen$asterisk$), shen_tail_call(shen_tlstr, V873))((V874 + "$plus$"))) : (((shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), V873) && shen_tail_call(function() {return shen_equal$question$_js("%", V873[0]);}))) ? (shen_tail_call(shen_get_fn_js(js_str_js_from_shen$asterisk$), shen_tail_call(shen_tlstr, V873))((V874 + "$percent$"))) : (((shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), V873) && shen_tail_call(function() {return shen_equal$question$_js("=", V873[0]);}))) ? (shen_tail_call(shen_get_fn_js(js_str_js_from_shen$asterisk$), shen_tail_call(shen_tlstr, V873))((V874 + "$eq$"))) : (((shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), V873) && shen_tail_call(function() {return shen_equal$question$_js("?", V873[0]);}))) ? (shen_tail_call(shen_get_fn_js(js_str_js_from_shen$asterisk$), shen_tail_call(shen_tlstr, V873))((V874 + "$question$"))) : (((shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), V873) && shen_tail_call(function() {return shen_equal$question$_js("!", V873[0]);}))) ? (shen_tail_call(shen_get_fn_js(js_str_js_from_shen$asterisk$), shen_tail_call(shen_tlstr, V873))((V874 + "$excl$"))) : (((shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), V873) && shen_tail_call(function() {return shen_equal$question$_js(">", V873[0]);}))) ? (shen_tail_call(shen_get_fn_js(js_str_js_from_shen$asterisk$), shen_tail_call(shen_tlstr, V873))((V874 + "$gt$"))) : (((shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), V873) && shen_tail_call(function() {return shen_equal$question$_js("<", V873[0]);}))) ? (shen_tail_call(shen_get_fn_js(js_str_js_from_shen$asterisk$), shen_tail_call(shen_tlstr, V873))((V874 + "$lt$"))) : (((shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), V873) && shen_tail_call(function() {return shen_equal$question$_js(".", V873[0]);}))) ? (shen_tail_call(shen_get_fn_js(js_str_js_from_shen$asterisk$), shen_tail_call(shen_tlstr, V873))((V874 + "$dot$"))) : (((shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), V873) && shen_tail_call(function() {return shen_equal$question$_js("|", V873[0]);}))) ? (shen_tail_call(shen_get_fn_js(js_str_js_from_shen$asterisk$), shen_tail_call(shen_tlstr, V873))((V874 + "$bar$"))) : (((shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), V873) && shen_tail_call(function() {return shen_equal$question$_js("#", V873[0]);}))) ? (shen_tail_call(shen_get_fn_js(js_str_js_from_shen$asterisk$), shen_tail_call(shen_tlstr, V873))((V874 + "$sharp$"))) : (((shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), V873) && shen_tail_call(function() {return shen_equal$question$_js("~", V873[0]);}))) ? (shen_tail_call(shen_get_fn_js(js_str_js_from_shen$asterisk$), shen_tail_call(shen_tlstr, V873))((V874 + "$tilde$"))) : (((shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), V873) && shen_tail_call(function() {return shen_equal$question$_js(":", V873[0]);}))) ? (shen_tail_call(shen_get_fn_js(js_str_js_from_shen$asterisk$), shen_tail_call(shen_tlstr, V873))((V874 + "$colon$"))) : (((shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), V873) && shen_tail_call(function() {return shen_equal$question$_js(";", V873[0]);}))) ? (shen_tail_call(shen_get_fn_js(js_str_js_from_shen$asterisk$), shen_tail_call(shen_tlstr, V873))((V874 + "$sc$"))) : (((shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), V873) && shen_tail_call(function() {return shen_equal$question$_js("@", V873[0]);}))) ? (shen_tail_call(shen_get_fn_js(js_str_js_from_shen$asterisk$), shen_tail_call(shen_tlstr, V873))((V874 + "$at$"))) : (((shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), V873) && shen_tail_call(function() {return shen_equal$question$_js("&", V873[0]);}))) ? (shen_tail_call(shen_get_fn_js(js_str_js_from_shen$asterisk$), shen_tail_call(shen_tlstr, V873))((V874 + "$amp$"))) : (((shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), V873) && shen_tail_call(function() {return shen_equal$question$_js("{", V873[0]);}))) ? (shen_tail_call(shen_get_fn_js(js_str_js_from_shen$asterisk$), shen_tail_call(shen_tlstr, V873))((V874 + "$cbraceopen$"))) : (((shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), V873) && shen_tail_call(function() {return shen_equal$question$_js("}", V873[0]);}))) ? (shen_tail_call(shen_get_fn_js(js_str_js_from_shen$asterisk$), shen_tail_call(shen_tlstr, V873))((V874 + "$cbraceclose$"))) : ((shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), V873)) ? (shen_tail_call(shen_get_fn_js(js_str_js_from_shen$asterisk$), shen_tail_call(shen_tlstr, V873))((V874 + V873[0]))) : (shen_get_fn_js(shen_f$_error)([shen_type_symbol, "js_str_js_from_shen$asterisk$"]))))))))))))))))))))))))))));});});
}
js_str_js_from_shen$asterisk$;

function js_str_js_from_shen(V875) {
  if (V875 == undefined) return js_str_js_from_shen;
  return ((shen_tail_call(shen_tail_call(shen_element$question$, V875), [shen_type_cons, "return", [shen_type_cons, "new", [shen_type_cons, "delete", [shen_type_cons, "function", [shen_type_cons, "while", [shen_type_cons, "for", [shen_type_cons, "var", [shen_type_cons, "if", [shen_type_cons, "do", [shen_type_cons, "in", [shen_type_cons, "super", []]]]]]]]]]]])) ? ("shen_" + V875) : (shen_tail_call(shen_get_fn_js(js_str_js_from_shen$asterisk$), V875)("")));
}
js_str_js_from_shen;

function js_sym_js_from_shen(V876) {
  if (V876 == undefined) return js_sym_js_from_shen;
  return shen_intern_js(shen_tail_call(shen_get_fn_js(js_str_js_from_shen), shen_tail_call(shen_str, V876)));
}
js_sym_js_from_shen;

(shen_globals[[shen_type_symbol, "js_js_backslash"][1]] = 92);

(shen_globals[[shen_type_symbol, "js_js_dquote"][1]] = 34);

function js_esc_string(V877) {
  if (V877 == undefined) return js_esc_string;
  return (function lambda1302(V878) {return (V878 == undefined) ? lambda1302 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js("", V877);})) ? V878 : (((shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), V877) && (shen_tail_call(function() {return shen_equal$question$_js(shen_tail_call(shen_get_fn_js(shen_unit_string_$gt$byte), V877[0]), shen_tail_call(shen_value, [shen_type_symbol, "js_js_backslash"]));}) || shen_tail_call(function() {return shen_equal$question$_js(shen_tail_call(shen_get_fn_js(shen_unit_string_$gt$byte), V877[0]), shen_tail_call(shen_value, [shen_type_symbol, "js_js_dquote"]));})))) ? ((function(P) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(js_esc_string), shen_tail_call(shen_tlstr, V877))(shen_tail_call(shen_tail_call(shen_intmake_string, "~A~A~A"), [shen_tuple, V878, [shen_tuple, P, [shen_tuple, V877[0], []]]])));});})(shen_tail_call(shen_n_$gt$string, shen_tail_call(shen_value, [shen_type_symbol, "js_js_backslash"]))))
 : (((shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), V877) && shen_tail_call(function() {return shen_equal$question$_js(shen_tail_call(shen_get_fn_js(shen_unit_string_$gt$byte), V877[0]), 10);}))) ? (shen_tail_call(shen_get_fn_js(js_esc_string), shen_tail_call(shen_tlstr, V877))((V878 + "\\x0a"))) : (((shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), V877) && shen_tail_call(function() {return shen_equal$question$_js(shen_tail_call(shen_get_fn_js(shen_unit_string_$gt$byte), V877[0]), 13);}))) ? (shen_tail_call(shen_get_fn_js(js_esc_string), shen_tail_call(shen_tlstr, V877))((V878 + "\\x0d"))) : ((shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), V877)) ? (shen_tail_call(shen_get_fn_js(js_esc_string), shen_tail_call(shen_tlstr, V877))((V878 + V877[0]))) : (shen_get_fn_js(shen_f$_error)([shen_type_symbol, "js_esc_string"])))))));});});
}
js_esc_string;

(shen_globals[[shen_type_symbol, "js_js_int_funcs"][1]] = [shen_type_cons, [shen_type_cons, [shen_type_cons, [shen_type_symbol, "X"], []], [shen_type_cons, [shen_type_symbol, "hd"], [shen_type_cons, [shen_type_symbol, "tl"], [shen_type_cons, [shen_type_symbol, "not"], [shen_type_cons, [shen_type_symbol, "thaw"], [shen_type_cons, [shen_type_symbol, "string$question$"], [shen_type_cons, [shen_type_symbol, "number$question$"], [shen_type_cons, [shen_type_symbol, "symbol$question$"], [shen_type_cons, [shen_type_symbol, "cons$question$"], [shen_type_cons, [shen_type_symbol, "vector$question$"], [shen_type_cons, [shen_type_symbol, "absvector$question$"], [shen_type_cons, [shen_type_symbol, "value"], [shen_type_cons, [shen_type_symbol, "intern"], [shen_type_cons, [shen_type_symbol, "vector"], [shen_type_cons, [shen_type_symbol, "read_byte"], [shen_type_cons, [shen_type_symbol, "close"], [shen_type_cons, [shen_type_symbol, "absvector"], [shen_type_cons, [shen_type_symbol, "str"], [shen_type_cons, [shen_type_symbol, "tlstr"], [shen_type_cons, [shen_type_symbol, "n_$gt$string"], [shen_type_cons, [shen_type_symbol, "empty$question$"], []]]]]]]]]]]]]]]]]]]]]], [shen_type_cons, [shen_type_cons, [shen_type_cons, [shen_type_symbol, "X"], [shen_type_cons, [shen_type_symbol, "Y"], []]], [shen_type_cons, [shen_type_symbol, "$plus$"], [shen_type_cons, [shen_type_symbol, "_"], [shen_type_cons, [shen_type_symbol, "$asterisk$"], [shen_type_cons, [shen_type_symbol, "$slash$"], [shen_type_cons, [shen_type_symbol, "and"], [shen_type_cons, [shen_type_symbol, "or"], [shen_type_cons, [shen_type_symbol, "$eq$"], [shen_type_cons, [shen_type_symbol, "$gt$"], [shen_type_cons, [shen_type_symbol, "$gt$$eq$"], [shen_type_cons, [shen_type_symbol, "$lt$"], [shen_type_cons, [shen_type_symbol, "$lt$$eq$"], [shen_type_cons, [shen_type_symbol, "cons"], [shen_type_cons, [shen_type_symbol, "set"], [shen_type_cons, [shen_type_symbol, "$lt$_address"], [shen_type_cons, [shen_type_symbol, "cn"], [shen_type_cons, [shen_type_symbol, "pos"], [shen_type_cons, [shen_type_symbol, "$at$p"], [shen_type_cons, [shen_type_symbol, "js_write_byte"], []]]]]]]]]]]]]]]]]]]], [shen_type_cons, [shen_type_cons, [shen_type_cons, [shen_type_symbol, "X"], [shen_type_cons, [shen_type_symbol, "Y"], [shen_type_cons, [shen_type_symbol, "Z"], []]]], [shen_type_cons, [shen_type_symbol, "address_$gt$"], [shen_type_cons, [shen_type_symbol, "open"], []]]], []]]]);

(shen_globals[[shen_type_symbol, "shen_js_rename_sym"][1]] = [shen_type_cons, [shen_type_symbol, "load"], [shen_type_cons, [shen_type_symbol, "print"], [shen_type_cons, [shen_type_symbol, "eval"], [shen_type_cons, [shen_type_symbol, "read"], [shen_type_cons, [shen_type_symbol, "js_readline"], [shen_type_cons, [shen_type_symbol, "$at$p"], [shen_type_cons, [shen_type_symbol, "js_write"], [shen_type_cons, [shen_type_symbol, "js_putstr"], []]]]]]]]]);

function js_js_int_func$asterisk$$question$(V883) {
  if (V883 == undefined) return js_js_int_func$asterisk$$question$;
  return (function lambda1303(V884) {return (V884 == undefined) ? lambda1303 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V884))) ? false : (((shen_is_type_js(V884, shen_type_cons) && shen_is_type_js(V884[1], shen_type_cons))) ? (shen_tail_call(shen_tail_call(shen_element$question$, V883), V884[1][2]) || shen_tail_call(shen_tail_call(shen_get_fn_js(js_js_int_func$asterisk$$question$), V883), V884[2])) : (shen_get_fn_js(shen_f$_error)([shen_type_symbol, "js_js_int_func$asterisk$$question$"]))));});});
}
js_js_int_func$asterisk$$question$;

function js_js_int_func$question$(V885) {
  if (V885 == undefined) return js_js_int_func$question$;
  return (shen_tail_call(shen_get_fn_js(js_js_int_func$asterisk$$question$), V885)(shen_tail_call(shen_value, [shen_type_symbol, "js_js_int_funcs"])));
}
js_js_int_func$question$;

function js_cut_shen_prefix(V886) {
  if (V886 == undefined) return js_cut_shen_prefix;
  return (((shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), V886) && (shen_tail_call(function() {return shen_equal$question$_js("s", V886[0]);}) && (shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), shen_tail_call(shen_tlstr, V886)) && (shen_tail_call(function() {return shen_equal$question$_js("h", shen_tail_call(shen_tlstr, V886)[0]);}) && (shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), shen_tail_call(shen_tlstr, shen_tail_call(shen_tlstr, V886))) && (shen_tail_call(function() {return shen_equal$question$_js("e", shen_tail_call(shen_tlstr, shen_tail_call(shen_tlstr, V886))[0]);}) && (shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), shen_tail_call(shen_tlstr, shen_tail_call(shen_tlstr, shen_tail_call(shen_tlstr, V886)))) && (shen_tail_call(function() {return shen_equal$question$_js("n", shen_tail_call(shen_tlstr, shen_tail_call(shen_tlstr, shen_tail_call(shen_tlstr, V886)))[0]);}) && (shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), shen_tail_call(shen_tlstr, shen_tail_call(shen_tlstr, shen_tail_call(shen_tlstr, shen_tail_call(shen_tlstr, V886))))) && shen_tail_call(function() {return shen_equal$question$_js("-", shen_tail_call(shen_tlstr, shen_tail_call(shen_tlstr, shen_tail_call(shen_tlstr, shen_tail_call(shen_tlstr, V886))))[0]);}))))))))))) ? (shen_tlstr(shen_tail_call(shen_tlstr, shen_tail_call(shen_tlstr, shen_tail_call(shen_tlstr, shen_tail_call(shen_tlstr, V886)))))) : (((shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), V886) && (shen_tail_call(function() {return shen_equal$question$_js("s", V886[0]);}) && (shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), shen_tail_call(shen_tlstr, V886)) && (shen_tail_call(function() {return shen_equal$question$_js("h", shen_tail_call(shen_tlstr, V886)[0]);}) && (shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), shen_tail_call(shen_tlstr, shen_tail_call(shen_tlstr, V886))) && (shen_tail_call(function() {return shen_equal$question$_js("e", shen_tail_call(shen_tlstr, shen_tail_call(shen_tlstr, V886))[0]);}) && (shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), shen_tail_call(shen_tlstr, shen_tail_call(shen_tlstr, shen_tail_call(shen_tlstr, V886)))) && (shen_tail_call(function() {return shen_equal$question$_js("n", shen_tail_call(shen_tlstr, shen_tail_call(shen_tlstr, shen_tail_call(shen_tlstr, V886)))[0]);}) && (shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), shen_tail_call(shen_tlstr, shen_tail_call(shen_tlstr, shen_tail_call(shen_tlstr, shen_tail_call(shen_tlstr, V886))))) && shen_tail_call(function() {return shen_equal$question$_js("_", shen_tail_call(shen_tlstr, shen_tail_call(shen_tlstr, shen_tail_call(shen_tlstr, shen_tail_call(shen_tlstr, V886))))[0]);}))))))))))) ? (shen_tlstr(shen_tail_call(shen_tlstr, shen_tail_call(shen_tlstr, shen_tail_call(shen_tlstr, shen_tail_call(shen_tlstr, V886)))))) : V886));
}
js_cut_shen_prefix;

(shen_globals[[shen_type_symbol, "shen_nonfunc_symbol"][1]] = [shen_type_cons, [shen_type_symbol, "shen_if"], [shen_type_cons, [shen_type_symbol, "cond"], [shen_type_cons, [shen_type_symbol, "defun"], [shen_type_cons, [shen_type_symbol, "type"], [shen_type_cons, [shen_type_symbol, "lambda"], [shen_type_cons, [shen_type_symbol, "let"], [shen_type_cons, [shen_type_symbol, "freeze"], [shen_type_cons, [shen_type_symbol, "and"], [shen_type_cons, [shen_type_symbol, "or"], [shen_type_cons, [shen_type_symbol, "shen_in"], [shen_type_cons, [shen_type_symbol, "out"], [shen_type_cons, true, [shen_type_cons, false, [shen_type_cons, [shen_type_symbol, "where"], [shen_type_cons, [shen_type_symbol, "define"], [shen_type_cons, [shen_type_symbol, "declare"], []]]]]]]]]]]]]]]]]);

function js_func_name(V892) {
  if (V892 == undefined) return js_func_name;
  return (function lambda1304(V893) {return (V893 == undefined) ? lambda1304 : new Shen_tco_obj(function() {return ((((!shen_tail_call(shen_tail_call(shen_element$question$, V892), V893)) && ((!shen_tail_call(shen_tail_call(shen_element$question$, V892), shen_tail_call(shen_value, [shen_type_symbol, "shen_nonfunc_symbol"]))) && (shen_tail_call(shen_tail_call(shen_element$question$, V892), shen_tail_call(shen_value, [shen_type_symbol, "shen_js_rename_sym"])) || (shen_tail_call(shen_get_fn_js(js_js_int_func$question$), V892) || (shen_tail_call(shen_get_fn_js(shen_sysfunc$question$), V892) || shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$installing_kl$asterisk$"]))))))) ? shen_intern_js(("shen_" + shen_tail_call(shen_get_fn_js(js_cut_shen_prefix), shen_tail_call(shen_get_fn_js(js_str_js_from_shen), shen_tail_call(shen_str, V892))))) : ((shen_is_type_js(V892, shen_type_symbol)) ? (shen_get_fn_js(js_sym_js_from_shen)(V892)) : V892));});});
}
js_func_name;

function js_esc_obj(V899) {
  if (V899 == undefined) return js_esc_obj;
  return (function lambda1305(V900) {return (V900 == undefined) ? lambda1305 : new Shen_tco_obj(function() {return (((typeof(V899) == 'string')) ? (shen_tail_call(shen_intmake_string, "\"~A\"")([shen_tuple, shen_tail_call(shen_tail_call(shen_get_fn_js(js_esc_string), V899), ""), []])) : ((shen_tail_call(shen_get_fn_js(shen_sysfunc$question$), V899)) ? (shen_tail_call(shen_get_fn_js(js_func_name), V899)(V900)) : V899));});});
}
js_esc_obj;

function js_str_join$asterisk$(V901) {
  if (V901 == undefined) return js_str_join$asterisk$;
  return (function lambda1307(V902) {return (V902 == undefined) ? lambda1307 : new Shen_tco_obj(function() {return (function lambda1306(V903) {return (V903 == undefined) ? lambda1306 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V901))) ? V903 : (((shen_is_type_js(V901, shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js("", V903);}))) ? (shen_tail_call(shen_tail_call(shen_get_fn_js(js_str_join$asterisk$), V901[2]), V902)(V901[1])) : ((shen_is_type_js(V901, shen_type_cons)) ? (shen_tail_call(shen_tail_call(shen_get_fn_js(js_str_join$asterisk$), V901[2]), V902)(shen_tail_call(shen_tail_call(shen_intmake_string, "~A~A~A"), [shen_tuple, V903, [shen_tuple, V902, [shen_tuple, V901[1], []]]]))) : (shen_get_fn_js(shen_f$_error)([shen_type_symbol, "js_str_join$asterisk$"])))));});});});});
}
js_str_join$asterisk$;

function js_str_join(V904) {
  if (V904 == undefined) return js_str_join;
  return (function lambda1308(V905) {return (V905 == undefined) ? lambda1308 : new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(js_str_join$asterisk$), V904), V905)(""));});});
}
js_str_join;

function js_arg_list(V906) {
  if (V906 == undefined) return js_arg_list;
  return (shen_tail_call(shen_get_fn_js(js_str_join), V906)(", "));
}
js_arg_list;

function js_tail_call_ret(V907) {
  if (V907 == undefined) return js_tail_call_ret;
  return (shen_tail_call(shen_intmake_string, "new Shen_tco_obj(function() {return ~A;})")([shen_tuple, V907, []]));
}
js_tail_call_ret;

function js_tail_call(V908) {
  if (V908 == undefined) return js_tail_call;
  return (shen_tail_call(shen_intmake_string, "shen_tail_call(function() {return ~A;})")([shen_tuple, V908, []]));
}
js_tail_call;

function js_emit_funcall(V909) {
  if (V909 == undefined) return js_emit_funcall;
  return (function lambda1310(V910) {return (V910 == undefined) ? lambda1310 : new Shen_tco_obj(function() {return (function lambda1309(V911) {return (V911 == undefined) ? lambda1309 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(false, V911);})) ? (shen_tail_call(shen_intmake_string, "~A(~A)")([shen_tuple, V909, [shen_tuple, shen_tail_call(shen_get_fn_js(js_arg_list), V910), []]])) : ((shen_tail_call(function() {return shen_equal$question$_js(true, V911);})) ? (shen_get_fn_js(js_tail_call_ret)(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_emit_funcall), V909), V910), false))) : (shen_get_fn_js(shen_f$_error)([shen_type_symbol, "js_emit_funcall"]))));});});});});
}
js_emit_funcall;

function js_get_func_obj(V916) {
  if (V916 == undefined) return js_get_func_obj;
  return (function lambda1312(V917) {return (V917 == undefined) ? lambda1312 : new Shen_tco_obj(function() {return (function lambda1311(V918) {return (V918 == undefined) ? lambda1311 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(true, V918);})) ? (shen_tail_call(shen_intmake_string, "shen_get_fn_js(~A)")([shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_get_func_obj), V916), V917), false), []])) : (((shen_tail_call(function() {return shen_equal$question$_js(false, V918);}) && shen_is_type_js(V916, shen_type_symbol))) ? (shen_tail_call(shen_get_fn_js(js_func_name), V916)(V917)) : ((shen_tail_call(function() {return shen_equal$question$_js(false, V918);})) ? V916 : (shen_get_fn_js(shen_f$_error)([shen_type_symbol, "js_get_func_obj"])))));});});});});
}
js_get_func_obj;

function js_unwind_funcall(V919) {
  if (V919 == undefined) return js_unwind_funcall;
  return (function lambda1316(V920) {return (V920 == undefined) ? lambda1316 : new Shen_tco_obj(function() {return (function lambda1315(V921) {return (V921 == undefined) ? lambda1315 : new Shen_tco_obj(function() {return (function lambda1314(V922) {return (V922 == undefined) ? lambda1314 : new Shen_tco_obj(function() {return (function lambda1313(V923) {return (V923 == undefined) ? lambda1313 : new Shen_tco_obj(function() {return ((((shen_empty$question$_js(V922)) && shen_tail_call(function() {return shen_equal$question$_js(true, V923);}))) ? (shen_tail_call(shen_intmake_string, "~A()")([shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_get_func_obj), V919), V920), V921), []])) : ((((shen_empty$question$_js(V922)) && shen_tail_call(function() {return shen_equal$question$_js(false, V923);}))) ? (shen_tail_call(shen_intmake_string, "shen_tail_call(~A)")([shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_get_func_obj), V919), V920), V921), []])) : (((shen_is_type_js(V922, shen_type_cons) && ((shen_empty$question$_js(V922[2])) && shen_tail_call(function() {return shen_equal$question$_js(true, V923);})))) ? (shen_tail_call(shen_intmake_string, "(~A(~A))")([shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_get_func_obj), V919), V920), V921), [shen_tuple, V922[1], []]])) : (((shen_is_type_js(V922, shen_type_cons) && ((shen_empty$question$_js(V922[2])) && shen_tail_call(function() {return shen_equal$question$_js(false, V923);})))) ? ((function(F) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_intmake_string, "shen_tail_call(~A, ~A)")([shen_tuple, F, [shen_tuple, V922[1], []]]));});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_get_func_obj), V919), V920), V921)))
 : ((shen_is_type_js(V922, shen_type_cons)) ? ((function(S) {return new Shen_tco_obj(function() {return ((function(F) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_unwind_funcall), shen_tail_call(shen_tail_call(shen_intmake_string, S), [shen_tuple, F, [shen_tuple, V922[1], []]])), V920), false), V922[2])(V923));});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_get_func_obj), V919), V920), V921)))
;});})("shen_tail_call(~A, ~A)"))
 : (shen_get_fn_js(shen_f$_error)([shen_type_symbol, "js_unwind_funcall"])))))));});});});});});});});});
}
js_unwind_funcall;

function js_tail_call_expr(V924) {
  if (V924 == undefined) return js_tail_call_expr;
  return (function lambda1317(V925) {return (V925 == undefined) ? lambda1317 : new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V924), V925)(false));});});
}
js_tail_call_expr;

function js_emit_let(V926) {
  if (V926 == undefined) return js_emit_let;
  return (function lambda1322(V927) {return (V927 == undefined) ? lambda1322 : new Shen_tco_obj(function() {return (function lambda1321(V928) {return (V928 == undefined) ? lambda1321 : new Shen_tco_obj(function() {return (function lambda1320(V929) {return (V929 == undefined) ? lambda1320 : new Shen_tco_obj(function() {return ((function(A) {return new Shen_tco_obj(function() {return ((function(B) {return new Shen_tco_obj(function() {return ((function(Fmt) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_intmake_string, Fmt)([shen_tuple, shen_tail_call(shen_get_fn_js(js_arg_list), A), [shen_tuple, shen_tail_call(shen_get_fn_js(js_tail_call_ret), shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V926), V927), V929)), [shen_tuple, shen_tail_call(shen_get_fn_js(js_arg_list), B), []]]]));});})(((V929) ? "((function(~A) {return ~A;})(~A))~%" : "shen_tail_call((function(~A) {return ~A;}), ~A)~%")))
;});})(shen_tail_call(shen_tail_call(shen_map, (function lambda1319(X) {return (X == undefined) ? lambda1319 : new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(js_tail_call_expr), shen_tail_call(shen_tail, X))(V927));});})), V928)))
;});})(shen_tail_call(shen_tail_call(shen_map, (function lambda1318(X) {return (X == undefined) ? lambda1318 : new Shen_tco_obj(function() {return (shen_get_fn_js(js_sym_js_from_shen)(shen_tail_call(shen_head, X)));});})), V928)))
;});});});});});});
}
js_emit_let;

function js_cond_case(V930) {
  if (V930 == undefined) return js_cond_case;
  return (function lambda1323(V931) {return (V931 == undefined) ? lambda1323 : new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(js_tail_call_expr), V930)(V931));});});
}
js_cond_case;

function js_emit_cond$asterisk$(V932) {
  if (V932 == undefined) return js_emit_cond$asterisk$;
  return (function lambda1325(V933) {return (V933 == undefined) ? lambda1325 : new Shen_tco_obj(function() {return (function lambda1324(V934) {return (V934 == undefined) ? lambda1324 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V932))) ? (shen_tail_call(shen_interror, "cond failure: no default branch")([])) : (((shen_is_type_js(V932, shen_type_cons) && (shen_is_type_js(V932[1], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js(true, V932[1][1]);}) && (shen_is_type_js(V932[1][2], shen_type_cons) && (shen_empty$question$_js(V932[1][2][2]))))))) ? (shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V932[1][2][1]), V933)(V934)) : (((shen_is_type_js(V932, shen_type_cons) && (shen_is_type_js(V932[1], shen_type_cons) && (shen_is_type_js(V932[1][2], shen_type_cons) && (shen_empty$question$_js(V932[1][2][2])))))) ? (shen_tail_call(shen_intmake_string, "((~A) ? ~A : ~A)")([shen_tuple, shen_tail_call(shen_tail_call(shen_get_fn_js(js_cond_case), V932[1][1]), V933), [shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V932[1][2][1]), V933), V934), [shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_emit_cond$asterisk$), V932[2]), V933), V934), []]]])) : (shen_get_fn_js(shen_f$_error)([shen_type_symbol, "js_emit_cond$asterisk$"])))));});});});});
}
js_emit_cond$asterisk$;

function js_emit_cond(V935) {
  if (V935 == undefined) return js_emit_cond;
  return (function lambda1327(V936) {return (V936 == undefined) ? lambda1327 : new Shen_tco_obj(function() {return (function lambda1326(V937) {return (V937 == undefined) ? lambda1326 : new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(js_emit_cond$asterisk$), V935), V936)(V937));});});});});
}
js_emit_cond;

function js_emit_lambda(V938) {
  if (V938 == undefined) return js_emit_lambda;
  return (function lambda1328(V939) {return (V939 == undefined) ? lambda1328 : new Shen_tco_obj(function() {return ((function(A) {return new Shen_tco_obj(function() {return ((function(N) {return new Shen_tco_obj(function() {return ((function(S) {return new Shen_tco_obj(function() {return ((function(R) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_intmake_string, S)([shen_tuple, N, [shen_tuple, A, [shen_tuple, A, [shen_tuple, N, [shen_tuple, R, []]]]]]));});})(shen_tail_call(shen_get_fn_js(js_tail_call_ret), V939)))
;});})("(function ~A(~A) {return (~A == undefined) ? ~A : ~A;})"))
;});})(shen_tail_call(shen_gensym, [shen_type_symbol, "lambda"])))
;});})(shen_tail_call(shen_get_fn_js(js_sym_js_from_shen), V938)))
;});});
}
js_emit_lambda;

function js_emit_trap_error(V940) {
  if (V940 == undefined) return js_emit_trap_error;
  return (function lambda1332(V941) {return (V941 == undefined) ? lambda1332 : new Shen_tco_obj(function() {return (function lambda1331(V942) {return (V942 == undefined) ? lambda1331 : new Shen_tco_obj(function() {return (function lambda1330(V943) {return (V943 == undefined) ? lambda1330 : new Shen_tco_obj(function() {return (function lambda1329(V944) {return (V944 == undefined) ? lambda1329 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(false, V944);})) ? ((function(Evar) {return new Shen_tco_obj(function() {return ((function(S) {return new Shen_tco_obj(function() {return ((function(EX) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_intmake_string, "trap_error_js(~A, ~A)")([shen_tuple, S, [shen_tuple, EX, []]]));});})(shen_tail_call(shen_tail_call(shen_intmake_string, "function(~A) {return ~A;}"), [shen_tuple, Evar, [shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V942), [shen_type_cons, V941, V943]), false), []]])))
;});})(shen_tail_call(shen_tail_call(shen_intmake_string, "function() {return ~A;}"), [shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V940), V943), false), []])))
;});})(shen_tail_call(shen_get_fn_js(js_sym_js_from_shen), V941)))
 : ((shen_tail_call(function() {return shen_equal$question$_js(true, V944);})) ? (shen_get_fn_js(js_tail_call_ret)(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_emit_trap_error), V940), V941), V942), V943), false))) : (shen_get_fn_js(shen_f$_error)([shen_type_symbol, "js_emit_trap_error"]))));});});});});});});});});
}
js_emit_trap_error;

function js_emit_func_ret(V945) {
  if (V945 == undefined) return js_emit_func_ret;
  return (function lambda1336(V946) {return (V946 == undefined) ? lambda1336 : new Shen_tco_obj(function() {return (function lambda1335(V947) {return (V947 == undefined) ? lambda1335 : new Shen_tco_obj(function() {return (function lambda1334(V948) {return (V948 == undefined) ? lambda1334 : new Shen_tco_obj(function() {return ((function(Args) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_unwind_funcall), V945), V947), false), Args)(V948));});})(shen_tail_call(shen_tail_call(shen_map, (function lambda1333(V946) {return (V946 == undefined) ? lambda1333 : new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V946), V947)(false));});})), V946)))
;});});});});});});
}
js_emit_func_ret;

function js_emit_empty(V949) {
  if (V949 == undefined) return js_emit_empty;
  return (function lambda1337(V950) {return (V950 == undefined) ? lambda1337 : new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_emit_func_ret), [shen_type_symbol, "shen_empty$question$_js"]), [shen_type_cons, V949, []]), V950)(true));});});
}
js_emit_empty;

function js_predicate_op(V997) {
  if (V997 == undefined) return js_predicate_op;
  return (function lambda1340(V998) {return (V998 == undefined) ? lambda1340 : new Shen_tco_obj(function() {return (function lambda1339(V999) {return (V999 == undefined) ? lambda1339 : new Shen_tco_obj(function() {return (function lambda1338(V1000) {return (V1000 == undefined) ? lambda1338 : new Shen_tco_obj(function() {return (((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "number$question$"], V997);}) && (typeof(V999) == 'number'))) ? true : (((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "string$question$"], V997);}) && (typeof(V999) == 'string'))) ? true : (((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "boolean$question$"], V997);}) && shen_tail_call(function() {return shen_equal$question$_js(true, V999);}))) ? true : (((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "boolean$question$"], V997);}) && shen_tail_call(function() {return shen_equal$question$_js(false, V999);}))) ? true : ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "boolean$question$"], V997);})) ? (shen_tail_call(shen_intmake_string, "~A(~A)")([shen_tuple, shen_tail_call(shen_get_fn_js(js_sym_js_from_shen), [shen_type_symbol, "shen_boolean$question$_js"]), [shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V998), V999), false), []]])) : ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "string$question$"], V997);})) ? (shen_tail_call(shen_intmake_string, "(typeof(~A) == 'string')")([shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V998), V999), false), []])) : ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "number$question$"], V997);})) ? (shen_tail_call(shen_intmake_string, "(typeof(~A) == 'number')")([shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V998), V999), false), []])) : ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "symbol$question$"], V997);})) ? (shen_tail_call(shen_intmake_string, "shen_is_type_js(~A, ~A)")([shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V998), V999), false), [shen_tuple, "shen_type_symbol", []]])) : ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "cons$question$"], V997);})) ? (shen_tail_call(shen_intmake_string, "shen_is_type_js(~A, ~A)")([shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V998), V999), false), [shen_tuple, "shen_type_cons", []]])) : ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "tuple$question$"], V997);})) ? (shen_tail_call(shen_intmake_string, "shen_is_type_js(~A, ~A)")([shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V998), V999), false), [shen_tuple, "shen_tuple", []]])) : ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "vector$question$"], V997);})) ? (shen_tail_call(shen_intmake_string, "~A(~A)")([shen_tuple, shen_tail_call(shen_get_fn_js(js_sym_js_from_shen), [shen_type_symbol, "shen_vector$question$_js"]), [shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V998), V999), false), []]])) : ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "empty$question$"], V997);})) ? (shen_tail_call(shen_get_fn_js(js_emit_empty), V998)(V999)) : ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "absvector$question$"], V997);})) ? (shen_tail_call(shen_intmake_string, "~A(~A)")([shen_tuple, shen_tail_call(shen_get_fn_js(js_sym_js_from_shen), [shen_type_symbol, "shen_absvector$question$_js"]), [shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V998), V999), false), []]])) : shen_fail_obj)))))))))))));});});});});});});
}
js_predicate_op;

function js_math_op(V1025) {
  if (V1025 == undefined) return js_math_op;
  return (function lambda1343(V1026) {return (V1026 == undefined) ? lambda1343 : new Shen_tco_obj(function() {return (function lambda1342(V1027) {return (V1027 == undefined) ? lambda1342 : new Shen_tco_obj(function() {return (function lambda1341(V1028) {return (V1028 == undefined) ? lambda1341 : new Shen_tco_obj(function() {return (((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$plus$"], V1025);}) && (shen_is_type_js(V1026, shen_type_cons) && (shen_is_type_js(V1026[2], shen_type_cons) && ((shen_empty$question$_js(V1026[2][2])) && ((typeof(V1026[1]) == 'number') && (typeof(V1026[2][1]) == 'number'))))))) ? (V1026[1] + V1026[2][1]) : (((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "_"], V1025);}) && (shen_is_type_js(V1026, shen_type_cons) && (shen_is_type_js(V1026[2], shen_type_cons) && ((shen_empty$question$_js(V1026[2][2])) && ((typeof(V1026[1]) == 'number') && (typeof(V1026[2][1]) == 'number'))))))) ? (V1026[1] - V1026[2][1]) : (((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$asterisk$"], V1025);}) && (shen_is_type_js(V1026, shen_type_cons) && (shen_is_type_js(V1026[2], shen_type_cons) && ((shen_empty$question$_js(V1026[2][2])) && ((typeof(V1026[1]) == 'number') && (typeof(V1026[2][1]) == 'number'))))))) ? (V1026[1] * V1026[2][1]) : (((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$slash$"], V1025);}) && (shen_is_type_js(V1026, shen_type_cons) && (shen_is_type_js(V1026[2], shen_type_cons) && ((shen_empty$question$_js(V1026[2][2])) && ((typeof(V1026[1]) == 'number') && (typeof(V1026[2][1]) == 'number'))))))) ? (V1026[1] / V1026[2][1]) : (((shen_is_type_js(V1026, shen_type_cons) && (shen_is_type_js(V1026[2], shen_type_cons) && ((shen_empty$question$_js(V1026[2][2])) && shen_tail_call(shen_tail_call(shen_element$question$, V1025), [shen_type_cons, [shen_type_symbol, "$plus$"], [shen_type_cons, [shen_type_symbol, "_"], [shen_type_cons, [shen_type_symbol, "$asterisk$"], [shen_type_cons, [shen_type_symbol, "$slash$"], []]]]]))))) ? (shen_tail_call(shen_intmake_string, "(~A ~A ~A)")([shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1026[1]), V1027), false), [shen_tuple, V1025, [shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1026[2][1]), V1027), false), []]]])) : shen_fail_obj)))));});});});});});});
}
js_math_op;

function js_equality_op(V1051) {
  if (V1051 == undefined) return js_equality_op;
  return (function lambda1345(V1052) {return (V1052 == undefined) ? lambda1345 : new Shen_tco_obj(function() {return (function lambda1344(V1053) {return (V1053 == undefined) ? lambda1344 : new Shen_tco_obj(function() {return (((shen_is_type_js(V1051, shen_type_cons) && (shen_is_type_js(V1051[2], shen_type_cons) && ((shen_empty$question$_js(V1051[2][2])) && ((typeof(V1051[1]) == 'number') && (typeof(V1051[2][1]) == 'number')))))) ? shen_equal$question$_js(V1051[1], V1051[2][1]) : (((shen_is_type_js(V1051, shen_type_cons) && (shen_is_type_js(V1051[2], shen_type_cons) && ((shen_empty$question$_js(V1051[2][2])) && ((typeof(V1051[1]) == 'string') && (typeof(V1051[2][1]) == 'string')))))) ? shen_equal$question$_js(V1051[1], V1051[2][1]) : (((shen_is_type_js(V1051, shen_type_cons) && (shen_is_type_js(V1051[2], shen_type_cons) && ((shen_empty$question$_js(V1051[2][2])) && (shen_boolean$question$_js(V1051[1]) && shen_boolean$question$_js(V1051[2][1])))))) ? shen_equal$question$_js(V1051[1], V1051[2][1]) : (((shen_is_type_js(V1051, shen_type_cons) && (shen_is_type_js(V1051[2], shen_type_cons) && ((shen_empty$question$_js(V1051[2][1])) && (shen_empty$question$_js(V1051[2][2])))))) ? (shen_tail_call(shen_get_fn_js(js_emit_empty), V1051[1])(V1052)) : (((shen_is_type_js(V1051, shen_type_cons) && ((shen_empty$question$_js(V1051[1])) && (shen_is_type_js(V1051[2], shen_type_cons) && (shen_empty$question$_js(V1051[2][2])))))) ? (shen_tail_call(shen_get_fn_js(js_emit_empty), V1051[2][1])(V1052)) : (((shen_is_type_js(V1051, shen_type_cons) && (shen_is_type_js(V1051[2], shen_type_cons) && ((shen_empty$question$_js(V1051[2][2])) && shen_tail_call(function() {return shen_equal$question$_js(true, V1053);}))))) ? (shen_tail_call(shen_intmake_string, "~A(~A, ~A)")([shen_tuple, shen_tail_call(shen_get_fn_js(js_sym_js_from_shen), [shen_type_symbol, "shen_equal$question$_js"]), [shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1051[1]), V1052), false), [shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1051[2][1]), V1052), false), []]]])) : (((shen_is_type_js(V1051, shen_type_cons) && (shen_is_type_js(V1051[2], shen_type_cons) && ((shen_empty$question$_js(V1051[2][2])) && shen_tail_call(function() {return shen_equal$question$_js(false, V1053);}))))) ? (shen_get_fn_js(js_tail_call)(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_equality_op), V1051), V1052), true))) : shen_fail_obj)))))));});});});});
}
js_equality_op;

function js_order_op(V1071) {
  if (V1071 == undefined) return js_order_op;
  return (function lambda1348(V1072) {return (V1072 == undefined) ? lambda1348 : new Shen_tco_obj(function() {return (function lambda1347(V1073) {return (V1073 == undefined) ? lambda1347 : new Shen_tco_obj(function() {return (function lambda1346(V1074) {return (V1074 == undefined) ? lambda1346 : new Shen_tco_obj(function() {return (((shen_is_type_js(V1072, shen_type_cons) && (shen_is_type_js(V1072[2], shen_type_cons) && ((shen_empty$question$_js(V1072[2][2])) && shen_tail_call(shen_tail_call(shen_element$question$, V1071), [shen_type_cons, [shen_type_symbol, "$gt$"], [shen_type_cons, [shen_type_symbol, "$lt$"], [shen_type_cons, [shen_type_symbol, "$gt$$eq$"], [shen_type_cons, [shen_type_symbol, "$lt$$eq$"], []]]]]))))) ? ((function(X) {return new Shen_tco_obj(function() {return ((function(Y) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_intmake_string, "(~A ~A ~A)")([shen_tuple, X, [shen_tuple, V1071, [shen_tuple, Y, []]]]));});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1072[2][1]), V1073), false)))
;});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1072[1]), V1073), false)))
 : shen_fail_obj);});});});});});});
}
js_order_op;

function js_logic_op(V1113) {
  if (V1113 == undefined) return js_logic_op;
  return (function lambda1351(V1114) {return (V1114 == undefined) ? lambda1351 : new Shen_tco_obj(function() {return (function lambda1350(V1115) {return (V1115 == undefined) ? lambda1350 : new Shen_tco_obj(function() {return (function lambda1349(V1116) {return (V1116 == undefined) ? lambda1349 : new Shen_tco_obj(function() {return (((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "not"], V1113);}) && (shen_is_type_js(V1114, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js(false, V1114[1]);}) && (shen_empty$question$_js(V1114[2])))))) ? true : (((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "not"], V1113);}) && (shen_is_type_js(V1114, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js(true, V1114[1]);}) && (shen_empty$question$_js(V1114[2])))))) ? false : (((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "not"], V1113);}) && (shen_is_type_js(V1114, shen_type_cons) && (shen_empty$question$_js(V1114[2]))))) ? (shen_tail_call(shen_intmake_string, "(!~A)")([shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1114[1]), V1115), false), []])) : (((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "and"], V1113);}) && (shen_is_type_js(V1114, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js(false, V1114[1]);}) && (shen_is_type_js(V1114[2], shen_type_cons) && (shen_empty$question$_js(V1114[2][2]))))))) ? false : (((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "or"], V1113);}) && (shen_is_type_js(V1114, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js(true, V1114[1]);}) && (shen_is_type_js(V1114[2], shen_type_cons) && (shen_empty$question$_js(V1114[2][2]))))))) ? true : (((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "and"], V1113);}) && (shen_is_type_js(V1114, shen_type_cons) && (shen_is_type_js(V1114[2], shen_type_cons) && (shen_empty$question$_js(V1114[2][2])))))) ? (shen_tail_call(shen_intmake_string, "(~A && ~A)")([shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1114[1]), V1115), false), [shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1114[2][1]), V1115), false), []]])) : (((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "or"], V1113);}) && (shen_is_type_js(V1114, shen_type_cons) && (shen_is_type_js(V1114[2], shen_type_cons) && (shen_empty$question$_js(V1114[2][2])))))) ? (shen_tail_call(shen_intmake_string, "(~A || ~A)")([shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1114[1]), V1115), false), [shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1114[2][1]), V1115), false), []]])) : shen_fail_obj)))))));});});});});});});
}
js_logic_op;

function js_emit_set(V1117) {
  if (V1117 == undefined) return js_emit_set;
  return (function lambda1353(V1118) {return (V1118 == undefined) ? lambda1353 : new Shen_tco_obj(function() {return (function lambda1352(V1119) {return (V1119 == undefined) ? lambda1352 : new Shen_tco_obj(function() {return (shen_tail_call(shen_intmake_string, "(shen_globals[~A[1]] = ~A)")([shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1117), V1119), false), [shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1118), V1119), false), []]]));});});});});
}
js_emit_set;

function js_emit_freeze(V1120) {
  if (V1120 == undefined) return js_emit_freeze;
  return (function lambda1354(V1121) {return (V1121 == undefined) ? lambda1354 : new Shen_tco_obj(function() {return (shen_tail_call(shen_intmake_string, "(function () {return ~A;})")([shen_tuple, shen_tail_call(shen_get_fn_js(js_tail_call_ret), shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1120), V1121), true)), []]));});});
}
js_emit_freeze;

function js_emit_thaw(V1122) {
  if (V1122 == undefined) return js_emit_thaw;
  return (function lambda1356(V1123) {return (V1123 == undefined) ? lambda1356 : new Shen_tco_obj(function() {return (function lambda1355(V1124) {return (V1124 == undefined) ? lambda1355 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(false, V1124);})) ? (shen_tail_call(shen_intmake_string, "shen_tail_call(~A)")([shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1122), V1123), false), []])) : ((shen_tail_call(function() {return shen_equal$question$_js(true, V1124);})) ? (shen_tail_call(shen_intmake_string, "(~A())")([shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1122), V1123), false), []])) : (shen_get_fn_js(shen_f$_error)([shen_type_symbol, "js_emit_thaw"]))));});});});});
}
js_emit_thaw;

function js_basic_op(V1168) {
  if (V1168 == undefined) return js_basic_op;
  return (function lambda1359(V1169) {return (V1169 == undefined) ? lambda1359 : new Shen_tco_obj(function() {return (function lambda1358(V1170) {return (V1170 == undefined) ? lambda1358 : new Shen_tco_obj(function() {return (function lambda1357(V1171) {return (V1171 == undefined) ? lambda1357 : new Shen_tco_obj(function() {return (((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "intern"], V1168);}) && (shen_is_type_js(V1169, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js("true", V1169[1]);}) && (shen_empty$question$_js(V1169[2])))))) ? "true" : (((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "intern"], V1168);}) && (shen_is_type_js(V1169, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js("false", V1169[1]);}) && (shen_empty$question$_js(V1169[2])))))) ? "false" : (((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "intern"], V1168);}) && (shen_is_type_js(V1169, shen_type_cons) && ((shen_empty$question$_js(V1169[2])) && (typeof(V1169[1]) == 'string'))))) ? (shen_tail_call(shen_intmake_string, "[shen_type_symbol, ~A]")([shen_tuple, shen_tail_call(shen_tail_call(shen_get_fn_js(js_esc_obj), shen_tail_call(shen_get_fn_js(js_str_js_from_shen), V1169[1])), V1170), []])) : (((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "intern"], V1168);}) && (shen_is_type_js(V1169, shen_type_cons) && (shen_empty$question$_js(V1169[2]))))) ? (shen_tail_call(shen_intmake_string, "shen_intern_js(~A)")([shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1169[1]), V1170), false), []])) : (((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "cons"], V1168);}) && (shen_is_type_js(V1169, shen_type_cons) && (shen_is_type_js(V1169[2], shen_type_cons) && (shen_empty$question$_js(V1169[2][2])))))) ? ((function(X) {return new Shen_tco_obj(function() {return ((function(Y) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_intmake_string, "[shen_type_cons, ~A, ~A]")([shen_tuple, X, [shen_tuple, Y, []]]));});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1169[2][1]), V1170), false)))
;});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1169[1]), V1170), false)))
 : (((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$at$p"], V1168);}) && (shen_is_type_js(V1169, shen_type_cons) && (shen_is_type_js(V1169[2], shen_type_cons) && (shen_empty$question$_js(V1169[2][2])))))) ? ((function(X) {return new Shen_tco_obj(function() {return ((function(Y) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_intmake_string, "[shen_tuple, ~A, ~A]")([shen_tuple, X, [shen_tuple, Y, []]]));});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1169[2][1]), V1170), false)))
;});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1169[1]), V1170), false)))
 : (((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "set"], V1168);}) && (shen_is_type_js(V1169, shen_type_cons) && (shen_is_type_js(V1169[2], shen_type_cons) && (shen_empty$question$_js(V1169[2][2])))))) ? (shen_tail_call(shen_tail_call(shen_get_fn_js(js_emit_set), V1169[1]), V1169[2][1])(V1170)) : (((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "thaw"], V1168);}) && (shen_is_type_js(V1169, shen_type_cons) && (shen_empty$question$_js(V1169[2]))))) ? (shen_tail_call(shen_tail_call(shen_get_fn_js(js_emit_thaw), V1169[1]), V1170)(V1171)) : (((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_function"], V1168);}) && (shen_is_type_js(V1169, shen_type_cons) && (shen_empty$question$_js(V1169[2]))))) ? (shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1169[1]), V1170)(true)) : (((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "hd"], V1168);}) && (shen_is_type_js(V1169, shen_type_cons) && (shen_empty$question$_js(V1169[2]))))) ? (shen_tail_call(shen_intmake_string, "~A[1]")([shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1169[1]), V1170), false), []])) : (((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "tl"], V1168);}) && (shen_is_type_js(V1169, shen_type_cons) && (shen_empty$question$_js(V1169[2]))))) ? (shen_tail_call(shen_intmake_string, "~A[2]")([shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1169[1]), V1170), false), []])) : (((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "cn"], V1168);}) && (shen_is_type_js(V1169, shen_type_cons) && (shen_is_type_js(V1169[2], shen_type_cons) && (shen_empty$question$_js(V1169[2][2])))))) ? (shen_tail_call(shen_intmake_string, "(~A + ~A)")([shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1169[1]), V1170), false), [shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1169[2][1]), V1170), false), []]])) : (((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "pos"], V1168);}) && (shen_is_type_js(V1169, shen_type_cons) && (shen_is_type_js(V1169[2], shen_type_cons) && (shen_empty$question$_js(V1169[2][2])))))) ? (shen_tail_call(shen_intmake_string, "~A[~A]")([shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1169[1]), V1170), false), [shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1169[2][1]), V1170), false), []]])) : (((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "address_$gt$"], V1168);}) && (shen_is_type_js(V1169, shen_type_cons) && (shen_is_type_js(V1169[2], shen_type_cons) && (shen_is_type_js(V1169[2][2], shen_type_cons) && (shen_empty$question$_js(V1169[2][2][2]))))))) ? (shen_tail_call(shen_intmake_string, "shen_absvector_set_js(~A, ~A, ~A)")([shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1169[1]), V1170), false), [shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1169[2][1]), V1170), false), [shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1169[2][2][1]), V1170), false), []]]])) : (((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$lt$_address"], V1168);}) && (shen_is_type_js(V1169, shen_type_cons) && (shen_is_type_js(V1169[2], shen_type_cons) && (shen_empty$question$_js(V1169[2][2])))))) ? (shen_tail_call(shen_intmake_string, "shen_absvector_ref_js(~A, ~A)")([shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1169[1]), V1170), false), [shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1169[2][1]), V1170), false), []]])) : shen_fail_obj)))))))))))))));});});});});});});
}
js_basic_op;

function js_emit_do(V1172) {
  if (V1172 == undefined) return js_emit_do;
  return (function lambda1363(V1173) {return (V1173 == undefined) ? lambda1363 : new Shen_tco_obj(function() {return (function lambda1362(V1174) {return (V1174 == undefined) ? lambda1362 : new Shen_tco_obj(function() {return (function lambda1361(V1175) {return (V1175 == undefined) ? lambda1361 : new Shen_tco_obj(function() {return (((shen_is_type_js(V1172, shen_type_cons) && (shen_empty$question$_js(V1172[2])))) ? ((function(Do) {return new Shen_tco_obj(function() {return ((function(Sep) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_intmake_string, "(~A,~%  ~A)")([shen_tuple, shen_tail_call(shen_tail_call(shen_get_fn_js(js_str_join), Do), Sep), [shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1172[1]), V1173), V1174), []]]));});})(shen_tail_call(shen_tail_call(shen_intmake_string, ",~%  "), [])))
;});})(shen_tail_call(shen_tail_call(shen_map, (function lambda1360(Y) {return (Y == undefined) ? lambda1360 : new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), Y), V1173)(false));});})), shen_tail_call(shen_reverse, V1175))))
 : ((shen_is_type_js(V1172, shen_type_cons)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_emit_do), V1172[2]), V1173), V1174)([shen_type_cons, V1172[1], V1175])) : (shen_get_fn_js(shen_f$_error)([shen_type_symbol, "js_emit_do"]))));});});});});});});
}
js_emit_do;

function js_std_op(V1196) {
  if (V1196 == undefined) return js_std_op;
  return (function lambda1366(V1197) {return (V1197 == undefined) ? lambda1366 : new Shen_tco_obj(function() {return (function lambda1365(V1198) {return (V1198 == undefined) ? lambda1365 : new Shen_tco_obj(function() {return (function lambda1364(V1199) {return (V1199 == undefined) ? lambda1364 : new Shen_tco_obj(function() {return ((function(Freeze) {return new Shen_tco_obj(function() {return (((shen_is_type_js(V1197, shen_type_cons) && (shen_empty$question$_js(V1197[2])))) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? (Freeze()) : Result);});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_predicate_op), V1196), V1197[1]), V1198), V1199)))
 : (Freeze()));});})((function () {return new Shen_tco_obj(function() {return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Freeze) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$eq$"], V1196);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? (Freeze()) : Result);});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_equality_op), V1197), V1198), V1199)))
 : (Freeze()));});})((function () {return new Shen_tco_obj(function() {return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? (((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "trap_error"], V1196);}) && (shen_is_type_js(V1197, shen_type_cons) && (shen_is_type_js(V1197[2], shen_type_cons) && (shen_is_type_js(V1197[2][1], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "lambda"], V1197[2][1][1]);}) && (shen_is_type_js(V1197[2][1][2], shen_type_cons) && (shen_is_type_js(V1197[2][1][2][2], shen_type_cons) && ((shen_empty$question$_js(V1197[2][1][2][2][2])) && (shen_empty$question$_js(V1197[2][2]))))))))))) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_emit_trap_error), V1197[1]), V1197[2][1][2][1]), V1197[2][1][2][2][1]), V1198)(V1199)) : ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_do"], V1196);})) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_emit_do), V1197), V1198), V1199)([])) : (((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "fail"], V1196);}) && (shen_empty$question$_js(V1197)))) ? "shen_fail_obj" : shen_fail_obj))) : Result);});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_basic_op), V1196), V1197), V1198), V1199)))
 : Result);});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_order_op), V1196), V1197), V1198), V1199)))
 : Result);});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_logic_op), V1196), V1197), V1198), V1199)))
;});})))
 : Result);});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_math_op), V1196), V1197), V1198), V1199)))
;});})))
;});});});});});});
}
js_std_op;

function js_func_arg(V1200) {
  if (V1200 == undefined) return js_func_arg;
  return (function lambda1367(V1201) {return (V1201 == undefined) ? lambda1367 : new Shen_tco_obj(function() {return ((shen_is_type_js(V1201, shen_type_cons)) ? (shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1201), V1200)(false)) : (shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1201), V1200)(false)));});});
}
js_func_arg;

function js_from_kl_expr(V1220) {
  if (V1220 == undefined) return js_from_kl_expr;
  return (function lambda1369(V1221) {return (V1221 == undefined) ? lambda1369 : new Shen_tco_obj(function() {return (function lambda1368(V1222) {return (V1222 == undefined) ? lambda1368 : new Shen_tco_obj(function() {return (((shen_tail_call(function() {return shen_equal$question$_js(true, V1220);}) && (!shen_tail_call(shen_tail_call(shen_element$question$, true), V1221)))) ? "true" : (((shen_tail_call(function() {return shen_equal$question$_js(false, V1220);}) && (!shen_tail_call(shen_tail_call(shen_element$question$, false), V1221)))) ? "false" : ((shen_tail_call(shen_tail_call(shen_element$question$, V1220), V1221)) ? (shen_get_fn_js(js_sym_js_from_shen)(V1220)) : ((shen_is_type_js(V1220, shen_type_symbol)) ? (shen_tail_call(shen_intmake_string, "[shen_type_symbol, ~S]")([shen_tuple, shen_tail_call(shen_get_fn_js(js_str_js_from_shen), shen_tail_call(shen_str, V1220)), []])) : (((shen_is_type_js(V1220, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_function"], V1220[1]);}) && (shen_is_type_js(V1220[2], shen_type_cons) && ((shen_empty$question$_js(V1220[2][2])) && (shen_tail_call(shen_tail_call(shen_element$question$, V1220[2][1]), V1221) && (!shen_tail_call(shen_get_fn_js(shen_sysfunc$question$), V1220[2][1])))))))) ? (shen_get_fn_js(js_sym_js_from_shen)(V1220[2][1])) : (((shen_is_type_js(V1220, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_function"], V1220[1]);}) && (shen_is_type_js(V1220[2], shen_type_cons) && (shen_empty$question$_js(V1220[2][2])))))) ? (shen_tail_call(shen_get_fn_js(js_func_name), V1220[2][1])(V1221)) : (((shen_is_type_js(V1220, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "cons"], V1220[1]);}) && (shen_is_type_js(V1220[2], shen_type_cons) && (shen_is_type_js(V1220[2][2], shen_type_cons) && (shen_empty$question$_js(V1220[2][2][2]))))))) ? (shen_tail_call(shen_intmake_string, "[shen_type_cons, ~A, ~A]")([shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1220[2][1]), V1221), false), [shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1220[2][2][1]), V1221), false), []]])) : (((shen_is_type_js(V1220, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "type"], V1220[1]);}) && (shen_is_type_js(V1220[2], shen_type_cons) && (shen_is_type_js(V1220[2][2], shen_type_cons) && (shen_empty$question$_js(V1220[2][2][2]))))))) ? (shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1220[2][1]), V1221)(V1222)) : (((shen_is_type_js(V1220, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "lambda"], V1220[1]);}) && (shen_is_type_js(V1220[2], shen_type_cons) && (shen_is_type_js(V1220[2][2], shen_type_cons) && (shen_empty$question$_js(V1220[2][2][2]))))))) ? (shen_tail_call(shen_get_fn_js(js_emit_lambda), V1220[2][1])(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1220[2][2][1]), [shen_type_cons, V1220[2][1], V1221]), true))) : (((shen_is_type_js(V1220, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "let"], V1220[1]);}) && (shen_is_type_js(V1220[2], shen_type_cons) && (shen_is_type_js(V1220[2][2], shen_type_cons) && (shen_is_type_js(V1220[2][2][2], shen_type_cons) && (shen_empty$question$_js(V1220[2][2][2][2])))))))) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_emit_let), V1220[2][2][2][1]), [shen_type_cons, V1220[2][1], V1221]), [shen_type_cons, [shen_type_cons, V1220[2][1], V1220[2][2][1]], []])(V1222)) : (((shen_is_type_js(V1220, shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "cond"], V1220[1]);}))) ? (shen_tail_call(shen_tail_call(shen_get_fn_js(js_emit_cond), V1220[2]), V1221)(V1222)) : (((shen_is_type_js(V1220, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_if"], V1220[1]);}) && (shen_is_type_js(V1220[2], shen_type_cons) && (shen_is_type_js(V1220[2][2], shen_type_cons) && (shen_is_type_js(V1220[2][2][2], shen_type_cons) && (shen_empty$question$_js(V1220[2][2][2][2])))))))) ? (shen_tail_call(shen_tail_call(shen_get_fn_js(js_emit_cond), [shen_type_cons, [shen_type_cons, V1220[2][1], [shen_type_cons, V1220[2][2][1], []]], [shen_type_cons, [shen_type_cons, true, V1220[2][2][2]], []]]), V1221)(V1222)) : (((shen_is_type_js(V1220, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "freeze"], V1220[1]);}) && (shen_is_type_js(V1220[2], shen_type_cons) && (shen_empty$question$_js(V1220[2][2])))))) ? (shen_tail_call(shen_get_fn_js(js_emit_freeze), V1220[2][1])(V1221)) : ((function(Freeze) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V1220, shen_type_cons)) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? (Freeze()) : Result);});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_std_op), V1220[1]), V1220[2]), V1221), V1222)))
 : (Freeze()));});})((function () {return new Shen_tco_obj(function() {return (((shen_is_type_js(V1220, shen_type_cons) && shen_tail_call(shen_tail_call(shen_element$question$, V1220[1]), V1221))) ? ((function(Args) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_unwind_funcall), V1220[1]), V1221), true), Args)(V1222));});})(shen_tail_call(shen_tail_call(shen_map, shen_tail_call(shen_get_fn_js(js_func_arg), V1221)), V1220[2])))
 : (((shen_is_type_js(V1220, shen_type_cons) && shen_is_type_js(V1220[1], shen_type_cons))) ? ((function(F) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_unwind_funcall), F), V1221), false), shen_tail_call(shen_tail_call(shen_map, shen_tail_call(shen_get_fn_js(js_func_arg), V1221)), V1220[2]))(V1222));});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1220[1]), V1221), false)))
 : (((shen_is_type_js(V1220, shen_type_cons) && shen_is_type_js(V1220[1], shen_type_symbol))) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_unwind_funcall), V1220[1]), V1221), (!shen_tail_call(shen_get_fn_js(shen_sysfunc$question$), V1220[1]))), shen_tail_call(shen_tail_call(shen_map, shen_tail_call(shen_get_fn_js(js_func_arg), V1221)), V1220[2]))(V1222)) : (shen_tail_call(shen_get_fn_js(js_esc_obj), V1220)(V1221)))));});})))
)))))))))))));});});});});
}
js_from_kl_expr;

function js_unwind_defun_lambda(V1223) {
  if (V1223 == undefined) return js_unwind_defun_lambda;
  return (function lambda1371(V1224) {return (V1224 == undefined) ? lambda1371 : new Shen_tco_obj(function() {return (function lambda1370(V1225) {return (V1225 == undefined) ? lambda1370 : new Shen_tco_obj(function() {return (((shen_is_type_js(V1223, shen_type_cons) && (shen_empty$question$_js(V1223[2])))) ? (shen_tail_call(shen_get_fn_js(js_emit_lambda), V1223[1])(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1224), [shen_type_cons, V1223[1], V1225]), true))) : ((shen_is_type_js(V1223, shen_type_cons)) ? (shen_tail_call(shen_get_fn_js(js_emit_lambda), V1223[1])(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_unwind_defun_lambda), V1223[2]), V1224), [shen_type_cons, V1223[1], V1225]))) : (shen_get_fn_js(shen_f$_error)([shen_type_symbol, "js_unwind_defun_lambda"]))));});});});});
}
js_unwind_defun_lambda;

function js_emit_defun_1(V1226) {
  if (V1226 == undefined) return js_emit_defun_1;
  return (function lambda1373(V1227) {return (V1227 == undefined) ? lambda1373 : new Shen_tco_obj(function() {return (function lambda1372(V1228) {return (V1228 == undefined) ? lambda1372 : new Shen_tco_obj(function() {return ((function(S1) {return new Shen_tco_obj(function() {return ((function(S) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_intmake_string, S)([shen_tuple, V1226, [shen_tuple, V1227, [shen_tuple, S1, [shen_tuple, V1228, [shen_tuple, V1226, []]]]]]));});})("function ~A(~A) {~%  ~A;~%  return ~A;~%}~%~A;~%"))
;});})(shen_tail_call(shen_tail_call(shen_intmake_string, "if (~A == undefined) return ~A"), [shen_tuple, shen_tail_call(shen_get_fn_js(js_sym_js_from_shen), V1227), [shen_tuple, V1226, []]])))
;});});});});
}
js_emit_defun_1;

function js_emit_defun(V1229) {
  if (V1229 == undefined) return js_emit_defun;
  return (function lambda1375(V1230) {return (V1230 == undefined) ? lambda1375 : new Shen_tco_obj(function() {return (function lambda1374(V1231) {return (V1231 == undefined) ? lambda1374 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V1230))) ? (shen_tail_call(shen_intmake_string, "function ~A() {return ~A;}~%~A;~%")([shen_tuple, V1229, [shen_tuple, V1231, [shen_tuple, V1229, []]]])) : (((shen_is_type_js(V1230, shen_type_cons) && (shen_empty$question$_js(V1230[2])))) ? (shen_tail_call(shen_tail_call(shen_get_fn_js(js_emit_defun_1), V1229), V1230[1])(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1231), V1230), true))) : ((shen_is_type_js(V1230, shen_type_cons)) ? (shen_tail_call(shen_tail_call(shen_get_fn_js(js_emit_defun_1), V1229), V1230[1])(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_unwind_defun_lambda), V1230[2]), V1231), [shen_type_cons, V1230[1], []]))) : (shen_get_fn_js(shen_f$_error)([shen_type_symbol, "js_emit_defun"])))));});});});});
}
js_emit_defun;

function js_js_from_kl_toplevel(V1248) {
  if (V1248 == undefined) return js_js_from_kl_toplevel;
  return (function lambda1378(V1249) {return (V1249 == undefined) ? lambda1378 : new Shen_tco_obj(function() {return (function lambda1377(V1250) {return (V1250 == undefined) ? lambda1377 : new Shen_tco_obj(function() {return (((shen_is_type_js(V1248, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "set"], V1248[1]);}) && (shen_is_type_js(V1248[2], shen_type_cons) && (shen_is_type_js(V1248[2][2], shen_type_cons) && (shen_empty$question$_js(V1248[2][2][2]))))))) ? (shen_tail_call(shen_intmake_string, "~A;~%")([shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_emit_set), V1248[2][1]), V1248[2][2][1]), []), []])) : (((shen_is_type_js(V1248, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "defun"], V1248[1]);}) && (shen_is_type_js(V1248[2], shen_type_cons) && (shen_is_type_js(V1248[2][2], shen_type_cons) && (shen_is_type_js(V1248[2][2][2], shen_type_cons) && ((shen_empty$question$_js(V1248[2][2][2][2])) && (shen_tail_call(function() {return shen_equal$question$_js(true, V1249);}) && shen_tail_call(shen_get_fn_js(js_js_int_func$question$), V1248[2][1]))))))))) ? "" : (((shen_is_type_js(V1248, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "defun"], V1248[1]);}) && (shen_is_type_js(V1248[2], shen_type_cons) && (shen_is_type_js(V1248[2][2], shen_type_cons) && ((shen_empty$question$_js(V1248[2][2][1])) && (shen_is_type_js(V1248[2][2][2], shen_type_cons) && (shen_empty$question$_js(V1248[2][2][2][2]))))))))) ? (shen_tail_call(shen_intmake_string, "function ~A() {return ~A;}~%~A;~%")([shen_tuple, shen_tail_call(shen_tail_call(shen_get_fn_js(js_func_name), V1248[2][1]), []), [shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1248[2][2][2][1]), []), true), [shen_tuple, shen_tail_call(shen_tail_call(shen_get_fn_js(js_func_name), V1248[2][1]), []), []]]])) : (((shen_is_type_js(V1248, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "defun"], V1248[1]);}) && (shen_is_type_js(V1248[2], shen_type_cons) && (shen_is_type_js(V1248[2][2], shen_type_cons) && (shen_is_type_js(V1248[2][2][2], shen_type_cons) && (shen_empty$question$_js(V1248[2][2][2][2])))))))) ? (shen_tail_call(shen_tail_call(shen_get_fn_js(js_emit_defun), shen_tail_call(shen_tail_call(shen_get_fn_js(js_func_name), V1248[2][1]), [])), V1248[2][2][1])(V1248[2][2][2][1])) : ((shen_tail_call(function() {return shen_equal$question$_js(false, V1250);})) ? (shen_tail_call(shen_intmake_string, "~A;~%")([shen_tuple, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_from_kl_expr), V1248), []), false), []])) : ((shen_tail_call(function() {return shen_equal$question$_js(true, V1250);})) ? ((function(T) {return new Shen_tco_obj(function() {return ((function(E) {return new Shen_tco_obj(function() {return ((function(Sep) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_intmake_string, "~A;~%")([shen_tuple, shen_tail_call(shen_tail_call(shen_get_fn_js(js_str_join), E), Sep), []]));});})(shen_tail_call(shen_tail_call(shen_intmake_string, ";~%"), [])))
;});})(shen_tail_call(shen_tail_call(shen_map, (function lambda1376(V1248) {return (V1248 == undefined) ? lambda1376 : new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(js_js_from_kl_toplevel), V1248), V1249)(false));});})), T)))
;});})(shen_tail_call(shen_get_fn_js(js_defun_to_toplevel), V1248)))
 : (shen_get_fn_js(shen_f$_error)([shen_type_symbol, "js_js_from_kl_toplevel"]))))))));});});});});
}
js_js_from_kl_toplevel;

function js_collect_defuns(V1251) {
  if (V1251 == undefined) return js_collect_defuns;
  return (function lambda1380(V1252) {return (V1252 == undefined) ? lambda1380 : new Shen_tco_obj(function() {return (function lambda1379(V1253) {return (V1253 == undefined) ? lambda1379 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V1251))) ? [shen_tuple, shen_tail_call(shen_reverse, V1252), V1253] : ((shen_is_type_js(V1251, shen_type_cons)) ? ((function(X) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(js_collect_defuns), V1251[2]), [shen_type_cons, shen_tail_call(shen_fst, X), V1252])(shen_tail_call(shen_snd, X)));});})(shen_tail_call(shen_tail_call(shen_get_fn_js(js_defun_to_toplevel_aux), V1251[1]), V1253)))
 : (shen_get_fn_js(shen_f$_error)([shen_type_symbol, "js_collect_defuns"]))));});});});});
}
js_collect_defuns;

function js_defun_to_toplevel_aux(V1254) {
  if (V1254 == undefined) return js_defun_to_toplevel_aux;
  return (function lambda1381(V1255) {return (V1255 == undefined) ? lambda1381 : new Shen_tco_obj(function() {return (((shen_is_type_js(V1254, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "defun"], V1254[1]);}) && (shen_is_type_js(V1254[2], shen_type_cons) && (shen_is_type_js(V1254[2][2], shen_type_cons) && (shen_is_type_js(V1254[2][2][2], shen_type_cons) && (shen_empty$question$_js(V1254[2][2][2][2])))))))) ? [shen_tuple, V1254[2][1], [shen_type_cons, V1254, V1255]] : ((shen_is_type_js(V1254, shen_type_cons)) ? (shen_tail_call(shen_tail_call(shen_get_fn_js(js_collect_defuns), V1254), [])(V1255)) : [shen_tuple, V1254, V1255]));});});
}
js_defun_to_toplevel_aux;

function js_defun_to_toplevel(V1256) {
  if (V1256 == undefined) return js_defun_to_toplevel;
  return ((function(R) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_append, shen_tail_call(shen_reverse, shen_tail_call(shen_snd, R)))([shen_type_cons, shen_tail_call(shen_fst, R), []]));});})(shen_tail_call(shen_tail_call(shen_get_fn_js(js_defun_to_toplevel_aux), V1256), [])))
;
}
js_defun_to_toplevel;

(shen_globals[[shen_type_symbol, "js_js_skip_internals"][1]] = true);

function js_from_kl(V1257) {
  if (V1257 == undefined) return js_from_kl;
  return (shen_tail_call(shen_tail_call(shen_get_fn_js(js_js_from_kl_toplevel), V1257), shen_tail_call(shen_value, [shen_type_symbol, "js_js_skip_internals"]))(true));
}
js_from_kl;

function js_js_from_kl_all(V1258) {
  if (V1258 == undefined) return js_js_from_kl_all;
  return (function lambda1382(V1259) {return (V1259 == undefined) ? lambda1382 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V1258))) ? V1259 : ((shen_is_type_js(V1258, shen_type_cons)) ? (shen_tail_call(shen_get_fn_js(js_js_from_kl_all), V1258[2])(shen_tail_call(shen_tail_call(shen_intmake_string, "~A~A~%"), [shen_tuple, V1259, [shen_tuple, shen_tail_call(shen_get_fn_js(js_from_kl), V1258[1]), []]]))) : (shen_get_fn_js(shen_f$_error)([shen_type_symbol, "js_js_from_kl_all"]))));});});
}
js_js_from_kl_all;

function js_js_write_string(V1260) {
  if (V1260 == undefined) return js_js_write_string;
  return (function lambda1384(V1261) {return (V1261 == undefined) ? lambda1384 : new Shen_tco_obj(function() {return (function lambda1383(V1262) {return (V1262 == undefined) ? lambda1383 : new Shen_tco_obj(function() {return new Shen_tco_obj(function() {return trap_error_js(function() {return (shen_tail_call(shen_tail_call(shen_pr, V1260[V1261]), V1262),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_js_write_string), V1260), (V1261 + 1)), V1262));}, function(E) {return true;});});});});});});
}
js_js_write_string;

function js_js_dump_exprs_to_file(V1265) {
  if (V1265 == undefined) return js_js_dump_exprs_to_file;
  return (function lambda1385(V1266) {return (V1266 == undefined) ? lambda1385 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V1265))) ? true : ((shen_is_type_js(V1265, shen_type_cons)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_js_write_string), shen_tail_call(shen_get_fn_js(js_from_kl), V1265[1])), 0), V1266),
  (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(js_js_write_string), shen_tail_call(shen_tail_call(shen_intmake_string, "~%"), [])), 0), V1266),
  (shen_tail_call(shen_get_fn_js(js_js_dump_exprs_to_file), V1265[2])(V1266)))) : (shen_get_fn_js(shen_f$_error)([shen_type_symbol, "js_js_dump_exprs_to_file"]))));});});
}
js_js_dump_exprs_to_file;

function js_dump_to_file(V1267) {
  if (V1267 == undefined) return js_dump_to_file;
  return (function lambda1386(V1268) {return (V1268 == undefined) ? lambda1386 : new Shen_tco_obj(function() {return ((function(F) {return new Shen_tco_obj(function() {return ((function(R) {return new Shen_tco_obj(function() {return ((function(R2) {return new Shen_tco_obj(function() {return true;});})(shen_tail_call(shen_close, F)))
;});})(shen_tail_call(shen_tail_call(shen_get_fn_js(js_js_dump_exprs_to_file), V1267), F)))
;});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_open, [shen_type_symbol, "file"]), V1268), [shen_type_symbol, "out"])))
;});});
}
js_dump_to_file;

function js_fix_eval(V1273) {
  if (V1273 == undefined) return js_fix_eval;
  return (function lambda1387(V1274) {return (V1274 == undefined) ? lambda1387 : new Shen_tco_obj(function() {return (((shen_is_type_js(V1274, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "define"], V1274[1]);}) && shen_is_type_js(V1274[2], shen_type_cons)))) ? (shen_get_fn_js(shen_out)(V1274)) : ((shen_is_type_js(V1274, shen_type_cons)) ? (shen_tail_call(shen_map, shen_tail_call(shen_get_fn_js(js_fix_eval), V1273))(V1274)) : V1274));});});
}
js_fix_eval;

function js_js_dump_shen_file(V1275) {
  if (V1275 == undefined) return js_js_dump_shen_file;
  return (function lambda1388(V1276) {return (V1276 == undefined) ? lambda1388 : new Shen_tco_obj(function() {return ((function(Kl) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(js_dump_to_file), Kl)(V1276));});})(shen_tail_call(shen_tail_call(shen_map, shen_out), shen_tail_call(shen_read_file, V1275))))
;});});
}
js_js_dump_shen_file;



//## FILE js/core.js

function shen_$gt$kl(V2027) {
  if (V2027 == undefined) return shen_$gt$kl;
  return (function lambda1390(V2028) {return (V2028 == undefined) ? lambda1390 : new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_compile, shen_$lt$define$gt$), [shen_type_cons, V2027, V2028])((function lambda1389(X) {return (X == undefined) ? lambda1389 : new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_syntax_error), V2027)(X));});})));});});
}
shen_$gt$kl;

function shen_syntax_error(V2029) {
  if (V2029 == undefined) return shen_syntax_error;
  return (function lambda1391(V2030) {return (V2030 == undefined) ? lambda1391 : new Shen_tco_obj(function() {return (shen_tail_call(shen_interror, "syntax error in ~A here:~%~% ~A~%")([shen_tuple, V2029, [shen_tuple, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_next_50), 50), V2030), []]]));});});
}
shen_syntax_error;

function shen_$lt$define$gt$(V2035) {
  if (V2035 == undefined) return shen_$lt$define$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$name$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$name$gt$);}))) ? shen_tail_call((function(Parse$_$lt$rules$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$rules$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$rules$gt$)), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_compile$_to$_machine$_code), shen_tail_call(shen_snd, Parse$_$lt$name$gt$)), shen_tail_call(shen_snd, Parse$_$lt$rules$gt$))) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$rules$gt$), Parse$_$lt$name$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$name$gt$), V2035))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$name$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$name$gt$);}))) ? shen_tail_call((function(Parse$_$lt$signature$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$signature$gt$);}))) ? shen_tail_call((function(Parse$_$lt$rules$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$rules$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$rules$gt$)), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_compile$_to$_machine$_code), shen_tail_call(shen_snd, Parse$_$lt$name$gt$)), shen_tail_call(shen_snd, Parse$_$lt$rules$gt$))) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$rules$gt$), Parse$_$lt$signature$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$signature$gt$), Parse$_$lt$name$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$name$gt$), V2035))
))
;
}
shen_$lt$define$gt$;

function shen_$lt$name$gt$(V2040) {
  if (V2040 == undefined) return shen_$lt$name$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V2040), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2040)[2]), shen_tail_call(shen_snd, V2040)))), ((((shen_is_type_js(shen_tail_call(shen_fst, V2040)[1], shen_type_symbol) && (!shen_tail_call(shen_get_fn_js(shen_sysfunc$question$), shen_tail_call(shen_fst, V2040)[1]))) || shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$installing_kl$asterisk$"]))) ? shen_tail_call(shen_fst, V2040)[1] : shen_tail_call(shen_tail_call(shen_interror, "~A is not a legitimate functor.~%"), [shen_tuple, shen_tail_call(shen_fst, V2040)[1], []]))) : shen_fail_obj)))
;
}
shen_$lt$name$gt$;

function shen_sysfunc$question$(V2041) {
  if (V2041 == undefined) return shen_sysfunc$question$;
  return (shen_tail_call(shen_element$question$, V2041)(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$system$asterisk$"])));
}
shen_sysfunc$question$;

function shen_$lt$signature$gt$(V2046) {
  if (V2046 == undefined) return shen_$lt$signature$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})((((shen_is_type_js(shen_tail_call(shen_fst, V2046), shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$cbraceopen$"], shen_tail_call(shen_fst, V2046)[1]);}))) ? shen_tail_call((function(Parse$_$lt$signature_help$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$signature_help$gt$);}))) ? (((shen_is_type_js(shen_tail_call(shen_fst, Parse$_$lt$signature_help$gt$), shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$cbraceclose$"], shen_tail_call(shen_fst, Parse$_$lt$signature_help$gt$)[1]);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$signature_help$gt$)[2]), shen_tail_call(shen_snd, Parse$_$lt$signature_help$gt$)))), shen_tail_call(shen_get_fn_js(shen_normalise_type), shen_tail_call(shen_get_fn_js(shen_curry_type), shen_tail_call(shen_snd, Parse$_$lt$signature_help$gt$)))) : shen_fail_obj) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$signature_help$gt$), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2046)[2]), shen_tail_call(shen_snd, V2046))))
 : shen_fail_obj)))
;
}
shen_$lt$signature$gt$;

function shen_curry_type(V2049) {
  if (V2049 == undefined) return shen_curry_type;
  return (((shen_is_type_js(V2049, shen_type_cons) && (shen_is_type_js(V2049[2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "__$gt$"], V2049[2][1]);}) && (shen_is_type_js(V2049[2][2], shen_type_cons) && (shen_is_type_js(V2049[2][2][2], shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "__$gt$"], V2049[2][2][2][1]);}))))))) ? (shen_get_fn_js(shen_curry_type)([shen_type_cons, V2049[1], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, V2049[2][2], []]]])) : (((shen_is_type_js(V2049, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "cons"], V2049[1]);}) && (shen_is_type_js(V2049[2], shen_type_cons) && (shen_is_type_js(V2049[2][2], shen_type_cons) && (shen_empty$question$_js(V2049[2][2][2]))))))) ? [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_curry_type), V2049[2][1]), []]] : (((shen_is_type_js(V2049, shen_type_cons) && (shen_is_type_js(V2049[2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$asterisk$"], V2049[2][1]);}) && (shen_is_type_js(V2049[2][2], shen_type_cons) && (shen_is_type_js(V2049[2][2][2], shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$asterisk$"], V2049[2][2][2][1]);}))))))) ? (shen_get_fn_js(shen_curry_type)([shen_type_cons, V2049[1], [shen_type_cons, [shen_type_symbol, "$asterisk$"], [shen_type_cons, V2049[2][2], []]]])) : ((shen_is_type_js(V2049, shen_type_cons)) ? (shen_tail_call(shen_map, shen_curry_type)(V2049)) : V2049))));
}
shen_curry_type;

function shen_$lt$signature_help$gt$(V2054) {
  if (V2054 == undefined) return shen_$lt$signature_help$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$e$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$e$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$e$gt$)), []) : shen_fail_obj);});}), shen_tail_call(shen_$lt$e$gt$, V2054))
))
 : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V2054), shen_type_cons)) ? shen_tail_call((function(Parse$_$lt$signature_help$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$signature_help$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$signature_help$gt$)), ((shen_tail_call(shen_tail_call(shen_element$question$, shen_tail_call(shen_fst, V2054)[1]), [shen_type_cons, [shen_type_symbol, "$cbraceopen$"], [shen_type_cons, [shen_type_symbol, "$cbraceclose$"], []]])) ? shen_fail_obj : [shen_type_cons, shen_tail_call(shen_fst, V2054)[1], shen_tail_call(shen_snd, Parse$_$lt$signature_help$gt$)])) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$signature_help$gt$), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2054)[2]), shen_tail_call(shen_snd, V2054))))
 : shen_fail_obj)))
;
}
shen_$lt$signature_help$gt$;

function shen_$lt$rules$gt$(V2059) {
  if (V2059 == undefined) return shen_$lt$rules$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$rule$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$rule$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$rule$gt$)), [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$rule$gt$), []]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$rule$gt$), V2059))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$rule$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$rule$gt$);}))) ? shen_tail_call((function(Parse$_$lt$rules$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$rules$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$rules$gt$)), [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$rule$gt$), shen_tail_call(shen_snd, Parse$_$lt$rules$gt$)]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$rules$gt$), Parse$_$lt$rule$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$rule$gt$), V2059))
))
;
}
shen_$lt$rules$gt$;

function shen_$lt$rule$gt$(V2064) {
  if (V2064 == undefined) return shen_$lt$rule$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$patterns$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$patterns$gt$);}))) ? (((shen_is_type_js(shen_tail_call(shen_fst, Parse$_$lt$patterns$gt$), shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$lt$_"], shen_tail_call(shen_fst, Parse$_$lt$patterns$gt$)[1]);}))) ? shen_tail_call((function(Parse$_$lt$action$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$action$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$action$gt$)), [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$patterns$gt$), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_choicepoint$excl$"], [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$action$gt$), []]], []]]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$action$gt$), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$patterns$gt$)[2]), shen_tail_call(shen_snd, Parse$_$lt$patterns$gt$))))
 : shen_fail_obj) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$patterns$gt$), V2064))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$patterns$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$patterns$gt$);}))) ? (((shen_is_type_js(shen_tail_call(shen_fst, Parse$_$lt$patterns$gt$), shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$lt$_"], shen_tail_call(shen_fst, Parse$_$lt$patterns$gt$)[1]);}))) ? shen_tail_call((function(Parse$_$lt$action$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$action$gt$);}))) ? (((shen_is_type_js(shen_tail_call(shen_fst, Parse$_$lt$action$gt$), shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "where"], shen_tail_call(shen_fst, Parse$_$lt$action$gt$)[1]);}))) ? shen_tail_call((function(Parse$_$lt$guard$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$guard$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$guard$gt$)), [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$patterns$gt$), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "where"], [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$guard$gt$), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_choicepoint$excl$"], [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$action$gt$), []]], []]]], []]]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$guard$gt$), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$action$gt$)[2]), shen_tail_call(shen_snd, Parse$_$lt$action$gt$))))
 : shen_fail_obj) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$action$gt$), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$patterns$gt$)[2]), shen_tail_call(shen_snd, Parse$_$lt$patterns$gt$))))
 : shen_fail_obj) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$patterns$gt$), V2064))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$patterns$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$patterns$gt$);}))) ? (((shen_is_type_js(shen_tail_call(shen_fst, Parse$_$lt$patterns$gt$), shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "_$gt$"], shen_tail_call(shen_fst, Parse$_$lt$patterns$gt$)[1]);}))) ? shen_tail_call((function(Parse$_$lt$action$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$action$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$action$gt$)), [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$patterns$gt$), [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$action$gt$), []]]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$action$gt$), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$patterns$gt$)[2]), shen_tail_call(shen_snd, Parse$_$lt$patterns$gt$))))
 : shen_fail_obj) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$patterns$gt$), V2064))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$patterns$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$patterns$gt$);}))) ? (((shen_is_type_js(shen_tail_call(shen_fst, Parse$_$lt$patterns$gt$), shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "_$gt$"], shen_tail_call(shen_fst, Parse$_$lt$patterns$gt$)[1]);}))) ? shen_tail_call((function(Parse$_$lt$action$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$action$gt$);}))) ? (((shen_is_type_js(shen_tail_call(shen_fst, Parse$_$lt$action$gt$), shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "where"], shen_tail_call(shen_fst, Parse$_$lt$action$gt$)[1]);}))) ? shen_tail_call((function(Parse$_$lt$guard$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$guard$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$guard$gt$)), [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$patterns$gt$), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "where"], [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$guard$gt$), [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$action$gt$), []]]], []]]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$guard$gt$), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$action$gt$)[2]), shen_tail_call(shen_snd, Parse$_$lt$action$gt$))))
 : shen_fail_obj) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$action$gt$), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$patterns$gt$)[2]), shen_tail_call(shen_snd, Parse$_$lt$patterns$gt$))))
 : shen_fail_obj) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$patterns$gt$), V2064))
))
;
}
shen_$lt$rule$gt$;

function shen_fail$_if(V2065) {
  if (V2065 == undefined) return shen_fail$_if;
  return (function lambda1392(V2066) {return (V2066 == undefined) ? lambda1392 : new Shen_tco_obj(function() {return ((shen_tail_call(shen_get_fn_js(V2065), V2066)) ? shen_fail_obj : V2066);});});
}
shen_fail$_if;

function shen_succeeds$question$(V2071) {
  if (V2071 == undefined) return shen_succeeds$question$;
  return ((shen_tail_call(function() {return shen_equal$question$_js(V2071, shen_fail_obj);})) ? false : true);
}
shen_succeeds$question$;

function shen_$lt$patterns$gt$(V2076) {
  if (V2076 == undefined) return shen_$lt$patterns$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$e$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$e$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$e$gt$)), []) : shen_fail_obj);});}), shen_tail_call(shen_$lt$e$gt$, V2076))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$pattern$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$pattern$gt$);}))) ? shen_tail_call((function(Parse$_$lt$patterns$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$patterns$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$patterns$gt$)), [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$pattern$gt$), shen_tail_call(shen_snd, Parse$_$lt$patterns$gt$)]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$patterns$gt$), Parse$_$lt$pattern$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$pattern$gt$), V2076))
))
;
}
shen_$lt$patterns$gt$;

function shen_$lt$pattern$gt$(V2081) {
  if (V2081 == undefined) return shen_$lt$pattern$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$simple$_pattern$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$simple$_pattern$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$simple$_pattern$gt$)), shen_tail_call(shen_snd, Parse$_$lt$simple$_pattern$gt$)) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$simple$_pattern$gt$), V2081))
))
 : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V2081), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2081)[2]), shen_tail_call(shen_snd, V2081)))), ((shen_is_type_js(shen_tail_call(shen_fst, V2081)[1], shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_interror, "~A is not a legitimate constructor~%"), [shen_tuple, shen_tail_call(shen_fst, V2081)[1], []]) : shen_fail_obj)) : shen_fail_obj)))
 : Result);});})((((shen_is_type_js(shen_tail_call(shen_fst, V2081), shen_type_cons) && shen_is_type_js(shen_tail_call(shen_fst, V2081)[1], shen_type_cons))) ? shen_tail_call(shen_get_fn_js(shen_snd_or_fail), (((shen_is_type_js(shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2081)[1]), shen_tail_call(shen_snd, V2081))), shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "vector"], shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2081)[1]), shen_tail_call(shen_snd, V2081)))[1]);}))) ? (((shen_is_type_js(shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2081)[1]), shen_tail_call(shen_snd, V2081)))[2]), shen_tail_call(shen_snd, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2081)[1]), shen_tail_call(shen_snd, V2081))))), shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js(0, shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2081)[1]), shen_tail_call(shen_snd, V2081)))[2]), shen_tail_call(shen_snd, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2081)[1]), shen_tail_call(shen_snd, V2081)))))[1]);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2081)[1]), shen_tail_call(shen_snd, V2081)))[2]), shen_tail_call(shen_snd, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2081)[1]), shen_tail_call(shen_snd, V2081)))))[2]), shen_tail_call(shen_snd, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2081)[1]), shen_tail_call(shen_snd, V2081)))[2]), shen_tail_call(shen_snd, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2081)[1]), shen_tail_call(shen_snd, V2081)))))))), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2081)[2]), shen_tail_call(shen_snd, V2081)))), [shen_type_cons, [shen_type_symbol, "vector"], [shen_type_cons, 0, []]])) : shen_fail_obj) : shen_fail_obj)) : shen_fail_obj)))
 : Result);});})((((shen_is_type_js(shen_tail_call(shen_fst, V2081), shen_type_cons) && shen_is_type_js(shen_tail_call(shen_fst, V2081)[1], shen_type_cons))) ? shen_tail_call(shen_get_fn_js(shen_snd_or_fail), (((shen_is_type_js(shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2081)[1]), shen_tail_call(shen_snd, V2081))), shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$at$s"], shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2081)[1]), shen_tail_call(shen_snd, V2081)))[1]);}))) ? shen_tail_call((function(Parse$_$lt$pattern1$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$pattern1$gt$);}))) ? shen_tail_call((function(Parse$_$lt$pattern2$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$pattern2$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$pattern2$gt$)), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2081)[2]), shen_tail_call(shen_snd, V2081)))), [shen_type_cons, [shen_type_symbol, "$at$s"], [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$pattern1$gt$), [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$pattern2$gt$), []]]])) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$pattern2$gt$), Parse$_$lt$pattern1$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$pattern1$gt$), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2081)[1]), shen_tail_call(shen_snd, V2081)))[2]), shen_tail_call(shen_snd, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2081)[1]), shen_tail_call(shen_snd, V2081))))))
 : shen_fail_obj)) : shen_fail_obj)))
 : Result);});})((((shen_is_type_js(shen_tail_call(shen_fst, V2081), shen_type_cons) && shen_is_type_js(shen_tail_call(shen_fst, V2081)[1], shen_type_cons))) ? shen_tail_call(shen_get_fn_js(shen_snd_or_fail), (((shen_is_type_js(shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2081)[1]), shen_tail_call(shen_snd, V2081))), shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$at$v"], shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2081)[1]), shen_tail_call(shen_snd, V2081)))[1]);}))) ? shen_tail_call((function(Parse$_$lt$pattern1$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$pattern1$gt$);}))) ? shen_tail_call((function(Parse$_$lt$pattern2$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$pattern2$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$pattern2$gt$)), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2081)[2]), shen_tail_call(shen_snd, V2081)))), [shen_type_cons, [shen_type_symbol, "$at$v"], [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$pattern1$gt$), [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$pattern2$gt$), []]]])) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$pattern2$gt$), Parse$_$lt$pattern1$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$pattern1$gt$), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2081)[1]), shen_tail_call(shen_snd, V2081)))[2]), shen_tail_call(shen_snd, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2081)[1]), shen_tail_call(shen_snd, V2081))))))
 : shen_fail_obj)) : shen_fail_obj)))
 : Result);});})((((shen_is_type_js(shen_tail_call(shen_fst, V2081), shen_type_cons) && shen_is_type_js(shen_tail_call(shen_fst, V2081)[1], shen_type_cons))) ? shen_tail_call(shen_get_fn_js(shen_snd_or_fail), (((shen_is_type_js(shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2081)[1]), shen_tail_call(shen_snd, V2081))), shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "cons"], shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2081)[1]), shen_tail_call(shen_snd, V2081)))[1]);}))) ? shen_tail_call((function(Parse$_$lt$pattern1$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$pattern1$gt$);}))) ? shen_tail_call((function(Parse$_$lt$pattern2$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$pattern2$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$pattern2$gt$)), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2081)[2]), shen_tail_call(shen_snd, V2081)))), [shen_type_cons, [shen_type_symbol, "cons"], [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$pattern1$gt$), [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$pattern2$gt$), []]]])) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$pattern2$gt$), Parse$_$lt$pattern1$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$pattern1$gt$), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2081)[1]), shen_tail_call(shen_snd, V2081)))[2]), shen_tail_call(shen_snd, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2081)[1]), shen_tail_call(shen_snd, V2081))))))
 : shen_fail_obj)) : shen_fail_obj)))
 : Result);});})((((shen_is_type_js(shen_tail_call(shen_fst, V2081), shen_type_cons) && shen_is_type_js(shen_tail_call(shen_fst, V2081)[1], shen_type_cons))) ? shen_tail_call(shen_get_fn_js(shen_snd_or_fail), (((shen_is_type_js(shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2081)[1]), shen_tail_call(shen_snd, V2081))), shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$at$p"], shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2081)[1]), shen_tail_call(shen_snd, V2081)))[1]);}))) ? shen_tail_call((function(Parse$_$lt$pattern1$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$pattern1$gt$);}))) ? shen_tail_call((function(Parse$_$lt$pattern2$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$pattern2$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$pattern2$gt$)), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2081)[2]), shen_tail_call(shen_snd, V2081)))), [shen_type_cons, [shen_type_symbol, "$at$p"], [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$pattern1$gt$), [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$pattern2$gt$), []]]])) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$pattern2$gt$), Parse$_$lt$pattern1$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$pattern1$gt$), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2081)[1]), shen_tail_call(shen_snd, V2081)))[2]), shen_tail_call(shen_snd, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2081)[1]), shen_tail_call(shen_snd, V2081))))))
 : shen_fail_obj)) : shen_fail_obj)))
;
}
shen_$lt$pattern$gt$;

function shen_$lt$simple$_pattern$gt$(V2086) {
  if (V2086 == undefined) return shen_$lt$simple$_pattern$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V2086), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2086)[2]), shen_tail_call(shen_snd, V2086)))), ((shen_tail_call(shen_tail_call(shen_element$question$, shen_tail_call(shen_fst, V2086)[1]), [shen_type_cons, [shen_type_symbol, "_$gt$"], [shen_type_cons, [shen_type_symbol, "$lt$_"], []]])) ? shen_fail_obj : shen_tail_call(shen_fst, V2086)[1])) : shen_fail_obj)))
 : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V2086), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2086)[2]), shen_tail_call(shen_snd, V2086)))), ((shen_tail_call(function() {return shen_equal$question$_js(shen_tail_call(shen_fst, V2086)[1], [shen_type_symbol, "$_"]);})) ? shen_tail_call(shen_gensym, [shen_type_symbol, "X"]) : shen_fail_obj)) : shen_fail_obj)))
;
}
shen_$lt$simple$_pattern$gt$;

function shen_$lt$pattern1$gt$(V2091) {
  if (V2091 == undefined) return shen_$lt$pattern1$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$pattern$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$pattern$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$pattern$gt$)), shen_tail_call(shen_snd, Parse$_$lt$pattern$gt$)) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$pattern$gt$), V2091))
))
;
}
shen_$lt$pattern1$gt$;

function shen_$lt$pattern2$gt$(V2096) {
  if (V2096 == undefined) return shen_$lt$pattern2$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$pattern$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$pattern$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$pattern$gt$)), shen_tail_call(shen_snd, Parse$_$lt$pattern$gt$)) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$pattern$gt$), V2096))
))
;
}
shen_$lt$pattern2$gt$;

function shen_$lt$action$gt$(V2101) {
  if (V2101 == undefined) return shen_$lt$action$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V2101), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2101)[2]), shen_tail_call(shen_snd, V2101)))), shen_tail_call(shen_fst, V2101)[1]) : shen_fail_obj)))
;
}
shen_$lt$action$gt$;

function shen_$lt$guard$gt$(V2106) {
  if (V2106 == undefined) return shen_$lt$guard$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V2106), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2106)[2]), shen_tail_call(shen_snd, V2106)))), shen_tail_call(shen_fst, V2106)[1]) : shen_fail_obj)))
;
}
shen_$lt$guard$gt$;

function shen_compile$_to$_machine$_code(V2107) {
  if (V2107 == undefined) return shen_compile$_to$_machine$_code;
  return (function lambda1393(V2108) {return (V2108 == undefined) ? lambda1393 : new Shen_tco_obj(function() {return ((function(Lambda$plus$) {return new Shen_tco_obj(function() {return ((function(KL) {return new Shen_tco_obj(function() {return ((function(Record) {return new Shen_tco_obj(function() {return KL;});})(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_record_source), V2107), KL)))
;});})(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_compile$_to$_kl), V2107), Lambda$plus$)))
;});})(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_compile$_to$_lambda$plus$), V2107), V2108)))
;});});
}
shen_compile$_to$_machine$_code;

function shen_record_source(V2111) {
  if (V2111 == undefined) return shen_record_source;
  return (function lambda1394(V2112) {return (V2112 == undefined) ? lambda1394 : new Shen_tco_obj(function() {return ((shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$installing_kl$asterisk$"])) ? [shen_type_symbol, "shen_skip"] : (shen_tail_call(shen_tail_call(shen_tail_call(shen_put, V2111), [shen_type_symbol, "shen_source"]), V2112)(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$property_vector$asterisk$"]))));});});
}
shen_record_source;

function shen_compile$_to$_lambda$plus$(V2113) {
  if (V2113 == undefined) return shen_compile$_to$_lambda$plus$;
  return (function lambda1397(V2114) {return (V2114 == undefined) ? lambda1397 : new Shen_tco_obj(function() {return ((function(Arity) {return new Shen_tco_obj(function() {return ((function(Free) {return new Shen_tco_obj(function() {return ((function(Variables) {return new Shen_tco_obj(function() {return ((function(Linear) {return new Shen_tco_obj(function() {return ((function(Abstractions) {return new Shen_tco_obj(function() {return ((function(Applications) {return new Shen_tco_obj(function() {return [shen_type_cons, Variables, [shen_type_cons, Applications, []]];});})(shen_tail_call(shen_tail_call(shen_map, (function lambda1396(X) {return (X == undefined) ? lambda1396 : new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_application$_build), Variables)(X));});})), Abstractions)))
;});})(shen_tail_call(shen_tail_call(shen_map, shen_abstract$_rule), Linear)))
;});})(shen_tail_call(shen_tail_call(shen_map, [shen_type_symbol, "shen_linearise"]), V2114)))
;});})(shen_tail_call(shen_get_fn_js(shen_parameters), Arity)))
;});})(shen_tail_call(shen_tail_call(shen_map, (function lambda1395(Rule) {return (Rule == undefined) ? lambda1395 : new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_free$_variable$_check), V2113)(Rule));});})), V2114)))
;});})(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_aritycheck), V2113), V2114)))
;});});
}
shen_compile$_to$_lambda$plus$;

function shen_free$_variable$_check(V2115) {
  if (V2115 == undefined) return shen_free$_variable$_check;
  return (function lambda1398(V2116) {return (V2116 == undefined) ? lambda1398 : new Shen_tco_obj(function() {return (((shen_is_type_js(V2116, shen_type_cons) && (shen_is_type_js(V2116[2], shen_type_cons) && (shen_empty$question$_js(V2116[2][2]))))) ? ((function(Bound) {return new Shen_tco_obj(function() {return ((function(Free) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_free$_variable$_warnings), V2115)(Free));});})(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_extract$_free$_vars), Bound), V2116[2][1])))
;});})(shen_tail_call(shen_get_fn_js(shen_extract$_vars), V2116[1])))
 : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_free$_variable$_check"])));});});
}
shen_free$_variable$_check;

function shen_extract$_vars(V2117) {
  if (V2117 == undefined) return shen_extract$_vars;
  return ((shen_tail_call(shen_variable$question$, V2117)) ? [shen_type_cons, V2117, []] : ((shen_is_type_js(V2117, shen_type_cons)) ? (shen_tail_call(shen_union, shen_tail_call(shen_get_fn_js(shen_extract$_vars), V2117[1]))(shen_tail_call(shen_get_fn_js(shen_extract$_vars), V2117[2]))) : []));
}
shen_extract$_vars;

function shen_extract$_free$_vars(V2126) {
  if (V2126 == undefined) return shen_extract$_free$_vars;
  return (function lambda1399(V2127) {return (V2127 == undefined) ? lambda1399 : new Shen_tco_obj(function() {return (((shen_tail_call(shen_variable$question$, V2127) && (!shen_tail_call(shen_tail_call(shen_element$question$, V2127), V2126)))) ? [shen_type_cons, V2127, []] : (((shen_is_type_js(V2127, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "lambda"], V2127[1]);}) && (shen_is_type_js(V2127[2], shen_type_cons) && (shen_is_type_js(V2127[2][2], shen_type_cons) && (shen_empty$question$_js(V2127[2][2][2]))))))) ? (shen_tail_call(shen_get_fn_js(shen_extract$_free$_vars), [shen_type_cons, V2127[2][1], V2126])(V2127[2][2][1])) : (((shen_is_type_js(V2127, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "let"], V2127[1]);}) && (shen_is_type_js(V2127[2], shen_type_cons) && (shen_is_type_js(V2127[2][2], shen_type_cons) && (shen_is_type_js(V2127[2][2][2], shen_type_cons) && (shen_empty$question$_js(V2127[2][2][2][2])))))))) ? (shen_tail_call(shen_union, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_extract$_free$_vars), V2126), V2127[2][2][1]))(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_extract$_free$_vars), [shen_type_cons, V2127[2][1], V2126]), V2127[2][2][2][1]))) : ((shen_is_type_js(V2127, shen_type_cons)) ? (shen_tail_call(shen_union, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_extract$_free$_vars), V2126), V2127[1]))(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_extract$_free$_vars), V2126), V2127[2]))) : []))));});});
}
shen_extract$_free$_vars;

function shen_free$_variable$_warnings(V2130) {
  if (V2130 == undefined) return shen_free$_variable$_warnings;
  return (function lambda1400(V2131) {return (V2131 == undefined) ? lambda1400 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V2131))) ? [shen_type_symbol, "$_"] : ((function(Warning) {return new Shen_tco_obj(function() {return (shen_get_fn_js(shen_list$_variables)(V2131));});})(shen_tail_call(shen_tail_call(shen_intoutput, "~%The following variables are free in ~A: "), [shen_tuple, V2130, []])))
);});});
}
shen_free$_variable$_warnings;

function shen_list$_variables(V2132) {
  if (V2132 == undefined) return shen_list$_variables;
  return (((shen_is_type_js(V2132, shen_type_cons) && (shen_empty$question$_js(V2132[2])))) ? (shen_tail_call(shen_intoutput, "~A~%")([shen_tuple, V2132[1], []])) : ((shen_is_type_js(V2132, shen_type_cons)) ? (shen_tail_call(shen_tail_call(shen_intoutput, "~A, "), [shen_tuple, V2132[1], []]),
  (shen_get_fn_js(shen_list$_variables)(V2132[2]))) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_list$_variables"]))));
}
shen_list$_variables;

function shen_linearise(V2133) {
  if (V2133 == undefined) return shen_linearise;
  return (((shen_is_type_js(V2133, shen_type_cons) && (shen_is_type_js(V2133[2], shen_type_cons) && (shen_empty$question$_js(V2133[2][2]))))) ? (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_linearise$_help), shen_tail_call(shen_get_fn_js(shen_flatten), V2133[1])), V2133[1])(V2133[2][1])) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_linearise"])));
}
shen_linearise;

function shen_flatten(V2134) {
  if (V2134 == undefined) return shen_flatten;
  return (((shen_empty$question$_js(V2134))) ? [] : ((shen_is_type_js(V2134, shen_type_cons)) ? (shen_tail_call(shen_append, shen_tail_call(shen_get_fn_js(shen_flatten), V2134[1]))(shen_tail_call(shen_get_fn_js(shen_flatten), V2134[2]))) : [shen_type_cons, V2134, []]));
}
shen_flatten;

function shen_linearise$_help(V2135) {
  if (V2135 == undefined) return shen_linearise$_help;
  return (function lambda1402(V2136) {return (V2136 == undefined) ? lambda1402 : new Shen_tco_obj(function() {return (function lambda1401(V2137) {return (V2137 == undefined) ? lambda1401 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V2135))) ? [shen_type_cons, V2136, [shen_type_cons, V2137, []]] : ((shen_is_type_js(V2135, shen_type_cons)) ? (((shen_tail_call(shen_variable$question$, V2135[1]) && shen_tail_call(shen_tail_call(shen_element$question$, V2135[1]), V2135[2]))) ? ((function(Var) {return new Shen_tco_obj(function() {return ((function(NewAction) {return new Shen_tco_obj(function() {return ((function(NewPatts) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_linearise$_help), V2135[2]), NewPatts)(NewAction));});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_linearise$_X), V2135[1]), Var), V2136)))
;});})([shen_type_cons, [shen_type_symbol, "where"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "$eq$"], [shen_type_cons, V2135[1], [shen_type_cons, Var, []]]], [shen_type_cons, V2137, []]]]))
;});})(shen_tail_call(shen_gensym, V2135[1])))
 : (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_linearise$_help), V2135[2]), V2136)(V2137))) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_linearise$_help"]))));});});});});
}
shen_linearise$_help;

function shen_linearise$_X(V2146) {
  if (V2146 == undefined) return shen_linearise$_X;
  return (function lambda1404(V2147) {return (V2147 == undefined) ? lambda1404 : new Shen_tco_obj(function() {return (function lambda1403(V2148) {return (V2148 == undefined) ? lambda1403 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(V2148, V2146);})) ? V2147 : ((shen_is_type_js(V2148, shen_type_cons)) ? ((function(L) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(L, V2148[1]);})) ? [shen_type_cons, V2148[1], shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_linearise$_X), V2146), V2147), V2148[2])] : [shen_type_cons, L, V2148[2]]);});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_linearise$_X), V2146), V2147), V2148[1])))
 : V2148));});});});});
}
shen_linearise$_X;

function shen_aritycheck(V2150) {
  if (V2150 == undefined) return shen_aritycheck;
  return (function lambda1405(V2151) {return (V2151 == undefined) ? lambda1405 : new Shen_tco_obj(function() {return (((shen_is_type_js(V2151, shen_type_cons) && (shen_is_type_js(V2151[1], shen_type_cons) && (shen_is_type_js(V2151[1][2], shen_type_cons) && ((shen_empty$question$_js(V2151[1][2][2])) && (shen_empty$question$_js(V2151[2]))))))) ? (shen_tail_call(shen_get_fn_js(shen_aritycheck_action), V2151[1][2][1]),
  (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_aritycheck_name), V2150), shen_tail_call(shen_arity, V2150))(shen_tail_call(shen_length, V2151[1][1])))) : (((shen_is_type_js(V2151, shen_type_cons) && (shen_is_type_js(V2151[1], shen_type_cons) && (shen_is_type_js(V2151[1][2], shen_type_cons) && ((shen_empty$question$_js(V2151[1][2][2])) && (shen_is_type_js(V2151[2], shen_type_cons) && (shen_is_type_js(V2151[2][1], shen_type_cons) && (shen_is_type_js(V2151[2][1][2], shen_type_cons) && (shen_empty$question$_js(V2151[2][1][2][2])))))))))) ? ((shen_tail_call(function() {return shen_equal$question$_js(shen_tail_call(shen_length, V2151[1][1]), shen_tail_call(shen_length, V2151[2][1][1]));})) ? (shen_tail_call(shen_get_fn_js(shen_aritycheck_action), V2151[1][2][1]),
  (shen_tail_call(shen_get_fn_js(shen_aritycheck), V2150)(V2151[2]))) : (shen_tail_call(shen_interror, "arity error in ~A~%")([shen_tuple, V2150, []]))) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_aritycheck"]))));});});
}
shen_aritycheck;

function shen_aritycheck_name(V2160) {
  if (V2160 == undefined) return shen_aritycheck_name;
  return (function lambda1407(V2161) {return (V2161 == undefined) ? lambda1407 : new Shen_tco_obj(function() {return (function lambda1406(V2162) {return (V2162 == undefined) ? lambda1406 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(-1, V2161);})) ? V2162 : ((shen_tail_call(function() {return shen_equal$question$_js(V2162, V2161);})) ? V2162 : (shen_tail_call(shen_tail_call(shen_intoutput, "~%warning: changing the arity of ~A can cause errors.~%"), [shen_tuple, V2160, []]),
  V2162)));});});});});
}
shen_aritycheck_name;

function shen_aritycheck_action(V2168) {
  if (V2168 == undefined) return shen_aritycheck_action;
  return ((shen_is_type_js(V2168, shen_type_cons)) ? (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_aah), V2168[1]), V2168[2]),
  (shen_tail_call(shen_map, shen_aritycheck_action)(V2168))) : [shen_type_symbol, "shen_skip"]);
}
shen_aritycheck_action;

function shen_aah(V2169) {
  if (V2169 == undefined) return shen_aah;
  return (function lambda1408(V2170) {return (V2170 == undefined) ? lambda1408 : new Shen_tco_obj(function() {return ((function(Arity) {return new Shen_tco_obj(function() {return ((function(Len) {return new Shen_tco_obj(function() {return ((((Arity > -1) && (Len > Arity))) ? (shen_tail_call(shen_intoutput, "warning: ~A might not like ~A argument~A.~%")([shen_tuple, V2169, [shen_tuple, Len, [shen_tuple, (((Len > 1)) ? "s" : ""), []]]])) : [shen_type_symbol, "shen_skip"]);});})(shen_tail_call(shen_length, V2170)))
;});})(shen_tail_call(shen_arity, V2169)))
;});});
}
shen_aah;

function shen_abstract$_rule(V2171) {
  if (V2171 == undefined) return shen_abstract$_rule;
  return (((shen_is_type_js(V2171, shen_type_cons) && (shen_is_type_js(V2171[2], shen_type_cons) && (shen_empty$question$_js(V2171[2][2]))))) ? (shen_tail_call(shen_get_fn_js(shen_abstraction$_build), V2171[1])(V2171[2][1])) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_abstract$_rule"])));
}
shen_abstract$_rule;

function shen_abstraction$_build(V2172) {
  if (V2172 == undefined) return shen_abstraction$_build;
  return (function lambda1409(V2173) {return (V2173 == undefined) ? lambda1409 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V2172))) ? V2173 : ((shen_is_type_js(V2172, shen_type_cons)) ? [shen_type_cons, [shen_type_symbol, "$slash$$dot$"], [shen_type_cons, V2172[1], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_abstraction$_build), V2172[2]), V2173), []]]] : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_abstraction$_build"]))));});});
}
shen_abstraction$_build;

function shen_parameters(V2174) {
  if (V2174 == undefined) return shen_parameters;
  return ((shen_tail_call(function() {return shen_equal$question$_js(0, V2174);})) ? [] : [shen_type_cons, shen_tail_call(shen_gensym, [shen_type_symbol, "V"]), shen_tail_call(shen_get_fn_js(shen_parameters), (V2174 - 1))]);
}
shen_parameters;

function shen_application$_build(V2175) {
  if (V2175 == undefined) return shen_application$_build;
  return (function lambda1410(V2176) {return (V2176 == undefined) ? lambda1410 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V2175))) ? V2176 : ((shen_is_type_js(V2175, shen_type_cons)) ? (shen_tail_call(shen_get_fn_js(shen_application$_build), V2175[2])([shen_type_cons, V2176, [shen_type_cons, V2175[1], []]])) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_application$_build"]))));});});
}
shen_application$_build;

function shen_compile$_to$_kl(V2177) {
  if (V2177 == undefined) return shen_compile$_to$_kl;
  return (function lambda1411(V2178) {return (V2178 == undefined) ? lambda1411 : new Shen_tco_obj(function() {return (((shen_is_type_js(V2178, shen_type_cons) && (shen_is_type_js(V2178[2], shen_type_cons) && (shen_empty$question$_js(V2178[2][2]))))) ? ((function(Arity) {return new Shen_tco_obj(function() {return ((function(Reduce) {return new Shen_tco_obj(function() {return ((function(CondExpression) {return new Shen_tco_obj(function() {return ((function(KL) {return new Shen_tco_obj(function() {return KL;});})([shen_type_cons, [shen_type_symbol, "defun"], [shen_type_cons, V2177, [shen_type_cons, V2178[1], [shen_type_cons, CondExpression, []]]]]))
;});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_cond_expression), V2177), V2178[1]), Reduce)))
;});})(shen_tail_call(shen_tail_call(shen_map, shen_reduce), V2178[2][1])))
;});})(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_store_arity), V2177), shen_tail_call(shen_length, V2178[1]))))
 : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_compile$_to$_kl"])));});});
}
shen_compile$_to$_kl;

function shen_store_arity(V2181) {
  if (V2181 == undefined) return shen_store_arity;
  return (function lambda1412(V2182) {return (V2182 == undefined) ? lambda1412 : new Shen_tco_obj(function() {return ((shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$installing_kl$asterisk$"])) ? [shen_type_symbol, "shen_skip"] : (shen_tail_call(shen_tail_call(shen_tail_call(shen_put, V2181), [shen_type_symbol, "arity"]), V2182)(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$property_vector$asterisk$"]))));});});
}
shen_store_arity;

function shen_reduce(V2183) {
  if (V2183 == undefined) return shen_reduce;
  return ((shen_globals[[shen_type_symbol, "shen_$asterisk$teststack$asterisk$"][1]] = []),
  ((function(Result) {return new Shen_tco_obj(function() {return [shen_type_cons, [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_symbol, "shen_tests"], shen_tail_call(shen_reverse, shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$teststack$asterisk$"]))]], [shen_type_cons, Result, []]];});})(shen_tail_call(shen_get_fn_js(shen_reduce$_help), V2183)))
);
}
shen_reduce;

function shen_reduce$_help(V2184) {
  if (V2184 == undefined) return shen_reduce$_help;
  return (((shen_is_type_js(V2184, shen_type_cons) && (shen_is_type_js(V2184[1], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$slash$$dot$"], V2184[1][1]);}) && (shen_is_type_js(V2184[1][2], shen_type_cons) && (shen_is_type_js(V2184[1][2][1], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "cons"], V2184[1][2][1][1]);}) && (shen_is_type_js(V2184[1][2][1][2], shen_type_cons) && (shen_is_type_js(V2184[1][2][1][2][2], shen_type_cons) && ((shen_empty$question$_js(V2184[1][2][1][2][2][2])) && (shen_is_type_js(V2184[1][2][2], shen_type_cons) && ((shen_empty$question$_js(V2184[1][2][2][2])) && (shen_is_type_js(V2184[2], shen_type_cons) && (shen_empty$question$_js(V2184[2][2]))))))))))))))) ? (shen_tail_call(shen_get_fn_js(shen_add$_test), [shen_type_cons, [shen_type_symbol, "cons$question$"], V2184[2]]),
  ((function(Abstraction) {return new Shen_tco_obj(function() {return ((function(Application) {return new Shen_tco_obj(function() {return (shen_get_fn_js(shen_reduce$_help)(Application));});})([shen_type_cons, [shen_type_cons, Abstraction, [shen_type_cons, [shen_type_cons, [shen_type_symbol, "hd"], V2184[2]], []]], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "tl"], V2184[2]], []]]))
;});})([shen_type_cons, [shen_type_symbol, "$slash$$dot$"], [shen_type_cons, V2184[1][2][1][2][1], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "$slash$$dot$"], [shen_type_cons, V2184[1][2][1][2][2][1], [shen_type_cons, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_ebr), V2184[2][1]), V2184[1][2][1]), V2184[1][2][2][1]), []]]], []]]]))
) : (((shen_is_type_js(V2184, shen_type_cons) && (shen_is_type_js(V2184[1], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$slash$$dot$"], V2184[1][1]);}) && (shen_is_type_js(V2184[1][2], shen_type_cons) && (shen_is_type_js(V2184[1][2][1], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$at$p"], V2184[1][2][1][1]);}) && (shen_is_type_js(V2184[1][2][1][2], shen_type_cons) && (shen_is_type_js(V2184[1][2][1][2][2], shen_type_cons) && ((shen_empty$question$_js(V2184[1][2][1][2][2][2])) && (shen_is_type_js(V2184[1][2][2], shen_type_cons) && ((shen_empty$question$_js(V2184[1][2][2][2])) && (shen_is_type_js(V2184[2], shen_type_cons) && (shen_empty$question$_js(V2184[2][2]))))))))))))))) ? (shen_tail_call(shen_get_fn_js(shen_add$_test), [shen_type_cons, [shen_type_symbol, "tuple$question$"], V2184[2]]),
  ((function(Abstraction) {return new Shen_tco_obj(function() {return ((function(Application) {return new Shen_tco_obj(function() {return (shen_get_fn_js(shen_reduce$_help)(Application));});})([shen_type_cons, [shen_type_cons, Abstraction, [shen_type_cons, [shen_type_cons, [shen_type_symbol, "fst"], V2184[2]], []]], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "snd"], V2184[2]], []]]))
;});})([shen_type_cons, [shen_type_symbol, "$slash$$dot$"], [shen_type_cons, V2184[1][2][1][2][1], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "$slash$$dot$"], [shen_type_cons, V2184[1][2][1][2][2][1], [shen_type_cons, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_ebr), V2184[2][1]), V2184[1][2][1]), V2184[1][2][2][1]), []]]], []]]]))
) : (((shen_is_type_js(V2184, shen_type_cons) && (shen_is_type_js(V2184[1], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$slash$$dot$"], V2184[1][1]);}) && (shen_is_type_js(V2184[1][2], shen_type_cons) && (shen_is_type_js(V2184[1][2][1], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$at$v"], V2184[1][2][1][1]);}) && (shen_is_type_js(V2184[1][2][1][2], shen_type_cons) && (shen_is_type_js(V2184[1][2][1][2][2], shen_type_cons) && ((shen_empty$question$_js(V2184[1][2][1][2][2][2])) && (shen_is_type_js(V2184[1][2][2], shen_type_cons) && ((shen_empty$question$_js(V2184[1][2][2][2])) && (shen_is_type_js(V2184[2], shen_type_cons) && (shen_empty$question$_js(V2184[2][2]))))))))))))))) ? (shen_tail_call(shen_get_fn_js(shen_add$_test), [shen_type_cons, [shen_type_symbol, "shen_$plus$vector$question$"], V2184[2]]),
  ((function(Abstraction) {return new Shen_tco_obj(function() {return ((function(Application) {return new Shen_tco_obj(function() {return (shen_get_fn_js(shen_reduce$_help)(Application));});})([shen_type_cons, [shen_type_cons, Abstraction, [shen_type_cons, [shen_type_cons, [shen_type_symbol, "hdv"], V2184[2]], []]], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "tlv"], V2184[2]], []]]))
;});})([shen_type_cons, [shen_type_symbol, "$slash$$dot$"], [shen_type_cons, V2184[1][2][1][2][1], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "$slash$$dot$"], [shen_type_cons, V2184[1][2][1][2][2][1], [shen_type_cons, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_ebr), V2184[2][1]), V2184[1][2][1]), V2184[1][2][2][1]), []]]], []]]]))
) : (((shen_is_type_js(V2184, shen_type_cons) && (shen_is_type_js(V2184[1], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$slash$$dot$"], V2184[1][1]);}) && (shen_is_type_js(V2184[1][2], shen_type_cons) && (shen_is_type_js(V2184[1][2][1], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$at$s"], V2184[1][2][1][1]);}) && (shen_is_type_js(V2184[1][2][1][2], shen_type_cons) && (shen_is_type_js(V2184[1][2][1][2][2], shen_type_cons) && ((shen_empty$question$_js(V2184[1][2][1][2][2][2])) && (shen_is_type_js(V2184[1][2][2], shen_type_cons) && ((shen_empty$question$_js(V2184[1][2][2][2])) && (shen_is_type_js(V2184[2], shen_type_cons) && (shen_empty$question$_js(V2184[2][2]))))))))))))))) ? (shen_tail_call(shen_get_fn_js(shen_add$_test), [shen_type_cons, [shen_type_symbol, "shen_$plus$string$question$"], V2184[2]]),
  ((function(Abstraction) {return new Shen_tco_obj(function() {return ((function(Application) {return new Shen_tco_obj(function() {return (shen_get_fn_js(shen_reduce$_help)(Application));});})([shen_type_cons, [shen_type_cons, Abstraction, [shen_type_cons, [shen_type_cons, [shen_type_symbol, "pos"], [shen_type_cons, V2184[2][1], [shen_type_cons, 0, []]]], []]], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "tlstr"], V2184[2]], []]]))
;});})([shen_type_cons, [shen_type_symbol, "$slash$$dot$"], [shen_type_cons, V2184[1][2][1][2][1], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "$slash$$dot$"], [shen_type_cons, V2184[1][2][1][2][2][1], [shen_type_cons, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_ebr), V2184[2][1]), [shen_type_cons, [shen_type_symbol, "$at$v"], V2184[1][2][1][2]]), V2184[1][2][2][1]), []]]], []]]]))
) : (((shen_is_type_js(V2184, shen_type_cons) && (shen_is_type_js(V2184[1], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$slash$$dot$"], V2184[1][1]);}) && (shen_is_type_js(V2184[1][2], shen_type_cons) && (shen_is_type_js(V2184[1][2][2], shen_type_cons) && ((shen_empty$question$_js(V2184[1][2][2][2])) && (shen_is_type_js(V2184[2], shen_type_cons) && ((shen_empty$question$_js(V2184[2][2])) && (!shen_tail_call(shen_variable$question$, V2184[1][2][1]))))))))))) ? (shen_tail_call(shen_get_fn_js(shen_add$_test), [shen_type_cons, [shen_type_symbol, "$eq$"], [shen_type_cons, V2184[1][2][1], V2184[2]]]),
  (shen_get_fn_js(shen_reduce$_help)(V2184[1][2][2][1]))) : (((shen_is_type_js(V2184, shen_type_cons) && (shen_is_type_js(V2184[1], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$slash$$dot$"], V2184[1][1]);}) && (shen_is_type_js(V2184[1][2], shen_type_cons) && (shen_is_type_js(V2184[1][2][2], shen_type_cons) && ((shen_empty$question$_js(V2184[1][2][2][2])) && (shen_is_type_js(V2184[2], shen_type_cons) && (shen_empty$question$_js(V2184[2][2])))))))))) ? (shen_get_fn_js(shen_reduce$_help)(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_ebr), V2184[2][1]), V2184[1][2][1]), V2184[1][2][2][1]))) : (((shen_is_type_js(V2184, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "where"], V2184[1]);}) && (shen_is_type_js(V2184[2], shen_type_cons) && (shen_is_type_js(V2184[2][2], shen_type_cons) && (shen_empty$question$_js(V2184[2][2][2]))))))) ? (shen_tail_call(shen_get_fn_js(shen_add$_test), V2184[2][1]),
  (shen_get_fn_js(shen_reduce$_help)(V2184[2][2][1]))) : (((shen_is_type_js(V2184, shen_type_cons) && (shen_is_type_js(V2184[2], shen_type_cons) && (shen_empty$question$_js(V2184[2][2]))))) ? ((function(Z) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(V2184[1], Z);})) ? V2184 : (shen_get_fn_js(shen_reduce$_help)([shen_type_cons, Z, V2184[2]])));});})(shen_tail_call(shen_get_fn_js(shen_reduce$_help), V2184[1])))
 : V2184))))))));
}
shen_reduce$_help;

function shen_$plus$string$question$(V2185) {
  if (V2185 == undefined) return shen_$plus$string$question$;
  return ((shen_tail_call(function() {return shen_equal$question$_js("", V2185);})) ? false : (typeof(V2185) == 'string'));
}
shen_$plus$string$question$;

function shen_$plus$vector(V2186) {
  if (V2186 == undefined) return shen_$plus$vector;
  return ((shen_tail_call(function() {return shen_equal$question$_js(V2186, shen_tail_call(shen_vector, 0));})) ? false : shen_vector$question$_js(V2186));
}
shen_$plus$vector;

function shen_ebr(V2195) {
  if (V2195 == undefined) return shen_ebr;
  return (function lambda1414(V2196) {return (V2196 == undefined) ? lambda1414 : new Shen_tco_obj(function() {return (function lambda1413(V2197) {return (V2197 == undefined) ? lambda1413 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(V2197, V2196);})) ? V2195 : (((shen_is_type_js(V2197, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$slash$$dot$"], V2197[1]);}) && (shen_is_type_js(V2197[2], shen_type_cons) && (shen_is_type_js(V2197[2][2], shen_type_cons) && ((shen_empty$question$_js(V2197[2][2][2])) && (shen_tail_call(shen_tail_call(shen_occurrences, V2196), V2197[2][1]) > 0))))))) ? V2197 : (((shen_is_type_js(V2197, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "let"], V2197[1]);}) && (shen_is_type_js(V2197[2], shen_type_cons) && (shen_is_type_js(V2197[2][2], shen_type_cons) && (shen_is_type_js(V2197[2][2][2], shen_type_cons) && ((shen_empty$question$_js(V2197[2][2][2][2])) && shen_tail_call(function() {return shen_equal$question$_js(V2197[2][1], V2196);})))))))) ? [shen_type_cons, [shen_type_symbol, "let"], [shen_type_cons, V2197[2][1], [shen_type_cons, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_ebr), V2195), V2197[2][1]), V2197[2][2][1]), V2197[2][2][2]]]] : ((shen_is_type_js(V2197, shen_type_cons)) ? [shen_type_cons, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_ebr), V2195), V2196), V2197[1]), shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_ebr), V2195), V2196), V2197[2])] : V2197))));});});});});
}
shen_ebr;

function shen_add$_test(V2200) {
  if (V2200 == undefined) return shen_add$_test;
  return (shen_globals[[shen_type_symbol, "shen_$asterisk$teststack$asterisk$"][1]] = [shen_type_cons, V2200, shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$teststack$asterisk$"])]);
}
shen_add$_test;

function shen_cond_expression(V2201) {
  if (V2201 == undefined) return shen_cond_expression;
  return (function lambda1416(V2202) {return (V2202 == undefined) ? lambda1416 : new Shen_tco_obj(function() {return (function lambda1415(V2203) {return (V2203 == undefined) ? lambda1415 : new Shen_tco_obj(function() {return ((function(Err) {return new Shen_tco_obj(function() {return ((function(Cases) {return new Shen_tco_obj(function() {return ((function(EncodeChoices) {return new Shen_tco_obj(function() {return (shen_get_fn_js(shen_cond_form)(EncodeChoices));});})(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_encode_choices), Cases), V2201)))
;});})(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_case_form), V2203), Err)))
;});})(shen_tail_call(shen_get_fn_js(shen_err_condition), V2201)))
;});});});});
}
shen_cond_expression;

function shen_cond_form(V2206) {
  if (V2206 == undefined) return shen_cond_form;
  return (((shen_is_type_js(V2206, shen_type_cons) && (shen_is_type_js(V2206[1], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js(true, V2206[1][1]);}) && (shen_is_type_js(V2206[1][2], shen_type_cons) && (shen_empty$question$_js(V2206[1][2][2]))))))) ? V2206[1][2][1] : [shen_type_cons, [shen_type_symbol, "cond"], V2206]);
}
shen_cond_form;

function shen_encode_choices(V2209) {
  if (V2209 == undefined) return shen_encode_choices;
  return (function lambda1417(V2210) {return (V2210 == undefined) ? lambda1417 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V2209))) ? [] : (((shen_is_type_js(V2209, shen_type_cons) && (shen_is_type_js(V2209[1], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js(true, V2209[1][1]);}) && (shen_is_type_js(V2209[1][2], shen_type_cons) && (shen_is_type_js(V2209[1][2][1], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_choicepoint$excl$"], V2209[1][2][1][1]);}) && (shen_is_type_js(V2209[1][2][1][2], shen_type_cons) && ((shen_empty$question$_js(V2209[1][2][1][2][2])) && ((shen_empty$question$_js(V2209[1][2][2])) && (shen_empty$question$_js(V2209[2])))))))))))) ? [shen_type_cons, [shen_type_cons, true, [shen_type_cons, [shen_type_cons, [shen_type_symbol, "let"], [shen_type_cons, [shen_type_symbol, "Result"], [shen_type_cons, V2209[1][2][1][2][1], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_if"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "$eq$"], [shen_type_cons, [shen_type_symbol, "Result"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "fail"], []], []]]], [shen_type_cons, ((shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$installing_kl$asterisk$"])) ? [shen_type_cons, [shen_type_symbol, "shen_sys_error"], [shen_type_cons, V2210, []]] : [shen_type_cons, [shen_type_symbol, "shen_f$_error"], [shen_type_cons, V2210, []]]), [shen_type_cons, [shen_type_symbol, "Result"], []]]]], []]]]], []]], []] : (((shen_is_type_js(V2209, shen_type_cons) && (shen_is_type_js(V2209[1], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js(true, V2209[1][1]);}) && (shen_is_type_js(V2209[1][2], shen_type_cons) && (shen_is_type_js(V2209[1][2][1], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_choicepoint$excl$"], V2209[1][2][1][1]);}) && (shen_is_type_js(V2209[1][2][1][2], shen_type_cons) && ((shen_empty$question$_js(V2209[1][2][1][2][2])) && (shen_empty$question$_js(V2209[1][2][2]))))))))))) ? [shen_type_cons, [shen_type_cons, true, [shen_type_cons, [shen_type_cons, [shen_type_symbol, "let"], [shen_type_cons, [shen_type_symbol, "Result"], [shen_type_cons, V2209[1][2][1][2][1], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_if"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "$eq$"], [shen_type_cons, [shen_type_symbol, "Result"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "fail"], []], []]]], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_cond_form), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_encode_choices), V2209[2]), V2210)), [shen_type_cons, [shen_type_symbol, "Result"], []]]]], []]]]], []]], []] : (((shen_is_type_js(V2209, shen_type_cons) && (shen_is_type_js(V2209[1], shen_type_cons) && (shen_is_type_js(V2209[1][2], shen_type_cons) && (shen_is_type_js(V2209[1][2][1], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_choicepoint$excl$"], V2209[1][2][1][1]);}) && (shen_is_type_js(V2209[1][2][1][2], shen_type_cons) && ((shen_empty$question$_js(V2209[1][2][1][2][2])) && (shen_empty$question$_js(V2209[1][2][2])))))))))) ? [shen_type_cons, [shen_type_cons, true, [shen_type_cons, [shen_type_cons, [shen_type_symbol, "let"], [shen_type_cons, [shen_type_symbol, "Freeze"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "freeze"], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_cond_form), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_encode_choices), V2209[2]), V2210)), []]], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_if"], [shen_type_cons, V2209[1][1], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "let"], [shen_type_cons, [shen_type_symbol, "Result"], [shen_type_cons, V2209[1][2][1][2][1], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_if"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "$eq$"], [shen_type_cons, [shen_type_symbol, "Result"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "fail"], []], []]]], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "thaw"], [shen_type_cons, [shen_type_symbol, "Freeze"], []]], [shen_type_cons, [shen_type_symbol, "Result"], []]]]], []]]]], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "thaw"], [shen_type_cons, [shen_type_symbol, "Freeze"], []]], []]]]], []]]]], []]], []] : (((shen_is_type_js(V2209, shen_type_cons) && (shen_is_type_js(V2209[1], shen_type_cons) && (shen_is_type_js(V2209[1][2], shen_type_cons) && (shen_empty$question$_js(V2209[1][2][2])))))) ? [shen_type_cons, V2209[1], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_encode_choices), V2209[2]), V2210)] : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_encode_choices"])))))));});});
}
shen_encode_choices;

function shen_case_form(V2215) {
  if (V2215 == undefined) return shen_case_form;
  return (function lambda1418(V2216) {return (V2216 == undefined) ? lambda1418 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V2215))) ? [shen_type_cons, V2216, []] : (((shen_is_type_js(V2215, shen_type_cons) && (shen_is_type_js(V2215[1], shen_type_cons) && (shen_is_type_js(V2215[1][1], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$colon$"], V2215[1][1][1]);}) && (shen_is_type_js(V2215[1][1][2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_tests"], V2215[1][1][2][1]);}) && ((shen_empty$question$_js(V2215[1][1][2][2])) && (shen_is_type_js(V2215[1][2], shen_type_cons) && (shen_is_type_js(V2215[1][2][1], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_choicepoint$excl$"], V2215[1][2][1][1]);}) && (shen_is_type_js(V2215[1][2][1][2], shen_type_cons) && ((shen_empty$question$_js(V2215[1][2][1][2][2])) && (shen_empty$question$_js(V2215[1][2][2]))))))))))))))) ? [shen_type_cons, [shen_type_cons, true, V2215[1][2]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_case_form), V2215[2]), V2216)] : (((shen_is_type_js(V2215, shen_type_cons) && (shen_is_type_js(V2215[1], shen_type_cons) && (shen_is_type_js(V2215[1][1], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$colon$"], V2215[1][1][1]);}) && (shen_is_type_js(V2215[1][1][2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_tests"], V2215[1][1][2][1]);}) && ((shen_empty$question$_js(V2215[1][1][2][2])) && (shen_is_type_js(V2215[1][2], shen_type_cons) && (shen_empty$question$_js(V2215[1][2][2]))))))))))) ? [shen_type_cons, [shen_type_cons, true, V2215[1][2]], []] : (((shen_is_type_js(V2215, shen_type_cons) && (shen_is_type_js(V2215[1], shen_type_cons) && (shen_is_type_js(V2215[1][1], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$colon$"], V2215[1][1][1]);}) && (shen_is_type_js(V2215[1][1][2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_tests"], V2215[1][1][2][1]);}) && (shen_is_type_js(V2215[1][2], shen_type_cons) && (shen_empty$question$_js(V2215[1][2][2])))))))))) ? [shen_type_cons, [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_embed_and), V2215[1][1][2][2]), V2215[1][2]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_case_form), V2215[2]), V2216)] : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_case_form"]))))));});});
}
shen_case_form;

function shen_embed_and(V2217) {
  if (V2217 == undefined) return shen_embed_and;
  return (((shen_is_type_js(V2217, shen_type_cons) && (shen_empty$question$_js(V2217[2])))) ? V2217[1] : ((shen_is_type_js(V2217, shen_type_cons)) ? [shen_type_cons, [shen_type_symbol, "and"], [shen_type_cons, V2217[1], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_embed_and), V2217[2]), []]]] : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_embed_and"]))));
}
shen_embed_and;

function shen_err_condition(V2218) {
  if (V2218 == undefined) return shen_err_condition;
  return ((shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$installing_kl$asterisk$"])) ? [shen_type_cons, true, [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_sys_error"], [shen_type_cons, V2218, []]], []]] : [shen_type_cons, true, [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_f$_error"], [shen_type_cons, V2218, []]], []]]);
}
shen_err_condition;

function shen_sys_error(V2219) {
  if (V2219 == undefined) return shen_sys_error;
  return (shen_tail_call(shen_interror, "system function ~A: unexpected argument~%")([shen_tuple, V2219, []]));
}
shen_sys_error;



//## FILE js/sys.js

function shen_eval(V4329) {
  if (V4329 == undefined) return shen_eval;
  return ((function(Macroexpand) {return new Shen_tco_obj(function() {return ((shen_tail_call(shen_get_fn_js(shen_packaged$question$), Macroexpand)) ? (shen_tail_call(shen_map, shen_eval_without_macros)(shen_tail_call(shen_get_fn_js(shen_package_contents), Macroexpand))) : (shen_eval_without_macros(Macroexpand)));});})(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_walk), shen_macroexpand), V4329)))
;
}
shen_eval;

function shen_packaged$question$(V4336) {
  if (V4336 == undefined) return shen_packaged$question$;
  return (((shen_is_type_js(V4336, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "package"], V4336[1]);}) && (shen_is_type_js(V4336[2], shen_type_cons) && shen_is_type_js(V4336[2][2], shen_type_cons))))) ? true : false);
}
shen_packaged$question$;

function shen_external(V4337) {
  if (V4337 == undefined) return shen_external;
  return new Shen_tco_obj(function() {return trap_error_js(function() {return shen_tail_call(shen_tail_call(shen_tail_call(shen_get, V4337), [shen_type_symbol, "shen_external_symbols"]), shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$property_vector$asterisk$"]));}, function(E) {return shen_tail_call(shen_tail_call(shen_interror, "package ~A has not been used.~"), []);});});
}
shen_external;

function shen_package_contents(V4340) {
  if (V4340 == undefined) return shen_package_contents;
  return (((shen_is_type_js(V4340, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "package"], V4340[1]);}) && (shen_is_type_js(V4340[2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "null"], V4340[2][1]);}) && shen_is_type_js(V4340[2][2], shen_type_cons)))))) ? V4340[2][2][2] : (((shen_is_type_js(V4340, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "package"], V4340[1]);}) && (shen_is_type_js(V4340[2], shen_type_cons) && shen_is_type_js(V4340[2][2], shen_type_cons))))) ? (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_packageh), V4340[2][1]), V4340[2][2][1])([shen_type_symbol, "Code"])) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_package_contents"]))));
}
shen_package_contents;

function shen_walk(V4341) {
  if (V4341 == undefined) return shen_walk;
  return (function lambda1552(V4342) {return (V4342 == undefined) ? lambda1552 : new Shen_tco_obj(function() {return ((shen_is_type_js(V4342, shen_type_cons)) ? (shen_get_fn_js(V4341)(shen_tail_call(shen_tail_call(shen_map, (function lambda1551(Z) {return (Z == undefined) ? lambda1551 : new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_walk), V4341)(Z));});})), V4342))) : (shen_get_fn_js(V4341)(V4342)));});});
}
shen_walk;

function shen_compile(V4343) {
  if (V4343 == undefined) return shen_compile;
  return (function lambda1554(V4344) {return (V4344 == undefined) ? lambda1554 : new Shen_tco_obj(function() {return (function lambda1553(V4345) {return (V4345 == undefined) ? lambda1553 : new Shen_tco_obj(function() {return ((function(O) {return new Shen_tco_obj(function() {return (((shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, O);}) || (!(shen_empty$question$_js(shen_tail_call(shen_fst, O)))))) ? (shen_tail_call(shen_get_fn_js(shen_compile_error), O)(V4345)) : (shen_snd(O)));});})(shen_tail_call(shen_get_fn_js(V4343), [shen_tuple, V4344, []])))
;});});});});
}
shen_compile;

function shen_compile_error(V4358) {
  if (V4358 == undefined) return shen_compile_error;
  return (function lambda1555(V4359) {return (V4359 == undefined) ? lambda1555 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4359))) ? shen_fail_obj : (((shen_is_type_js(V4358, shen_tuple) && shen_is_type_js(shen_tail_call(shen_fst, V4358), shen_type_cons))) ? (shen_get_fn_js(V4359)(shen_tail_call(shen_fst, V4358))) : (shen_tail_call(shen_interror, "syntax error~%")([]))));});});
}
shen_compile_error;

function shen_$lt$e$gt$(V4364) {
  if (V4364 == undefined) return shen_$lt$e$gt$;
  return ((shen_is_type_js(V4364, shen_tuple)) ? [shen_tuple, shen_tail_call(shen_fst, V4364), []] : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "$lt$e$gt$"])));
}
shen_$lt$e$gt$;

function shen_fail_if(V4365) {
  if (V4365 == undefined) return shen_fail_if;
  return (function lambda1556(V4366) {return (V4366 == undefined) ? lambda1556 : new Shen_tco_obj(function() {return ((shen_tail_call(shen_get_fn_js(V4365), V4366)) ? shen_fail_obj : V4366);});});
}
shen_fail_if;

function shen_$at$s(V4367) {
  if (V4367 == undefined) return shen_$at$s;
  return (function lambda1557(V4368) {return (V4368 == undefined) ? lambda1557 : new Shen_tco_obj(function() {return (V4367 + V4368);});});
}
shen_$at$s;

function shen_tc$question$(V4373) {
  if (V4373 == undefined) return shen_tc$question$;
  return (shen_value([shen_type_symbol, "shen_$asterisk$tc$asterisk$"]));
}
shen_tc$question$;

function shen_ps(V4374) {
  if (V4374 == undefined) return shen_ps;
  return new Shen_tco_obj(function() {return trap_error_js(function() {return shen_tail_call(shen_tail_call(shen_tail_call(shen_get, V4374), [shen_type_symbol, "shen_source"]), shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$property_vector$asterisk$"]));}, function(E) {return shen_tail_call(shen_tail_call(shen_interror, "~A not found.~%"), [shen_tuple, V4374, []]);});});
}
shen_ps;

function shen_explode(V4375) {
  if (V4375 == undefined) return shen_explode;
  return (((typeof(V4375) == 'string')) ? (shen_get_fn_js(shen_explode_string)(V4375)) : (shen_explode(shen_tail_call(shen_tail_call(shen_intmake_string, "~A"), [shen_tuple, V4375, []]))));
}
shen_explode;

function shen_explode_string(V4376) {
  if (V4376 == undefined) return shen_explode_string;
  return ((shen_tail_call(function() {return shen_equal$question$_js("", V4376);})) ? [] : ((function(S) {return new Shen_tco_obj(function() {return ((function(Ss) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Ss, [shen_type_symbol, "shen_eos"]);})) ? [] : [shen_type_cons, S, shen_tail_call(shen_get_fn_js(shen_explode_string), Ss)]);});})(shen_tail_call(shen_tlstr, V4376)))
;});})(V4376[0]))
);
}
shen_explode_string;

function shen_stinput(V4381) {
  if (V4381 == undefined) return shen_stinput;
  return (shen_value([shen_type_symbol, "$asterisk$stinput$asterisk$"]));
}
shen_stinput;

function shen_stoutput(V4386) {
  if (V4386 == undefined) return shen_stoutput;
  return (shen_value([shen_type_symbol, "$asterisk$stoutput$asterisk$"]));
}
shen_stoutput;

function shen_$plus$vector$question$(V4387) {
  if (V4387 == undefined) return shen_$plus$vector$question$;
  return (shen_absvector$question$_js(V4387) && (shen_absvector_ref_js(V4387, 0) > 0));
}
shen_$plus$vector$question$;


function shen_fillvector(V4391) {
  if (V4391 == undefined) return shen_fillvector;
  return (function lambda1560(V4392) {return (V4392 == undefined) ? lambda1560 : new Shen_tco_obj(function() {return (function lambda1559(V4393) {return (V4393 == undefined) ? lambda1559 : new Shen_tco_obj(function() {return (function lambda1558(V4394) {return (V4394 == undefined) ? lambda1558 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(V4393, V4392);})) ? V4391 : (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_fillvector), shen_absvector_set_js(V4391, V4392, V4394)), (1 + V4392)), V4393)(V4394)));});});});});});});
}
shen_fillvector;


function shen_vector_$gt$(V4397) {
  if (V4397 == undefined) return shen_vector_$gt$;
  return (function lambda1562(V4398) {return (V4398 == undefined) ? lambda1562 : new Shen_tco_obj(function() {return (function lambda1561(V4399) {return (V4399 == undefined) ? lambda1561 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(V4398, 0);})) ? (shen_tail_call(shen_interror, "cannot access 0th element of a vector~%")([])) : shen_absvector_set_js(V4397, V4398, V4399));});});});});
}
shen_vector_$gt$;

function shen_$lt$_vector(V4400) {
  if (V4400 == undefined) return shen_$lt$_vector;
  return (function lambda1563(V4401) {return (V4401 == undefined) ? lambda1563 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(V4401, 0);})) ? (shen_tail_call(shen_interror, "cannot access 0th element of a vector~%")([])) : ((function(VectorElement) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(VectorElement, shen_fail_obj);})) ? (shen_tail_call(shen_interror, "vector element not found~%")([])) : VectorElement);});})(shen_absvector_ref_js(V4400, V4401)))
);});});
}
shen_$lt$_vector;

function shen_posint$question$(V4402) {
  if (V4402 == undefined) return shen_posint$question$;
  return (shen_tail_call(shen_integer$question$, V4402) && (V4402 >= 0));
}
shen_posint$question$;

function shen_limit(V4403) {
  if (V4403 == undefined) return shen_limit;
  return shen_absvector_ref_js(V4403, 0);
}
shen_limit;


function shen_variable$question$(V4405) {
  if (V4405 == undefined) return shen_variable$question$;
  return new Shen_tco_obj(function() {return trap_error_js(function() {return shen_tail_call((function(String) {return new Shen_tco_obj(function() {return shen_tail_call((function(Unit) {return new Shen_tco_obj(function() {return shen_tail_call(shen_tail_call(shen_element$question$, Unit), [shen_type_cons, "A", [shen_type_cons, "B", [shen_type_cons, "C", [shen_type_cons, "D", [shen_type_cons, "E", [shen_type_cons, "F", [shen_type_cons, "G", [shen_type_cons, "H", [shen_type_cons, "I", [shen_type_cons, "J", [shen_type_cons, "K", [shen_type_cons, "L", [shen_type_cons, "M", [shen_type_cons, "N", [shen_type_cons, "O", [shen_type_cons, "P", [shen_type_cons, "Q", [shen_type_cons, "R", [shen_type_cons, "S", [shen_type_cons, "T", [shen_type_cons, "U", [shen_type_cons, "V", [shen_type_cons, "W", [shen_type_cons, "X", [shen_type_cons, "Y", [shen_type_cons, "Z", []]]]]]]]]]]]]]]]]]]]]]]]]]]);});}), String[0])
;});}), shen_tail_call(shen_str, V4405))
;}, function(E) {return false;});});
}
shen_variable$question$;

function shen_gensym(V4406) {
  if (V4406 == undefined) return shen_gensym;
  return (shen_tail_call(shen_concat, V4406)((shen_globals[[shen_type_symbol, "shen_$asterisk$gensym$asterisk$"][1]] = (1 + shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$gensym$asterisk$"])))));
}
shen_gensym;

function shen_concat(V4407) {
  if (V4407 == undefined) return shen_concat;
  return (function lambda1564(V4408) {return (V4408 == undefined) ? lambda1564 : new Shen_tco_obj(function() {return shen_intern_js((shen_tail_call(shen_str, V4407) + shen_tail_call(shen_str, V4408)));});});
}
shen_concat;


function shen_fst(V4411) {
  if (V4411 == undefined) return shen_fst;
  return shen_absvector_ref_js(V4411, 1);
}
shen_fst;

function shen_snd(V4412) {
  if (V4412 == undefined) return shen_snd;
  return shen_absvector_ref_js(V4412, 2);
}
shen_snd;

function shen_tuple$question$(V4413) {
  if (V4413 == undefined) return shen_tuple$question$;
  return new Shen_tco_obj(function() {return trap_error_js(function() {return (shen_absvector$question$_js(V4413) && shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_tuple"], shen_absvector_ref_js(V4413, 0));}));}, function(E) {return false;});});
}
shen_tuple$question$;

function shen_append(V4414) {
  if (V4414 == undefined) return shen_append;
  return (function lambda1565(V4415) {return (V4415 == undefined) ? lambda1565 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4414))) ? V4415 : ((shen_is_type_js(V4414, shen_type_cons)) ? [shen_type_cons, V4414[1], shen_tail_call(shen_tail_call(shen_append, V4414[2]), V4415)] : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "append"]))));});});
}
shen_append;

function shen_$at$v(V4416) {
  if (V4416 == undefined) return shen_$at$v;
  return (function lambda1566(V4417) {return (V4417 == undefined) ? lambda1566 : new Shen_tco_obj(function() {return ((function(Limit) {return new Shen_tco_obj(function() {return ((function(NewVector) {return new Shen_tco_obj(function() {return ((function(X$plus$NewVector) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Limit, 0);})) ? X$plus$NewVector : (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_$at$v_help), V4417), 1), Limit)(X$plus$NewVector)));});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_vector_$gt$, NewVector), 1), V4416)))
;});})(shen_tail_call(shen_vector, (Limit + 1))))
;});})(shen_tail_call(shen_limit, V4417)))
;});});
}
shen_$at$v;

function shen_$at$v_help(V4418) {
  if (V4418 == undefined) return shen_$at$v_help;
  return (function lambda1569(V4419) {return (V4419 == undefined) ? lambda1569 : new Shen_tco_obj(function() {return (function lambda1568(V4420) {return (V4420 == undefined) ? lambda1568 : new Shen_tco_obj(function() {return (function lambda1567(V4421) {return (V4421 == undefined) ? lambda1567 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(V4420, V4419);})) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_copyfromvector), V4418), V4421), V4420)((V4420 + 1))) : (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_$at$v_help), V4418), (V4419 + 1)), V4420)(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_copyfromvector), V4418), V4421), V4419), (V4419 + 1)))));});});});});});});
}
shen_$at$v_help;

function shen_copyfromvector(V4423) {
  if (V4423 == undefined) return shen_copyfromvector;
  return (function lambda1572(V4424) {return (V4424 == undefined) ? lambda1572 : new Shen_tco_obj(function() {return (function lambda1571(V4425) {return (V4425 == undefined) ? lambda1571 : new Shen_tco_obj(function() {return (function lambda1570(V4426) {return (V4426 == undefined) ? lambda1570 : new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_vector_$gt$, V4424), V4426)(shen_tail_call(shen_tail_call(shen_$lt$_vector, V4423), V4425)));});});});});});});
}
shen_copyfromvector;

function shen_hdv(V4427) {
  if (V4427 == undefined) return shen_hdv;
  return new Shen_tco_obj(function() {return trap_error_js(function() {return shen_tail_call(shen_tail_call(shen_$lt$_vector, V4427), 1);}, function(E) {return shen_tail_call(shen_tail_call(shen_interror, "hdv needs a non-empty vector as an argument; not ~S~%"), [shen_tuple, V4427, []]);});});
}
shen_hdv;

function shen_tlv(V4428) {
  if (V4428 == undefined) return shen_tlv;
  return ((function(Limit) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Limit, 0);})) ? (shen_tail_call(shen_interror, "cannot take the tail of the empty vector~%")([])) : ((shen_tail_call(function() {return shen_equal$question$_js(Limit, 1);})) ? (shen_vector(0)) : ((function(NewVector) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_tlv_help), V4428), 2), Limit)(shen_tail_call(shen_vector, (Limit - 1))));});})(shen_tail_call(shen_vector, (Limit - 1))))
));});})(shen_tail_call(shen_limit, V4428)))
;
}
shen_tlv;

function shen_tlv_help(V4429) {
  if (V4429 == undefined) return shen_tlv_help;
  return (function lambda1575(V4430) {return (V4430 == undefined) ? lambda1575 : new Shen_tco_obj(function() {return (function lambda1574(V4431) {return (V4431 == undefined) ? lambda1574 : new Shen_tco_obj(function() {return (function lambda1573(V4432) {return (V4432 == undefined) ? lambda1573 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(V4431, V4430);})) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_copyfromvector), V4429), V4432), V4431)((V4431 - 1))) : (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_tlv_help), V4429), (V4430 + 1)), V4431)(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_copyfromvector), V4429), V4432), V4430), (V4430 - 1)))));});});});});});});
}
shen_tlv_help;

function shen_assoc(V4442) {
  if (V4442 == undefined) return shen_assoc;
  return (function lambda1576(V4443) {return (V4443 == undefined) ? lambda1576 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4443))) ? [] : (((shen_is_type_js(V4443, shen_type_cons) && (shen_is_type_js(V4443[1], shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js(V4443[1][1], V4442);})))) ? V4443[1] : ((shen_is_type_js(V4443, shen_type_cons)) ? (shen_tail_call(shen_assoc, V4442)(V4443[2])) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "assoc"])))));});});
}
shen_assoc;

function shen_boolean$question$(V4449) {
  if (V4449 == undefined) return shen_boolean$question$;
  return ((shen_tail_call(function() {return shen_equal$question$_js(true, V4449);})) ? true : ((shen_tail_call(function() {return shen_equal$question$_js(false, V4449);})) ? true : false));
}
shen_boolean$question$;

function shen_nl(V4450) {
  if (V4450 == undefined) return shen_nl;
  return ((shen_tail_call(function() {return shen_equal$question$_js(0, V4450);})) ? 0 : (shen_tail_call(shen_tail_call(shen_intoutput, "~%"), []),
  (shen_nl((V4450 - 1)))));
}
shen_nl;

function shen_difference(V4453) {
  if (V4453 == undefined) return shen_difference;
  return (function lambda1577(V4454) {return (V4454 == undefined) ? lambda1577 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4453))) ? [] : ((shen_is_type_js(V4453, shen_type_cons)) ? ((shen_tail_call(shen_tail_call(shen_element$question$, V4453[1]), V4454)) ? (shen_tail_call(shen_difference, V4453[2])(V4454)) : [shen_type_cons, V4453[1], shen_tail_call(shen_tail_call(shen_difference, V4453[2]), V4454)]) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "difference"]))));});});
}
shen_difference;

function shen_do(V4455) {
  if (V4455 == undefined) return shen_do;
  return (function lambda1578(V4456) {return (V4456 == undefined) ? lambda1578 : new Shen_tco_obj(function() {return V4456;});});
}
shen_do;

function shen_element$question$(V4465) {
  if (V4465 == undefined) return shen_element$question$;
  return (function lambda1579(V4466) {return (V4466 == undefined) ? lambda1579 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4466))) ? false : (((shen_is_type_js(V4466, shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js(V4466[1], V4465);}))) ? true : ((shen_is_type_js(V4466, shen_type_cons)) ? (shen_tail_call(shen_element$question$, V4465)(V4466[2])) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "element$question$"])))));});});
}
shen_element$question$;


function shen_fix(V4473) {
  if (V4473 == undefined) return shen_fix;
  return (function lambda1580(V4474) {return (V4474 == undefined) ? lambda1580 : new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_fix_help), V4473), V4474)(shen_tail_call(shen_get_fn_js(V4473), V4474)));});});
}
shen_fix;

function shen_fix_help(V4481) {
  if (V4481 == undefined) return shen_fix_help;
  return (function lambda1582(V4482) {return (V4482 == undefined) ? lambda1582 : new Shen_tco_obj(function() {return (function lambda1581(V4483) {return (V4483 == undefined) ? lambda1581 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(V4483, V4482);})) ? V4483 : (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_fix_help), V4481), V4483)(shen_tail_call(shen_get_fn_js(V4481), V4483))));});});});});
}
shen_fix_help;

function shen_put(V4485) {
  if (V4485 == undefined) return shen_put;
  return (function lambda1585(V4486) {return (V4486 == undefined) ? lambda1585 : new Shen_tco_obj(function() {return (function lambda1584(V4487) {return (V4487 == undefined) ? lambda1584 : new Shen_tco_obj(function() {return (function lambda1583(V4488) {return (V4488 == undefined) ? lambda1583 : new Shen_tco_obj(function() {return ((function(N) {return new Shen_tco_obj(function() {return ((function(Entry) {return new Shen_tco_obj(function() {return ((function(Change) {return new Shen_tco_obj(function() {return V4487;});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_vector_$gt$, V4488), N), shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_change_pointer_value), V4485), V4486), V4487), Entry))))
;});})(trap_error_js(function() {return shen_tail_call(shen_tail_call(shen_$lt$_vector, V4488), N);}, function(E) {return [];})))
;});})(shen_tail_call(shen_tail_call(shen_hash, V4485), shen_tail_call(shen_limit, V4488))))
;});});});});});});
}
shen_put;

function shen_change_pointer_value(V4491) {
  if (V4491 == undefined) return shen_change_pointer_value;
  return (function lambda1588(V4492) {return (V4492 == undefined) ? lambda1588 : new Shen_tco_obj(function() {return (function lambda1587(V4493) {return (V4493 == undefined) ? lambda1587 : new Shen_tco_obj(function() {return (function lambda1586(V4494) {return (V4494 == undefined) ? lambda1586 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4494))) ? [shen_type_cons, [shen_type_cons, [shen_type_cons, V4491, [shen_type_cons, V4492, []]], V4493], []] : (((shen_is_type_js(V4494, shen_type_cons) && (shen_is_type_js(V4494[1], shen_type_cons) && (shen_is_type_js(V4494[1][1], shen_type_cons) && (shen_is_type_js(V4494[1][1][2], shen_type_cons) && ((shen_empty$question$_js(V4494[1][1][2][2])) && (shen_tail_call(function() {return shen_equal$question$_js(V4494[1][1][2][1], V4492);}) && shen_tail_call(function() {return shen_equal$question$_js(V4494[1][1][1], V4491);})))))))) ? [shen_type_cons, [shen_type_cons, V4494[1][1], V4493], V4494[2]] : ((shen_is_type_js(V4494, shen_type_cons)) ? [shen_type_cons, V4494[1], shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_change_pointer_value), V4491), V4492), V4493), V4494[2])] : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_change_pointer_value"])))));});});});});});});
}
shen_change_pointer_value;

function shen_get(V4497) {
  if (V4497 == undefined) return shen_get;
  return (function lambda1590(V4498) {return (V4498 == undefined) ? lambda1590 : new Shen_tco_obj(function() {return (function lambda1589(V4499) {return (V4499 == undefined) ? lambda1589 : new Shen_tco_obj(function() {return ((function(N) {return new Shen_tco_obj(function() {return ((function(Entry) {return new Shen_tco_obj(function() {return ((function(Result) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(Result))) ? (shen_tail_call(shen_interror, "value not found~%")([])) : Result[2]);});})(shen_tail_call(shen_tail_call(shen_assoc, [shen_type_cons, V4497, [shen_type_cons, V4498, []]]), Entry)))
;});})(trap_error_js(function() {return shen_tail_call(shen_tail_call(shen_$lt$_vector, V4499), N);}, function(E) {return shen_tail_call(shen_tail_call(shen_interror, "pointer not found~%"), []);})))
;});})(shen_tail_call(shen_tail_call(shen_hash, V4497), shen_tail_call(shen_limit, V4499))))
;});});});});
}
shen_get;

function shen_hash(V4500) {
  if (V4500 == undefined) return shen_hash;
  return (function lambda1591(V4501) {return (V4501 == undefined) ? lambda1591 : new Shen_tco_obj(function() {return ((function(Hash) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(0, Hash);})) ? 1 : Hash);});})(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_mod), shen_tail_call(shen_sum, shen_tail_call(shen_tail_call(shen_map, shen_unit_string_$gt$byte), shen_tail_call(shen_explode, V4500)))), V4501)))
;});});
}
shen_hash;

function shen_unit_string_$gt$byte(V4506) {
  if (V4506 == undefined) return shen_unit_string_$gt$byte;
  return ((shen_tail_call(function() {return shen_equal$question$_js("e", V4506);})) ? 101 : ((shen_tail_call(function() {return shen_equal$question$_js("E", V4506);})) ? 69 : ((shen_tail_call(function() {return shen_equal$question$_js("t", V4506);})) ? 116 : ((shen_tail_call(function() {return shen_equal$question$_js("T", V4506);})) ? 84 : ((shen_tail_call(function() {return shen_equal$question$_js("a", V4506);})) ? 97 : ((shen_tail_call(function() {return shen_equal$question$_js("A", V4506);})) ? 65 : ((shen_tail_call(function() {return shen_equal$question$_js("o", V4506);})) ? 111 : ((shen_tail_call(function() {return shen_equal$question$_js("O", V4506);})) ? 79 : ((shen_tail_call(function() {return shen_equal$question$_js("n", V4506);})) ? 110 : ((shen_tail_call(function() {return shen_equal$question$_js("N", V4506);})) ? 78 : ((shen_tail_call(function() {return shen_equal$question$_js("i", V4506);})) ? 105 : ((shen_tail_call(function() {return shen_equal$question$_js("I", V4506);})) ? 73 : ((shen_tail_call(function() {return shen_equal$question$_js("r", V4506);})) ? 114 : ((shen_tail_call(function() {return shen_equal$question$_js("R", V4506);})) ? 82 : ((shen_tail_call(function() {return shen_equal$question$_js("s", V4506);})) ? 115 : ((shen_tail_call(function() {return shen_equal$question$_js("S", V4506);})) ? 83 : ((shen_tail_call(function() {return shen_equal$question$_js("h", V4506);})) ? 104 : ((shen_tail_call(function() {return shen_equal$question$_js("H", V4506);})) ? 72 : ((shen_tail_call(function() {return shen_equal$question$_js("d", V4506);})) ? 100 : ((shen_tail_call(function() {return shen_equal$question$_js("D", V4506);})) ? 68 : ((shen_tail_call(function() {return shen_equal$question$_js("+", V4506);})) ? 43 : ((shen_tail_call(function() {return shen_equal$question$_js("-", V4506);})) ? 45 : ((shen_tail_call(function() {return shen_equal$question$_js("0", V4506);})) ? 48 : ((shen_tail_call(function() {return shen_equal$question$_js("1", V4506);})) ? 49 : ((shen_tail_call(function() {return shen_equal$question$_js("2", V4506);})) ? 50 : ((shen_tail_call(function() {return shen_equal$question$_js("3", V4506);})) ? 51 : ((shen_tail_call(function() {return shen_equal$question$_js("4", V4506);})) ? 52 : ((shen_tail_call(function() {return shen_equal$question$_js("5", V4506);})) ? 53 : ((shen_tail_call(function() {return shen_equal$question$_js("6", V4506);})) ? 54 : ((shen_tail_call(function() {return shen_equal$question$_js("7", V4506);})) ? 55 : ((shen_tail_call(function() {return shen_equal$question$_js("8", V4506);})) ? 56 : ((shen_tail_call(function() {return shen_equal$question$_js("9", V4506);})) ? 57 : ((shen_tail_call(function() {return shen_equal$question$_js("l", V4506);})) ? 108 : ((shen_tail_call(function() {return shen_equal$question$_js("L", V4506);})) ? 76 : ((shen_tail_call(function() {return shen_equal$question$_js("f", V4506);})) ? 102 : ((shen_tail_call(function() {return shen_equal$question$_js("F", V4506);})) ? 70 : ((shen_tail_call(function() {return shen_equal$question$_js("m", V4506);})) ? 109 : ((shen_tail_call(function() {return shen_equal$question$_js("M", V4506);})) ? 77 : ((shen_tail_call(function() {return shen_equal$question$_js("c", V4506);})) ? 99 : ((shen_tail_call(function() {return shen_equal$question$_js("C", V4506);})) ? 67 : ((shen_tail_call(function() {return shen_equal$question$_js("(", V4506);})) ? 40 : ((shen_tail_call(function() {return shen_equal$question$_js(")", V4506);})) ? 41 : ((shen_tail_call(function() {return shen_equal$question$_js("u", V4506);})) ? 117 : ((shen_tail_call(function() {return shen_equal$question$_js("U", V4506);})) ? 85 : ((shen_tail_call(function() {return shen_equal$question$_js("g", V4506);})) ? 103 : ((shen_tail_call(function() {return shen_equal$question$_js("G", V4506);})) ? 71 : ((shen_tail_call(function() {return shen_equal$question$_js("y", V4506);})) ? 121 : ((shen_tail_call(function() {return shen_equal$question$_js("Y", V4506);})) ? 89 : ((shen_tail_call(function() {return shen_equal$question$_js("p", V4506);})) ? 112 : ((shen_tail_call(function() {return shen_equal$question$_js("P", V4506);})) ? 80 : ((shen_tail_call(function() {return shen_equal$question$_js("w", V4506);})) ? 119 : ((shen_tail_call(function() {return shen_equal$question$_js("W", V4506);})) ? 87 : ((shen_tail_call(function() {return shen_equal$question$_js("b", V4506);})) ? 98 : ((shen_tail_call(function() {return shen_equal$question$_js("B", V4506);})) ? 66 : ((shen_tail_call(function() {return shen_equal$question$_js("v", V4506);})) ? 118 : ((shen_tail_call(function() {return shen_equal$question$_js("V", V4506);})) ? 86 : ((shen_tail_call(function() {return shen_equal$question$_js("k", V4506);})) ? 107 : ((shen_tail_call(function() {return shen_equal$question$_js("K", V4506);})) ? 75 : ((shen_tail_call(function() {return shen_equal$question$_js("x", V4506);})) ? 120 : ((shen_tail_call(function() {return shen_equal$question$_js("X", V4506);})) ? 88 : ((shen_tail_call(function() {return shen_equal$question$_js("j", V4506);})) ? 106 : ((shen_tail_call(function() {return shen_equal$question$_js("J", V4506);})) ? 74 : ((shen_tail_call(function() {return shen_equal$question$_js("q", V4506);})) ? 113 : ((shen_tail_call(function() {return shen_equal$question$_js("Q", V4506);})) ? 81 : ((shen_tail_call(function() {return shen_equal$question$_js("z", V4506);})) ? 122 : ((shen_tail_call(function() {return shen_equal$question$_js("Z", V4506);})) ? 90 : ((shen_tail_call(function() {return shen_equal$question$_js("[", V4506);})) ? 91 : ((shen_tail_call(function() {return shen_equal$question$_js("]", V4506);})) ? 93 : ((shen_tail_call(function() {return shen_equal$question$_js("{", V4506);})) ? 123 : ((shen_tail_call(function() {return shen_equal$question$_js("}", V4506);})) ? 125 : ((shen_tail_call(function() {return shen_equal$question$_js("=", V4506);})) ? 61 : ((shen_tail_call(function() {return shen_equal$question$_js("_", V4506);})) ? 95 : ((shen_tail_call(function() {return shen_equal$question$_js("!", V4506);})) ? 33 : ((shen_tail_call(function() {return shen_equal$question$_js("?", V4506);})) ? 63 : ((shen_tail_call(function() {return shen_equal$question$_js("#", V4506);})) ? 35 : ((shen_tail_call(function() {return shen_equal$question$_js("\"", V4506);})) ? 34 : ((shen_tail_call(function() {return shen_equal$question$_js("\x0d", V4506);})) ? 13 : ((shen_tail_call(function() {return shen_equal$question$_js("\x0a", V4506);})) ? 10 : ((shen_tail_call(function() {return shen_equal$question$_js("	", V4506);})) ? 9 : ((shen_tail_call(function() {return shen_equal$question$_js("$", V4506);})) ? 36 : ((shen_tail_call(function() {return shen_equal$question$_js("&", V4506);})) ? 38 : ((shen_tail_call(function() {return shen_equal$question$_js("*", V4506);})) ? 42 : ((shen_tail_call(function() {return shen_equal$question$_js("/", V4506);})) ? 47 : ((shen_tail_call(function() {return shen_equal$question$_js(",", V4506);})) ? 44 : ((shen_tail_call(function() {return shen_equal$question$_js(".", V4506);})) ? 46 : ((shen_tail_call(function() {return shen_equal$question$_js(":", V4506);})) ? 58 : ((shen_tail_call(function() {return shen_equal$question$_js(";", V4506);})) ? 59 : ((shen_tail_call(function() {return shen_equal$question$_js("<", V4506);})) ? 60 : ((shen_tail_call(function() {return shen_equal$question$_js(">", V4506);})) ? 62 : ((shen_tail_call(function() {return shen_equal$question$_js("@", V4506);})) ? 64 : ((shen_tail_call(function() {return shen_equal$question$_js("%", V4506);})) ? 37 : ((shen_tail_call(function() {return shen_equal$question$_js("'", V4506);})) ? 39 : ((shen_tail_call(function() {return shen_equal$question$_js("`", V4506);})) ? 96 : ((shen_tail_call(function() {return shen_equal$question$_js("|", V4506);})) ? 124 : ((shen_tail_call(function() {return shen_equal$question$_js("~", V4506);})) ? 126 : ((shen_tail_call(function() {return shen_equal$question$_js("\\", V4506);})) ? 92 : ((shen_tail_call(function() {return shen_equal$question$_js(" ", V4506);})) ? 32 : (shen_tail_call(shen_interror, "Cannot map unit string to byte~%")([])))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))));
}
shen_unit_string_$gt$byte;

function shen_mod(V4507) {
  if (V4507 == undefined) return shen_mod;
  return (function lambda1592(V4508) {return (V4508 == undefined) ? lambda1592 : new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_modh), V4507)(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_multiples), V4507), [shen_type_cons, V4508, []])));});});
}
shen_mod;

function shen_multiples(V4509) {
  if (V4509 == undefined) return shen_multiples;
  return (function lambda1593(V4510) {return (V4510 == undefined) ? lambda1593 : new Shen_tco_obj(function() {return (((shen_is_type_js(V4510, shen_type_cons) && (V4510[1] > V4509))) ? V4510[2] : ((shen_is_type_js(V4510, shen_type_cons)) ? (shen_tail_call(shen_get_fn_js(shen_multiples), V4509)([shen_type_cons, (2 * V4510[1]), V4510])) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_multiples"]))));});});
}
shen_multiples;

function shen_modh(V4513) {
  if (V4513 == undefined) return shen_modh;
  return (function lambda1594(V4514) {return (V4514 == undefined) ? lambda1594 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(0, V4513);})) ? 0 : (((shen_empty$question$_js(V4514))) ? V4513 : (((shen_is_type_js(V4514, shen_type_cons) && (V4514[1] > V4513))) ? (((shen_empty$question$_js(V4514[2]))) ? V4513 : (shen_tail_call(shen_get_fn_js(shen_modh), V4513)(V4514[2]))) : ((shen_is_type_js(V4514, shen_type_cons)) ? (shen_tail_call(shen_get_fn_js(shen_modh), (V4513 - V4514[1]))(V4514)) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_modh"]))))));});});
}
shen_modh;

function shen_sum(V4515) {
  if (V4515 == undefined) return shen_sum;
  return (((shen_empty$question$_js(V4515))) ? 0 : ((shen_is_type_js(V4515, shen_type_cons)) ? (V4515[1] + shen_tail_call(shen_sum, V4515[2])) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "sum"]))));
}
shen_sum;

function shen_head(V4522) {
  if (V4522 == undefined) return shen_head;
  return ((shen_is_type_js(V4522, shen_type_cons)) ? V4522[1] : (shen_tail_call(shen_interror, "head expects a non-empty list")([])));
}
shen_head;

function shen_tail(V4529) {
  if (V4529 == undefined) return shen_tail;
  return ((shen_is_type_js(V4529, shen_type_cons)) ? V4529[2] : (shen_tail_call(shen_interror, "tail expects a non-empty list")([])));
}
shen_tail;

function shen_hdstr(V4530) {
  if (V4530 == undefined) return shen_hdstr;
  return V4530[0];
}
shen_hdstr;

function shen_intersection(V4533) {
  if (V4533 == undefined) return shen_intersection;
  return (function lambda1595(V4534) {return (V4534 == undefined) ? lambda1595 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4533))) ? [] : ((shen_is_type_js(V4533, shen_type_cons)) ? ((shen_tail_call(shen_tail_call(shen_element$question$, V4533[1]), V4534)) ? [shen_type_cons, V4533[1], shen_tail_call(shen_tail_call(shen_intersection, V4533[2]), V4534)] : (shen_tail_call(shen_intersection, V4533[2])(V4534))) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "intersection"]))));});});
}
shen_intersection;

function shen_reverse(V4535) {
  if (V4535 == undefined) return shen_reverse;
  return (shen_tail_call(shen_get_fn_js(shen_reverse$_help), V4535)([]));
}
shen_reverse;

function shen_reverse$_help(V4536) {
  if (V4536 == undefined) return shen_reverse$_help;
  return (function lambda1596(V4537) {return (V4537 == undefined) ? lambda1596 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4536))) ? V4537 : ((shen_is_type_js(V4536, shen_type_cons)) ? (shen_tail_call(shen_get_fn_js(shen_reverse$_help), V4536[2])([shen_type_cons, V4536[1], V4537])) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_reverse$_help"]))));});});
}
shen_reverse$_help;

function shen_union(V4538) {
  if (V4538 == undefined) return shen_union;
  return (function lambda1597(V4539) {return (V4539 == undefined) ? lambda1597 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4538))) ? V4539 : ((shen_is_type_js(V4538, shen_type_cons)) ? ((shen_tail_call(shen_tail_call(shen_element$question$, V4538[1]), V4539)) ? (shen_tail_call(shen_union, V4538[2])(V4539)) : [shen_type_cons, V4538[1], shen_tail_call(shen_tail_call(shen_union, V4538[2]), V4539)]) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "union"]))));});});
}
shen_union;

function shen_y_or_n$question$(V4540) {
  if (V4540 == undefined) return shen_y_or_n$question$;
  return ((function(Message) {return new Shen_tco_obj(function() {return ((function(Input) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js("y", Input);})) ? true : ((shen_tail_call(function() {return shen_equal$question$_js("n", Input);})) ? false : (shen_tail_call(shen_tail_call(shen_intoutput, "please answer y or n~%"), []),
  (shen_y_or_n$question$(V4540)))));});})(shen_tail_call(shen_tail_call(shen_intmake_string, "~A"), [shen_tuple, shen_tail_call(shen_input), []])))
;});})(shen_tail_call(shen_tail_call(shen_intoutput, "~A (y/n) "), [shen_tuple, V4540, []])))
;
}
shen_y_or_n$question$;


function shen_subst(V4550) {
  if (V4550 == undefined) return shen_subst;
  return (function lambda1599(V4551) {return (V4551 == undefined) ? lambda1599 : new Shen_tco_obj(function() {return (function lambda1598(V4552) {return (V4552 == undefined) ? lambda1598 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(V4552, V4551);})) ? V4550 : ((shen_is_type_js(V4552, shen_type_cons)) ? [shen_type_cons, shen_tail_call(shen_tail_call(shen_tail_call(shen_subst, V4550), V4551), V4552[1]), shen_tail_call(shen_tail_call(shen_tail_call(shen_subst, V4550), V4551), V4552[2])] : V4552));});});});});
}
shen_subst;

function shen_cd(V4554) {
  if (V4554 == undefined) return shen_cd;
  return (shen_globals[[shen_type_symbol, "$asterisk$home_directory$asterisk$"][1]] = ((shen_tail_call(function() {return shen_equal$question$_js(V4554, "");})) ? "" : shen_tail_call(shen_tail_call(shen_intmake_string, "~A/"), [shen_tuple, V4554, []])));
}
shen_cd;

function shen_map(V4557) {
  if (V4557 == undefined) return shen_map;
  return (function lambda1600(V4558) {return (V4558 == undefined) ? lambda1600 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4558))) ? [] : ((shen_is_type_js(V4558, shen_type_cons)) ? [shen_type_cons, shen_tail_call(shen_get_fn_js(V4557), V4558[1]), shen_tail_call(shen_tail_call(shen_map, V4557), V4558[2])] : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "map"]))));});});
}
shen_map;

function shen_length(V4559) {
  if (V4559 == undefined) return shen_length;
  return (shen_tail_call(shen_get_fn_js(shen_length_h), V4559)(0));
}
shen_length;

function shen_length_h(V4560) {
  if (V4560 == undefined) return shen_length_h;
  return (function lambda1601(V4561) {return (V4561 == undefined) ? lambda1601 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4560))) ? V4561 : (shen_tail_call(shen_get_fn_js(shen_length_h), V4560[2])((V4561 + 1))));});});
}
shen_length_h;

function shen_occurrences(V4570) {
  if (V4570 == undefined) return shen_occurrences;
  return (function lambda1602(V4571) {return (V4571 == undefined) ? lambda1602 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(V4571, V4570);})) ? 1 : ((shen_is_type_js(V4571, shen_type_cons)) ? (shen_tail_call(shen_tail_call(shen_occurrences, V4570), V4571[1]) + shen_tail_call(shen_tail_call(shen_occurrences, V4570), V4571[2])) : 0));});});
}
shen_occurrences;

function shen_nth(V4579) {
  if (V4579 == undefined) return shen_nth;
  return (function lambda1603(V4580) {return (V4580 == undefined) ? lambda1603 : new Shen_tco_obj(function() {return (((shen_tail_call(function() {return shen_equal$question$_js(1, V4579);}) && shen_is_type_js(V4580, shen_type_cons))) ? V4580[1] : ((shen_is_type_js(V4580, shen_type_cons)) ? (shen_tail_call(shen_nth, (V4579 - 1))(V4580[2])) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "nth"]))));});});
}
shen_nth;

function shen_integer$question$(V4581) {
  if (V4581 == undefined) return shen_integer$question$;
  return ((typeof(V4581) == 'number') && shen_tail_call((function(Abs) {return new Shen_tco_obj(function() {return shen_tail_call(shen_tail_call(shen_get_fn_js(shen_integer_test$question$), Abs), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_magless), Abs), 1));});}), shen_tail_call(shen_get_fn_js(shen_abs), V4581))
);
}
shen_integer$question$;

function shen_abs(V4582) {
  if (V4582 == undefined) return shen_abs;
  return (((V4582 > 0)) ? V4582 : (0 - V4582));
}
shen_abs;

function shen_magless(V4583) {
  if (V4583 == undefined) return shen_magless;
  return (function lambda1604(V4584) {return (V4584 == undefined) ? lambda1604 : new Shen_tco_obj(function() {return ((function(Nx10) {return new Shen_tco_obj(function() {return (((Nx10 > V4583)) ? V4584 : (shen_tail_call(shen_get_fn_js(shen_magless), V4583)(Nx10)));});})((V4584 * 10)))
;});});
}
shen_magless;

function shen_integer_test$question$(V4588) {
  if (V4588 == undefined) return shen_integer_test$question$;
  return (function lambda1605(V4589) {return (V4589 == undefined) ? lambda1605 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(0, V4588);})) ? true : ((((V4588 > 0) && (V4588 < 1))) ? false : ((function(Abs_N) {return new Shen_tco_obj(function() {return (((0 > Abs_N)) ? (shen_integer$question$(V4588)) : (shen_tail_call(shen_get_fn_js(shen_integer_test$question$), Abs_N)(V4589)));});})((V4588 - V4589)))
));});});
}
shen_integer_test$question$;

function shen_mapcan(V4592) {
  if (V4592 == undefined) return shen_mapcan;
  return (function lambda1606(V4593) {return (V4593 == undefined) ? lambda1606 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4593))) ? [] : ((shen_is_type_js(V4593, shen_type_cons)) ? (shen_tail_call(shen_append, shen_tail_call(shen_get_fn_js(V4592), V4593[1]))(shen_tail_call(shen_tail_call(shen_mapcan, V4592), V4593[2]))) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "mapcan"]))));});});
}
shen_mapcan;

function shen_read_file_as_bytelist(V4594) {
  if (V4594 == undefined) return shen_read_file_as_bytelist;
  return ((function(Stream) {return new Shen_tco_obj(function() {return ((function(Byte) {return new Shen_tco_obj(function() {return ((function(Bytes) {return new Shen_tco_obj(function() {return ((function(Close) {return new Shen_tco_obj(function() {return (shen_reverse(Bytes));});})(shen_tail_call(shen_close, Stream)))
;});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_read_file_as_bytelist_help), Stream), Byte), [])))
;});})(shen_tail_call(shen_read_byte, Stream)))
;});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_open, [shen_type_symbol, "file"]), V4594), [shen_type_symbol, "shen_in"])))
;
}
shen_read_file_as_bytelist;

function shen_read_file_as_bytelist_help(V4595) {
  if (V4595 == undefined) return shen_read_file_as_bytelist_help;
  return (function lambda1608(V4596) {return (V4596 == undefined) ? lambda1608 : new Shen_tco_obj(function() {return (function lambda1607(V4597) {return (V4597 == undefined) ? lambda1607 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(-1, V4596);})) ? V4597 : (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_read_file_as_bytelist_help), V4595), shen_tail_call(shen_read_byte, V4595))([shen_type_cons, V4596, V4597])));});});});});
}
shen_read_file_as_bytelist_help;

function shen_read_file_as_string(V4598) {
  if (V4598 == undefined) return shen_read_file_as_string;
  return ((function(Stream) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_rfas_h), Stream), shen_tail_call(shen_read_byte, Stream))(""));});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_open, [shen_type_symbol, "file"]), V4598), [shen_type_symbol, "shen_in"])))
;
}
shen_read_file_as_string;

function shen_rfas_h(V4599) {
  if (V4599 == undefined) return shen_rfas_h;
  return (function lambda1610(V4600) {return (V4600 == undefined) ? lambda1610 : new Shen_tco_obj(function() {return (function lambda1609(V4601) {return (V4601 == undefined) ? lambda1609 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(-1, V4600);})) ? (shen_tail_call(shen_close, V4599),
  V4601) : (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_rfas_h), V4599), shen_tail_call(shen_read_byte, V4599))((V4601 + shen_tail_call(shen_n_$gt$string, V4600)))));});});});});
}
shen_rfas_h;

function shen_$eq$$eq$(V4610) {
  if (V4610 == undefined) return shen_$eq$$eq$;
  return (function lambda1611(V4611) {return (V4611 == undefined) ? lambda1611 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(V4611, V4610);})) ? true : false);});});
}
shen_$eq$$eq$;

function shen_abort() {return (shen_simple_error(""));}
shen_abort;

function shen_read() {return shen_tail_call(shen_lineread)[1];}
shen_read;

function shen_input() {return (shen_eval(shen_tail_call(shen_read)));}
shen_input;

function shen_input$plus$(V4617) {
  if (V4617 == undefined) return shen_input$plus$;
  return (function lambda1612(V4618) {return (V4618 == undefined) ? lambda1612 : new Shen_tco_obj(function() {return ((function(Input) {return new Shen_tco_obj(function() {return ((function(Check) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(false, Check);})) ? (shen_tail_call(shen_tail_call(shen_intoutput, "input is not of type ~S: please re-enter "), [shen_tuple, V4618, []]),
  (shen_tail_call(shen_input$plus$, [shen_type_symbol, "$colon$"])(V4618))) : (shen_eval(Input)));});})(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_typecheck), Input), V4618)))
;});})(shen_tail_call(shen_read)))
;});});
}
shen_input$plus$;

function shen_bound$question$(V4619) {
  if (V4619 == undefined) return shen_bound$question$;
  return (shen_is_type_js(V4619, shen_type_symbol) && shen_tail_call((function(Val) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Val, [shen_type_symbol, "shen_this_symbol_is_unbound"]);})) ? false : true);});}), trap_error_js(function() {return shen_tail_call(shen_value, V4619);}, function(E) {return [shen_type_symbol, "shen_this_symbol_is_unbound"];}))
);
}
shen_bound$question$;

function shen_string_$gt$bytes(V4620) {
  if (V4620 == undefined) return shen_string_$gt$bytes;
  return ((shen_tail_call(function() {return shen_equal$question$_js("", V4620);})) ? [] : [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_unit_string_$gt$byte), V4620[0]), shen_tail_call(shen_get_fn_js(shen_string_$gt$bytes), shen_tail_call(shen_tlstr, V4620))]);
}
shen_string_$gt$bytes;

function shen_maxinferences(V4621) {
  if (V4621 == undefined) return shen_maxinferences;
  return (shen_globals[[shen_type_symbol, "shen_$asterisk$maxinferences$asterisk$"][1]] = V4621);
}
shen_maxinferences;

function shen_inferences(V4626) {
  if (V4626 == undefined) return shen_inferences;
  return (shen_value([shen_type_symbol, "shen_$asterisk$infs$asterisk$"]));
}
shen_inferences;

function shen_hush(V4631) {
  if (V4631 == undefined) return shen_hush;
  return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$plus$"], V4631);})) ? (shen_globals[[shen_type_symbol, "shen_$asterisk$hush$asterisk$"][1]] = true) : ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "_"], V4631);})) ? ((shen_globals[[shen_type_symbol, "shen_$asterisk$hush$asterisk$"][1]] = false),
  [shen_type_symbol, "shen_unhushed"]) : (shen_tail_call(shen_interror, "'hush' expects a + or a -~%")([]))));
}
shen_hush;



//## FILE js/sequent.js

function shen_datatype_error(V4081) {
  if (V4081 == undefined) return shen_datatype_error;
  return (shen_tail_call(shen_interror, "datatype syntax error here:~%~% ~A~%")([shen_tuple, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_next_50), 50), V4081), []]));
}
shen_datatype_error;

function shen_$lt$datatype_rules$gt$(V4086) {
  if (V4086 == undefined) return shen_$lt$datatype_rules$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$e$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$e$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$e$gt$)), []) : shen_fail_obj);});}), shen_tail_call(shen_$lt$e$gt$, V4086))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$datatype_rule$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$datatype_rule$gt$);}))) ? shen_tail_call((function(Parse$_$lt$datatype_rules$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$datatype_rules$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$datatype_rules$gt$)), [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$datatype_rule$gt$), shen_tail_call(shen_snd, Parse$_$lt$datatype_rules$gt$)]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$datatype_rules$gt$), Parse$_$lt$datatype_rule$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$datatype_rule$gt$), V4086))
))
;
}
shen_$lt$datatype_rules$gt$;

function shen_$lt$datatype_rule$gt$(V4091) {
  if (V4091 == undefined) return shen_$lt$datatype_rule$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$side_conditions$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$side_conditions$gt$);}))) ? shen_tail_call((function(Parse$_$lt$premises$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$premises$gt$);}))) ? shen_tail_call((function(Parse$_$lt$doubleunderline$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$doubleunderline$gt$);}))) ? shen_tail_call((function(Parse$_$lt$conclusion$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$conclusion$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$conclusion$gt$)), [shen_tuple, [shen_type_symbol, "shen_double"], [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$side_conditions$gt$), [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$premises$gt$), [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$conclusion$gt$), []]]]]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$conclusion$gt$), Parse$_$lt$doubleunderline$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$doubleunderline$gt$), Parse$_$lt$premises$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$premises$gt$), Parse$_$lt$side_conditions$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$side_conditions$gt$), V4091))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$side_conditions$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$side_conditions$gt$);}))) ? shen_tail_call((function(Parse$_$lt$premises$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$premises$gt$);}))) ? shen_tail_call((function(Parse$_$lt$singleunderline$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$singleunderline$gt$);}))) ? shen_tail_call((function(Parse$_$lt$conclusion$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$conclusion$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$conclusion$gt$)), [shen_tuple, [shen_type_symbol, "shen_single"], [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$side_conditions$gt$), [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$premises$gt$), [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$conclusion$gt$), []]]]]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$conclusion$gt$), Parse$_$lt$singleunderline$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$singleunderline$gt$), Parse$_$lt$premises$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$premises$gt$), Parse$_$lt$side_conditions$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$side_conditions$gt$), V4091))
))
;
}
shen_$lt$datatype_rule$gt$;

function shen_$lt$side_conditions$gt$(V4096) {
  if (V4096 == undefined) return shen_$lt$side_conditions$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$e$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$e$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$e$gt$)), []) : shen_fail_obj);});}), shen_tail_call(shen_$lt$e$gt$, V4096))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$side_condition$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$side_condition$gt$);}))) ? shen_tail_call((function(Parse$_$lt$side_conditions$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$side_conditions$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$side_conditions$gt$)), [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$side_condition$gt$), shen_tail_call(shen_snd, Parse$_$lt$side_conditions$gt$)]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$side_conditions$gt$), Parse$_$lt$side_condition$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$side_condition$gt$), V4096))
))
;
}
shen_$lt$side_conditions$gt$;

function shen_$lt$side_condition$gt$(V4101) {
  if (V4101 == undefined) return shen_$lt$side_condition$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})((((shen_is_type_js(shen_tail_call(shen_fst, V4101), shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "let"], shen_tail_call(shen_fst, V4101)[1]);}))) ? shen_tail_call((function(Parse$_$lt$variable$question$$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$variable$question$$gt$);}))) ? shen_tail_call((function(Parse$_$lt$expr$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$expr$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$expr$gt$)), [shen_type_cons, [shen_type_symbol, "let"], [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$variable$question$$gt$), [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$expr$gt$), []]]]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$expr$gt$), Parse$_$lt$variable$question$$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$variable$question$$gt$), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V4101)[2]), shen_tail_call(shen_snd, V4101))))
 : shen_fail_obj)))
 : Result);});})((((shen_is_type_js(shen_tail_call(shen_fst, V4101), shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_if"], shen_tail_call(shen_fst, V4101)[1]);}))) ? shen_tail_call((function(Parse$_$lt$expr$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$expr$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$expr$gt$)), [shen_type_cons, [shen_type_symbol, "shen_if"], [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$expr$gt$), []]]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$expr$gt$), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V4101)[2]), shen_tail_call(shen_snd, V4101))))
 : shen_fail_obj)))
;
}
shen_$lt$side_condition$gt$;

function shen_$lt$variable$question$$gt$(V4106) {
  if (V4106 == undefined) return shen_$lt$variable$question$$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V4106), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V4106)[2]), shen_tail_call(shen_snd, V4106)))), (((!shen_tail_call(shen_variable$question$, shen_tail_call(shen_fst, V4106)[1]))) ? shen_fail_obj : shen_tail_call(shen_fst, V4106)[1])) : shen_fail_obj)))
;
}
shen_$lt$variable$question$$gt$;

function shen_$lt$expr$gt$(V4111) {
  if (V4111 == undefined) return shen_$lt$expr$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V4111), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V4111)[2]), shen_tail_call(shen_snd, V4111)))), (((shen_tail_call(shen_tail_call(shen_element$question$, shen_tail_call(shen_fst, V4111)[1]), [shen_type_cons, [shen_type_symbol, "$gt$$gt$"], [shen_type_cons, [shen_type_symbol, "$sc$"], []]]) || (shen_tail_call(shen_get_fn_js(shen_singleunderline$question$), shen_tail_call(shen_fst, V4111)[1]) || shen_tail_call(shen_get_fn_js(shen_doubleunderline$question$), shen_tail_call(shen_fst, V4111)[1])))) ? shen_fail_obj : shen_tail_call(shen_get_fn_js(shen_remove_bar), shen_tail_call(shen_fst, V4111)[1]))) : shen_fail_obj)))
;
}
shen_$lt$expr$gt$;

function shen_remove_bar(V4112) {
  if (V4112 == undefined) return shen_remove_bar;
  return (((shen_is_type_js(V4112, shen_type_cons) && (shen_is_type_js(V4112[2], shen_type_cons) && (shen_is_type_js(V4112[2][2], shen_type_cons) && ((shen_empty$question$_js(V4112[2][2][2])) && shen_tail_call(function() {return shen_equal$question$_js(V4112[2][1], [shen_type_symbol, "bar$excl$"]);})))))) ? [shen_type_cons, V4112[1], V4112[2][2][1]] : ((shen_is_type_js(V4112, shen_type_cons)) ? [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_remove_bar), V4112[1]), shen_tail_call(shen_get_fn_js(shen_remove_bar), V4112[2])] : V4112));
}
shen_remove_bar;

function shen_$lt$premises$gt$(V4117) {
  if (V4117 == undefined) return shen_$lt$premises$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$e$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$e$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$e$gt$)), []) : shen_fail_obj);});}), shen_tail_call(shen_$lt$e$gt$, V4117))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$premise$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$premise$gt$);}))) ? shen_tail_call((function(Parse$_$lt$semicolon_symbol$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$semicolon_symbol$gt$);}))) ? shen_tail_call((function(Parse$_$lt$premises$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$premises$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$premises$gt$)), [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$premise$gt$), shen_tail_call(shen_snd, Parse$_$lt$premises$gt$)]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$premises$gt$), Parse$_$lt$semicolon_symbol$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$semicolon_symbol$gt$), Parse$_$lt$premise$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$premise$gt$), V4117))
))
;
}
shen_$lt$premises$gt$;

function shen_$lt$semicolon_symbol$gt$(V4122) {
  if (V4122 == undefined) return shen_$lt$semicolon_symbol$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V4122), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V4122)[2]), shen_tail_call(shen_snd, V4122)))), ((shen_tail_call(function() {return shen_equal$question$_js(shen_tail_call(shen_fst, V4122)[1], [shen_type_symbol, "$sc$"]);})) ? [shen_type_symbol, "shen_skip"] : shen_fail_obj)) : shen_fail_obj)))
;
}
shen_$lt$semicolon_symbol$gt$;

function shen_$lt$premise$gt$(V4127) {
  if (V4127 == undefined) return shen_$lt$premise$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$formula$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$formula$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$formula$gt$)), [shen_tuple, [], shen_tail_call(shen_snd, Parse$_$lt$formula$gt$)]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$formula$gt$), V4127))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$formulae$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$formulae$gt$);}))) ? (((shen_is_type_js(shen_tail_call(shen_fst, Parse$_$lt$formulae$gt$), shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$gt$$gt$"], shen_tail_call(shen_fst, Parse$_$lt$formulae$gt$)[1]);}))) ? shen_tail_call((function(Parse$_$lt$formula$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$formula$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$formula$gt$)), [shen_tuple, shen_tail_call(shen_snd, Parse$_$lt$formulae$gt$), shen_tail_call(shen_snd, Parse$_$lt$formula$gt$)]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$formula$gt$), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$formulae$gt$)[2]), shen_tail_call(shen_snd, Parse$_$lt$formulae$gt$))))
 : shen_fail_obj) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$formulae$gt$), V4127))
))
 : Result);});})((((shen_is_type_js(shen_tail_call(shen_fst, V4127), shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$excl$"], shen_tail_call(shen_fst, V4127)[1]);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V4127)[2]), shen_tail_call(shen_snd, V4127)))), [shen_type_symbol, "$excl$"]) : shen_fail_obj)))
;
}
shen_$lt$premise$gt$;

function shen_$lt$conclusion$gt$(V4132) {
  if (V4132 == undefined) return shen_$lt$conclusion$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$formula$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$formula$gt$);}))) ? shen_tail_call((function(Parse$_$lt$semicolon_symbol$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$semicolon_symbol$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$semicolon_symbol$gt$)), [shen_tuple, [], shen_tail_call(shen_snd, Parse$_$lt$formula$gt$)]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$semicolon_symbol$gt$), Parse$_$lt$formula$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$formula$gt$), V4132))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$formulae$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$formulae$gt$);}))) ? (((shen_is_type_js(shen_tail_call(shen_fst, Parse$_$lt$formulae$gt$), shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$gt$$gt$"], shen_tail_call(shen_fst, Parse$_$lt$formulae$gt$)[1]);}))) ? shen_tail_call((function(Parse$_$lt$formula$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$formula$gt$);}))) ? shen_tail_call((function(Parse$_$lt$semicolon_symbol$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$semicolon_symbol$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$semicolon_symbol$gt$)), [shen_tuple, shen_tail_call(shen_snd, Parse$_$lt$formulae$gt$), shen_tail_call(shen_snd, Parse$_$lt$formula$gt$)]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$semicolon_symbol$gt$), Parse$_$lt$formula$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$formula$gt$), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$formulae$gt$)[2]), shen_tail_call(shen_snd, Parse$_$lt$formulae$gt$))))
 : shen_fail_obj) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$formulae$gt$), V4132))
))
;
}
shen_$lt$conclusion$gt$;

function shen_$lt$formulae$gt$(V4137) {
  if (V4137 == undefined) return shen_$lt$formulae$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$e$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$e$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$e$gt$)), []) : shen_fail_obj);});}), shen_tail_call(shen_$lt$e$gt$, V4137))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$formula$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$formula$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$formula$gt$)), [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$formula$gt$), []]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$formula$gt$), V4137))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$formula$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$formula$gt$);}))) ? (((shen_is_type_js(shen_tail_call(shen_fst, Parse$_$lt$formula$gt$), shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, ","], shen_tail_call(shen_fst, Parse$_$lt$formula$gt$)[1]);}))) ? shen_tail_call((function(Parse$_$lt$formulae$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$formulae$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$formulae$gt$)), [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$formula$gt$), shen_tail_call(shen_snd, Parse$_$lt$formulae$gt$)]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$formulae$gt$), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$formula$gt$)[2]), shen_tail_call(shen_snd, Parse$_$lt$formula$gt$))))
 : shen_fail_obj) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$formula$gt$), V4137))
))
;
}
shen_$lt$formulae$gt$;

function shen_$lt$formula$gt$(V4142) {
  if (V4142 == undefined) return shen_$lt$formula$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$expr$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$expr$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$expr$gt$)), shen_tail_call(shen_snd, Parse$_$lt$expr$gt$)) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$expr$gt$), V4142))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$expr$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$expr$gt$);}))) ? (((shen_is_type_js(shen_tail_call(shen_fst, Parse$_$lt$expr$gt$), shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$colon$"], shen_tail_call(shen_fst, Parse$_$lt$expr$gt$)[1]);}))) ? shen_tail_call((function(Parse$_$lt$type$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$type$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$type$gt$)), [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_curry), shen_tail_call(shen_snd, Parse$_$lt$expr$gt$)), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_normalise_type), shen_tail_call(shen_snd, Parse$_$lt$type$gt$)), []]]]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$type$gt$), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$expr$gt$)[2]), shen_tail_call(shen_snd, Parse$_$lt$expr$gt$))))
 : shen_fail_obj) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$expr$gt$), V4142))
))
;
}
shen_$lt$formula$gt$;

function shen_$lt$colonsymbol$gt$(V4147) {
  if (V4147 == undefined) return shen_$lt$colonsymbol$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V4147), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V4147)[2]), shen_tail_call(shen_snd, V4147)))), ((shen_tail_call(function() {return shen_equal$question$_js(shen_tail_call(shen_fst, V4147)[1], [shen_type_symbol, "$sc$"]);})) ? shen_tail_call(shen_fst, V4147)[1] : shen_fail_obj)) : shen_fail_obj)))
;
}
shen_$lt$colonsymbol$gt$;

function shen_$lt$type$gt$(V4152) {
  if (V4152 == undefined) return shen_$lt$type$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$expr$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$expr$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$expr$gt$)), shen_tail_call(shen_get_fn_js(shen_curry_type), shen_tail_call(shen_snd, Parse$_$lt$expr$gt$))) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$expr$gt$), V4152))
))
;
}
shen_$lt$type$gt$;

function shen_$lt$doubleunderline$gt$(V4157) {
  if (V4157 == undefined) return shen_$lt$doubleunderline$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V4157), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V4157)[2]), shen_tail_call(shen_snd, V4157)))), ((shen_tail_call(shen_get_fn_js(shen_doubleunderline$question$), shen_tail_call(shen_fst, V4157)[1])) ? shen_tail_call(shen_fst, V4157)[1] : shen_fail_obj)) : shen_fail_obj)))
;
}
shen_$lt$doubleunderline$gt$;

function shen_$lt$singleunderline$gt$(V4162) {
  if (V4162 == undefined) return shen_$lt$singleunderline$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V4162), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V4162)[2]), shen_tail_call(shen_snd, V4162)))), ((shen_tail_call(shen_get_fn_js(shen_singleunderline$question$), shen_tail_call(shen_fst, V4162)[1])) ? shen_tail_call(shen_fst, V4162)[1] : shen_fail_obj)) : shen_fail_obj)))
;
}
shen_$lt$singleunderline$gt$;

function shen_singleunderline$question$(V4163) {
  if (V4163 == undefined) return shen_singleunderline$question$;
  return (shen_is_type_js(V4163, shen_type_symbol) && shen_tail_call(shen_get_fn_js(shen_sh$question$), shen_tail_call(shen_str, V4163)));
}
shen_singleunderline$question$;

function shen_sh$question$(V4164) {
  if (V4164 == undefined) return shen_sh$question$;
  return ((shen_tail_call(function() {return shen_equal$question$_js("_", V4164);})) ? true : (shen_tail_call(function() {return shen_equal$question$_js(V4164[0], "_");}) && shen_tail_call(shen_get_fn_js(shen_sh$question$), shen_tail_call(shen_tlstr, V4164))));
}
shen_sh$question$;

function shen_doubleunderline$question$(V4165) {
  if (V4165 == undefined) return shen_doubleunderline$question$;
  return (shen_is_type_js(V4165, shen_type_symbol) && shen_tail_call(shen_get_fn_js(shen_dh$question$), shen_tail_call(shen_str, V4165)));
}
shen_doubleunderline$question$;

function shen_dh$question$(V4166) {
  if (V4166 == undefined) return shen_dh$question$;
  return ((shen_tail_call(function() {return shen_equal$question$_js("=", V4166);})) ? true : (shen_tail_call(function() {return shen_equal$question$_js(V4166[0], "=");}) && shen_tail_call(shen_get_fn_js(shen_dh$question$), shen_tail_call(shen_tlstr, V4166))));
}
shen_dh$question$;

function shen_process_datatype(V4167) {
  if (V4167 == undefined) return shen_process_datatype;
  return (function lambda1526(V4168) {return (V4168 == undefined) ? lambda1526 : new Shen_tco_obj(function() {return (shen_get_fn_js(shen_remember_datatype)(shen_tail_call(shen_get_fn_js(shen_s_prolog), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_rules_$gt$horn_clauses), V4167), V4168))));});});
}
shen_process_datatype;

function shen_remember_datatype(V4173) {
  if (V4173 == undefined) return shen_remember_datatype;
  return ((shen_is_type_js(V4173, shen_type_cons)) ? ((shen_globals[[shen_type_symbol, "shen_$asterisk$datatypes$asterisk$"][1]] = shen_tail_call(shen_tail_call(shen_adjoin, V4173[1]), shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$datatypes$asterisk$"]))),
  ((shen_globals[[shen_type_symbol, "shen_$asterisk$alldatatypes$asterisk$"][1]] = shen_tail_call(shen_tail_call(shen_adjoin, V4173[1]), shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$alldatatypes$asterisk$"]))),
  V4173[1])) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_remember_datatype"])));
}
shen_remember_datatype;

function shen_rules_$gt$horn_clauses(V4176) {
  if (V4176 == undefined) return shen_rules_$gt$horn_clauses;
  return (function lambda1527(V4177) {return (V4177 == undefined) ? lambda1527 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4177))) ? [] : (((shen_is_type_js(V4177, shen_type_cons) && (shen_is_type_js(V4177[1], shen_tuple) && shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_single"], shen_tail_call(shen_fst, V4177[1]));})))) ? [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_rule_$gt$horn_clause), V4176), shen_tail_call(shen_snd, V4177[1])), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_rules_$gt$horn_clauses), V4176), V4177[2])] : (((shen_is_type_js(V4177, shen_type_cons) && (shen_is_type_js(V4177[1], shen_tuple) && shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_double"], shen_tail_call(shen_fst, V4177[1]));})))) ? (shen_tail_call(shen_get_fn_js(shen_rules_$gt$horn_clauses), V4176)(shen_tail_call(shen_tail_call(shen_append, shen_tail_call(shen_get_fn_js(shen_double_$gt$singles), shen_tail_call(shen_snd, V4177[1]))), V4177[2]))) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_rules_$gt$horn_clauses"])))));});});
}
shen_rules_$gt$horn_clauses;

function shen_double_$gt$singles(V4178) {
  if (V4178 == undefined) return shen_double_$gt$singles;
  return [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_right_rule), V4178), [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_left_rule), V4178), []]];
}
shen_double_$gt$singles;

function shen_right_rule(V4179) {
  if (V4179 == undefined) return shen_right_rule;
  return [shen_tuple, [shen_type_symbol, "shen_single"], V4179];
}
shen_right_rule;

function shen_left_rule(V4180) {
  if (V4180 == undefined) return shen_left_rule;
  return (((shen_is_type_js(V4180, shen_type_cons) && (shen_is_type_js(V4180[2], shen_type_cons) && (shen_is_type_js(V4180[2][2], shen_type_cons) && (shen_is_type_js(V4180[2][2][1], shen_tuple) && ((shen_empty$question$_js(shen_tail_call(shen_fst, V4180[2][2][1]))) && (shen_empty$question$_js(V4180[2][2][2])))))))) ? ((function(Q) {return new Shen_tco_obj(function() {return ((function(NewConclusion) {return new Shen_tco_obj(function() {return ((function(NewPremises) {return new Shen_tco_obj(function() {return [shen_tuple, [shen_type_symbol, "shen_single"], [shen_type_cons, V4180[1], [shen_type_cons, NewPremises, [shen_type_cons, NewConclusion, []]]]];});})([shen_type_cons, [shen_tuple, shen_tail_call(shen_tail_call(shen_map, shen_right_$gt$left), V4180[2][1]), Q], []]))
;});})([shen_tuple, [shen_type_cons, shen_tail_call(shen_snd, V4180[2][2][1]), []], Q]))
;});})(shen_tail_call(shen_gensym, [shen_type_symbol, "Qv"])))
 : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_left_rule"])));
}
shen_left_rule;

function shen_right_$gt$left(V4185) {
  if (V4185 == undefined) return shen_right_$gt$left;
  return (((shen_is_type_js(V4185, shen_tuple) && (shen_empty$question$_js(shen_tail_call(shen_fst, V4185))))) ? (shen_snd(V4185)) : (shen_tail_call(shen_interror, "syntax error with ==========~%")([])));
}
shen_right_$gt$left;

function shen_rule_$gt$horn_clause(V4186) {
  if (V4186 == undefined) return shen_rule_$gt$horn_clause;
  return (function lambda1528(V4187) {return (V4187 == undefined) ? lambda1528 : new Shen_tco_obj(function() {return (((shen_is_type_js(V4187, shen_type_cons) && (shen_is_type_js(V4187[2], shen_type_cons) && (shen_is_type_js(V4187[2][2], shen_type_cons) && (shen_is_type_js(V4187[2][2][1], shen_tuple) && (shen_empty$question$_js(V4187[2][2][2]))))))) ? [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_rule_$gt$horn_clause_head), V4186), shen_tail_call(shen_snd, V4187[2][2][1])), [shen_type_cons, [shen_type_symbol, "$colon$_"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_rule_$gt$horn_clause_body), V4187[1]), V4187[2][1]), shen_tail_call(shen_fst, V4187[2][2][1])), []]]] : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_rule_$gt$horn_clause"])));});});
}
shen_rule_$gt$horn_clause;

function shen_rule_$gt$horn_clause_head(V4188) {
  if (V4188 == undefined) return shen_rule_$gt$horn_clause_head;
  return (function lambda1529(V4189) {return (V4189 == undefined) ? lambda1529 : new Shen_tco_obj(function() {return [shen_type_cons, V4188, [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_mode_ify), V4189), [shen_type_cons, [shen_type_symbol, "Context"], []]]];});});
}
shen_rule_$gt$horn_clause_head;

function shen_mode_ify(V4190) {
  if (V4190 == undefined) return shen_mode_ify;
  return (((shen_is_type_js(V4190, shen_type_cons) && (shen_is_type_js(V4190[2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$colon$"], V4190[2][1]);}) && (shen_is_type_js(V4190[2][2], shen_type_cons) && (shen_empty$question$_js(V4190[2][2][2]))))))) ? [shen_type_cons, [shen_type_symbol, "mode"], [shen_type_cons, [shen_type_cons, V4190[1], [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "mode"], [shen_type_cons, V4190[2][2][1], [shen_type_cons, [shen_type_symbol, "$plus$"], []]]], []]]], [shen_type_cons, [shen_type_symbol, "_"], []]]] : V4190);
}
shen_mode_ify;

function shen_rule_$gt$horn_clause_body(V4191) {
  if (V4191 == undefined) return shen_rule_$gt$horn_clause_body;
  return (function lambda1533(V4192) {return (V4192 == undefined) ? lambda1533 : new Shen_tco_obj(function() {return (function lambda1532(V4193) {return (V4193 == undefined) ? lambda1532 : new Shen_tco_obj(function() {return ((function(Variables) {return new Shen_tco_obj(function() {return ((function(Predicates) {return new Shen_tco_obj(function() {return ((function(SearchLiterals) {return new Shen_tco_obj(function() {return ((function(SearchClauses) {return new Shen_tco_obj(function() {return ((function(SideLiterals) {return new Shen_tco_obj(function() {return ((function(PremissLiterals) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_append, SearchLiterals)(shen_tail_call(shen_tail_call(shen_append, SideLiterals), PremissLiterals)));});})(shen_tail_call(shen_tail_call(shen_map, (function lambda1531(X) {return (X == undefined) ? lambda1531 : new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_construct_premiss_literal), X)((shen_empty$question$_js(V4193))));});})), V4192)))
;});})(shen_tail_call(shen_get_fn_js(shen_construct_side_literals), V4191)))
;});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_construct_search_clauses), Predicates), V4193), Variables)))
;});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_construct_search_literals), Predicates), Variables), [shen_type_symbol, "Context"]), [shen_type_symbol, "Context1"])))
;});})(shen_tail_call(shen_tail_call(shen_map, (function lambda1530(X) {return (X == undefined) ? lambda1530 : new Shen_tco_obj(function() {return (shen_gensym([shen_type_symbol, "shen_cl"]));});})), V4193)))
;});})(shen_tail_call(shen_tail_call(shen_map, shen_extract$_vars), V4193)))
;});});});});
}
shen_rule_$gt$horn_clause_body;

function shen_construct_search_literals(V4198) {
  if (V4198 == undefined) return shen_construct_search_literals;
  return (function lambda1536(V4199) {return (V4199 == undefined) ? lambda1536 : new Shen_tco_obj(function() {return (function lambda1535(V4200) {return (V4200 == undefined) ? lambda1535 : new Shen_tco_obj(function() {return (function lambda1534(V4201) {return (V4201 == undefined) ? lambda1534 : new Shen_tco_obj(function() {return ((((shen_empty$question$_js(V4198)) && (shen_empty$question$_js(V4199)))) ? [] : (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_csl_help), V4198), V4199), V4200)(V4201)));});});});});});});
}
shen_construct_search_literals;

function shen_csl_help(V4204) {
  if (V4204 == undefined) return shen_csl_help;
  return (function lambda1539(V4205) {return (V4205 == undefined) ? lambda1539 : new Shen_tco_obj(function() {return (function lambda1538(V4206) {return (V4206 == undefined) ? lambda1538 : new Shen_tco_obj(function() {return (function lambda1537(V4207) {return (V4207 == undefined) ? lambda1537 : new Shen_tco_obj(function() {return ((((shen_empty$question$_js(V4204)) && (shen_empty$question$_js(V4205)))) ? [shen_type_cons, [shen_type_cons, [shen_type_symbol, "bind"], [shen_type_cons, [shen_type_symbol, "ContextOut"], [shen_type_cons, V4206, []]]], []] : (((shen_is_type_js(V4204, shen_type_cons) && shen_is_type_js(V4205, shen_type_cons))) ? [shen_type_cons, [shen_type_cons, V4204[1], [shen_type_cons, V4206, [shen_type_cons, V4207, V4205[1]]]], shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_csl_help), V4204[2]), V4205[2]), V4207), shen_tail_call(shen_gensym, [shen_type_symbol, "Context"]))] : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_csl_help"]))));});});});});});});
}
shen_csl_help;

function shen_construct_search_clauses(V4208) {
  if (V4208 == undefined) return shen_construct_search_clauses;
  return (function lambda1541(V4209) {return (V4209 == undefined) ? lambda1541 : new Shen_tco_obj(function() {return (function lambda1540(V4210) {return (V4210 == undefined) ? lambda1540 : new Shen_tco_obj(function() {return ((((shen_empty$question$_js(V4208)) && ((shen_empty$question$_js(V4209)) && (shen_empty$question$_js(V4210))))) ? [shen_type_symbol, "shen_skip"] : (((shen_is_type_js(V4208, shen_type_cons) && (shen_is_type_js(V4209, shen_type_cons) && shen_is_type_js(V4210, shen_type_cons)))) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_construct_search_clause), V4208[1]), V4209[1]), V4210[1]),
  (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_construct_search_clauses), V4208[2]), V4209[2])(V4210[2]))) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_construct_search_clauses"]))));});});});});
}
shen_construct_search_clauses;

function shen_construct_search_clause(V4211) {
  if (V4211 == undefined) return shen_construct_search_clause;
  return (function lambda1543(V4212) {return (V4212 == undefined) ? lambda1543 : new Shen_tco_obj(function() {return (function lambda1542(V4213) {return (V4213 == undefined) ? lambda1542 : new Shen_tco_obj(function() {return (shen_get_fn_js(shen_s_prolog)([shen_type_cons, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_construct_base_search_clause), V4211), V4212), V4213), [shen_type_cons, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_construct_recursive_search_clause), V4211), V4212), V4213), []]]));});});});});
}
shen_construct_search_clause;

function shen_construct_base_search_clause(V4214) {
  if (V4214 == undefined) return shen_construct_base_search_clause;
  return (function lambda1545(V4215) {return (V4215 == undefined) ? lambda1545 : new Shen_tco_obj(function() {return (function lambda1544(V4216) {return (V4216 == undefined) ? lambda1544 : new Shen_tco_obj(function() {return [shen_type_cons, [shen_type_cons, V4214, [shen_type_cons, [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_mode_ify), V4215), [shen_type_symbol, "In"]], [shen_type_cons, [shen_type_symbol, "In"], V4216]]], [shen_type_cons, [shen_type_symbol, "$colon$_"], [shen_type_cons, [], []]]];});});});});
}
shen_construct_base_search_clause;

function shen_construct_recursive_search_clause(V4217) {
  if (V4217 == undefined) return shen_construct_recursive_search_clause;
  return (function lambda1547(V4218) {return (V4218 == undefined) ? lambda1547 : new Shen_tco_obj(function() {return (function lambda1546(V4219) {return (V4219 == undefined) ? lambda1546 : new Shen_tco_obj(function() {return [shen_type_cons, [shen_type_cons, V4217, [shen_type_cons, [shen_type_cons, [shen_type_symbol, "Assumption"], [shen_type_symbol, "Assumptions"]], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "Assumption"], [shen_type_symbol, "Out"]], V4219]]], [shen_type_cons, [shen_type_symbol, "$colon$_"], [shen_type_cons, [shen_type_cons, [shen_type_cons, V4217, [shen_type_cons, [shen_type_symbol, "Assumptions"], [shen_type_cons, [shen_type_symbol, "Out"], V4219]]], []], []]]];});});});});
}
shen_construct_recursive_search_clause;

function shen_construct_side_literals(V4224) {
  if (V4224 == undefined) return shen_construct_side_literals;
  return (((shen_empty$question$_js(V4224))) ? [] : (((shen_is_type_js(V4224, shen_type_cons) && (shen_is_type_js(V4224[1], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_if"], V4224[1][1]);}) && (shen_is_type_js(V4224[1][2], shen_type_cons) && (shen_empty$question$_js(V4224[1][2][2]))))))) ? [shen_type_cons, [shen_type_cons, [shen_type_symbol, "when"], V4224[1][2]], shen_tail_call(shen_get_fn_js(shen_construct_side_literals), V4224[2])] : (((shen_is_type_js(V4224, shen_type_cons) && (shen_is_type_js(V4224[1], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "let"], V4224[1][1]);}) && (shen_is_type_js(V4224[1][2], shen_type_cons) && (shen_is_type_js(V4224[1][2][2], shen_type_cons) && (shen_empty$question$_js(V4224[1][2][2][2])))))))) ? [shen_type_cons, [shen_type_cons, [shen_type_symbol, "is"], V4224[1][2]], shen_tail_call(shen_get_fn_js(shen_construct_side_literals), V4224[2])] : ((shen_is_type_js(V4224, shen_type_cons)) ? (shen_get_fn_js(shen_construct_side_literals)(V4224[2])) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_construct_side_literals"]))))));
}
shen_construct_side_literals;

function shen_construct_premiss_literal(V4229) {
  if (V4229 == undefined) return shen_construct_premiss_literal;
  return (function lambda1548(V4230) {return (V4230 == undefined) ? lambda1548 : new Shen_tco_obj(function() {return ((shen_is_type_js(V4229, shen_tuple)) ? [shen_type_cons, [shen_type_symbol, "shen_t$asterisk$"], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_recursive$_cons$_form), shen_tail_call(shen_snd, V4229)), [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_construct_context), V4230), shen_tail_call(shen_fst, V4229)), []]]] : ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$excl$"], V4229);})) ? [shen_type_cons, [shen_type_symbol, "$excl$"], []] : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_construct_premiss_literal"]))));});});
}
shen_construct_premiss_literal;

function shen_construct_context(V4231) {
  if (V4231 == undefined) return shen_construct_context;
  return (function lambda1549(V4232) {return (V4232 == undefined) ? lambda1549 : new Shen_tco_obj(function() {return (((shen_tail_call(function() {return shen_equal$question$_js(true, V4231);}) && (shen_empty$question$_js(V4232)))) ? [shen_type_symbol, "Context"] : (((shen_tail_call(function() {return shen_equal$question$_js(false, V4231);}) && (shen_empty$question$_js(V4232)))) ? [shen_type_symbol, "ContextOut"] : ((shen_is_type_js(V4232, shen_type_cons)) ? [shen_type_cons, [shen_type_symbol, "cons"], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_recursive$_cons$_form), V4232[1]), [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_construct_context), V4231), V4232[2]), []]]] : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_construct_context"])))));});});
}
shen_construct_context;

function shen_recursive$_cons$_form(V4233) {
  if (V4233 == undefined) return shen_recursive$_cons$_form;
  return ((shen_is_type_js(V4233, shen_type_cons)) ? [shen_type_cons, [shen_type_symbol, "cons"], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_recursive$_cons$_form), V4233[1]), [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_recursive$_cons$_form), V4233[2]), []]]] : V4233);
}
shen_recursive$_cons$_form;

function shen_preclude(V4234) {
  if (V4234 == undefined) return shen_preclude;
  return ((function(FilterDatatypes) {return new Shen_tco_obj(function() {return (shen_value([shen_type_symbol, "shen_$asterisk$datatypes$asterisk$"]));});})((shen_globals[[shen_type_symbol, "shen_$asterisk$datatypes$asterisk$"][1]] = shen_tail_call(shen_tail_call(shen_difference, shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$datatypes$asterisk$"])), V4234))))
;
}
shen_preclude;

function shen_include(V4235) {
  if (V4235 == undefined) return shen_include;
  return ((function(ValidTypes) {return new Shen_tco_obj(function() {return ((function(NewDatatypes) {return new Shen_tco_obj(function() {return (shen_value([shen_type_symbol, "shen_$asterisk$datatypes$asterisk$"]));});})((shen_globals[[shen_type_symbol, "shen_$asterisk$datatypes$asterisk$"][1]] = shen_tail_call(shen_tail_call(shen_union, ValidTypes), shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$datatypes$asterisk$"])))))
;});})(shen_tail_call(shen_tail_call(shen_intersection, V4235), shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$alldatatypes$asterisk$"]))))
;
}
shen_include;

function shen_preclude_all_but(V4236) {
  if (V4236 == undefined) return shen_preclude_all_but;
  return (shen_preclude(shen_tail_call(shen_tail_call(shen_difference, shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$alldatatypes$asterisk$"])), V4236)));
}
shen_preclude_all_but;

function shen_include_all_but(V4237) {
  if (V4237 == undefined) return shen_include_all_but;
  return (shen_include(shen_tail_call(shen_tail_call(shen_difference, shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$alldatatypes$asterisk$"])), V4237)));
}
shen_include_all_but;

function shen_synonyms_help(V4242) {
  if (V4242 == undefined) return shen_synonyms_help;
  return (((shen_empty$question$_js(V4242))) ? [shen_type_symbol, "synonyms"] : (((shen_is_type_js(V4242, shen_type_cons) && shen_is_type_js(V4242[2], shen_type_cons))) ? (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_pushnew), [shen_type_cons, V4242[1], V4242[2][1]]), [shen_type_symbol, "shen_$asterisk$synonyms$asterisk$"]),
  (shen_get_fn_js(shen_synonyms_help)(V4242[2][2]))) : (shen_tail_call(shen_interror, "odd number of synonyms~%")([shen_tuple, [], []]))));
}
shen_synonyms_help;

function shen_pushnew(V4243) {
  if (V4243 == undefined) return shen_pushnew;
  return (function lambda1550(V4244) {return (V4244 == undefined) ? lambda1550 : new Shen_tco_obj(function() {return ((shen_tail_call(shen_tail_call(shen_element$question$, V4243), shen_tail_call(shen_value, V4244))) ? (shen_value(V4244)) : (shen_globals[V4244[1]] = [shen_type_cons, V4243, shen_tail_call(shen_value, V4244)]));});});
}
shen_pushnew;



//## FILE js/yacc.js

function shen_yacc(V5543) {
  if (V5543 == undefined) return shen_yacc;
  return (((shen_is_type_js(V5543, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "defcc"], V5543[1]);}) && shen_is_type_js(V5543[2], shen_type_cons)))) ? (shen_tail_call(shen_get_fn_js(shen_yacc_$gt$shen), V5543[2][1])(V5543[2][2])) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_yacc"])));
}
shen_yacc;

function shen_yacc_$gt$shen(V5544) {
  if (V5544 == undefined) return shen_yacc_$gt$shen;
  return (function lambda1734(V5545) {return (V5545 == undefined) ? lambda1734 : new Shen_tco_obj(function() {return [shen_type_cons, [shen_type_symbol, "define"], [shen_type_cons, V5544, shen_tail_call(shen_get_fn_js(shen_yacc$_cases), shen_tail_call(shen_tail_call(shen_map, shen_cc$_body), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_split$_cc$_rules), V5545), [])))]];});});
}
shen_yacc_$gt$shen;

function shen_yacc$_cases(V5546) {
  if (V5546 == undefined) return shen_yacc$_cases;
  return (shen_tail_call(shen_append, shen_tail_call(shen_tail_call(shen_mapcan, (function lambda1735(Case) {return (Case == undefined) ? lambda1735 : new Shen_tco_obj(function() {return [shen_type_cons, [shen_type_symbol, "Stream"], [shen_type_cons, [shen_type_symbol, "$lt$_"], [shen_type_cons, Case, []]]];});})), V5546))([shen_type_cons, [shen_type_symbol, "$_"], [shen_type_cons, [shen_type_symbol, "_$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "fail"], []], []]]]));
}
shen_yacc$_cases;

function shen_first$_n(V5551) {
  if (V5551 == undefined) return shen_first$_n;
  return (function lambda1736(V5552) {return (V5552 == undefined) ? lambda1736 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(0, V5551);})) ? [] : (((shen_empty$question$_js(V5552))) ? [] : ((shen_is_type_js(V5552, shen_type_cons)) ? [shen_type_cons, V5552[1], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_first$_n), (V5551 - 1)), V5552[2])] : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_first$_n"])))));});});
}
shen_first$_n;

function shen_split$_cc$_rules(V5553) {
  if (V5553 == undefined) return shen_split$_cc$_rules;
  return (function lambda1737(V5554) {return (V5554 == undefined) ? lambda1737 : new Shen_tco_obj(function() {return ((((shen_empty$question$_js(V5553)) && (shen_empty$question$_js(V5554)))) ? [] : (((shen_empty$question$_js(V5553))) ? [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_split$_cc$_rule), shen_tail_call(shen_reverse, V5554)), []), []] : (((shen_is_type_js(V5553, shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$sc$"], V5553[1]);}))) ? [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_split$_cc$_rule), shen_tail_call(shen_reverse, V5554)), []), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_split$_cc$_rules), V5553[2]), [])] : ((shen_is_type_js(V5553, shen_type_cons)) ? (shen_tail_call(shen_get_fn_js(shen_split$_cc$_rules), V5553[2])([shen_type_cons, V5553[1], V5554])) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_split$_cc$_rules"]))))));});});
}
shen_split$_cc$_rules;

function shen_split$_cc$_rule(V5555) {
  if (V5555 == undefined) return shen_split$_cc$_rule;
  return (function lambda1739(V5556) {return (V5556 == undefined) ? lambda1739 : new Shen_tco_obj(function() {return (((shen_is_type_js(V5555, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$colon$$eq$"], V5555[1]);}) && (shen_is_type_js(V5555[2], shen_type_cons) && (shen_empty$question$_js(V5555[2][2])))))) ? [shen_type_cons, shen_tail_call(shen_reverse, V5556), V5555[2]] : (((shen_is_type_js(V5555, shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$colon$$eq$"], V5555[1]);}))) ? [shen_type_cons, shen_tail_call(shen_reverse, V5556), [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_cons$_form), V5555[2]), []]] : (((shen_empty$question$_js(V5555))) ? (shen_tail_call(shen_tail_call(shen_intoutput, "warning: "), []),
  (shen_tail_call(shen_tail_call(shen_map, (function lambda1738(X) {return (X == undefined) ? lambda1738 : new Shen_tco_obj(function() {return (shen_tail_call(shen_intoutput, "~A ")([shen_tuple, X, []]));});})), shen_tail_call(shen_reverse, V5556)),
  (shen_tail_call(shen_tail_call(shen_intoutput, "has no semantics.~%"), []),
  (shen_tail_call(shen_get_fn_js(shen_split$_cc$_rule), [shen_type_cons, [shen_type_symbol, "$colon$$eq$"], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_default$_semantics), shen_tail_call(shen_reverse, V5556)), []]])(V5556))))) : ((shen_is_type_js(V5555, shen_type_cons)) ? (shen_tail_call(shen_get_fn_js(shen_split$_cc$_rule), V5555[2])([shen_type_cons, V5555[1], V5556])) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_split$_cc$_rule"]))))));});});
}
shen_split$_cc$_rule;

function shen_default$_semantics(V5557) {
  if (V5557 == undefined) return shen_default$_semantics;
  return (((shen_empty$question$_js(V5557))) ? [] : (((shen_is_type_js(V5557, shen_type_cons) && shen_tail_call(shen_get_fn_js(shen_grammar$_symbol$question$), V5557[1]))) ? ((function(PS) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5557[2]))) ? PS : [shen_type_cons, [shen_type_symbol, "append"], [shen_type_cons, PS, [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_default$_semantics), V5557[2]), []]]]);});})([shen_type_cons, [shen_type_symbol, "snd"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_concat, [shen_type_symbol, "Parse$_"]), V5557[1]), []]]))
 : ((shen_is_type_js(V5557, shen_type_cons)) ? [shen_type_cons, [shen_type_symbol, "cons"], [shen_type_cons, V5557[1], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_default$_semantics), V5557[2]), []]]] : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_default$_semantics"])))));
}
shen_default$_semantics;

function shen_cc$_body(V5558) {
  if (V5558 == undefined) return shen_cc$_body;
  return (((shen_is_type_js(V5558, shen_type_cons) && (shen_is_type_js(V5558[2], shen_type_cons) && (shen_empty$question$_js(V5558[2][2]))))) ? (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_syntax), V5558[1]), [shen_type_symbol, "Stream"])(V5558[2][1])) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_cc$_body"])));
}
shen_cc$_body;

function shen_syntax(V5571) {
  if (V5571 == undefined) return shen_syntax;
  return (function lambda1741(V5572) {return (V5572 == undefined) ? lambda1741 : new Shen_tco_obj(function() {return (function lambda1740(V5573) {return (V5573 == undefined) ? lambda1740 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5571))) ? [shen_type_cons, [shen_type_symbol, "shen_reassemble"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "fst"], [shen_type_cons, V5572, []]], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_semantics), V5573), []]]] : (((shen_is_type_js(V5571, shen_type_cons) && shen_tail_call(shen_get_fn_js(shen_grammar$_symbol$question$), V5571[1]))) ? (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_recursive$_descent), V5571), V5572)(V5573)) : (((shen_is_type_js(V5571, shen_type_cons) && shen_tail_call(shen_get_fn_js(shen_terminal$question$), V5571[1]))) ? (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_check$_stream), V5571), V5572)(V5573)) : (((shen_is_type_js(V5571, shen_type_cons) && shen_tail_call(shen_get_fn_js(shen_jump$_stream$question$), V5571[1]))) ? (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_jump$_stream), V5571), V5572)(V5573)) : (((shen_is_type_js(V5571, shen_type_cons) && shen_tail_call(shen_get_fn_js(shen_list$_stream$question$), V5571[1]))) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_list$_stream), shen_tail_call(shen_get_fn_js(shen_decons), V5571[1])), V5571[2]), V5572)(V5573)) : ((shen_is_type_js(V5571, shen_type_cons)) ? (shen_tail_call(shen_interror, "~A is not legal syntax~%")([shen_tuple, V5571[1], []])) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_syntax"]))))))));});});});});
}
shen_syntax;

function shen_list$_stream$question$(V5582) {
  if (V5582 == undefined) return shen_list$_stream$question$;
  return ((shen_is_type_js(V5582, shen_type_cons)) ? true : false);
}
shen_list$_stream$question$;

function shen_decons(V5583) {
  if (V5583 == undefined) return shen_decons;
  return (((shen_is_type_js(V5583, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "cons"], V5583[1]);}) && (shen_is_type_js(V5583[2], shen_type_cons) && (shen_is_type_js(V5583[2][2], shen_type_cons) && (shen_empty$question$_js(V5583[2][2][2]))))))) ? [shen_type_cons, V5583[2][1], shen_tail_call(shen_get_fn_js(shen_decons), V5583[2][2][1])] : V5583);
}
shen_decons;

function shen_list$_stream(V5584) {
  if (V5584 == undefined) return shen_list$_stream;
  return (function lambda1744(V5585) {return (V5585 == undefined) ? lambda1744 : new Shen_tco_obj(function() {return (function lambda1743(V5586) {return (V5586 == undefined) ? lambda1743 : new Shen_tco_obj(function() {return (function lambda1742(V5587) {return (V5587 == undefined) ? lambda1742 : new Shen_tco_obj(function() {return ((function(Test) {return new Shen_tco_obj(function() {return ((function(Action) {return new Shen_tco_obj(function() {return ((function(Else) {return new Shen_tco_obj(function() {return [shen_type_cons, [shen_type_symbol, "shen_if"], [shen_type_cons, Test, [shen_type_cons, Action, [shen_type_cons, Else, []]]]];});})([shen_type_cons, [shen_type_symbol, "fail"], []]))
;});})([shen_type_cons, [shen_type_symbol, "shen_snd_or_fail"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_syntax), V5584), [shen_type_cons, [shen_type_symbol, "shen_reassemble"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "hd"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "fst"], [shen_type_cons, V5586, []]], []]], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "snd"], [shen_type_cons, V5586, []]], []]]]), [shen_type_cons, [shen_type_symbol, "shen_leave$excl$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_syntax), V5585), [shen_type_cons, [shen_type_symbol, "shen_reassemble"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "tl"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "fst"], [shen_type_cons, V5586, []]], []]], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "snd"], [shen_type_cons, V5586, []]], []]]]), V5587), []]]), []]]))
;});})([shen_type_cons, [shen_type_symbol, "and"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "cons$question$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "fst"], [shen_type_cons, V5586, []]], []]], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "cons$question$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "hd"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "fst"], [shen_type_cons, V5586, []]], []]], []]], []]]]))
;});});});});});});
}
shen_list$_stream;

function shen_snd_or_fail(V5594) {
  if (V5594 == undefined) return shen_snd_or_fail;
  return ((shen_is_type_js(V5594, shen_tuple)) ? (shen_snd(V5594)) : shen_fail_obj);
}
shen_snd_or_fail;

function shen_grammar$_symbol$question$(V5595) {
  if (V5595 == undefined) return shen_grammar$_symbol$question$;
  return (shen_is_type_js(V5595, shen_type_symbol) && shen_tail_call((function(Cs) {return new Shen_tco_obj(function() {return (shen_tail_call(function() {return shen_equal$question$_js(Cs[1], "<");}) && shen_tail_call(function() {return shen_equal$question$_js(shen_tail_call(shen_reverse, Cs)[1], ">");}));});}), shen_tail_call(shen_explode, V5595))
);
}
shen_grammar$_symbol$question$;

function shen_recursive$_descent(V5596) {
  if (V5596 == undefined) return shen_recursive$_descent;
  return (function lambda1746(V5597) {return (V5597 == undefined) ? lambda1746 : new Shen_tco_obj(function() {return (function lambda1745(V5598) {return (V5598 == undefined) ? lambda1745 : new Shen_tco_obj(function() {return ((shen_is_type_js(V5596, shen_type_cons)) ? ((function(Test) {return new Shen_tco_obj(function() {return ((function(Action) {return new Shen_tco_obj(function() {return ((function(Else) {return new Shen_tco_obj(function() {return [shen_type_cons, [shen_type_symbol, "let"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_concat, [shen_type_symbol, "Parse$_"]), V5596[1]), [shen_type_cons, Test, [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_if"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "not"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "$eq$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "fail"], []], [shen_type_cons, shen_tail_call(shen_tail_call(shen_concat, [shen_type_symbol, "Parse$_"]), V5596[1]), []]]], []]], [shen_type_cons, Action, [shen_type_cons, Else, []]]]], []]]]];});})([shen_type_cons, [shen_type_symbol, "fail"], []]))
;});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_syntax), V5596[2]), shen_tail_call(shen_tail_call(shen_concat, [shen_type_symbol, "Parse$_"]), V5596[1])), V5598)))
;});})([shen_type_cons, V5596[1], [shen_type_cons, V5597, []]]))
 : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_recursive$_descent"])));});});});});
}
shen_recursive$_descent;

function shen_terminal$question$(V5607) {
  if (V5607 == undefined) return shen_terminal$question$;
  return ((shen_is_type_js(V5607, shen_type_cons)) ? false : ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "_$asterisk$_"], V5607);})) ? false : true));
}
shen_terminal$question$;

function shen_jump$_stream$question$(V5612) {
  if (V5612 == undefined) return shen_jump$_stream$question$;
  return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "_$asterisk$_"], V5612);})) ? true : false);
}
shen_jump$_stream$question$;

function shen_check$_stream(V5613) {
  if (V5613 == undefined) return shen_check$_stream;
  return (function lambda1748(V5614) {return (V5614 == undefined) ? lambda1748 : new Shen_tco_obj(function() {return (function lambda1747(V5615) {return (V5615 == undefined) ? lambda1747 : new Shen_tco_obj(function() {return ((shen_is_type_js(V5613, shen_type_cons)) ? ((function(Test) {return new Shen_tco_obj(function() {return ((function(Action) {return new Shen_tco_obj(function() {return ((function(Else) {return new Shen_tco_obj(function() {return [shen_type_cons, [shen_type_symbol, "shen_if"], [shen_type_cons, Test, [shen_type_cons, Action, [shen_type_cons, Else, []]]]];});})([shen_type_cons, [shen_type_symbol, "fail"], []]))
;});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_syntax), V5613[2]), [shen_type_cons, [shen_type_symbol, "shen_reassemble"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "tl"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "fst"], [shen_type_cons, V5614, []]], []]], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "snd"], [shen_type_cons, V5614, []]], []]]]), V5615)))
;});})([shen_type_cons, [shen_type_symbol, "and"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "cons$question$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "fst"], [shen_type_cons, V5614, []]], []]], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "$eq$"], [shen_type_cons, V5613[1], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "hd"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "fst"], [shen_type_cons, V5614, []]], []]], []]]], []]]]))
 : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_check$_stream"])));});});});});
}
shen_check$_stream;

function shen_reassemble(V5617) {
  if (V5617 == undefined) return shen_reassemble;
  return (function lambda1749(V5618) {return (V5618 == undefined) ? lambda1749 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(V5618, shen_fail_obj);})) ? V5618 : [shen_tuple, V5617, V5618]);});});
}
shen_reassemble;

function shen_jump$_stream(V5619) {
  if (V5619 == undefined) return shen_jump$_stream;
  return (function lambda1751(V5620) {return (V5620 == undefined) ? lambda1751 : new Shen_tco_obj(function() {return (function lambda1750(V5621) {return (V5621 == undefined) ? lambda1750 : new Shen_tco_obj(function() {return ((shen_is_type_js(V5619, shen_type_cons)) ? ((function(Test) {return new Shen_tco_obj(function() {return ((function(Action) {return new Shen_tco_obj(function() {return ((function(Else) {return new Shen_tco_obj(function() {return [shen_type_cons, [shen_type_symbol, "shen_if"], [shen_type_cons, Test, [shen_type_cons, Action, [shen_type_cons, Else, []]]]];});})([shen_type_cons, [shen_type_symbol, "fail"], []]))
;});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_syntax), V5619[2]), [shen_type_cons, [shen_type_symbol, "shen_reassemble"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "tl"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "fst"], [shen_type_cons, V5620, []]], []]], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "snd"], [shen_type_cons, V5620, []]], []]]]), V5621)))
;});})([shen_type_cons, [shen_type_symbol, "cons$question$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "fst"], [shen_type_cons, V5620, []]], []]]))
 : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_jump$_stream"])));});});});});
}
shen_jump$_stream;

function shen_semantics(V5622) {
  if (V5622 == undefined) return shen_semantics;
  return (((shen_is_type_js(V5622, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_leave$excl$"], V5622[1]);}) && (shen_is_type_js(V5622[2], shen_type_cons) && (shen_empty$question$_js(V5622[2][2])))))) ? V5622[2][1] : (((shen_empty$question$_js(V5622))) ? [] : ((shen_tail_call(shen_get_fn_js(shen_grammar$_symbol$question$), V5622)) ? [shen_type_cons, [shen_type_symbol, "snd"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_concat, [shen_type_symbol, "Parse$_"]), V5622), []]] : ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "_o_"], V5622);})) ? [shen_type_cons, [shen_type_symbol, "snd"], [shen_type_cons, [shen_type_symbol, "Stream"], []]] : ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "_$asterisk$_"], V5622);})) ? [shen_type_cons, [shen_type_symbol, "hd"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "fst"], [shen_type_cons, [shen_type_symbol, "Stream"], []]], []]] : ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "_s_"], V5622);})) ? [shen_type_cons, [shen_type_symbol, "fst"], [shen_type_cons, [shen_type_symbol, "Stream"], []]] : ((shen_is_type_js(V5622, shen_type_cons)) ? (shen_tail_call(shen_map, shen_semantics)(V5622)) : V5622)))))));
}
shen_semantics;

function shen_fail() {return [shen_type_symbol, "fail$excl$"];}
shen_fail;



//## FILE js/writer.js

function shen_pr_help(V5494) {
  if (V5494 == undefined) return shen_pr_help;
  return (function lambda1719(V5495) {return (V5495 == undefined) ? lambda1719 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js("", V5494);})) ? true : ((shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), V5494)) ? (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_write_byte), shen_tail_call(shen_get_fn_js(shen_unit_string_$gt$byte), V5494[0])), V5495),
  (shen_tail_call(shen_get_fn_js(shen_pr_help), shen_tail_call(shen_tlstr, V5494))(V5495))) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_pr_help"]))));});});
}
shen_pr_help;

function shen_pr(V5496) {
  if (V5496 == undefined) return shen_pr;
  return (function lambda1720(V5497) {return (V5497 == undefined) ? lambda1720 : new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_pr_help), V5496), V5497),
  V5496);});});
}
shen_pr;

function shen_print(V5498) {
  if (V5498 == undefined) return shen_print;
  return (shen_tail_call(shen_tail_call(shen_pr, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_ms_h), [shen_type_cons, "~", [shen_type_cons, "S", []]]), [shen_tuple, V5498, [shen_type_symbol, "shen_skip"]])), shen_tail_call(shen_stoutput, 0)),
  V5498);
}
shen_print;

function shen_format(V5499) {
  if (V5499 == undefined) return shen_format;
  return (function lambda1722(V5500) {return (V5500 == undefined) ? lambda1722 : new Shen_tco_obj(function() {return (function lambda1721(V5501) {return (V5501 == undefined) ? lambda1721 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(true, V5499);})) ? (shen_tail_call(shen_intoutput, V5500)([shen_tuple, V5501, []])) : ((shen_tail_call(function() {return shen_equal$question$_js(false, V5499);})) ? (shen_tail_call(shen_intmake_string, V5500)([shen_tuple, V5501, []])) : (shen_tail_call(shen_pr, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_ms_h), shen_tail_call(shen_explode, V5500)), V5501))(V5499))));});});});});
}
shen_format;

function shen_intoutput(V5504) {
  if (V5504 == undefined) return shen_intoutput;
  return (function lambda1723(V5505) {return (V5505 == undefined) ? lambda1723 : new Shen_tco_obj(function() {return ((shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$hush$asterisk$"])) ? "Shen hushed" : (shen_tail_call(shen_pr, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_ms_h), shen_tail_call(shen_get_fn_js(shen_explode_string), V5504)), V5505))(shen_tail_call(shen_stoutput, 0))));});});
}
shen_intoutput;

function shen_interror(V5506) {
  if (V5506 == undefined) return shen_interror;
  return (function lambda1724(V5507) {return (V5507 == undefined) ? lambda1724 : new Shen_tco_obj(function() {return (shen_simple_error(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_ms_h), shen_tail_call(shen_get_fn_js(shen_explode_string), V5506)), V5507)));});});
}
shen_interror;

function shen_intmake_string(V5508) {
  if (V5508 == undefined) return shen_intmake_string;
  return (function lambda1725(V5509) {return (V5509 == undefined) ? lambda1725 : new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_ms_h), shen_tail_call(shen_get_fn_js(shen_explode_string), V5508))(V5509));});});
}
shen_intmake_string;

function shen_ms_h(V5512) {
  if (V5512 == undefined) return shen_ms_h;
  return (function lambda1726(V5513) {return (V5513 == undefined) ? lambda1726 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5512))) ? "" : (((shen_is_type_js(V5512, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js("~", V5512[1]);}) && (shen_is_type_js(V5512[2], shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js("%", V5512[2][1]);}))))) ? (shen_tail_call(shen_n_$gt$string, 10) + shen_tail_call(shen_tail_call(shen_get_fn_js(shen_ms_h), V5512[2][2]), V5513)) : (((shen_is_type_js(V5512, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js("~", V5512[1]);}) && (shen_is_type_js(V5512[2], shen_type_cons) && (shen_is_type_js(V5513, shen_tuple) && shen_tail_call(shen_tail_call(shen_element$question$, V5512[2][1]), [shen_type_cons, "A", [shen_type_cons, "S", [shen_type_cons, "R", []]]])))))) ? (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_ob_$gt$str), V5512[2][1]), shen_tail_call(shen_fst, V5513)) + shen_tail_call(shen_tail_call(shen_get_fn_js(shen_ms_h), V5512[2][2]), shen_tail_call(shen_snd, V5513))) : ((shen_is_type_js(V5512, shen_type_cons)) ? (V5512[1] + shen_tail_call(shen_tail_call(shen_get_fn_js(shen_ms_h), V5512[2]), V5513)) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_ms_h"]))))));});});
}
shen_ms_h;

function shen_ob_$gt$str(V5514) {
  if (V5514 == undefined) return shen_ob_$gt$str;
  return (function lambda1730(V5515) {return (V5515 == undefined) ? lambda1730 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5515))) ? ((shen_tail_call(function() {return shen_equal$question$_js(V5514, "R");})) ? "()" : "[]") : ((shen_tail_call(function() {return shen_equal$question$_js(V5515, shen_tail_call(shen_vector, 0));})) ? "<>" : ((shen_is_type_js(V5515, shen_type_cons)) ? (shen_get_fn_js(shen_cn_all)(shen_tail_call(shen_tail_call(shen_append, ((shen_tail_call(function() {return shen_equal$question$_js(V5514, "R");})) ? [shen_type_cons, "(", []] : [shen_type_cons, "[", []])), shen_tail_call(shen_tail_call(shen_append, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_ob_$gt$str), V5514), V5515[1]), []]), shen_tail_call(shen_tail_call(shen_append, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_xmapcan), shen_tail_call(shen_value, [shen_type_symbol, "$asterisk$maximum_print_sequence_size$asterisk$"])), (function lambda1727(Z) {return (Z == undefined) ? lambda1727 : new Shen_tco_obj(function() {return [shen_type_cons, " ", [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_ob_$gt$str), V5514), Z), []]];});})), V5515[2])), ((shen_tail_call(function() {return shen_equal$question$_js(V5514, "R");})) ? [shen_type_cons, ")", []] : [shen_type_cons, "]", []])))))) : ((shen_vector$question$_js(V5515)) ? ((function(L) {return new Shen_tco_obj(function() {return ((function(E) {return new Shen_tco_obj(function() {return ((function(V) {return new Shen_tco_obj(function() {return V;});})(("<" + (E + ">"))))
;});})(shen_tail_call(shen_tlstr, shen_tail_call(shen_get_fn_js(shen_cn_all), shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_xmapcan), (shen_tail_call(shen_value, [shen_type_symbol, "$asterisk$maximum_print_sequence_size$asterisk$"]) - 1)), (function lambda1728(Z) {return (Z == undefined) ? lambda1728 : new Shen_tco_obj(function() {return [shen_type_cons, " ", [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_ob_$gt$str), V5514), Z), []]];});})), L)))))
;});})(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_vector_$gt$list), V5515), 1)))
 : ((((!(typeof(V5515) == 'string')) && shen_absvector$question$_js(V5515))) ? new Shen_tco_obj(function() {return trap_error_js(function() {return shen_tail_call(shen_tail_call(shen_get_fn_js(shen_ob_$gt$str), "A"), shen_tail_call(shen_absvector_ref_js(V5515, 0), V5515));}, function(Ignore) {return shen_tail_call((function(L) {return new Shen_tco_obj(function() {return shen_tail_call((function(E) {return new Shen_tco_obj(function() {return shen_tail_call((function(V) {return new Shen_tco_obj(function() {return V;});}), ("<" + (E + ">")))
;});}), shen_tail_call(shen_tlstr, shen_tail_call(shen_get_fn_js(shen_cn_all), shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_xmapcan), (shen_tail_call(shen_value, [shen_type_symbol, "$asterisk$maximum_print_sequence_size$asterisk$"]) - 1)), (function lambda1729(Z) {return (Z == undefined) ? lambda1729 : new Shen_tco_obj(function() {return [shen_type_cons, " ", [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_ob_$gt$str), V5514), Z), []]];});})), L))))
;});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_vector_$gt$list), V5515), 0))
;});}) : (((shen_tail_call(function() {return shen_equal$question$_js(V5514, "A");}) && (typeof(V5515) == 'string'))) ? V5515 : (shen_str(V5515))))))));});});
}
shen_ob_$gt$str;

function shen_tuple(V5516) {
  if (V5516 == undefined) return shen_tuple;
  return (shen_tail_call(shen_intmake_string, "(@p ~S ~S)")([shen_tuple, shen_tail_call(shen_fst, V5516), [shen_tuple, shen_tail_call(shen_snd, V5516), []]]));
}
shen_tuple;

function shen_cn_all(V5517) {
  if (V5517 == undefined) return shen_cn_all;
  return (((shen_empty$question$_js(V5517))) ? "" : ((shen_is_type_js(V5517, shen_type_cons)) ? (V5517[1] + shen_tail_call(shen_get_fn_js(shen_cn_all), V5517[2])) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_cn_all"]))));
}
shen_cn_all;

function shen_xmapcan(V5530) {
  if (V5530 == undefined) return shen_xmapcan;
  return (function lambda1732(V5531) {return (V5531 == undefined) ? lambda1732 : new Shen_tco_obj(function() {return (function lambda1731(V5532) {return (V5532 == undefined) ? lambda1731 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5532))) ? [] : ((shen_tail_call(function() {return shen_equal$question$_js(0, V5530);})) ? [shen_type_cons, "... etc", []] : ((shen_is_type_js(V5532, shen_type_cons)) ? (shen_tail_call(shen_append, shen_tail_call(shen_get_fn_js(V5531), V5532[1]))(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_xmapcan), (V5530 - 1)), V5531), V5532[2]))) : [shen_type_cons, " |", shen_tail_call(shen_get_fn_js(V5531), V5532)])));});});});});
}
shen_xmapcan;

function shen_vector_$gt$list(V5533) {
  if (V5533 == undefined) return shen_vector_$gt$list;
  return (function lambda1733(V5534) {return (V5534 == undefined) ? lambda1733 : new Shen_tco_obj(function() {return ((function(Y) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Y, [shen_type_symbol, "shen_out_of_range"]);})) ? [] : [shen_type_cons, Y, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_vector_$gt$list), V5533), (V5534 + 1))]);});})(trap_error_js(function() {return shen_absvector_ref_js(V5533, V5534);}, function(E) {return [shen_type_symbol, "shen_out_of_range"];})))
;});});
}
shen_vector_$gt$list;



//## FILE js/reader.js

(shen_globals[[shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"][1]] = shen_tail_call(shen_vector, 256));

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 126, "~");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 122, "z");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 121, "y");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 120, "x");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 119, "w");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 118, "v");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 117, "u");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 116, "t");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 115, "s");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 114, "r");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 113, "q");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 112, "p");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 111, "o");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 110, "n");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 109, "m");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 108, "l");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 107, "k");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 106, "j");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 105, "i");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 104, "h");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 103, "g");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 102, "f");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 101, "e");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 100, "d");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 99, "c");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 98, "b");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 97, "a");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 96, "`");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 95, "_");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 90, "Z");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 89, "Y");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 88, "X");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 87, "W");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 86, "V");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 85, "U");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 84, "T");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 83, "S");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 82, "R");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 81, "Q");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 80, "P");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 79, "O");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 78, "N");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 77, "M");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 76, "L");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 75, "K");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 74, "J");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 73, "I");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 72, "H");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 71, "G");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 70, "F");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 69, "E");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 68, "D");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 67, "C");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 66, "B");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 65, "A");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 64, "@");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 63, "?");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 62, ">");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 61, "=");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 60, "<");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 47, "/");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 46, ".");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 45, "-");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 43, "+");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 42, "*");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 39, "'");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 38, "&");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 37, "%");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 36, "$");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 35, "#");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), 33, "!");
;

(shen_globals[[shen_type_symbol, "shen_$asterisk$digitcodes$asterisk$"][1]] = shen_tail_call(shen_vector, 256));

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$digitcodes$asterisk$"]), 57, "9");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$digitcodes$asterisk$"]), 56, "8");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$digitcodes$asterisk$"]), 55, "7");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$digitcodes$asterisk$"]), 54, "6");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$digitcodes$asterisk$"]), 53, "5");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$digitcodes$asterisk$"]), 52, "4");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$digitcodes$asterisk$"]), 51, "3");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$digitcodes$asterisk$"]), 50, "2");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$digitcodes$asterisk$"]), 49, "1");
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$digitcodes$asterisk$"]), 48, "0");
;

(shen_globals[[shen_type_symbol, "shen_$asterisk$digitvalues$asterisk$"][1]] = shen_tail_call(shen_vector, 256));

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$digitvalues$asterisk$"]), 57, 9);
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$digitvalues$asterisk$"]), 56, 8);
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$digitvalues$asterisk$"]), 55, 7);
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$digitvalues$asterisk$"]), 54, 6);
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$digitvalues$asterisk$"]), 53, 5);
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$digitvalues$asterisk$"]), 52, 4);
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$digitvalues$asterisk$"]), 51, 3);
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$digitvalues$asterisk$"]), 50, 2);
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$digitvalues$asterisk$"]), 49, 1);
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$digitvalues$asterisk$"]), 48, 0);
;

(shen_globals[[shen_type_symbol, "shen_$asterisk$hexdigitvalues$asterisk$"][1]] = shen_tail_call(shen_vector, 256));

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$hexdigitvalues$asterisk$"]), 57, 9);
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$hexdigitvalues$asterisk$"]), 56, 8);
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$hexdigitvalues$asterisk$"]), 55, 7);
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$hexdigitvalues$asterisk$"]), 54, 6);
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$hexdigitvalues$asterisk$"]), 53, 5);
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$hexdigitvalues$asterisk$"]), 52, 4);
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$hexdigitvalues$asterisk$"]), 51, 3);
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$hexdigitvalues$asterisk$"]), 50, 2);
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$hexdigitvalues$asterisk$"]), 49, 1);
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$hexdigitvalues$asterisk$"]), 48, 0);
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$hexdigitvalues$asterisk$"]), 70, 15);
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$hexdigitvalues$asterisk$"]), 69, 14);
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$hexdigitvalues$asterisk$"]), 68, 13);
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$hexdigitvalues$asterisk$"]), 67, 12);
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$hexdigitvalues$asterisk$"]), 66, 11);
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$hexdigitvalues$asterisk$"]), 65, 10);
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$hexdigitvalues$asterisk$"]), 102, 15);
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$hexdigitvalues$asterisk$"]), 101, 14);
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$hexdigitvalues$asterisk$"]), 100, 13);
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$hexdigitvalues$asterisk$"]), 99, 12);
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$hexdigitvalues$asterisk$"]), 98, 11);
;

shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$hexdigitvalues$asterisk$"]), 97, 10);
;

function shen_lineread() {return (shen_tail_call(shen_get_fn_js(shen_lineread_loop), shen_tail_call(shen_read_byte, shen_tail_call(shen_stinput, 0)))([]));}
shen_lineread;

function shen_lineread_loop(V3786) {
  if (V3786 == undefined) return shen_lineread_loop;
  return (function lambda1518(V3787) {return (V3787 == undefined) ? lambda1518 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(V3786, shen_tail_call(shen_get_fn_js(shen_hat)));})) ? (shen_tail_call(shen_interror, "line read aborted")([])) : ((shen_tail_call(shen_tail_call(shen_element$question$, V3786), [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_newline)), [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_carriage_return)), []]])) ? ((function(Line) {return new Shen_tco_obj(function() {return (((shen_tail_call(function() {return shen_equal$question$_js(Line, shen_fail_obj);}) || (shen_empty$question$_js(Line)))) ? (shen_tail_call(shen_get_fn_js(shen_lineread_loop), shen_tail_call(shen_read_byte, shen_tail_call(shen_stinput, 0)))(shen_tail_call(shen_tail_call(shen_append, V3787), [shen_type_cons, V3786, []]))) : Line);});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_compile, shen_$lt$st$_input$gt$), V3787), [])))
 : (shen_tail_call(shen_get_fn_js(shen_lineread_loop), shen_tail_call(shen_read_byte, shen_tail_call(shen_stinput, 0)))(shen_tail_call(shen_tail_call(shen_append, V3787), [shen_type_cons, V3786, []])))));});});
}
shen_lineread_loop;

function shen_read_file(V3788) {
  if (V3788 == undefined) return shen_read_file;
  return ((function(Bytelist) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_compile, shen_$lt$st$_input$gt$), Bytelist)(shen_read_error));});})(shen_tail_call(shen_read_file_as_bytelist, V3788)))
;
}
shen_read_file;

function shen_read_error(V3789) {
  if (V3789 == undefined) return shen_read_error;
  return (shen_tail_call(shen_interror, "read error here:~%~% ~A~%")([shen_tuple, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_compress_50), 50), V3789), []]));
}
shen_read_error;

function shen_compress_50(V3794) {
  if (V3794 == undefined) return shen_compress_50;
  return (function lambda1519(V3795) {return (V3795 == undefined) ? lambda1519 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V3795))) ? "" : ((shen_tail_call(function() {return shen_equal$question$_js(0, V3794);})) ? "" : ((shen_is_type_js(V3795, shen_type_cons)) ? (shen_tail_call(shen_n_$gt$string, V3795[1]) + shen_tail_call(shen_tail_call(shen_get_fn_js(shen_compress_50), (V3794 - 1)), V3795[2])) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_compress_50"])))));});});
}
shen_compress_50;

function shen_$lt$st$_input$gt$(V3800) {
  if (V3800 == undefined) return shen_$lt$st$_input$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$e$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$e$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$e$gt$)), []) : shen_fail_obj);});}), shen_tail_call(shen_$lt$e$gt$, V3800))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$whitespaces$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$whitespaces$gt$);}))) ? shen_tail_call((function(Parse$_$lt$st$_input$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$st$_input$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$st$_input$gt$)), shen_tail_call(shen_snd, Parse$_$lt$st$_input$gt$)) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$st$_input$gt$), Parse$_$lt$whitespaces$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$whitespaces$gt$), V3800))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$atom$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$atom$gt$);}))) ? shen_tail_call((function(Parse$_$lt$st$_input$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$st$_input$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$st$_input$gt$)), [shen_type_cons, shen_tail_call(shen_macroexpand, shen_tail_call(shen_snd, Parse$_$lt$atom$gt$)), shen_tail_call(shen_snd, Parse$_$lt$st$_input$gt$)]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$st$_input$gt$), Parse$_$lt$atom$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$atom$gt$), V3800))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$comment$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$comment$gt$);}))) ? shen_tail_call((function(Parse$_$lt$st$_input$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$st$_input$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$st$_input$gt$)), shen_tail_call(shen_snd, Parse$_$lt$st$_input$gt$)) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$st$_input$gt$), Parse$_$lt$comment$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$comment$gt$), V3800))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$comma$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$comma$gt$);}))) ? shen_tail_call((function(Parse$_$lt$st$_input$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$st$_input$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$st$_input$gt$)), [shen_type_cons, [shen_type_symbol, ","], shen_tail_call(shen_snd, Parse$_$lt$st$_input$gt$)]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$st$_input$gt$), Parse$_$lt$comma$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$comma$gt$), V3800))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$colon$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$colon$gt$);}))) ? shen_tail_call((function(Parse$_$lt$st$_input$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$st$_input$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$st$_input$gt$)), [shen_type_cons, [shen_type_symbol, "$colon$"], shen_tail_call(shen_snd, Parse$_$lt$st$_input$gt$)]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$st$_input$gt$), Parse$_$lt$colon$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$colon$gt$), V3800))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$colon$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$colon$gt$);}))) ? shen_tail_call((function(Parse$_$lt$minus$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$minus$gt$);}))) ? shen_tail_call((function(Parse$_$lt$st$_input$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$st$_input$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$st$_input$gt$)), [shen_type_cons, [shen_type_symbol, "$colon$_"], shen_tail_call(shen_snd, Parse$_$lt$st$_input$gt$)]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$st$_input$gt$), Parse$_$lt$minus$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$minus$gt$), Parse$_$lt$colon$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$colon$gt$), V3800))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$colon$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$colon$gt$);}))) ? shen_tail_call((function(Parse$_$lt$equal$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$equal$gt$);}))) ? shen_tail_call((function(Parse$_$lt$st$_input$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$st$_input$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$st$_input$gt$)), [shen_type_cons, [shen_type_symbol, "$colon$$eq$"], shen_tail_call(shen_snd, Parse$_$lt$st$_input$gt$)]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$st$_input$gt$), Parse$_$lt$equal$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$equal$gt$), Parse$_$lt$colon$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$colon$gt$), V3800))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$semicolon$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$semicolon$gt$);}))) ? shen_tail_call((function(Parse$_$lt$st$_input$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$st$_input$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$st$_input$gt$)), [shen_type_cons, [shen_type_symbol, "$sc$"], shen_tail_call(shen_snd, Parse$_$lt$st$_input$gt$)]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$st$_input$gt$), Parse$_$lt$semicolon$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$semicolon$gt$), V3800))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$bar$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$bar$gt$);}))) ? shen_tail_call((function(Parse$_$lt$st$_input$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$st$_input$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$st$_input$gt$)), [shen_type_cons, [shen_type_symbol, "bar$excl$"], shen_tail_call(shen_snd, Parse$_$lt$st$_input$gt$)]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$st$_input$gt$), Parse$_$lt$bar$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$bar$gt$), V3800))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$rcurly$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$rcurly$gt$);}))) ? shen_tail_call((function(Parse$_$lt$st$_input$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$st$_input$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$st$_input$gt$)), [shen_type_cons, [shen_type_symbol, "$cbraceclose$"], shen_tail_call(shen_snd, Parse$_$lt$st$_input$gt$)]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$st$_input$gt$), Parse$_$lt$rcurly$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$rcurly$gt$), V3800))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$lcurly$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$lcurly$gt$);}))) ? shen_tail_call((function(Parse$_$lt$st$_input$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$st$_input$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$st$_input$gt$)), [shen_type_cons, [shen_type_symbol, "$cbraceopen$"], shen_tail_call(shen_snd, Parse$_$lt$st$_input$gt$)]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$st$_input$gt$), Parse$_$lt$lcurly$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$lcurly$gt$), V3800))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$lrb$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$lrb$gt$);}))) ? shen_tail_call((function(Parse$_$lt$st$_input1$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$st$_input1$gt$);}))) ? shen_tail_call((function(Parse$_$lt$rrb$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$rrb$gt$);}))) ? shen_tail_call((function(Parse$_$lt$st$_input2$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$st$_input2$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$st$_input2$gt$)), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_package_macro), shen_tail_call(shen_macroexpand, shen_tail_call(shen_snd, Parse$_$lt$st$_input1$gt$))), shen_tail_call(shen_snd, Parse$_$lt$st$_input2$gt$))) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$st$_input2$gt$), Parse$_$lt$rrb$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$rrb$gt$), Parse$_$lt$st$_input1$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$st$_input1$gt$), Parse$_$lt$lrb$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$lrb$gt$), V3800))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$lsb$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$lsb$gt$);}))) ? shen_tail_call((function(Parse$_$lt$st$_input1$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$st$_input1$gt$);}))) ? shen_tail_call((function(Parse$_$lt$rsb$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$rsb$gt$);}))) ? shen_tail_call((function(Parse$_$lt$st$_input2$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$st$_input2$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$st$_input2$gt$)), [shen_type_cons, shen_tail_call(shen_macroexpand, shen_tail_call(shen_get_fn_js(shen_cons$_form), shen_tail_call(shen_snd, Parse$_$lt$st$_input1$gt$))), shen_tail_call(shen_snd, Parse$_$lt$st$_input2$gt$)]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$st$_input2$gt$), Parse$_$lt$rsb$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$rsb$gt$), Parse$_$lt$st$_input1$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$st$_input1$gt$), Parse$_$lt$lsb$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$lsb$gt$), V3800))
))
;
}
shen_$lt$st$_input$gt$;

function shen_$lt$lsb$gt$(V3805) {
  if (V3805 == undefined) return shen_$lt$lsb$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V3805), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V3805)[2]), shen_tail_call(shen_snd, V3805)))), ((shen_tail_call(function() {return shen_equal$question$_js(shen_tail_call(shen_fst, V3805)[1], 91);})) ? [shen_type_symbol, "shen_skip"] : shen_fail_obj)) : shen_fail_obj)))
;
}
shen_$lt$lsb$gt$;

function shen_$lt$rsb$gt$(V3810) {
  if (V3810 == undefined) return shen_$lt$rsb$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V3810), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V3810)[2]), shen_tail_call(shen_snd, V3810)))), ((shen_tail_call(function() {return shen_equal$question$_js(shen_tail_call(shen_fst, V3810)[1], 93);})) ? [shen_type_symbol, "shen_skip"] : shen_fail_obj)) : shen_fail_obj)))
;
}
shen_$lt$rsb$gt$;

function shen_$lt$lrb$gt$(V3815) {
  if (V3815 == undefined) return shen_$lt$lrb$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V3815), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V3815)[2]), shen_tail_call(shen_snd, V3815)))), ((shen_tail_call(function() {return shen_equal$question$_js(shen_tail_call(shen_fst, V3815)[1], 40);})) ? [shen_type_symbol, "shen_skip"] : shen_fail_obj)) : shen_fail_obj)))
;
}
shen_$lt$lrb$gt$;

function shen_$lt$rrb$gt$(V3820) {
  if (V3820 == undefined) return shen_$lt$rrb$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V3820), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V3820)[2]), shen_tail_call(shen_snd, V3820)))), ((shen_tail_call(function() {return shen_equal$question$_js(shen_tail_call(shen_fst, V3820)[1], 41);})) ? [shen_type_symbol, "shen_skip"] : shen_fail_obj)) : shen_fail_obj)))
;
}
shen_$lt$rrb$gt$;

function shen_$lt$lcurly$gt$(V3825) {
  if (V3825 == undefined) return shen_$lt$lcurly$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V3825), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V3825)[2]), shen_tail_call(shen_snd, V3825)))), ((shen_tail_call(function() {return shen_equal$question$_js(shen_tail_call(shen_fst, V3825)[1], 123);})) ? [shen_type_symbol, "shen_skip"] : shen_fail_obj)) : shen_fail_obj)))
;
}
shen_$lt$lcurly$gt$;

function shen_$lt$rcurly$gt$(V3830) {
  if (V3830 == undefined) return shen_$lt$rcurly$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V3830), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V3830)[2]), shen_tail_call(shen_snd, V3830)))), ((shen_tail_call(function() {return shen_equal$question$_js(shen_tail_call(shen_fst, V3830)[1], 125);})) ? [shen_type_symbol, "shen_skip"] : shen_fail_obj)) : shen_fail_obj)))
;
}
shen_$lt$rcurly$gt$;

function shen_$lt$bar$gt$(V3835) {
  if (V3835 == undefined) return shen_$lt$bar$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V3835), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V3835)[2]), shen_tail_call(shen_snd, V3835)))), ((shen_tail_call(function() {return shen_equal$question$_js(shen_tail_call(shen_fst, V3835)[1], 124);})) ? [shen_type_symbol, "shen_skip"] : shen_fail_obj)) : shen_fail_obj)))
;
}
shen_$lt$bar$gt$;

function shen_$lt$semicolon$gt$(V3840) {
  if (V3840 == undefined) return shen_$lt$semicolon$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V3840), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V3840)[2]), shen_tail_call(shen_snd, V3840)))), ((shen_tail_call(function() {return shen_equal$question$_js(shen_tail_call(shen_fst, V3840)[1], 59);})) ? [shen_type_symbol, "shen_skip"] : shen_fail_obj)) : shen_fail_obj)))
;
}
shen_$lt$semicolon$gt$;

function shen_$lt$colon$gt$(V3845) {
  if (V3845 == undefined) return shen_$lt$colon$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V3845), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V3845)[2]), shen_tail_call(shen_snd, V3845)))), ((shen_tail_call(function() {return shen_equal$question$_js(shen_tail_call(shen_fst, V3845)[1], 58);})) ? [shen_type_symbol, "shen_skip"] : shen_fail_obj)) : shen_fail_obj)))
;
}
shen_$lt$colon$gt$;

function shen_$lt$comma$gt$(V3850) {
  if (V3850 == undefined) return shen_$lt$comma$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V3850), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V3850)[2]), shen_tail_call(shen_snd, V3850)))), ((shen_tail_call(function() {return shen_equal$question$_js(shen_tail_call(shen_fst, V3850)[1], 44);})) ? [shen_type_symbol, "shen_skip"] : shen_fail_obj)) : shen_fail_obj)))
;
}
shen_$lt$comma$gt$;

function shen_$lt$equal$gt$(V3855) {
  if (V3855 == undefined) return shen_$lt$equal$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V3855), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V3855)[2]), shen_tail_call(shen_snd, V3855)))), ((shen_tail_call(function() {return shen_equal$question$_js(shen_tail_call(shen_fst, V3855)[1], 61);})) ? [shen_type_symbol, "shen_skip"] : shen_fail_obj)) : shen_fail_obj)))
;
}
shen_$lt$equal$gt$;

function shen_$lt$minus$gt$(V3860) {
  if (V3860 == undefined) return shen_$lt$minus$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V3860), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V3860)[2]), shen_tail_call(shen_snd, V3860)))), ((shen_tail_call(function() {return shen_equal$question$_js(shen_tail_call(shen_fst, V3860)[1], 45);})) ? [shen_type_symbol, "shen_skip"] : shen_fail_obj)) : shen_fail_obj)))
;
}
shen_$lt$minus$gt$;

function shen_$lt$plus$gt$(V3865) {
  if (V3865 == undefined) return shen_$lt$plus$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V3865), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V3865)[2]), shen_tail_call(shen_snd, V3865)))), ((shen_tail_call(function() {return shen_equal$question$_js(shen_tail_call(shen_fst, V3865)[1], 43);})) ? [shen_type_symbol, "shen_skip"] : shen_fail_obj)) : shen_fail_obj)))
;
}
shen_$lt$plus$gt$;

function shen_$lt$stop$gt$(V3870) {
  if (V3870 == undefined) return shen_$lt$stop$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V3870), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V3870)[2]), shen_tail_call(shen_snd, V3870)))), ((shen_tail_call(function() {return shen_equal$question$_js(shen_tail_call(shen_fst, V3870)[1], 46);})) ? [shen_type_symbol, "shen_skip"] : shen_fail_obj)) : shen_fail_obj)))
;
}
shen_$lt$stop$gt$;

function shen_$lt$dbq$gt$(V3875) {
  if (V3875 == undefined) return shen_$lt$dbq$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V3875), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V3875)[2]), shen_tail_call(shen_snd, V3875)))), ((shen_tail_call(function() {return shen_equal$question$_js(shen_tail_call(shen_fst, V3875)[1], 34);})) ? [shen_type_symbol, "shen_skip"] : shen_fail_obj)) : shen_fail_obj)))
;
}
shen_$lt$dbq$gt$;

function shen_$lt$backslash$gt$(V3880) {
  if (V3880 == undefined) return shen_$lt$backslash$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V3880), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V3880)[2]), shen_tail_call(shen_snd, V3880)))), ((shen_tail_call(function() {return shen_equal$question$_js(shen_tail_call(shen_fst, V3880)[1], 92);})) ? [shen_type_symbol, "shen_skip"] : shen_fail_obj)) : shen_fail_obj)))
;
}
shen_$lt$backslash$gt$;

function shen_$lt$times$gt$(V3885) {
  if (V3885 == undefined) return shen_$lt$times$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V3885), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V3885)[2]), shen_tail_call(shen_snd, V3885)))), ((shen_tail_call(function() {return shen_equal$question$_js(shen_tail_call(shen_fst, V3885)[1], 42);})) ? [shen_type_symbol, "shen_skip"] : shen_fail_obj)) : shen_fail_obj)))
;
}
shen_$lt$times$gt$;

function shen_$lt$atom$gt$(V3890) {
  if (V3890 == undefined) return shen_$lt$atom$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$sym$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$sym$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$sym$gt$)), shen_tail_call(shen_snd, Parse$_$lt$sym$gt$)) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$sym$gt$), V3890))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$number$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$number$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$number$gt$)), shen_tail_call(shen_snd, Parse$_$lt$number$gt$)) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$number$gt$), V3890))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$str$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$str$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$str$gt$)), shen_tail_call(shen_snd, Parse$_$lt$str$gt$)) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$str$gt$), V3890))
))
;
}
shen_$lt$atom$gt$;

function shen_$lt$sym$gt$(V3895) {
  if (V3895 == undefined) return shen_$lt$sym$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$alpha$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$alpha$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$alpha$gt$)), shen_intern_js(shen_tail_call(shen_snd, Parse$_$lt$alpha$gt$))) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$alpha$gt$), V3895))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$alpha$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$alpha$gt$);}))) ? shen_tail_call((function(Parse$_$lt$symchars$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$symchars$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$symchars$gt$)), shen_intern_js((shen_tail_call(shen_snd, Parse$_$lt$alpha$gt$) + shen_tail_call(shen_snd, Parse$_$lt$symchars$gt$)))) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$symchars$gt$), Parse$_$lt$alpha$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$alpha$gt$), V3895))
))
;
}
shen_$lt$sym$gt$;

function shen_$lt$symchars$gt$(V3900) {
  if (V3900 == undefined) return shen_$lt$symchars$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$symchar$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$symchar$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$symchar$gt$)), shen_tail_call(shen_snd, Parse$_$lt$symchar$gt$)) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$symchar$gt$), V3900))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$symchar$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$symchar$gt$);}))) ? shen_tail_call((function(Parse$_$lt$symchars$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$symchars$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$symchars$gt$)), (shen_tail_call(shen_snd, Parse$_$lt$symchar$gt$) + shen_tail_call(shen_snd, Parse$_$lt$symchars$gt$))) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$symchars$gt$), Parse$_$lt$symchar$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$symchar$gt$), V3900))
))
;
}
shen_$lt$symchars$gt$;

function shen_$lt$symchar$gt$(V3905) {
  if (V3905 == undefined) return shen_$lt$symchar$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$digit_$gt$string$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$digit_$gt$string$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$digit_$gt$string$gt$)), shen_tail_call(shen_snd, Parse$_$lt$digit_$gt$string$gt$)) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$digit_$gt$string$gt$), V3905))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$alpha$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$alpha$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$alpha$gt$)), shen_tail_call(shen_snd, Parse$_$lt$alpha$gt$)) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$alpha$gt$), V3905))
))
;
}
shen_$lt$symchar$gt$;

function shen_$lt$digit_$gt$string$gt$(V3910) {
  if (V3910 == undefined) return shen_$lt$digit_$gt$string$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V3910), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V3910)[2]), shen_tail_call(shen_snd, V3910)))), shen_absvector_ref_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$digitcodes$asterisk$"]), shen_tail_call(shen_fst, V3910)[1])) : shen_fail_obj)))
;
}
shen_$lt$digit_$gt$string$gt$;

function shen_$lt$alpha$gt$(V3915) {
  if (V3915 == undefined) return shen_$lt$alpha$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V3915), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V3915)[2]), shen_tail_call(shen_snd, V3915)))), shen_absvector_ref_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$symbolcodes$asterisk$"]), shen_tail_call(shen_fst, V3915)[1])) : shen_fail_obj)))
;
}
shen_$lt$alpha$gt$;

function shen_$lt$str$gt$(V3920) {
  if (V3920 == undefined) return shen_$lt$str$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$dbq$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$dbq$gt$);}))) ? shen_tail_call((function(Parse$_$lt$strcontents$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$strcontents$gt$);}))) ? shen_tail_call((function(Parse$_$lt$dbq$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$dbq$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$dbq$gt$)), shen_tail_call(shen_snd, Parse$_$lt$strcontents$gt$)) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$dbq$gt$), Parse$_$lt$strcontents$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$strcontents$gt$), Parse$_$lt$dbq$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$dbq$gt$), V3920))
))
;
}
shen_$lt$str$gt$;

function shen_$lt$hex_digit$gt$(V3925) {
  if (V3925 == undefined) return shen_$lt$hex_digit$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V3925), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V3925)[2]), shen_tail_call(shen_snd, V3925)))), shen_absvector_ref_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$hexdigitvalues$asterisk$"]), shen_tail_call(shen_fst, V3925)[1])) : shen_fail_obj)))
;
}
shen_$lt$hex_digit$gt$;

function shen_$lt$hex_digit1$gt$(V3930) {
  if (V3930 == undefined) return shen_$lt$hex_digit1$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$hex_digit$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$hex_digit$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$hex_digit$gt$)), shen_tail_call(shen_snd, Parse$_$lt$hex_digit$gt$)) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$hex_digit$gt$), V3930))
))
;
}
shen_$lt$hex_digit1$gt$;

function shen_$lt$hex_char_code$gt$(V3935) {
  if (V3935 == undefined) return shen_$lt$hex_char_code$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$hex_digit$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$hex_digit$gt$);}))) ? shen_tail_call((function(Parse$_$lt$hex_digit1$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$hex_digit1$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$hex_digit1$gt$)), ((shen_tail_call(shen_snd, Parse$_$lt$hex_digit$gt$) * 16) + shen_tail_call(shen_snd, Parse$_$lt$hex_digit1$gt$))) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$hex_digit1$gt$), Parse$_$lt$hex_digit$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$hex_digit$gt$), V3935))
))
;
}
shen_$lt$hex_char_code$gt$;

function shen_$lt$strcontents$gt$(V3940) {
  if (V3940 == undefined) return shen_$lt$strcontents$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$e$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$e$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$e$gt$)), "") : shen_fail_obj);});}), shen_tail_call(shen_$lt$e$gt$, V3940))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$strc$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$strc$gt$);}))) ? shen_tail_call((function(Parse$_$lt$strcontents$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$strcontents$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$strcontents$gt$)), (shen_tail_call(shen_snd, Parse$_$lt$strc$gt$) + shen_tail_call(shen_snd, Parse$_$lt$strcontents$gt$))) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$strcontents$gt$), Parse$_$lt$strc$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$strc$gt$), V3940))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$backslash$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$backslash$gt$);}))) ? shen_tail_call((function(Parse$_$lt$byte$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$byte$gt$);}))) ? shen_tail_call((function(Parse$_$lt$strcontents$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$strcontents$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$strcontents$gt$)), (shen_tail_call(shen_snd, Parse$_$lt$byte$gt$) + shen_tail_call(shen_snd, Parse$_$lt$strcontents$gt$))) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$strcontents$gt$), Parse$_$lt$byte$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$byte$gt$), Parse$_$lt$backslash$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$backslash$gt$), V3940))
))
 : Result);});})((((shen_is_type_js(shen_tail_call(shen_fst, V3940), shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js(99, shen_tail_call(shen_fst, V3940)[1]);}))) ? (((shen_is_type_js(shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V3940)[2]), shen_tail_call(shen_snd, V3940))), shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js(35, shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V3940)[2]), shen_tail_call(shen_snd, V3940)))[1]);}))) ? shen_tail_call((function(Parse$_$lt$digits$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$digits$gt$);}))) ? (((shen_is_type_js(shen_tail_call(shen_fst, Parse$_$lt$digits$gt$), shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js(59, shen_tail_call(shen_fst, Parse$_$lt$digits$gt$)[1]);}))) ? shen_tail_call((function(Parse$_$lt$strcontents$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$strcontents$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$strcontents$gt$)), (shen_tail_call(shen_n_$gt$string, shen_tail_call(shen_snd, Parse$_$lt$digits$gt$)) + shen_tail_call(shen_snd, Parse$_$lt$strcontents$gt$))) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$strcontents$gt$), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$digits$gt$)[2]), shen_tail_call(shen_snd, Parse$_$lt$digits$gt$))))
 : shen_fail_obj) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$digits$gt$), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V3940)[2]), shen_tail_call(shen_snd, V3940)))[2]), shen_tail_call(shen_snd, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V3940)[2]), shen_tail_call(shen_snd, V3940))))))
 : shen_fail_obj) : shen_fail_obj)))
 : Result);});})(shen_tail_call((function(Parse$_$lt$backslash$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$backslash$gt$);}))) ? (((shen_is_type_js(shen_tail_call(shen_fst, Parse$_$lt$backslash$gt$), shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js(120, shen_tail_call(shen_fst, Parse$_$lt$backslash$gt$)[1]);}))) ? shen_tail_call((function(Parse$_$lt$hex_char_code$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$hex_char_code$gt$);}))) ? shen_tail_call((function(Parse$_$lt$strcontents$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$strcontents$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$strcontents$gt$)), (shen_tail_call(shen_n_$gt$string, shen_tail_call(shen_snd, Parse$_$lt$hex_char_code$gt$)) + shen_tail_call(shen_snd, Parse$_$lt$strcontents$gt$))) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$strcontents$gt$), Parse$_$lt$hex_char_code$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$hex_char_code$gt$), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$backslash$gt$)[2]), shen_tail_call(shen_snd, Parse$_$lt$backslash$gt$))))
 : shen_fail_obj) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$backslash$gt$), V3940))
))
;
}
shen_$lt$strcontents$gt$;

function shen_$lt$byte$gt$(V3945) {
  if (V3945 == undefined) return shen_$lt$byte$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V3945), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V3945)[2]), shen_tail_call(shen_snd, V3945)))), shen_tail_call(shen_n_$gt$string, shen_tail_call(shen_fst, V3945)[1])) : shen_fail_obj)))
;
}
shen_$lt$byte$gt$;

function shen_$lt$strc$gt$(V3950) {
  if (V3950 == undefined) return shen_$lt$strc$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V3950), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V3950)[2]), shen_tail_call(shen_snd, V3950)))), ((shen_tail_call(function() {return shen_equal$question$_js(shen_tail_call(shen_fst, V3950)[1], 34);})) ? shen_fail_obj : shen_tail_call(shen_n_$gt$string, shen_tail_call(shen_fst, V3950)[1]))) : shen_fail_obj)))
;
}
shen_$lt$strc$gt$;

function shen_$lt$number$gt$(V3955) {
  if (V3955 == undefined) return shen_$lt$number$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$digits$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$digits$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$digits$gt$)), shen_tail_call(shen_snd, Parse$_$lt$digits$gt$)) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$digits$gt$), V3955))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$predigits$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$predigits$gt$);}))) ? shen_tail_call((function(Parse$_$lt$stop$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$stop$gt$);}))) ? shen_tail_call((function(Parse$_$lt$postdigits$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$postdigits$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$postdigits$gt$)), (shen_tail_call(shen_snd, Parse$_$lt$predigits$gt$) + shen_tail_call(shen_snd, Parse$_$lt$postdigits$gt$))) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$postdigits$gt$), Parse$_$lt$stop$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$stop$gt$), Parse$_$lt$predigits$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$predigits$gt$), V3955))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$digits$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$digits$gt$);}))) ? shen_tail_call((function(Parse$_$lt$E$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$E$gt$);}))) ? shen_tail_call((function(Parse$_$lt$log10$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$log10$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$log10$gt$)), (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_expt), 10), shen_tail_call(shen_snd, Parse$_$lt$log10$gt$)) * shen_tail_call(shen_snd, Parse$_$lt$digits$gt$))) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$log10$gt$), Parse$_$lt$E$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$E$gt$), Parse$_$lt$digits$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$digits$gt$), V3955))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$predigits$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$predigits$gt$);}))) ? shen_tail_call((function(Parse$_$lt$stop$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$stop$gt$);}))) ? shen_tail_call((function(Parse$_$lt$postdigits$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$postdigits$gt$);}))) ? shen_tail_call((function(Parse$_$lt$E$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$E$gt$);}))) ? shen_tail_call((function(Parse$_$lt$log10$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$log10$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$log10$gt$)), (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_expt), 10), shen_tail_call(shen_snd, Parse$_$lt$log10$gt$)) * (shen_tail_call(shen_snd, Parse$_$lt$predigits$gt$) + shen_tail_call(shen_snd, Parse$_$lt$postdigits$gt$)))) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$log10$gt$), Parse$_$lt$E$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$E$gt$), Parse$_$lt$postdigits$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$postdigits$gt$), Parse$_$lt$stop$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$stop$gt$), Parse$_$lt$predigits$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$predigits$gt$), V3955))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$plus$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$plus$gt$);}))) ? shen_tail_call((function(Parse$_$lt$number$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$number$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$number$gt$)), shen_tail_call(shen_snd, Parse$_$lt$number$gt$)) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$number$gt$), Parse$_$lt$plus$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$plus$gt$), V3955))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$minus$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$minus$gt$);}))) ? shen_tail_call((function(Parse$_$lt$number$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$number$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$number$gt$)), (0 - shen_tail_call(shen_snd, Parse$_$lt$number$gt$))) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$number$gt$), Parse$_$lt$minus$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$minus$gt$), V3955))
))
;
}
shen_$lt$number$gt$;

function shen_$lt$E$gt$(V3960) {
  if (V3960 == undefined) return shen_$lt$E$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V3960), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V3960)[2]), shen_tail_call(shen_snd, V3960)))), ((shen_tail_call(function() {return shen_equal$question$_js(shen_tail_call(shen_fst, V3960)[1], 69);})) ? [shen_type_symbol, "shen_skip"] : shen_fail_obj)) : shen_fail_obj)))
 : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V3960), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V3960)[2]), shen_tail_call(shen_snd, V3960)))), ((shen_tail_call(function() {return shen_equal$question$_js(shen_tail_call(shen_fst, V3960)[1], 101);})) ? [shen_type_symbol, "shen_skip"] : shen_fail_obj)) : shen_fail_obj)))
;
}
shen_$lt$E$gt$;

function shen_$lt$log10$gt$(V3965) {
  if (V3965 == undefined) return shen_$lt$log10$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$digits$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$digits$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$digits$gt$)), shen_tail_call(shen_snd, Parse$_$lt$digits$gt$)) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$digits$gt$), V3965))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$plus$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$plus$gt$);}))) ? shen_tail_call((function(Parse$_$lt$digits$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$digits$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$digits$gt$)), shen_tail_call(shen_snd, Parse$_$lt$digits$gt$)) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$digits$gt$), Parse$_$lt$plus$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$plus$gt$), V3965))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$minus$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$minus$gt$);}))) ? shen_tail_call((function(Parse$_$lt$digits$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$digits$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$digits$gt$)), (0 - shen_tail_call(shen_snd, Parse$_$lt$digits$gt$))) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$digits$gt$), Parse$_$lt$minus$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$minus$gt$), V3965))
))
;
}
shen_$lt$log10$gt$;

function shen_$lt$predigits$gt$(V3970) {
  if (V3970 == undefined) return shen_$lt$predigits$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$e$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$e$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$e$gt$)), 0) : shen_fail_obj);});}), shen_tail_call(shen_$lt$e$gt$, V3970))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$digits$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$digits$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$digits$gt$)), shen_tail_call(shen_snd, Parse$_$lt$digits$gt$)) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$digits$gt$), V3970))
))
;
}
shen_$lt$predigits$gt$;

function shen_$lt$postdigits$gt$(V3975) {
  if (V3975 == undefined) return shen_$lt$postdigits$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$digit$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$digit$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$digit$gt$)), (shen_tail_call(shen_snd, Parse$_$lt$digit$gt$) / 10)) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$digit$gt$), V3975))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$digit$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$digit$gt$);}))) ? shen_tail_call((function(Parse$_$lt$postdigits$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$postdigits$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$postdigits$gt$)), ((shen_tail_call(shen_snd, Parse$_$lt$digit$gt$) / 10) + (shen_tail_call(shen_snd, Parse$_$lt$postdigits$gt$) / 10))) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$postdigits$gt$), Parse$_$lt$digit$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$digit$gt$), V3975))
))
;
}
shen_$lt$postdigits$gt$;

function shen_digits_seq_to_number(V3976) {
  if (V3976 == undefined) return shen_digits_seq_to_number;
  return (function lambda1520(V3977) {return (V3977 == undefined) ? lambda1520 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V3976))) ? V3977 : ((shen_is_type_js(V3976, shen_type_cons)) ? (shen_tail_call(shen_get_fn_js(shen_digits_seq_to_number), V3976[2])(((V3977 * 10) + V3976[1]))) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_digits_seq_to_number"]))));});});
}
shen_digits_seq_to_number;

function shen_$lt$digits$gt$(V3982) {
  if (V3982 == undefined) return shen_$lt$digits$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$digits_seq$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$digits_seq$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$digits_seq$gt$)), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_digits_seq_to_number), shen_tail_call(shen_snd, Parse$_$lt$digits_seq$gt$)), 0)) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$digits_seq$gt$), V3982))
))
;
}
shen_$lt$digits$gt$;

function shen_$lt$digits_seq$gt$(V3987) {
  if (V3987 == undefined) return shen_$lt$digits_seq$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$digit$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$digit$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$digit$gt$)), [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$digit$gt$), []]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$digit$gt$), V3987))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$digit$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$digit$gt$);}))) ? shen_tail_call((function(Parse$_$lt$digits_seq$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$digits_seq$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$digits_seq$gt$)), [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$digit$gt$), shen_tail_call(shen_snd, Parse$_$lt$digits_seq$gt$)]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$digits_seq$gt$), Parse$_$lt$digit$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$digit$gt$), V3987))
))
;
}
shen_$lt$digits_seq$gt$;

function shen_$lt$digit$gt$(V3992) {
  if (V3992 == undefined) return shen_$lt$digit$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V3992), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V3992)[2]), shen_tail_call(shen_snd, V3992)))), shen_absvector_ref_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$digitvalues$asterisk$"]), shen_tail_call(shen_fst, V3992)[1])) : shen_fail_obj)))
;
}
shen_$lt$digit$gt$;

function shen_expt(V3995) {
  if (V3995 == undefined) return shen_expt;
  return (function lambda1521(V3996) {return (V3996 == undefined) ? lambda1521 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(0, V3996);})) ? 1 : (((V3996 > 0)) ? (V3995 * shen_tail_call(shen_tail_call(shen_get_fn_js(shen_expt), V3995), (V3996 - 1))) : (1 * (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_expt), V3995), (V3996 + 1)) / V3995))));});});
}
shen_expt;

function shen_$lt$st$_input1$gt$(V4001) {
  if (V4001 == undefined) return shen_$lt$st$_input1$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$st$_input$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$st$_input$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$st$_input$gt$)), shen_tail_call(shen_snd, Parse$_$lt$st$_input$gt$)) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$st$_input$gt$), V4001))
))
;
}
shen_$lt$st$_input1$gt$;

function shen_$lt$st$_input2$gt$(V4006) {
  if (V4006 == undefined) return shen_$lt$st$_input2$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$st$_input$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$st$_input$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$st$_input$gt$)), shen_tail_call(shen_snd, Parse$_$lt$st$_input$gt$)) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$st$_input$gt$), V4006))
))
;
}
shen_$lt$st$_input2$gt$;

function shen_$lt$comment$gt$(V4011) {
  if (V4011 == undefined) return shen_$lt$comment$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$backslash$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$backslash$gt$);}))) ? shen_tail_call((function(Parse$_$lt$times$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$times$gt$);}))) ? shen_tail_call((function(Parse$_$lt$any$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$any$gt$);}))) ? shen_tail_call((function(Parse$_$lt$times$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$times$gt$);}))) ? shen_tail_call((function(Parse$_$lt$backslash$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$backslash$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$backslash$gt$)), [shen_type_symbol, "shen_skip"]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$backslash$gt$), Parse$_$lt$times$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$times$gt$), Parse$_$lt$any$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$any$gt$), Parse$_$lt$times$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$times$gt$), Parse$_$lt$backslash$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$backslash$gt$), V4011))
))
;
}
shen_$lt$comment$gt$;

function shen_$lt$any$gt$(V4016) {
  if (V4016 == undefined) return shen_$lt$any$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$e$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$e$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$e$gt$)), [shen_type_symbol, "shen_skip"]) : shen_fail_obj);});}), shen_tail_call(shen_$lt$e$gt$, V4016))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$blah$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$blah$gt$);}))) ? shen_tail_call((function(Parse$_$lt$any$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$any$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$any$gt$)), [shen_type_symbol, "shen_skip"]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$any$gt$), Parse$_$lt$blah$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$blah$gt$), V4016))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$comment$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$comment$gt$);}))) ? shen_tail_call((function(Parse$_$lt$any$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$any$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$any$gt$)), [shen_type_symbol, "shen_skip"]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$any$gt$), Parse$_$lt$comment$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$comment$gt$), V4016))
))
;
}
shen_$lt$any$gt$;

function shen_$lt$blah$gt$(V4021) {
  if (V4021 == undefined) return shen_$lt$blah$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V4021), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V4021)[2]), shen_tail_call(shen_snd, V4021)))), ((shen_tail_call(shen_get_fn_js(shen_end_of_comment$question$), shen_tail_call(shen_fst, V4021))) ? shen_fail_obj : [shen_type_symbol, "shen_skip"])) : shen_fail_obj)))
;
}
shen_$lt$blah$gt$;

function shen_end_of_comment$question$(V4028) {
  if (V4028 == undefined) return shen_end_of_comment$question$;
  return (((shen_is_type_js(V4028, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js(42, V4028[1]);}) && (shen_is_type_js(V4028[2], shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js(92, V4028[2][1]);}))))) ? true : false);
}
shen_end_of_comment$question$;

function shen_$lt$whitespaces$gt$(V4033) {
  if (V4033 == undefined) return shen_$lt$whitespaces$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$whitespace$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$whitespace$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$whitespace$gt$)), [shen_type_symbol, "shen_skip"]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$whitespace$gt$), V4033))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$whitespace$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$whitespace$gt$);}))) ? shen_tail_call((function(Parse$_$lt$whitespaces$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$whitespaces$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$whitespaces$gt$)), [shen_type_symbol, "shen_skip"]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$whitespaces$gt$), Parse$_$lt$whitespace$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$whitespace$gt$), V4033))
))
;
}
shen_$lt$whitespaces$gt$;

function shen_$lt$whitespace$gt$(V4038) {
  if (V4038 == undefined) return shen_$lt$whitespace$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V4038), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V4038)[2]), shen_tail_call(shen_snd, V4038)))), shen_tail_call((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, 32);})) ? [shen_type_symbol, "shen_skip"] : ((shen_tail_call(function() {return shen_equal$question$_js(Case, 13);})) ? [shen_type_symbol, "shen_skip"] : ((shen_tail_call(function() {return shen_equal$question$_js(Case, 10);})) ? [shen_type_symbol, "shen_skip"] : ((shen_tail_call(function() {return shen_equal$question$_js(Case, 9);})) ? [shen_type_symbol, "shen_skip"] : shen_fail_obj))));});}), shen_tail_call(shen_fst, V4038)[1])
) : shen_fail_obj)))
;
}
shen_$lt$whitespace$gt$;

function shen_cons$_form(V4039) {
  if (V4039 == undefined) return shen_cons$_form;
  return (((shen_empty$question$_js(V4039))) ? [] : (((shen_is_type_js(V4039, shen_type_cons) && (shen_is_type_js(V4039[2], shen_type_cons) && (shen_is_type_js(V4039[2][2], shen_type_cons) && ((shen_empty$question$_js(V4039[2][2][2])) && shen_tail_call(function() {return shen_equal$question$_js(V4039[2][1], [shen_type_symbol, "bar$excl$"]);})))))) ? [shen_type_cons, [shen_type_symbol, "cons"], [shen_type_cons, V4039[1], V4039[2][2]]] : ((shen_is_type_js(V4039, shen_type_cons)) ? [shen_type_cons, [shen_type_symbol, "cons"], [shen_type_cons, V4039[1], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_cons$_form), V4039[2]), []]]] : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_cons$_form"])))));
}
shen_cons$_form;

function shen_package_macro(V4042) {
  if (V4042 == undefined) return shen_package_macro;
  return (function lambda1522(V4043) {return (V4043 == undefined) ? lambda1522 : new Shen_tco_obj(function() {return (((shen_is_type_js(V4042, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "package"], V4042[1]);}) && (shen_is_type_js(V4042[2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "null"], V4042[2][1]);}) && shen_is_type_js(V4042[2][2], shen_type_cons)))))) ? (shen_tail_call(shen_append, V4042[2][2][2])(V4043)) : (((shen_is_type_js(V4042, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "package"], V4042[1]);}) && (shen_is_type_js(V4042[2], shen_type_cons) && shen_is_type_js(V4042[2][2], shen_type_cons))))) ? ((function(ListofExceptions) {return new Shen_tco_obj(function() {return ((function(Record) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_append, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_packageh), V4042[2][1]), ListofExceptions), V4042[2][2][2]))(V4043));});})(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_record_exceptions), ListofExceptions), V4042[2][1])))
;});})(shen_tail_call(shen_eval_without_macros, V4042[2][2][1])))
 : [shen_type_cons, V4042, V4043]));});});
}
shen_package_macro;

function shen_record_exceptions(V4044) {
  if (V4044 == undefined) return shen_record_exceptions;
  return (function lambda1523(V4045) {return (V4045 == undefined) ? lambda1523 : new Shen_tco_obj(function() {return ((function(CurrExceptions) {return new Shen_tco_obj(function() {return ((function(AllExceptions) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_put, V4045), [shen_type_symbol, "shen_external_symbols"]), AllExceptions)(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$property_vector$asterisk$"])));});})(shen_tail_call(shen_tail_call(shen_union, V4044), CurrExceptions)))
;});})(trap_error_js(function() {return shen_tail_call(shen_tail_call(shen_tail_call(shen_get, V4045), [shen_type_symbol, "shen_external_symbols"]), shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$property_vector$asterisk$"]));}, function(E) {return [];})))
;});});
}
shen_record_exceptions;

function shen_packageh(V4054) {
  if (V4054 == undefined) return shen_packageh;
  return (function lambda1525(V4055) {return (V4055 == undefined) ? lambda1525 : new Shen_tco_obj(function() {return (function lambda1524(V4056) {return (V4056 == undefined) ? lambda1524 : new Shen_tco_obj(function() {return ((shen_is_type_js(V4056, shen_type_cons)) ? [shen_type_cons, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_packageh), V4054), V4055), V4056[1]), shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_packageh), V4054), V4055), V4056[2])] : (((shen_tail_call(shen_get_fn_js(shen_sysfunc$question$), V4056) || (shen_tail_call(shen_variable$question$, V4056) || (shen_tail_call(shen_tail_call(shen_element$question$, V4056), V4055) || (shen_tail_call(shen_get_fn_js(shen_doubleunderline$question$), V4056) || shen_tail_call(shen_get_fn_js(shen_singleunderline$question$), V4056)))))) ? V4056 : (((shen_is_type_js(V4056, shen_type_symbol) && (!shen_tail_call(shen_tail_call(shen_get_fn_js(shen_prefix$question$), [shen_type_cons, "s", [shen_type_cons, "h", [shen_type_cons, "e", [shen_type_cons, "n", [shen_type_cons, "-", []]]]]]), shen_tail_call(shen_explode, V4056))))) ? (shen_tail_call(shen_concat, V4054)(V4056)) : V4056)));});});});});
}
shen_packageh;



//## FILE js/prolog.js

function shen_$lt$defprolog$gt$(V2766) {
  if (V2766 == undefined) return shen_$lt$defprolog$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$predicate$asterisk$$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$predicate$asterisk$$gt$);}))) ? shen_tail_call((function(Parse$_$lt$clauses$asterisk$$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$clauses$asterisk$$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$clauses$asterisk$$gt$)), shen_tail_call(shen_get_fn_js(shen_prolog_$gt$shen), shen_tail_call(shen_tail_call(shen_map, (function lambda1431(X) {return (X == undefined) ? lambda1431 : new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_insert_predicate), shen_tail_call(shen_snd, Parse$_$lt$predicate$asterisk$$gt$))(X));});})), shen_tail_call(shen_snd, Parse$_$lt$clauses$asterisk$$gt$)))[1]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$clauses$asterisk$$gt$), Parse$_$lt$predicate$asterisk$$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$predicate$asterisk$$gt$), V2766))
))
;
}
shen_$lt$defprolog$gt$;

function shen_prolog_error(V2767) {
  if (V2767 == undefined) return shen_prolog_error;
  return (function lambda1432(V2768) {return (V2768 == undefined) ? lambda1432 : new Shen_tco_obj(function() {return (shen_tail_call(shen_interror, "prolog syntax error in ~A here:~%~% ~A~%")([shen_tuple, V2767, [shen_tuple, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_next_50), 50), V2768), []]]));});});
}
shen_prolog_error;

function shen_next_50(V2773) {
  if (V2773 == undefined) return shen_next_50;
  return (function lambda1433(V2774) {return (V2774 == undefined) ? lambda1433 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V2774))) ? "" : ((shen_tail_call(function() {return shen_equal$question$_js(0, V2773);})) ? "" : ((shen_is_type_js(V2774, shen_type_cons)) ? (shen_tail_call(shen_get_fn_js(shen_decons_string), V2774[1]) + shen_tail_call(shen_tail_call(shen_get_fn_js(shen_next_50), (V2773 - 1)), V2774[2])) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_next_50"])))));});});
}
shen_next_50;

function shen_decons_string(V2775) {
  if (V2775 == undefined) return shen_decons_string;
  return (((shen_is_type_js(V2775, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "cons"], V2775[1]);}) && (shen_is_type_js(V2775[2], shen_type_cons) && (shen_is_type_js(V2775[2][2], shen_type_cons) && (shen_empty$question$_js(V2775[2][2][2]))))))) ? (shen_tail_call(shen_intmake_string, "~S ")([shen_tuple, shen_tail_call(shen_get_fn_js(shen_eval_cons), V2775), []])) : (shen_tail_call(shen_intmake_string, "~R ")([shen_tuple, V2775, []])));
}
shen_decons_string;

function shen_insert_predicate(V2776) {
  if (V2776 == undefined) return shen_insert_predicate;
  return (function lambda1434(V2777) {return (V2777 == undefined) ? lambda1434 : new Shen_tco_obj(function() {return (((shen_is_type_js(V2777, shen_type_cons) && (shen_is_type_js(V2777[2], shen_type_cons) && (shen_empty$question$_js(V2777[2][2]))))) ? [shen_type_cons, [shen_type_cons, V2776, V2777[1]], [shen_type_cons, [shen_type_symbol, "$colon$_"], V2777[2]]] : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_insert_predicate"])));});});
}
shen_insert_predicate;

function shen_$lt$predicate$asterisk$$gt$(V2782) {
  if (V2782 == undefined) return shen_$lt$predicate$asterisk$$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V2782), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2782)[2]), shen_tail_call(shen_snd, V2782)))), shen_tail_call(shen_fst, V2782)[1]) : shen_fail_obj)))
;
}
shen_$lt$predicate$asterisk$$gt$;

function shen_$lt$clauses$asterisk$$gt$(V2787) {
  if (V2787 == undefined) return shen_$lt$clauses$asterisk$$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$e$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$e$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$e$gt$)), shen_tail_call(shen_snd, Parse$_$lt$e$gt$)) : shen_fail_obj);});}), shen_tail_call(shen_$lt$e$gt$, V2787))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$clause$asterisk$$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$clause$asterisk$$gt$);}))) ? shen_tail_call((function(Parse$_$lt$clauses$asterisk$$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$clauses$asterisk$$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$clauses$asterisk$$gt$)), [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$clause$asterisk$$gt$), shen_tail_call(shen_snd, Parse$_$lt$clauses$asterisk$$gt$)]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$clauses$asterisk$$gt$), Parse$_$lt$clause$asterisk$$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$clause$asterisk$$gt$), V2787))
))
;
}
shen_$lt$clauses$asterisk$$gt$;

function shen_$lt$clause$asterisk$$gt$(V2792) {
  if (V2792 == undefined) return shen_$lt$clause$asterisk$$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$head$asterisk$$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$head$asterisk$$gt$);}))) ? (((shen_is_type_js(shen_tail_call(shen_fst, Parse$_$lt$head$asterisk$$gt$), shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$lt$__"], shen_tail_call(shen_fst, Parse$_$lt$head$asterisk$$gt$)[1]);}))) ? shen_tail_call((function(Parse$_$lt$body$asterisk$$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$body$asterisk$$gt$);}))) ? shen_tail_call((function(Parse$_$lt$end$asterisk$$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$end$asterisk$$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$end$asterisk$$gt$)), [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$head$asterisk$$gt$), [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$body$asterisk$$gt$), []]]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$end$asterisk$$gt$), Parse$_$lt$body$asterisk$$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$body$asterisk$$gt$), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$head$asterisk$$gt$)[2]), shen_tail_call(shen_snd, Parse$_$lt$head$asterisk$$gt$))))
 : shen_fail_obj) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$head$asterisk$$gt$), V2792))
))
;
}
shen_$lt$clause$asterisk$$gt$;

function shen_$lt$head$asterisk$$gt$(V2797) {
  if (V2797 == undefined) return shen_$lt$head$asterisk$$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$e$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$e$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$e$gt$)), shen_tail_call(shen_snd, Parse$_$lt$e$gt$)) : shen_fail_obj);});}), shen_tail_call(shen_$lt$e$gt$, V2797))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$term$asterisk$$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$term$asterisk$$gt$);}))) ? shen_tail_call((function(Parse$_$lt$head$asterisk$$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$head$asterisk$$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$head$asterisk$$gt$)), [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$term$asterisk$$gt$), shen_tail_call(shen_snd, Parse$_$lt$head$asterisk$$gt$)]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$head$asterisk$$gt$), Parse$_$lt$term$asterisk$$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$term$asterisk$$gt$), V2797))
))
;
}
shen_$lt$head$asterisk$$gt$;

function shen_$lt$term$asterisk$$gt$(V2802) {
  if (V2802 == undefined) return shen_$lt$term$asterisk$$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V2802), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2802)[2]), shen_tail_call(shen_snd, V2802)))), ((((!shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$lt$__"], shen_tail_call(shen_fst, V2802)[1]);})) && shen_tail_call(shen_get_fn_js(shen_legitimate_term$question$), shen_tail_call(shen_fst, V2802)[1]))) ? shen_tail_call(shen_get_fn_js(shen_eval_cons), shen_tail_call(shen_fst, V2802)[1]) : shen_fail_obj)) : shen_fail_obj)))
;
}
shen_$lt$term$asterisk$$gt$;

function shen_legitimate_term$question$(V2807) {
  if (V2807 == undefined) return shen_legitimate_term$question$;
  return (((shen_is_type_js(V2807, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "cons"], V2807[1]);}) && (shen_is_type_js(V2807[2], shen_type_cons) && (shen_is_type_js(V2807[2][2], shen_type_cons) && (shen_empty$question$_js(V2807[2][2][2]))))))) ? (shen_tail_call(shen_get_fn_js(shen_legitimate_term$question$), V2807[2][1]) && shen_tail_call(shen_get_fn_js(shen_legitimate_term$question$), V2807[2][2][1])) : (((shen_is_type_js(V2807, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "mode"], V2807[1]);}) && (shen_is_type_js(V2807[2], shen_type_cons) && (shen_is_type_js(V2807[2][2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$plus$"], V2807[2][2][1]);}) && (shen_empty$question$_js(V2807[2][2][2])))))))) ? (shen_get_fn_js(shen_legitimate_term$question$)(V2807[2][1])) : (((shen_is_type_js(V2807, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "mode"], V2807[1]);}) && (shen_is_type_js(V2807[2], shen_type_cons) && (shen_is_type_js(V2807[2][2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "_"], V2807[2][2][1]);}) && (shen_empty$question$_js(V2807[2][2][2])))))))) ? (shen_get_fn_js(shen_legitimate_term$question$)(V2807[2][1])) : ((shen_is_type_js(V2807, shen_type_cons)) ? false : true))));
}
shen_legitimate_term$question$;

function shen_eval_cons(V2808) {
  if (V2808 == undefined) return shen_eval_cons;
  return (((shen_is_type_js(V2808, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "cons"], V2808[1]);}) && (shen_is_type_js(V2808[2], shen_type_cons) && (shen_is_type_js(V2808[2][2], shen_type_cons) && (shen_empty$question$_js(V2808[2][2][2]))))))) ? [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_eval_cons), V2808[2][1]), shen_tail_call(shen_get_fn_js(shen_eval_cons), V2808[2][2][1])] : (((shen_is_type_js(V2808, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "mode"], V2808[1]);}) && (shen_is_type_js(V2808[2], shen_type_cons) && (shen_is_type_js(V2808[2][2], shen_type_cons) && (shen_empty$question$_js(V2808[2][2][2]))))))) ? [shen_type_cons, [shen_type_symbol, "mode"], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_eval_cons), V2808[2][1]), V2808[2][2]]] : V2808));
}
shen_eval_cons;

function shen_$lt$body$asterisk$$gt$(V2813) {
  if (V2813 == undefined) return shen_$lt$body$asterisk$$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$e$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$e$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$e$gt$)), shen_tail_call(shen_snd, Parse$_$lt$e$gt$)) : shen_fail_obj);});}), shen_tail_call(shen_$lt$e$gt$, V2813))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$literal$asterisk$$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$literal$asterisk$$gt$);}))) ? shen_tail_call((function(Parse$_$lt$body$asterisk$$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$body$asterisk$$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$body$asterisk$$gt$)), [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$literal$asterisk$$gt$), shen_tail_call(shen_snd, Parse$_$lt$body$asterisk$$gt$)]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$body$asterisk$$gt$), Parse$_$lt$literal$asterisk$$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$literal$asterisk$$gt$), V2813))
))
;
}
shen_$lt$body$asterisk$$gt$;

function shen_$lt$literal$asterisk$$gt$(V2818) {
  if (V2818 == undefined) return shen_$lt$literal$asterisk$$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V2818), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2818)[2]), shen_tail_call(shen_snd, V2818)))), ((shen_is_type_js(shen_tail_call(shen_fst, V2818)[1], shen_type_cons)) ? shen_tail_call(shen_fst, V2818)[1] : shen_fail_obj)) : shen_fail_obj)))
 : Result);});})((((shen_is_type_js(shen_tail_call(shen_fst, V2818), shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$excl$"], shen_tail_call(shen_fst, V2818)[1]);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2818)[2]), shen_tail_call(shen_snd, V2818)))), [shen_type_cons, [shen_type_symbol, "cut"], [shen_type_cons, [shen_type_symbol, "Throwcontrol"], []]]) : shen_fail_obj)))
;
}
shen_$lt$literal$asterisk$$gt$;

function shen_$lt$end$asterisk$$gt$(V2823) {
  if (V2823 == undefined) return shen_$lt$end$asterisk$$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(((shen_is_type_js(shen_tail_call(shen_fst, V2823), shen_type_cons)) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V2823)[2]), shen_tail_call(shen_snd, V2823)))), ((shen_tail_call(function() {return shen_equal$question$_js(shen_tail_call(shen_fst, V2823)[1], [shen_type_symbol, "$sc$"]);})) ? [shen_type_symbol, "shen_skip"] : shen_fail_obj)) : shen_fail_obj)))
;
}
shen_$lt$end$asterisk$$gt$;

function shen_cut(V2824) {
  if (V2824 == undefined) return shen_cut;
  return (function lambda1436(V2825) {return (V2825 == undefined) ? lambda1436 : new Shen_tco_obj(function() {return (function lambda1435(V2826) {return (V2826 == undefined) ? lambda1435 : new Shen_tco_obj(function() {return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, false);})) ? V2824 : Result);});})(shen_tail_call(V2826)))
;});});});});
}
shen_cut;

function shen_insert$_modes(V2827) {
  if (V2827 == undefined) return shen_insert$_modes;
  return (((shen_is_type_js(V2827, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "mode"], V2827[1]);}) && (shen_is_type_js(V2827[2], shen_type_cons) && (shen_is_type_js(V2827[2][2], shen_type_cons) && (shen_empty$question$_js(V2827[2][2][2]))))))) ? V2827 : (((shen_empty$question$_js(V2827))) ? [] : ((shen_is_type_js(V2827, shen_type_cons)) ? [shen_type_cons, [shen_type_cons, [shen_type_symbol, "mode"], [shen_type_cons, V2827[1], [shen_type_cons, [shen_type_symbol, "$plus$"], []]]], [shen_type_cons, [shen_type_symbol, "mode"], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_insert$_modes), V2827[2]), [shen_type_cons, [shen_type_symbol, "_"], []]]]] : V2827)));
}
shen_insert$_modes;

function shen_s_prolog(V2828) {
  if (V2828 == undefined) return shen_s_prolog;
  return (shen_tail_call(shen_map, shen_eval)(shen_tail_call(shen_get_fn_js(shen_prolog_$gt$shen), V2828)));
}
shen_s_prolog;

function shen_prolog_$gt$shen(V2829) {
  if (V2829 == undefined) return shen_prolog_$gt$shen;
  return (shen_tail_call(shen_map, shen_compile$_prolog$_procedure)(shen_tail_call(shen_get_fn_js(shen_group$_clauses), shen_tail_call(shen_tail_call(shen_map, shen_s_prolog$_clause), shen_tail_call(shen_tail_call(shen_mapcan, shen_head$_abstraction), V2829)))));
}
shen_prolog_$gt$shen;

function shen_s_prolog$_clause(V2830) {
  if (V2830 == undefined) return shen_s_prolog$_clause;
  return (((shen_is_type_js(V2830, shen_type_cons) && (shen_is_type_js(V2830[2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$colon$_"], V2830[2][1]);}) && (shen_is_type_js(V2830[2][2], shen_type_cons) && (shen_empty$question$_js(V2830[2][2][2]))))))) ? [shen_type_cons, V2830[1], [shen_type_cons, [shen_type_symbol, "$colon$_"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_map, shen_s_prolog$_literal), V2830[2][2][1]), []]]] : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_s_prolog$_clause"])));
}
shen_s_prolog$_clause;

function shen_head$_abstraction(V2831) {
  if (V2831 == undefined) return shen_head$_abstraction;
  return (((shen_is_type_js(V2831, shen_type_cons) && (shen_is_type_js(V2831[2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$colon$_"], V2831[2][1]);}) && (shen_is_type_js(V2831[2][2], shen_type_cons) && ((shen_empty$question$_js(V2831[2][2][2])) && (shen_tail_call(shen_get_fn_js(shen_complexity$_head), V2831[1]) < shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$maxcomplexity$asterisk$"])))))))) ? [shen_type_cons, V2831, []] : (((shen_is_type_js(V2831, shen_type_cons) && (shen_is_type_js(V2831[1], shen_type_cons) && (shen_is_type_js(V2831[2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$colon$_"], V2831[2][1]);}) && (shen_is_type_js(V2831[2][2], shen_type_cons) && (shen_empty$question$_js(V2831[2][2][2])))))))) ? ((function(Terms) {return new Shen_tco_obj(function() {return ((function(XTerms) {return new Shen_tco_obj(function() {return ((function(Literal) {return new Shen_tco_obj(function() {return ((function(Clause) {return new Shen_tco_obj(function() {return [shen_type_cons, Clause, []];});})([shen_type_cons, [shen_type_cons, V2831[1][1], Terms], [shen_type_cons, [shen_type_symbol, "$colon$_"], [shen_type_cons, [shen_type_cons, Literal, V2831[2][2][1]], []]]]))
;});})([shen_type_cons, [shen_type_symbol, "unify"], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_cons$_form), Terms), [shen_type_cons, XTerms, []]]]))
;});})(shen_tail_call(shen_get_fn_js(shen_rcons$_form), shen_tail_call(shen_get_fn_js(shen_remove$_modes), V2831[1][2]))))
;});})(shen_tail_call(shen_tail_call(shen_map, (function lambda1437(Y) {return (Y == undefined) ? lambda1437 : new Shen_tco_obj(function() {return (shen_gensym([shen_type_symbol, "V"]));});})), V2831[1][2])))
 : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_head$_abstraction"]))));
}
shen_head$_abstraction;

function shen_complexity$_head(V2836) {
  if (V2836 == undefined) return shen_complexity$_head;
  return ((shen_is_type_js(V2836, shen_type_cons)) ? (shen_get_fn_js(shen_product)(shen_tail_call(shen_tail_call(shen_map, shen_complexity), V2836[2]))) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_complexity$_head"])));
}
shen_complexity$_head;

function shen_complexity(V2844) {
  if (V2844 == undefined) return shen_complexity;
  return (((shen_is_type_js(V2844, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "mode"], V2844[1]);}) && (shen_is_type_js(V2844[2], shen_type_cons) && (shen_is_type_js(V2844[2][1], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "mode"], V2844[2][1][1]);}) && (shen_is_type_js(V2844[2][1][2], shen_type_cons) && (shen_is_type_js(V2844[2][1][2][2], shen_type_cons) && ((shen_empty$question$_js(V2844[2][1][2][2][2])) && (shen_is_type_js(V2844[2][2], shen_type_cons) && (shen_empty$question$_js(V2844[2][2][2])))))))))))) ? (shen_get_fn_js(shen_complexity)(V2844[2][1])) : (((shen_is_type_js(V2844, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "mode"], V2844[1]);}) && (shen_is_type_js(V2844[2], shen_type_cons) && (shen_is_type_js(V2844[2][1], shen_type_cons) && (shen_is_type_js(V2844[2][2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$plus$"], V2844[2][2][1]);}) && (shen_empty$question$_js(V2844[2][2][2]))))))))) ? (2 * (shen_tail_call(shen_get_fn_js(shen_complexity), [shen_type_cons, [shen_type_symbol, "mode"], [shen_type_cons, V2844[2][1][1], V2844[2][2]]]) * shen_tail_call(shen_get_fn_js(shen_complexity), [shen_type_cons, [shen_type_symbol, "mode"], [shen_type_cons, V2844[2][1][2], V2844[2][2]]]))) : (((shen_is_type_js(V2844, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "mode"], V2844[1]);}) && (shen_is_type_js(V2844[2], shen_type_cons) && (shen_is_type_js(V2844[2][1], shen_type_cons) && (shen_is_type_js(V2844[2][2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "_"], V2844[2][2][1]);}) && (shen_empty$question$_js(V2844[2][2][2]))))))))) ? (shen_tail_call(shen_get_fn_js(shen_complexity), [shen_type_cons, [shen_type_symbol, "mode"], [shen_type_cons, V2844[2][1][1], V2844[2][2]]]) * shen_tail_call(shen_get_fn_js(shen_complexity), [shen_type_cons, [shen_type_symbol, "mode"], [shen_type_cons, V2844[2][1][2], V2844[2][2]]])) : (((shen_is_type_js(V2844, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "mode"], V2844[1]);}) && (shen_is_type_js(V2844[2], shen_type_cons) && (shen_is_type_js(V2844[2][2], shen_type_cons) && ((shen_empty$question$_js(V2844[2][2][2])) && shen_tail_call(shen_variable$question$, V2844[2][1]))))))) ? 1 : (((shen_is_type_js(V2844, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "mode"], V2844[1]);}) && (shen_is_type_js(V2844[2], shen_type_cons) && (shen_is_type_js(V2844[2][2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$plus$"], V2844[2][2][1]);}) && (shen_empty$question$_js(V2844[2][2][2])))))))) ? 2 : (((shen_is_type_js(V2844, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "mode"], V2844[1]);}) && (shen_is_type_js(V2844[2], shen_type_cons) && (shen_is_type_js(V2844[2][2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "_"], V2844[2][2][1]);}) && (shen_empty$question$_js(V2844[2][2][2])))))))) ? 1 : (shen_get_fn_js(shen_complexity)([shen_type_cons, [shen_type_symbol, "mode"], [shen_type_cons, V2844, [shen_type_cons, [shen_type_symbol, "$plus$"], []]]]))))))));
}
shen_complexity;

function shen_product(V2845) {
  if (V2845 == undefined) return shen_product;
  return (((shen_empty$question$_js(V2845))) ? 1 : ((shen_is_type_js(V2845, shen_type_cons)) ? (V2845[1] * shen_tail_call(shen_get_fn_js(shen_product), V2845[2])) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_product"]))));
}
shen_product;

function shen_s_prolog$_literal(V2846) {
  if (V2846 == undefined) return shen_s_prolog$_literal;
  return (((shen_is_type_js(V2846, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "is"], V2846[1]);}) && (shen_is_type_js(V2846[2], shen_type_cons) && (shen_is_type_js(V2846[2][2], shen_type_cons) && (shen_empty$question$_js(V2846[2][2][2]))))))) ? [shen_type_cons, [shen_type_symbol, "bind"], [shen_type_cons, V2846[2][1], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_insert$_deref), V2846[2][2][1]), []]]] : (((shen_is_type_js(V2846, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "when"], V2846[1]);}) && (shen_is_type_js(V2846[2], shen_type_cons) && (shen_empty$question$_js(V2846[2][2])))))) ? [shen_type_cons, [shen_type_symbol, "fwhen"], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_insert$_deref), V2846[2][1]), []]] : (((shen_is_type_js(V2846, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "bind"], V2846[1]);}) && (shen_is_type_js(V2846[2], shen_type_cons) && (shen_is_type_js(V2846[2][2], shen_type_cons) && (shen_empty$question$_js(V2846[2][2][2]))))))) ? [shen_type_cons, [shen_type_symbol, "bind"], [shen_type_cons, V2846[2][1], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_insert$_lazyderef), V2846[2][2][1]), []]]] : (((shen_is_type_js(V2846, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "fwhen"], V2846[1]);}) && (shen_is_type_js(V2846[2], shen_type_cons) && (shen_empty$question$_js(V2846[2][2])))))) ? [shen_type_cons, [shen_type_symbol, "fwhen"], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_insert$_lazyderef), V2846[2][1]), []]] : ((shen_is_type_js(V2846, shen_type_cons)) ? [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_m$_prolog$_to$_s_prolog$_predicate), V2846[1]), V2846[2]] : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_s_prolog$_literal"])))))));
}
shen_s_prolog$_literal;

function shen_insert$_deref(V2847) {
  if (V2847 == undefined) return shen_insert$_deref;
  return ((shen_tail_call(shen_variable$question$, V2847)) ? [shen_type_cons, [shen_type_symbol, "shen_deref"], [shen_type_cons, V2847, [shen_type_cons, [shen_type_symbol, "ProcessN"], []]]] : ((shen_is_type_js(V2847, shen_type_cons)) ? [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_insert$_deref), V2847[1]), shen_tail_call(shen_get_fn_js(shen_insert$_deref), V2847[2])] : V2847));
}
shen_insert$_deref;

function shen_insert$_lazyderef(V2848) {
  if (V2848 == undefined) return shen_insert$_lazyderef;
  return ((shen_tail_call(shen_variable$question$, V2848)) ? [shen_type_cons, [shen_type_symbol, "shen_lazyderef"], [shen_type_cons, V2848, [shen_type_cons, [shen_type_symbol, "ProcessN"], []]]] : ((shen_is_type_js(V2848, shen_type_cons)) ? [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_insert$_lazyderef), V2848[1]), shen_tail_call(shen_get_fn_js(shen_insert$_lazyderef), V2848[2])] : V2848));
}
shen_insert$_lazyderef;

function shen_m$_prolog$_to$_s_prolog$_predicate(V2849) {
  if (V2849 == undefined) return shen_m$_prolog$_to$_s_prolog$_predicate;
  return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$eq$"], V2849);})) ? [shen_type_symbol, "unify"] : ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$eq$$excl$"], V2849);})) ? [shen_type_symbol, "unify$excl$"] : ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$eq$$eq$"], V2849);})) ? [shen_type_symbol, "identical"] : V2849)));
}
shen_m$_prolog$_to$_s_prolog$_predicate;

function shen_group$_clauses(V2850) {
  if (V2850 == undefined) return shen_group$_clauses;
  return (((shen_empty$question$_js(V2850))) ? [] : ((shen_is_type_js(V2850, shen_type_cons)) ? ((function(Group) {return new Shen_tco_obj(function() {return ((function(Rest) {return new Shen_tco_obj(function() {return [shen_type_cons, Group, shen_tail_call(shen_get_fn_js(shen_group$_clauses), Rest)];});})(shen_tail_call(shen_tail_call(shen_difference, V2850), Group)))
;});})(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_collect), (function lambda1438(X) {return (X == undefined) ? lambda1438 : new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_same$_predicate$question$), V2850[1])(X));});})), V2850)))
 : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_group$_clauses"]))));
}
shen_group$_clauses;

function shen_collect(V2853) {
  if (V2853 == undefined) return shen_collect;
  return (function lambda1439(V2854) {return (V2854 == undefined) ? lambda1439 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V2854))) ? [] : ((shen_is_type_js(V2854, shen_type_cons)) ? ((shen_tail_call(shen_get_fn_js(V2853), V2854[1])) ? [shen_type_cons, V2854[1], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_collect), V2853), V2854[2])] : (shen_tail_call(shen_get_fn_js(shen_collect), V2853)(V2854[2]))) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_collect"]))));});});
}
shen_collect;

function shen_same$_predicate$question$(V2871) {
  if (V2871 == undefined) return shen_same$_predicate$question$;
  return (function lambda1440(V2872) {return (V2872 == undefined) ? lambda1440 : new Shen_tco_obj(function() {return (((shen_is_type_js(V2871, shen_type_cons) && (shen_is_type_js(V2871[1], shen_type_cons) && (shen_is_type_js(V2872, shen_type_cons) && shen_is_type_js(V2872[1], shen_type_cons))))) ? shen_equal$question$_js(V2871[1][1], V2872[1][1]) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_same$_predicate$question$"])));});});
}
shen_same$_predicate$question$;

function shen_compile$_prolog$_procedure(V2873) {
  if (V2873 == undefined) return shen_compile$_prolog$_procedure;
  return ((function(F) {return new Shen_tco_obj(function() {return ((function(Shen) {return new Shen_tco_obj(function() {return Shen;});})(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_clauses_to_shen), F), V2873)))
;});})(shen_tail_call(shen_get_fn_js(shen_procedure$_name), V2873)))
;
}
shen_compile$_prolog$_procedure;

function shen_procedure$_name(V2886) {
  if (V2886 == undefined) return shen_procedure$_name;
  return (((shen_is_type_js(V2886, shen_type_cons) && (shen_is_type_js(V2886[1], shen_type_cons) && shen_is_type_js(V2886[1][1], shen_type_cons)))) ? V2886[1][1][1] : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_procedure$_name"])));
}
shen_procedure$_name;

function shen_clauses_to_shen(V2887) {
  if (V2887 == undefined) return shen_clauses_to_shen;
  return (function lambda1442(V2888) {return (V2888 == undefined) ? lambda1442 : new Shen_tco_obj(function() {return ((function(Linear) {return new Shen_tco_obj(function() {return ((function(Arity) {return new Shen_tco_obj(function() {return ((function(Parameters) {return new Shen_tco_obj(function() {return ((function(AUM$_instructions) {return new Shen_tco_obj(function() {return ((function(Code) {return new Shen_tco_obj(function() {return ((function(ShenDef) {return new Shen_tco_obj(function() {return ShenDef;});})([shen_type_cons, [shen_type_symbol, "define"], [shen_type_cons, V2887, shen_tail_call(shen_tail_call(shen_append, Parameters), shen_tail_call(shen_tail_call(shen_append, [shen_type_cons, [shen_type_symbol, "ProcessN"], [shen_type_cons, [shen_type_symbol, "Continuation"], []]]), [shen_type_cons, [shen_type_symbol, "_$gt$"], [shen_type_cons, Code, []]]))]]))
;});})(shen_tail_call(shen_get_fn_js(shen_catch_cut), shen_tail_call(shen_get_fn_js(shen_nest_disjunct), shen_tail_call(shen_tail_call(shen_map, shen_aum$_to$_shen), AUM$_instructions)))))
;});})(shen_tail_call(shen_tail_call(shen_map, (function lambda1441(X) {return (X == undefined) ? lambda1441 : new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_aum), X)(Parameters));});})), Linear)))
;});})(shen_tail_call(shen_get_fn_js(shen_parameters), Arity)))
;});})(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_prolog_aritycheck), V2887), shen_tail_call(shen_tail_call(shen_map, shen_head), V2888))))
;});})(shen_tail_call(shen_tail_call(shen_map, shen_linearise_clause), V2888)))
;});});
}
shen_clauses_to_shen;

function shen_catch_cut(V2889) {
  if (V2889 == undefined) return shen_catch_cut;
  return (((!shen_tail_call(shen_tail_call(shen_get_fn_js(shen_occurs$question$), [shen_type_symbol, "cut"]), V2889))) ? V2889 : [shen_type_cons, [shen_type_symbol, "let"], [shen_type_cons, [shen_type_symbol, "Throwcontrol"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_catchpoint"], []], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_cutpoint"], [shen_type_cons, [shen_type_symbol, "Throwcontrol"], [shen_type_cons, V2889, []]]], []]]]]);
}
shen_catch_cut;

function shen_catchpoint() {return (shen_globals[[shen_type_symbol, "shen_$asterisk$catch$asterisk$"][1]] = (1 + shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$catch$asterisk$"])));}
shen_catchpoint;

function shen_cutpoint(V2894) {
  if (V2894 == undefined) return shen_cutpoint;
  return (function lambda1443(V2895) {return (V2895 == undefined) ? lambda1443 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(V2895, V2894);})) ? false : V2895);});});
}
shen_cutpoint;

function shen_nest_disjunct(V2897) {
  if (V2897 == undefined) return shen_nest_disjunct;
  return (((shen_is_type_js(V2897, shen_type_cons) && (shen_empty$question$_js(V2897[2])))) ? V2897[1] : ((shen_is_type_js(V2897, shen_type_cons)) ? (shen_tail_call(shen_get_fn_js(shen_lisp_or), V2897[1])(shen_tail_call(shen_get_fn_js(shen_nest_disjunct), V2897[2]))) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_nest_disjunct"]))));
}
shen_nest_disjunct;

function shen_lisp_or(V2898) {
  if (V2898 == undefined) return shen_lisp_or;
  return (function lambda1444(V2899) {return (V2899 == undefined) ? lambda1444 : new Shen_tco_obj(function() {return [shen_type_cons, [shen_type_symbol, "let"], [shen_type_cons, [shen_type_symbol, "Case"], [shen_type_cons, V2898, [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_if"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "$eq$"], [shen_type_cons, [shen_type_symbol, "Case"], [shen_type_cons, false, []]]], [shen_type_cons, V2899, [shen_type_cons, [shen_type_symbol, "Case"], []]]]], []]]]];});});
}
shen_lisp_or;

function shen_prolog_aritycheck(V2902) {
  if (V2902 == undefined) return shen_prolog_aritycheck;
  return (function lambda1445(V2903) {return (V2903 == undefined) ? lambda1445 : new Shen_tco_obj(function() {return (((shen_is_type_js(V2903, shen_type_cons) && (shen_empty$question$_js(V2903[2])))) ? (shen_tail_call(shen_length, V2903[1]) - 1) : (((shen_is_type_js(V2903, shen_type_cons) && shen_is_type_js(V2903[2], shen_type_cons))) ? ((shen_tail_call(function() {return shen_equal$question$_js(shen_tail_call(shen_length, V2903[1]), shen_tail_call(shen_length, V2903[2][1]));})) ? (shen_tail_call(shen_get_fn_js(shen_prolog_aritycheck), V2902)(V2903[2])) : (shen_tail_call(shen_interror, "arity error in prolog procedure ~A~%")([shen_tuple, [shen_type_cons, V2902, []], []]))) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_prolog_aritycheck"]))));});});
}
shen_prolog_aritycheck;

function shen_linearise_clause(V2904) {
  if (V2904 == undefined) return shen_linearise_clause;
  return (((shen_is_type_js(V2904, shen_type_cons) && (shen_is_type_js(V2904[2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$colon$_"], V2904[2][1]);}) && (shen_is_type_js(V2904[2][2], shen_type_cons) && (shen_empty$question$_js(V2904[2][2][2]))))))) ? ((function(Linear) {return new Shen_tco_obj(function() {return (shen_get_fn_js(shen_clause$_form)(Linear));});})(shen_tail_call(shen_get_fn_js(shen_linearise), [shen_type_cons, V2904[1], V2904[2][2]])))
 : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_linearise_clause"])));
}
shen_linearise_clause;

function shen_clause$_form(V2905) {
  if (V2905 == undefined) return shen_clause$_form;
  return (((shen_is_type_js(V2905, shen_type_cons) && (shen_is_type_js(V2905[2], shen_type_cons) && (shen_empty$question$_js(V2905[2][2]))))) ? [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_explicit$_modes), V2905[1]), [shen_type_cons, [shen_type_symbol, "$colon$_"], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_cf$_help), V2905[2][1]), []]]] : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_clause$_form"])));
}
shen_clause$_form;

function shen_explicit$_modes(V2906) {
  if (V2906 == undefined) return shen_explicit$_modes;
  return ((shen_is_type_js(V2906, shen_type_cons)) ? [shen_type_cons, V2906[1], shen_tail_call(shen_tail_call(shen_map, shen_em$_help), V2906[2])] : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_explicit$_modes"])));
}
shen_explicit$_modes;

function shen_em$_help(V2907) {
  if (V2907 == undefined) return shen_em$_help;
  return (((shen_is_type_js(V2907, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "mode"], V2907[1]);}) && (shen_is_type_js(V2907[2], shen_type_cons) && (shen_is_type_js(V2907[2][2], shen_type_cons) && (shen_empty$question$_js(V2907[2][2][2]))))))) ? V2907 : [shen_type_cons, [shen_type_symbol, "mode"], [shen_type_cons, V2907, [shen_type_cons, [shen_type_symbol, "$plus$"], []]]]);
}
shen_em$_help;

function shen_cf$_help(V2908) {
  if (V2908 == undefined) return shen_cf$_help;
  return (((shen_is_type_js(V2908, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "where"], V2908[1]);}) && (shen_is_type_js(V2908[2], shen_type_cons) && (shen_is_type_js(V2908[2][1], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$eq$"], V2908[2][1][1]);}) && (shen_is_type_js(V2908[2][1][2], shen_type_cons) && (shen_is_type_js(V2908[2][1][2][2], shen_type_cons) && ((shen_empty$question$_js(V2908[2][1][2][2][2])) && (shen_is_type_js(V2908[2][2], shen_type_cons) && (shen_empty$question$_js(V2908[2][2][2])))))))))))) ? [shen_type_cons, [shen_type_cons, ((shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$occurs$asterisk$"])) ? [shen_type_symbol, "unify$excl$"] : [shen_type_symbol, "unify"]), V2908[2][1][2]], shen_tail_call(shen_get_fn_js(shen_cf$_help), V2908[2][2][1])] : V2908);
}
shen_cf$_help;

function shen_occurs_check(V2913) {
  if (V2913 == undefined) return shen_occurs_check;
  return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$plus$"], V2913);})) ? (shen_globals[[shen_type_symbol, "shen_$asterisk$occurs$asterisk$"][1]] = true) : ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "_"], V2913);})) ? (shen_globals[[shen_type_symbol, "shen_$asterisk$occurs$asterisk$"][1]] = false) : (shen_tail_call(shen_interror, "occurs-check expects + or -~%")([]))));
}
shen_occurs_check;

function shen_aum(V2914) {
  if (V2914 == undefined) return shen_aum;
  return (function lambda1446(V2915) {return (V2915 == undefined) ? lambda1446 : new Shen_tco_obj(function() {return (((shen_is_type_js(V2914, shen_type_cons) && (shen_is_type_js(V2914[1], shen_type_cons) && (shen_is_type_js(V2914[2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$colon$_"], V2914[2][1]);}) && (shen_is_type_js(V2914[2][2], shen_type_cons) && (shen_empty$question$_js(V2914[2][2][2])))))))) ? ((function(MuApplication) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_mu$_reduction), MuApplication)([shen_type_symbol, "$plus$"]));});})(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_make$_mu$_application), [shen_type_cons, [shen_type_symbol, "shen_mu"], [shen_type_cons, V2914[1][2], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_continuation$_call), V2914[1][2]), V2914[2][2][1]), []]]]), V2915)))
 : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_aum"])));});});
}
shen_aum;

function shen_continuation$_call(V2916) {
  if (V2916 == undefined) return shen_continuation$_call;
  return (function lambda1447(V2917) {return (V2917 == undefined) ? lambda1447 : new Shen_tco_obj(function() {return ((function(VTerms) {return new Shen_tco_obj(function() {return ((function(VBody) {return new Shen_tco_obj(function() {return ((function(Free) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_cc$_help), Free)(V2917));});})(shen_tail_call(shen_tail_call(shen_remove, [shen_type_symbol, "Throwcontrol"]), shen_tail_call(shen_tail_call(shen_difference, VBody), VTerms))))
;});})(shen_tail_call(shen_get_fn_js(shen_extract$_vars), V2917)))
;});})([shen_type_cons, [shen_type_symbol, "ProcessN"], shen_tail_call(shen_get_fn_js(shen_extract$_vars), V2916)]))
;});});
}
shen_continuation$_call;

function shen_remove(V2920) {
  if (V2920 == undefined) return shen_remove;
  return (function lambda1448(V2921) {return (V2921 == undefined) ? lambda1448 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V2921))) ? [] : (((shen_is_type_js(V2921, shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js(V2921[1], V2920);}))) ? (shen_tail_call(shen_remove, V2921[1])(V2921[2])) : ((shen_is_type_js(V2921, shen_type_cons)) ? [shen_type_cons, V2921[1], shen_tail_call(shen_tail_call(shen_remove, V2920), V2921[2])] : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "remove"])))));});});
}
shen_remove;

function shen_cc$_help(V2923) {
  if (V2923 == undefined) return shen_cc$_help;
  return (function lambda1449(V2924) {return (V2924 == undefined) ? lambda1449 : new Shen_tco_obj(function() {return ((((shen_empty$question$_js(V2923)) && (shen_empty$question$_js(V2924)))) ? [shen_type_cons, [shen_type_symbol, "shen_pop"], [shen_type_cons, [shen_type_symbol, "shen_the"], [shen_type_cons, [shen_type_symbol, "shen_stack"], []]]] : (((shen_empty$question$_js(V2924))) ? [shen_type_cons, [shen_type_symbol, "shen_rename"], [shen_type_cons, [shen_type_symbol, "shen_the"], [shen_type_cons, [shen_type_symbol, "shen_variables"], [shen_type_cons, [shen_type_symbol, "shen_in"], [shen_type_cons, V2923, [shen_type_cons, [shen_type_symbol, "and"], [shen_type_cons, [shen_type_symbol, "shen_then"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_pop"], [shen_type_cons, [shen_type_symbol, "shen_the"], [shen_type_cons, [shen_type_symbol, "shen_stack"], []]]], []]]]]]]]] : (((shen_empty$question$_js(V2923))) ? [shen_type_cons, [shen_type_symbol, "call"], [shen_type_cons, [shen_type_symbol, "shen_the"], [shen_type_cons, [shen_type_symbol, "shen_continuation"], [shen_type_cons, V2924, []]]]] : [shen_type_cons, [shen_type_symbol, "shen_rename"], [shen_type_cons, [shen_type_symbol, "shen_the"], [shen_type_cons, [shen_type_symbol, "shen_variables"], [shen_type_cons, [shen_type_symbol, "shen_in"], [shen_type_cons, V2923, [shen_type_cons, [shen_type_symbol, "and"], [shen_type_cons, [shen_type_symbol, "shen_then"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "call"], [shen_type_cons, [shen_type_symbol, "shen_the"], [shen_type_cons, [shen_type_symbol, "shen_continuation"], [shen_type_cons, V2924, []]]]], []]]]]]]]])));});});
}
shen_cc$_help;

function shen_make$_mu$_application(V2925) {
  if (V2925 == undefined) return shen_make$_mu$_application;
  return (function lambda1450(V2926) {return (V2926 == undefined) ? lambda1450 : new Shen_tco_obj(function() {return (((shen_is_type_js(V2925, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_mu"], V2925[1]);}) && (shen_is_type_js(V2925[2], shen_type_cons) && ((shen_empty$question$_js(V2925[2][1])) && (shen_is_type_js(V2925[2][2], shen_type_cons) && ((shen_empty$question$_js(V2925[2][2][2])) && (shen_empty$question$_js(V2926))))))))) ? V2925[2][2][1] : (((shen_is_type_js(V2925, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_mu"], V2925[1]);}) && (shen_is_type_js(V2925[2], shen_type_cons) && (shen_is_type_js(V2925[2][1], shen_type_cons) && (shen_is_type_js(V2925[2][2], shen_type_cons) && ((shen_empty$question$_js(V2925[2][2][2])) && shen_is_type_js(V2926, shen_type_cons)))))))) ? [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_mu"], [shen_type_cons, V2925[2][1][1], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_make$_mu$_application), [shen_type_cons, [shen_type_symbol, "shen_mu"], [shen_type_cons, V2925[2][1][2], V2925[2][2]]]), V2926[2]), []]]], [shen_type_cons, V2926[1], []]] : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_make$_mu$_application"]))));});});
}
shen_make$_mu$_application;

function shen_mu$_reduction(V2933) {
  if (V2933 == undefined) return shen_mu$_reduction;
  return (function lambda1451(V2934) {return (V2934 == undefined) ? lambda1451 : new Shen_tco_obj(function() {return (((shen_is_type_js(V2933, shen_type_cons) && (shen_is_type_js(V2933[1], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_mu"], V2933[1][1]);}) && (shen_is_type_js(V2933[1][2], shen_type_cons) && (shen_is_type_js(V2933[1][2][1], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "mode"], V2933[1][2][1][1]);}) && (shen_is_type_js(V2933[1][2][1][2], shen_type_cons) && (shen_is_type_js(V2933[1][2][1][2][2], shen_type_cons) && ((shen_empty$question$_js(V2933[1][2][1][2][2][2])) && (shen_is_type_js(V2933[1][2][2], shen_type_cons) && ((shen_empty$question$_js(V2933[1][2][2][2])) && (shen_is_type_js(V2933[2], shen_type_cons) && (shen_empty$question$_js(V2933[2][2]))))))))))))))) ? (shen_tail_call(shen_get_fn_js(shen_mu$_reduction), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_mu"], [shen_type_cons, V2933[1][2][1][2][1], V2933[1][2][2]]], V2933[2]])(V2933[1][2][1][2][2][1])) : (((shen_is_type_js(V2933, shen_type_cons) && (shen_is_type_js(V2933[1], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_mu"], V2933[1][1]);}) && (shen_is_type_js(V2933[1][2], shen_type_cons) && (shen_is_type_js(V2933[1][2][2], shen_type_cons) && ((shen_empty$question$_js(V2933[1][2][2][2])) && (shen_is_type_js(V2933[2], shen_type_cons) && ((shen_empty$question$_js(V2933[2][2])) && shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$_"], V2933[1][2][1]);})))))))))) ? (shen_tail_call(shen_get_fn_js(shen_mu$_reduction), V2933[1][2][2][1])(V2934)) : (((shen_is_type_js(V2933, shen_type_cons) && (shen_is_type_js(V2933[1], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_mu"], V2933[1][1]);}) && (shen_is_type_js(V2933[1][2], shen_type_cons) && (shen_is_type_js(V2933[1][2][2], shen_type_cons) && ((shen_empty$question$_js(V2933[1][2][2][2])) && (shen_is_type_js(V2933[2], shen_type_cons) && ((shen_empty$question$_js(V2933[2][2])) && shen_tail_call(shen_tail_call(shen_get_fn_js(shen_ephemeral$_variable$question$), V2933[1][2][1]), V2933[2][1])))))))))) ? (shen_tail_call(shen_tail_call(shen_subst, V2933[2][1]), V2933[1][2][1])(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_mu$_reduction), V2933[1][2][2][1]), V2934))) : (((shen_is_type_js(V2933, shen_type_cons) && (shen_is_type_js(V2933[1], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_mu"], V2933[1][1]);}) && (shen_is_type_js(V2933[1][2], shen_type_cons) && (shen_is_type_js(V2933[1][2][2], shen_type_cons) && ((shen_empty$question$_js(V2933[1][2][2][2])) && (shen_is_type_js(V2933[2], shen_type_cons) && ((shen_empty$question$_js(V2933[2][2])) && shen_tail_call(shen_variable$question$, V2933[1][2][1])))))))))) ? [shen_type_cons, [shen_type_symbol, "let"], [shen_type_cons, V2933[1][2][1], [shen_type_cons, [shen_type_symbol, "shen_be"], [shen_type_cons, V2933[2][1], [shen_type_cons, [shen_type_symbol, "shen_in"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_mu$_reduction), V2933[1][2][2][1]), V2934), []]]]]]] : (((shen_is_type_js(V2933, shen_type_cons) && (shen_is_type_js(V2933[1], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_mu"], V2933[1][1]);}) && (shen_is_type_js(V2933[1][2], shen_type_cons) && (shen_is_type_js(V2933[1][2][2], shen_type_cons) && ((shen_empty$question$_js(V2933[1][2][2][2])) && (shen_is_type_js(V2933[2], shen_type_cons) && ((shen_empty$question$_js(V2933[2][2])) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "_"], V2934);}) && shen_tail_call(shen_get_fn_js(shen_prolog$_constant$question$), V2933[1][2][1]))))))))))) ? ((function(Z) {return new Shen_tco_obj(function() {return [shen_type_cons, [shen_type_symbol, "let"], [shen_type_cons, Z, [shen_type_cons, [shen_type_symbol, "shen_be"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_the"], [shen_type_cons, [shen_type_symbol, "shen_result"], [shen_type_cons, [shen_type_symbol, "shen_of"], [shen_type_cons, [shen_type_symbol, "shen_dereferencing"], V2933[2]]]]], [shen_type_cons, [shen_type_symbol, "shen_in"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_if"], [shen_type_cons, [shen_type_cons, Z, [shen_type_cons, [shen_type_symbol, "is"], [shen_type_cons, [shen_type_symbol, "identical"], [shen_type_cons, [shen_type_symbol, "shen_to"], [shen_type_cons, V2933[1][2][1], []]]]]], [shen_type_cons, [shen_type_symbol, "shen_then"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_mu$_reduction), V2933[1][2][2][1]), [shen_type_symbol, "_"]), [shen_type_cons, [shen_type_symbol, "shen_else"], [shen_type_cons, [shen_type_symbol, "shen_mu_fail$excl$"], []]]]]]], []]]]]]];});})(shen_tail_call(shen_gensym, [shen_type_symbol, "V"])))
 : (((shen_is_type_js(V2933, shen_type_cons) && (shen_is_type_js(V2933[1], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_mu"], V2933[1][1]);}) && (shen_is_type_js(V2933[1][2], shen_type_cons) && (shen_is_type_js(V2933[1][2][2], shen_type_cons) && ((shen_empty$question$_js(V2933[1][2][2][2])) && (shen_is_type_js(V2933[2], shen_type_cons) && ((shen_empty$question$_js(V2933[2][2])) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$plus$"], V2934);}) && shen_tail_call(shen_get_fn_js(shen_prolog$_constant$question$), V2933[1][2][1]))))))))))) ? ((function(Z) {return new Shen_tco_obj(function() {return [shen_type_cons, [shen_type_symbol, "let"], [shen_type_cons, Z, [shen_type_cons, [shen_type_symbol, "shen_be"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_the"], [shen_type_cons, [shen_type_symbol, "shen_result"], [shen_type_cons, [shen_type_symbol, "shen_of"], [shen_type_cons, [shen_type_symbol, "shen_dereferencing"], V2933[2]]]]], [shen_type_cons, [shen_type_symbol, "shen_in"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_if"], [shen_type_cons, [shen_type_cons, Z, [shen_type_cons, [shen_type_symbol, "is"], [shen_type_cons, [shen_type_symbol, "identical"], [shen_type_cons, [shen_type_symbol, "shen_to"], [shen_type_cons, V2933[1][2][1], []]]]]], [shen_type_cons, [shen_type_symbol, "shen_then"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_mu$_reduction), V2933[1][2][2][1]), [shen_type_symbol, "$plus$"]), [shen_type_cons, [shen_type_symbol, "shen_else"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_if"], [shen_type_cons, [shen_type_cons, Z, [shen_type_cons, [shen_type_symbol, "is"], [shen_type_cons, [shen_type_symbol, "shen_a"], [shen_type_cons, [shen_type_symbol, "shen_variable"], []]]]], [shen_type_cons, [shen_type_symbol, "shen_then"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "bind"], [shen_type_cons, Z, [shen_type_cons, [shen_type_symbol, "shen_to"], [shen_type_cons, V2933[1][2][1], [shen_type_cons, [shen_type_symbol, "shen_in"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_mu$_reduction), V2933[1][2][2][1]), [shen_type_symbol, "$plus$"]), []]]]]]], [shen_type_cons, [shen_type_symbol, "shen_else"], [shen_type_cons, [shen_type_symbol, "shen_mu_fail$excl$"], []]]]]]], []]]]]]], []]]]]]];});})(shen_tail_call(shen_gensym, [shen_type_symbol, "V"])))
 : (((shen_is_type_js(V2933, shen_type_cons) && (shen_is_type_js(V2933[1], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_mu"], V2933[1][1]);}) && (shen_is_type_js(V2933[1][2], shen_type_cons) && (shen_is_type_js(V2933[1][2][1], shen_type_cons) && (shen_is_type_js(V2933[1][2][2], shen_type_cons) && ((shen_empty$question$_js(V2933[1][2][2][2])) && (shen_is_type_js(V2933[2], shen_type_cons) && ((shen_empty$question$_js(V2933[2][2])) && shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "_"], V2934);}))))))))))) ? ((function(Z) {return new Shen_tco_obj(function() {return [shen_type_cons, [shen_type_symbol, "let"], [shen_type_cons, Z, [shen_type_cons, [shen_type_symbol, "shen_be"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_the"], [shen_type_cons, [shen_type_symbol, "shen_result"], [shen_type_cons, [shen_type_symbol, "shen_of"], [shen_type_cons, [shen_type_symbol, "shen_dereferencing"], V2933[2]]]]], [shen_type_cons, [shen_type_symbol, "shen_in"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_if"], [shen_type_cons, [shen_type_cons, Z, [shen_type_cons, [shen_type_symbol, "is"], [shen_type_cons, [shen_type_symbol, "shen_a"], [shen_type_cons, [shen_type_symbol, "shen_non_empty"], [shen_type_cons, [shen_type_symbol, "list"], []]]]]], [shen_type_cons, [shen_type_symbol, "shen_then"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_mu$_reduction), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_mu"], [shen_type_cons, V2933[1][2][1][1], [shen_type_cons, [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_mu"], [shen_type_cons, V2933[1][2][1][2], V2933[1][2][2]]], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_the"], [shen_type_cons, [shen_type_symbol, "tail"], [shen_type_cons, [shen_type_symbol, "shen_of"], [shen_type_cons, Z, []]]]], []]], []]]], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_the"], [shen_type_cons, [shen_type_symbol, "head"], [shen_type_cons, [shen_type_symbol, "shen_of"], [shen_type_cons, Z, []]]]], []]]), [shen_type_symbol, "_"]), [shen_type_cons, [shen_type_symbol, "shen_else"], [shen_type_cons, [shen_type_symbol, "shen_mu_fail$excl$"], []]]]]]], []]]]]]];});})(shen_tail_call(shen_gensym, [shen_type_symbol, "V"])))
 : (((shen_is_type_js(V2933, shen_type_cons) && (shen_is_type_js(V2933[1], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_mu"], V2933[1][1]);}) && (shen_is_type_js(V2933[1][2], shen_type_cons) && (shen_is_type_js(V2933[1][2][1], shen_type_cons) && (shen_is_type_js(V2933[1][2][2], shen_type_cons) && ((shen_empty$question$_js(V2933[1][2][2][2])) && (shen_is_type_js(V2933[2], shen_type_cons) && ((shen_empty$question$_js(V2933[2][2])) && shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$plus$"], V2934);}))))))))))) ? ((function(Z) {return new Shen_tco_obj(function() {return [shen_type_cons, [shen_type_symbol, "let"], [shen_type_cons, Z, [shen_type_cons, [shen_type_symbol, "shen_be"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_the"], [shen_type_cons, [shen_type_symbol, "shen_result"], [shen_type_cons, [shen_type_symbol, "shen_of"], [shen_type_cons, [shen_type_symbol, "shen_dereferencing"], V2933[2]]]]], [shen_type_cons, [shen_type_symbol, "shen_in"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_if"], [shen_type_cons, [shen_type_cons, Z, [shen_type_cons, [shen_type_symbol, "is"], [shen_type_cons, [shen_type_symbol, "shen_a"], [shen_type_cons, [shen_type_symbol, "shen_non_empty"], [shen_type_cons, [shen_type_symbol, "list"], []]]]]], [shen_type_cons, [shen_type_symbol, "shen_then"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_mu$_reduction), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_mu"], [shen_type_cons, V2933[1][2][1][1], [shen_type_cons, [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_mu"], [shen_type_cons, V2933[1][2][1][2], V2933[1][2][2]]], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_the"], [shen_type_cons, [shen_type_symbol, "tail"], [shen_type_cons, [shen_type_symbol, "shen_of"], [shen_type_cons, Z, []]]]], []]], []]]], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_the"], [shen_type_cons, [shen_type_symbol, "head"], [shen_type_cons, [shen_type_symbol, "shen_of"], [shen_type_cons, Z, []]]]], []]]), [shen_type_symbol, "$plus$"]), [shen_type_cons, [shen_type_symbol, "shen_else"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_if"], [shen_type_cons, [shen_type_cons, Z, [shen_type_cons, [shen_type_symbol, "is"], [shen_type_cons, [shen_type_symbol, "shen_a"], [shen_type_cons, [shen_type_symbol, "shen_variable"], []]]]], [shen_type_cons, [shen_type_symbol, "shen_then"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_rename"], [shen_type_cons, [shen_type_symbol, "shen_the"], [shen_type_cons, [shen_type_symbol, "shen_variables"], [shen_type_cons, [shen_type_symbol, "shen_in"], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_extract$_vars), V2933[1][2][1]), [shen_type_cons, [shen_type_symbol, "and"], [shen_type_cons, [shen_type_symbol, "shen_then"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "bind"], [shen_type_cons, Z, [shen_type_cons, [shen_type_symbol, "shen_to"], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_rcons$_form), shen_tail_call(shen_get_fn_js(shen_remove$_modes), V2933[1][2][1])), [shen_type_cons, [shen_type_symbol, "shen_in"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_mu$_reduction), V2933[1][2][2][1]), [shen_type_symbol, "$plus$"]), []]]]]]], []]]]]]]]], [shen_type_cons, [shen_type_symbol, "shen_else"], [shen_type_cons, [shen_type_symbol, "shen_mu_fail$excl$"], []]]]]]], []]]]]]], []]]]]]];});})(shen_tail_call(shen_gensym, [shen_type_symbol, "V"])))
 : V2933))))))));});});
}
shen_mu$_reduction;

function shen_rcons$_form(V2935) {
  if (V2935 == undefined) return shen_rcons$_form;
  return ((shen_is_type_js(V2935, shen_type_cons)) ? [shen_type_cons, [shen_type_symbol, "cons"], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_rcons$_form), V2935[1]), [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_rcons$_form), V2935[2]), []]]] : V2935);
}
shen_rcons$_form;

function shen_remove$_modes(V2936) {
  if (V2936 == undefined) return shen_remove$_modes;
  return (((shen_is_type_js(V2936, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "mode"], V2936[1]);}) && (shen_is_type_js(V2936[2], shen_type_cons) && (shen_is_type_js(V2936[2][2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$plus$"], V2936[2][2][1]);}) && (shen_empty$question$_js(V2936[2][2][2])))))))) ? (shen_get_fn_js(shen_remove$_modes)(V2936[2][1])) : (((shen_is_type_js(V2936, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "mode"], V2936[1]);}) && (shen_is_type_js(V2936[2], shen_type_cons) && (shen_is_type_js(V2936[2][2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "_"], V2936[2][2][1]);}) && (shen_empty$question$_js(V2936[2][2][2])))))))) ? (shen_get_fn_js(shen_remove$_modes)(V2936[2][1])) : ((shen_is_type_js(V2936, shen_type_cons)) ? [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_remove$_modes), V2936[1]), shen_tail_call(shen_get_fn_js(shen_remove$_modes), V2936[2])] : V2936)));
}
shen_remove$_modes;

function shen_ephemeral$_variable$question$(V2937) {
  if (V2937 == undefined) return shen_ephemeral$_variable$question$;
  return (function lambda1452(V2938) {return (V2938 == undefined) ? lambda1452 : new Shen_tco_obj(function() {return (shen_tail_call(shen_variable$question$, V2937) && shen_tail_call(shen_variable$question$, V2938));});});
}
shen_ephemeral$_variable$question$;

function shen_prolog$_constant$question$(V2947) {
  if (V2947 == undefined) return shen_prolog$_constant$question$;
  return ((shen_is_type_js(V2947, shen_type_cons)) ? false : true);
}
shen_prolog$_constant$question$;

function shen_aum$_to$_shen(V2948) {
  if (V2948 == undefined) return shen_aum$_to$_shen;
  return (((shen_is_type_js(V2948, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "let"], V2948[1]);}) && (shen_is_type_js(V2948[2], shen_type_cons) && (shen_is_type_js(V2948[2][2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_be"], V2948[2][2][1]);}) && (shen_is_type_js(V2948[2][2][2], shen_type_cons) && (shen_is_type_js(V2948[2][2][2][2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_in"], V2948[2][2][2][2][1]);}) && (shen_is_type_js(V2948[2][2][2][2][2], shen_type_cons) && (shen_empty$question$_js(V2948[2][2][2][2][2][2])))))))))))) ? [shen_type_cons, [shen_type_symbol, "let"], [shen_type_cons, V2948[2][1], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_aum$_to$_shen), V2948[2][2][2][1]), [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_aum$_to$_shen), V2948[2][2][2][2][2][1]), []]]]] : (((shen_is_type_js(V2948, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_the"], V2948[1]);}) && (shen_is_type_js(V2948[2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_result"], V2948[2][1]);}) && (shen_is_type_js(V2948[2][2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_of"], V2948[2][2][1]);}) && (shen_is_type_js(V2948[2][2][2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_dereferencing"], V2948[2][2][2][1]);}) && (shen_is_type_js(V2948[2][2][2][2], shen_type_cons) && (shen_empty$question$_js(V2948[2][2][2][2][2])))))))))))) ? [shen_type_cons, [shen_type_symbol, "shen_lazyderef"], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_aum$_to$_shen), V2948[2][2][2][2][1]), [shen_type_cons, [shen_type_symbol, "ProcessN"], []]]] : (((shen_is_type_js(V2948, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_if"], V2948[1]);}) && (shen_is_type_js(V2948[2], shen_type_cons) && (shen_is_type_js(V2948[2][2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_then"], V2948[2][2][1]);}) && (shen_is_type_js(V2948[2][2][2], shen_type_cons) && (shen_is_type_js(V2948[2][2][2][2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_else"], V2948[2][2][2][2][1]);}) && (shen_is_type_js(V2948[2][2][2][2][2], shen_type_cons) && (shen_empty$question$_js(V2948[2][2][2][2][2][2])))))))))))) ? [shen_type_cons, [shen_type_symbol, "shen_if"], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_aum$_to$_shen), V2948[2][1]), [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_aum$_to$_shen), V2948[2][2][2][1]), [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_aum$_to$_shen), V2948[2][2][2][2][2][1]), []]]]] : (((shen_is_type_js(V2948, shen_type_cons) && (shen_is_type_js(V2948[2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "is"], V2948[2][1]);}) && (shen_is_type_js(V2948[2][2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_a"], V2948[2][2][1]);}) && (shen_is_type_js(V2948[2][2][2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_variable"], V2948[2][2][2][1]);}) && (shen_empty$question$_js(V2948[2][2][2][2])))))))))) ? [shen_type_cons, [shen_type_symbol, "shen_pvar$question$"], [shen_type_cons, V2948[1], []]] : (((shen_is_type_js(V2948, shen_type_cons) && (shen_is_type_js(V2948[2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "is"], V2948[2][1]);}) && (shen_is_type_js(V2948[2][2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_a"], V2948[2][2][1]);}) && (shen_is_type_js(V2948[2][2][2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_non_empty"], V2948[2][2][2][1]);}) && (shen_is_type_js(V2948[2][2][2][2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "list"], V2948[2][2][2][2][1]);}) && (shen_empty$question$_js(V2948[2][2][2][2][2])))))))))))) ? [shen_type_cons, [shen_type_symbol, "cons$question$"], [shen_type_cons, V2948[1], []]] : (((shen_is_type_js(V2948, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_rename"], V2948[1]);}) && (shen_is_type_js(V2948[2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_the"], V2948[2][1]);}) && (shen_is_type_js(V2948[2][2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_variables"], V2948[2][2][1]);}) && (shen_is_type_js(V2948[2][2][2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_in"], V2948[2][2][2][1]);}) && (shen_is_type_js(V2948[2][2][2][2], shen_type_cons) && ((shen_empty$question$_js(V2948[2][2][2][2][1])) && (shen_is_type_js(V2948[2][2][2][2][2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "and"], V2948[2][2][2][2][2][1]);}) && (shen_is_type_js(V2948[2][2][2][2][2][2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_then"], V2948[2][2][2][2][2][2][1]);}) && (shen_is_type_js(V2948[2][2][2][2][2][2][2], shen_type_cons) && (shen_empty$question$_js(V2948[2][2][2][2][2][2][2][2])))))))))))))))))) ? (shen_get_fn_js(shen_aum$_to$_shen)(V2948[2][2][2][2][2][2][2][1])) : (((shen_is_type_js(V2948, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_rename"], V2948[1]);}) && (shen_is_type_js(V2948[2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_the"], V2948[2][1]);}) && (shen_is_type_js(V2948[2][2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_variables"], V2948[2][2][1]);}) && (shen_is_type_js(V2948[2][2][2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_in"], V2948[2][2][2][1]);}) && (shen_is_type_js(V2948[2][2][2][2], shen_type_cons) && (shen_is_type_js(V2948[2][2][2][2][1], shen_type_cons) && (shen_is_type_js(V2948[2][2][2][2][2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "and"], V2948[2][2][2][2][2][1]);}) && (shen_is_type_js(V2948[2][2][2][2][2][2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_then"], V2948[2][2][2][2][2][2][1]);}) && (shen_is_type_js(V2948[2][2][2][2][2][2][2], shen_type_cons) && (shen_empty$question$_js(V2948[2][2][2][2][2][2][2][2])))))))))))))))))) ? [shen_type_cons, [shen_type_symbol, "let"], [shen_type_cons, V2948[2][2][2][2][1][1], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_newpv"], [shen_type_cons, [shen_type_symbol, "ProcessN"], []]], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_aum$_to$_shen), [shen_type_cons, [shen_type_symbol, "shen_rename"], [shen_type_cons, [shen_type_symbol, "shen_the"], [shen_type_cons, [shen_type_symbol, "shen_variables"], [shen_type_cons, [shen_type_symbol, "shen_in"], [shen_type_cons, V2948[2][2][2][2][1][2], V2948[2][2][2][2][2]]]]]]), []]]]] : (((shen_is_type_js(V2948, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "bind"], V2948[1]);}) && (shen_is_type_js(V2948[2], shen_type_cons) && (shen_is_type_js(V2948[2][2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_to"], V2948[2][2][1]);}) && (shen_is_type_js(V2948[2][2][2], shen_type_cons) && (shen_is_type_js(V2948[2][2][2][2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_in"], V2948[2][2][2][2][1]);}) && (shen_is_type_js(V2948[2][2][2][2][2], shen_type_cons) && (shen_empty$question$_js(V2948[2][2][2][2][2][2])))))))))))) ? [shen_type_cons, [shen_type_symbol, "shen_do"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_bindv"], [shen_type_cons, V2948[2][1], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_chwild), V2948[2][2][2][1]), [shen_type_cons, [shen_type_symbol, "ProcessN"], []]]]], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "let"], [shen_type_cons, [shen_type_symbol, "Result"], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_aum$_to$_shen), V2948[2][2][2][2][2][1]), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_do"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_unbindv"], [shen_type_cons, V2948[2][1], [shen_type_cons, [shen_type_symbol, "ProcessN"], []]]], [shen_type_cons, [shen_type_symbol, "Result"], []]]], []]]]], []]]] : (((shen_is_type_js(V2948, shen_type_cons) && (shen_is_type_js(V2948[2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "is"], V2948[2][1]);}) && (shen_is_type_js(V2948[2][2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "identical"], V2948[2][2][1]);}) && (shen_is_type_js(V2948[2][2][2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_to"], V2948[2][2][2][1]);}) && (shen_is_type_js(V2948[2][2][2][2], shen_type_cons) && (shen_empty$question$_js(V2948[2][2][2][2][2]))))))))))) ? [shen_type_cons, [shen_type_symbol, "$eq$"], [shen_type_cons, V2948[2][2][2][2][1], [shen_type_cons, V2948[1], []]]] : ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_mu_fail$excl$"], V2948);})) ? false : (((shen_is_type_js(V2948, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_the"], V2948[1]);}) && (shen_is_type_js(V2948[2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "head"], V2948[2][1]);}) && (shen_is_type_js(V2948[2][2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_of"], V2948[2][2][1]);}) && (shen_is_type_js(V2948[2][2][2], shen_type_cons) && (shen_empty$question$_js(V2948[2][2][2][2])))))))))) ? [shen_type_cons, [shen_type_symbol, "hd"], V2948[2][2][2]] : (((shen_is_type_js(V2948, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_the"], V2948[1]);}) && (shen_is_type_js(V2948[2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "tail"], V2948[2][1]);}) && (shen_is_type_js(V2948[2][2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_of"], V2948[2][2][1]);}) && (shen_is_type_js(V2948[2][2][2], shen_type_cons) && (shen_empty$question$_js(V2948[2][2][2][2])))))))))) ? [shen_type_cons, [shen_type_symbol, "tl"], V2948[2][2][2]] : (((shen_is_type_js(V2948, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_pop"], V2948[1]);}) && (shen_is_type_js(V2948[2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_the"], V2948[2][1]);}) && (shen_is_type_js(V2948[2][2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_stack"], V2948[2][2][1]);}) && (shen_empty$question$_js(V2948[2][2][2]))))))))) ? [shen_type_cons, [shen_type_symbol, "shen_do"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_incinfs"], []], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "thaw"], [shen_type_cons, [shen_type_symbol, "Continuation"], []]], []]]] : (((shen_is_type_js(V2948, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "call"], V2948[1]);}) && (shen_is_type_js(V2948[2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_the"], V2948[2][1]);}) && (shen_is_type_js(V2948[2][2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_continuation"], V2948[2][2][1]);}) && (shen_is_type_js(V2948[2][2][2], shen_type_cons) && (shen_empty$question$_js(V2948[2][2][2][2])))))))))) ? [shen_type_cons, [shen_type_symbol, "shen_do"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_incinfs"], []], [shen_type_cons, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_call$_the$_continuation), shen_tail_call(shen_get_fn_js(shen_chwild), V2948[2][2][2][1])), [shen_type_symbol, "ProcessN"]), [shen_type_symbol, "Continuation"]), []]]] : V2948))))))))))))));
}
shen_aum$_to$_shen;

function shen_chwild(V2949) {
  if (V2949 == undefined) return shen_chwild;
  return ((shen_tail_call(function() {return shen_equal$question$_js(V2949, [shen_type_symbol, "$_"]);})) ? [shen_type_cons, [shen_type_symbol, "shen_newpv"], [shen_type_cons, [shen_type_symbol, "ProcessN"], []]] : ((shen_is_type_js(V2949, shen_type_cons)) ? (shen_tail_call(shen_map, shen_chwild)(V2949)) : V2949));
}
shen_chwild;

function shen_newpv(V2950) {
  if (V2950 == undefined) return shen_newpv;
  return ((function(Count$plus$1) {return new Shen_tco_obj(function() {return ((function(IncVar) {return new Shen_tco_obj(function() {return ((function(Vector) {return new Shen_tco_obj(function() {return ((function(ResizeVectorIfNeeded) {return new Shen_tco_obj(function() {return (shen_get_fn_js(shen_mk_pvar)(Count$plus$1));});})(((shen_tail_call(function() {return shen_equal$question$_js(Count$plus$1, shen_tail_call(shen_limit, Vector));})) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_resizeprocessvector), V2950), Count$plus$1) : [shen_type_symbol, "shen_skip"])))
;});})(shen_absvector_ref_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$prologvectors$asterisk$"]), V2950)))
;});})(shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$varcounter$asterisk$"]), V2950, Count$plus$1)))
;});})((shen_absvector_ref_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$varcounter$asterisk$"]), V2950) + 1)))
;
}
shen_newpv;

function shen_resizeprocessvector(V2951) {
  if (V2951 == undefined) return shen_resizeprocessvector;
  return (function lambda1453(V2952) {return (V2952 == undefined) ? lambda1453 : new Shen_tco_obj(function() {return ((function(Vector) {return new Shen_tco_obj(function() {return ((function(BigVector) {return new Shen_tco_obj(function() {return shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$prologvectors$asterisk$"]), V2951, BigVector);});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_resize_vector), Vector), (V2952 + V2952)), [shen_type_symbol, "shen__null_"])))
;});})(shen_absvector_ref_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$prologvectors$asterisk$"]), V2951)))
;});});
}
shen_resizeprocessvector;

function shen_resize_vector(V2953) {
  if (V2953 == undefined) return shen_resize_vector;
  return (function lambda1455(V2954) {return (V2954 == undefined) ? lambda1455 : new Shen_tco_obj(function() {return (function lambda1454(V2955) {return (V2955 == undefined) ? lambda1454 : new Shen_tco_obj(function() {return ((function(BigVector) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_copy_vector), V2953), BigVector), shen_tail_call(shen_limit, V2953)), V2954)(V2955));});})(shen_absvector_set_js(shen_tail_call(shen_absvector, (1 + V2954)), 0, V2954)))
;});});});});
}
shen_resize_vector;

function shen_copy_vector(V2956) {
  if (V2956 == undefined) return shen_copy_vector;
  return (function lambda1459(V2957) {return (V2957 == undefined) ? lambda1459 : new Shen_tco_obj(function() {return (function lambda1458(V2958) {return (V2958 == undefined) ? lambda1458 : new Shen_tco_obj(function() {return (function lambda1457(V2959) {return (V2959 == undefined) ? lambda1457 : new Shen_tco_obj(function() {return (function lambda1456(V2960) {return (V2960 == undefined) ? lambda1456 : new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_copy_vector_stage_2), (1 + V2958)), (V2959 + 1)), V2960)(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_copy_vector_stage_1), 1), V2956), V2957), (1 + V2958))));});});});});});});});});
}
shen_copy_vector;

function shen_copy_vector_stage_1(V2963) {
  if (V2963 == undefined) return shen_copy_vector_stage_1;
  return (function lambda1462(V2964) {return (V2964 == undefined) ? lambda1462 : new Shen_tco_obj(function() {return (function lambda1461(V2965) {return (V2965 == undefined) ? lambda1461 : new Shen_tco_obj(function() {return (function lambda1460(V2966) {return (V2966 == undefined) ? lambda1460 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(V2966, V2963);})) ? V2965 : (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_copy_vector_stage_1), (1 + V2963)), V2964), shen_absvector_set_js(V2965, V2963, shen_absvector_ref_js(V2964, V2963)))(V2966)));});});});});});});
}
shen_copy_vector_stage_1;

function shen_copy_vector_stage_2(V2970) {
  if (V2970 == undefined) return shen_copy_vector_stage_2;
  return (function lambda1465(V2971) {return (V2971 == undefined) ? lambda1465 : new Shen_tco_obj(function() {return (function lambda1464(V2972) {return (V2972 == undefined) ? lambda1464 : new Shen_tco_obj(function() {return (function lambda1463(V2973) {return (V2973 == undefined) ? lambda1463 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(V2971, V2970);})) ? V2973 : (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_copy_vector_stage_2), (V2970 + 1)), V2971), V2972)(shen_absvector_set_js(V2973, V2970, V2972))));});});});});});});
}
shen_copy_vector_stage_2;

function shen_mk_pvar(V2975) {
  if (V2975 == undefined) return shen_mk_pvar;
  return shen_absvector_set_js(shen_absvector_set_js(shen_tail_call(shen_absvector, 2), 0, [shen_type_symbol, "shen_pvar"]), 1, V2975);
}
shen_mk_pvar;

function shen_pvar$question$(V2976) {
  if (V2976 == undefined) return shen_pvar$question$;
  return (shen_absvector$question$_js(V2976) && shen_tail_call(function() {return shen_equal$question$_js(shen_absvector_ref_js(V2976, 0), [shen_type_symbol, "shen_pvar"]);}));
}
shen_pvar$question$;

function shen_bindv(V2977) {
  if (V2977 == undefined) return shen_bindv;
  return (function lambda1467(V2978) {return (V2978 == undefined) ? lambda1467 : new Shen_tco_obj(function() {return (function lambda1466(V2979) {return (V2979 == undefined) ? lambda1466 : new Shen_tco_obj(function() {return ((function(Vector) {return new Shen_tco_obj(function() {return shen_absvector_set_js(Vector, shen_absvector_ref_js(V2977, 1), V2978);});})(shen_absvector_ref_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$prologvectors$asterisk$"]), V2979)))
;});});});});
}
shen_bindv;

function shen_unbindv(V2980) {
  if (V2980 == undefined) return shen_unbindv;
  return (function lambda1468(V2981) {return (V2981 == undefined) ? lambda1468 : new Shen_tco_obj(function() {return ((function(Vector) {return new Shen_tco_obj(function() {return shen_absvector_set_js(Vector, shen_absvector_ref_js(V2980, 1), [shen_type_symbol, "shen__null_"]);});})(shen_absvector_ref_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$prologvectors$asterisk$"]), V2981)))
;});});
}
shen_unbindv;

function shen_incinfs() {return (shen_globals[[shen_type_symbol, "shen_$asterisk$infs$asterisk$"][1]] = (1 + shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$infs$asterisk$"])));}
shen_incinfs;

function shen_call$_the$_continuation(V2982) {
  if (V2982 == undefined) return shen_call$_the$_continuation;
  return (function lambda1470(V2983) {return (V2983 == undefined) ? lambda1470 : new Shen_tco_obj(function() {return (function lambda1469(V2984) {return (V2984 == undefined) ? lambda1469 : new Shen_tco_obj(function() {return (((shen_is_type_js(V2982, shen_type_cons) && (shen_is_type_js(V2982[1], shen_type_cons) && (shen_empty$question$_js(V2982[2]))))) ? [shen_type_cons, V2982[1][1], shen_tail_call(shen_tail_call(shen_append, V2982[1][2]), [shen_type_cons, V2983, [shen_type_cons, V2984, []]])] : (((shen_is_type_js(V2982, shen_type_cons) && shen_is_type_js(V2982[1], shen_type_cons))) ? ((function(NewContinuation) {return new Shen_tco_obj(function() {return [shen_type_cons, V2982[1][1], shen_tail_call(shen_tail_call(shen_append, V2982[1][2]), [shen_type_cons, V2983, [shen_type_cons, NewContinuation, []]])];});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_newcontinuation), V2982[2]), V2983), V2984)))
 : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_call$_the$_continuation"]))));});});});});
}
shen_call$_the$_continuation;

function shen_newcontinuation(V2985) {
  if (V2985 == undefined) return shen_newcontinuation;
  return (function lambda1472(V2986) {return (V2986 == undefined) ? lambda1472 : new Shen_tco_obj(function() {return (function lambda1471(V2987) {return (V2987 == undefined) ? lambda1471 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V2985))) ? V2987 : (((shen_is_type_js(V2985, shen_type_cons) && shen_is_type_js(V2985[1], shen_type_cons))) ? [shen_type_cons, [shen_type_symbol, "freeze"], [shen_type_cons, [shen_type_cons, V2985[1][1], shen_tail_call(shen_tail_call(shen_append, V2985[1][2]), [shen_type_cons, V2986, [shen_type_cons, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_newcontinuation), V2985[2]), V2986), V2987), []]])], []]] : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_newcontinuation"]))));});});});});
}
shen_newcontinuation;

function shen_return(V2992) {
  if (V2992 == undefined) return shen_return;
  return (function lambda1474(V2993) {return (V2993 == undefined) ? lambda1474 : new Shen_tco_obj(function() {return (function lambda1473(V2994) {return (V2994 == undefined) ? lambda1473 : new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_deref), V2992)(V2993));});});});});
}
shen_return;

function shen_measure$amp$return(V2999) {
  if (V2999 == undefined) return shen_measure$amp$return;
  return (function lambda1476(V3000) {return (V3000 == undefined) ? lambda1476 : new Shen_tco_obj(function() {return (function lambda1475(V3001) {return (V3001 == undefined) ? lambda1475 : new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_intoutput, "~A inferences~%"), [shen_tuple, shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$infs$asterisk$"]), []]),
  (shen_tail_call(shen_get_fn_js(shen_deref), V2999)(V3000)));});});});});
}
shen_measure$amp$return;

function shen_unify(V3002) {
  if (V3002 == undefined) return shen_unify;
  return (function lambda1479(V3003) {return (V3003 == undefined) ? lambda1479 : new Shen_tco_obj(function() {return (function lambda1478(V3004) {return (V3004 == undefined) ? lambda1478 : new Shen_tco_obj(function() {return (function lambda1477(V3005) {return (V3005 == undefined) ? lambda1477 : new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lzy$eq$), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V3002), V3004)), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V3003), V3004)), V3004)(V3005));});});});});});});
}
shen_unify;

function shen_lzy$eq$(V3022) {
  if (V3022 == undefined) return shen_lzy$eq$;
  return (function lambda1482(V3023) {return (V3023 == undefined) ? lambda1482 : new Shen_tco_obj(function() {return (function lambda1481(V3024) {return (V3024 == undefined) ? lambda1481 : new Shen_tco_obj(function() {return (function lambda1480(V3025) {return (V3025 == undefined) ? lambda1480 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(V3023, V3022);})) ? (V3025()) : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V3022)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V3022), V3023), V3024)(V3025)) : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V3023)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V3023), V3022), V3024)(V3025)) : (((shen_is_type_js(V3022, shen_type_cons) && shen_is_type_js(V3023, shen_type_cons))) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lzy$eq$), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V3022[1]), V3024)), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V3023[1]), V3024)), V3024)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lzy$eq$), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V3022[2]), V3024)), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V3023[2]), V3024)), V3024)(V3025));});}))) : false))));});});});});});});
}
shen_lzy$eq$;

function shen_deref(V3027) {
  if (V3027 == undefined) return shen_deref;
  return (function lambda1483(V3028) {return (V3028 == undefined) ? lambda1483 : new Shen_tco_obj(function() {return ((shen_is_type_js(V3027, shen_type_cons)) ? [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_deref), V3027[1]), V3028), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_deref), V3027[2]), V3028)] : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V3027)) ? ((function(Value) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Value, [shen_type_symbol, "shen__null_"]);})) ? V3027 : (shen_tail_call(shen_get_fn_js(shen_deref), Value)(V3028)));});})(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_valvector), V3027), V3028)))
 : V3027));});});
}
shen_deref;

function shen_lazyderef(V3029) {
  if (V3029 == undefined) return shen_lazyderef;
  return (function lambda1484(V3030) {return (V3030 == undefined) ? lambda1484 : new Shen_tco_obj(function() {return ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V3029)) ? ((function(Value) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Value, [shen_type_symbol, "shen__null_"]);})) ? V3029 : (shen_tail_call(shen_get_fn_js(shen_lazyderef), Value)(V3030)));});})(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_valvector), V3029), V3030)))
 : V3029);});});
}
shen_lazyderef;

function shen_valvector(V3031) {
  if (V3031 == undefined) return shen_valvector;
  return (function lambda1485(V3032) {return (V3032 == undefined) ? lambda1485 : new Shen_tco_obj(function() {return shen_absvector_ref_js(shen_absvector_ref_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$prologvectors$asterisk$"]), V3032), shen_absvector_ref_js(V3031, 1));});});
}
shen_valvector;

function shen_unify$excl$(V3033) {
  if (V3033 == undefined) return shen_unify$excl$;
  return (function lambda1488(V3034) {return (V3034 == undefined) ? lambda1488 : new Shen_tco_obj(function() {return (function lambda1487(V3035) {return (V3035 == undefined) ? lambda1487 : new Shen_tco_obj(function() {return (function lambda1486(V3036) {return (V3036 == undefined) ? lambda1486 : new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lzy$eq$$excl$), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V3033), V3035)), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V3034), V3035)), V3035)(V3036));});});});});});});
}
shen_unify$excl$;

function shen_lzy$eq$$excl$(V3053) {
  if (V3053 == undefined) return shen_lzy$eq$$excl$;
  return (function lambda1491(V3054) {return (V3054 == undefined) ? lambda1491 : new Shen_tco_obj(function() {return (function lambda1490(V3055) {return (V3055 == undefined) ? lambda1490 : new Shen_tco_obj(function() {return (function lambda1489(V3056) {return (V3056 == undefined) ? lambda1489 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(V3054, V3053);})) ? (V3056()) : (((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V3053) && (!shen_tail_call(shen_tail_call(shen_get_fn_js(shen_occurs$question$), V3053), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_deref), V3054), V3055))))) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V3053), V3054), V3055)(V3056)) : (((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V3054) && (!shen_tail_call(shen_tail_call(shen_get_fn_js(shen_occurs$question$), V3054), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_deref), V3053), V3055))))) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V3054), V3053), V3055)(V3056)) : (((shen_is_type_js(V3053, shen_type_cons) && shen_is_type_js(V3054, shen_type_cons))) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lzy$eq$$excl$), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V3053[1]), V3055)), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V3054[1]), V3055)), V3055)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lzy$eq$$excl$), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V3053[2]), V3055)), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V3054[2]), V3055)), V3055)(V3056));});}))) : false))));});});});});});});
}
shen_lzy$eq$$excl$;

function shen_occurs$question$(V3066) {
  if (V3066 == undefined) return shen_occurs$question$;
  return (function lambda1492(V3067) {return (V3067 == undefined) ? lambda1492 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(V3067, V3066);})) ? true : ((shen_is_type_js(V3067, shen_type_cons)) ? (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_occurs$question$), V3066), V3067[1]) || shen_tail_call(shen_tail_call(shen_get_fn_js(shen_occurs$question$), V3066), V3067[2])) : false));});});
}
shen_occurs$question$;

function shen_identical(V3069) {
  if (V3069 == undefined) return shen_identical;
  return (function lambda1495(V3070) {return (V3070 == undefined) ? lambda1495 : new Shen_tco_obj(function() {return (function lambda1494(V3071) {return (V3071 == undefined) ? lambda1494 : new Shen_tco_obj(function() {return (function lambda1493(V3072) {return (V3072 == undefined) ? lambda1493 : new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lzy$eq$$eq$), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V3069), V3071)), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V3070), V3071)), V3071)(V3072));});});});});});});
}
shen_identical;

function shen_lzy$eq$$eq$(V3089) {
  if (V3089 == undefined) return shen_lzy$eq$$eq$;
  return (function lambda1498(V3090) {return (V3090 == undefined) ? lambda1498 : new Shen_tco_obj(function() {return (function lambda1497(V3091) {return (V3091 == undefined) ? lambda1497 : new Shen_tco_obj(function() {return (function lambda1496(V3092) {return (V3092 == undefined) ? lambda1496 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(V3090, V3089);})) ? (V3092()) : (((shen_is_type_js(V3089, shen_type_cons) && shen_is_type_js(V3090, shen_type_cons))) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lzy$eq$$eq$), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V3089[1]), V3091)), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V3090[1]), V3091)), V3091)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lzy$eq$$eq$), V3089[2]), V3090[2]), V3091)(V3092));});}))) : false));});});});});});});
}
shen_lzy$eq$$eq$;

function shen_pvar(V3094) {
  if (V3094 == undefined) return shen_pvar;
  return (shen_tail_call(shen_intmake_string, "Var~A")([shen_tuple, shen_absvector_ref_js(V3094, 1), []]));
}
shen_pvar;

function shen_bind(V3095) {
  if (V3095 == undefined) return shen_bind;
  return (function lambda1501(V3096) {return (V3096 == undefined) ? lambda1501 : new Shen_tco_obj(function() {return (function lambda1500(V3097) {return (V3097 == undefined) ? lambda1500 : new Shen_tco_obj(function() {return (function lambda1499(V3098) {return (V3098 == undefined) ? lambda1499 : new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V3095), V3096), V3097),
  ((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V3095), V3097),
  Result);});})(shen_tail_call(V3098)))
);});});});});});});
}
shen_bind;

function shen_fwhen(V3113) {
  if (V3113 == undefined) return shen_fwhen;
  return (function lambda1503(V3114) {return (V3114 == undefined) ? lambda1503 : new Shen_tco_obj(function() {return (function lambda1502(V3115) {return (V3115 == undefined) ? lambda1502 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(true, V3113);})) ? (V3115()) : ((shen_tail_call(function() {return shen_equal$question$_js(false, V3113);})) ? false : (shen_tail_call(shen_interror, "fwhen expects a boolean: not ~S%")([shen_tuple, V3113, []]))));});});});});
}
shen_fwhen;

function shen_call(V3128) {
  if (V3128 == undefined) return shen_call;
  return (function lambda1505(V3129) {return (V3129 == undefined) ? lambda1505 : new Shen_tco_obj(function() {return (function lambda1504(V3130) {return (V3130 == undefined) ? lambda1504 : new Shen_tco_obj(function() {return ((shen_is_type_js(V3128, shen_type_cons)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_call_help), shen_tail_call(shen_get_fn_js(shen_m$_prolog$_to$_s_prolog$_predicate), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V3128[1]), V3129))), V3128[2]), V3129)(V3130)) : false);});});});});
}
shen_call;

function shen_call_help(V3131) {
  if (V3131 == undefined) return shen_call_help;
  return (function lambda1508(V3132) {return (V3132 == undefined) ? lambda1508 : new Shen_tco_obj(function() {return (function lambda1507(V3133) {return (V3133 == undefined) ? lambda1507 : new Shen_tco_obj(function() {return (function lambda1506(V3134) {return (V3134 == undefined) ? lambda1506 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V3132))) ? (shen_tail_call(shen_get_fn_js(V3131), V3133)(V3134)) : ((shen_is_type_js(V3132, shen_type_cons)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_call_help), shen_tail_call(shen_get_fn_js(V3131), V3132[1])), V3132[2]), V3133)(V3134)) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_call_help"]))));});});});});});});
}
shen_call_help;

function shen_intprolog(V3135) {
  if (V3135 == undefined) return shen_intprolog;
  return (((shen_is_type_js(V3135, shen_type_cons) && shen_is_type_js(V3135[1], shen_type_cons))) ? ((function(ProcessN) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_intprolog_help), V3135[1][1]), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_insert_prolog_variables), [shen_type_cons, V3135[1][2], [shen_type_cons, V3135[2], []]]), ProcessN))(ProcessN));});})(shen_tail_call(shen_get_fn_js(shen_start_new_prolog_process))))
 : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_intprolog"])));
}
shen_intprolog;

function shen_intprolog_help(V3136) {
  if (V3136 == undefined) return shen_intprolog_help;
  return (function lambda1510(V3137) {return (V3137 == undefined) ? lambda1510 : new Shen_tco_obj(function() {return (function lambda1509(V3138) {return (V3138 == undefined) ? lambda1509 : new Shen_tco_obj(function() {return (((shen_is_type_js(V3137, shen_type_cons) && (shen_is_type_js(V3137[2], shen_type_cons) && (shen_empty$question$_js(V3137[2][2]))))) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_intprolog_help_help), V3136), V3137[1]), V3137[2][1])(V3138)) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_intprolog_help"])));});});});});
}
shen_intprolog_help;

function shen_intprolog_help_help(V3139) {
  if (V3139 == undefined) return shen_intprolog_help_help;
  return (function lambda1513(V3140) {return (V3140 == undefined) ? lambda1513 : new Shen_tco_obj(function() {return (function lambda1512(V3141) {return (V3141 == undefined) ? lambda1512 : new Shen_tco_obj(function() {return (function lambda1511(V3142) {return (V3142 == undefined) ? lambda1511 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V3140))) ? (shen_tail_call(shen_get_fn_js(V3139), V3142)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_call_rest), V3141)(V3142));});}))) : ((shen_is_type_js(V3140, shen_type_cons)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_intprolog_help_help), shen_tail_call(shen_get_fn_js(V3139), V3140[1])), V3140[2]), V3141)(V3142)) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_intprolog_help_help"]))));});});});});});});
}
shen_intprolog_help_help;

function shen_call_rest(V3145) {
  if (V3145 == undefined) return shen_call_rest;
  return (function lambda1514(V3146) {return (V3146 == undefined) ? lambda1514 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V3145))) ? true : (((shen_is_type_js(V3145, shen_type_cons) && (shen_is_type_js(V3145[1], shen_type_cons) && shen_is_type_js(V3145[1][2], shen_type_cons)))) ? (shen_tail_call(shen_get_fn_js(shen_call_rest), [shen_type_cons, [shen_type_cons, shen_tail_call(V3145[1][1], V3145[1][2][1]), V3145[1][2][2]], V3145[2]])(V3146)) : (((shen_is_type_js(V3145, shen_type_cons) && (shen_is_type_js(V3145[1], shen_type_cons) && (shen_empty$question$_js(V3145[1][2]))))) ? (shen_tail_call(V3145[1][1], V3146)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_call_rest), V3145[2])(V3146));});}))) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_call_rest"])))));});});
}
shen_call_rest;

function shen_start_new_prolog_process() {return ((function(IncrementProcessCounter) {return new Shen_tco_obj(function() {return (shen_get_fn_js(shen_initialise_prolog)(IncrementProcessCounter));});})((shen_globals[[shen_type_symbol, "shen_$asterisk$process_counter$asterisk$"][1]] = (1 + shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$process_counter$asterisk$"])))))
;}
shen_start_new_prolog_process;

function shen_insert_prolog_variables(V3147) {
  if (V3147 == undefined) return shen_insert_prolog_variables;
  return (function lambda1515(V3148) {return (V3148 == undefined) ? lambda1515 : new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_insert_prolog_variables_help), V3147), shen_tail_call(shen_get_fn_js(shen_flatten), V3147))(V3148));});});
}
shen_insert_prolog_variables;

function shen_insert_prolog_variables_help(V3153) {
  if (V3153 == undefined) return shen_insert_prolog_variables_help;
  return (function lambda1517(V3154) {return (V3154 == undefined) ? lambda1517 : new Shen_tco_obj(function() {return (function lambda1516(V3155) {return (V3155 == undefined) ? lambda1516 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V3154))) ? V3153 : (((shen_is_type_js(V3154, shen_type_cons) && shen_tail_call(shen_variable$question$, V3154[1]))) ? ((function(V) {return new Shen_tco_obj(function() {return ((function(XV$slash$Y) {return new Shen_tco_obj(function() {return ((function(Z_Y) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_insert_prolog_variables_help), XV$slash$Y), Z_Y)(V3155));});})(shen_tail_call(shen_tail_call(shen_remove, V3154[1]), V3154[2])))
;});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_subst, V), V3154[1]), V3153)))
;});})(shen_tail_call(shen_get_fn_js(shen_newpv), V3155)))
 : ((shen_is_type_js(V3154, shen_type_cons)) ? (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_insert_prolog_variables_help), V3153), V3154[2])(V3155)) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_insert_prolog_variables_help"])))));});});});});
}
shen_insert_prolog_variables_help;

function shen_initialise_prolog(V3156) {
  if (V3156 == undefined) return shen_initialise_prolog;
  return ((function(Vector) {return new Shen_tco_obj(function() {return ((function(Counter) {return new Shen_tco_obj(function() {return V3156;});})(shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$varcounter$asterisk$"]), V3156, 1)))
;});})(shen_absvector_set_js(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$prologvectors$asterisk$"]), V3156, shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_fillvector), shen_tail_call(shen_vector, 10)), 1), 11), [shen_type_symbol, "shen__null_"]))))
;
}
shen_initialise_prolog;



//## FILE js/track.js

function shen_f$_error(V4790) {
  if (V4790 == undefined) return shen_f$_error;
  return (shen_tail_call(shen_tail_call(shen_intoutput, "partial function ~A;~%"), [shen_tuple, V4790, []]),
  (((((!shen_tail_call(shen_get_fn_js(shen_tracked$question$), V4790)) && shen_tail_call(shen_y_or_n$question$, shen_tail_call(shen_tail_call(shen_intmake_string, "track ~A? "), [shen_tuple, V4790, []])))) ? shen_tail_call(shen_get_fn_js(shen_track_function), shen_tail_call(shen_ps, V4790)) : [shen_type_symbol, "shen_ok"]),
  (shen_simple_error("aborted"))));
}
shen_f$_error;

function shen_tracked$question$(V4791) {
  if (V4791 == undefined) return shen_tracked$question$;
  return (shen_tail_call(shen_element$question$, V4791)(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$tracking$asterisk$"])));
}
shen_tracked$question$;

function shen_track(V4792) {
  if (V4792 == undefined) return shen_track;
  return ((function(Source) {return new Shen_tco_obj(function() {return (shen_get_fn_js(shen_track_function)(Source));});})(shen_tail_call(shen_ps, V4792)))
;
}
shen_track;

function shen_track_function(V4793) {
  if (V4793 == undefined) return shen_track_function;
  return (((shen_is_type_js(V4793, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "defun"], V4793[1]);}) && (shen_is_type_js(V4793[2], shen_type_cons) && (shen_is_type_js(V4793[2][2], shen_type_cons) && (shen_is_type_js(V4793[2][2][2], shen_type_cons) && (shen_empty$question$_js(V4793[2][2][2][2])))))))) ? ((function(KL) {return new Shen_tco_obj(function() {return ((function(Ob) {return new Shen_tco_obj(function() {return ((function(Tr) {return new Shen_tco_obj(function() {return Ob;});})((shen_globals[[shen_type_symbol, "shen_$asterisk$tracking$asterisk$"][1]] = [shen_type_cons, Ob, shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$tracking$asterisk$"])])))
;});})(shen_tail_call(shen_eval, KL)))
;});})([shen_type_cons, [shen_type_symbol, "defun"], [shen_type_cons, V4793[2][1], [shen_type_cons, V4793[2][2][1], [shen_type_cons, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_insert_tracking_code), V4793[2][1]), V4793[2][2][1]), V4793[2][2][2][1]), []]]]]))
 : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_track_function"])));
}
shen_track_function;

function shen_insert_tracking_code(V4794) {
  if (V4794 == undefined) return shen_insert_tracking_code;
  return (function lambda1632(V4795) {return (V4795 == undefined) ? lambda1632 : new Shen_tco_obj(function() {return (function lambda1631(V4796) {return (V4796 == undefined) ? lambda1631 : new Shen_tco_obj(function() {return [shen_type_cons, [shen_type_symbol, "shen_do"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "set"], [shen_type_cons, [shen_type_symbol, "shen_$asterisk$call$asterisk$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "$plus$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "value"], [shen_type_cons, [shen_type_symbol, "shen_$asterisk$call$asterisk$"], []]], [shen_type_cons, 1, []]]], []]]], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_do"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_input_track"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "value"], [shen_type_cons, [shen_type_symbol, "shen_$asterisk$call$asterisk$"], []]], [shen_type_cons, V4794, [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_cons$_form), V4795), []]]]], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_do"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_terpri_or_read_char"], []], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "let"], [shen_type_cons, [shen_type_symbol, "Result"], [shen_type_cons, V4796, [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_do"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_output_track"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "value"], [shen_type_cons, [shen_type_symbol, "shen_$asterisk$call$asterisk$"], []]], [shen_type_cons, V4794, [shen_type_cons, [shen_type_symbol, "Result"], []]]]], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_do"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "set"], [shen_type_cons, [shen_type_symbol, "shen_$asterisk$call$asterisk$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "_"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "value"], [shen_type_cons, [shen_type_symbol, "shen_$asterisk$call$asterisk$"], []]], [shen_type_cons, 1, []]]], []]]], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_do"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_terpri_or_read_char"], []], [shen_type_cons, [shen_type_symbol, "Result"], []]]], []]]], []]]], []]]]], []]]], []]]], []]]];});});});});
}
shen_insert_tracking_code;

(shen_globals[[shen_type_symbol, "shen_$asterisk$step$asterisk$"][1]] = false);

function shen_step(V4801) {
  if (V4801 == undefined) return shen_step;
  return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$plus$"], V4801);})) ? (shen_globals[[shen_type_symbol, "shen_$asterisk$step$asterisk$"][1]] = true) : ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "_"], V4801);})) ? (shen_globals[[shen_type_symbol, "shen_$asterisk$step$asterisk$"][1]] = false) : (shen_tail_call(shen_interror, "step expects a + or a -.~%")([]))));
}
shen_step;

function shen_spy(V4806) {
  if (V4806 == undefined) return shen_spy;
  return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$plus$"], V4806);})) ? (shen_globals[[shen_type_symbol, "shen_$asterisk$spy$asterisk$"][1]] = true) : ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "_"], V4806);})) ? (shen_globals[[shen_type_symbol, "shen_$asterisk$spy$asterisk$"][1]] = false) : (shen_tail_call(shen_interror, "spy expects a + or a -.~%")([]))));
}
shen_spy;

function shen_terpri_or_read_char() {return ((shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$step$asterisk$"])) ? (shen_get_fn_js(shen_check_byte)(shen_tail_call(shen_read_byte, shen_tail_call(shen_stinput, 0)))) : (shen_nl(1)));}
shen_terpri_or_read_char;

function shen_check_byte(V4811) {
  if (V4811 == undefined) return shen_check_byte;
  return ((shen_tail_call(function() {return shen_equal$question$_js(V4811, shen_tail_call(shen_get_fn_js(shen_hat)));})) ? (shen_tail_call(shen_interror, "aborted")([])) : true);
}
shen_check_byte;

function shen_input_track(V4812) {
  if (V4812 == undefined) return shen_input_track;
  return (function lambda1634(V4813) {return (V4813 == undefined) ? lambda1634 : new Shen_tco_obj(function() {return (function lambda1633(V4814) {return (V4814 == undefined) ? lambda1633 : new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_intoutput, "~%~A<~A> Inputs to ~A ~%~A"), [shen_tuple, shen_tail_call(shen_get_fn_js(shen_spaces), V4812), [shen_tuple, V4812, [shen_tuple, V4813, [shen_tuple, shen_tail_call(shen_get_fn_js(shen_spaces), V4812), [shen_tuple, V4814, []]]]]]),
  (shen_get_fn_js(shen_recursively_print)(V4814)));});});});});
}
shen_input_track;

function shen_recursively_print(V4815) {
  if (V4815 == undefined) return shen_recursively_print;
  return (((shen_empty$question$_js(V4815))) ? (shen_tail_call(shen_intoutput, " ==>")([])) : ((shen_is_type_js(V4815, shen_type_cons)) ? (shen_tail_call(shen_print, V4815[1]),
  (shen_tail_call(shen_tail_call(shen_intoutput, ", "), []),
  (shen_get_fn_js(shen_recursively_print)(V4815[2])))) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_recursively_print"]))));
}
shen_recursively_print;

function shen_spaces(V4816) {
  if (V4816 == undefined) return shen_spaces;
  return ((shen_tail_call(function() {return shen_equal$question$_js(0, V4816);})) ? "" : (" " + shen_tail_call(shen_get_fn_js(shen_spaces), (V4816 - 1))));
}
shen_spaces;

function shen_output_track(V4817) {
  if (V4817 == undefined) return shen_output_track;
  return (function lambda1636(V4818) {return (V4818 == undefined) ? lambda1636 : new Shen_tco_obj(function() {return (function lambda1635(V4819) {return (V4819 == undefined) ? lambda1635 : new Shen_tco_obj(function() {return (shen_tail_call(shen_intoutput, "~%~A<~A> Output from ~A ~%~A==> ~S")([shen_tuple, shen_tail_call(shen_get_fn_js(shen_spaces), V4817), [shen_tuple, V4817, [shen_tuple, V4818, [shen_tuple, shen_tail_call(shen_get_fn_js(shen_spaces), V4817), [shen_tuple, V4819, []]]]]]));});});});});
}
shen_output_track;

function shen_untrack(V4820) {
  if (V4820 == undefined) return shen_untrack;
  return ((shen_globals[[shen_type_symbol, "shen_$asterisk$tracking$asterisk$"][1]] = shen_tail_call(shen_tail_call(shen_remove, V4820), shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$tracking$asterisk$"]))),
  (shen_eval(shen_tail_call(shen_ps, V4820))));
}
shen_untrack;

function shen_profile(V4821) {
  if (V4821 == undefined) return shen_profile;
  return (shen_get_fn_js(shen_profile_help)(shen_tail_call(shen_ps, V4821)));
}
shen_profile;

function shen_profile_help(V4826) {
  if (V4826 == undefined) return shen_profile_help;
  return (((shen_is_type_js(V4826, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "defun"], V4826[1]);}) && (shen_is_type_js(V4826[2], shen_type_cons) && (shen_is_type_js(V4826[2][2], shen_type_cons) && (shen_is_type_js(V4826[2][2][2], shen_type_cons) && (shen_empty$question$_js(V4826[2][2][2][2])))))))) ? ((function(G) {return new Shen_tco_obj(function() {return ((function(Profile) {return new Shen_tco_obj(function() {return ((function(Def) {return new Shen_tco_obj(function() {return ((function(CompileProfile) {return new Shen_tco_obj(function() {return ((function(CompileG) {return new Shen_tco_obj(function() {return V4826[2][1];});})(shen_tail_call(shen_eval_without_macros, Def)))
;});})(shen_tail_call(shen_eval_without_macros, Profile)))
;});})([shen_type_cons, [shen_type_symbol, "defun"], [shen_type_cons, G, [shen_type_cons, V4826[2][2][1], [shen_type_cons, shen_tail_call(shen_tail_call(shen_tail_call(shen_subst, G), V4826[2][1]), V4826[2][2][2][1]), []]]]]))
;});})([shen_type_cons, [shen_type_symbol, "defun"], [shen_type_cons, V4826[2][1], [shen_type_cons, V4826[2][2][1], [shen_type_cons, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_profile_func), V4826[2][1]), V4826[2][2][1]), [shen_type_cons, G, V4826[2][2][1]]), []]]]]))
;});})(shen_tail_call(shen_gensym, [shen_type_symbol, "shen_f"])))
 : (shen_tail_call(shen_interror, "Cannot profile.~%")([])));
}
shen_profile_help;

function shen_unprofile(V4827) {
  if (V4827 == undefined) return shen_unprofile;
  return (shen_untrack(V4827));
}
shen_unprofile;

function shen_profile_func(V4828) {
  if (V4828 == undefined) return shen_profile_func;
  return (function lambda1638(V4829) {return (V4829 == undefined) ? lambda1638 : new Shen_tco_obj(function() {return (function lambda1637(V4830) {return (V4830 == undefined) ? lambda1637 : new Shen_tco_obj(function() {return [shen_type_cons, [shen_type_symbol, "let"], [shen_type_cons, [shen_type_symbol, "Start"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "get_time"], [shen_type_cons, [shen_type_symbol, "run"], []]], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "let"], [shen_type_cons, [shen_type_symbol, "Result"], [shen_type_cons, V4830, [shen_type_cons, [shen_type_cons, [shen_type_symbol, "let"], [shen_type_cons, [shen_type_symbol, "Finish"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "_"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "get_time"], [shen_type_cons, [shen_type_symbol, "run"], []]], [shen_type_cons, [shen_type_symbol, "Start"], []]]], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "let"], [shen_type_cons, [shen_type_symbol, "Record"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_put_profile"], [shen_type_cons, V4828, [shen_type_cons, [shen_type_cons, [shen_type_symbol, "$plus$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_get_profile"], [shen_type_cons, V4828, []]], [shen_type_cons, [shen_type_symbol, "Finish"], []]]], []]]], [shen_type_cons, [shen_type_symbol, "Result"], []]]]], []]]]], []]]]], []]]]];});});});});
}
shen_profile_func;

function shen_profile_results(V4831) {
  if (V4831 == undefined) return shen_profile_results;
  return ((function(Results) {return new Shen_tco_obj(function() {return ((function(Initialise) {return new Shen_tco_obj(function() {return [shen_tuple, V4831, Results];});})(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_put_profile), V4831), 0)))
;});})(shen_tail_call(shen_get_fn_js(shen_get_profile), V4831)))
;
}
shen_profile_results;

function shen_get_profile(V4832) {
  if (V4832 == undefined) return shen_get_profile;
  return new Shen_tco_obj(function() {return trap_error_js(function() {return shen_tail_call(shen_tail_call(shen_tail_call(shen_get, V4832), [shen_type_symbol, "profile"]), shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$property_vector$asterisk$"]));}, function(E) {return 0;});});
}
shen_get_profile;

function shen_put_profile(V4833) {
  if (V4833 == undefined) return shen_put_profile;
  return (function lambda1639(V4834) {return (V4834 == undefined) ? lambda1639 : new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_put, V4833), [shen_type_symbol, "profile"]), V4834)(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$property_vector$asterisk$"])));});});
}
shen_put_profile;



//## FILE js/declarations.js

(shen_globals[[shen_type_symbol, "shen_$asterisk$installing_kl$asterisk$"][1]] = false);

(shen_globals[[shen_type_symbol, "shen_$asterisk$history$asterisk$"][1]] = []);

(shen_globals[[shen_type_symbol, "shen_$asterisk$tc$asterisk$"][1]] = false);

(shen_globals[[shen_type_symbol, "shen_$asterisk$property_vector$asterisk$"][1]] = shen_tail_call(shen_vector, 20000));

(shen_globals[[shen_type_symbol, "shen_$asterisk$process_counter$asterisk$"][1]] = 0);

(shen_globals[[shen_type_symbol, "shen_$asterisk$varcounter$asterisk$"][1]] = shen_tail_call(shen_vector, 1000));

(shen_globals[[shen_type_symbol, "shen_$asterisk$prologvectors$asterisk$"][1]] = shen_tail_call(shen_vector, 1000));

(shen_globals[[shen_type_symbol, "shen_$asterisk$reader_macros$asterisk$"][1]] = []);

(shen_globals[[shen_type_symbol, "shen_$asterisk$gensym$asterisk$"][1]] = 0);

(shen_globals[[shen_type_symbol, "shen_$asterisk$tracking$asterisk$"][1]] = []);

(shen_globals[[shen_type_symbol, "$asterisk$home_directory$asterisk$"][1]] = "");

(shen_globals[[shen_type_symbol, "shen_$asterisk$alphabet$asterisk$"][1]] = [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "B"], [shen_type_cons, [shen_type_symbol, "C"], [shen_type_cons, [shen_type_symbol, "D"], [shen_type_cons, [shen_type_symbol, "E"], [shen_type_cons, [shen_type_symbol, "F"], [shen_type_cons, [shen_type_symbol, "G"], [shen_type_cons, [shen_type_symbol, "H"], [shen_type_cons, [shen_type_symbol, "I"], [shen_type_cons, [shen_type_symbol, "J"], [shen_type_cons, [shen_type_symbol, "K"], [shen_type_cons, [shen_type_symbol, "L"], [shen_type_cons, [shen_type_symbol, "M"], [shen_type_cons, [shen_type_symbol, "N"], [shen_type_cons, [shen_type_symbol, "O"], [shen_type_cons, [shen_type_symbol, "P"], [shen_type_cons, [shen_type_symbol, "Q"], [shen_type_cons, [shen_type_symbol, "R"], [shen_type_cons, [shen_type_symbol, "S"], [shen_type_cons, [shen_type_symbol, "T"], [shen_type_cons, [shen_type_symbol, "U"], [shen_type_cons, [shen_type_symbol, "V"], [shen_type_cons, [shen_type_symbol, "W"], [shen_type_cons, [shen_type_symbol, "X"], [shen_type_cons, [shen_type_symbol, "Y"], [shen_type_cons, [shen_type_symbol, "Z"], []]]]]]]]]]]]]]]]]]]]]]]]]]]);

(shen_globals[[shen_type_symbol, "shen_$asterisk$special$asterisk$"][1]] = [shen_type_cons, [shen_type_symbol, "$at$p"], [shen_type_cons, [shen_type_symbol, "$at$s"], [shen_type_cons, [shen_type_symbol, "$at$v"], [shen_type_cons, [shen_type_symbol, "cons"], [shen_type_cons, [shen_type_symbol, "lambda"], [shen_type_cons, [shen_type_symbol, "let"], [shen_type_cons, [shen_type_symbol, "type"], [shen_type_cons, [shen_type_symbol, "where"], [shen_type_cons, [shen_type_symbol, "input$plus$"], [shen_type_cons, [shen_type_symbol, "set"], [shen_type_cons, [shen_type_symbol, "open"], []]]]]]]]]]]]);

(shen_globals[[shen_type_symbol, "shen_$asterisk$extraspecial$asterisk$"][1]] = [shen_type_cons, [shen_type_symbol, "define"], [shen_type_cons, [shen_type_symbol, "shen_process_datatype"], []]]);

(shen_globals[[shen_type_symbol, "shen_$asterisk$spy$asterisk$"][1]] = false);

(shen_globals[[shen_type_symbol, "shen_$asterisk$datatypes$asterisk$"][1]] = []);

(shen_globals[[shen_type_symbol, "shen_$asterisk$alldatatypes$asterisk$"][1]] = []);

(shen_globals[[shen_type_symbol, "shen_$asterisk$synonyms$asterisk$"][1]] = []);

(shen_globals[[shen_type_symbol, "shen_$asterisk$system$asterisk$"][1]] = []);

(shen_globals[[shen_type_symbol, "shen_$asterisk$signedfuncs$asterisk$"][1]] = []);

(shen_globals[[shen_type_symbol, "shen_$asterisk$hush$asterisk$"][1]] = false);

(shen_globals[[shen_type_symbol, "shen_$asterisk$maxcomplexity$asterisk$"][1]] = 128);

(shen_globals[[shen_type_symbol, "shen_$asterisk$occurs$asterisk$"][1]] = true);

(shen_globals[[shen_type_symbol, "shen_$asterisk$maxinferences$asterisk$"][1]] = 1000000);

(shen_globals[[shen_type_symbol, "$asterisk$maximum_print_sequence_size$asterisk$"][1]] = 20);

(shen_globals[[shen_type_symbol, "shen_$asterisk$catch$asterisk$"][1]] = 0);

function shen_initialise$_arity$_table(V2440) {
  if (V2440 == undefined) return shen_initialise$_arity$_table;
  return (((shen_empty$question$_js(V2440))) ? [] : (((shen_is_type_js(V2440, shen_type_cons) && shen_is_type_js(V2440[2], shen_type_cons))) ? ((function(DecArity) {return new Shen_tco_obj(function() {return (shen_get_fn_js(shen_initialise$_arity$_table)(V2440[2][2]));});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_put, V2440[1]), [shen_type_symbol, "arity"]), V2440[2][1]), shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$property_vector$asterisk$"]))))
 : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_initialise$_arity$_table"]))));
}
shen_initialise$_arity$_table;

function shen_arity(V2441) {
  if (V2441 == undefined) return shen_arity;
  return new Shen_tco_obj(function() {return trap_error_js(function() {return shen_tail_call(shen_tail_call(shen_tail_call(shen_get, V2441), [shen_type_symbol, "arity"]), shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$property_vector$asterisk$"]));}, function(E) {return -1;});});
}
shen_arity;

function shen_adjoin(V2443) {
  if (V2443 == undefined) return shen_adjoin;
  return (function lambda1419(V2444) {return (V2444 == undefined) ? lambda1419 : new Shen_tco_obj(function() {return ((shen_tail_call(shen_tail_call(shen_element$question$, V2443), V2444)) ? V2444 : [shen_type_cons, V2443, V2444]);});});
}
shen_adjoin;

shen_tail_call(shen_get_fn_js(shen_initialise$_arity$_table), [shen_type_cons, [shen_type_symbol, "adjoin"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "and"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "append"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "apply"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "arity"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "assoc"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "boolean$question$"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "cd"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "compile"], [shen_type_cons, 3, [shen_type_cons, [shen_type_symbol, "concat"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "cons"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "cons$question$"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "cn"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "declare"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "destroy"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "difference"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "shen_do"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "dump"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "element$question$"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "empty$question$"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "interror"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "eval"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "explode"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "external"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "fail_if"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "fail"], [shen_type_cons, 0, [shen_type_cons, [shen_type_symbol, "fix"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "findall"], [shen_type_cons, 5, [shen_type_cons, [shen_type_symbol, "freeze"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "fst"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "gensym"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "get"], [shen_type_cons, 3, [shen_type_cons, [shen_type_symbol, "address_$gt$"], [shen_type_cons, 3, [shen_type_cons, [shen_type_symbol, "$lt$_address"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "$lt$_vector"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "$gt$"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "$gt$$eq$"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "$eq$"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "hd"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "hdv"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "hdstr"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "head"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "shen_if"], [shen_type_cons, 3, [shen_type_cons, [shen_type_symbol, "integer$question$"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "identical"], [shen_type_cons, 4, [shen_type_cons, [shen_type_symbol, "inferences"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "intoutput"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "make_string"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "intersection"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "length"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "lineread"], [shen_type_cons, 0, [shen_type_cons, [shen_type_symbol, "load"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "$lt$"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "$lt$$eq$"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "vector"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "shen_macroexapnd"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "map"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "mapcan"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "intmake_string"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "maxinferences"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "not"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "nth"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "n_$gt$string"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "number$question$"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "output"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "occurs_check"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "occurrences"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "occurs_check"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "or"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "package"], [shen_type_cons, 3, [shen_type_cons, [shen_type_symbol, "print"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "profile"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "profile_results"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "ps"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "preclude"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "preclude_all_but"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "address_$gt$"], [shen_type_cons, 3, [shen_type_cons, [shen_type_symbol, "put"], [shen_type_cons, 4, [shen_type_cons, [shen_type_symbol, "shen_reassemble"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "read_file_as_string"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "read_file"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "read_byte"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "remove"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "reverse"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "set"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "simple_error"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "snd"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "specialise"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "spy"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "step"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "string$question$"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "strong_warning"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "subst"], [shen_type_cons, 3, [shen_type_cons, [shen_type_symbol, "symbol$question$"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "tail"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "tl"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "tc"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "tc$question$"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "thaw"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "track"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "trap_error"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "tuple$question$"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "type"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "shen_return"], [shen_type_cons, 3, [shen_type_cons, [shen_type_symbol, "unprofile"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "unify"], [shen_type_cons, 4, [shen_type_cons, [shen_type_symbol, "unify$excl$"], [shen_type_cons, 4, [shen_type_cons, [shen_type_symbol, "union"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "untrack"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "unspecialise"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "vector"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "vector_$gt$"], [shen_type_cons, 3, [shen_type_cons, [shen_type_symbol, "value"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "variable$question$"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "version"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "warn"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "write_to_file"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "y_or_n$question$"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "$plus$"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "$asterisk$"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "$slash$"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "_"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "$eq$$eq$"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "$at$p"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "$at$v"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "$at$s"], [shen_type_cons, 2, [shen_type_cons, [shen_type_symbol, "preclude"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "include"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "preclude_all_but"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "include_all_but"], [shen_type_cons, 1, [shen_type_cons, [shen_type_symbol, "where"], [shen_type_cons, 2, []]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]);
;

function shen_systemf(V2442) {
  if (V2442 == undefined) return shen_systemf;
  return (shen_globals[[shen_type_symbol, "shen_$asterisk$system$asterisk$"][1]] = shen_tail_call(shen_tail_call(shen_adjoin, V2442), shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$system$asterisk$"])));
}
shen_systemf;

shen_tail_call(shen_tail_call(shen_map, shen_systemf), [shen_type_cons, [shen_type_symbol, "$excl$"], [shen_type_cons, [shen_type_symbol, "$cbraceclose$"], [shen_type_cons, [shen_type_symbol, "$cbraceopen$"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "$lt$__"], [shen_type_cons, [shen_type_symbol, "$amp$$amp$"], [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_symbol, "$sc$"], [shen_type_cons, [shen_type_symbol, "$colon$_"], [shen_type_cons, [shen_type_symbol, "$colon$$eq$"], [shen_type_cons, [shen_type_symbol, "$_"], [shen_type_cons, [shen_type_symbol, "_s_"], [shen_type_cons, [shen_type_symbol, "_o_"], [shen_type_cons, [shen_type_symbol, "_$asterisk$_"], [shen_type_cons, [shen_type_symbol, "$asterisk$language$asterisk$"], [shen_type_cons, [shen_type_symbol, "$asterisk$implementation$asterisk$"], [shen_type_cons, [shen_type_symbol, "$asterisk$stinput$asterisk$"], [shen_type_cons, [shen_type_symbol, "$asterisk$stoutput$asterisk$"], [shen_type_cons, [shen_type_symbol, "$asterisk$home_directory$asterisk$"], [shen_type_cons, [shen_type_symbol, "$asterisk$version$asterisk$"], [shen_type_cons, [shen_type_symbol, "$asterisk$maximum_print_sequence_size$asterisk$"], [shen_type_cons, [shen_type_symbol, "$asterisk$printer$asterisk$"], [shen_type_cons, [shen_type_symbol, "$asterisk$macros$asterisk$"], [shen_type_cons, [shen_type_symbol, "$at$v"], [shen_type_cons, [shen_type_symbol, "$at$p"], [shen_type_cons, [shen_type_symbol, "$at$s"], [shen_type_cons, [shen_type_symbol, "$lt$_"], [shen_type_cons, [shen_type_symbol, "_$gt$"], [shen_type_cons, [shen_type_symbol, "$lt$e$gt$"], [shen_type_cons, [shen_type_symbol, "$eq$$eq$"], [shen_type_cons, [shen_type_symbol, "$eq$"], [shen_type_cons, [shen_type_symbol, "$gt$$eq$"], [shen_type_cons, [shen_type_symbol, "$gt$"], [shen_type_cons, [shen_type_symbol, "$slash$$dot$"], [shen_type_cons, [shen_type_symbol, "$eq$$excl$"], [shen_type_cons, [shen_type_symbol, "_"], [shen_type_cons, [shen_type_symbol, "$slash$"], [shen_type_cons, [shen_type_symbol, "$asterisk$"], [shen_type_cons, [shen_type_symbol, "$plus$"], [shen_type_cons, [shen_type_symbol, "$lt$$eq$"], [shen_type_cons, [shen_type_symbol, "$lt$"], [shen_type_cons, [shen_type_symbol, "$gt$$gt$"], [shen_type_cons, [shen_type_symbol, "y_or_n$question$"], [shen_type_cons, [shen_type_symbol, "write_to_file"], [shen_type_cons, [shen_type_symbol, "where"], [shen_type_cons, [shen_type_symbol, "when"], [shen_type_cons, [shen_type_symbol, "warn"], [shen_type_cons, [shen_type_symbol, "version"], [shen_type_cons, [shen_type_symbol, "verified"], [shen_type_cons, [shen_type_symbol, "variable$question$"], [shen_type_cons, [shen_type_symbol, "value"], [shen_type_cons, [shen_type_symbol, "vector_$gt$"], [shen_type_cons, [shen_type_symbol, "$lt$_vector"], [shen_type_cons, [shen_type_symbol, "vector"], [shen_type_cons, [shen_type_symbol, "vector$question$"], [shen_type_cons, [shen_type_symbol, "unspecialise"], [shen_type_cons, [shen_type_symbol, "untrack"], [shen_type_cons, [shen_type_symbol, "union"], [shen_type_cons, [shen_type_symbol, "unify"], [shen_type_cons, [shen_type_symbol, "unify$excl$"], [shen_type_cons, [shen_type_symbol, "unprofile"], [shen_type_cons, [shen_type_symbol, "shen_return"], [shen_type_cons, [shen_type_symbol, "type"], [shen_type_cons, [shen_type_symbol, "tuple$question$"], [shen_type_cons, true, [shen_type_cons, [shen_type_symbol, "trap_error"], [shen_type_cons, [shen_type_symbol, "track"], [shen_type_cons, [shen_type_symbol, "time"], [shen_type_cons, [shen_type_symbol, "thaw"], [shen_type_cons, [shen_type_symbol, "tc$question$"], [shen_type_cons, [shen_type_symbol, "tc"], [shen_type_cons, [shen_type_symbol, "tl"], [shen_type_cons, [shen_type_symbol, "tlstr"], [shen_type_cons, [shen_type_symbol, "tlv"], [shen_type_cons, [shen_type_symbol, "tail"], [shen_type_cons, [shen_type_symbol, "systemf"], [shen_type_cons, [shen_type_symbol, "synonyms"], [shen_type_cons, [shen_type_symbol, "symbol"], [shen_type_cons, [shen_type_symbol, "symbol$question$"], [shen_type_cons, [shen_type_symbol, "sum"], [shen_type_cons, [shen_type_symbol, "subst"], [shen_type_cons, [shen_type_symbol, "string$question$"], [shen_type_cons, [shen_type_symbol, "stream"], [shen_type_cons, [shen_type_symbol, "string"], [shen_type_cons, [shen_type_symbol, "stoutput"], [shen_type_cons, [shen_type_symbol, "stinput"], [shen_type_cons, [shen_type_symbol, "step"], [shen_type_cons, [shen_type_symbol, "spy"], [shen_type_cons, [shen_type_symbol, "specialise"], [shen_type_cons, [shen_type_symbol, "snd"], [shen_type_cons, [shen_type_symbol, "simple_error"], [shen_type_cons, [shen_type_symbol, "set"], [shen_type_cons, [shen_type_symbol, "save"], [shen_type_cons, [shen_type_symbol, "str"], [shen_type_cons, [shen_type_symbol, "reverse"], [shen_type_cons, [shen_type_symbol, "remove"], [shen_type_cons, [shen_type_symbol, "read"], [shen_type_cons, [shen_type_symbol, "read_file"], [shen_type_cons, [shen_type_symbol, "read_file_as_bytelist"], [shen_type_cons, [shen_type_symbol, "read_file_as_string"], [shen_type_cons, [shen_type_symbol, "read_byte"], [shen_type_cons, [shen_type_symbol, "quit"], [shen_type_cons, [shen_type_symbol, "put"], [shen_type_cons, [shen_type_symbol, "preclude"], [shen_type_cons, [shen_type_symbol, "preclude_all_but"], [shen_type_cons, [shen_type_symbol, "ps"], [shen_type_cons, [shen_type_symbol, "prolog$question$"], [shen_type_cons, [shen_type_symbol, "profile_results"], [shen_type_cons, [shen_type_symbol, "profile"], [shen_type_cons, [shen_type_symbol, "print"], [shen_type_cons, [shen_type_symbol, "pr"], [shen_type_cons, [shen_type_symbol, "pos"], [shen_type_cons, [shen_type_symbol, "package"], [shen_type_cons, [shen_type_symbol, "output"], [shen_type_cons, [shen_type_symbol, "out"], [shen_type_cons, [shen_type_symbol, "or"], [shen_type_cons, [shen_type_symbol, "open"], [shen_type_cons, [shen_type_symbol, "occurrences"], [shen_type_cons, [shen_type_symbol, "occurs_check"], [shen_type_cons, [shen_type_symbol, "n_$gt$string"], [shen_type_cons, [shen_type_symbol, "number$question$"], [shen_type_cons, [shen_type_symbol, "number"], [shen_type_cons, [shen_type_symbol, "null"], [shen_type_cons, [shen_type_symbol, "nth"], [shen_type_cons, [shen_type_symbol, "not"], [shen_type_cons, [shen_type_symbol, "nl"], [shen_type_cons, [shen_type_symbol, "mode"], [shen_type_cons, [shen_type_symbol, "macro"], [shen_type_cons, [shen_type_symbol, "macroexpand"], [shen_type_cons, [shen_type_symbol, "maxinferences"], [shen_type_cons, [shen_type_symbol, "mapcan"], [shen_type_cons, [shen_type_symbol, "map"], [shen_type_cons, [shen_type_symbol, "make_string"], [shen_type_cons, [shen_type_symbol, "load"], [shen_type_cons, [shen_type_symbol, "loaded"], [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "lineread"], [shen_type_cons, [shen_type_symbol, "limit"], [shen_type_cons, [shen_type_symbol, "length"], [shen_type_cons, [shen_type_symbol, "let"], [shen_type_cons, [shen_type_symbol, "lazy"], [shen_type_cons, [shen_type_symbol, "lambda"], [shen_type_cons, [shen_type_symbol, "is"], [shen_type_cons, [shen_type_symbol, "intersection"], [shen_type_cons, [shen_type_symbol, "inferences"], [shen_type_cons, [shen_type_symbol, "intern"], [shen_type_cons, [shen_type_symbol, "integer$question$"], [shen_type_cons, [shen_type_symbol, "input"], [shen_type_cons, [shen_type_symbol, "input$plus$"], [shen_type_cons, [shen_type_symbol, "include"], [shen_type_cons, [shen_type_symbol, "include_all_but"], [shen_type_cons, [shen_type_symbol, "shen_in"], [shen_type_cons, [shen_type_symbol, "shen_if"], [shen_type_cons, [shen_type_symbol, "identical"], [shen_type_cons, [shen_type_symbol, "head"], [shen_type_cons, [shen_type_symbol, "hd"], [shen_type_cons, [shen_type_symbol, "hdv"], [shen_type_cons, [shen_type_symbol, "hdstr"], [shen_type_cons, [shen_type_symbol, "hash"], [shen_type_cons, [shen_type_symbol, "get"], [shen_type_cons, [shen_type_symbol, "get_time"], [shen_type_cons, [shen_type_symbol, "gensym"], [shen_type_cons, [shen_type_symbol, "shen_function"], [shen_type_cons, [shen_type_symbol, "fst"], [shen_type_cons, [shen_type_symbol, "freeze"], [shen_type_cons, [shen_type_symbol, "format"], [shen_type_cons, [shen_type_symbol, "fix"], [shen_type_cons, [shen_type_symbol, "file"], [shen_type_cons, [shen_type_symbol, "fail"], [shen_type_cons, [shen_type_symbol, "fail_if"], [shen_type_cons, [shen_type_symbol, "fwhen"], [shen_type_cons, [shen_type_symbol, "findall"], [shen_type_cons, false, [shen_type_cons, [shen_type_symbol, "explode"], [shen_type_cons, [shen_type_symbol, "external"], [shen_type_cons, [shen_type_symbol, "exception"], [shen_type_cons, [shen_type_symbol, "eval_without_macros"], [shen_type_cons, [shen_type_symbol, "eval"], [shen_type_cons, [shen_type_symbol, "error_to_string"], [shen_type_cons, [shen_type_symbol, "error"], [shen_type_cons, [shen_type_symbol, "empty$question$"], [shen_type_cons, [shen_type_symbol, "element$question$"], [shen_type_cons, [shen_type_symbol, "dump"], [shen_type_cons, [shen_type_symbol, "dumped"], [shen_type_cons, [shen_type_symbol, "shen_do"], [shen_type_cons, [shen_type_symbol, "difference"], [shen_type_cons, [shen_type_symbol, "destroy"], [shen_type_cons, [shen_type_symbol, "defun"], [shen_type_cons, [shen_type_symbol, "define"], [shen_type_cons, [shen_type_symbol, "defmacro"], [shen_type_cons, [shen_type_symbol, "defcc"], [shen_type_cons, [shen_type_symbol, "defprolog"], [shen_type_cons, [shen_type_symbol, "declare"], [shen_type_cons, [shen_type_symbol, "datatype"], [shen_type_cons, [shen_type_symbol, "cut"], [shen_type_cons, [shen_type_symbol, "cn"], [shen_type_cons, [shen_type_symbol, "cons$question$"], [shen_type_cons, [shen_type_symbol, "cons"], [shen_type_cons, [shen_type_symbol, "cond"], [shen_type_cons, [shen_type_symbol, "concat"], [shen_type_cons, [shen_type_symbol, "compile"], [shen_type_cons, [shen_type_symbol, "cd"], [shen_type_cons, [shen_type_symbol, "cases"], [shen_type_cons, [shen_type_symbol, "call"], [shen_type_cons, [shen_type_symbol, "close"], [shen_type_cons, [shen_type_symbol, "bind"], [shen_type_cons, [shen_type_symbol, "bound$question$"], [shen_type_cons, [shen_type_symbol, "boolean$question$"], [shen_type_cons, [shen_type_symbol, "boolean"], [shen_type_cons, [shen_type_symbol, "assoc"], [shen_type_cons, [shen_type_symbol, "arity"], [shen_type_cons, [shen_type_symbol, "apply"], [shen_type_cons, [shen_type_symbol, "append"], [shen_type_cons, [shen_type_symbol, "and"], [shen_type_cons, [shen_type_symbol, "adjoin"], [shen_type_cons, [shen_type_symbol, "$lt$_address"], [shen_type_cons, [shen_type_symbol, "address_$gt$"], [shen_type_cons, [shen_type_symbol, "absvector$question$"], [shen_type_cons, [shen_type_symbol, "absvector"], [shen_type_cons, [shen_type_symbol, "abort"], [shen_type_cons, [shen_type_symbol, "intmake_string"], [shen_type_cons, [shen_type_symbol, "intoutput"], [shen_type_cons, [shen_type_symbol, "interror"], []]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]);
;

function shen_specialise(V2445) {
  if (V2445 == undefined) return shen_specialise;
  return ((shen_globals[[shen_type_symbol, "shen_$asterisk$special$asterisk$"][1]] = [shen_type_cons, V2445, shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$special$asterisk$"])]),
  V2445);
}
shen_specialise;

function shen_unspecialise(V2446) {
  if (V2446 == undefined) return shen_unspecialise;
  return ((shen_globals[[shen_type_symbol, "shen_$asterisk$special$asterisk$"][1]] = shen_tail_call(shen_tail_call(shen_remove, V2446), shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$special$asterisk$"]))),
  V2446);
}
shen_unspecialise;



//## FILE js/load.js

function shen_load(V2453) {
  if (V2453 == undefined) return shen_load;
  return ((function(Load) {return new Shen_tco_obj(function() {return ((function(Infs) {return new Shen_tco_obj(function() {return [shen_type_symbol, "loaded"];});})(((shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$tc$asterisk$"])) ? shen_tail_call(shen_tail_call(shen_intoutput, "~%typechecked in ~A inferences~%"), [shen_tuple, shen_tail_call(shen_inferences, [shen_type_symbol, "$_"]), []]) : [shen_type_symbol, "shen_skip"])))
;});})(shen_tail_call((function(Start) {return new Shen_tco_obj(function() {return shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return shen_tail_call((function(Finish) {return new Shen_tco_obj(function() {return shen_tail_call((function(Time) {return new Shen_tco_obj(function() {return shen_tail_call((function(Message) {return new Shen_tco_obj(function() {return Result;});}), shen_tail_call(shen_tail_call(shen_intoutput, "~%run time: ~A secs~%"), [shen_tuple, Time, []]))
;});}), (Finish - Start))
;});}), shen_tail_call(shen_get_time, [shen_type_symbol, "run"]))
;});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_load_help), shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$tc$asterisk$"])), shen_tail_call(shen_read_file, V2453)))
;});}), shen_tail_call(shen_get_time, [shen_type_symbol, "run"]))
))
;
}
shen_load;

function shen_load_help(V2458) {
  if (V2458 == undefined) return shen_load_help;
  return (function lambda1421(V2459) {return (V2459 == undefined) ? lambda1421 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(false, V2458);})) ? (shen_tail_call(shen_map, (function lambda1420(X) {return (X == undefined) ? lambda1420 : new Shen_tco_obj(function() {return (shen_tail_call(shen_intoutput, "~S~%")([shen_tuple, shen_tail_call(shen_eval_without_macros, X), []]));});}))(V2459)) : ((function(RemoveSynonyms) {return new Shen_tco_obj(function() {return ((function(Table) {return new Shen_tco_obj(function() {return ((function(Assume) {return new Shen_tco_obj(function() {return new Shen_tco_obj(function() {return trap_error_js(function() {return shen_tail_call(shen_tail_call(shen_map, shen_typecheck_and_load), RemoveSynonyms);}, function(E) {return shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unwind_types), E), Table);});});});})(shen_tail_call(shen_tail_call(shen_map, shen_assumetype), Table)))
;});})(shen_tail_call(shen_tail_call(shen_mapcan, shen_typetable), RemoveSynonyms)))
;});})(shen_tail_call(shen_tail_call(shen_mapcan, shen_remove_synonyms), V2459)))
);});});
}
shen_load_help;

function shen_remove_synonyms(V2460) {
  if (V2460 == undefined) return shen_remove_synonyms;
  return (((shen_is_type_js(V2460, shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_synonyms_help"], V2460[1]);}))) ? (shen_tail_call(shen_eval, V2460),
  []) : [shen_type_cons, V2460, []]);
}
shen_remove_synonyms;

function shen_typecheck_and_load(V2461) {
  if (V2461 == undefined) return shen_typecheck_and_load;
  return (shen_tail_call(shen_nl, 1),
  (shen_tail_call(shen_get_fn_js(shen_typecheck_and_evaluate), V2461)(shen_tail_call(shen_gensym, [shen_type_symbol, "A"]))));
}
shen_typecheck_and_load;

function shen_typetable(V2466) {
  if (V2466 == undefined) return shen_typetable;
  return (((shen_is_type_js(V2466, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "define"], V2466[1]);}) && shen_is_type_js(V2466[2], shen_type_cons)))) ? ((function(Sig) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Sig, shen_fail_obj);})) ? (shen_tail_call(shen_interror, "~A lacks a proper signature.~%")([shen_tuple, V2466[2][1], []])) : [shen_type_cons, [shen_type_cons, V2466[2][1], Sig], []]);});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_compile, shen_$lt$sig$plus$rest$gt$), V2466[2][2]), [])))
 : []);
}
shen_typetable;

function shen_assumetype(V2467) {
  if (V2467 == undefined) return shen_assumetype;
  return ((shen_is_type_js(V2467, shen_type_cons)) ? (shen_tail_call(declare, V2467[1])(V2467[2])) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_assumetype"])));
}
shen_assumetype;

function shen_unwind_types(V2472) {
  if (V2472 == undefined) return shen_unwind_types;
  return (function lambda1422(V2473) {return (V2473 == undefined) ? lambda1422 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V2473))) ? (shen_simple_error(shen_tail_call(shen_error_to_string, V2472))) : (((shen_is_type_js(V2473, shen_type_cons) && shen_is_type_js(V2473[1], shen_type_cons))) ? (shen_tail_call(shen_get_fn_js(shen_remtype), V2473[1][1]),
  (shen_tail_call(shen_get_fn_js(shen_unwind_types), V2472)(V2473[2]))) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_unwind_types"]))));});});
}
shen_unwind_types;

function shen_remtype(V2474) {
  if (V2474 == undefined) return shen_remtype;
  return ((shen_globals[[shen_type_symbol, "shen_$asterisk$signedfuncs$asterisk$"][1]] = shen_tail_call(shen_tail_call(shen_remove, V2474), shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$signedfuncs$asterisk$"]))),
  V2474);
}
shen_remtype;

function shen_$lt$sig$plus$rest$gt$(V2479) {
  if (V2479 == undefined) return shen_$lt$sig$plus$rest$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$signature$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$signature$gt$);}))) ? shen_tail_call((function(Parse$_$lt$any$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$any$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$any$gt$)), shen_tail_call(shen_snd, Parse$_$lt$signature$gt$)) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$any$gt$), Parse$_$lt$signature$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$signature$gt$), V2479))
))
;
}
shen_$lt$sig$plus$rest$gt$;

function shen_dump(V2480) {
  if (V2480 == undefined) return shen_dump;
  return ((function(Shen) {return new Shen_tco_obj(function() {return ((function(KL) {return new Shen_tco_obj(function() {return ((function(ObjectFile) {return new Shen_tco_obj(function() {return ((function(Stream) {return new Shen_tco_obj(function() {return ((function(Dump) {return new Shen_tco_obj(function() {return ((function(Close) {return new Shen_tco_obj(function() {return ObjectFile;});})(shen_tail_call(shen_close, Stream)))
;});})(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_write_object_code_to_file), Stream), KL)))
;});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_open, [shen_type_symbol, "file"]), ObjectFile), [shen_type_symbol, "out"])))
;});})((V2480 + ".kl")))
;});})(shen_tail_call(shen_tail_call(shen_map, shen_out), Shen)))
;});})(shen_tail_call(shen_read_file, (V2480 + ".shen"))))
;
}
shen_dump;

function shen_out(V2481) {
  if (V2481 == undefined) return shen_out;
  return (((shen_is_type_js(V2481, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "define"], V2481[1]);}) && shen_is_type_js(V2481[2], shen_type_cons)))) ? (shen_tail_call(shen_get_fn_js(shen_$gt$kl), V2481[2][1])(V2481[2][2])) : V2481);
}
shen_out;

function shen_write_object_code_to_file(V2482) {
  if (V2482 == undefined) return shen_write_object_code_to_file;
  return (function lambda1424(V2483) {return (V2483 == undefined) ? lambda1424 : new Shen_tco_obj(function() {return ((function(MaxPrS) {return new Shen_tco_obj(function() {return ((shen_globals[[shen_type_symbol, "$asterisk$maximum_print_sequence_size$asterisk$"][1]] = -1),
  (shen_tail_call(shen_tail_call(shen_map, (function lambda1423(X) {return (X == undefined) ? lambda1423 : new Shen_tco_obj(function() {return ((function(String) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_pr, String)(V2482));});})(shen_tail_call(shen_tail_call(shen_intmake_string, "~R~%~%"), [shen_tuple, X, []])))
;});})), V2483),
  (shen_globals[[shen_type_symbol, "$asterisk$maximum_print_sequence_size$asterisk$"][1]] = MaxPrS)));});})(shen_tail_call(shen_value, [shen_type_symbol, "$asterisk$maximum_print_sequence_size$asterisk$"])))
;});});
}
shen_write_object_code_to_file;

function shen_write_to_file(V2484) {
  if (V2484 == undefined) return shen_write_to_file;
  return (function lambda1425(V2485) {return (V2485 == undefined) ? lambda1425 : new Shen_tco_obj(function() {return ((function(AbsPath) {return new Shen_tco_obj(function() {return ((function(Stream) {return new Shen_tco_obj(function() {return ((function(String) {return new Shen_tco_obj(function() {return ((function(Write) {return new Shen_tco_obj(function() {return ((function(Close) {return new Shen_tco_obj(function() {return V2485;});})(shen_tail_call(shen_close, Stream)))
;});})(shen_tail_call(shen_tail_call(shen_pr, String), Stream)))
;});})(shen_tail_call(shen_tail_call(shen_intmake_string, "~S~%~%"), [shen_tuple, V2485, []])))
;});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_open, [shen_type_symbol, "file"]), AbsPath), [shen_type_symbol, "out"])))
;});})(shen_tail_call(shen_tail_call(shen_intmake_string, "~A~A"), [shen_tuple, shen_tail_call(shen_value, [shen_type_symbol, "$asterisk$home_directory$asterisk$"]), [shen_tuple, V2484, []]])))
;});});
}
shen_write_to_file;



//## FILE js/macros.js

function shen_macroexpand(V2508) {
  if (V2508 == undefined) return shen_macroexpand;
  return ((function(Y) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(V2508, Y);})) ? V2508 : (shen_tail_call(shen_get_fn_js(shen_walk), shen_macroexpand)(Y)));});})(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_compose), shen_tail_call(shen_value, [shen_type_symbol, "$asterisk$macros$asterisk$"])), V2508)))
;
}
shen_macroexpand;

function shen_compose(V2509) {
  if (V2509 == undefined) return shen_compose;
  return (function lambda1426(V2510) {return (V2510 == undefined) ? lambda1426 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V2509))) ? V2510 : ((shen_is_type_js(V2509, shen_type_cons)) ? (shen_tail_call(shen_get_fn_js(shen_compose), V2509[2])(shen_tail_call(V2509[1], V2510))) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_compose"]))));});});
}
shen_compose;

function shen_compile_macro(V2511) {
  if (V2511 == undefined) return shen_compile_macro;
  return (((shen_is_type_js(V2511, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "compile"], V2511[1]);}) && (shen_is_type_js(V2511[2], shen_type_cons) && (shen_is_type_js(V2511[2][2], shen_type_cons) && (shen_empty$question$_js(V2511[2][2][2]))))))) ? [shen_type_cons, [shen_type_symbol, "compile"], [shen_type_cons, V2511[2][1], [shen_type_cons, V2511[2][2][1], [shen_type_cons, [], []]]]] : V2511);
}
shen_compile_macro;

function shen_prolog_macro(V2512) {
  if (V2512 == undefined) return shen_prolog_macro;
  return (((shen_is_type_js(V2512, shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "prolog$question$"], V2512[1]);}))) ? [shen_type_cons, [shen_type_symbol, "shen_intprolog"], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_prolog_form), V2512[2]), []]] : V2512);
}
shen_prolog_macro;

function shen_defprolog_macro(V2513) {
  if (V2513 == undefined) return shen_defprolog_macro;
  return (((shen_is_type_js(V2513, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "defprolog"], V2513[1]);}) && shen_is_type_js(V2513[2], shen_type_cons)))) ? (shen_tail_call(shen_tail_call(shen_compile, shen_$lt$defprolog$gt$), V2513[2])((function lambda1427(Y) {return (Y == undefined) ? lambda1427 : new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_prolog_error), V2513[2][1])(Y));});}))) : V2513);
}
shen_defprolog_macro;

function shen_prolog_form(V2514) {
  if (V2514 == undefined) return shen_prolog_form;
  return (shen_get_fn_js(shen_cons$_form)(shen_tail_call(shen_tail_call(shen_map, shen_cons$_form), V2514)));
}
shen_prolog_form;

function shen_datatype_macro(V2515) {
  if (V2515 == undefined) return shen_datatype_macro;
  return (((shen_is_type_js(V2515, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "datatype"], V2515[1]);}) && shen_is_type_js(V2515[2], shen_type_cons)))) ? [shen_type_cons, [shen_type_symbol, "shen_process_datatype"], [shen_type_cons, V2515[2][1], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "compile"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_function"], [shen_type_cons, [shen_type_symbol, "shen_$lt$datatype_rules$gt$"], []]], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_rcons$_form), V2515[2][2]), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "shen_function"], [shen_type_cons, [shen_type_symbol, "shen_datatype_error"], []]], []]]]], []]]] : V2515);
}
shen_datatype_macro;

function shen_defmacro_macro(V2516) {
  if (V2516 == undefined) return shen_defmacro_macro;
  return (((shen_is_type_js(V2516, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "defmacro"], V2516[1]);}) && shen_is_type_js(V2516[2], shen_type_cons)))) ? ((function(Macro) {return new Shen_tco_obj(function() {return ((function(Declare) {return new Shen_tco_obj(function() {return ((function(Package) {return new Shen_tco_obj(function() {return Package;});})([shen_type_cons, [shen_type_symbol, "package"], [shen_type_cons, [shen_type_symbol, "null"], [shen_type_cons, [], [shen_type_cons, Declare, [shen_type_cons, Macro, []]]]]]))
;});})([shen_type_cons, [shen_type_symbol, "shen_do"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "set"], [shen_type_cons, [shen_type_symbol, "$asterisk$macros$asterisk$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "adjoin"], [shen_type_cons, V2516[2][1], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "value"], [shen_type_cons, [shen_type_symbol, "$asterisk$macros$asterisk$"], []]], []]]], []]]], [shen_type_cons, [shen_type_symbol, "macro"], []]]]))
;});})([shen_type_cons, [shen_type_symbol, "define"], [shen_type_cons, V2516[2][1], shen_tail_call(shen_tail_call(shen_append, V2516[2][2]), [shen_type_cons, [shen_type_symbol, "X"], [shen_type_cons, [shen_type_symbol, "_$gt$"], [shen_type_cons, [shen_type_symbol, "X"], []]]])]]))
 : V2516);
}
shen_defmacro_macro;

function shen_$at$s_macro(V2517) {
  if (V2517 == undefined) return shen_$at$s_macro;
  return (((shen_is_type_js(V2517, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$at$s"], V2517[1]);}) && (shen_is_type_js(V2517[2], shen_type_cons) && (shen_is_type_js(V2517[2][2], shen_type_cons) && shen_is_type_js(V2517[2][2][2], shen_type_cons)))))) ? [shen_type_cons, [shen_type_symbol, "$at$s"], [shen_type_cons, V2517[2][1], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_$at$s_macro), [shen_type_cons, [shen_type_symbol, "$at$s"], V2517[2][2]]), []]]] : (((shen_is_type_js(V2517, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$at$s"], V2517[1]);}) && (shen_is_type_js(V2517[2], shen_type_cons) && (shen_is_type_js(V2517[2][2], shen_type_cons) && ((shen_empty$question$_js(V2517[2][2][2])) && (typeof(V2517[2][1]) == 'string'))))))) ? ((function(E) {return new Shen_tco_obj(function() {return (((shen_tail_call(shen_length, E) > 1)) ? (shen_get_fn_js(shen_$at$s_macro)([shen_type_cons, [shen_type_symbol, "$at$s"], shen_tail_call(shen_tail_call(shen_append, E), V2517[2][2])])) : V2517);});})(shen_tail_call(shen_explode, V2517[2][1])))
 : V2517));
}
shen_$at$s_macro;

function shen_synonyms_macro(V2518) {
  if (V2518 == undefined) return shen_synonyms_macro;
  return (((shen_is_type_js(V2518, shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "synonyms"], V2518[1]);}))) ? [shen_type_cons, [shen_type_symbol, "shen_synonyms_help"], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_rcons$_form), V2518[2]), []]] : V2518);
}
shen_synonyms_macro;

function shen_nl_macro(V2519) {
  if (V2519 == undefined) return shen_nl_macro;
  return (((shen_is_type_js(V2519, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "nl"], V2519[1]);}) && (shen_empty$question$_js(V2519[2]))))) ? [shen_type_cons, [shen_type_symbol, "nl"], [shen_type_cons, 1, []]] : V2519);
}
shen_nl_macro;

function shen_vector_macro(V2520) {
  if (V2520 == undefined) return shen_vector_macro;
  return ((shen_tail_call(function() {return shen_equal$question$_js(V2520, [shen_type_symbol, "$lt$$gt$"]);})) ? [shen_type_cons, [shen_type_symbol, "vector"], [shen_type_cons, 0, []]] : V2520);
}
shen_vector_macro;

function shen_yacc_macro(V2521) {
  if (V2521 == undefined) return shen_yacc_macro;
  return (((shen_is_type_js(V2521, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "defcc"], V2521[1]);}) && shen_is_type_js(V2521[2], shen_type_cons)))) ? (shen_tail_call(shen_get_fn_js(shen_yacc_$gt$shen), V2521[2][1])(V2521[2][2])) : V2521);
}
shen_yacc_macro;

function shen_assoc_macro(V2522) {
  if (V2522 == undefined) return shen_assoc_macro;
  return (((shen_is_type_js(V2522, shen_type_cons) && (shen_is_type_js(V2522[2], shen_type_cons) && (shen_is_type_js(V2522[2][2], shen_type_cons) && (shen_is_type_js(V2522[2][2][2], shen_type_cons) && shen_tail_call(shen_tail_call(shen_element$question$, V2522[1]), [shen_type_cons, [shen_type_symbol, "$at$p"], [shen_type_cons, [shen_type_symbol, "$at$v"], [shen_type_cons, [shen_type_symbol, "append"], [shen_type_cons, [shen_type_symbol, "and"], [shen_type_cons, [shen_type_symbol, "or"], [shen_type_cons, [shen_type_symbol, "$plus$"], [shen_type_cons, [shen_type_symbol, "$asterisk$"], [shen_type_cons, [shen_type_symbol, "shen_do"], []]]]]]]]])))))) ? [shen_type_cons, V2522[1], [shen_type_cons, V2522[2][1], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_assoc_macro), [shen_type_cons, V2522[1], V2522[2][2]]), []]]] : V2522);
}
shen_assoc_macro;

function shen_let_macro(V2523) {
  if (V2523 == undefined) return shen_let_macro;
  return (((shen_is_type_js(V2523, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "let"], V2523[1]);}) && (shen_is_type_js(V2523[2], shen_type_cons) && (shen_is_type_js(V2523[2][2], shen_type_cons) && (shen_is_type_js(V2523[2][2][2], shen_type_cons) && shen_is_type_js(V2523[2][2][2][2], shen_type_cons))))))) ? [shen_type_cons, [shen_type_symbol, "let"], [shen_type_cons, V2523[2][1], [shen_type_cons, V2523[2][2][1], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_let_macro), [shen_type_cons, [shen_type_symbol, "let"], V2523[2][2][2]]), []]]]] : V2523);
}
shen_let_macro;

function shen_abs_macro(V2524) {
  if (V2524 == undefined) return shen_abs_macro;
  return (((shen_is_type_js(V2524, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$slash$$dot$"], V2524[1]);}) && (shen_is_type_js(V2524[2], shen_type_cons) && (shen_is_type_js(V2524[2][2], shen_type_cons) && shen_is_type_js(V2524[2][2][2], shen_type_cons)))))) ? [shen_type_cons, [shen_type_symbol, "lambda"], [shen_type_cons, V2524[2][1], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_abs_macro), [shen_type_cons, [shen_type_symbol, "$slash$$dot$"], V2524[2][2]]), []]]] : (((shen_is_type_js(V2524, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$slash$$dot$"], V2524[1]);}) && (shen_is_type_js(V2524[2], shen_type_cons) && (shen_is_type_js(V2524[2][2], shen_type_cons) && (shen_empty$question$_js(V2524[2][2][2]))))))) ? [shen_type_cons, [shen_type_symbol, "lambda"], V2524[2]] : V2524));
}
shen_abs_macro;

function shen_cases_macro(V2527) {
  if (V2527 == undefined) return shen_cases_macro;
  return (((shen_is_type_js(V2527, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "cases"], V2527[1]);}) && (shen_is_type_js(V2527[2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js(true, V2527[2][1]);}) && shen_is_type_js(V2527[2][2], shen_type_cons)))))) ? V2527[2][2][1] : (((shen_is_type_js(V2527, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "cases"], V2527[1]);}) && (shen_is_type_js(V2527[2], shen_type_cons) && (shen_is_type_js(V2527[2][2], shen_type_cons) && (shen_empty$question$_js(V2527[2][2][2]))))))) ? [shen_type_cons, [shen_type_symbol, "shen_if"], [shen_type_cons, V2527[2][1], [shen_type_cons, V2527[2][2][1], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_i$slash$o_macro), [shen_type_cons, [shen_type_symbol, "error"], [shen_type_cons, "error: cases exhausted~%", []]]), []]]]] : (((shen_is_type_js(V2527, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "cases"], V2527[1]);}) && (shen_is_type_js(V2527[2], shen_type_cons) && shen_is_type_js(V2527[2][2], shen_type_cons))))) ? [shen_type_cons, [shen_type_symbol, "shen_if"], [shen_type_cons, V2527[2][1], [shen_type_cons, V2527[2][2][1], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_cases_macro), [shen_type_cons, [shen_type_symbol, "cases"], V2527[2][2][2]]), []]]]] : (((shen_is_type_js(V2527, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "cases"], V2527[1]);}) && (shen_is_type_js(V2527[2], shen_type_cons) && (shen_empty$question$_js(V2527[2][2])))))) ? (shen_tail_call(shen_interror, "error: odd number of case elements~%")([])) : V2527))));
}
shen_cases_macro;

function shen_timer_macro(V2528) {
  if (V2528 == undefined) return shen_timer_macro;
  return (((shen_is_type_js(V2528, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "time"], V2528[1]);}) && (shen_is_type_js(V2528[2], shen_type_cons) && (shen_empty$question$_js(V2528[2][2])))))) ? (shen_get_fn_js(shen_let_macro)([shen_type_cons, [shen_type_symbol, "let"], [shen_type_cons, [shen_type_symbol, "Start"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "get_time"], [shen_type_cons, [shen_type_symbol, "run"], []]], [shen_type_cons, [shen_type_symbol, "Result"], [shen_type_cons, V2528[2][1], [shen_type_cons, [shen_type_symbol, "Finish"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "get_time"], [shen_type_cons, [shen_type_symbol, "run"], []]], [shen_type_cons, [shen_type_symbol, "Time"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "_"], [shen_type_cons, [shen_type_symbol, "Finish"], [shen_type_cons, [shen_type_symbol, "Start"], []]]], [shen_type_cons, [shen_type_symbol, "Message"], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_i$slash$o_macro), [shen_type_cons, [shen_type_symbol, "output"], [shen_type_cons, "~%run time: ~A secs~%", [shen_type_cons, [shen_type_symbol, "Time"], []]]]), [shen_type_cons, [shen_type_symbol, "Result"], []]]]]]]]]]]]])) : V2528);
}
shen_timer_macro;

function shen_i$slash$o_macro(V2529) {
  if (V2529 == undefined) return shen_i$slash$o_macro;
  return (((shen_is_type_js(V2529, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "output"], V2529[1]);}) && shen_is_type_js(V2529[2], shen_type_cons)))) ? [shen_type_cons, [shen_type_symbol, "intoutput"], [shen_type_cons, V2529[2][1], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_tuple_up), V2529[2][2]), []]]] : (((shen_is_type_js(V2529, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "make_string"], V2529[1]);}) && shen_is_type_js(V2529[2], shen_type_cons)))) ? [shen_type_cons, [shen_type_symbol, "intmake_string"], [shen_type_cons, V2529[2][1], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_tuple_up), V2529[2][2]), []]]] : (((shen_is_type_js(V2529, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "error"], V2529[1]);}) && shen_is_type_js(V2529[2], shen_type_cons)))) ? [shen_type_cons, [shen_type_symbol, "interror"], [shen_type_cons, V2529[2][1], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_tuple_up), V2529[2][2]), []]]] : (((shen_is_type_js(V2529, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "pr"], V2529[1]);}) && (shen_is_type_js(V2529[2], shen_type_cons) && (shen_empty$question$_js(V2529[2][2])))))) ? [shen_type_cons, [shen_type_symbol, "pr"], [shen_type_cons, V2529[2][1], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "stoutput"], [shen_type_cons, 0, []]], []]]] : (((shen_is_type_js(V2529, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "read_byte"], V2529[1]);}) && (shen_empty$question$_js(V2529[2]))))) ? [shen_type_cons, [shen_type_symbol, "read_byte"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "stinput"], [shen_type_cons, 0, []]], []]] : V2529)))));
}
shen_i$slash$o_macro;

function shen_tuple_up(V2530) {
  if (V2530 == undefined) return shen_tuple_up;
  return ((shen_is_type_js(V2530, shen_type_cons)) ? [shen_type_cons, [shen_type_symbol, "$at$p"], [shen_type_cons, V2530[1], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_tuple_up), V2530[2]), []]]] : V2530);
}
shen_tuple_up;

function shen_put$slash$get_macro(V2531) {
  if (V2531 == undefined) return shen_put$slash$get_macro;
  return (((shen_is_type_js(V2531, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "put"], V2531[1]);}) && (shen_is_type_js(V2531[2], shen_type_cons) && (shen_is_type_js(V2531[2][2], shen_type_cons) && (shen_is_type_js(V2531[2][2][2], shen_type_cons) && (shen_empty$question$_js(V2531[2][2][2][2])))))))) ? [shen_type_cons, [shen_type_symbol, "put"], [shen_type_cons, V2531[2][1], [shen_type_cons, V2531[2][2][1], [shen_type_cons, V2531[2][2][2][1], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "value"], [shen_type_cons, [shen_type_symbol, "shen_$asterisk$property_vector$asterisk$"], []]], []]]]]] : (((shen_is_type_js(V2531, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "get"], V2531[1]);}) && (shen_is_type_js(V2531[2], shen_type_cons) && (shen_is_type_js(V2531[2][2], shen_type_cons) && (shen_empty$question$_js(V2531[2][2][2]))))))) ? [shen_type_cons, [shen_type_symbol, "get"], [shen_type_cons, V2531[2][1], [shen_type_cons, V2531[2][2][1], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "value"], [shen_type_cons, [shen_type_symbol, "shen_$asterisk$property_vector$asterisk$"], []]], []]]]] : V2531));
}
shen_put$slash$get_macro;

function shen_function_macro(V2532) {
  if (V2532 == undefined) return shen_function_macro;
  return (((shen_is_type_js(V2532, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_function"], V2532[1]);}) && (shen_is_type_js(V2532[2], shen_type_cons) && (shen_empty$question$_js(V2532[2][2])))))) ? (shen_tail_call(shen_get_fn_js(shen_function_abstraction), V2532[2][1])(shen_tail_call(shen_arity, V2532[2][1]))) : V2532);
}
shen_function_macro;

function shen_function_abstraction(V2533) {
  if (V2533 == undefined) return shen_function_abstraction;
  return (function lambda1428(V2534) {return (V2534 == undefined) ? lambda1428 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(0, V2534);})) ? [shen_type_cons, [shen_type_symbol, "freeze"], [shen_type_cons, V2533, []]] : ((shen_tail_call(function() {return shen_equal$question$_js(-1, V2534);})) ? V2533 : (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_function_abstraction_help), V2533), V2534)([]))));});});
}
shen_function_abstraction;

function shen_function_abstraction_help(V2535) {
  if (V2535 == undefined) return shen_function_abstraction_help;
  return (function lambda1430(V2536) {return (V2536 == undefined) ? lambda1430 : new Shen_tco_obj(function() {return (function lambda1429(V2537) {return (V2537 == undefined) ? lambda1429 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(0, V2536);})) ? [shen_type_cons, V2535, V2537] : ((function(X) {return new Shen_tco_obj(function() {return [shen_type_cons, [shen_type_symbol, "$slash$$dot$"], [shen_type_cons, X, [shen_type_cons, shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_function_abstraction_help), V2535), (V2536 - 1)), shen_tail_call(shen_tail_call(shen_append, V2537), [shen_type_cons, X, []])), []]]];});})(shen_tail_call(shen_gensym, [shen_type_symbol, "V"])))
);});});});});
}
shen_function_abstraction_help;

(shen_globals[[shen_type_symbol, "$asterisk$macros$asterisk$"][1]] = [shen_type_cons, shen_timer_macro, [shen_type_cons, shen_cases_macro, [shen_type_cons, shen_abs_macro, [shen_type_cons, shen_put$slash$get_macro, [shen_type_cons, shen_compile_macro, [shen_type_cons, shen_yacc_macro, [shen_type_cons, shen_datatype_macro, [shen_type_cons, shen_let_macro, [shen_type_cons, shen_assoc_macro, [shen_type_cons, shen_i$slash$o_macro, [shen_type_cons, shen_prolog_macro, [shen_type_cons, shen_synonyms_macro, [shen_type_cons, shen_nl_macro, [shen_type_cons, shen_vector_macro, [shen_type_cons, shen_$at$s_macro, [shen_type_cons, shen_defmacro_macro, [shen_type_cons, shen_defprolog_macro, []]]]]]]]]]]]]]]]]]);



//## FILE js/types.js

function declare(V5478) {
  if (V5478 == undefined) return declare;
  return (function lambda1716(V5479) {return (V5479 == undefined) ? lambda1716 : new Shen_tco_obj(function() {return ((function(Record) {return new Shen_tco_obj(function() {return ((function(Variancy) {return new Shen_tco_obj(function() {return ((function(Type) {return new Shen_tco_obj(function() {return ((function(F$asterisk$) {return new Shen_tco_obj(function() {return ((function(Parameters) {return new Shen_tco_obj(function() {return ((function(Clause) {return new Shen_tco_obj(function() {return ((function(AUM$_instruction) {return new Shen_tco_obj(function() {return ((function(Code) {return new Shen_tco_obj(function() {return ((function(ShenDef) {return new Shen_tco_obj(function() {return ((function(Eval) {return new Shen_tco_obj(function() {return V5478;});})(shen_tail_call(shen_eval_without_macros, ShenDef)))
;});})([shen_type_cons, [shen_type_symbol, "define"], [shen_type_cons, F$asterisk$, shen_tail_call(shen_tail_call(shen_append, Parameters), shen_tail_call(shen_tail_call(shen_append, [shen_type_cons, [shen_type_symbol, "ProcessN"], [shen_type_cons, [shen_type_symbol, "Continuation"], []]]), [shen_type_cons, [shen_type_symbol, "_$gt$"], [shen_type_cons, Code, []]]))]]))
;});})(shen_tail_call(shen_get_fn_js(shen_aum$_to$_shen), AUM$_instruction)))
;});})(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_aum), Clause), Parameters)))
;});})([shen_type_cons, [shen_type_cons, F$asterisk$, [shen_type_cons, [shen_type_symbol, "X"], []]], [shen_type_cons, [shen_type_symbol, "$colon$_"], [shen_type_cons, [shen_type_cons, [shen_type_cons, [shen_type_symbol, "unify$excl$"], [shen_type_cons, [shen_type_symbol, "X"], [shen_type_cons, Type, []]]], []], []]]]))
;});})(shen_tail_call(shen_get_fn_js(shen_parameters), 1)))
;});})(shen_tail_call(shen_tail_call(shen_concat, [shen_type_symbol, "shen_type_signature_of_"]), V5478)))
;});})(shen_tail_call(shen_get_fn_js(shen_rcons$_form), V5479)))
;});})(trap_error_js(function() {return shen_tail_call(shen_tail_call(shen_get_fn_js(shen_variancy_test), V5478), V5479);}, function(E) {return [shen_type_symbol, "shen_skip"];})))
;});})((shen_globals[[shen_type_symbol, "shen_$asterisk$signedfuncs$asterisk$"][1]] = shen_tail_call(shen_tail_call(shen_adjoin, V5478), shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$signedfuncs$asterisk$"])))))
;});});
}
declare;

function shen_variancy_test(V5480) {
  if (V5480 == undefined) return shen_variancy_test;
  return (function lambda1717(V5481) {return (V5481 == undefined) ? lambda1717 : new Shen_tco_obj(function() {return ((function(TypeF) {return new Shen_tco_obj(function() {return ((function(Check) {return new Shen_tco_obj(function() {return [shen_type_symbol, "shen_skip"];});})(((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "symbol"], TypeF);})) ? [shen_type_symbol, "shen_skip"] : ((shen_tail_call(shen_tail_call(shen_get_fn_js(shen_variant$question$), TypeF), V5481)) ? [shen_type_symbol, "shen_skip"] : shen_tail_call(shen_tail_call(shen_intoutput, "warning: changing the type of ~A may create errors~%"), [shen_tuple, V5480, []])))))
;});})(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_typecheck), V5480), [shen_type_symbol, "B"])))
;});});
}
shen_variancy_test;

function shen_variant$question$(V5490) {
  if (V5490 == undefined) return shen_variant$question$;
  return (function lambda1718(V5491) {return (V5491 == undefined) ? lambda1718 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(V5491, V5490);})) ? true : (((shen_is_type_js(V5490, shen_type_cons) && (shen_is_type_js(V5491, shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js(V5491[1], V5490[1]);})))) ? (shen_tail_call(shen_get_fn_js(shen_variant$question$), V5490[2])(V5491[2])) : (((shen_is_type_js(V5490, shen_type_cons) && (shen_is_type_js(V5491, shen_type_cons) && (shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5490[1]) && shen_tail_call(shen_variable$question$, V5491[1]))))) ? (shen_tail_call(shen_get_fn_js(shen_variant$question$), shen_tail_call(shen_tail_call(shen_tail_call(shen_subst, [shen_type_symbol, "shen_a"]), V5490[1]), V5490[2]))(shen_tail_call(shen_tail_call(shen_tail_call(shen_subst, [shen_type_symbol, "shen_a"]), V5491[1]), V5491[2]))) : (((shen_is_type_js(V5490, shen_type_cons) && (shen_is_type_js(V5490[1], shen_type_cons) && (shen_is_type_js(V5491, shen_type_cons) && shen_is_type_js(V5491[1], shen_type_cons))))) ? (shen_tail_call(shen_get_fn_js(shen_variant$question$), shen_tail_call(shen_tail_call(shen_append, V5490[1]), V5490[2]))(shen_tail_call(shen_tail_call(shen_append, V5491[1]), V5491[2]))) : false))));});});
}
shen_variant$question$;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "absvector$question$"]), [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "boolean"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "and"]), [shen_type_cons, [shen_type_symbol, "boolean"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "boolean"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "boolean"], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "append"]), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "A"], []]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "A"], []]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "A"], []]], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "apply"]), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "B"], []]]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "B"], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "arity"]), [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "number"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "assoc"]), [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "A"], []]], []]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "A"], []]], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "boolean$question$"]), [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "boolean"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "bound$question$"]), [shen_type_cons, [shen_type_symbol, "symbol"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "boolean"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "cd"]), [shen_type_cons, [shen_type_symbol, "string"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "string"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "close"]), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "stream"], [shen_type_cons, [shen_type_symbol, "A"], []]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "B"], []]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "cn"]), [shen_type_cons, [shen_type_symbol, "string"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "string"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "string"], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "concat"]), [shen_type_cons, [shen_type_symbol, "symbol"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "symbol"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "symbol"], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "cons$question$"]), [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "boolean"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "destroy"]), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "B"], []]]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "B"], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "difference"]), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "A"], []]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "A"], []]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "A"], []]], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "shen_do"]), [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "B"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "B"], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "dump"]), [shen_type_cons, [shen_type_symbol, "string"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "string"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "element$question$"]), [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "A"], []]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "boolean"], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "empty$question$"]), [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "boolean"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "interror"]), [shen_type_cons, [shen_type_symbol, "string"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "B"], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "error_to_string"]), [shen_type_cons, [shen_type_symbol, "exception"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "string"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "explode"]), [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "string"], []]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "fail_if"]), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "symbol"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "boolean"], []]]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "symbol"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "symbol"], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "fix"]), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "A"], []]]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "A"], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "format"]), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "stream"], [shen_type_cons, [shen_type_symbol, "out"], []]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "string"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "string"], []]]], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "freeze"]), [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "lazy"], [shen_type_cons, [shen_type_symbol, "A"], []]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "fst"]), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "$asterisk$"], [shen_type_cons, [shen_type_symbol, "B"], []]]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "A"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "gensym"]), [shen_type_cons, [shen_type_symbol, "symbol"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "symbol"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "$lt$_vector"]), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "vector"], [shen_type_cons, [shen_type_symbol, "A"], []]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "number"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "A"], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "vector_$gt$"]), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "vector"], [shen_type_cons, [shen_type_symbol, "A"], []]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "number"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "vector"], [shen_type_cons, [shen_type_symbol, "A"], []]], []]]], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "vector"]), [shen_type_cons, [shen_type_symbol, "number"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "vector"], [shen_type_cons, [shen_type_symbol, "A"], []]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "get_time"]), [shen_type_cons, [shen_type_symbol, "symbol"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "number"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "hash"]), [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "number"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "number"], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "head"]), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "A"], []]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "A"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "hdv"]), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "vector"], [shen_type_cons, [shen_type_symbol, "A"], []]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "A"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "hdstr"]), [shen_type_cons, [shen_type_symbol, "string"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "string"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "shen_if"]), [shen_type_cons, [shen_type_symbol, "boolean"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "A"], []]]], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "include"]), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "symbol"], []]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "symbol"], []]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "include_all_but"]), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "symbol"], []]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "symbol"], []]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "inferences"]), [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "number"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "integer$question$"]), [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "boolean"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "intersection"]), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "A"], []]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "A"], []]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "A"], []]], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "length"]), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "A"], []]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "number"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "limit"]), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "vector"], [shen_type_cons, [shen_type_symbol, "A"], []]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "number"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "load"]), [shen_type_cons, [shen_type_symbol, "string"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "symbol"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "intmake_string"]), [shen_type_cons, [shen_type_symbol, "string"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "string"], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "intern"]), [shen_type_cons, [shen_type_symbol, "string"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "symbol"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "map"]), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "B"], []]]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "A"], []]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "B"], []]], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "mapcan"]), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "B"], []]], []]]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "A"], []]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "B"], []]], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "maxinferences"]), [shen_type_cons, [shen_type_symbol, "number"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "number"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "n_$gt$string"]), [shen_type_cons, [shen_type_symbol, "number"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "string"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "nl"]), [shen_type_cons, [shen_type_symbol, "number"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "number"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "not"]), [shen_type_cons, [shen_type_symbol, "boolean"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "boolean"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "nth"]), [shen_type_cons, [shen_type_symbol, "number"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "A"], []]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "A"], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "number$question$"]), [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "boolean"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "occurrences"]), [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "B"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "number"], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "occurs_check"]), [shen_type_cons, [shen_type_symbol, "symbol"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "boolean"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "or"]), [shen_type_cons, [shen_type_symbol, "boolean"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "boolean"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "boolean"], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "intoutput"]), [shen_type_cons, [shen_type_symbol, "string"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "string"], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "pos"]), [shen_type_cons, [shen_type_symbol, "string"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "number"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "string"], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "pr"]), [shen_type_cons, [shen_type_symbol, "string"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_cons, [shen_type_symbol, "stream"], [shen_type_cons, [shen_type_symbol, "out"], []]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "string"], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "print"]), [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "A"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "profile"]), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "B"], []]]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "B"], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "preclude"]), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "symbol"], []]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "symbol"], []]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "profile_results"]), [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "symbol"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "preclude_all_but"]), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "symbol"], []]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "symbol"], []]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "read_byte"]), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "stream"], [shen_type_cons, [shen_type_symbol, "shen_in"], []]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "number"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "read_file_as_bytelist"]), [shen_type_cons, [shen_type_symbol, "string"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "number"], []]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "read_file_as_string"]), [shen_type_cons, [shen_type_symbol, "string"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "string"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "remove"]), [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "A"], []]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "A"], []]], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "reverse"]), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "A"], []]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "A"], []]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "simple_error"]), [shen_type_cons, [shen_type_symbol, "string"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "A"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "snd"]), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "$asterisk$"], [shen_type_cons, [shen_type_symbol, "B"], []]]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "B"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "specialise"]), [shen_type_cons, [shen_type_symbol, "symbol"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "symbol"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "spy"]), [shen_type_cons, [shen_type_symbol, "symbol"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "boolean"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "step"]), [shen_type_cons, [shen_type_symbol, "symbol"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "boolean"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "stinput"]), [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "stream"], [shen_type_cons, [shen_type_symbol, "B"], []]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "stoutput"]), [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "stream"], [shen_type_cons, [shen_type_symbol, "B"], []]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "string$question$"]), [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "boolean"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "sum"]), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "number"], []]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "number"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "str"]), [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "string"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "symbol$question$"]), [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "boolean"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "systemf"]), [shen_type_cons, [shen_type_symbol, "symbol"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "symbol"], []]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "tail"]), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "A"], []]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "A"], []]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "tlstr"]), [shen_type_cons, [shen_type_symbol, "string"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "string"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "tlv"]), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "vector"], [shen_type_cons, [shen_type_symbol, "A"], []]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "vector"], [shen_type_cons, [shen_type_symbol, "A"], []]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "tc"]), [shen_type_cons, [shen_type_symbol, "symbol"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "boolean"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "tc$question$"]), [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "boolean"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "thaw"]), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "lazy"], [shen_type_cons, [shen_type_symbol, "A"], []]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "A"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "track"]), [shen_type_cons, [shen_type_symbol, "symbol"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "symbol"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "trap_error"]), [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_cons, [shen_type_symbol, "exception"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "A"], []]]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "A"], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "tuple$question$"]), [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "boolean"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "union"]), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "A"], []]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "A"], []]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, [shen_type_symbol, "A"], []]], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "unprofile"]), [shen_type_cons, [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "B"], []]]], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "B"], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "untrack"]), [shen_type_cons, [shen_type_symbol, "symbol"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "symbol"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "unspecialise"]), [shen_type_cons, [shen_type_symbol, "symbol"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "symbol"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "variable$question$"]), [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "boolean"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "vector$question$"]), [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "boolean"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "version"]), [shen_type_cons, [shen_type_symbol, "string"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "string"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "write_to_file"]), [shen_type_cons, [shen_type_symbol, "string"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "A"], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "y_or_n$question$"]), [shen_type_cons, [shen_type_symbol, "string"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "boolean"], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "$gt$"]), [shen_type_cons, [shen_type_symbol, "number"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "number"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "boolean"], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "$lt$"]), [shen_type_cons, [shen_type_symbol, "number"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "number"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "boolean"], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "$gt$$eq$"]), [shen_type_cons, [shen_type_symbol, "number"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "number"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "boolean"], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "$lt$$eq$"]), [shen_type_cons, [shen_type_symbol, "number"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "number"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "boolean"], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "$eq$"]), [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "boolean"], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "$plus$"]), [shen_type_cons, [shen_type_symbol, "number"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "number"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "number"], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "$slash$"]), [shen_type_cons, [shen_type_symbol, "number"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "number"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "number"], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "_"]), [shen_type_cons, [shen_type_symbol, "number"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "number"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "number"], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "$asterisk$"]), [shen_type_cons, [shen_type_symbol, "number"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "number"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "number"], []]]], []]]]);
;

shen_tail_call(shen_tail_call(declare, [shen_type_symbol, "$eq$$eq$"]), [shen_type_cons, [shen_type_symbol, "A"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "B"], [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, [shen_type_symbol, "boolean"], []]]], []]]]);
;



//## FILE js/t-star.js

function shen_typecheck(V5176) {
  if (V5176 == undefined) return shen_typecheck;
  return (function lambda1640(V5177) {return (V5177 == undefined) ? lambda1640 : new Shen_tco_obj(function() {return ((function(Curry) {return new Shen_tco_obj(function() {return ((function(ProcessN) {return new Shen_tco_obj(function() {return ((function(Type) {return new Shen_tco_obj(function() {return ((function(Continuation) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Curry), Type), []), ProcessN)(Continuation));});})((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_return, Type), ProcessN)([shen_type_symbol, "shen_void"]));});})))
;});})(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_insert_prolog_variables), shen_tail_call(shen_get_fn_js(shen_normalise_type), shen_tail_call(shen_get_fn_js(shen_curry_type), V5177))), ProcessN)))
;});})(shen_tail_call(shen_get_fn_js(shen_start_new_prolog_process))))
;});})(shen_tail_call(shen_get_fn_js(shen_curry), V5176)))
;});});
}
shen_typecheck;

function shen_curry(V5178) {
  if (V5178 == undefined) return shen_curry;
  return (((shen_is_type_js(V5178, shen_type_cons) && shen_tail_call(shen_get_fn_js(shen_special$question$), V5178[1]))) ? [shen_type_cons, V5178[1], shen_tail_call(shen_tail_call(shen_map, shen_curry), V5178[2])] : (((shen_is_type_js(V5178, shen_type_cons) && (shen_is_type_js(V5178[2], shen_type_cons) && shen_tail_call(shen_get_fn_js(shen_extraspecial$question$), V5178[1])))) ? V5178 : (((shen_is_type_js(V5178, shen_type_cons) && (shen_is_type_js(V5178[2], shen_type_cons) && shen_is_type_js(V5178[2][2], shen_type_cons)))) ? (shen_get_fn_js(shen_curry)([shen_type_cons, [shen_type_cons, V5178[1], [shen_type_cons, V5178[2][1], []]], V5178[2][2]])) : (((shen_is_type_js(V5178, shen_type_cons) && (shen_is_type_js(V5178[2], shen_type_cons) && (shen_empty$question$_js(V5178[2][2]))))) ? [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_curry), V5178[1]), [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_curry), V5178[2][1]), []]] : V5178))));
}
shen_curry;

function shen_special$question$(V5179) {
  if (V5179 == undefined) return shen_special$question$;
  return (shen_tail_call(shen_element$question$, V5179)(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$special$asterisk$"])));
}
shen_special$question$;

function shen_extraspecial$question$(V5180) {
  if (V5180 == undefined) return shen_extraspecial$question$;
  return (shen_tail_call(shen_element$question$, V5180)(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$extraspecial$asterisk$"])));
}
shen_extraspecial$question$;

function shen_normalise_type(V5181) {
  if (V5181 == undefined) return shen_normalise_type;
  return (shen_tail_call(shen_fix, shen_normalise_type_help)(V5181));
}
shen_normalise_type;

function shen_normalise_type_help(V5182) {
  if (V5182 == undefined) return shen_normalise_type_help;
  return ((shen_is_type_js(V5182, shen_type_cons)) ? (shen_get_fn_js(shen_normalise_X)(shen_tail_call(shen_tail_call(shen_map, shen_normalise_type_help), V5182))) : (shen_get_fn_js(shen_normalise_X)(V5182)));
}
shen_normalise_type_help;

function shen_normalise_X(V5183) {
  if (V5183 == undefined) return shen_normalise_X;
  return ((function(Val) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(Val))) ? V5183 : Val[2]);});})(shen_tail_call(shen_tail_call(shen_assoc, V5183), shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$synonyms$asterisk$"]))))
;
}
shen_normalise_X;

function shen_t$asterisk$(V5184) {
  if (V5184 == undefined) return shen_t$asterisk$;
  return (function lambda1643(V5185) {return (V5185 == undefined) ? lambda1643 : new Shen_tco_obj(function() {return (function lambda1642(V5186) {return (V5186 == undefined) ? lambda1642 : new Shen_tco_obj(function() {return (function lambda1641(V5187) {return (V5187 == undefined) ? lambda1641 : new Shen_tco_obj(function() {return ((function(Throwcontrol) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_cutpoint), Throwcontrol)(shen_tail_call((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? shen_tail_call((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? shen_tail_call((function(Hyps) {return new Shen_tco_obj(function() {return shen_tail_call((function(Datatypes) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_show), V5184), Hyps), V5186), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, Datatypes), shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$datatypes$asterisk$"])), V5186)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_udefs$asterisk$), V5184), V5185), Datatypes), V5186)(V5187));});})));});})));});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5186))
;});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5186))
 : Case);});}), shen_tail_call((function(V5171) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5171, shen_type_cons)) ? shen_tail_call((function(X) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5172) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5172, shen_type_cons)) ? shen_tail_call((function(V5173) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$colon$"], V5173);})) ? shen_tail_call((function(V5174) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5174, shen_type_cons)) ? shen_tail_call((function(A) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5175) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5175))) ? (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5186), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), X), A), V5185), V5186)(V5187));});}))) : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5174[2]), V5186))
;});}), V5174[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5172[2]), V5186))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5172[1]), V5186))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5171[2]), V5186))
;});}), V5171[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5184), V5186))
)
 : Case);});}), shen_tail_call((function(Error) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_fwhen, shen_tail_call(shen_get_fn_js(shen_maxinfexceeded$question$))), V5186), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, Error), shen_tail_call(shen_get_fn_js(shen_errormaxinfs))), V5186)(V5187));});})));});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5186))
)
));});})(shen_tail_call(shen_get_fn_js(shen_catchpoint))))
;});});});});});});
}
shen_t$asterisk$;

function shen_maxinfexceeded$question$() {return (shen_tail_call(shen_inferences, [shen_type_symbol, "shen_skip"]) > shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$maxinferences$asterisk$"]));}
shen_maxinfexceeded$question$;

function shen_errormaxinfs() {return (shen_simple_error("maximum inferences exceeded~%"));}
shen_errormaxinfs;

function shen_udefs$asterisk$(V5188) {
  if (V5188 == undefined) return shen_udefs$asterisk$;
  return (function lambda1647(V5189) {return (V5189 == undefined) ? lambda1647 : new Shen_tco_obj(function() {return (function lambda1646(V5190) {return (V5190 == undefined) ? lambda1646 : new Shen_tco_obj(function() {return (function lambda1645(V5191) {return (V5191 == undefined) ? lambda1645 : new Shen_tco_obj(function() {return (function lambda1644(V5192) {return (V5192 == undefined) ? lambda1644 : new Shen_tco_obj(function() {return ((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? ((function(V5168) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5168, shen_type_cons)) ? ((function(Ds) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_udefs$asterisk$), V5188), V5189), Ds), V5191)(V5192)));});})(V5168[2]))
 : false);});})(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5190), V5191)))
 : Case);});})(shen_tail_call((function(V5167) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5167, shen_type_cons)) ? shen_tail_call((function(D) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_call, [shen_type_cons, D, [shen_type_cons, V5188, [shen_type_cons, V5189, []]]]), V5191), V5192));});}), V5167[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5190), V5191))
))
;});});});});});});});});
}
shen_udefs$asterisk$;

function shen_boolean_and$slash$or$question$(V5197) {
  if (V5197 == undefined) return shen_boolean_and$slash$or$question$;
  return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "and"], V5197);})) ? true : ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "or"], V5197);})) ? true : false));
}
shen_boolean_and$slash$or$question$;

function shen_not_and$slash$or(V5198) {
  if (V5198 == undefined) return shen_not_and$slash$or;
  return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "and"], V5198);})) ? [shen_type_symbol, "or"] : ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "or"], V5198);})) ? [shen_type_symbol, "and"] : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_not_and$slash$or"]))));
}
shen_not_and$slash$or;

function shen_simplify_not(V5199) {
  if (V5199 == undefined) return shen_simplify_not;
  return (((shen_is_type_js(V5199, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "not"], V5199[1]);}) && (shen_is_type_js(V5199[2], shen_type_cons) && (shen_is_type_js(V5199[2][1], shen_type_cons) && (shen_is_type_js(V5199[2][1][1], shen_type_cons) && (shen_is_type_js(V5199[2][1][1][2], shen_type_cons) && ((shen_empty$question$_js(V5199[2][1][1][2][2])) && (shen_is_type_js(V5199[2][1][2], shen_type_cons) && ((shen_empty$question$_js(V5199[2][1][2][2])) && ((shen_empty$question$_js(V5199[2][2])) && shen_tail_call(shen_get_fn_js(shen_boolean_and$slash$or$question$), V5199[2][1][1][1])))))))))))) ? [shen_type_cons, [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_not_and$slash$or), V5199[2][1][1][1]), [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_simplify_not), [shen_type_cons, [shen_type_symbol, "not"], V5199[2][1][1][2]]), []]], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_simplify_not), [shen_type_cons, [shen_type_symbol, "not"], V5199[2][1][2]]), []]] : (((shen_is_type_js(V5199, shen_type_cons) && (shen_is_type_js(V5199[1], shen_type_cons) && (shen_is_type_js(V5199[1][2], shen_type_cons) && ((shen_empty$question$_js(V5199[1][2][2])) && (shen_is_type_js(V5199[2], shen_type_cons) && ((shen_empty$question$_js(V5199[2][2])) && shen_tail_call(shen_get_fn_js(shen_boolean_and$slash$or$question$), V5199[1][1])))))))) ? [shen_type_cons, [shen_type_cons, V5199[1][1], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_simplify_not), V5199[1][2][1]), []]], [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_simplify_not), V5199[2][1]), []]] : (((shen_is_type_js(V5199, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "not"], V5199[1]);}) && (shen_is_type_js(V5199[2], shen_type_cons) && (shen_is_type_js(V5199[2][1], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "not"], V5199[2][1][1]);}) && (shen_is_type_js(V5199[2][1][2], shen_type_cons) && ((shen_empty$question$_js(V5199[2][1][2][2])) && (shen_empty$question$_js(V5199[2][2])))))))))) ? V5199[2][1][2][1] : V5199)));
}
shen_simplify_not;

function shen_get_verified_help(V5200) {
  if (V5200 == undefined) return shen_get_verified_help;
  return (((shen_is_type_js(V5200, shen_type_cons) && (shen_is_type_js(V5200[1], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "and"], V5200[1][1]);}) && (shen_is_type_js(V5200[1][2], shen_type_cons) && ((shen_empty$question$_js(V5200[1][2][2])) && (shen_is_type_js(V5200[2], shen_type_cons) && (shen_empty$question$_js(V5200[2][2]))))))))) ? (shen_tail_call(shen_union, [shen_type_cons, [shen_type_cons, V5200, [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_symbol, "verified"], []]]], []])(shen_tail_call(shen_tail_call(shen_union, shen_tail_call(shen_get_fn_js(shen_get_verified), V5200[1][2][1])), shen_tail_call(shen_get_fn_js(shen_get_verified), V5200[2][1])))) : (((shen_is_type_js(V5200, shen_type_cons) && (shen_is_type_js(V5200[1], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "or"], V5200[1][1]);}) && (shen_is_type_js(V5200[1][2], shen_type_cons) && ((shen_empty$question$_js(V5200[1][2][2])) && (shen_is_type_js(V5200[2], shen_type_cons) && (shen_empty$question$_js(V5200[2][2]))))))))) ? (shen_tail_call(shen_union, [shen_type_cons, [shen_type_cons, V5200, [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_symbol, "verified"], []]]], []])(shen_tail_call(shen_tail_call(shen_intersection, shen_tail_call(shen_get_fn_js(shen_get_verified), V5200[1][2][1])), shen_tail_call(shen_get_fn_js(shen_get_verified), V5200[2][1])))) : [shen_type_cons, [shen_type_cons, V5200, [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_symbol, "verified"], []]]], []]));
}
shen_get_verified_help;

function shen_get_verified(V5201) {
  if (V5201 == undefined) return shen_get_verified;
  return (shen_get_fn_js(shen_get_verified_help)(shen_tail_call(shen_get_fn_js(shen_simplify_not), V5201)));
}
shen_get_verified;

function shen_th$asterisk$(V5202) {
  if (V5202 == undefined) return shen_th$asterisk$;
  return (function lambda1651(V5203) {return (V5203 == undefined) ? lambda1651 : new Shen_tco_obj(function() {return (function lambda1650(V5204) {return (V5204 == undefined) ? lambda1650 : new Shen_tco_obj(function() {return (function lambda1649(V5205) {return (V5205 == undefined) ? lambda1649 : new Shen_tco_obj(function() {return (function lambda1648(V5206) {return (V5206 == undefined) ? lambda1648 : new Shen_tco_obj(function() {return ((function(Throwcontrol) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_cutpoint), Throwcontrol)(shen_tail_call((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? shen_tail_call((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? shen_tail_call((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? shen_tail_call((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? shen_tail_call((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? shen_tail_call((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? shen_tail_call((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? shen_tail_call((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? shen_tail_call((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? shen_tail_call((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? shen_tail_call((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? shen_tail_call((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? shen_tail_call((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? shen_tail_call((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? shen_tail_call((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? shen_tail_call((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? shen_tail_call((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? shen_tail_call((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? shen_tail_call((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? shen_tail_call((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? shen_tail_call((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? shen_tail_call((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? shen_tail_call((function(Datatypes) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, Datatypes), shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$datatypes$asterisk$"])), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_udefs$asterisk$), [shen_type_cons, V5202, [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, V5203, []]]]), V5204), Datatypes), V5205)(V5206));});})));});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
 : Case);});}), shen_tail_call((function(V5161) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5161, shen_type_cons)) ? shen_tail_call((function(V5162) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_synonyms_help"], V5162);})) ? shen_tail_call((function(V5163) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "symbol"], V5163);})) ? (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(V5206)) : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5163)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5163), [shen_type_symbol, "symbol"]), V5205),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5163), V5205),
  Result);});}), (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(V5206)))
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5203), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5161[1]), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5202), V5205))
)
 : Case);});}), shen_tail_call((function(V5158) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5158, shen_type_cons)) ? shen_tail_call((function(V5159) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_process_datatype"], V5159);})) ? shen_tail_call((function(V5160) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "symbol"], V5160);})) ? (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(V5206)) : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5160)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5160), [shen_type_symbol, "symbol"]), V5205),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5160), V5205),
  Result);});}), (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(V5206)))
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5203), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5158[1]), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5202), V5205))
)
 : Case);});}), shen_tail_call((function(V5155) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5155, shen_type_cons)) ? shen_tail_call((function(V5156) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "define"], V5156);})) ? shen_tail_call((function(V5157) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5157, shen_type_cons)) ? shen_tail_call((function(F) {return new Shen_tco_obj(function() {return shen_tail_call((function(X) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_t$asterisk$_def), [shen_type_cons, [shen_type_symbol, "define"], [shen_type_cons, F, X]]), V5203), V5204), V5205)(V5206));});})));});}), V5157[2])
;});}), V5157[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5155[2]), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5155[1]), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5202), V5205))
)
 : Case);});}), shen_tail_call((function(NewHyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_t$asterisk$_hyps), V5204), NewHyp), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), V5202), V5203), NewHyp), V5205)(V5206));});})));});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
)
 : Case);});}), shen_tail_call((function(V5151) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5151, shen_type_cons)) ? shen_tail_call((function(V5152) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "fail"], V5152);})) ? shen_tail_call((function(V5153) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5153))) ? shen_tail_call((function(V5154) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "symbol"], V5154);})) ? (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(V5206)) : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5154)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5154), [shen_type_symbol, "symbol"]), V5205),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5154), V5205),
  Result);});}), (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(V5206)))
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5203), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5151[2]), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5151[1]), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5202), V5205))
)
 : Case);});}), shen_tail_call((function(V5146) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5146, shen_type_cons)) ? shen_tail_call((function(V5147) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "set"], V5147);})) ? shen_tail_call((function(V5148) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5148, shen_type_cons)) ? shen_tail_call((function(Var) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5149) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5149, shen_type_cons)) ? shen_tail_call((function(Val) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5150) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5150))) ? (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), [shen_type_cons, [shen_type_symbol, "value"], [shen_type_cons, Var, []]]), V5203), V5204), V5205)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Val), V5203), V5204), V5205)(V5206));});})));});}))) : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5149[2]), V5205))
;});}), V5149[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5148[2]), V5205))
;});}), V5148[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5146[2]), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5146[1]), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5202), V5205))
)
 : Case);});}), shen_tail_call((function(V5141) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5141, shen_type_cons)) ? shen_tail_call((function(V5142) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "where"], V5142);})) ? shen_tail_call((function(V5143) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5143, shen_type_cons)) ? shen_tail_call((function(P) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5144) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5144, shen_type_cons)) ? shen_tail_call((function(X) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5145) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5145))) ? shen_tail_call((function(NewHyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), P), [shen_type_symbol, "boolean"]), V5204), V5205)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5205)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, NewHyp), shen_tail_call(shen_tail_call(shen_append, shen_tail_call(shen_get_fn_js(shen_get_verified), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), P), V5205))), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5204), V5205))), V5205)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), X), V5203), NewHyp), V5205)(V5206));});})));});})));});})));});})));});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5144[2]), V5205))
;});}), V5144[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5143[2]), V5205))
;});}), V5143[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5141[2]), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5141[1]), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5202), V5205))
)
 : Case);});}), shen_tail_call((function(V5135) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5135, shen_type_cons)) ? shen_tail_call((function(V5136) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "input$plus$"], V5136);})) ? shen_tail_call((function(V5137) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5137, shen_type_cons)) ? shen_tail_call((function(V5138) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$colon$"], V5138);})) ? shen_tail_call((function(V5139) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5139, shen_type_cons)) ? shen_tail_call((function(A) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5140) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5140))) ? shen_tail_call((function(C) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, C), shen_tail_call(shen_get_fn_js(shen_normalise_type), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5205))), V5205)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_unify, V5203), C), V5205)(V5206));});})));});})));});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5139[2]), V5205))
;});}), V5139[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5137[2]), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5137[1]), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5135[2]), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5135[1]), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5202), V5205))
)
 : Case);});}), shen_tail_call((function(V5130) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5130, shen_type_cons)) ? shen_tail_call((function(V5131) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "type"], V5131);})) ? shen_tail_call((function(V5132) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5132, shen_type_cons)) ? shen_tail_call((function(X) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5133) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5133, shen_type_cons)) ? shen_tail_call((function(A) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5134) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5134))) ? (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_unify, A), V5203), V5205)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), X), A), V5204), V5205)(V5206));});})));});}))) : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5133[2]), V5205))
;});}), V5133[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5132[2]), V5205))
;});}), V5132[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5130[2]), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5130[1]), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5202), V5205))
)
 : Case);});}), shen_tail_call((function(V5117) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5117, shen_type_cons)) ? shen_tail_call((function(V5118) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "open"], V5118);})) ? shen_tail_call((function(V5119) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5119, shen_type_cons)) ? shen_tail_call((function(V5120) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "file"], V5120);})) ? shen_tail_call((function(V5121) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5121, shen_type_cons)) ? shen_tail_call((function(FileName) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5122) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5122, shen_type_cons)) ? shen_tail_call((function(Direction5048) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5123) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5123))) ? shen_tail_call((function(V5124) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5124, shen_type_cons)) ? shen_tail_call((function(V5125) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "stream"], V5125);})) ? shen_tail_call((function(V5126) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5126, shen_type_cons)) ? shen_tail_call((function(Direction) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5127) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5127))) ? (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_unify$excl$, Direction), Direction5048), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5205)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), FileName), [shen_type_symbol, "string"]), V5204), V5205)(V5206));});})));});}))) : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5127)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5127), []), V5205),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5127), V5205),
  Result);});}), (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_unify$excl$, Direction), Direction5048), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5205)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), FileName), [shen_type_symbol, "string"]), V5204), V5205)(V5206));});})));});}))))
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5126[2]), V5205))
;});}), V5126[1])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5126)) ? shen_tail_call((function(Direction) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5126), [shen_type_cons, Direction, []]), V5205),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5126), V5205),
  Result);});}), (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_unify$excl$, Direction), Direction5048), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5205)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), FileName), [shen_type_symbol, "string"]), V5204), V5205)(V5206));});})));});}))))
);});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
 : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5124[2]), V5205))
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5125)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5125), [shen_type_symbol, "stream"]), V5205),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5125), V5205),
  Result);});}), shen_tail_call((function(V5128) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5128, shen_type_cons)) ? shen_tail_call((function(Direction) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5129) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5129))) ? (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_unify$excl$, Direction), Direction5048), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5205)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), FileName), [shen_type_symbol, "string"]), V5204), V5205)(V5206));});})));});}))) : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5129)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5129), []), V5205),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5129), V5205),
  Result);});}), (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_unify$excl$, Direction), Direction5048), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5205)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), FileName), [shen_type_symbol, "string"]), V5204), V5205)(V5206));});})));});}))))
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5128[2]), V5205))
;});}), V5128[1])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5128)) ? shen_tail_call((function(Direction) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5128), [shen_type_cons, Direction, []]), V5205),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5128), V5205),
  Result);});}), (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_unify$excl$, Direction), Direction5048), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5205)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), FileName), [shen_type_symbol, "string"]), V5204), V5205)(V5206));});})));});}))))
);});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
 : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5124[2]), V5205))
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5124[1]), V5205))
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5124)) ? shen_tail_call((function(Direction) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5124), [shen_type_cons, [shen_type_symbol, "stream"], [shen_type_cons, Direction, []]]), V5205),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5124), V5205),
  Result);});}), (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_unify$excl$, Direction), Direction5048), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5205)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), FileName), [shen_type_symbol, "string"]), V5204), V5205)(V5206));});})));});}))))
);});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
 : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5203), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5122[2]), V5205))
;});}), V5122[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5121[2]), V5205))
;});}), V5121[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5119[2]), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5119[1]), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5117[2]), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5117[1]), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5202), V5205))
)
 : Case);});}), shen_tail_call((function(V5111) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5111, shen_type_cons)) ? shen_tail_call((function(V5112) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "let"], V5112);})) ? shen_tail_call((function(V5113) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5113, shen_type_cons)) ? shen_tail_call((function(X) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5114) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5114, shen_type_cons)) ? shen_tail_call((function(Y) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5115) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5115, shen_type_cons)) ? shen_tail_call((function(Z) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5116) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5116))) ? shen_tail_call((function(W) {return new Shen_tco_obj(function() {return shen_tail_call((function(X$amp$$amp$) {return new Shen_tco_obj(function() {return shen_tail_call((function(B) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Y), B), V5204), V5205)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, X$amp$$amp$), shen_tail_call(shen_get_fn_js(shen_placeholder))), V5205)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, W), shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_ebr), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X$amp$$amp$), V5205)), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5205)), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Z), V5205))), V5205)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), W), V5203), [shen_type_cons, [shen_type_cons, X$amp$$amp$, [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, B, []]]], V5204]), V5205)(V5206));});})));});})));});})));});})));});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
;});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
;});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5115[2]), V5205))
;});}), V5115[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5114[2]), V5205))
;});}), V5114[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5113[2]), V5205))
;});}), V5113[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5111[2]), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5111[1]), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5202), V5205))
)
 : Case);});}), shen_tail_call((function(V5099) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5099, shen_type_cons)) ? shen_tail_call((function(V5100) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "lambda"], V5100);})) ? shen_tail_call((function(V5101) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5101, shen_type_cons)) ? shen_tail_call((function(X) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5102) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5102, shen_type_cons)) ? shen_tail_call((function(Y) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5103) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5103))) ? shen_tail_call((function(V5104) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5104, shen_type_cons)) ? shen_tail_call((function(A) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5105) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5105, shen_type_cons)) ? shen_tail_call((function(V5106) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "__$gt$"], V5106);})) ? shen_tail_call((function(V5107) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5107, shen_type_cons)) ? shen_tail_call((function(B) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5108) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5108))) ? shen_tail_call((function(Z) {return new Shen_tco_obj(function() {return shen_tail_call((function(X$amp$$amp$) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, X$amp$$amp$), shen_tail_call(shen_get_fn_js(shen_placeholder))), V5205)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, Z), shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_ebr), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X$amp$$amp$), V5205)), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5205)), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5205))), V5205)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Z), B), [shen_type_cons, [shen_type_cons, X$amp$$amp$, [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, A, []]]], V5204]), V5205)(V5206));});})));});})));});})));});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
;});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5108)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5108), []), V5205),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5108), V5205),
  Result);});}), shen_tail_call((function(Z) {return new Shen_tco_obj(function() {return shen_tail_call((function(X$amp$$amp$) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, X$amp$$amp$), shen_tail_call(shen_get_fn_js(shen_placeholder))), V5205)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, Z), shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_ebr), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X$amp$$amp$), V5205)), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5205)), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5205))), V5205)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Z), B), [shen_type_cons, [shen_type_cons, X$amp$$amp$, [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, A, []]]], V5204]), V5205)(V5206));});})));});})));});})));});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
;});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5107[2]), V5205))
;});}), V5107[1])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5107)) ? shen_tail_call((function(B) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5107), [shen_type_cons, B, []]), V5205),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5107), V5205),
  Result);});}), shen_tail_call((function(Z) {return new Shen_tco_obj(function() {return shen_tail_call((function(X$amp$$amp$) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, X$amp$$amp$), shen_tail_call(shen_get_fn_js(shen_placeholder))), V5205)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, Z), shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_ebr), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X$amp$$amp$), V5205)), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5205)), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5205))), V5205)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Z), B), [shen_type_cons, [shen_type_cons, X$amp$$amp$, [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, A, []]]], V5204]), V5205)(V5206));});})));});})));});})));});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
;});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
)
);});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
 : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5105[2]), V5205))
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5106)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5106), [shen_type_symbol, "__$gt$"]), V5205),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5106), V5205),
  Result);});}), shen_tail_call((function(V5109) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5109, shen_type_cons)) ? shen_tail_call((function(B) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5110) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5110))) ? shen_tail_call((function(Z) {return new Shen_tco_obj(function() {return shen_tail_call((function(X$amp$$amp$) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, X$amp$$amp$), shen_tail_call(shen_get_fn_js(shen_placeholder))), V5205)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, Z), shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_ebr), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X$amp$$amp$), V5205)), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5205)), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5205))), V5205)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Z), B), [shen_type_cons, [shen_type_cons, X$amp$$amp$, [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, A, []]]], V5204]), V5205)(V5206));});})));});})));});})));});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
;});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5110)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5110), []), V5205),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5110), V5205),
  Result);});}), shen_tail_call((function(Z) {return new Shen_tco_obj(function() {return shen_tail_call((function(X$amp$$amp$) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, X$amp$$amp$), shen_tail_call(shen_get_fn_js(shen_placeholder))), V5205)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, Z), shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_ebr), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X$amp$$amp$), V5205)), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5205)), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5205))), V5205)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Z), B), [shen_type_cons, [shen_type_cons, X$amp$$amp$, [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, A, []]]], V5204]), V5205)(V5206));});})));});})));});})));});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
;});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5109[2]), V5205))
;});}), V5109[1])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5109)) ? shen_tail_call((function(B) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5109), [shen_type_cons, B, []]), V5205),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5109), V5205),
  Result);});}), shen_tail_call((function(Z) {return new Shen_tco_obj(function() {return shen_tail_call((function(X$amp$$amp$) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, X$amp$$amp$), shen_tail_call(shen_get_fn_js(shen_placeholder))), V5205)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, Z), shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_ebr), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X$amp$$amp$), V5205)), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5205)), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5205))), V5205)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Z), B), [shen_type_cons, [shen_type_cons, X$amp$$amp$, [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, A, []]]], V5204]), V5205)(V5206));});})));});})));});})));});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
;});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
)
);});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
 : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5105[2]), V5205))
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5105[1]), V5205))
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5105)) ? shen_tail_call((function(B) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5105), [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, B, []]]), V5205),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5105), V5205),
  Result);});}), shen_tail_call((function(Z) {return new Shen_tco_obj(function() {return shen_tail_call((function(X$amp$$amp$) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, X$amp$$amp$), shen_tail_call(shen_get_fn_js(shen_placeholder))), V5205)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, Z), shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_ebr), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X$amp$$amp$), V5205)), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5205)), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5205))), V5205)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Z), B), [shen_type_cons, [shen_type_cons, X$amp$$amp$, [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, A, []]]], V5204]), V5205)(V5206));});})));});})));});})));});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
;});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
)
);});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
 : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5104[2]), V5205))
;});}), V5104[1])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5104)) ? shen_tail_call((function(A) {return new Shen_tco_obj(function() {return shen_tail_call((function(B) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5104), [shen_type_cons, A, [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, B, []]]]), V5205),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5104), V5205),
  Result);});}), shen_tail_call((function(Z) {return new Shen_tco_obj(function() {return shen_tail_call((function(X$amp$$amp$) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, X$amp$$amp$), shen_tail_call(shen_get_fn_js(shen_placeholder))), V5205)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, Z), shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_ebr), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X$amp$$amp$), V5205)), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5205)), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5205))), V5205)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Z), B), [shen_type_cons, [shen_type_cons, X$amp$$amp$, [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, A, []]]], V5204]), V5205)(V5206));});})));});})));});})));});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
;});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
)
);});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
;});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
 : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5203), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5102[2]), V5205))
;});}), V5102[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5101[2]), V5205))
;});}), V5101[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5099[2]), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5099[1]), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5202), V5205))
)
 : Case);});}), shen_tail_call((function(V5093) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5093, shen_type_cons)) ? shen_tail_call((function(V5094) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$at$s"], V5094);})) ? shen_tail_call((function(V5095) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5095, shen_type_cons)) ? shen_tail_call((function(X) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5096) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5096, shen_type_cons)) ? shen_tail_call((function(Y) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5097) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5097))) ? shen_tail_call((function(V5098) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "string"], V5098);})) ? (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), X), [shen_type_symbol, "string"]), V5204), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Y), [shen_type_symbol, "string"]), V5204), V5205)(V5206));});}))) : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5098)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5098), [shen_type_symbol, "string"]), V5205),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5098), V5205),
  Result);});}), (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), X), [shen_type_symbol, "string"]), V5204), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Y), [shen_type_symbol, "string"]), V5204), V5205)(V5206));});}))))
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5203), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5096[2]), V5205))
;});}), V5096[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5095[2]), V5205))
;});}), V5095[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5093[2]), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5093[1]), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5202), V5205))
)
 : Case);});}), shen_tail_call((function(V5082) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5082, shen_type_cons)) ? shen_tail_call((function(V5083) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$at$v"], V5083);})) ? shen_tail_call((function(V5084) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5084, shen_type_cons)) ? shen_tail_call((function(X) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5085) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5085, shen_type_cons)) ? shen_tail_call((function(Y) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5086) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5086))) ? shen_tail_call((function(V5087) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5087, shen_type_cons)) ? shen_tail_call((function(V5088) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "vector"], V5088);})) ? shen_tail_call((function(V5089) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5089, shen_type_cons)) ? shen_tail_call((function(A) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5090) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5090))) ? (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), X), A), V5204), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Y), [shen_type_cons, [shen_type_symbol, "vector"], [shen_type_cons, A, []]]), V5204), V5205)(V5206));});}))) : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5090)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5090), []), V5205),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5090), V5205),
  Result);});}), (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), X), A), V5204), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Y), [shen_type_cons, [shen_type_symbol, "vector"], [shen_type_cons, A, []]]), V5204), V5205)(V5206));});}))))
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5089[2]), V5205))
;});}), V5089[1])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5089)) ? shen_tail_call((function(A) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5089), [shen_type_cons, A, []]), V5205),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5089), V5205),
  Result);});}), (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), X), A), V5204), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Y), [shen_type_cons, [shen_type_symbol, "vector"], [shen_type_cons, A, []]]), V5204), V5205)(V5206));});}))))
);});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
 : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5087[2]), V5205))
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5088)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5088), [shen_type_symbol, "vector"]), V5205),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5088), V5205),
  Result);});}), shen_tail_call((function(V5091) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5091, shen_type_cons)) ? shen_tail_call((function(A) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5092) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5092))) ? (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), X), A), V5204), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Y), [shen_type_cons, [shen_type_symbol, "vector"], [shen_type_cons, A, []]]), V5204), V5205)(V5206));});}))) : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5092)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5092), []), V5205),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5092), V5205),
  Result);});}), (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), X), A), V5204), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Y), [shen_type_cons, [shen_type_symbol, "vector"], [shen_type_cons, A, []]]), V5204), V5205)(V5206));});}))))
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5091[2]), V5205))
;});}), V5091[1])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5091)) ? shen_tail_call((function(A) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5091), [shen_type_cons, A, []]), V5205),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5091), V5205),
  Result);});}), (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), X), A), V5204), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Y), [shen_type_cons, [shen_type_symbol, "vector"], [shen_type_cons, A, []]]), V5204), V5205)(V5206));});}))))
);});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
 : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5087[2]), V5205))
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5087[1]), V5205))
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5087)) ? shen_tail_call((function(A) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5087), [shen_type_cons, [shen_type_symbol, "vector"], [shen_type_cons, A, []]]), V5205),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5087), V5205),
  Result);});}), (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), X), A), V5204), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Y), [shen_type_cons, [shen_type_symbol, "vector"], [shen_type_cons, A, []]]), V5204), V5205)(V5206));});}))))
);});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
 : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5203), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5085[2]), V5205))
;});}), V5085[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5084[2]), V5205))
;});}), V5084[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5082[2]), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5082[1]), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5202), V5205))
)
 : Case);});}), shen_tail_call((function(V5070) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5070, shen_type_cons)) ? shen_tail_call((function(V5071) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$at$p"], V5071);})) ? shen_tail_call((function(V5072) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5072, shen_type_cons)) ? shen_tail_call((function(X) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5073) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5073, shen_type_cons)) ? shen_tail_call((function(Y) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5074) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5074))) ? shen_tail_call((function(V5075) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5075, shen_type_cons)) ? shen_tail_call((function(A) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5076) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5076, shen_type_cons)) ? shen_tail_call((function(V5077) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$asterisk$"], V5077);})) ? shen_tail_call((function(V5078) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5078, shen_type_cons)) ? shen_tail_call((function(B) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5079) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5079))) ? (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), X), A), V5204), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Y), B), V5204), V5205)(V5206));});}))) : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5079)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5079), []), V5205),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5079), V5205),
  Result);});}), (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), X), A), V5204), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Y), B), V5204), V5205)(V5206));});}))))
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5078[2]), V5205))
;});}), V5078[1])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5078)) ? shen_tail_call((function(B) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5078), [shen_type_cons, B, []]), V5205),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5078), V5205),
  Result);});}), (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), X), A), V5204), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Y), B), V5204), V5205)(V5206));});}))))
);});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
 : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5076[2]), V5205))
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5077)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5077), [shen_type_symbol, "$asterisk$"]), V5205),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5077), V5205),
  Result);});}), shen_tail_call((function(V5080) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5080, shen_type_cons)) ? shen_tail_call((function(B) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5081) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5081))) ? (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), X), A), V5204), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Y), B), V5204), V5205)(V5206));});}))) : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5081)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5081), []), V5205),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5081), V5205),
  Result);});}), (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), X), A), V5204), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Y), B), V5204), V5205)(V5206));});}))))
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5080[2]), V5205))
;});}), V5080[1])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5080)) ? shen_tail_call((function(B) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5080), [shen_type_cons, B, []]), V5205),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5080), V5205),
  Result);});}), (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), X), A), V5204), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Y), B), V5204), V5205)(V5206));});}))))
);});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
 : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5076[2]), V5205))
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5076[1]), V5205))
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5076)) ? shen_tail_call((function(B) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5076), [shen_type_cons, [shen_type_symbol, "$asterisk$"], [shen_type_cons, B, []]]), V5205),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5076), V5205),
  Result);});}), (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), X), A), V5204), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Y), B), V5204), V5205)(V5206));});}))))
);});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
 : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5075[2]), V5205))
;});}), V5075[1])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5075)) ? shen_tail_call((function(A) {return new Shen_tco_obj(function() {return shen_tail_call((function(B) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5075), [shen_type_cons, A, [shen_type_cons, [shen_type_symbol, "$asterisk$"], [shen_type_cons, B, []]]]), V5205),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5075), V5205),
  Result);});}), (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), X), A), V5204), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Y), B), V5204), V5205)(V5206));});}))))
);});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
;});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
 : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5203), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5073[2]), V5205))
;});}), V5073[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5072[2]), V5205))
;});}), V5072[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5070[2]), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5070[1]), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5202), V5205))
)
 : Case);});}), shen_tail_call((function(V5059) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5059, shen_type_cons)) ? shen_tail_call((function(V5060) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "cons"], V5060);})) ? shen_tail_call((function(V5061) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5061, shen_type_cons)) ? shen_tail_call((function(X) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5062) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5062, shen_type_cons)) ? shen_tail_call((function(Y) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5063) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5063))) ? shen_tail_call((function(V5064) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5064, shen_type_cons)) ? shen_tail_call((function(V5065) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "list"], V5065);})) ? shen_tail_call((function(V5066) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5066, shen_type_cons)) ? shen_tail_call((function(A) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5067) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5067))) ? (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), X), A), V5204), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Y), [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, A, []]]), V5204), V5205)(V5206));});}))) : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5067)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5067), []), V5205),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5067), V5205),
  Result);});}), (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), X), A), V5204), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Y), [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, A, []]]), V5204), V5205)(V5206));});}))))
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5066[2]), V5205))
;});}), V5066[1])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5066)) ? shen_tail_call((function(A) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5066), [shen_type_cons, A, []]), V5205),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5066), V5205),
  Result);});}), (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), X), A), V5204), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Y), [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, A, []]]), V5204), V5205)(V5206));});}))))
);});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
 : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5064[2]), V5205))
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5065)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5065), [shen_type_symbol, "list"]), V5205),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5065), V5205),
  Result);});}), shen_tail_call((function(V5068) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5068, shen_type_cons)) ? shen_tail_call((function(A) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5069) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5069))) ? (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), X), A), V5204), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Y), [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, A, []]]), V5204), V5205)(V5206));});}))) : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5069)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5069), []), V5205),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5069), V5205),
  Result);});}), (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), X), A), V5204), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Y), [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, A, []]]), V5204), V5205)(V5206));});}))))
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5068[2]), V5205))
;});}), V5068[1])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5068)) ? shen_tail_call((function(A) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5068), [shen_type_cons, A, []]), V5205),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5068), V5205),
  Result);});}), (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), X), A), V5204), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Y), [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, A, []]]), V5204), V5205)(V5206));});}))))
);});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
 : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5064[2]), V5205))
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5064[1]), V5205))
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5064)) ? shen_tail_call((function(A) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5064), [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, A, []]]), V5205),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5064), V5205),
  Result);});}), (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), X), A), V5204), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Y), [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, A, []]]), V5204), V5205)(V5206));});}))))
);});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
 : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5203), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5062[2]), V5205))
;});}), V5062[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5061[2]), V5205))
;});}), V5061[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5059[2]), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5059[1]), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5202), V5205))
)
 : Case);});}), shen_tail_call((function(V5056) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5056, shen_type_cons)) ? shen_tail_call((function(F) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5057) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5057, shen_type_cons)) ? shen_tail_call((function(X) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5058) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5058))) ? shen_tail_call((function(B) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), F), [shen_type_cons, B, [shen_type_cons, [shen_type_symbol, "__$gt$"], [shen_type_cons, V5203, []]]]), V5204), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), X), B), V5204), V5205)(V5206));});})));});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5057[2]), V5205))
;});}), V5057[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5056[2]), V5205))
;});}), V5056[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5202), V5205))
)
 : Case);});}), (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_by$_hypothesis), V5202), V5203), V5204), V5205), V5206)))
 : Case);});}), shen_tail_call((function(F) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_fwhen, shen_tail_call(shen_get_fn_js(shen_typedf$question$), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5202), V5205))), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, F), shen_tail_call(shen_get_fn_js(shen_sigf), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5202), V5205))), V5205)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_call, [shen_type_cons, F, [shen_type_cons, V5203, []]]), V5205)(V5206));});})));});})));});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
)
 : Case);});}), (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_base), V5202), V5203), V5205), V5206)))
 : Case);});}), shen_tail_call((function(V5052) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5052, shen_type_cons)) ? shen_tail_call((function(V5053) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_function"], V5053);})) ? shen_tail_call((function(V5054) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5054, shen_type_cons)) ? shen_tail_call((function(X) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5055) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5055))) ? shen_tail_call((function(F) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_fwhen, shen_tail_call(shen_get_fn_js(shen_typedf$question$), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5205))), V5205)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, F), shen_tail_call(shen_get_fn_js(shen_sigf), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5205))), V5205)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_call, [shen_type_cons, F, [shen_type_cons, V5203, []]]), V5205)(V5206));});})));});})));});})));});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5054[2]), V5205))
;});}), V5054[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5052[2]), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5052[1]), V5205))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5202), V5205))
)
 : Case);});}), (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_show), [shen_type_cons, V5202, [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, V5203, []]]]), V5204), V5205), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_fwhen, false), V5205)(V5206));});}))))
));});})(shen_tail_call(shen_get_fn_js(shen_catchpoint))))
;});});});});});});});});
}
shen_th$asterisk$;

function shen_t$asterisk$_hyps(V5207) {
  if (V5207 == undefined) return shen_t$asterisk$_hyps;
  return (function lambda1654(V5208) {return (V5208 == undefined) ? lambda1654 : new Shen_tco_obj(function() {return (function lambda1653(V5209) {return (V5209 == undefined) ? lambda1653 : new Shen_tco_obj(function() {return (function lambda1652(V5210) {return (V5210 == undefined) ? lambda1652 : new Shen_tco_obj(function() {return ((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? ((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? ((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? ((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? ((function(V5047) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5047, shen_type_cons)) ? ((function(X) {return new Shen_tco_obj(function() {return ((function(Hyp) {return new Shen_tco_obj(function() {return ((function(NewHyps) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), NewHyps), V5209)]), V5209)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_t$asterisk$_hyps), Hyp), NewHyps), V5209)(V5210));});}))));});})(shen_tail_call(shen_get_fn_js(shen_newpv), V5209)))
;});})(V5047[2]))
;});})(V5047[1]))
 : false);});})(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5207), V5209)))
 : Case);});})(shen_tail_call((function(V5034) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5034, shen_type_cons)) ? shen_tail_call((function(V5035) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5035, shen_type_cons)) ? shen_tail_call((function(V5036) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5036, shen_type_cons)) ? shen_tail_call((function(V5037) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$at$s"], V5037);})) ? shen_tail_call((function(V5038) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5038, shen_type_cons)) ? shen_tail_call((function(X) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5039) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5039, shen_type_cons)) ? shen_tail_call((function(Y) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5040) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5040))) ? shen_tail_call((function(V5041) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5041, shen_type_cons)) ? shen_tail_call((function(V5042) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$colon$"], V5042);})) ? shen_tail_call((function(V5043) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5043, shen_type_cons)) ? shen_tail_call((function(V5044) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "string"], V5044);})) ? shen_tail_call((function(V5045) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5045))) ? shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_symbol, "string"], []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_symbol, "string"], []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V5034[2])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5045)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5045), []), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5045), V5209),
  Result);});}), shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_symbol, "string"], []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_symbol, "string"], []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V5034[2])
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5043[2]), V5209))
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5044)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5044), [shen_type_symbol, "string"]), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5044), V5209),
  Result);});}), shen_tail_call((function(V5046) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5046))) ? shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_symbol, "string"], []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_symbol, "string"], []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V5034[2])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5046)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5046), []), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5046), V5209),
  Result);});}), shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_symbol, "string"], []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_symbol, "string"], []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V5034[2])
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5043[2]), V5209))
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5043[1]), V5209))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5041[2]), V5209))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5041[1]), V5209))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5035[2]), V5209))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5039[2]), V5209))
;});}), V5039[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5038[2]), V5209))
;});}), V5038[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5036[2]), V5209))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5036[1]), V5209))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5035[1]), V5209))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5034[1]), V5209))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5207), V5209))
))
 : Case);});})(shen_tail_call((function(V5011) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5011, shen_type_cons)) ? shen_tail_call((function(V5012) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5012, shen_type_cons)) ? shen_tail_call((function(V5013) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5013, shen_type_cons)) ? shen_tail_call((function(V5014) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$at$v"], V5014);})) ? shen_tail_call((function(V5015) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5015, shen_type_cons)) ? shen_tail_call((function(X) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5016) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5016, shen_type_cons)) ? shen_tail_call((function(Y) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5017) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5017))) ? shen_tail_call((function(V5018) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5018, shen_type_cons)) ? shen_tail_call((function(V5019) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$colon$"], V5019);})) ? shen_tail_call((function(V5020) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5020, shen_type_cons)) ? shen_tail_call((function(V5021) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5021, shen_type_cons)) ? shen_tail_call((function(V5022) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "vector"], V5022);})) ? shen_tail_call((function(V5023) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5023, shen_type_cons)) ? shen_tail_call((function(A) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5024) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5024))) ? shen_tail_call((function(V5025) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5025))) ? shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "vector"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]], []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V5011[2])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5025)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5025), []), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5025), V5209),
  Result);});}), shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "vector"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]], []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V5011[2])
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5020[2]), V5209))
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5024)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5024), []), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5024), V5209),
  Result);});}), shen_tail_call((function(V5026) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5026))) ? shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "vector"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]], []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V5011[2])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5026)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5026), []), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5026), V5209),
  Result);});}), shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "vector"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]], []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V5011[2])
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5020[2]), V5209))
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5023[2]), V5209))
;});}), V5023[1])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5023)) ? shen_tail_call((function(A) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5023), [shen_type_cons, A, []]), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5023), V5209),
  Result);});}), shen_tail_call((function(V5027) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5027))) ? shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "vector"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]], []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V5011[2])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5027)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5027), []), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5027), V5209),
  Result);});}), shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "vector"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]], []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V5011[2])
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5020[2]), V5209))
)
);});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5209))
 : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5021[2]), V5209))
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5022)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5022), [shen_type_symbol, "vector"]), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5022), V5209),
  Result);});}), shen_tail_call((function(V5028) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5028, shen_type_cons)) ? shen_tail_call((function(A) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5029) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5029))) ? shen_tail_call((function(V5030) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5030))) ? shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "vector"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]], []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V5011[2])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5030)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5030), []), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5030), V5209),
  Result);});}), shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "vector"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]], []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V5011[2])
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5020[2]), V5209))
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5029)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5029), []), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5029), V5209),
  Result);});}), shen_tail_call((function(V5031) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5031))) ? shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "vector"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]], []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V5011[2])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5031)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5031), []), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5031), V5209),
  Result);});}), shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "vector"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]], []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V5011[2])
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5020[2]), V5209))
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5028[2]), V5209))
;});}), V5028[1])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5028)) ? shen_tail_call((function(A) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5028), [shen_type_cons, A, []]), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5028), V5209),
  Result);});}), shen_tail_call((function(V5032) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5032))) ? shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "vector"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]], []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V5011[2])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5032)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5032), []), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5032), V5209),
  Result);});}), shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "vector"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]], []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V5011[2])
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5020[2]), V5209))
)
);});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5209))
 : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5021[2]), V5209))
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5021[1]), V5209))
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5021)) ? shen_tail_call((function(A) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5021), [shen_type_cons, [shen_type_symbol, "vector"], [shen_type_cons, A, []]]), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5021), V5209),
  Result);});}), shen_tail_call((function(V5033) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5033))) ? shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "vector"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]], []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V5011[2])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5033)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5033), []), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5033), V5209),
  Result);});}), shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "vector"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]], []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V5011[2])
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5020[2]), V5209))
)
);});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5209))
 : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5020[1]), V5209))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5018[2]), V5209))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5018[1]), V5209))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5012[2]), V5209))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5016[2]), V5209))
;});}), V5016[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5015[2]), V5209))
;});}), V5015[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5013[2]), V5209))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5013[1]), V5209))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5012[1]), V5209))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5011[1]), V5209))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5207), V5209))
))
 : Case);});})(shen_tail_call((function(V4986) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4986, shen_type_cons)) ? shen_tail_call((function(V4987) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4987, shen_type_cons)) ? shen_tail_call((function(V4988) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4988, shen_type_cons)) ? shen_tail_call((function(V4989) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$at$p"], V4989);})) ? shen_tail_call((function(V4990) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4990, shen_type_cons)) ? shen_tail_call((function(X) {return new Shen_tco_obj(function() {return shen_tail_call((function(V4991) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4991, shen_type_cons)) ? shen_tail_call((function(Y) {return new Shen_tco_obj(function() {return shen_tail_call((function(V4992) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4992))) ? shen_tail_call((function(V4993) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4993, shen_type_cons)) ? shen_tail_call((function(V4994) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$colon$"], V4994);})) ? shen_tail_call((function(V4995) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4995, shen_type_cons)) ? shen_tail_call((function(V4996) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4996, shen_type_cons)) ? shen_tail_call((function(A) {return new Shen_tco_obj(function() {return shen_tail_call((function(V4997) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4997, shen_type_cons)) ? shen_tail_call((function(V4998) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$asterisk$"], V4998);})) ? shen_tail_call((function(V4999) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4999, shen_type_cons)) ? shen_tail_call((function(B) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5000) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5000))) ? shen_tail_call((function(V5001) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5001))) ? shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), B), V5209), []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V4986[2])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5001)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5001), []), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5001), V5209),
  Result);});}), shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), B), V5209), []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V4986[2])
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4995[2]), V5209))
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5000)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5000), []), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5000), V5209),
  Result);});}), shen_tail_call((function(V5002) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5002))) ? shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), B), V5209), []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V4986[2])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5002)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5002), []), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5002), V5209),
  Result);});}), shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), B), V5209), []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V4986[2])
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4995[2]), V5209))
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4999[2]), V5209))
;});}), V4999[1])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V4999)) ? shen_tail_call((function(B) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V4999), [shen_type_cons, B, []]), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V4999), V5209),
  Result);});}), shen_tail_call((function(V5003) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5003))) ? shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), B), V5209), []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V4986[2])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5003)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5003), []), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5003), V5209),
  Result);});}), shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), B), V5209), []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V4986[2])
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4995[2]), V5209))
)
);});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5209))
 : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4997[2]), V5209))
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V4998)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V4998), [shen_type_symbol, "$asterisk$"]), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V4998), V5209),
  Result);});}), shen_tail_call((function(V5004) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V5004, shen_type_cons)) ? shen_tail_call((function(B) {return new Shen_tco_obj(function() {return shen_tail_call((function(V5005) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5005))) ? shen_tail_call((function(V5006) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5006))) ? shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), B), V5209), []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V4986[2])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5006)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5006), []), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5006), V5209),
  Result);});}), shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), B), V5209), []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V4986[2])
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4995[2]), V5209))
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5005)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5005), []), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5005), V5209),
  Result);});}), shen_tail_call((function(V5007) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5007))) ? shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), B), V5209), []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V4986[2])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5007)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5007), []), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5007), V5209),
  Result);});}), shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), B), V5209), []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V4986[2])
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4995[2]), V5209))
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5004[2]), V5209))
;});}), V5004[1])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5004)) ? shen_tail_call((function(B) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5004), [shen_type_cons, B, []]), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5004), V5209),
  Result);});}), shen_tail_call((function(V5008) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5008))) ? shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), B), V5209), []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V4986[2])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5008)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5008), []), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5008), V5209),
  Result);});}), shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), B), V5209), []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V4986[2])
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4995[2]), V5209))
)
);});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5209))
 : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4997[2]), V5209))
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4997[1]), V5209))
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V4997)) ? shen_tail_call((function(B) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V4997), [shen_type_cons, [shen_type_symbol, "$asterisk$"], [shen_type_cons, B, []]]), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V4997), V5209),
  Result);});}), shen_tail_call((function(V5009) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5009))) ? shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), B), V5209), []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V4986[2])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5009)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5009), []), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5009), V5209),
  Result);});}), shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), B), V5209), []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V4986[2])
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4995[2]), V5209))
)
);});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5209))
 : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4996[2]), V5209))
;});}), V4996[1])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V4996)) ? shen_tail_call((function(A) {return new Shen_tco_obj(function() {return shen_tail_call((function(B) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V4996), [shen_type_cons, A, [shen_type_cons, [shen_type_symbol, "$asterisk$"], [shen_type_cons, B, []]]]), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V4996), V5209),
  Result);});}), shen_tail_call((function(V5010) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5010))) ? shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), B), V5209), []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V4986[2])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V5010)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V5010), []), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V5010), V5209),
  Result);});}), shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), B), V5209), []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V4986[2])
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4995[2]), V5209))
)
);});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5209))
;});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5209))
 : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4995[1]), V5209))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4993[2]), V5209))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4993[1]), V5209))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4987[2]), V5209))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4991[2]), V5209))
;});}), V4991[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4990[2]), V5209))
;});}), V4990[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4988[2]), V5209))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4988[1]), V5209))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4987[1]), V5209))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4986[1]), V5209))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5207), V5209))
))
 : Case);});})(shen_tail_call((function(V4963) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4963, shen_type_cons)) ? shen_tail_call((function(V4964) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4964, shen_type_cons)) ? shen_tail_call((function(V4965) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4965, shen_type_cons)) ? shen_tail_call((function(V4966) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "cons"], V4966);})) ? shen_tail_call((function(V4967) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4967, shen_type_cons)) ? shen_tail_call((function(X) {return new Shen_tco_obj(function() {return shen_tail_call((function(V4968) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4968, shen_type_cons)) ? shen_tail_call((function(Y) {return new Shen_tco_obj(function() {return shen_tail_call((function(V4969) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4969))) ? shen_tail_call((function(V4970) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4970, shen_type_cons)) ? shen_tail_call((function(V4971) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$colon$"], V4971);})) ? shen_tail_call((function(V4972) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4972, shen_type_cons)) ? shen_tail_call((function(V4973) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4973, shen_type_cons)) ? shen_tail_call((function(V4974) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "list"], V4974);})) ? shen_tail_call((function(V4975) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4975, shen_type_cons)) ? shen_tail_call((function(A) {return new Shen_tco_obj(function() {return shen_tail_call((function(V4976) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4976))) ? shen_tail_call((function(V4977) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4977))) ? shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]], []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V4963[2])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V4977)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V4977), []), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V4977), V5209),
  Result);});}), shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]], []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V4963[2])
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4972[2]), V5209))
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V4976)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V4976), []), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V4976), V5209),
  Result);});}), shen_tail_call((function(V4978) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4978))) ? shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]], []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V4963[2])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V4978)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V4978), []), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V4978), V5209),
  Result);});}), shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]], []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V4963[2])
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4972[2]), V5209))
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4975[2]), V5209))
;});}), V4975[1])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V4975)) ? shen_tail_call((function(A) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V4975), [shen_type_cons, A, []]), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V4975), V5209),
  Result);});}), shen_tail_call((function(V4979) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4979))) ? shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]], []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V4963[2])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V4979)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V4979), []), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V4979), V5209),
  Result);});}), shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]], []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V4963[2])
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4972[2]), V5209))
)
);});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5209))
 : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4973[2]), V5209))
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V4974)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V4974), [shen_type_symbol, "list"]), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V4974), V5209),
  Result);});}), shen_tail_call((function(V4980) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4980, shen_type_cons)) ? shen_tail_call((function(A) {return new Shen_tco_obj(function() {return shen_tail_call((function(V4981) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4981))) ? shen_tail_call((function(V4982) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4982))) ? shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]], []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V4963[2])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V4982)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V4982), []), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V4982), V5209),
  Result);});}), shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]], []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V4963[2])
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4972[2]), V5209))
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V4981)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V4981), []), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V4981), V5209),
  Result);});}), shen_tail_call((function(V4983) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4983))) ? shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]], []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V4963[2])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V4983)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V4983), []), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V4983), V5209),
  Result);});}), shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]], []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V4963[2])
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4972[2]), V5209))
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4980[2]), V5209))
;});}), V4980[1])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V4980)) ? shen_tail_call((function(A) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V4980), [shen_type_cons, A, []]), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V4980), V5209),
  Result);});}), shen_tail_call((function(V4984) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4984))) ? shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]], []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V4963[2])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V4984)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V4984), []), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V4984), V5209),
  Result);});}), shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]], []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V4963[2])
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4972[2]), V5209))
)
);});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5209))
 : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4973[2]), V5209))
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4973[1]), V5209))
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V4973)) ? shen_tail_call((function(A) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V4973), [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, A, []]]), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V4973), V5209),
  Result);});}), shen_tail_call((function(V4985) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4985))) ? shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]], []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V4963[2])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V4985)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V4985), []), V5209),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V4985), V5209),
  Result);});}), shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5208), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]]], [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Y), V5209), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5209), []]], []]]], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Hyp), V5209)]]), V5209), V5210));});}), V4963[2])
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4972[2]), V5209))
)
);});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5209))
 : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4972[1]), V5209))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4970[2]), V5209))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4970[1]), V5209))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4964[2]), V5209))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4968[2]), V5209))
;});}), V4968[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4967[2]), V5209))
;});}), V4967[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4965[2]), V5209))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4965[1]), V5209))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4964[1]), V5209))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4963[1]), V5209))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5207), V5209))
))
;});});});});});});
}
shen_t$asterisk$_hyps;

function shen_show(V5223) {
  if (V5223 == undefined) return shen_show;
  return (function lambda1657(V5224) {return (V5224 == undefined) ? lambda1657 : new Shen_tco_obj(function() {return (function lambda1656(V5225) {return (V5225 == undefined) ? lambda1656 : new Shen_tco_obj(function() {return (function lambda1655(V5226) {return (V5226 == undefined) ? lambda1655 : new Shen_tco_obj(function() {return ((shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$spy$asterisk$"])) ? (shen_tail_call(shen_get_fn_js(shen_line)),
  (shen_tail_call(shen_get_fn_js(shen_show_p), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_deref), V5223), V5225)),
  (shen_tail_call(shen_nl, 1),
  (shen_tail_call(shen_nl, 1),
  (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_show_assumptions), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_deref), V5224), V5225)), 1),
  (shen_tail_call(shen_tail_call(shen_intoutput, "~%> "), []),
  (shen_tail_call(shen_get_fn_js(shen_pause_for_user), 0),
  (V5226())))))))) : (V5226()));});});});});});});
}
shen_show;

function shen_line() {return ((function(Infs) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_intoutput, "____________________________________________________________ ~A inference~A ~%?- ")([shen_tuple, Infs, [shen_tuple, ((shen_tail_call(function() {return shen_equal$question$_js(1, Infs);})) ? "" : "s"), []]]));});})(shen_tail_call(shen_inferences, [shen_type_symbol, "$_"])))
;}
shen_line;

function shen_show_p(V5227) {
  if (V5227 == undefined) return shen_show_p;
  return (((shen_is_type_js(V5227, shen_type_cons) && (shen_is_type_js(V5227[2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$colon$"], V5227[2][1]);}) && (shen_is_type_js(V5227[2][2], shen_type_cons) && (shen_empty$question$_js(V5227[2][2][2]))))))) ? (shen_tail_call(shen_intoutput, "~R : ~R")([shen_tuple, V5227[1], [shen_tuple, V5227[2][2][1], []]])) : (shen_tail_call(shen_intoutput, "~R")([shen_tuple, V5227, []])));
}
shen_show_p;

function shen_show_assumptions(V5230) {
  if (V5230 == undefined) return shen_show_assumptions;
  return (function lambda1658(V5231) {return (V5231 == undefined) ? lambda1658 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V5230))) ? [shen_type_symbol, "shen_skip"] : ((shen_is_type_js(V5230, shen_type_cons)) ? (shen_tail_call(shen_tail_call(shen_intoutput, "~A. "), [shen_tuple, V5231, []]),
  (shen_tail_call(shen_get_fn_js(shen_show_p), V5230[1]),
  (shen_tail_call(shen_nl, 1),
  (shen_tail_call(shen_get_fn_js(shen_show_assumptions), V5230[2])((V5231 + 1)))))) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_show_assumptions"]))));});});
}
shen_show_assumptions;

function shen_pause_for_user(V5236) {
  if (V5236 == undefined) return shen_pause_for_user;
  return ((function(I) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(I, "a");})) ? (shen_tail_call(shen_interror, "input aborted~%")([])) : (shen_nl(1)));});})(shen_tail_call(shen_read_byte, shen_tail_call(shen_stinput, 0))))
;
}
shen_pause_for_user;

function shen_typedf$question$(V5237) {
  if (V5237 == undefined) return shen_typedf$question$;
  return (shen_tail_call(shen_element$question$, V5237)(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$signedfuncs$asterisk$"])));
}
shen_typedf$question$;

function shen_sigf(V5238) {
  if (V5238 == undefined) return shen_sigf;
  return (shen_tail_call(shen_concat, [shen_type_symbol, "shen_type_signature_of_"])(V5238));
}
shen_sigf;

function shen_placeholder() {return (shen_gensym([shen_type_symbol, "$amp$$amp$"]));}
shen_placeholder;

function shen_base(V5239) {
  if (V5239 == undefined) return shen_base;
  return (function lambda1661(V5240) {return (V5240 == undefined) ? lambda1661 : new Shen_tco_obj(function() {return (function lambda1660(V5241) {return (V5241 == undefined) ? lambda1660 : new Shen_tco_obj(function() {return (function lambda1659(V5242) {return (V5242 == undefined) ? lambda1659 : new Shen_tco_obj(function() {return ((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? ((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? ((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? ((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? ((function(V4954) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4954))) ? ((function(V4955) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4955, shen_type_cons)) ? ((function(V4956) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "list"], V4956);})) ? ((function(V4957) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4957, shen_type_cons)) ? ((function(A) {return new Shen_tco_obj(function() {return ((function(V4958) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4958))) ? (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  (V5242())) : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V4958)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V4958), []), V5241),
  ((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V4958), V5241),
  Result);});})((shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(V5242))))
) : false));});})(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4957[2]), V5241)))
;});})(V4957[1]))
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V4957)) ? ((function(A) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V4957), [shen_type_cons, A, []]), V5241),
  ((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V4957), V5241),
  Result);});})((shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(V5242))))
);});})(shen_tail_call(shen_get_fn_js(shen_newpv), V5241)))
 : false));});})(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4955[2]), V5241)))
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V4956)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V4956), [shen_type_symbol, "list"]), V5241),
  ((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V4956), V5241),
  Result);});})(shen_tail_call((function(V4959) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4959, shen_type_cons)) ? shen_tail_call((function(A) {return new Shen_tco_obj(function() {return shen_tail_call((function(V4960) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4960))) ? (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(V5242)) : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V4960)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V4960), []), V5241),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V4960), V5241),
  Result);});}), (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(V5242)))
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4959[2]), V5241))
;});}), V4959[1])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V4959)) ? shen_tail_call((function(A) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V4959), [shen_type_cons, A, []]), V5241),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V4959), V5241),
  Result);});}), (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(V5242)))
);});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5241))
 : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4955[2]), V5241))
))
) : false));});})(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4955[1]), V5241)))
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V4955)) ? ((function(A) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V4955), [shen_type_cons, [shen_type_symbol, "list"], [shen_type_cons, A, []]]), V5241),
  ((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V4955), V5241),
  Result);});})((shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(V5242))))
);});})(shen_tail_call(shen_get_fn_js(shen_newpv), V5241)))
 : false));});})(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5240), V5241)))
 : false);});})(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5239), V5241)))
 : Case);});})(shen_tail_call((function(V4953) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "symbol"], V4953);})) ? (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_fwhen, shen_is_type_js(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5239), V5241), shen_type_symbol)), V5241), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_fwhen, (!shen_tail_call(shen_get_fn_js(shen_placeholder$question$), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5239), V5241)))), V5241)(V5242));});}))) : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V4953)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V4953), [shen_type_symbol, "symbol"]), V5241),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V4953), V5241),
  Result);});}), (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_fwhen, shen_is_type_js(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5239), V5241), shen_type_symbol)), V5241), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_fwhen, (!shen_tail_call(shen_get_fn_js(shen_placeholder$question$), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5239), V5241)))), V5241)(V5242));});}))))
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5240), V5241))
))
 : Case);});})(shen_tail_call((function(V4952) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "string"], V4952);})) ? (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_fwhen, (typeof(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5239), V5241)) == 'string')), V5241), V5242)) : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V4952)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V4952), [shen_type_symbol, "string"]), V5241),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V4952), V5241),
  Result);});}), (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_fwhen, (typeof(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5239), V5241)) == 'string')), V5241), V5242)))
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5240), V5241))
))
 : Case);});})(shen_tail_call((function(V4951) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "boolean"], V4951);})) ? (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_fwhen, shen_boolean$question$_js(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5239), V5241))), V5241), V5242)) : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V4951)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V4951), [shen_type_symbol, "boolean"]), V5241),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V4951), V5241),
  Result);});}), (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_fwhen, shen_boolean$question$_js(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5239), V5241))), V5241), V5242)))
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5240), V5241))
))
 : Case);});})(shen_tail_call((function(V4950) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "number"], V4950);})) ? (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_fwhen, (typeof(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5239), V5241)) == 'number')), V5241), V5242)) : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V4950)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V4950), [shen_type_symbol, "number"]), V5241),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V4950), V5241),
  Result);});}), (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_fwhen, (typeof(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5239), V5241)) == 'number')), V5241), V5242)))
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5240), V5241))
))
;});});});});});});
}
shen_base;

function shen_placeholder$question$(V5243) {
  if (V5243 == undefined) return shen_placeholder$question$;
  return (shen_is_type_js(V5243, shen_type_symbol) && shen_tail_call(shen_get_fn_js(shen_placeholder_help$question$), shen_tail_call(shen_str, V5243)));
}
shen_placeholder$question$;

function shen_placeholder_help$question$(V5250) {
  if (V5250 == undefined) return shen_placeholder_help$question$;
  return (((shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), V5250) && (shen_tail_call(function() {return shen_equal$question$_js("&", V5250[0]);}) && (shen_tail_call(shen_get_fn_js(shen_$plus$string$question$), shen_tail_call(shen_tlstr, V5250)) && shen_tail_call(function() {return shen_equal$question$_js("&", shen_tail_call(shen_tlstr, V5250)[0]);}))))) ? true : false);
}
shen_placeholder_help$question$;

function shen_by$_hypothesis(V5251) {
  if (V5251 == undefined) return shen_by$_hypothesis;
  return (function lambda1665(V5252) {return (V5252 == undefined) ? lambda1665 : new Shen_tco_obj(function() {return (function lambda1664(V5253) {return (V5253 == undefined) ? lambda1664 : new Shen_tco_obj(function() {return (function lambda1663(V5254) {return (V5254 == undefined) ? lambda1663 : new Shen_tco_obj(function() {return (function lambda1662(V5255) {return (V5255 == undefined) ? lambda1662 : new Shen_tco_obj(function() {return ((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? ((function(V4947) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4947, shen_type_cons)) ? ((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_by$_hypothesis), V5251), V5252), Hyp), V5254)(V5255)));});})(V4947[2]))
 : false);});})(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5253), V5254)))
 : Case);});})(shen_tail_call((function(V4941) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4941, shen_type_cons)) ? shen_tail_call((function(V4942) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4942, shen_type_cons)) ? shen_tail_call((function(Y) {return new Shen_tco_obj(function() {return shen_tail_call((function(V4943) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4943, shen_type_cons)) ? shen_tail_call((function(V4944) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$colon$"], V4944);})) ? shen_tail_call((function(V4945) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4945, shen_type_cons)) ? shen_tail_call((function(B) {return new Shen_tco_obj(function() {return shen_tail_call((function(V4946) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4946))) ? (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_identical, V5251), Y), V5254), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_unify$excl$, V5252), B), V5254)(V5255));});}))) : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4945[2]), V5254))
;});}), V4945[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4943[2]), V5254))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4943[1]), V5254))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4942[2]), V5254))
;});}), V4942[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4941[1]), V5254))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5253), V5254))
))
;});});});});});});});});
}
shen_by$_hypothesis;

function shen_t$asterisk$_def(V5256) {
  if (V5256 == undefined) return shen_t$asterisk$_def;
  return (function lambda1669(V5257) {return (V5257 == undefined) ? lambda1669 : new Shen_tco_obj(function() {return (function lambda1668(V5258) {return (V5258 == undefined) ? lambda1668 : new Shen_tco_obj(function() {return (function lambda1667(V5259) {return (V5259 == undefined) ? lambda1667 : new Shen_tco_obj(function() {return (function lambda1666(V5260) {return (V5260 == undefined) ? lambda1666 : new Shen_tco_obj(function() {return ((function(Throwcontrol) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_cutpoint), Throwcontrol)(shen_tail_call((function(V4935) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4935, shen_type_cons)) ? shen_tail_call((function(V4936) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "define"], V4936);})) ? shen_tail_call((function(V4937) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4937, shen_type_cons)) ? shen_tail_call((function(F) {return new Shen_tco_obj(function() {return shen_tail_call((function(X) {return new Shen_tco_obj(function() {return shen_tail_call((function(Error) {return new Shen_tco_obj(function() {return shen_tail_call((function(Sig$plus$Rules) {return new Shen_tco_obj(function() {return shen_tail_call((function(Vars) {return new Shen_tco_obj(function() {return shen_tail_call((function(Rules) {return new Shen_tco_obj(function() {return shen_tail_call((function(Sig$amp$$amp$) {return new Shen_tco_obj(function() {return shen_tail_call((function(Declare) {return new Shen_tco_obj(function() {return shen_tail_call((function(Sig) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, Sig$plus$Rules), shen_tail_call(shen_tail_call(shen_tail_call(shen_compile, shen_$lt$sig$plus$rules$gt$), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5259)), [])), V5259), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, Error), ((shen_tail_call(function() {return shen_equal$question$_js(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Sig$plus$Rules), V5259), shen_fail_obj);})) ? shen_tail_call(shen_get_fn_js(shen_errordef), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), F), V5259)) : [shen_type_symbol, "shen_skip"])), V5259)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, Sig), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Sig$plus$Rules), V5259)[1]), V5259)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, Rules), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Sig$plus$Rules), V5259)[2]), V5259)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, Vars), shen_tail_call(shen_get_fn_js(shen_extract$_vars), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Sig), V5259))), V5259)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, Sig$amp$$amp$), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_placeholders), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Sig), V5259)), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Vars), V5259))), V5259)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5259)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_t$asterisk$_rules), Rules), Sig$amp$$amp$), 1), F), [shen_type_cons, [shen_type_cons, F, [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, Sig$amp$$amp$, []]]], V5258]), V5259)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, Declare), shen_tail_call(shen_tail_call(declare, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), F), V5259)), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Sig), V5259))), V5259)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_unify$excl$, V5257), Sig), V5259)(V5260));});})));});})));});})));});})));});})));});})));});})));});})));});})));});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5259))
;});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5259))
;});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5259))
;});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5259))
;});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5259))
;});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5259))
;});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5259))
;});}), V4937[2])
;});}), V4937[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4935[2]), V5259))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4935[1]), V5259))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5256), V5259))
));});})(shen_tail_call(shen_get_fn_js(shen_catchpoint))))
;});});});});});});});});
}
shen_t$asterisk$_def;

function shen_$lt$sig$plus$rules$gt$(V5265) {
  if (V5265 == undefined) return shen_$lt$sig$plus$rules$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$signature$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$signature$gt$);}))) ? shen_tail_call((function(Parse$_$lt$trules$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$trules$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$trules$gt$)), [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$signature$gt$), shen_tail_call(shen_snd, Parse$_$lt$trules$gt$)]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$trules$gt$), Parse$_$lt$signature$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$signature$gt$), V5265))
))
;
}
shen_$lt$sig$plus$rules$gt$;

function shen_placeholders(V5270) {
  if (V5270 == undefined) return shen_placeholders;
  return (function lambda1671(V5271) {return (V5271 == undefined) ? lambda1671 : new Shen_tco_obj(function() {return ((shen_is_type_js(V5270, shen_type_cons)) ? (shen_tail_call(shen_map, (function lambda1670(Z) {return (Z == undefined) ? lambda1670 : new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_placeholders), Z)(V5271));});}))(V5270)) : ((shen_tail_call(shen_tail_call(shen_element$question$, V5270), V5271)) ? (shen_tail_call(shen_concat, [shen_type_symbol, "$amp$$amp$"])(V5270)) : V5270));});});
}
shen_placeholders;

function shen_$lt$trules$gt$(V5276) {
  if (V5276 == undefined) return shen_$lt$trules$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$trule$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$trule$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$trule$gt$)), [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$trule$gt$), []]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$trule$gt$), V5276))
))
 : Result);});})(shen_tail_call((function(Parse$_$lt$trule$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$trule$gt$);}))) ? shen_tail_call((function(Parse$_$lt$trules$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$trules$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$trules$gt$)), [shen_type_cons, shen_tail_call(shen_snd, Parse$_$lt$trule$gt$), shen_tail_call(shen_snd, Parse$_$lt$trules$gt$)]) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$trules$gt$), Parse$_$lt$trule$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$trule$gt$), V5276))
))
;
}
shen_$lt$trules$gt$;

function shen_$lt$trule$gt$(V5281) {
  if (V5281 == undefined) return shen_$lt$trule$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$patterns$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$patterns$gt$);}))) ? shen_tail_call((function(Parse$_$lt$arrow$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$arrow$gt$);}))) ? shen_tail_call((function(Parse$_$lt$action$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$action$gt$);}))) ? shen_tail_call((function(Parse$_$lt$guard$question$$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$guard$question$$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$guard$question$$gt$)), shen_tail_call((function(Vars) {return new Shen_tco_obj(function() {return shen_tail_call((function(Patterns) {return new Shen_tco_obj(function() {return shen_tail_call((function(Action) {return new Shen_tco_obj(function() {return shen_tail_call((function(Guard) {return new Shen_tco_obj(function() {return shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_form_rule), Patterns), shen_tail_call(shen_snd, Parse$_$lt$arrow$gt$)), Action), Guard);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_placeholders), shen_tail_call(shen_get_fn_js(shen_curry), shen_tail_call(shen_snd, Parse$_$lt$guard$question$$gt$))), Vars))
;});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_placeholders), shen_tail_call(shen_get_fn_js(shen_curry), shen_tail_call(shen_snd, Parse$_$lt$action$gt$))), Vars))
;});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_placeholders), shen_tail_call(shen_snd, Parse$_$lt$patterns$gt$)), Vars))
;});}), shen_tail_call(shen_get_fn_js(shen_extract$_vars), shen_tail_call(shen_snd, Parse$_$lt$patterns$gt$)))
) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$guard$question$$gt$), Parse$_$lt$action$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$action$gt$), Parse$_$lt$arrow$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$arrow$gt$), Parse$_$lt$patterns$gt$))
 : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$patterns$gt$), V5281))
))
;
}
shen_$lt$trule$gt$;

function shen_form_rule(V5282) {
  if (V5282 == undefined) return shen_form_rule;
  return (function lambda1674(V5283) {return (V5283 == undefined) ? lambda1674 : new Shen_tco_obj(function() {return (function lambda1673(V5284) {return (V5284 == undefined) ? lambda1673 : new Shen_tco_obj(function() {return (function lambda1672(V5285) {return (V5285 == undefined) ? lambda1672 : new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_forward"], V5283);})) ? [shen_type_cons, V5282, [shen_type_cons, ((shen_tail_call(function() {return shen_equal$question$_js(V5285, [shen_type_symbol, "shen_skip"]);})) ? V5284 : [shen_type_cons, [shen_type_symbol, "where"], [shen_type_cons, V5285, [shen_type_cons, V5284, []]]]), []]] : (((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_backward"], V5283);}) && (shen_is_type_js(V5284, shen_type_cons) && (shen_is_type_js(V5284[1], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "fail_if"], V5284[1][1]);}) && (shen_is_type_js(V5284[1][2], shen_type_cons) && ((shen_empty$question$_js(V5284[1][2][2])) && (shen_is_type_js(V5284[2], shen_type_cons) && (shen_empty$question$_js(V5284[2][2])))))))))) ? [shen_type_cons, V5282, [shen_type_cons, ((shen_tail_call(function() {return shen_equal$question$_js(V5285, [shen_type_symbol, "shen_skip"]);})) ? [shen_type_cons, [shen_type_symbol, "where"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "not"], [shen_type_cons, [shen_type_cons, V5284[1][2][1], V5284[2]], []]], V5284[2]]] : [shen_type_cons, [shen_type_symbol, "where"], [shen_type_cons, [shen_type_cons, [shen_type_cons, [shen_type_symbol, "and"], [shen_type_cons, V5285, []]], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "not"], [shen_type_cons, [shen_type_cons, V5284[1][2][1], V5284[2]], []]], []]], V5284[2]]]), []]] : ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_backward"], V5283);})) ? [shen_type_cons, V5282, [shen_type_cons, ((shen_tail_call(function() {return shen_equal$question$_js(V5285, [shen_type_symbol, "shen_skip"]);})) ? [shen_type_cons, [shen_type_symbol, "where"], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "not"], [shen_type_cons, [shen_type_cons, [shen_type_cons, [shen_type_symbol, "$eq$$eq$"], [shen_type_cons, V5284, []]], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "fail"], []], []]], []]], [shen_type_cons, V5284, []]]] : [shen_type_cons, [shen_type_symbol, "where"], [shen_type_cons, [shen_type_cons, [shen_type_cons, [shen_type_symbol, "and"], [shen_type_cons, V5285, []]], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "not"], [shen_type_cons, [shen_type_cons, [shen_type_cons, [shen_type_symbol, "$eq$$eq$"], [shen_type_cons, V5284, []]], [shen_type_cons, [shen_type_cons, [shen_type_symbol, "fail"], []], []]], []]], []]], [shen_type_cons, V5284, []]]]), []]] : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_form_rule"])))));});});});});});});
}
shen_form_rule;

function shen_$lt$guard$question$$gt$(V5290) {
  if (V5290 == undefined) return shen_$lt$guard$question$$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})(shen_tail_call((function(Parse$_$lt$e$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$e$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$e$gt$)), [shen_type_symbol, "shen_skip"]) : shen_fail_obj);});}), shen_tail_call(shen_$lt$e$gt$, V5290))
))
 : Result);});})((((shen_is_type_js(shen_tail_call(shen_fst, V5290), shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "where"], shen_tail_call(shen_fst, V5290)[1]);}))) ? shen_tail_call((function(Parse$_$lt$guard$gt$) {return new Shen_tco_obj(function() {return (((!shen_tail_call(function() {return shen_equal$question$_js(shen_fail_obj, Parse$_$lt$guard$gt$);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, Parse$_$lt$guard$gt$)), shen_tail_call(shen_snd, Parse$_$lt$guard$gt$)) : shen_fail_obj);});}), shen_tail_call(shen_get_fn_js(shen_$lt$guard$gt$), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V5290)[2]), shen_tail_call(shen_snd, V5290))))
 : shen_fail_obj)))
;
}
shen_$lt$guard$question$$gt$;

function shen_$lt$arrow$gt$(V5295) {
  if (V5295 == undefined) return shen_$lt$arrow$gt$;
  return ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? ((function(Result) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Result, shen_fail_obj);})) ? shen_fail_obj : Result);});})((((shen_is_type_js(shen_tail_call(shen_fst, V5295), shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$lt$_"], shen_tail_call(shen_fst, V5295)[1]);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V5295)[2]), shen_tail_call(shen_snd, V5295)))), [shen_type_symbol, "shen_backward"]) : shen_fail_obj)))
 : Result);});})((((shen_is_type_js(shen_tail_call(shen_fst, V5295), shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "_$gt$"], shen_tail_call(shen_fst, V5295)[1]);}))) ? shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_reassemble), shen_tail_call(shen_fst, V5295)[2]), shen_tail_call(shen_snd, V5295)))), [shen_type_symbol, "shen_forward"]) : shen_fail_obj)))
;
}
shen_$lt$arrow$gt$;

function shen_errordef(V5296) {
  if (V5296 == undefined) return shen_errordef;
  return (shen_tail_call(shen_interror, "syntax error in ~A~%")([shen_tuple, V5296, []]));
}
shen_errordef;

function shen_t$asterisk$_rules(V5297) {
  if (V5297 == undefined) return shen_t$asterisk$_rules;
  return (function lambda1680(V5298) {return (V5298 == undefined) ? lambda1680 : new Shen_tco_obj(function() {return (function lambda1679(V5299) {return (V5299 == undefined) ? lambda1679 : new Shen_tco_obj(function() {return (function lambda1678(V5300) {return (V5300 == undefined) ? lambda1678 : new Shen_tco_obj(function() {return (function lambda1677(V5301) {return (V5301 == undefined) ? lambda1677 : new Shen_tco_obj(function() {return (function lambda1676(V5302) {return (V5302 == undefined) ? lambda1676 : new Shen_tco_obj(function() {return (function lambda1675(V5303) {return (V5303 == undefined) ? lambda1675 : new Shen_tco_obj(function() {return ((function(Throwcontrol) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_cutpoint), Throwcontrol)(shen_tail_call((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? shen_tail_call((function(V4931) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4931, shen_type_cons)) ? shen_tail_call((function(Rule) {return new Shen_tco_obj(function() {return shen_tail_call((function(Rules) {return new Shen_tco_obj(function() {return shen_tail_call((function(M) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_t$asterisk$_rule), Rule), V5298), V5299), V5300), V5301), V5302), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5302)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, M), (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5299), V5302) + 1)), V5302)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_t$asterisk$_rules), Rules), V5298), M), V5300), V5301), V5302)(V5303));});})));});})));});})));});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5302))
;});}), V4931[2])
;});}), V4931[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5297), V5302))
 : Case);});}), shen_tail_call((function(V4930) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4930))) ? (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(V5303)) : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5297), V5302))
)
));});})(shen_tail_call(shen_get_fn_js(shen_catchpoint))))
;});});});});});});});});});});});});
}
shen_t$asterisk$_rules;

function shen_t$asterisk$_rule(V5304) {
  if (V5304 == undefined) return shen_t$asterisk$_rule;
  return (function lambda1686(V5305) {return (V5305 == undefined) ? lambda1686 : new Shen_tco_obj(function() {return (function lambda1685(V5306) {return (V5306 == undefined) ? lambda1685 : new Shen_tco_obj(function() {return (function lambda1684(V5307) {return (V5307 == undefined) ? lambda1684 : new Shen_tco_obj(function() {return (function lambda1683(V5308) {return (V5308 == undefined) ? lambda1683 : new Shen_tco_obj(function() {return (function lambda1682(V5309) {return (V5309 == undefined) ? lambda1682 : new Shen_tco_obj(function() {return (function lambda1681(V5310) {return (V5310 == undefined) ? lambda1681 : new Shen_tco_obj(function() {return ((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? ((function(Error) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, Error), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_type_insecure_rule_error_message), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5306), V5309)), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5307), V5309))), V5309)(V5310)));});})(shen_tail_call(shen_get_fn_js(shen_newpv), V5309)))
 : Case);});})((shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_t$asterisk$_ruleh), V5304), V5305), V5308), V5309), V5310))))
;});});});});});});});});});});});});
}
shen_t$asterisk$_rule;

function shen_t$asterisk$_ruleh(V5311) {
  if (V5311 == undefined) return shen_t$asterisk$_ruleh;
  return (function lambda1690(V5312) {return (V5312 == undefined) ? lambda1690 : new Shen_tco_obj(function() {return (function lambda1689(V5313) {return (V5313 == undefined) ? lambda1689 : new Shen_tco_obj(function() {return (function lambda1688(V5314) {return (V5314 == undefined) ? lambda1688 : new Shen_tco_obj(function() {return (function lambda1687(V5315) {return (V5315 == undefined) ? lambda1687 : new Shen_tco_obj(function() {return ((function(Throwcontrol) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_cutpoint), Throwcontrol)(shen_tail_call((function(V4917) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4917, shen_type_cons)) ? shen_tail_call((function(Patterns) {return new Shen_tco_obj(function() {return shen_tail_call((function(V4918) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4918, shen_type_cons)) ? shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return shen_tail_call((function(V4919) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4919))) ? shen_tail_call((function(NewHyp) {return new Shen_tco_obj(function() {return shen_tail_call((function(B) {return new Shen_tco_obj(function() {return shen_tail_call((function(AllHyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_t$asterisk$_patterns), Patterns), V5312), NewHyp), B), V5314), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5314)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_conc), NewHyp), V5313), AllHyp), V5314)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5314)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Result), B), AllHyp), V5314)(V5315));});})));});})));});})));});})));});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5314))
;});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5314))
;});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5314))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4918[2]), V5314))
;});}), V4918[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4917[2]), V5314))
;});}), V4917[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5311), V5314))
));});})(shen_tail_call(shen_get_fn_js(shen_catchpoint))))
;});});});});});});});});
}
shen_t$asterisk$_ruleh;

function shen_type_insecure_rule_error_message(V5316) {
  if (V5316 == undefined) return shen_type_insecure_rule_error_message;
  return (function lambda1691(V5317) {return (V5317 == undefined) ? lambda1691 : new Shen_tco_obj(function() {return (shen_tail_call(shen_interror, "type error in rule ~A of ~A~%")([shen_tuple, V5316, [shen_tuple, V5317, []]]));});});
}
shen_type_insecure_rule_error_message;

function shen_t$asterisk$_patterns(V5318) {
  if (V5318 == undefined) return shen_t$asterisk$_patterns;
  return (function lambda1696(V5319) {return (V5319 == undefined) ? lambda1696 : new Shen_tco_obj(function() {return (function lambda1695(V5320) {return (V5320 == undefined) ? lambda1695 : new Shen_tco_obj(function() {return (function lambda1694(V5321) {return (V5321 == undefined) ? lambda1694 : new Shen_tco_obj(function() {return (function lambda1693(V5322) {return (V5322 == undefined) ? lambda1693 : new Shen_tco_obj(function() {return (function lambda1692(V5323) {return (V5323 == undefined) ? lambda1692 : new Shen_tco_obj(function() {return ((function(Throwcontrol) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_cutpoint), Throwcontrol)(shen_tail_call((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? shen_tail_call((function(V4900) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4900, shen_type_cons)) ? shen_tail_call((function(Pattern4892) {return new Shen_tco_obj(function() {return shen_tail_call((function(Patterns) {return new Shen_tco_obj(function() {return shen_tail_call((function(V4901) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4901, shen_type_cons)) ? shen_tail_call((function(A4893) {return new Shen_tco_obj(function() {return shen_tail_call((function(V4902) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4902, shen_type_cons)) ? shen_tail_call((function(V4903) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "__$gt$"], V4903);})) ? shen_tail_call((function(V4904) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4904, shen_type_cons)) ? shen_tail_call((function(B) {return new Shen_tco_obj(function() {return shen_tail_call((function(V4905) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4905))) ? shen_tail_call((function(V4906) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4906, shen_type_cons)) ? shen_tail_call((function(V4907) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4907, shen_type_cons)) ? shen_tail_call((function(Pattern) {return new Shen_tco_obj(function() {return shen_tail_call((function(V4908) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4908, shen_type_cons)) ? shen_tail_call((function(V4909) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$colon$"], V4909);})) ? shen_tail_call((function(V4910) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4910, shen_type_cons)) ? shen_tail_call((function(A) {return new Shen_tco_obj(function() {return shen_tail_call((function(V4911) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4911))) ? shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return shen_tail_call((function(Assume) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_unify$excl$, A), A4893), V5322), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_unify$excl$, Pattern), Pattern4892), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_t$asterisk$_assume), Pattern), Assume), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Pattern), A), Assume), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_t$asterisk$_patterns), Patterns), B), Hyp), V5321), V5322)(V5323));});})));});})));});})));});})));});})));});})));});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5322))
;});}), V4906[2])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V4911)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V4911), []), V5322),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V4911), V5322),
  Result);});}), shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return shen_tail_call((function(Assume) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_unify$excl$, A), A4893), V5322), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_unify$excl$, Pattern), Pattern4892), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_t$asterisk$_assume), Pattern), Assume), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Pattern), A), Assume), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_t$asterisk$_patterns), Patterns), B), Hyp), V5321), V5322)(V5323));});})));});})));});})));});})));});})));});})));});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5322))
;});}), V4906[2])
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4910[2]), V5322))
;});}), V4910[1])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V4910)) ? shen_tail_call((function(A) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V4910), [shen_type_cons, A, []]), V5322),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V4910), V5322),
  Result);});}), shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return shen_tail_call((function(Assume) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_unify$excl$, A), A4893), V5322), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_unify$excl$, Pattern), Pattern4892), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_t$asterisk$_assume), Pattern), Assume), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Pattern), A), Assume), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_t$asterisk$_patterns), Patterns), B), Hyp), V5321), V5322)(V5323));});})));});})));});})));});})));});})));});})));});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5322))
;});}), V4906[2])
)
);});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5322))
 : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4908[2]), V5322))
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V4909)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V4909), [shen_type_symbol, "$colon$"]), V5322),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V4909), V5322),
  Result);});}), shen_tail_call((function(V4912) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4912, shen_type_cons)) ? shen_tail_call((function(A) {return new Shen_tco_obj(function() {return shen_tail_call((function(V4913) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4913))) ? shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return shen_tail_call((function(Assume) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_unify$excl$, A), A4893), V5322), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_unify$excl$, Pattern), Pattern4892), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_t$asterisk$_assume), Pattern), Assume), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Pattern), A), Assume), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_t$asterisk$_patterns), Patterns), B), Hyp), V5321), V5322)(V5323));});})));});})));});})));});})));});})));});})));});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5322))
;});}), V4906[2])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V4913)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V4913), []), V5322),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V4913), V5322),
  Result);});}), shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return shen_tail_call((function(Assume) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_unify$excl$, A), A4893), V5322), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_unify$excl$, Pattern), Pattern4892), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_t$asterisk$_assume), Pattern), Assume), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Pattern), A), Assume), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_t$asterisk$_patterns), Patterns), B), Hyp), V5321), V5322)(V5323));});})));});})));});})));});})));});})));});})));});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5322))
;});}), V4906[2])
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4912[2]), V5322))
;});}), V4912[1])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V4912)) ? shen_tail_call((function(A) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V4912), [shen_type_cons, A, []]), V5322),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V4912), V5322),
  Result);});}), shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return shen_tail_call((function(Assume) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_unify$excl$, A), A4893), V5322), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_unify$excl$, Pattern), Pattern4892), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_t$asterisk$_assume), Pattern), Assume), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Pattern), A), Assume), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_t$asterisk$_patterns), Patterns), B), Hyp), V5321), V5322)(V5323));});})));});})));});})));});})));});})));});})));});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5322))
;});}), V4906[2])
)
);});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5322))
 : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4908[2]), V5322))
)
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4908[1]), V5322))
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V4908)) ? shen_tail_call((function(A) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V4908), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, A, []]]), V5322),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V4908), V5322),
  Result);});}), shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return shen_tail_call((function(Assume) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_unify$excl$, A), A4893), V5322), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_unify$excl$, Pattern), Pattern4892), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_t$asterisk$_assume), Pattern), Assume), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Pattern), A), Assume), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_t$asterisk$_patterns), Patterns), B), Hyp), V5321), V5322)(V5323));});})));});})));});})));});})));});})));});})));});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5322))
;});}), V4906[2])
)
);});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5322))
 : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4907[2]), V5322))
;});}), V4907[1])
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V4907)) ? shen_tail_call((function(Pattern) {return new Shen_tco_obj(function() {return shen_tail_call((function(A) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V4907), [shen_type_cons, Pattern, [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, A, []]]]), V5322),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V4907), V5322),
  Result);});}), shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return shen_tail_call((function(Assume) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_unify$excl$, A), A4893), V5322), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_unify$excl$, Pattern), Pattern4892), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_t$asterisk$_assume), Pattern), Assume), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Pattern), A), Assume), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_t$asterisk$_patterns), Patterns), B), Hyp), V5321), V5322)(V5323));});})));});})));});})));});})));});})));});})));});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5322))
;});}), V4906[2])
)
);});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5322))
;});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5322))
 : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4906[1]), V5322))
 : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V4906)) ? shen_tail_call((function(Pattern) {return new Shen_tco_obj(function() {return shen_tail_call((function(A) {return new Shen_tco_obj(function() {return shen_tail_call((function(Hyp) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V4906), [shen_type_cons, [shen_type_cons, Pattern, [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, A, []]]], Hyp]), V5322),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V4906), V5322),
  Result);});}), shen_tail_call((function(Assume) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_unify$excl$, A), A4893), V5322), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_unify$excl$, Pattern), Pattern4892), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_t$asterisk$_assume), Pattern), Assume), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_th$asterisk$), Pattern), A), Assume), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5322)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_t$asterisk$_patterns), Patterns), B), Hyp), V5321), V5322)(V5323));});})));});})));});})));});})));});})));});})));});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5322))
)
);});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5322))
;});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5322))
;});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5322))
 : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5320), V5322))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4904[2]), V5322))
;});}), V4904[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4902[2]), V5322))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4902[1]), V5322))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V4901[2]), V5322))
;});}), V4901[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5319), V5322))
;});}), V4900[2])
;});}), V4900[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5318), V5322))
 : Case);});}), shen_tail_call((function(V4898) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4898))) ? shen_tail_call((function(V4899) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4899))) ? (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_unify$excl$, V5321), V5319), V5322), V5323)) : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V4899)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V4899), []), V5322),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V4899), V5322),
  Result);});}), (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_unify$excl$, V5321), V5319), V5322), V5323)))
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5320), V5322))
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5318), V5322))
)
));});})(shen_tail_call(shen_get_fn_js(shen_catchpoint))))
;});});});});});});});});});});
}
shen_t$asterisk$_patterns;

function shen_t$asterisk$_assume(V5324) {
  if (V5324 == undefined) return shen_t$asterisk$_assume;
  return (function lambda1699(V5325) {return (V5325 == undefined) ? lambda1699 : new Shen_tco_obj(function() {return (function lambda1698(V5326) {return (V5326 == undefined) ? lambda1698 : new Shen_tco_obj(function() {return (function lambda1697(V5327) {return (V5327 == undefined) ? lambda1697 : new Shen_tco_obj(function() {return ((function(Throwcontrol) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_cutpoint), Throwcontrol)(shen_tail_call((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? shen_tail_call((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? shen_tail_call((function(V4890) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4890))) ? (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(V5327)) : ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V4890)) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_bindv), V4890), []), V5326),
  shen_tail_call((function(Result) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_unbindv), V4890), V5326),
  Result);});}), (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(V5327)))
) : false));});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5325), V5326))
 : Case);});}), shen_tail_call((function(A) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_fwhen, shen_tail_call(shen_get_fn_js(shen_placeholder$question$), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5324), V5326))), V5326), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5325), [shen_type_cons, [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5324), V5326), [shen_type_cons, [shen_type_symbol, "$colon$"], [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5326), []]]], []]), V5326)(V5327));});})));});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5326))
)
 : Case);});}), shen_tail_call((function(V4889) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4889, shen_type_cons)) ? shen_tail_call((function(X) {return new Shen_tco_obj(function() {return shen_tail_call((function(Y) {return new Shen_tco_obj(function() {return shen_tail_call((function(A1) {return new Shen_tco_obj(function() {return shen_tail_call((function(A2) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_cut, Throwcontrol), V5326), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_t$asterisk$_assume), X), A1), V5326)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_t$asterisk$_assume), Y), A2), V5326)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5325), shen_tail_call(shen_tail_call(shen_append, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A1), V5326)), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A2), V5326))), V5326)(V5327));});})));});})));});})));});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5326))
;});}), shen_tail_call(shen_get_fn_js(shen_newpv), V5326))
;});}), V4889[2])
;});}), V4889[1])
 : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5324), V5326))
)
));});})(shen_tail_call(shen_get_fn_js(shen_catchpoint))))
;});});});});});});
}
shen_t$asterisk$_assume;

function shen_conc(V5328) {
  if (V5328 == undefined) return shen_conc;
  return (function lambda1703(V5329) {return (V5329 == undefined) ? lambda1703 : new Shen_tco_obj(function() {return (function lambda1702(V5330) {return (V5330 == undefined) ? lambda1702 : new Shen_tco_obj(function() {return (function lambda1701(V5331) {return (V5331 == undefined) ? lambda1701 : new Shen_tco_obj(function() {return (function lambda1700(V5332) {return (V5332 == undefined) ? lambda1700 : new Shen_tco_obj(function() {return ((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? ((function(V4886) {return new Shen_tco_obj(function() {return ((shen_is_type_js(V4886, shen_type_cons)) ? ((function(X) {return new Shen_tco_obj(function() {return ((function(Y) {return new Shen_tco_obj(function() {return ((function(Z) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5330), [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), X), V5331), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), Z), V5331)]), V5331)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_conc), Y), V5329), Z), V5331)(V5332));});}))));});})(shen_tail_call(shen_get_fn_js(shen_newpv), V5331)))
;});})(V4886[2]))
;});})(V4886[1]))
 : false);});})(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5328), V5331)))
 : Case);});})(shen_tail_call((function(V4885) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4885))) ? (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5330), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5329), V5331)), V5331), V5332)) : false);});}), shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5328), V5331))
))
;});});});});});});});});
}
shen_conc;

function shen_findallhelp(V5333) {
  if (V5333 == undefined) return shen_findallhelp;
  return (function lambda1708(V5334) {return (V5334 == undefined) ? lambda1708 : new Shen_tco_obj(function() {return (function lambda1707(V5335) {return (V5335 == undefined) ? lambda1707 : new Shen_tco_obj(function() {return (function lambda1706(V5336) {return (V5336 == undefined) ? lambda1706 : new Shen_tco_obj(function() {return (function lambda1705(V5337) {return (V5337 == undefined) ? lambda1705 : new Shen_tco_obj(function() {return (function lambda1704(V5338) {return (V5338 == undefined) ? lambda1704 : new Shen_tco_obj(function() {return ((function(Case) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Case, false);})) ? (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, V5335), shen_tail_call(shen_value, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), V5336), V5337))), V5337)(V5338))) : Case);});})((shen_tail_call(shen_get_fn_js(shen_incinfs)),
  shen_tail_call(shen_tail_call(shen_tail_call(shen_call, V5334), V5337), (function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_remember), V5336), V5333), V5337)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_fwhen, false), V5337)(V5338));});})));});})))))
;});});});});});});});});});});
}
shen_findallhelp;

function shen_remember(V5339) {
  if (V5339 == undefined) return shen_remember;
  return (function lambda1711(V5340) {return (V5340 == undefined) ? lambda1711 : new Shen_tco_obj(function() {return (function lambda1710(V5341) {return (V5341 == undefined) ? lambda1710 : new Shen_tco_obj(function() {return (function lambda1709(V5342) {return (V5342 == undefined) ? lambda1709 : new Shen_tco_obj(function() {return ((function(B) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, B), (shen_globals[shen_tail_call(shen_tail_call(shen_get_fn_js(shen_deref), V5339), V5341)[1]] = [shen_type_cons, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_deref), V5340), V5341), shen_tail_call(shen_value, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_deref), V5339), V5341))])), V5341)(V5342)));});})(shen_tail_call(shen_get_fn_js(shen_newpv), V5341)))
;});});});});});});
}
shen_remember;

function shen_findall(V5343) {
  if (V5343 == undefined) return shen_findall;
  return (function lambda1715(V5344) {return (V5344 == undefined) ? lambda1715 : new Shen_tco_obj(function() {return (function lambda1714(V5345) {return (V5345 == undefined) ? lambda1714 : new Shen_tco_obj(function() {return (function lambda1713(V5346) {return (V5346 == undefined) ? lambda1713 : new Shen_tco_obj(function() {return (function lambda1712(V5347) {return (V5347 == undefined) ? lambda1712 : new Shen_tco_obj(function() {return ((function(B) {return new Shen_tco_obj(function() {return ((function(A) {return new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_incinfs)),
  (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, A), shen_tail_call(shen_gensym, [shen_type_symbol, "shen_a"])), V5346)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_bind, B), (shen_globals[shen_tail_call(shen_tail_call(shen_get_fn_js(shen_lazyderef), A), V5346)[1]] = [])), V5346)((function () {return new Shen_tco_obj(function() {return (shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_findallhelp), V5343), V5344), V5345), A), V5346)(V5347));});})));});}))));});})(shen_tail_call(shen_get_fn_js(shen_newpv), V5346)))
;});})(shen_tail_call(shen_get_fn_js(shen_newpv), V5346)))
;});});});});});});});});
}
shen_findall;



//## FILE js/toplevel.js

function shen_shen() {return (shen_tail_call(shen_get_fn_js(shen_credits)),
  shen_get_fn_js(shen_loop)());}
shen_shen;

(shen_globals[[shen_type_symbol, "shen_$asterisk$exit_from_repl$asterisk$"][1]] = false);

function shen_loop() {return (shen_tail_call(shen_get_fn_js(shen_initialise$_environment)),
  (shen_tail_call(shen_get_fn_js(shen_prompt)),
  (trap_error_js(function() {return shen_tail_call(shen_get_fn_js(shen_read_evaluate_print));}, function(E) {return shen_tail_call(shen_tail_call(shen_pr, shen_tail_call(shen_error_to_string, E)), shen_tail_call(shen_stoutput, 0));}),
  (((!shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$exit_from_repl$asterisk$"]))) ? shen_get_fn_js(shen_loop)() : false))));}
shen_loop;

function shen_version(V4686) {
  if (V4686 == undefined) return shen_version;
  return (shen_globals[[shen_type_symbol, "$asterisk$version$asterisk$"][1]] = V4686);
}
shen_version;

shen_tail_call(shen_version, "version 3.0");
;

function shen_credits() {return (shen_tail_call(shen_tail_call(shen_intoutput, "~%Shen 2010, copyright (C) 2010 Mark Tarver~%"), []),
  (shen_tail_call(shen_tail_call(shen_intoutput, "www.lambdassociates.org, ~A~%"), [shen_tuple, shen_tail_call(shen_value, [shen_type_symbol, "$asterisk$version$asterisk$"]), []]),
  (shen_tail_call(shen_tail_call(shen_intoutput, "running under ~A, implementation: ~A"), [shen_tuple, shen_tail_call(shen_value, [shen_type_symbol, "$asterisk$language$asterisk$"]), [shen_tuple, shen_tail_call(shen_value, [shen_type_symbol, "$asterisk$implementation$asterisk$"]), []]]),
  (shen_tail_call(shen_intoutput, "~%port ~A ported by ~A~%")([shen_tuple, shen_tail_call(shen_value, [shen_type_symbol, "$asterisk$port$asterisk$"]), [shen_tuple, shen_tail_call(shen_value, [shen_type_symbol, "$asterisk$porters$asterisk$"]), []]])))));}
shen_credits;

function shen_initialise$_environment() {return (shen_get_fn_js(shen_multiple_set)([shen_type_cons, [shen_type_symbol, "shen_$asterisk$call$asterisk$"], [shen_type_cons, 0, [shen_type_cons, [shen_type_symbol, "shen_$asterisk$infs$asterisk$"], [shen_type_cons, 0, [shen_type_cons, [shen_type_symbol, "shen_$asterisk$dumped$asterisk$"], [shen_type_cons, [], [shen_type_cons, [shen_type_symbol, "shen_$asterisk$process_counter$asterisk$"], [shen_type_cons, 0, [shen_type_cons, [shen_type_symbol, "shen_$asterisk$catch$asterisk$"], [shen_type_cons, 0, []]]]]]]]]]]));}
shen_initialise$_environment;

function shen_multiple_set(V4687) {
  if (V4687 == undefined) return shen_multiple_set;
  return (((shen_empty$question$_js(V4687))) ? [] : (((shen_is_type_js(V4687, shen_type_cons) && shen_is_type_js(V4687[2], shen_type_cons))) ? ((shen_globals[V4687[1][1]] = V4687[2][1]),
  (shen_get_fn_js(shen_multiple_set)(V4687[2][2]))) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_multiple_set"]))));
}
shen_multiple_set;

function shen_destroy(V4688) {
  if (V4688 == undefined) return shen_destroy;
  return (shen_tail_call(declare, V4688)([]));
}
shen_destroy;

(shen_globals[[shen_type_symbol, "shen_$asterisk$history$asterisk$"][1]] = []);

function shen_read_evaluate_print() {return ((function(Lineread) {return new Shen_tco_obj(function() {return ((function(History) {return new Shen_tco_obj(function() {return ((function(NewLineread) {return new Shen_tco_obj(function() {return ((function(NewHistory) {return new Shen_tco_obj(function() {return ((function(Parsed) {return new Shen_tco_obj(function() {return (shen_get_fn_js(shen_toplevel)(Parsed));});})(shen_tail_call(shen_fst, NewLineread)))
;});})(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_update$_history), NewLineread), History)))
;});})(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_retrieve_from_history_if_needed), Lineread), History)))
;});})(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$history$asterisk$"])))
;});})(shen_tail_call(shen_get_fn_js(shen_toplineread))))
;}
shen_read_evaluate_print;

function shen_retrieve_from_history_if_needed(V4698) {
  if (V4698 == undefined) return shen_retrieve_from_history_if_needed;
  return (function lambda1614(V4699) {return (V4699 == undefined) ? lambda1614 : new Shen_tco_obj(function() {return (((shen_is_type_js(V4698, shen_tuple) && (shen_is_type_js(shen_tail_call(shen_snd, V4698), shen_type_cons) && (shen_is_type_js(shen_tail_call(shen_snd, V4698)[2], shen_type_cons) && ((shen_empty$question$_js(shen_tail_call(shen_snd, V4698)[2][2])) && (shen_is_type_js(V4699, shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js(shen_tail_call(shen_snd, V4698)[1], shen_tail_call(shen_get_fn_js(shen_exclamation)));}) && shen_tail_call(function() {return shen_equal$question$_js(shen_tail_call(shen_snd, V4698)[2][1], shen_tail_call(shen_get_fn_js(shen_exclamation)));})))))))) ? ((function(PastPrint) {return new Shen_tco_obj(function() {return V4699[1];});})(shen_tail_call(shen_get_fn_js(shen_prbytes), shen_tail_call(shen_snd, V4699[1]))))
 : (((shen_is_type_js(V4698, shen_tuple) && (shen_is_type_js(shen_tail_call(shen_snd, V4698), shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js(shen_tail_call(shen_snd, V4698)[1], shen_tail_call(shen_get_fn_js(shen_exclamation)));})))) ? ((function(Key$question$) {return new Shen_tco_obj(function() {return ((function(Find) {return new Shen_tco_obj(function() {return ((function(PastPrint) {return new Shen_tco_obj(function() {return Find;});})(shen_tail_call(shen_get_fn_js(shen_prbytes), shen_tail_call(shen_snd, Find))))
;});})(shen_tail_call(shen_head, shen_tail_call(shen_tail_call(shen_get_fn_js(shen_find_past_inputs), Key$question$), V4699))))
;});})(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_make_key), shen_tail_call(shen_snd, V4698)[2]), V4699)))
 : (((shen_is_type_js(V4698, shen_tuple) && (shen_is_type_js(shen_tail_call(shen_snd, V4698), shen_type_cons) && ((shen_empty$question$_js(shen_tail_call(shen_snd, V4698)[2])) && shen_tail_call(function() {return shen_equal$question$_js(shen_tail_call(shen_snd, V4698)[1], shen_tail_call(shen_get_fn_js(shen_percent)));}))))) ? (shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_print_past_inputs), (function lambda1613(X) {return (X == undefined) ? lambda1613 : new Shen_tco_obj(function() {return true;});})), shen_tail_call(shen_reverse, V4699)), 0),
  shen_abort()) : (((shen_is_type_js(V4698, shen_tuple) && (shen_is_type_js(shen_tail_call(shen_snd, V4698), shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js(shen_tail_call(shen_snd, V4698)[1], shen_tail_call(shen_get_fn_js(shen_percent)));})))) ? ((function(Key$question$) {return new Shen_tco_obj(function() {return ((function(Pastprint) {return new Shen_tco_obj(function() {return shen_abort();});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_print_past_inputs), Key$question$), shen_tail_call(shen_reverse, V4699)), 0)))
;});})(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_make_key), shen_tail_call(shen_snd, V4698)[2]), V4699)))
 : V4698))));});});
}
shen_retrieve_from_history_if_needed;

function shen_percent() {return 37;}
shen_percent;

function shen_exclamation() {return 33;}
shen_exclamation;

function shen_prbytes(V4700) {
  if (V4700 == undefined) return shen_prbytes;
  return (shen_tail_call(shen_tail_call(shen_map, (function lambda1615(Byte) {return (Byte == undefined) ? lambda1615 : new Shen_tco_obj(function() {return (shen_tail_call(shen_pr, shen_tail_call(shen_n_$gt$string, Byte))(shen_tail_call(shen_stoutput, 0)));});})), V4700),
  (shen_nl(1)));
}
shen_prbytes;

function shen_update$_history(V4701) {
  if (V4701 == undefined) return shen_update$_history;
  return (function lambda1616(V4702) {return (V4702 == undefined) ? lambda1616 : new Shen_tco_obj(function() {return (shen_globals[[shen_type_symbol, "shen_$asterisk$history$asterisk$"][1]] = [shen_type_cons, V4701, V4702]);});});
}
shen_update$_history;

function shen_toplineread() {return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_toplineread$_loop), shen_tail_call(shen_read_byte, shen_tail_call(shen_stinput, 0))), [])([shen_type_symbol, "shen_new_line"]));}
shen_toplineread;

function shen_toplineread$_loop(V4711) {
  if (V4711 == undefined) return shen_toplineread$_loop;
  return (function lambda1618(V4712) {return (V4712 == undefined) ? lambda1618 : new Shen_tco_obj(function() {return (function lambda1617(V4713) {return (V4713 == undefined) ? lambda1617 : new Shen_tco_obj(function() {return (((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "shen_new_line"], V4713);}) && shen_tail_call(function() {return shen_equal$question$_js(V4711, shen_tail_call(shen_get_fn_js(shen_hat)));}))) ? (shen_tail_call(shen_interror, "line read aborted")([])) : ((shen_tail_call(shen_tail_call(shen_element$question$, V4711), [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_newline)), [shen_type_cons, shen_tail_call(shen_get_fn_js(shen_carriage_return)), []]])) ? ((function(Line) {return new Shen_tco_obj(function() {return (((shen_tail_call(function() {return shen_equal$question$_js(Line, shen_fail_obj);}) || (shen_empty$question$_js(Line)))) ? (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_toplineread$_loop), shen_tail_call(shen_read_byte, shen_tail_call(shen_stinput, 0))), shen_tail_call(shen_tail_call(shen_append, V4712), [shen_type_cons, V4711, []]))([shen_type_symbol, "shen_new_line"])) : [shen_tuple, Line, V4712]);});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_compile, shen_$lt$st$_input$gt$), V4712), [])))
 : ((shen_tail_call(function() {return shen_equal$question$_js(-1, V4711);})) ? ((function(Line) {return new Shen_tco_obj(function() {return ((shen_globals[[shen_type_symbol, "shen_$asterisk$exit_from_repl$asterisk$"][1]] = true),
  (((shen_tail_call(function() {return shen_equal$question$_js(Line, shen_fail_obj);}) || (shen_empty$question$_js(Line)))) ? [shen_tuple, [shen_type_cons, [shen_type_symbol, "shen_exit"], []], V4712] : [shen_tuple, Line, V4712]));});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_compile, shen_$lt$st$_input$gt$), V4712), [])))
 : (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_toplineread$_loop), shen_tail_call(shen_read_byte, shen_tail_call(shen_stinput, 0))), shen_tail_call(shen_tail_call(shen_append, V4712), [shen_type_cons, V4711, []]))([shen_type_symbol, "shen_line"])))));});});});});
}
shen_toplineread$_loop;

function shen_hat() {return 94;}
shen_hat;

function shen_newline() {return 10;}
shen_newline;

function shen_carriage_return() {return 13;}
shen_carriage_return;

function shen_tc(V4718) {
  if (V4718 == undefined) return shen_tc;
  return ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$plus$"], V4718);})) ? (shen_globals[[shen_type_symbol, "shen_$asterisk$tc$asterisk$"][1]] = true) : ((shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "_"], V4718);})) ? (shen_globals[[shen_type_symbol, "shen_$asterisk$tc$asterisk$"][1]] = false) : (shen_tail_call(shen_interror, "tc expects a + or -")([]))));
}
shen_tc;

function shen_prompt() {return ((shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$tc$asterisk$"])) ? (shen_tail_call(shen_intoutput, "~%~%(~A+) ")([shen_tuple, shen_tail_call(shen_length, shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$history$asterisk$"])), []])) : (shen_tail_call(shen_intoutput, "~%~%(~A-) ")([shen_tuple, shen_tail_call(shen_length, shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$history$asterisk$"])), []])));}
shen_prompt;

function shen_toplevel(V4719) {
  if (V4719 == undefined) return shen_toplevel;
  return (shen_tail_call(shen_get_fn_js(shen_toplevel$_evaluate), V4719)(shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$tc$asterisk$"])));
}
shen_toplevel;

function shen_find_past_inputs(V4720) {
  if (V4720 == undefined) return shen_find_past_inputs;
  return (function lambda1619(V4721) {return (V4721 == undefined) ? lambda1619 : new Shen_tco_obj(function() {return ((function(F) {return new Shen_tco_obj(function() {return (((shen_empty$question$_js(F))) ? (shen_tail_call(shen_interror, "input not found~%")([])) : F);});})(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_find), V4720), V4721)))
;});});
}
shen_find_past_inputs;

function shen_make_key(V4722) {
  if (V4722 == undefined) return shen_make_key;
  return (function lambda1622(V4723) {return (V4723 == undefined) ? lambda1622 : new Shen_tco_obj(function() {return ((function(Atom) {return new Shen_tco_obj(function() {return ((shen_tail_call(shen_integer$question$, Atom)) ? (function lambda1620(X) {return (X == undefined) ? lambda1620 : new Shen_tco_obj(function() {return shen_equal$question$_js(X, shen_tail_call(shen_tail_call(shen_nth, (Atom + 1)), shen_tail_call(shen_reverse, V4723)));});}) : (function lambda1621(X) {return (X == undefined) ? lambda1621 : new Shen_tco_obj(function() {return (shen_tail_call(shen_get_fn_js(shen_prefix$question$), V4722)(shen_tail_call(shen_get_fn_js(shen_trim_gubbins), shen_tail_call(shen_snd, X))));});}));});})(shen_tail_call(shen_tail_call(shen_tail_call(shen_compile, shen_$lt$st$_input$gt$), V4722), [])[1]))
;});});
}
shen_make_key;

function shen_trim_gubbins(V4724) {
  if (V4724 == undefined) return shen_trim_gubbins;
  return (((shen_is_type_js(V4724, shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js(V4724[1], shen_tail_call(shen_get_fn_js(shen_space)));}))) ? (shen_get_fn_js(shen_trim_gubbins)(V4724[2])) : (((shen_is_type_js(V4724, shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js(V4724[1], shen_tail_call(shen_get_fn_js(shen_newline)));}))) ? (shen_get_fn_js(shen_trim_gubbins)(V4724[2])) : (((shen_is_type_js(V4724, shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js(V4724[1], shen_tail_call(shen_get_fn_js(shen_carriage_return)));}))) ? (shen_get_fn_js(shen_trim_gubbins)(V4724[2])) : (((shen_is_type_js(V4724, shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js(V4724[1], shen_tail_call(shen_get_fn_js(shen_tab)));}))) ? (shen_get_fn_js(shen_trim_gubbins)(V4724[2])) : (((shen_is_type_js(V4724, shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js(V4724[1], shen_tail_call(shen_get_fn_js(shen_left_round)));}))) ? (shen_get_fn_js(shen_trim_gubbins)(V4724[2])) : V4724)))));
}
shen_trim_gubbins;

function shen_space() {return 32;}
shen_space;

function shen_tab() {return 9;}
shen_tab;

function shen_left_round() {return 40;}
shen_left_round;

function shen_find(V4731) {
  if (V4731 == undefined) return shen_find;
  return (function lambda1623(V4732) {return (V4732 == undefined) ? lambda1623 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4732))) ? [] : (((shen_is_type_js(V4732, shen_type_cons) && shen_tail_call(shen_get_fn_js(V4731), V4732[1]))) ? [shen_type_cons, V4732[1], shen_tail_call(shen_tail_call(shen_get_fn_js(shen_find), V4731), V4732[2])] : ((shen_is_type_js(V4732, shen_type_cons)) ? (shen_tail_call(shen_get_fn_js(shen_find), V4731)(V4732[2])) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_find"])))));});});
}
shen_find;

function shen_prefix$question$(V4743) {
  if (V4743 == undefined) return shen_prefix$question$;
  return (function lambda1624(V4744) {return (V4744 == undefined) ? lambda1624 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4743))) ? true : (((shen_is_type_js(V4743, shen_type_cons) && (shen_is_type_js(V4744, shen_type_cons) && shen_tail_call(function() {return shen_equal$question$_js(V4744[1], V4743[1]);})))) ? (shen_tail_call(shen_get_fn_js(shen_prefix$question$), V4743[2])(V4744[2])) : false));});});
}
shen_prefix$question$;

function shen_print_past_inputs(V4754) {
  if (V4754 == undefined) return shen_print_past_inputs;
  return (function lambda1626(V4755) {return (V4755 == undefined) ? lambda1626 : new Shen_tco_obj(function() {return (function lambda1625(V4756) {return (V4756 == undefined) ? lambda1625 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4755))) ? [shen_type_symbol, "$_"] : (((shen_is_type_js(V4755, shen_type_cons) && (!shen_tail_call(shen_get_fn_js(V4754), V4755[1])))) ? (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_print_past_inputs), V4754), V4755[2])((V4756 + 1))) : (((shen_is_type_js(V4755, shen_type_cons) && shen_is_type_js(V4755[1], shen_tuple))) ? (shen_tail_call(shen_tail_call(shen_intoutput, "~A. "), [shen_tuple, V4756, []]),
  (shen_tail_call(shen_get_fn_js(shen_prbytes), shen_tail_call(shen_snd, V4755[1])),
  (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_print_past_inputs), V4754), V4755[2])((V4756 + 1))))) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_print_past_inputs"])))));});});});});
}
shen_print_past_inputs;

function shen_toplevel$_evaluate(V4757) {
  if (V4757 == undefined) return shen_toplevel$_evaluate;
  return (function lambda1627(V4758) {return (V4758 == undefined) ? lambda1627 : new Shen_tco_obj(function() {return (((shen_is_type_js(V4757, shen_type_cons) && (shen_is_type_js(V4757[2], shen_type_cons) && (shen_tail_call(function() {return shen_equal$question$_js([shen_type_symbol, "$colon$"], V4757[2][1]);}) && (shen_is_type_js(V4757[2][2], shen_type_cons) && ((shen_empty$question$_js(V4757[2][2][2])) && shen_tail_call(function() {return shen_equal$question$_js(true, V4758);}))))))) ? (shen_tail_call(shen_get_fn_js(shen_typecheck_and_evaluate), V4757[1])(V4757[2][2][1])) : (((shen_is_type_js(V4757, shen_type_cons) && shen_is_type_js(V4757[2], shen_type_cons))) ? (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_toplevel$_evaluate), [shen_type_cons, V4757[1], []]), V4758),
  (shen_tail_call(shen_nl, 1),
  (((shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$hush$asterisk$"])) ? [shen_type_symbol, "shen_skip"] : shen_tail_call(shen_nl, 1)),
  (shen_tail_call(shen_get_fn_js(shen_toplevel$_evaluate), V4757[2])(V4758))))) : (((shen_is_type_js(V4757, shen_type_cons) && ((shen_empty$question$_js(V4757[2])) && shen_tail_call(function() {return shen_equal$question$_js(true, V4758);})))) ? (shen_tail_call(shen_get_fn_js(shen_typecheck_and_evaluate), V4757[1])(shen_tail_call(shen_gensym, [shen_type_symbol, "A"]))) : (((shen_is_type_js(V4757, shen_type_cons) && ((shen_empty$question$_js(V4757[2])) && shen_tail_call(function() {return shen_equal$question$_js(false, V4758);})))) ? ((function(Eval) {return new Shen_tco_obj(function() {return (((shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$hush$asterisk$"]) || shen_tail_call(function() {return shen_equal$question$_js(Eval, [shen_type_symbol, "shen_unhushed"]);}))) ? [shen_type_symbol, "shen_skip"] : (shen_print(Eval)));});})(shen_tail_call(shen_eval_without_macros, V4757[1])))
 : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_toplevel$_evaluate"]))))));});});
}
shen_toplevel$_evaluate;

function shen_typecheck_and_evaluate(V4759) {
  if (V4759 == undefined) return shen_typecheck_and_evaluate;
  return (function lambda1628(V4760) {return (V4760 == undefined) ? lambda1628 : new Shen_tco_obj(function() {return ((function(Typecheck) {return new Shen_tco_obj(function() {return ((shen_tail_call(function() {return shen_equal$question$_js(Typecheck, false);})) ? (shen_tail_call(shen_interror, "type error~%")([])) : ((function(Eval) {return new Shen_tco_obj(function() {return ((function(Type) {return new Shen_tco_obj(function() {return (((shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$hush$asterisk$"]) || shen_tail_call(function() {return shen_equal$question$_js(Eval, [shen_type_symbol, "shen_unhushed"]);}))) ? [shen_type_symbol, "shen_skip"] : (shen_tail_call(shen_intoutput, "~S : ~R")([shen_tuple, Eval, [shen_tuple, Type, []]])));});})(shen_tail_call(shen_get_fn_js(shen_pretty_type), Typecheck)))
;});})(shen_tail_call(shen_eval_without_macros, V4759)))
);});})(shen_tail_call(shen_tail_call(shen_get_fn_js(shen_typecheck), V4759), V4760)))
;});});
}
shen_typecheck_and_evaluate;

function shen_pretty_type(V4761) {
  if (V4761 == undefined) return shen_pretty_type;
  return (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_mult$_subst), shen_tail_call(shen_value, [shen_type_symbol, "shen_$asterisk$alphabet$asterisk$"])), shen_tail_call(shen_get_fn_js(shen_extract_pvars), V4761))(V4761));
}
shen_pretty_type;

function shen_extract_pvars(V4766) {
  if (V4766 == undefined) return shen_extract_pvars;
  return ((shen_tail_call(shen_get_fn_js(shen_pvar$question$), V4766)) ? [shen_type_cons, V4766, []] : ((shen_is_type_js(V4766, shen_type_cons)) ? (shen_tail_call(shen_union, shen_tail_call(shen_get_fn_js(shen_extract_pvars), V4766[1]))(shen_tail_call(shen_get_fn_js(shen_extract_pvars), V4766[2]))) : []));
}
shen_extract_pvars;

function shen_mult$_subst(V4771) {
  if (V4771 == undefined) return shen_mult$_subst;
  return (function lambda1630(V4772) {return (V4772 == undefined) ? lambda1630 : new Shen_tco_obj(function() {return (function lambda1629(V4773) {return (V4773 == undefined) ? lambda1629 : new Shen_tco_obj(function() {return (((shen_empty$question$_js(V4771))) ? V4773 : (((shen_empty$question$_js(V4772))) ? V4773 : (((shen_is_type_js(V4771, shen_type_cons) && shen_is_type_js(V4772, shen_type_cons))) ? (shen_tail_call(shen_tail_call(shen_get_fn_js(shen_mult$_subst), V4771[2]), V4772[2])(shen_tail_call(shen_tail_call(shen_tail_call(shen_subst, V4771[1]), V4772[1]), V4773))) : (shen_get_fn_js(shen_sys_error)([shen_type_symbol, "shen_mult$_subst"])))));});});});});
}
shen_mult$_subst;


//shen_shen()
