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

		var cookiefile, signaturefile, interval, prefix, suffix;

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
		this.writeSignature(signatureid);

		return;
	},

	writeSignature: function(signatureid) {
		try {
			netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
		} catch(e) {
			return;
		}

		var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);

		try {
			file.initWithPath(this.signaturefile[signatureid]);
		} catch(e) { return; }

		if(file.exists() == false)
			file.create(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 420);

		var output = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);

		output.init(file, 0x04 | 0x08 | 0x20, 420, 0);

		var signature = this.signature[signatureid];

		if(this.prefix[signatureid].length != 0)
			signature = this.prefix[signatureid] + "\n" + signature;

		if(this.suffix[signatureid].length != 0)
			signature = signature + "\n" + this.suffix[signatureid];

		var result = output.write(signature, signature.length);

		output.close();

		return;
	},

	getNewSignature: function(signatureid) {
		try {
			netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
		} catch (e) { return; }

		var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);

		try {
			file.initWithPath(this.cookies[signatureid]);
		} catch(e) { return; }

		if(file.exists() == false || file.isReadable() == false)
			return;

		if(file.isFile() == true)
			this.getNewSignatureFromFile(signatureid, file);
		else if(file.isDirectory() == true)
			this.getNewSignatureFromDirectory(signatureid, file);

		return;
	},

	getNewSignatureFromFile: function(signatureid, file) {
		var input = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);

		input.init(file, 0x01, 0444, 0);
		input.QueryInterface(Components.interfaces.nsILineInputStream);

		var line = {}, hasmore;
		var cookie = 0, cookies = [];
		cookies.push('');
		do {
			hasmore = input.readLine(line);

			if(line.value == '%') {
				cookies.push('');
				cookie++;
			}
			else {
				if(cookies[cookie].length == 0)
					cookies[cookie] = line.value;
				else
					cookies[cookie] = cookies[cookie] + "\n" + line.value;
			}
		} while(hasmore);

		input.close();

		if(cookies.length != 0) {
			cookie = Math.floor(Math.random() * cookies.length);
			this.signature[signatureid] = cookies[cookie];
		}
		else
			this.signature[signatureid] = '';

		delete(cookies);

		return;
	},

	getNewSignatureFromDirectory: function(signatureid, directory) {
		var enumerator = directory.directoryEntries;

		var file, files = [], hasmore;
		var re = /\.(txt|html)$/;
		do {
			hasmore = enumerator.hasMoreElements();
			if(hasmore == false)
				break;

			file = enumerator.getNext();

			file.QueryInterface(Components.interfaces.nsIFile);
			file.QueryInterface(Components.interfaces.nsILocalFile);

			if(file.isFile() == false || file.isReadable() == false)
				continue;

			if(file.path.search(re) == -1)
				continue;

			files.push(file);
		} while(hasmore);

		if(files.length == 0) {
			this.signature[signatureid] = '';

			return;
		}

		file = files[Math.floor(Math.random() * files.length)];

		var input = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);

		input.init(file, 0x01, 0444, 0);
		input.QueryInterface(Components.interfaces.nsILineInputStream);

		var line = {}, cookie = '';
		do {
			hasmore = input.readLine(line);

			if(cookie.length == 0)
				cookie = line.value;
			else
				cookie = cookie + "\n" + line.value;
		} while(hasmore);

		input.close();

		this.signature[signatureid] = cookie;

		delete(files);

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