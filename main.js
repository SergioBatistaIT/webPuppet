const puppeteer = require('puppeteer');
const Moment = require('moment');
const MomentRange = require('moment-range');
const moment = MomentRange.extendMoment(Moment);

async function sleep(ms) {
    return new Promise((res) => setTimeout(res, ms));
}

async function downloadFile(browser, siteValue, start, end) {
    
    const page = await browser.newPage();
    await page.goto('https://agriculture.alberta.ca/acis/alberta-weather-data-viewer.jsp');
    //   await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
    await sleep(2000);
    console.log('page loaded');
    let elementsTab = await page.$('#tab-panel > ul > li:nth-child(2) > a');
    await elementsTab.click();

    await page.evaluate(`
        switchTabTextColors('tabElements');
        let selectStation = document.querySelector('#acis_stations');
        selectStation.value = ${siteValue};
        onListClicked();
    `);

    await sleep(500);
    await page.evaluate(() => {
       let checkboxes = ['cb_pr_b', 'cb_pr_a', 'cb_at_ave', 'cb_hu_ave', 'cb_ir_ave', 'cb_at_max', 'cb_hu_max', 'cb_ir_max', 'cb_at_min', 'cb_hu_min', 'cb_ua_ave', 'cb_wsam', 'cb_wdam', 'cb_wsp']
       checkboxes.forEach(checkboxID => {
           c = document.querySelector(`#${checkboxID}`)
           c.checked = true;
       })
    });

    await sleep(200);
    await page.evaluate(()=>onSelectCheckBox());
    
    await page.evaluate(`  
        let periodSelection = document.querySelector('#periodSelection');
        periodSelection.value = 'HOURLY';
    `)
    await sleep(200);
    await page.evaluate(`onSelectPeriod('HOURLY');`);

    let startDateText = start.format('YYYY-MM-DD')
    let endDateText = moment(end).subtract(1, 'days').format('YYYY-MM-DD')

    await page.evaluate(`
        let dateStartEl = document.querySelector( '#datestart');
        dateStartEl.value = '${startDateText}'
        let endDateEl = document.querySelector('#dateend');
        endDateEl.value = '${endDateText}'
    `);

    await sleep(500);

    await page.evaluate(`getCsv();`);
    await sleep(500);
    page.close();

}

async function main() {
    let sites = ['9918']
    let start = moment('2008-009-01');
    let end = moment('2019-01-01');
    let range = moment.range(start, end);
    let months = Array.from(range.by('month'));
    const browser = await puppeteer.launch({ headless: false });
    for(let site of sites) {
        for(let i = 0; i < months.length - 1; i++) {
            console.log(`downloading site: ${site} from ${months[i].format('YYYY-MM-DD')} to ${months[i+1].format('YYYY-MM-DD')}`);
            await downloadFile(browser, site, months[i], months[i+1]);
            console.log('file downloaded');
            await sleep(10000)
        }  
    }
}

 main();


