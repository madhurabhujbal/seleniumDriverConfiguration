var TotpSpinner=function(t,e){this.radius=t||12,this.strokeWidth=e||4;const i=2*t,s=`0 0 ${i} ${i}`,r=`translate(${t}, ${t})`,o=t-e/2;this.renderCircumference=2*Math.PI*o;const n="http://www.w3.org/2000/svg";this.svg=document.createElementNS(n,"svg"),this.svg.setAttribute("viewBox",s),this.svg.setAttribute("class","countdown-circle"),this.svg.setAttribute("height",i+"px"),this.svg.setAttribute("width",i+"px");const a=document.createElementNS(n,"g");a.setAttribute("transform",r),this.svg.appendChild(a),baseCircle=document.createElementNS(n,"circle"),baseCircle.setAttribute("class","base"),baseCircle.setAttribute("r",o),a.appendChild(baseCircle),this.progressCircle=document.createElementNS(n,"circle"),this.progressCircle.setAttribute("class","progress"),this.progressCircle.setAttribute("r",o),this.progressCircle.setAttribute("transform","rotate(-90)"),this.progressCircle.style.strokeDashoffset=0,this.progressCircle.style.strokeDasharray=this.renderCircumference,a.appendChild(this.progressCircle)};TotpSpinner.prototype.update=function(t){const e=this.renderCircumference+this.renderCircumference*t/this.duration;this.offset=e,this.progressCircle.style.strokeDashoffset=this.offset},TotpSpinner.prototype.startTimer=function(t,e,i){this.offset=t,this.duration=e,this.update(this.duration);let s=this.duration;this.intervalTimer=window.setInterval(()=>{--s<=0&&(i&&i(),s=this.duration),this.update(s)},1e3);const r=this,o=new MutationObserver(function(t){t.forEach(function(t){var e=Array.from(t.removedNodes),i=e.indexOf(r)>-1,s=e.some(t=>t.contains(r.svg));(i||s)&&(r.clearTimer(),o.disconnect())})});o.observe(document.body,{subtree:!0,childList:!0})},TotpSpinner.prototype.clearTimer=function(){window.clearInterval(this.intervalTimer),this.update(this.duration)};var TotpField=function(t,e){this.content=document.importNode(totp_template.content,!0);const i=t.data;if(this.params=generateTotpParams(i),this.token=chrome.extension.getBackgroundPage().generateTotpToken(this.params),this.isShowing=!1,this.setValue(this.token),this.content.querySelector(".field .name").textContent=t.field_title,this.content.querySelector(".show").style.color="#eee",this.fieldValue=this.content.querySelector(".field .value"),this.fieldValue.textContent=this.formatToken((this.token||"").replace(/./g,"•")),this.eyeball=this.content.querySelector(".show"),this.eyeball.textContent="visibility",this.eyeball.setAttribute("tooltip",translateThis("view_contents")),e){const t=this.eyeball;t.onclick=(()=>{this.isShowing="visibility"===t.textContent,t.textContent=this.isShowing?"visibility_off":"visibility",t.setAttribute("tooltip",translateThis(this.isShowing?"hide_contents":"view_contents")),this.fieldValue.textContent=this.isShowing?this.formatToken(this.token,!0):this.formatToken(this.token||"").replace(/./g,"•")})}else this.content.querySelector(".field").classList.add("noview");var s=new TotpSpinner(15,4);const r=this.content.querySelector(".field div:first-child");this.content.firstElementChild.insertBefore(s.svg,r),s.svg.style.flexShrink="0",s.svg.style.padding="5px 15px 0 0",s.svg.style.boxSizing="content-box";var o=this.params.period||60;s.startTimer(0,o,()=>{this.token=chrome.extension.getBackgroundPage().generateTotpToken(this.params),this.setValue(this.token)})};function generateTotpParams(t,e){const i=parseTotpUri(t);if(i||e){const{secret:t="",algorithm:e="SHA1",period:s=30,digits:r=6}=i;return{key:t,algorithm:e,period:s,digits:r}}}function parseTotpUri(t){const e=/otpauth:\/\/totp\/(?:(.+):)?(.*)\?(.*)/i.exec(t);if(e){const t=e[1],i=e[2],s=e[3],r=t?decodeURIComponent(t):null;return s.split("&").reduce((t,e)=>{const[i,s]=e.split("="),r=i.toLowerCase();return t[r]="issuer"===r?decodeURIComponent(s):"period"===r||"digits"===r?parseInt(s):s,t},{accountName:i,issuer:r})}}TotpField.prototype.formatToken=function(t,e){if(!t||0===t.length)return t;t=t.split("");const i=Math.ceil(t.length/2);return e&&t.splice(i,0," "),t=t.join("")},TotpField.prototype.setValue=function(t){this.token=t;var e=this.content.querySelector(".field .value");e&&(e.hiddenPassword=this.token),this.isShowing&&(this.fieldValue.textContent=this.formatToken(this.token||"",!0))};