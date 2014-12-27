(function(FM) {

  var onFrame = 0;
  var onFrameRendered = 0;
  var skippedFrames = 0;
  var fps,fpsInterval,startTime,now,then,elapsed;
  var fpsCheckupOnFrame = 0;
  var fpsCheckupTimer = null;
  var fpsOutput0="?";

  var calculateCurrentFrameRate = function() {
     // 3000ms measurement period
     fpsOutput0 = (onFrameRendered - fpsCheckupOnFrame) / 3;
     fpsCheckupOnFrame = onFrameRendered;
  };

  var R = function(fm) {
    var r = this;

    r.options = fm.options;
    r.fm = fm;

    r.preview = $(r.options.preview)[0];
    r.rendering = false;

    r.init_canvas();
  };

  R.prototype.init_canvas = function() {
    var r = this,
        fm = r.fm;

    r.canvas = document.createElement('canvas');
    r.canvas.width = 320;
    r.canvas.height = 320;

    r.preview.appendChild(r.canvas);

    r.ctx = r.canvas.getContext("2d");

    r.canvas_width = 320;
    r.canvas_height = 320;

    r.ctx.fillStyle = 'rgb(255,255,255)';
    r.ctx.fillRect(0, 0, 320, 320);

    r.tint_canvas = document.createElement("canvas");
    r.tint_canvas.width = 320;
    r.tint_canvas.height = 320;
    r.tint_context = r.tint_canvas.getContext("2d");
  };

  R.prototype.start_rendering = function() {
    var r = this;

    // FPS throttle reference: http://stackoverflow.com/questions/19764018/controlling-fps-with-requestanimationframe
    // divide 1000 ms per second by FPS
    fps=30;
    fpsInterval=1000/fps;
    then=Date.now();
    startTime=then;
    if (fpsCheckupTimer == null) {
       fpsCheckupTimer = setInterval(calculateCurrentFrameRate, 3000);
    };

    r.rendering = true;
    requestAnimationFrame(r.render.bind(r));
  };

  R.prototype.stop_rendering = function() {
    this.rendering = false;
  };

  R.prototype.render = function() {
    var r = this,
        fm = r.fm,
        c = r.ctx;

    if (!r.rendering) {
      return;
    }

    onFrame++;
    requestAnimationFrame(r.render.bind(r));

    // calc elapsed time since last loop

    now = Date.now();
    elapsed = now - then;

    // if enough time has elapsed, draw the next frame

    if (elapsed < fpsInterval) {
       skippedFrames++;
       return;
    }

    onFrameRendered++;
    then = now - (elapsed % fpsInterval);

    c.imageSmoothingEnabled = true;

    c.fillStyle = "rgb(255,255,255)";
    c.fillRect(0, 0, r.canvas_width, r.canvas_height);

    //For the moment, we use a 320px radius circle for clipping, per Moto 360
    c.save();


    c.beginPath();

    switch(fm.face_style) {
      default:
        fm.face_style = 'moto360';
      case 'g_watch_r':
      case 'moto360':
        c.arc(r.canvas_width / 2, r.canvas_height / 2, 160, 0, 2 * Math.PI);
        break;
      case 'gear_live':
        c.rect(0, 0, 320, 320);
        break;
      case 'g_watch':
        c.rect(0, 0, 280, 280);
        break;
    }

    c.closePath();
    c.clip();

    //Blank the watch face
    c.fillStyle = "rgb(0,0,0)";
    c.lineWidth = 0;
    c.fillRect(0, 0, r.canvas_width, r.canvas_height);

    // Loop the layers of the watchface and render each layer.
    for (var i in fm.face.watchface) {
      if (fm.face.watchface.hasOwnProperty(i)) {
        r.draw_layer(fm.face.watchface[i]);
      }
    }

    //Apply the clip, then mask off the rest of it for the moto
    c.restore();

    switch(fm.face_style) {
      case 'moto360':
        c.fillStyle = "rgb(255,255,255)"
        c.fillRect(0, 290, 320, 320);
        break;
    }

    $("#diagInfo0").html("onFrame " + onFrame + " skip " + skippedFrames + " FPS " + fpsOutput0);
  };


  R.prototype.draw_layer = function(layer) {
    var r = this,
        fm = r.fm;

    if(fm.test_low_power_mode && !layer.low_power) {
      return;
    }

    switch (layer.type) {
      case 'text':
        r._draw_text(layer);
        break;
      case 'shape':
        r._draw_shape(layer);
        break;
      case 'image':
        r._draw_image(layer);
        break;
      default:
        console.log(layer.type + " is not a valid layer type");
        break;
    }
  };

  R.prototype._draw_image = function(layer) {
    var r = this,
        fm = r.fm,
        c = r.ctx,
        image_hash = layer.hash,
        image = fm.face.images[image_hash].img,

        opacity = fm.parseInt(layer.opacity),
        x = fm.parseInt(layer.x),
        y = fm.parseInt(layer.y),
        ox = 0,
        oy = 0,
        width = fm.parseInt(layer.width),
        height = fm.parseInt(layer.height),
        rotation = fm.parseInt(layer.r);

    switch (layer.alignment) {
      case FM.ImageAlignment.top_left:
        ox -= width;
        oy -= height;
        break;
      case FM.ImageAlignment.top_center:
        ox -= width / 2;
        oy -= height;
        break;
      case FM.ImageAlignment.top_right:
        oy -= height;
        break;
      case FM.ImageAlignment.center_left:
        ox -= width;
        oy -= height / 2;
        break;
      case FM.ImageAlignment.center:
        ox -= width / 2;
        oy -= height / 2;
        break;
      case FM.ImageAlignment.center_right:
        oy -= height / 2;
        break;
      case FM.ImageAlignment.bottom_left:
        ox -= width;
        break;
      case FM.ImageAlignment.bottom_center:
        ox -= width / 2;
        break;
      case FM.ImageAlignment.bottom_right:
        //This is the default rendering position
        break;
    };

    //For rotation, theres a fair amount that needs to be done
    //The easiest way, will be to save the canvas, translate,
    //  rotate, draw, and restore
    c.save()
    c.translate(x, y);
    c.rotate(rotation * Math.PI / 180);
    c.globalAlpha = opacity / 100;

    if (layer.is_tinted)
    {
       // cache populate on first hit
       // Note: this logic assumes that there are no variables/hashtags in the layer.tint_color field
       if (! fm.face.images[image_hash].hasOwnProperty('imgTint'))
         fm.face.images[image_hash].imgTint = r._tint_image(image, layer.tint_color);

       image = fm.face.images[image_hash].imgTint;
    };

    c.drawImage(image, ox, oy, width, height);

    c.restore();
  }

  // source: http://www.playmycode.com/blog/2011/06/realtime-image-tinting-on-html5-canvas/
  R.prototype._tint_image_genRGBKs = function(img) {
      // function generateRGBKs( img ) {
        var r = this;
        var w = img.width;
        var h = img.height;
        var rgbks = [];

        var canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;

        var ctx = canvas.getContext("2d");
        ctx.drawImage( img, 0, 0 );

        var pixels = ctx.getImageData( 0, 0, w, h ).data;

        // 4 is used to ask for 3 images: red, green, blue and
        // black in that order.
        for ( var rgbI = 0; rgbI < 4; rgbI++ ) {
            var canvas = document.createElement("canvas");
            canvas.width  = w;
            canvas.height = h;

            var ctx = canvas.getContext('2d');
            ctx.drawImage( img, 0, 0 );
            var to = ctx.getImageData( 0, 0, w, h );
            var toData = to.data;

            for (
                    var i = 0, len = pixels.length;
                    i < len;
                    i += 4
            ) {
                toData[i  ] = (rgbI === 0) ? pixels[i  ] : 0;
                toData[i+1] = (rgbI === 1) ? pixels[i+1] : 0;
                toData[i+2] = (rgbI === 2) ? pixels[i+2] : 0;
                toData[i+3] =                pixels[i+3]    ;
            }

            ctx.putImageData( to, 0, 0 );

            // image is _slightly_ faster then canvas for this, so convert
            var imgComp = new Image();
            imgComp.src = canvas.toDataURL();

            rgbks.push( imgComp );
        }

        return rgbks;
    };

  R.prototype._tint_image_doGenerate = function(img, rgbks, red, green, blue) {
      //function generateTintImage( img, rgbks, red, green, blue ) {
        var r = this;
        var buff = document.createElement( "canvas" );
        buff.width  = img.width;
        buff.height = img.height;

        var ctx  = buff.getContext("2d");

        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'copy';
        ctx.drawImage( rgbks[3], 0, 0 );

        ctx.globalCompositeOperation = 'lighter';
        if ( red > 0 ) {
            ctx.globalAlpha = red   / 255.0;
            ctx.drawImage( rgbks[0], 0, 0 );
        }
        if ( green > 0 ) {
            ctx.globalAlpha = green / 255.0;
            ctx.drawImage( rgbks[1], 0, 0 );
        }
        if ( blue > 0 ) {
            ctx.globalAlpha = blue  / 255.0;
            ctx.drawImage( rgbks[2], 0, 0 );
        }

        return buff;
    }

  R.prototype._tint_image = function(img, tint_color) {
    //Takes an image, returns an image
        var r = this;
        var rgbks = r._tint_image_genRGBKs( img );
        var red = (tint_color >> 16) & 0xFF;
        var green = (tint_color >> 8) & 0xFF;
        var blue = tint_color & 0xFF;
        var tintImg = r._tint_image_doGenerate( img, rgbks, red, green, blue );

        return tintImg;
  };

  R.prototype._draw_shape = function(layer) {
    var r = this,
        fm = r.fm,
        c = r.ctx,
        x = fm.parseInt(layer.x),
        y = fm.parseInt(layer.y),
        radius = fm.parseInt(layer.radius);


    /*
     * Some Notes, per Reverse Engineering
     * shape_opt 0 - Fill, 1 - Stroke
     */
    if (layer.shape_opt) {
      c.strokeStyle = fm._parseColor(layer.color, layer.opacity);
    } else {
      c.fillStyle = fm._parseColor(layer.color, layer.opacity);
    }

    c.lineWidth = fm.parseInt(layer.stroke_size) / 2;


    switch (layer.shape_type) {
      case FM.ShapeTypes.circle:
        c.beginPath();
        c.arc(x, y, radius, 0, 2 * Math.PI);

        if (layer.shape_opt === 0) {
          c.fill();
        } else {
          c.stroke();
        }

        c.closePath();
        break;

      case FM.ShapeTypes.square:
      case FM.ShapeTypes.line:
        var rotation = fm.parseInt(layer.r);
        //For rotation, theres a fair amount that needs to be done
        //The easiest way, will be to save the canvas, translate,
        //  rotate, draw, and restore
        c.save()
        // http://www.html5canvastutorials.com/advanced/html5-canvas-transform-rotate-tutorial/
        // translate context to center of canvas
        c.translate(r.width / 2, r.height / 2);
        //c.translate(x / 2, y / 2);
        c.rotate(rotation * Math.PI / 180);

        //As far as I can tell, a line is just a rect, and a square is really a rect
        if (layer.shape_opt === 0) {
          c.fillRect(x, y, fm.parseInt(layer.width), fm.parseInt(layer.height));
        } else {
          c.strokeRect(x, y, fm.parseInt(layer.width), fm.parseInt(layer.height));
        }

        c.restore();

        break;

      case FM.ShapeTypes.triangle:
        //Fun little hack to skip duplication of code
        layer.sides = "3";

      case FM.ShapeTypes.polygon:
        var num_sides = parseInt(layer.sides),
          angle = 2 * Math.PI / num_sides;

        var rotation = (90 + fm.parseInt(layer.r)) * Math.PI / 180;

        c.beginPath();

        c.moveTo(x + radius * Math.cos(angle + rotation), y + radius * Math.sin(angle + rotation));

        for (var i = 0; i <= num_sides; i++) {
          c.lineTo(x + radius * Math.cos(i * angle + rotation), y + radius * Math.sin(i * angle + rotation));
        }

        c.closePath();

        if (layer.shape_opt) {
          c.stroke();
        } else {
          c.fill();
        }
        break;

      default:
        break;
    }
  }


  R.prototype._draw_text = function(layer) {
    var r = this,
        fm = r.fm,
        c = r.ctx,
        rotation = fm.parseInt(layer.r),
        x = fm.parseInt(layer.x),
        y = fm.parseInt(layer.y),
        text = fm.parse(layer.text);

    if (layer.transform == FM.Transform.uppercase) {
      text = text.toUpperCase();
    } else if (layer.transform == FM.Transform.lowercase) {
      text = text.toLowerCase();
    }

    c.textAlign = fm._parseAlignment(layer.alignment);

    c.save();
    c.translate(x, y);
    c.rotate(rotation * (Math.PI / 180));

    if(fm.test_low_power_mode) {
      c.fillStyle = fm._parseColor(layer.low_power_color, layer.opacity);
    } else {
      c.fillStyle = fm._parseColor(layer.color, layer.opacity);
    }

    if (layer.font_hash) {
      c.font = layer.size + "px " + layer.font_hash.replace(/\W/g, '_');
    } else {
      c.font = layer.size + "px Arial";
    }

    if (layer.bold) {
      c.font = "bold " + c.font;
    }
    if (layer.italic) {
      c.font = "italic " + c.font;
    }
    c.fillText(text, 0, 0);

    c.restore();
  };

  R.prototype._create_preview_image = function() {
    var r = this;

    return r.canvas.toDataURL().split(",")[1];
  }

  FM.Renderer = R;
})(FaceMaker);
