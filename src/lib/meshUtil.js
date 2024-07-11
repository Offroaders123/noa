var i;
var n;
var r;
var o;
var a = Math.sqrt(5);
var s = Math.sqrt(7);
var c = Math.floor;
function u(e) {
  return e - c(e);
}
module.exports = function () {
  i = a;
  n = s;
  r = 0;
  for (; r < arguments.length; ++r) {
    o = arguments[r];
    i = u(i * (o + s));
    n *= o + a;
  }
  return i = u(i * n);
};