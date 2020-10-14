var KeeperAPI={Base64ToHex:function(e){return CryptoJS.enc.URLBase64.parse(e).toString(CryptoJS.enc.Hex)},decryptToBytes:function(e,r){var t="string"==typeof e?CryptoJS.format.Keeper.parse(e).iv:e.iv;return CryptoJS.AES.decrypt(e,r,{iv:t,format:CryptoJS.format.Keeper})},decryptToString:function(e,r){var t;if(""==e)return"{}";t=KeeperAPI.decryptToBytes(e,r);try{return t.toString(CryptoJS.enc.Utf8)}catch(e){return""}},decryptTypedKey:function(e,r,t){if(2===r){void 0===t&&(t=bg.get("rsaPrivateKey"));var o=KeeperAPI.Base64ToHex(e),n=t.decryptBinary(o);if(!n)throw new Error("decrypt_type2_key_error1 RSA Key decryption failed.");var d=CryptoJS.enc.Hex.parse(n);if(32!==d.sigBytes)throw new Error("decrypt_type2_key_error2 RSA Key decryption failed.");return d}try{var a=KeeperAPI.decryptToBytes(e,bg.get("encryptionKey"));return a.clamp(),a}catch(e){throw new Error("decrypt_type1_key_error Key decryption failed.")}},decryptEncryptionKey:function(e,r){var t=CryptoJS.enc.URLBase64.parse(r);if(100===t.sigBytes){if(1===t.words[0]>>>24){var o=t.words[0]<<8>>>8,n=CryptoJS.lib.WordArray.create(t.words.slice(1,5));return KeeperAPI.PBKDF2_SHA256(e,n.toString(CryptoJS.enc.URLBase64),o).then(function(e){var r=CryptoJS.lib.CipherParams.create({iv:CryptoJS.lib.WordArray.create(t.words.slice(5,9)),ciphertext:CryptoJS.lib.WordArray.create(t.words.slice(9))}),o=CryptoJS.AES.decrypt(r,CryptoJS.enc.URLBase64.parse(e),{iv:r.iv,padding:CryptoJS.pad.NoPadding});if(64===o.sigBytes){var n=CryptoJS.lib.WordArray.create(o.words.slice(0,8)),d=CryptoJS.lib.WordArray.create(o.words.slice(8,16));return n.toString(CryptoJS.enc.Hex)===d.toString(CryptoJS.enc.Hex)?Promise.resolve(n):Promise.reject(new Error("Data key decryption error, key mismatch."))}return Promise.reject(new Error("Data key decryption error, key size incorrect."))})}return Promise.reject(new Error("Data key decryption error, unsupported version number."))}return Promise.reject(new Error("Data key decryption error, encryption parameters are the wrong size."))},encryptEncryptionKey:function(e,r){var t=bg.get("encryptionKey","pass","authIterations");if(!t.encryptionKey)return!1;void 0!==e&&null!==e||(e=t.pass),void 0!==r&&null!==r||(r=t.authIterations);var o=CryptoJS.lib.WordArray.random(16);return KeeperAPI.PBKDF2_SHA256(e,o.toString(CryptoJS.enc.URLBase64),r).then(function(e){var n=CryptoJS.lib.WordArray.random(16),d=t.encryptionKey.clone().concat(t.encryptionKey),a=CryptoJS.AES.encrypt(d,CryptoJS.enc.URLBase64.parse(e),{iv:n,padding:CryptoJS.pad.NoPadding}),i=CryptoJS.lib.WordArray.create([(1<<24)+r]);return i.concat(o).concat(a.iv).concat(a.ciphertext),Promise.resolve(i.toString(CryptoJS.enc.URLBase64))})},encryptAsBytes:function(e,r){return CryptoJS.AES.encrypt(e,r,{iv:CryptoJS.lib.WordArray.random(16),format:CryptoJS.format.Keeper})},encrypt:function(e,r){return KeeperAPI.encryptAsBytes(e,r).toString()},encryptedRecordAsUploadRequest:function(e){try{var r=bg.get("encryptionKey","deviceId","clientId","uname"),t=!1,o=!1;e.record_uid||(e.id=e.record_uid=CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.URLBase64),t=!0),e.record_key||(e.record_key=CryptoJS.lib.WordArray.random(32),o=!0),e.revision||(e.revision=0),e.client_modified_time=Date.now();var n,d=Object.assign({},e);if(d.version=2,d.data=KeeperAPI.encrypt(JSON.stringify({folder:d.folder,title:d.title,secret1:d.secret1,secret2:d.secret2,link:d.link,notes:d.notes,custom:d.custom}),e.record_key),"object"==typeof d.extra&&Object.keys(d.extra).length>0?d.extra=KeeperAPI.encrypt(JSON.stringify(d.extra),e.record_key):d.extra="","object"==typeof d.non_shared_data&&Object.keys(d.non_shared_data).length>0?d.non_shared_data=KeeperAPI.encrypt(JSON.stringify(d.non_shared_data),r.encryptionKey):d.non_shared_data=void 0,o||2===e.record_key_type?(d.record_key=void 0!==e.shared_folder_key&&null!==e.shared_folder_key?KeeperAPI.encrypt(e.record_key,e.shared_folder_key):KeeperAPI.encrypt(e.record_key,r.encryptionKey),e.record_key_type=1):delete d.record_key,e.addto_shared_folder_uid&&bg.getCacheProp(`shared_folders.${e.addto_shared_folder_uid}`)){var a=getSharedFolderById(e.addto_shared_folder_uid);n={command:"shared_folder_update",shared_folder_uid:e.addto_shared_folder_uid,revision:a.revision,operation:"update",add_records:[{record_uid:e.record_uid,record_key:KeeperAPI.encrypt(e.record_key,a.shared_folder_key),can_share:void 0===a.default_can_share||a.default_can_share,can_edit:void 0===a.default_can_edit||a.default_can_edit}],from_team_uid:a.team_uid}}var i=["record_uid","data","version","record_key","client_modified_time","udata","non_shared_data","revision","shared_folder_uid","team_uid","extra"];Object.keys(d).forEach(function(e){-1===i.indexOf(e)&&delete d[e]});var c=[];if(t){c=[{command:"record_add",record_uid:e.record_uid,record_type:"password",record_key:d.record_key,folder_type:"user_folder",how_long_ago:0,data:d.data}];d.non_shared_data&&Object.assign(c[0],{non_shared_data:d.non_shared_data}),d.extra&&Object.assign(c[0],{extra:d.extra})}else c=[{command:"record_update",client_time:Date.now(),pt:clientID,device_id:r.deviceId,device_name:r.deviceId,client_id:r.clientId,add_records:!0===t?[d]:void 0,update_records:!1===t?[d]:void 0,username:r.uname}];return n&&c.push(n),{command:"execute",requests:c}}catch(e){throw logger({data:"Error occured KeeperAPI.encryptedRecordAsUploadRequest"+e,consoleFunction:console.log}),new Error("Failed to encrypt data:Error occured KeeperAPI.encryptedRecordAsUploadRequest:"+e)}}};KeeperAPI.PBKDF2_SHA256=KeeperPBKDF2(this,!1),KeeperAPI.PBKDF2_SHA512=KeeperPBKDF2(this,!0),KeeperAPI.PBKDF2_SHA256_Offline=KeeperPBKDF2Offline(this,!1),KeeperAPI.PBKDF2_SHA512_Offline=KeeperPBKDF2Offline(this,!0),KeeperAPI.authVerifier=function(e,r,t){return void 0===e?Promise.reject():(void 0!==r&&null!==r||(r=CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.URLBase64)),KeeperAPI.PBKDF2_SHA256(e,r,t).then(function(e){var o=CryptoJS.lib.WordArray.create([(1<<24)+t]);return o.concat(CryptoJS.enc.URLBase64.parse(r)).concat(CryptoJS.enc.URLBase64.parse(e)),Promise.resolve(o.toString(CryptoJS.enc.URLBase64))}))};