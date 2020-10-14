var CryptoJS=CryptoJS||function(t,n){var i={},r=i.lib={},e=r.Base=function(){function t(){}return{extend:function(n){t.prototype=this;var i=new t;return n&&i.mixIn(n),i.hasOwnProperty("init")||(i.init=function(){i.$super.init.apply(this,arguments)}),i.init.prototype=i,i.$super=this,i},create:function(){var t=this.extend();return t.init.apply(t,arguments),t},init:function(){},mixIn:function(t){for(var n in t)t.hasOwnProperty(n)&&(this[n]=t[n]);t.hasOwnProperty("toString")&&(this.toString=t.toString)},clone:function(){return this.init.prototype.extend(this)}}}(),s=r.WordArray=e.extend({init:function(t,n){t=this.words=t||[],this.sigBytes=void 0!=n?n:4*t.length},toString:function(t){return(t||a).stringify(this)},concat:function(t){var n=this.words,i=t.words,r=this.sigBytes,e=t.sigBytes;if(this.clamp(),r%4)for(var s=0;s<e;s++){var o=i[s>>>2]>>>24-s%4*8&255;n[r+s>>>2]|=o<<24-(r+s)%4*8}else for(s=0;s<e;s+=4)n[r+s>>>2]=i[s>>>2];return this.sigBytes+=e,this},clamp:function(){var n=this.words,i=this.sigBytes;n[i>>>2]&=4294967295<<32-i%4*8,n.length=t.ceil(i/4)},clone:function(){var t=e.clone.call(this);return t.words=this.words.slice(0),t},random:function(n){for(var i=[],r=0;r<n;r+=4)i.push(4294967296*t.random()|0);return new s.init(i,n)}}),o=i.enc={},a=o.Hex={stringify:function(t){for(var n=t.words,i=t.sigBytes,r=[],e=0;e<i;e++){var s=n[e>>>2]>>>24-e%4*8&255;r.push((s>>>4).toString(16)),r.push((15&s).toString(16))}return r.join("")},parse:function(t){for(var n=t.length,i=[],r=0;r<n;r+=2)i[r>>>3]|=parseInt(t.substr(r,2),16)<<24-r%8*4;return new s.init(i,n/2)}},c=o.Latin1={stringify:function(t){for(var n=t.words,i=t.sigBytes,r=[],e=0;e<i;e++){var s=n[e>>>2]>>>24-e%4*8&255;r.push(String.fromCharCode(s))}return r.join("")},parse:function(t){for(var n=t.length,i=[],r=0;r<n;r++)i[r>>>2]|=(255&t.charCodeAt(r))<<24-r%4*8;return new s.init(i,n)}},u=o.Utf8={stringify:function(t){try{return decodeURIComponent(escape(c.stringify(t)))}catch(t){throw new Error("Malformed UTF-8 data")}},parse:function(t){return c.parse(unescape(encodeURIComponent(t)))}},f=r.BufferedBlockAlgorithm=e.extend({reset:function(){this._data=new s.init,this._nDataBytes=0},_append:function(t){"string"==typeof t&&(t=u.parse(t)),this._data.concat(t),this._nDataBytes+=t.sigBytes},_process:function(n){var i=this._data,r=i.words,e=i.sigBytes,o=this.blockSize,a=e/(4*o),c=(a=n?t.ceil(a):t.max((0|a)-this._minBufferSize,0))*o,u=t.min(4*c,e);if(c){for(var f=0;f<c;f+=o)this._doProcessBlock(r,f);var h=r.splice(0,c);i.sigBytes-=u}return new s.init(h,u)},clone:function(){var t=e.clone.call(this);return t._data=this._data.clone(),t},_minBufferSize:0}),h=(r.Hasher=f.extend({cfg:e.extend(),init:function(t){this.cfg=this.cfg.extend(t),this.reset()},reset:function(){f.reset.call(this),this._doReset()},update:function(t){return this._append(t),this._process(),this},finalize:function(t){return t&&this._append(t),this._doFinalize()},blockSize:16,_createHelper:function(t){return function(n,i){return new t.init(i).finalize(n)}},_createHmacHelper:function(t){return function(n,i){return new h.HMAC.init(t,i).finalize(n)}}}),i.algo={});return i}(Math);