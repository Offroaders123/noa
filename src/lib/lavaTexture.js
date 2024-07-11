module.exports = function (e) {
  return function (e) {
    var t = new Float32Array(256);
    var i = new Float32Array(256);
    var n = new Float32Array(256);
    var r = new Float32Array(256);
    var o = new Uint8ClampedArray(1024);
    var a = new BABYLON.DynamicTexture("lavaTexture", {
      width: 16,
      height: 16
    }, e.rendering._scene);
    a.hasAlpha = false;
    a.anisotropicFilteringLevel = 1;
    a.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);
    a.wrapU = 1;
    a.wrapV = 1;
    var s = a.getContext();
    var c = new ImageData(o, 16, 16);
    var u = 0;
    e.on("tick", function (e) {
      if (++u % 2 != 1) {
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
            var c = Math.sin(a * Math.PI * 2 / 16) * 1.2;
            var u = Math.sin(e * Math.PI * 2 / 16) * 1.2;
            for (var l = e - 1; l <= e + 1; l++) {
              for (var h = a - 1; h <= a + 1; h++) {
                var f = l + c & 15;
                var d = h + u & 15;
                s += t[f + d * 16];
              }
            }
            i[e + a * 16] = s / 10 + (n[(e + 0 & 15) + (a + 0 & 15) * 16] + n[(e + 1 & 15) + (a + 0 & 15) * 16] + n[(e + 1 & 15) + (a + 1 & 15) * 16] + n[(e + 0 & 15) + (a + 1 & 15) * 16]) / 4 * 0.8;
            n[e + a * 16] += r[e + a * 16] * 0.01;
            if (n[e + a * 16] < 0) {
              n[e + a * 16] = 0;
            }
            r[e + a * 16] -= 0.06;
            if (Math.random() < 0.005) {
              r[e + a * 16] = 1.5;
            }
          }
        }
        var p = i;
        i = t;
        t = p;
        for (var m = 0; m < 256; m++) {
          var s = t[m] * 2;
          if (s > 1) {
            s = 1;
          }
          if (s < 0) {
            s = 0;
          }
          var g = s;
          var _ = g * 100 + 155;
          var v = g * g * 255;
          var y = g * g * g * g * 128;
          o[m * 4 + 0] = _;
          o[m * 4 + 1] = v;
          o[m * 4 + 2] = y;
          o[m * 4 + 3] = 255;
        }
      }
    };
    return l;
  }(e);
};