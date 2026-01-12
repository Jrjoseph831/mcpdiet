#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
const args = process.argv.slice(2);
const cmd = args[0];

const help = `mcpdiet - LowLoad Labs
Usage:
	mcpdiet [command]

Commands:
	--help, help      Show this help
	doctor            Run basic diagnostics
	init              Create .mcpdiet.json and .mcpdiet/ directory
`;

function writeJsonIfMissing(filePath, data) {
	if (fs.existsSync(filePath)) return false;
	fs.writeFileSync(filePath, JSON.stringify(data, null, 2), { encoding: 'utf8' });
	return true;
}

if (!cmd || cmd === '--help' || cmd === 'help') {
	console.log(help);
	process.exit(0);
}

if (cmd === 'doctor') {
	console.log('Running mcpdiet doctor...');
	const cfgPath = path.join(cwd, '.mcpdiet.json');
	const dirPath = path.join(cwd, '.mcpdiet');
	const results = [];
	if (fs.existsSync(cfgPath)) {
		results.push(`Config: OK (${cfgPath})`);
	} else {
		results.push('Config: MISSING (.mcpdiet.json not found)');
	}
	if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
		results.push(`Artifacts dir: OK (${dirPath})`);
	} else {
		results.push('Artifacts dir: MISSING (.mcpdiet/ not found)');
	}
	console.log(results.join('\n'));
	process.exit(0);
}

if (cmd === 'init') {
	const cfgPath = path.join(cwd, '.mcpdiet.json');
	const dirPath = path.join(cwd, '.mcpdiet');
	const defaultCfg = {
		name: path.basename(cwd),
		created: new Date().toISOString(),
		version: '0.1.0',
		notes: 'This file was created by mcpdiet init'
	};
	try {
		const wrote = writeJsonIfMissing(cfgPath, defaultCfg);
		if (wrote) console.log(`Created ${cfgPath}`);
		else console.log(`${cfgPath} already exists`);
		if (!fs.existsSync(dirPath)) {
			fs.mkdirSync(dirPath);
			console.log(`Created ${dirPath}`);
		} else {
			console.log(`${dirPath} already exists`);
		}
		process.exit(0);
	} catch (err) {
		console.error('init failed:', err && err.message ? err.message : err);
		process.exit(2);
	}
}

console.error('Unknown command:', cmd);
console.log();
console.log(help);
process.exit(1);
