!function(n,t,r){if(n){var a=CryptoJS.lib.WordArray,e=a.init;(a.init=function(a){if(a instanceof n&&(a=new t(a)),(a instanceof Int8Array||r&&a instanceof r||a instanceof Int16Array||a instanceof Uint16Array||a instanceof Int32Array||a instanceof Uint32Array||a instanceof Float32Array||a instanceof Float64Array||a instanceof DataView)&&(a=new t(a.buffer,a.byteOffset,a.byteLength)),a instanceof t){for(var i=a.byteLength,f=[],o=0;o<i;o++)f[o>>>2]|=a[o]<<24-o%4*8;e.call(this,f,i)}else e.apply(this,arguments)}).prototype=a,a.toArrayBuffer=function(){for(var r=this.words,a=this.sigBytes,e=new n(a),i=new t(e),f=0;f<a;f++)i[f]=r[f>>>2]>>>24-f%4*8&255;return e}}}(ArrayBuffer,Uint8Array,Uint8ClampedArray);