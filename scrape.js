const puppeteer = require("puppeteer");
const fs = require("fs");
const { error } = require("console");

const scrape = async () => {
    const startYear = 2023
    const endYear = 2018
    const url = process.env.AMZN_URL; // e.g. https://www.a--zon.co.jp
    const email = process.env.AMZN_EMAIL;
    const password = process.env.AMZN_PASSWORD;
    var headless = process.env.SCRAPE_HEADLESS;
    const maxOrdersPerYear = 5000

    if (startYear < endYear) {
        throw new Error("StartYear must be less than end year. Example: 2010 to 2000, StartYear: 2010, EndYear: 2000")
    }

    console.log(email)
    if (email == null || password == null) {
        throw new Error("email or password is blank, please set AMZN_EMAIL and AMZN_PASSWORD environmental variables.")
    }

    if (url == null) {
        throw new Error("url is blank, please set AMZN_URL environmental variable, e.g. https://www.a--zon.co.jp")
    }

    if (headless == null) {
        headless = false
    } else {
        headless = true
    }

    const browser = await puppeteer.launch({headless: headless});
    const page = await browser.newPage();
    await page.goto(url+"/ref=nav_logo");
    await page.waitForSelector("#nav-link-accountList");
    await page.click("#nav-link-accountList");
    await page.waitForSelector("#ap_email");
    await page.type("#ap_email", email);
    await page.click("#continue");
    await page.waitForSelector("#ap_password");

    // Go to next results page
    await page.type("#ap_password", password);
    await page.click("#auth-signin-button");
    await page.waitForSelector("#nav-logo-sprites");

    results = []
    try {
        for (var y = startYear; y >= endYear; y--){
            // arbitrary,
            for (var p = 0; p < maxOrdersPerYear; p+=10) {
                await page.goto(url+"/gp/your-account/order-history?orderFilter=year-"+y+"&startIndex="+p);


                await page.waitForSelector(".yohtmlc-order-details-link");
                //const orders = await page.$x("//a[contains(text(), '注文内容を表示')]");
                const orders = await page.$$('.yohtmlc-order-details-link')
                if (orders.length < 1) {
                    break;
                }
                console.log("orders found: " + orders.length);
                // use for loops for async operations
                // https://thedavidbarton.github.io/blog/iterating-puppeteer-async-methods/
                for (var i = 0; i < orders.length; i++) {
                    await page.waitForSelector(".yohtmlc-order-details-link");
                    // HACK: there has to be a better way to do this, but page.goBack() destroys our state... :(
                    // purchasing something new while this is running may lead to duplicate results
                    const o = await page.$$('.yohtmlc-order-details-link')
                    await o[i].click()
                    console.log("order clicked.");
                    try {
                        await page.waitForSelector(".shipment",{ timeout: 3000 });
                    } catch {
                        console.log("unable to find shipment... skipping.")
                        await page.goBack()
                        continue
                    }
                    console.log("order detais loaded.");
                    await page.waitForSelector(".order-date-invoice-item",{ timeout: 5000 });
                    const date = await page.$eval(".order-date-invoice-item", i => i.innerText.substring(4).trimEnd());

                    tag = '.shipment'
                    delivery = await page.$$(".delivery")
                    if (delivery.length > 0) {
                        tag = '.delivery-items'
                    }
                    const shipments = await page.$$(tag);
                    console.log("found shipments: " + shipments.length);
                    // use for loops for async operations
                    // https://thedavidbarton.github.io/blog/iterating-puppeteer-async-methods/
                    for (var j = 0; j < shipments.length; j++) {
                        // amazon.co.jp has two separate ways of displaying results
                        // a shipment or a delivery, not sure why, but handle both.
                        if (tag === '.shipment') {
                            items = await shipments[j].$$('.a-fixed-left-grid')
                            console.log("found items: " + items.length);
                            for (var items_i = 0; items_i < items.length; items_i++) {
                                await items[items_i].waitForSelector(".yohtmlc-item",{ timeout: 5000 });
                                var qty
                                try {
                                    qty = await items[items_i].$eval('.item-view-qty', i => i.innerText)
                                } catch {
                                    qty = "1"
                                }
                                item = await items[items_i].$('.yohtmlc-item')
                                await item.waitForSelector('.a-color-price',{ timeout: 5000 })
                                await item.waitForSelector('.a-link-normal',{ timeout: 5000 })
                                price = await item.$eval('.a-color-price', i => i.innerText)
                                itemName = await item.$eval('.a-link-normal', i => i.innerText)
                                link = await item.$eval('.a-link-normal', i => i.href)
                                console.dir({date, itemName, link, price, qty}, { depth:10 });
                                await results.push({tag, date, itemName, link, price, qty})
                            }
                        } else {
                            items = await shipments[j].$$('.deliveryItem-details')
                            console.log("found items: " + items.length);
                            for (var items_i = 0; items_i < items.length; items_i++) {
                                await shipments[j].waitForSelector(".deliveryItem-details",{ timeout: 5000 });
                                var qty
                                try {
                                    qty = await items[items_i].$eval('.a-size-base.a-color-secondary', i => i.innerText.substring(3))
                                } catch {
                                    qty = "1"
                                }
                                item = await items[items_i]
                                await item.waitForSelector('.a-color-secondary',{ timeout: 5000 })
                                await item.waitForSelector('.a-link-normal',{ timeout: 5000 })
                                price = await item.$eval('.a-color-secondary', i => i.innerText)
                                itemName = await item.$eval('.a-link-normal', i => i.innerText)
                                link = await item.$eval('.a-link-normal', i => i.href)
                                console.dir({date, itemName, link, price, qty}, { depth:10 });
                                await results.push({tag, date, itemName, link, price, qty})
                            }
                        }
                    }
                    await page.goBack()
                }
            }
        }
    } catch (e) {
        console.error(e)
    } finally {
        const jsonData = JSON.stringify(results, null, 2);
        fs.writeFileSync("results.json", jsonData);
        await browser.close();
    }
};

scrape();