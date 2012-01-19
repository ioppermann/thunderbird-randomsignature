function FileApp() {
}

FileApp.prototype = {
	MODE_READ:	1,
	MODE_WRITE:	2,
	MODE_APPEND:	4,

	fp: null,
	stream: null,
	reading: false,
	writing: false,
	hasmore: true,

	open: function(path, mode) {
		this.fp = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);

		try {
			this.fp.initWithPath(path);
		} catch(e) { return false; }

		if((mode & this.MODE_READ) != 0) {
			if(this.fp.exists() == false)
				return false;

			if(this.fp.isReadable() == false)
				return false;

			if(this.fp.isFile() == false)
				return false;

			this.stream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
			this.stream.init(this.fp, 0x01, 0444, 0);

			this.stream.QueryInterface(Components.interfaces.nsILineInputStream);

			this.reading = true;

			return true;
		}
		else if((mode & this.MODE_WRITE) != 0) {
			var append = false;

			if((mode & this.MODE_APPEND) != 0)
				append = true;

			if(this.fp.exists() == false)
				this.fp.create(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 420);

			this.stream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);

			this.stream.QueryInterface(Components.interfaces.nsISeekableStream);

			if(append == true) {
				this.stream.init(this.fp, 0x04 | 0x08, 420, 0);
				this.stream.seek(nsIFileOutputStream.NS_SEEK_END, 0);
			}
			else
				this.stream.init(this.fp, 0x04 | 0x08 | 0x20, 420, 0);

			this.writing = true;

			return true;
		}

		return false;
	},

	read: function() {
		if(this.reading != true)
			return null;

		if(this.hasmore == false)
			return null;

		var line = {};
		this.hasmore = this.stream.readLine(line);

		return line.value;
	},

	write: function(buf) {
		if(this.writing != true)
			return;

		buf = buf + "\n";

		this.stream.write(buf, buf.length);
	},

	close: function() {
		if(this.stream != null) {
			this.stream.close();
			this.stream = null;
		}

		this.stream = null;
		this.fp = null;
	}
}
