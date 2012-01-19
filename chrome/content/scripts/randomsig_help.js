function randomsigLoadHelpSection() {
	var section = window.arguments[0];

	randomsigSetHelpSection(section);
}

function randomsigSetHelpSection(section) {
	document.getElementById('randomsig-helptabs').selectedIndex = section;
}