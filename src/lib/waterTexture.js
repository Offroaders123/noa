module.exports = function (e) {
  return function (e) {
    var t = new Float32Array(256);
    var i = new Float32Array(256);
    var n = new Float32Array(256);
    var r = new Float32Array(256);
    var o = new Uint8ClampedArray(1024);
    var a = new BABYLON.DynamicTexture("waterTexture", {
      width: 16,
      height: 16
    }, e.rendering._scene);
    a.hasAlpha = true;
    a.anisotropicFilteringLevel = 1;
    a.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);
    a.wrapU = 1;
    a.wrapV = 1;
    var s = a.getContext();
    var c = new ImageData(o, 16, 16);
    var u = 0;
    e.on("tick", function (e) {
      if (++u % 2 != 0) {
        l.redraw();
      }
    });
    var l = {
      texture: a,
      tick: function () {},
      redraw: function () {
        l.update();
        s.clearRect(0, 0, 16, 16);
        s.putImageData(c, 0, 0);
        a.update();
      },
      update: function () {
        for (var e = 0; e < 16; e++) {
          for (var a = 0; a < 16; a++) {
            var s = 0;
            for (var c = e - 1; c <= e + 1; c++) {
              var u = c & 15;
              var l = a & 15;
              s += t[u + l * 16];
            }
            i[e + a * 16] = s / 3.3 + n[e + a * 16] * 0.8;
          }
        }
        for (var e = 0; e < 16; e++) {
          for (var a = 0; a < 16; a++) {
            n[e + a * 16] += r[e + a * 16] * 0.05;
            if (n[e + a * 16] < 0) {
              n[e + a * 16] = 0;
            }
            r[e + a * 16] -= 0.1;
            if (Math.random() < 0.05) {
              r[e + a * 16] = 0.5;
            }
          }
        }
        var h = i;
        i = t;
        t = h;
        for (var f = 0; f < 256; f++) {
          var s = t[f];
          if (s > 1) {
            s = 1;
          }
          if (s < 0) {
            s = 0;
          }
          var d = s * s;
          var p = 32 + d * 32;
          var m = 50 + d * 64;
          var g = 196 + d * 50;
          o[f * 4 + 0] = p;
          o[f * 4 + 1] = m;
          o[f * 4 + 2] = 255;
          o[f * 4 + 3] = g;
        }
      }
    };
    e.waterTexture = a;
    return l;
  }(e);
};