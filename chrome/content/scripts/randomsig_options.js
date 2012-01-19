function randomsigLoadOptions() {
	randomsigResetList();

	var signatures = randomsigPrefs.getChar('signatures', '').split(',');
	if(signatures[0].length == 0)
		signatures = new Array();

	var listitem = null, listcell = null;
	var l = document.getElementById('randomsig-list');

	var cookies, signaturefile, interval;

	for(var i = 0; i < signatures.length; i++) {
		cookies = randomsigPrefs.getChar('signature.' + signatures[i] + '.cookies', '');
		signaturefile = randomsigPrefs.getChar('signature.' + signatures[i] + '.signaturefile', '');
		interval = randomsigPrefs.getInt('signature.' + signatures[i] + '.interval', 0);

		listitem = document.createElement("listitem");
		listitem.setAttribute('signatureid', signatures[i]);

		listcell = document.createElement("listcell");
		listcell.setAttribute("label", cookies);
		listcell.setAttribute("crop", 'center');

		listitem.appendChild(listcell);

		listcell = document.createElement("listcell");
		listcell.setAttribute("label", signaturefile);
		listcell.setAttribute("crop", 'center');

		listitem.appendChild(listcell);

		listcell = document.createElement("listcell");
		listcell.style.textAlign = 'center';
		listcell.setAttribute("label", interval);

		listitem.appendChild(listcell);

		l.appendChild(listitem);
	}

	return true;
}

function randomsigResetList() {
	var l = document.getElementById('randomsig-list');

	var items = l.getElementsByTagName('listitem');

	while(items.length != 0) {
		l.removeChild(items[0]);

		items = l.getElementsByTagName('listitem');
	}

	document.getElementById('randomsig-edit').disabled = true;
	document.getElementById('randomsig-delete').disabled = true;

	return;
}

function randomsigSignatureSelected() {
	document.getElementById('randomsig-edit').disabled = false;
	document.getElementById('randomsig-delete').disabled = false;

	return;
}

function randomsigOpenNewSignature() {
	window.openDialog("chrome://randomsig/content/randomsigNew.xul", "randomsigNew", "centerscreen,modal");

	randomsigLoadOptions();

	return;
}

function randomsigSaveNewSignature() {
	var cookiestype = document.getElementById("randomsig-new-source").value;

	var cookies = '';
	if(cookiestype == 'file')
		cookies = document.getElementById("randomsig-new-cookiefile").value;
	else
		cookies = document.getElementById("randomsig-new-cookiedirectory").value;

	var signaturefile = document.getElementById("randomsig-new-signaturefile").value;
	var interval = Math.abs(parseInt(document.getElementById("randomsig-new-interval").value));
	var prefix = document.getElementById("randomsig-new-prefix").value;
	var suffix = document.getElementById("randomsig-new-suffix").value;

	randomsigSavePrefs(cookies, cookiestype, signaturefile, interval, prefix, suffix, null);

	return true;
}

function randomsigOpenEditSignature() {
	var signatureid = document.getElementById('randomsig-list').selectedItem.getAttribute('signatureid');

	window.openDialog("chrome://randomsig/content/randomsigEdit.xul", "randomsigEdit", "centerscreen,modal", signatureid);

	randomsigLoadOptions();

	return;
}

function randomsigLoadEditSignature() {
	var signatureid = window.arguments[0];

	var cookiestype = randomsigPrefs.getChar('signature.' + signatureid + '.cookiestype', 'file');
	document.getElementById("randomsig-edit-source").value = cookiestype;
	if(cookiestype == 'file')
		document.getElementById("randomsig-edit-cookiefile").value = randomsigPrefs.getChar('signature.' + signatureid + '.cookies', '');
	else
		document.getElementById("randomsig-edit-cookiedirectory").value = randomsigPrefs.getChar('signature.' + signatureid + '.cookies', '');
	document.getElementById("randomsig-edit-signaturefile").value = randomsigPrefs.getChar('signature.' + signatureid + '.signaturefile', '');
	document.getElementById("randomsig-edit-interval").value = randomsigPrefs.getInt('signature.' + signatureid + '.interval', 0);
	document.getElementById("randomsig-edit-prefix").value = decodeURI(randomsigPrefs.getChar('signature.' + signatureid + '.prefix', ''));
	document.getElementById("randomsig-edit-suffix").value = decodeURI(randomsigPrefs.getChar('signature.' + signatureid + '.suffix', ''));
	

	return true;
}

function randomsigSaveEditSignature() {
	var signatureid = window.arguments[0];

	var cookiestype = document.getElementById("randomsig-edit-source").value;
	var cookies = '';
	if(cookiestype == 'file')
		cookies = document.getElementById("randomsig-edit-cookiefile").value;
	else
		cookies = document.getElementById("randomsig-edit-cookiedirectory").value;
	var signaturefile = document.getElementById("randomsig-edit-signaturefile").value;
	var interval = Math.abs(parseInt(document.getElementById("randomsig-edit-interval").value));
	var prefix = document.getElementById("randomsig-edit-prefix").value;
	var suffix = document.getElementById("randomsig-edit-suffix").value;

	randomsigSavePrefs(cookies, cookiestype, signaturefile, interval, prefix, suffix, signatureid);

	return true;
}

function randomsigDeleteSignature() {
	if(!confirm(document.getElementById("randomsig-stringbundle").getString("randomsig.signature-delete")))
		return;

	var signatureid = document.getElementById('randomsig-list').selectedItem.getAttribute('signatureid');

	var signatures = randomsigPrefs.getChar('signatures', '').split(',');
	if(signatures[0].length == 0)
		signatures = new Array();

	var index = signatures.indexOf(signatureid);

	if(index == -1) {
		alert(document.getElementById("randomsig-stringbundle").getString("randomsig.signature-notfound"));
		return;
	}

	signatures.splice(index, 1);

	randomsigPrefs.setChar('signatures', signatures.join(','));

	randomsigPrefs.deleteBranch('signature.' + signatureid);

	randomsigLoadOptions();

	return;
}

function randomsigSavePrefs(cookies, cookiestype, signaturefile, interval, prefix, suffix, signatureid) {
	var signatures = randomsigPrefs.getChar('signatures', '').split(',');
	if(signatures[0].length == 0)
		signatures = new Array();

	if(signatureid == null) {
		var id = 0;

		var ids = [];
		for(var i = 0; i < signatures.length; i++) {
			ids.push(parseInt(signatures[i].match(/id([0-9]+)/)[1]));
		}

		while(ids.indexOf(id) != -1)
			id++;

		signatureid = 'id' + id;

		signatures.push(signatureid);
	}

	randomsigPrefs.setChar('signature.' + signatureid + '.cookies', cookies);
	randomsigPrefs.setChar('signature.' + signatureid + '.cookiestype', cookiestype);
	randomsigPrefs.setChar('signature.' + signatureid + '.signaturefile', signaturefile);
	randomsigPrefs.setInt('signature.' + signatureid + '.interval', interval);
	randomsigPrefs.setChar('signature.' + signatureid + '.prefix', encodeURI(prefix));
	randomsigPrefs.setChar('signature.' + signatureid + '.suffix', encodeURI(suffix));

	randomsigPrefs.setChar('signatures', signatures.join(','));

	return;
}

function randomsigAbout() {
	window.openDialog("chrome://randomsig/content/randomsigAbout.xul", "randomsigAbout", "centerscreen,modal");

	return;
}

function randomsigHelp(section) {
	window.openDialog("chrome://randomsig/content/randomsigHelp.xul", "randomsigHelp", "centerscreen,modal", section);

	return;
}

function randomsigBrowseCookieFile(mode) {
	var nsIFilePicker = Components.interfaces.nsIFilePicker;
	var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);

	fp.init(window, document.getElementById("randomsig-stringbundle").getString("randomsig.signature-selectcookie"), nsIFilePicker.modeOpen);
	fp.appendFilters(nsIFilePicker.filterText | nsIFilePicker.filterHTML | nsIFilePicker.filterAll);

	var retval = fp.show();
	if(retval == nsIFilePicker.returnOK) {
		var file = fp.file;

		document.getElementById("randomsig-" + mode + "-cookiefile").value = file.path;
	}
}

function randomsigBrowseCookieDirectory(mode) {
	var nsIFilePicker = Components.interfaces.nsIFilePicker;
	var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);

	fp.init(window, document.getElementById("randomsig-stringbundle").getString("randomsig.signature-selectdir"), nsIFilePicker.modeGetFolder);

	var retval = fp.show();
	if(retval == nsIFilePicker.returnOK) {
		var file = fp.file;

		document.getElementById("randomsig-" + mode + "-cookiedirectory").value = file.path;
	}
}

function randomsigBrowseSignatureFile(mode) {
	var nsIFilePicker = Components.interfaces.nsIFilePicker;
	var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);

	fp.init(window, document.getElementById("randomsig-stringbundle").getString("randomsig.signature-selectfile"), nsIFilePicker.modeSave);
	fp.appendFilters(nsIFilePicker.filterText | nsIFilePicker.filterHTML | nsIFilePicker.filterAll);

	var retval = fp.show();
	if(retval == nsIFilePicker.returnOK || retval == nsIFilePicker.returnReplace) {
		var file = fp.file;

		document.getElementById("randomsig-" + mode + "-signaturefile").value = file.path;
	}
}