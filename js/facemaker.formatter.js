(function(FM) {
  // Convert numbers to words
  // copyright 25th July 2006, by Stephen Chapman http://javascript.about.com
  // permission to use this Javascript on your web page is granted
  // provided that all of the code (including this copyright notice) is
  // used exactly as shown (you can change the numbering system if you wish)
  var th = ['', 'thousand', 'million', 'billion', 'trillion'];
  var dg = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  var tn = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  var tw = ['twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  function toWords(s) {
      s = s.toString();
      s = s.replace(/[\, ]/g, '');
      if (s != parseFloat(s)) return 'not a number';
      var x = s.indexOf('.');
      if (x == -1) x = s.length;
      if (x > 15) return 'too big';
      var n = s.split('');
      var str = '';
      var sk = 0;
      for (var i = 0; i < x; i++) {
        if ((x - i) % 3 == 2) {
          if (n[i] == '1') {
            str += tn[Number(n[i + 1])] + ' ';
            i++;
            sk = 1;
          } else if (n[i] != 0) {
            str += tw[n[i] - 2] + ' ';
            sk = 1;
          }
        } else if (n[i] != 0) {
          str += dg[n[i]] + ' ';
          if ((x - i) % 3 == 0) str += 'hundred ';
          sk = 1;
        }
        if ((x - i) % 3 == 1) {
          if (sk) str += th[(x - i - 1) / 3] + ' ';
          sk = 0;
        }
      }
      if (x != s.length) {
        var y = s.length;
        str += 'point ';
        for (var i = x + 1; i < y; i++) str += dg[n[i]] + ' ';
      }
      return str.replace(/\s+/g, ' ');
    }
    //End copyright

  var m_names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    m_names_short = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"],
    conditional_regex = /\$(\w+\.?\d*)(=|!=|>|<|<=|>=)(\w+\.?\d*)(\|\||&&)?(\w+\.?\d*)?(=|!=|>|<|<=|>=)?(\w+\.?\d*)?(\|\||&&)?(\w+\.?\d*)?(=|!=|>|<|<=|>=)?(\w+\.?\d*)?\?([^:\r\n]*):([^$\r\n]*)\$/g,
    math_regex = /[\[\(]?([\d\.]+)([\+\-\*\/\%\^])([\d\.]+)[\]\)]?/g,
    function_regex = /(\c+)\([\d\.+]\)/g,
    const_regex = /\((.+)(pi|e)(.+)\)/g,

    stolen_regex = /\$(\w+\.?\d*)(=|!=|>|<|<=|>=)(\w+\.?\d*)(\|\||&&)?(\w+\.?\d*)?(=|!=|>|<|<=|>=)?(\w+\.?\d*)?(\|\||&&)?(\w+\.?\d*)?(=|!=|>|<|<=|>=)?(\w+\.?\d*)?\?([^:\r\n]*):([^$\r\n]*)\$/g;

  function conditional(match, cond) {
    return runstatement(cond);
  };

  function runstatement(stmt) {
    try {
      with(FM.SCOPE) {
        return eval(stmt);
      }
    } catch(e) {
      return stmt;
    }
  };

  // source: http://stackoverflow.com/questions/141348/what-is-the-best-way-to-parse-a-time-into-a-date-object-from-user-input-in-javas
  function parseTimeString(timeString) {
    if (timeString == '') return null;

    var time = timeString.match(/(\d+)(:(\d\d))?\s*(p?)/i);
    if (time == null) return null;

    var hours = parseInt(time[1],10);
    if (hours == 12 && !time[4]) {
          hours = 0;
    }
    else {
        hours += (hours < 12 && time[4])? 12 : 0;
    }
    var d = new Date();
    d.setHours(hours);
    d.setMinutes(parseInt(time[3],10) || 0);
    d.setSeconds(0, 0);
    return d;
  };


  FM.prototype.parse = function(instr) {
    var out = "",
        paren_depth = 0,
        cond_depth = 0,
        statement = '';

    instr = fm.replace_tags(instr)
      .replace('[', '(').replace(']', ')')
      .replace("=", "==")
      .replace(">==", ">=")
      .replace("<==", "<=")
      .replace(/\$(.+)\$/g, conditional);

    for(var i = 0; i < instr.length; i++) {
      if(instr[i] === '(') {
        paren_depth++;
      }

      if(paren_depth === 0) {
        out += instr[i];
      } else {
        statement += instr[i];
      }

      if(instr[i] === ')') {
        paren_depth--;
        if(paren_depth === 0) {
          out += runstatement(statement);
          statement = '';
        }
      } else if(paren_depth < 0) {
        throw 'Mismatched parentheses';
      }
    }

    return out;
  }

  FM.prototype.parseInt = function(instr) {
    return parseInt(this.parse(instr));
  }

  FM.SCOPE = {
    pi: Math.PI,
    e: Math.E,

    rand: function(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
    abs: Math.abs,

    cos: Math.cos,
    sin: Math.sin,
    tan: Math.tan,

    acos: Math.acos,
    asin: Math.asin,
    atan: Math.atan,

    cosh: Math.cosh,
    sinh: Math.sinh,
    tanh: Math.tanh,

    cbrt: Math.cbrt,
    ceil: Math.ceil,
    floor: Math.floor,
    log: Math.log,
    log2: Math.log2,
    log10: Math.log10,
    sqrt: Math.sqrt,
    round: Math.round,
    exp: Math.exp,
    expm1: Math.expm1,
    deg: function(rad) { return (rad / 180) * Math.PI; },
    rad: function(deg) { return (deg / Math.PI) * 180; }
  }

  FM.prototype.replace_tags = function(input_str) {
    return input_str.replace(/#(\w+)#/g, this.tags_replacer.bind(this));
  };

  FM.prototype.tags_replacer = function(full_match, match) {
    var fm = this,
        d;

    if(fm.use_test_date_time) {
      d = fm.test_date_time;
    } else {
      d = new Date();
    }

    if (FM.FormatTags.hasOwnProperty(match)) {
      try {
        return FM.FormatTags[match](fm, d, fm._weather_data);
      } catch(e) {
        console.log(e);
        return 'ERROR';
      }
    }

    return "0";
  };

  FM.FormatTags = {};

  FM.AddFormatTag = function(tag, description, func) {
    this.FormatTags[tag] = func;
    func.tag = tag;
    func.description = description;
  }

  FM.AddFormatTag("Dy", "Year", function(fm, d, w) {
    return d.format("Y");
  });

  FM.AddFormatTag("Dyy", "Short Year", function(fm, d, w) {
    return d.format("y");
  });

  FM.AddFormatTag("Dyyy", "Year", function(fm, d, w) {
    return d.format("Y");
  });

  FM.AddFormatTag("DM", "Month in Year (Numeric)", function(fm, d, w) {
    return d.format("n");
  });

  FM.AddFormatTag("DMM", "Month in Year (Numeric)", function(fm, d, w) {
    return d.format("m");
  });

  FM.AddFormatTag("DMMM", "Month in Year (Short String)", function(fm, d, w) {
    return d.format("M");
  });

  FM.AddFormatTag("DMMMM", "Month in Year (String)", function(fm, d, w) {
    return d.format("F");
  });

  FM.AddFormatTag("DW", "Week in Month", function(fm, d, w) {
    return (0 | d.getDate() / 7) + 1;
  });

  FM.AddFormatTag("Dw", "Week in Year", function(fm, d, w) {
    return d.format("W");
  });

  FM.AddFormatTag("DD", "Day in Year ", function(fm, d, w) {
    return d.format("z");
  });

  FM.AddFormatTag("Dd", "Day in Month ", function(fm, d, w) {
    return d.format("d");
  });

  FM.AddFormatTag("DE", "Day of Week ", function(fm, d, w) {
    return d.format("D");
  });

  FM.AddFormatTag("DEEEE", "Day of Week ", function(fm, d, w) {
    return d.format("I");
  });

  FM.AddFormatTag("DF", "Day of Week in Month", function(fm, d, w) {
    return 3; // ToDo: UNIMPLEMENTED
  });

  FM.AddFormatTag("Da", "AM/PM", function(fm, d, w) {
    return d.format("A");
  });

  FM.AddFormatTag("Dh", "Hour in Day (1-12)", function(fm, d, w) {
    return d.format("g");
  });

  FM.AddFormatTag("Dk", "Hour in Day (1-24)", function(fm, d, w) {
    return d.format("h");
  });

  FM.AddFormatTag("DH", "Hour in Day (0-23)", function(fm, d, w) {
    return d.format("H");
  });

  FM.AddFormatTag("DK", "Hour in Day (0-11)", function(fm, d, w) {
    return d.format("h");
  });

  FM.AddFormatTag("DHZ", "Hour in Day (leading zero) (00-23)", function(fm, d, w) {
    return d.format("G");
  });

  FM.AddFormatTag("DkZ", "Hour in Day (leading zero) (01-24)", function(fm, d, w) {
    return d.format("G"); //TODO: Implement
  });

  FM.AddFormatTag("DKZ", "Hour in Day (12 hour, leading zero) (00-11)", function(fm, d, w) {
    return d.format("h");
  });

  FM.AddFormatTag("DhZ", "Hour in Day (12 hour, leading zero) (01-12)", function(fm, d, w) {
    return d.format("h");
  });

  FM.AddFormatTag("DhoT", "Value for Hour Rotation (12 hour)", function(fm, d, w) {
    return d.getHours() * 30; // 360 / 12
  });

  FM.AddFormatTag("DhoTb", "Value for Hour Rotation (24 hour)", function(fm, d, w) {
    return d.getHours() * 15; // 360 / 24
  });

  FM.AddFormatTag("DWFK", "Value for Hour Rotation (12 hour, wearface)", function(fm, d, w) {
    return d.getHours() * 30; // 360 / 12
  });

  FM.AddFormatTag("DWFH", "Value for Hour Rotation (24 hour, wearface)", function(fm, d, w) {
    return d.getHours() * 15; // 360 / 24
  });

  FM.AddFormatTag("DWFKS", "Smooth Value for Hour Rotation (12 hour, wearface)", function(fm, d, w) {
    return (d.getHours() * 30) + (d.getMinutes() * 0.50); // 360 / 12
  });

  FM.AddFormatTag("DWFHS", "Smooth Value for Hour Rotation (24 hour, wearface)", function(fm, d, w) {
    return (d.getHours() * 15) + (d.getMinutes() * 0.25); // 360 / 24
  });

  //String Values, how should I handle this?
  FM.AddFormatTag("DhT", "String value for hour (12 hour)", function(fm, d, w) {
    return toWords((d.getHours() - 1) % 12);
  });

  FM.AddFormatTag("DkT", "String value for hour (24 hour)", function(fm, d, w) {
    return toWords(d.getHours());
  });

  FM.AddFormatTag("Dm", "Minute in Hour", function(fm, d, w) {
    return d.getMinutes();
  });

  FM.AddFormatTag("DmZ", "Minute in Hour (leading zero)", function(fm, d, w) {
    return FM.pad("" + d.getMinutes(), 2);
  });

  FM.AddFormatTag("DmoT", "Value for minute hand rotation", function(fm, d, w) {
    return d.getMinutes() * 6; // 360 / 60
  });

  FM.AddFormatTag("DWFM", "Value for minute hand rotation (wearface image)", function(fm, d, w) {
    return d.getMinutes() * 6; // 360 / 60
  });

  FM.AddFormatTag("DmT", "String value for minutes", function(fm, d, w) {
    return toWords(d.getMinutes());
  });

  FM.AddFormatTag("DmMT", "String value for minutes (tens place)", function(fm, d, w) {
    return toWords(Math.floor(d.getMinutes() / 10) * 10); // floor(45 / 10) * 10 = 40
  });

  FM.AddFormatTag("DmST", "String value for minutes (ones place)", function(fm, d, w) {
    return toWords(d.getMinutes() % 10);
  });

  FM.AddFormatTag("Ds", "Second in minute", function(fm, d, w) {
    return d.getSeconds();
  });

  FM.AddFormatTag("DsZ", "Second in minute (leading zero)", function(fm, d, w) {
    return FM.pad(d.getSeconds(), 2);
  });

  FM.AddFormatTag("DseT", "Value for second hand rotation", function(fm, d, w) {
    return d.getSeconds() * 6;
  });

  FM.AddFormatTag("DWFS", "Rotation value for second hand (wearface image)", function(fm, d, w) {
    return d.getSeconds() * 6;
  });

  FM.AddFormatTag("DWFSS", "Smooth Rotation value for second hand (wearface image)", function(fm, d, w) {
    return (d.getSeconds() + (d.getMilliseconds() / 1000)) * 6;
  });

  FM.AddFormatTag("Dz", "Timezone", function(fm, d, w) {
    return 'MST'; //Unimplemented
  });

  FM.AddFormatTag("Dzzzz", "Timezone", function(fm, d, w) {
    return "Mountain Standard Time"; // Unimplemented
  });

  FM.AddFormatTag("BLP", "Battery Level Percentage", function(fm, d, w) {
    return $("#battery").val() + "%"; // Unimplemented
  });

  FM.AddFormatTag("BLN", "Battery Level Integer", function(fm, d, w) {
    return $("#battery").val(); // Unimplemented
  });

  FM.AddFormatTag("BTC", "Battery Temperature (°C)", function(fm, d, w) {
    return "31°C"; // Unimplemented
  });

  FM.AddFormatTag("BTI", "Battery Temperature (°F)", function(fm, d, w) {
    return "88°F"; // Unimplemented
  });

  FM.AddFormatTag("BTCN", "Battery Temperature (Celcius)", function(fm, d, w) {
    return "31"; // Unimplemented
  });

  FM.AddFormatTag("BTIN", "Battery Temperature (Fahrenheit)", function(fm, d, w) {
    return "88"; // Unimplemented
  });

  FM.AddFormatTag("BS", "Battery Charging Status", function(fm, d, w) {
    return "Charging"; // Unimplemented
  });

  FM.AddFormatTag("ZLP", "Low Power Mode", function(fm, d, w) {
    return "" + fm.test_low_power_mode; // Unimplemented
  });

  FM.AddFormatTag("ZSC", "Step Count (may not be accurate)", function(fm, d, w) {
    return "0"; // Unimplemented
  });

  FM.AddFormatTag("WM", "Weather Units (F/M)", function(fm, d, w) {
    return w.units.temperature;
  });

  FM.AddFormatTag("WLC", "Weather Location", function(fm, d, w) {
    return w.location.city;
  });

  FM.AddFormatTag("WTH", "Today's High", function(fm, d, w) {
    return w.list[0].high;
  });

  FM.AddFormatTag("WTL", "Todays' Low", function(fm, d, w) {
    return w.list[0].low;
  });

  FM.AddFormatTag("WCT", "Current Temp", function(fm, d, w) {
    return w.current.temp;
  });

  FM.AddFormatTag("WCCI", "Current Condition Icon", function(fm, d, w) {
    return w.current.code;
  });

  FM.AddFormatTag("WCCT", "Current Condition Text", function(fm, d, w) {
    return w.current.text;
  });

  FM.AddFormatTag("WCHN", "Current Humidity Number", function(fm, d, w) {
    return w.atmosphere.humidity;
  });

  FM.AddFormatTag("WCHP", "Current Humidity Percentage", function(fm, d, w) {
    return w.atmosphere.humidity + "%";
  });

  FM.AddFormatTag("WSUNRISE", "Time of sunrise", function(fm, d, w) {
    return w.astronomy.sunrise;
  });

  FM.AddFormatTag("WSUNSET", "Time of sunset", function(fm, d, w) {
    return w.astronomy.sunset;
  });

  FM.AddFormatTag("WSUNRISEH24", "Hour of sunrise 24", function(fm, d, w) {
	// console.error("WSUNRISEH24 " + parseTimeString(w.astronomy.sunrise).format("H"));
    return parseTimeString(w.astronomy.sunrise).format("H");
  });

  FM.AddFormatTag("WSUNSETH24", "Hour of sunset 24", function(fm, d, w) {
    return parseTimeString(w.astronomy.sunset).format("H");
  });


  FM.AddFormatTag("WFAH", "Forecast Day 1 High", function(fm, d, w) {
    return w.list[1].high;
  });

  FM.AddFormatTag("WFAL", "Forecast Day 1 Low", function(fm, d, w) {
    return w.list[1].low;
  });

  FM.AddFormatTag("WFACT", "Forecast Day 1 Condition Text", function(fm, d, w) {
    return w.list[1].text;
  });

  FM.AddFormatTag("WFACI", "Forecast Day 1 Condition Icon", function(fm, d, w) {
    return w.list[1].code;
  });

  FM.AddFormatTag("WFBH", "Forecast Day 2 High", function(fm, d, w) {
    return w.list[2].high;
  });

  FM.AddFormatTag("WFBL", "Forecast Day 2 Low", function(fm, d, w) {
    return w.list[2].low;
  });

  FM.AddFormatTag("WFBCT", "Forecast Day 2 Condition Text", function(fm, d, w) {
    return w.list[2].text;
  });

  FM.AddFormatTag("WFBCI", "Forecast Day 2 Condition Icon", function(fm, d, w) {
    return w.list[2].code;
  });

  FM.AddFormatTag("WFCH", "Forecast Day 3 High", function(fm, d, w) {
    return w.list[3].high;
  });

  FM.AddFormatTag("WFCL", "Forecast Day 3 Low", function(fm, d, w) {
    return w.list[3].low;
  });

  FM.AddFormatTag("WFCCT", "Forecast Day 3 Condition Text", function(fm, d, w) {
    return w.list[3].text;
  });

  FM.AddFormatTag("WFCCI", "Forecast Day 3 Condition Icon", function(fm, d, w) {
    return w.list[3].code;
  });

  FM.AddFormatTag("WFDH", "Forecast Day 4 High", function(fm, d, w) {
    return w.list[4].high;
  });

  FM.AddFormatTag("WFDL", "Forecast Day 4 Low", function(fm, d, w) {
    return w.list[4].low;
  });

  FM.AddFormatTag("WFDCT", "Forecast Day 4 Condition Text", function(fm, d, w) {
    return w.list[4].text;
  });

  FM.AddFormatTag("WFDCI", "Forecast Day 4 Condition Icon", function(fm, d, w) {
    return w.list[4].code;
  });

  FM.AddFormatTag("WFEH", "Forecast Day 5 High", function(fm, d, w) {
    return w.list[5].high;
  });

  FM.AddFormatTag("WFEL", "Forecast Day 5 Low", function(fm, d, w) {
    return w.list[5].low;
  });

  FM.AddFormatTag("WFECT", "Forecast Day 5 Condition Text", function(fm, d, w) {
    return w.list[5].text;
  });

  FM.AddFormatTag("WFECI", "Forecast Day 5 Condition Icon", function(fm, d, w) {
    return w.list[5].code;
  });

  FM.AddFormatTag("WFFH", "Forecast Day 6 High", function(fm, d, w) {
    return "";
  });

  FM.AddFormatTag("WFFL", "Forecast Day 6 Low", function(fm, d, w) {
    return "";
  });

  FM.AddFormatTag("WFFCT", "Forecast Day 6 Condition Text", function(fm, d, w) {
    return "";
  });

  FM.AddFormatTag("WFFCI", "Forecast Day 6 Condition Icon", function(fm, d, w) {
    return "";
  });

  FM.AddFormatTag("WFGH", "Forecast Day 7 High", function(fm, d, w) {
    return "";
  });

  FM.AddFormatTag("WFGL", "Forecast Day 7 Low", function(fm, d, w) {
    return "";
  });

  FM.AddFormatTag("WFGCT", "Forecast Day 7 Condition Text", function(fm, d, w) {
    return "";
  });

  FM.AddFormatTag("WFGCI", "Forecast Day 7 Condition Icon", function(fm, d, w) {
    return "";
  });


  //I'm putting weather stuff here, I'm not sure if this should be
  // broken out, but it goes with formatting

  FM.prototype.init_weather = function() {
    var fm = this;

    if (navigator.geolocation) {

      navigator.geolocation.getCurrentPosition(fm.getLocation.bind(fm));

    } else {

      console.log("location not available, using default");

      fm._location = {
        latitude: 35,
        longitude: 139
      };

      fm.UpdateWeather();

    }

  };

  FM.prototype.getLocation = function(pos) {
    fm._location = pos.coords;

    fm.UpdateWeather();
  };

  FM.makeWeatherURL = function(coords) {
    //Now with 100% more yahoo, to match Facer
    var API = "https://query.yahooapis.com/v1/public/yql?format=json&q=",
        YQL = "SELECT * FROM weather.forecast" +
              "  WHERE woeid IN " +
              "    (SELECT woeid FROM geo.placefinder " +
              "       WHERE text=\"" + coords.latitude + "," + coords.longitude + "\" AND gflags=\"R\"" +
              "    );",
        url = API + encodeURIComponent(YQL);

    return url;
  }

  FM.prototype.UpdateWeather = function() {
    var fm = this,
      url = FM.makeWeatherURL(fm._location);

    $.getJSON(url, fm.HandleWeatherResponse.bind(fm));
  };

  FM.prototype.HandleWeatherResponse = function(results, status) {
    var res = results.query.results.channel,
        data = {};

    data.forecast = res.item.forecast;
    data.astronomy = res.astronomy;
    data.current = res.item.condition;
    data.atmosphere = res.atmosphere;
    data.wind = res.wind;
    data.units = res.units;
    data.location = res.location;

    console.log(res);

    fm._weather_data = data;
  };

})(FaceMaker)
