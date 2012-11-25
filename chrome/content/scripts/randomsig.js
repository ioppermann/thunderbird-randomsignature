// https://developer.mozilla.org/en-US/docs/JavaScript_code_modules/FileUtils.jsm
Components.utils.import("resource://gre/modules/FileUtils.jsm");
// https://developer.mozilla.org/en-US/docs/JavaScript_code_modules/NetUtil.jsm
Components.utils.import("resource://gre/modules/NetUtil.jsm");

var randomsig = {
	timer: {},
	cookies: {},
	signaturefile: {},
	singature: {},
	prefix: {},
	suffix: {},
	interval: {},

	init: function() {
		randomsigFixPrefs();

		randomsigPrefs.register();

		randomsig.loadSignatures();

		return true;
	},

	close: function() {
		randomsigPrefs.unregister();

		return true;
	},

	loadSignatures: function() {
		for(var signatureid in this.timer)
			clearInterval(this.timer[signatureid]);

		this.timer = {};
		this.cookies = {};
		this.signaturefile = {};
		this.signature = {};
		this.prefix = {};
		this.suffix = {};
		this.interval = {};

		var signatures = randomsigPrefs.getChar('signatures', '').split(',');
		if(signatures[0].length == 0)
			signatures = new Array();

		var cookiefile, cookies, signaturefile, interval, prefix, suffix;

		for(var i = 0; i < signatures.length; i++) {
			interval = randomsigPrefs.getInt('signature.' + signatures[i] + '.interval', 0);
			signaturefile = randomsigPrefs.getChar('signature.' + signatures[i] + '.signaturefile', '');
			cookies = randomsigPrefs.getChar('signature.' + signatures[i] + '.cookies', '');
			prefix = decodeURI(randomsigPrefs.getChar('signature.' + signatures[i] + '.prefix', ''));
			suffix = decodeURI(randomsigPrefs.getChar('signature.' + signatures[i] + '.suffix', ''));
	
			this.cookies[signatures[i]] = cookies;
			this.signaturefile[signatures[i]] = signaturefile;
			this.signature[signatures[i]] = '';
			this.interval[signatures[i]] = interval;
			this.prefix[signatures[i]] = prefix;
			this.suffix[signatures[i]] = suffix;
			this.timer[signatures[i]] = setInterval('randomsig.updateSignature("' + signatures[i] + '")', interval * 1000);
		}

		return;
	},

	updateSignature: function(signatureid) {
		this.getNewSignature(signatureid);

		return;
	},

	writeSignature: function(signatureid) {
		var file = new FileUtils.File(this.signaturefile[signatureid]);

		var output = FileUtils.openSafeFileOutputStream(file);

		var signature = this.signature[signatureid];

		if(this.prefix[signatureid].length != 0)
			signature = this.prefix[signatureid] + "\n" + signature;

		if(this.suffix[signatureid].length != 0)
			signature = signature + "\n" + this.suffix[signatureid];

		var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
		converter.charset = "UTF-8";
		var isignature = converter.convertToInputStream(signature);

		NetUtil.asyncCopy(isignature, output, function(status) {
			output.close();
		});

		return;
	},

	getNewSignature: function(signatureid) {
		var file = new FileUtils.File(this.cookies[signatureid]);

		if(file.exists() == false || file.isReadable() == false)
			return;

		if(file.isFile() == true)
			this.getNewSignatureFromFile(signatureid, file);
		else if(file.isDirectory() == true)
			this.getNewSignatureFromDirectory(signatureid, file);

		return;
	},

	getNewSignatureFromFile: function(signatureid, file) {
		var self = this;

		NetUtil.asyncFetch(file, function(input, status) {
			if(!Components.isSuccessCode(status)) {
				return;
			}

			var navailable = 0;
			var filedata = '';
			try {
				do {
					navailable = input.available();
					if(navailable == 0)
						break;

					filedata += NetUtil.readInputStreamToString(input, navailable);
				} while(navailable);

				input.close();
			} catch(e) {}

			var content = filedata.split(/[\r\n]+/);

			var line = '';
			var cookie = 0, cookies = [];
			cookies.push('');
			for(var i in content) {
				line = content[i];

				if(line == '%') {
					cookies.push('');
					cookie++;
				}
				else {
					if(cookies[cookie].length == 0)
						cookies[cookie] = line;
					else
						cookies[cookie] = cookies[cookie] + "\n" + line;
				}
			}

			if(cookies.length != 0) {
				cookie = Math.floor(Math.random() * cookies.length);
				self.signature[signatureid] = cookies[cookie];
			}
			else
				self.signature[signatureid] = '';

			self.writeSignature(signatureid);
		});

		return;
	},

	getNewSignatureFromDirectory: function(signatureid, directory) {
		var entries = directory.directoryEntries;

		var file, files = [];
		var re = /\.(txt|html)$/;
		while(entries.hasMoreElements()) {
			file = entries.getNext();

			file.QueryInterface(Components.interfaces.nsIFile);

			if(file.isFile() == false || file.isReadable() == false)
				continue;

			if(file.path.search(re) == -1)
				continue;

			files.push(file);
		}

		if(files.length == 0) {
			this.signature[signatureid] = '';

			return;
		}

		file = files[Math.floor(Math.random() * files.length)];

		var self = this;

		NetUtil.asyncFetch(file, function(input, status) {
			if(!Components.isSuccessCode(status)) {
				return;
			}

			var navailable = 0;
			var filedata = '';
			try {
				do {
					navailable = input.available();
					if(navailable == 0)
						break;

					filedata += NetUtil.readInputStreamToString(input, navailable);
				} while(navailable);

				input.close();
			} catch(e) {}

			var cookie = filedata.replace(/[\r\n]+/, "\n");

			self.signature[signatureid] = cookie;

			self.writeSignature(signatureid);
		});

		return;
	}
};

function randomsigOpenOptions() {
	window.openDialog("chrome://randomsig/content/randomsigOptions.xul", "randomsigOptions", "centerscreen,modal");
}

function randomsigFixPrefs() {
	var signatures = randomsigPrefs.getChar('signatures', '').split(',');
	if(signatures[0].length == 0)
		signatures = new Array();

	var cookiestype = '', cookies = '';

	for(var i = 0; i < signatures.length; i++) {
		cookiestype = randomsigPrefs.getChar('signature.' + signatures[i] + '.cookiestype', 'xxx');
		
		if(cookiestype == 'xxx') {
			cookies = randomsigPrefs.getChar('signature.' + signatures[i] + '.cookiefile', '');
			
			randomsigPrefs.setChar('signature.' + signatures[i] + '.cookies', cookies);
			randomsigPrefs.setChar('signature.' + signatures[i] + '.cookiestype', 'file');
		}

		randomsigPrefs.deleteBranch('signature.' + signatures[i] + '.cookiefile');
	}
	
	return;
}