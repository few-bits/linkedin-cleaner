const puppeteer = require('puppeteer-core');
const axios = require('axios');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const CONNECTION_COUNT_SELECTOR = '.mn-connections__header';
const LIST_SELECTOR = 'section.mn-connections ul';
const GRID_SELECTOR = '.neptune-grid';
const MORE_BTN_SELECTOR = 'button.pv-s-profile-actions__overflow-toggle';
const REMOVE_BTN_SELECTOR = '.pv-s-profile-actions--disconnect';

const PREFERRED_NAMES = [
    'John Doe',
    'Keanu Reeves',
];

const PREFERRED_OCCUPATIONS = [
    'Google',
    'OOO Roga & Kopita',
];

const UNWANTED_TAGS = [
    'Evil',
    'Sad',
];

const scrollDown = async (gridSelector) => {
    document.querySelector(gridSelector)
        .scrollIntoView({behavior: 'smooth', block: 'end', inline: 'end'});
};

const scrollUp = async (gridSelector) => {
    const scrollHeight = document.querySelector(gridSelector).scrollHeight;
    window.scrollTo({
        top: scrollHeight - 50,
        behavior: 'smooth'
    });
};

const getListSize = async (listSelector) => document.querySelector(listSelector).childElementCount;

const getConnection = async (listSelector, index) => {
    const row = `${listSelector} li:nth-child(${index})`;
    const id = document.querySelector(`${row} a.mn-connection-card__link`).href;
    const name = document.querySelector(`${row} .mn-connection-card__name`).innerText;
    const occupation = document.querySelector(`${row} .mn-connection-card__occupation`).innerText;

    return {id, name, occupation};
};

const getConnections = async (browser) => {
    const page = await browser.newPage();

    await page.goto('https://www.linkedin.com/mynetwork/invite-connect/connections/');
    await page.waitForSelector(CONNECTION_COUNT_SELECTOR);

    const connectionCount = await page.evaluate((connectionCountSelector) => {
        const text = document.querySelector(connectionCountSelector).innerText;
        return text.replace(/\D/g, '');
    }, CONNECTION_COUNT_SELECTOR);

    let listSize = await page.evaluate(getListSize, LIST_SELECTOR);
    while (listSize < connectionCount) {
        await page.evaluate(scrollDown, GRID_SELECTOR);
        // I have to throttle browser interaction to be not banned by linkedin
        await sleep(5000);
        await page.evaluate(scrollUp, GRID_SELECTOR);
        await sleep(2000);
        const connection = await page.evaluate(getConnection, LIST_SELECTOR, listSize - 1);
        listSize = await page.evaluate(getListSize, LIST_SELECTOR);
    }

    const connections = [];
    for (let i = 1; i <= connectionCount; i++) {
        const connection = await page.evaluate(getConnection, LIST_SELECTOR, i);
        connections.push(connection);
    }

    await page.close();
    return connections;
};

const toLower = (array) => array.map(item => item.toLowerCase());

const testName = (name) => !toLower(PREFERRED_NAMES).includes(name.toLowerCase());

const testOccupation = (occupation) => !toLower(PREFERRED_OCCUPATIONS)
    .reduce((memo, preferredOccupation) => {
        return memo || occupation.toLowerCase().indexOf(preferredOccupation) >= 0;
    }, false);

const testTags = (occupation) => {
    const words = occupation.toLowerCase().split(/[\s,\-\:]+/);
    return toLower(UNWANTED_TAGS)
        .reduce((memo, tag) => memo || words.includes(tag), false);
}

const removeConnections = async (browser, connections) => {
    const deletion = connections.filter(({name, occupation}) => (
        testName(name)
        && testOccupation(occupation)
        && testTags(occupation)
    ));

    console.log(`Will be removed ${deletion.length} connections`);

    for (let i = 0; i < deletion.length; i++) {
        const page = await browser.newPage();
        await page.goto(deletion[i].id);
        await page.waitForSelector(MORE_BTN_SELECTOR);
        await page.click(MORE_BTN_SELECTOR);
        await sleep(300);
        if (await page.$(REMOVE_BTN_SELECTOR) !== null) {
            await page.click(REMOVE_BTN_SELECTOR);
            await sleep(100);
        } else {
            console.error('Can\'t be deleted');
            console.error(JSON.stringify(deletion[i], null, 2));
        }

        await page.close();
    }

    console.log('Done.');
};

const main = async () => {
    const json = await axios.get(`http://localhost:9222/json/version`);
    const {webSocketDebuggerUrl} = json.data;

    const browser = await puppeteer.connect({
        browserWSEndpoint: webSocketDebuggerUrl,
        defaultViewport: null,
    });

    const connections = await getConnections(browser);
    console.log(`Total connections count: ${connections.length}`);
    await removeConnections(browser, connections);
};

main();
