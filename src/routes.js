const moment = require("moment");
const route = require("koa-route");
const cmd = require("node-cmd");
const shell = require("shelljs");

let ceilingID = "65537";
let key = "28icTh4BafLhlZQU";
let user = "altstetten2";
let ip = "192.168.178.114";

let activeScene = "off";
let alarmActive = true;
let alarmTime = 8 * 60 * 60 + 10 * 60 + 0;
const fadeTime = 1 * 60;
setInterval(async () => {
	if (alarmActive) {
		const now = new Date();
		const nowSec =
			now.getHours() * 60 * 60 + now.getMinutes() * 60 + now.getSeconds();
		const timeLeft = alarmTime - nowSec;
		if (timeLeft < fadeTime && timeLeft > 0) {
			activeScene = "alarm";
			const newBrightness = Math.floor((1 - timeLeft / fadeTime) * 254);
			console.log(newBrightness);
			cmd.run(
				`coap-client -m put -u "${user}" -k "${key}" -e '{ "3311": [{ "5851": ${newBrightness}, "5712": 10 }] }' "coaps://${ip}:5684/15001/${ceilingID}"`
			);
			await sleep(2000);
			cmd.run(
				`coap-client -m put -u "${user}" -k "${key}" -e '{ "3311": [{  "5712": 10, "5711": 250 }] }' "coaps://${ip}:5684/15001/${ceilingID}"`
			);
		}
	} else if (!alarmActive && activeScene === "alarm") {
		turnOnWork();
	}
}, 1000 * 5);

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

const getInfoFromBulb = (id) => {
	let data = shell.exec(
		`coap-client -m get -u "${user}" -k "${key}" "coaps://${ip}:5684/15001/${id}"`,
		{ silent: true }
	);
	data = data.substring(data.indexOf('{"'), data.length - 1);
	data = JSON.parse(data)["3311"][0];
	let parsedData = {};
	Object.keys(data).map((key) => {
		if (key === "5706") {
			parsedData["hex"] = data[key];
		}
		if (key === "5707") {
			parsedData["hue"] = data[key];
		}
		if (key === "5708") {
			parsedData["saturation"] = data[key];
		}
		if (key === "5709") {
			parsedData["colorX"] = data[key];
		}
		if (key === "5710") {
			parsedData["colorY"] = data[key];
		}
		if (key === "5711") {
			parsedData["temperature"] = data[key];
		}
		if (key === "5850") {
			parsedData["onOff"] = data[key];
		}
		if (key === "5851") {
			parsedData["brightness"] = data[key];
		}
	});
	return parsedData;
};
getScenesAndColor = () => {
	let work = false;
	let evening = false;
	let sleep = false;
	let colorFactor = 0.5;
	//let colorFactor = factor;

	/* const panelData = getInfoFromBulb(panelID)
    const deskData = getInfoFromBulb(deskID)
    const standTopData = getInfoFromBulb(standTopID)
    const standSideData = getInfoFromBulb(standSideID)

    if(true) { //one brightness below 1 or 1 color not white
        work = false;
    }
    if(true) { //one brightness above Min or 1 color not MaxWarm
        evening = false;
    }
    if(panelData.onOff || deskData.onOff || standTopData.onOff || standSideData.onOff) { //one lamp on
        sleep = false;
    } */
	return { work, evening, sleep, colorFactor };
};

turnAllLightsOff = () => {
	//cmd.run(`coap-client -m put -u "${user}" -k "${key}" -e '{ "3311": [{ "5851": 2, "5712": 1, "5711": 2 }] }' "coaps://${ip}:5684/15001/${panelID}" `);
	//cmd.run(`coap-client -m put -u "${user}" -k "${key}" -e '{ "3311": [{ "5851": 2, "5712": 1, "5711": 2 }] }' "coaps://${ip}:5684/15001/${standTopID}"`);
	//cmd.run(`coap-client -m put -u "${user}" -k "${key}" -e '{ "3311": [{ "5851": 2, "5712": 1, "5711": 2 }] }' "coaps://${ip}:5684/15001/${deskID}"`);
	activeScene = "off";
	cmd.run(
		`coap-client -m put -u "${user}" -k "${key}" -e '{ "3311": [{ "5850": 0}] }' "coaps://${ip}:5684/15001/${ceilingID}" `
	);
	console.log("turn off lights");
};

turnOnWork = async () => {
	activeScene = "work";
	cmd.run(
		`coap-client -m put -u "${user}" -k "${key}" -e '{ "3311": [{ "5851": 254, "5712": 10 }] }' "coaps://${ip}:5684/15001/${ceilingID}"`
	);
	await sleep(2000);
	cmd.run(
		`coap-client -m put -u "${user}" -k "${key}" -e '{ "3311": [{  "5712": 10, "5711": 250 }] }' "coaps://${ip}:5684/15001/${ceilingID}"`
	);
};

turnOnRelax = async () => {
	activeScene = "relax";
	cmd.run(
		`coap-client -m put -u "${user}" -k "${key}" -e '{ "3311": [{ "5851": 150, "5712": 1 }] }' "coaps://${ip}:5684/15001/${ceilingID}"`
	);
	await sleep(2000);
	cmd.run(
		`coap-client -m put -u "${user}" -k "${key}" -e '{ "3311": [{  "5712": 1, "5711": 350 }] }' "coaps://${ip}:5684/15001/${ceilingID}"`
	);
};
turnOnEvening = async () => {
	activeScene = "evening";
	cmd.run(
		`coap-client -m put -u "${user}" -k "${key}" -e '{ "3311": [{ "5851": 20, "5712": 1 }] }' "coaps://${ip}:5684/15001/${ceilingID}"`
	);
	await sleep(2000);
	cmd.run(
		`coap-client -m put -u "${user}" -k "${key}" -e '{ "3311": [{ "5712": 1, "5711": 454 }] }' "coaps://${ip}:5684/15001/${ceilingID}"`
	);
};

const routes = [
	route.get(`/getScene`, async function (ctx) {
		ctx.body = { activeScene };
	}),
	route.get(`/getAlarm`, async function (ctx) {
		ctx.body = { alarm: { time: alarmTime, active: alarmActive } };
	}),
	route.post(`/setAlarm/:alarm`, async function (ctx, alarm) {
		const { active, time } = JSON.parse(alarm);
		if (typeof active === "undefined" || typeof time === "undefined") {
			ctx.response.status = 404;
			ctx.body = { message: "give active and time pls" };
		} else {
			alarmActive = active;
			alarmTime = time;
			ctx.response.status = 200;
			ctx.body = { message: "success" };
		}
	}),
	route.post(`/setScene/:scene`, async function (ctx, scene) {
		if (
			!(
				scene === "work" ||
				scene === "relax" ||
				scene === "evening" ||
				scene === "off"
			)
		) {
			ctx.response.status = 404;
			ctx.body = { message: "invalid scene" };
			return;
		} else {
			if (scene === "work") {
				turnOnWork();
			} else if (scene === "relax") {
				turnOnRelax();
			} else if (scene === "evening") {
				turnOnEvening();
			} else if (scene === "off") {
				turnAllLightsOff();
			}

			ctx.response.status = 200;
			ctx.body = { message: "success" };
		}
	}),
];
module.exports = routes;
