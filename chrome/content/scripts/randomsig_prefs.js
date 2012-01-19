var randomsigPrefs = {
	branch: "extensions.randomsig.",
	prefs: null,

	init: function() {
		var prefservice = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
		this.prefs = prefservice.getBranch(this.branch);

		return;
	},

	register: function() {
		if(this.prefs == null)
			this.init();

		var internal = this.prefs.QueryInterface(Components.interfaces.nsIPrefBranchInternal);
		internal.addObserver("", this, false);
	},

	unregister: function() {
		if(this.prefs == null)
			return;

		var internal = this.prefs.QueryInterface(Components.interfaces.nsIPrefBranchInternal);
		internal.removeObserver("", this);
	},

	observe: function(subject, topic, data) {
		if(topic != "nsPref:changed")
			return;

		randomsig.loadSignatures();
	},

	getInt: function(name, defval) {
		var pref = defval;

		if(this.prefs == null)
			this.init();

		if(this.prefs.getPrefType(name) == this.prefs.PREF_INT)
			pref = this.prefs.getIntPref(name);

		return pref;
	},

	setInt: function(name, value) {
		if(this.prefs == null)
			this.init();

		this.prefs.setIntPref(name, value);

		return true;
	},

	getChar: function(name, defval) {
		var pref = defval;

		if(this.prefs == null)
			this.init();

		if(this.prefs.getPrefType(name) == this.prefs.PREF_STRING)
			pref = this.prefs.getCharPref(name);

		return pref;
	},

	setChar: function(name, value) {
		if(this.prefs == null)
			this.init();

		this.prefs.setCharPref(name, value);

		return true;
	},

	getPath: function(name, defval) {
		var pref = defval;

		if(this.prefs.getPrefType(name) == this.prefs.PREF_STRING) {
			var file = this.prefs.getComplexValue(name, Components.interfaces.nsILocalFile);
			pref = file.path;
		}

		return pref;
	},

	setPath: function(name, path) {
		var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);

		try {
			file.initWithPath(path);
			this.prefs.setComplexValue(name, Components.interfaces.nsILocalFile, file);
		} catch(e) { alert('setcomplexvalue: ' + path); }

		return true;
	},

	deleteBranch: function(name) {
		this.prefs.deleteBranch(name);

		return true;
	}
};