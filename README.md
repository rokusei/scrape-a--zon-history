# Scrape A**zon.co.jp History

Scrapes every purchase you have made at A--zon.co.jp for the last 5 years using puppeteer. #dataisbeautiful

| :warning:  This was written by a Go developer, not a NodeJS developer. Please send a PR if you wish to educate me or fix my sins against the JS Gods. |
|-------------------------------------------------------------------------------------------------------------------------------------------------------|

## Usage

Install dependencies.

```
npm i puppeteer
```

### Environmental Variables

Setup environmental variables
```
AMZN_URL="https://www.a--zon.co.jp" AMZN_EMAIL="login@email.com" AMZN_PASSWORD="pass" 
```

Alternatively personally just setup a `.env` file with the following:
```
export AMZN_URL="https://www.a--zon.co.jp"
export AMZN_EMAIL="login@email.com"
export AMZN_PASSWORD="pass"
```

Set `SCRAPE_HEADLESS` to anything to make it run in headless mode.
```
SCRAPE_HEADLESS="1"
```
or
```
SCRAPE_HEADLESS="True"
```
or
```
SCRAPE_HEADLESS="anything-it-only-checks-if-its-not-blank"
```

For `.env`:
```
export SCRAPE_HEADLESS="1"
```

### Running

w/ env vars:
```
export HISTCONTROL=ignorespace
 AMZN_URL="https://www.a--zon.co.jp" AMZN_EMAIL="login@email.com" AMZN_PASSWORD="pass" node scrape.js; unset AMZN_PASSWORD
```

w/ .env
```
source .env && node scrape.js; unset AMZN_PASSWORD
```


## Output

The script outputs a results.json with each item purchased; the date, name, link to item, price, and quantity.

```
[
  {
    "tag": ".shipment",
    "date": "2023年5月18日",
    "itemName": "<Item Name>",
    "link": "<Item Link>",
    "price": "￥1,230",
    "qty": "1"
  },
  {
    "tag": ".shipment",
    "date": "2023年5月18日",
    "itemName": "<Item Name>",
    "link": "<Item Link>",
    "price": "￥990",
    "qty": "1"
  },
  ...
]
```

Feel free to use a tool like `@json2csv/cli` to convert to a csv. 
With the CSV you can import this into most spreadsheet applications. 


## Known Issues

- :warning: This is untested against non-Japanese versions of A--zon. 
    - NOTE: This might break some of the Date or Quantity text parsing/cleaning.
- A--zon rarely load a simple http version of the site for the initial load which messes with the script, I don't know why, just re-run the script
- Au--ble / Audiobook purchases are skipped. 

## Contributions

Additional contributions welcome. This is only tested on .co.jp. but I am open to see if it works on .com or other domains.

I didn't include package-lock.json or package.json since a bunch of random installs ended up in there and I don't know what I am doing w/ JS. ¯\\_(ツ)_/¯

