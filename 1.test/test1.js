const puppeteer = require('puppeteer');

const AWS = require("aws-sdk");
AWS.config.loadFromPath("/Users/ray/git-sample/puppeteer-test/config/awsconfig.json");
AWS.config.update({region: 'ap-northeast-1'});

//const screenshot = 'booking_results.png';
async function scrape(proxy) {
    const browser = await puppeteer.launch({
        args: ['--proxy-server=' + proxy]
    });
    const page = await browser.newPage();

    await page.goto('https://www.costco.co.kr/HealthSupplement/Home-Health-CareFirst-Aid/First-Aid/c/cos_12.7.2', {waitUntil: 'load', timeout: 35000});
    await page.waitForSelector('#list-view-id');
    // div.product-name-container a.lister-name span.notranslate
    
    const products = await page.$$eval('div.product-name-container a.lister-name', anchors => {
        return anchors.map(anchor => {
            if(anchor.textContent.indexOf('마스크') >= 0) {
                return 'https://www.costco.co.kr' + anchor.getAttribute('href');
            }
        });
    });
    
    products.forEach(function (pUrl) {
        if(pUrl != null) {
            console.log(pUrl);
            sendSms(pUrl);
        }
    });

    console.log('[' + new Date().toLocaleString() + '] ' + proxy);

    await browser.close();
}

function sendSms(msg) {

    var params = {
        Message: msg,
        PhoneNumber: '+821012345678'
        /*
        ,
        MessageAttributes: {
            'AWS.SNS.SMS.SenderID': {
                'DataType': 'String',
                'StringValue': ''
            }
        }
        */
    };

    var publishTextPromise = new AWS.SNS({ apiVersion: '2010-03-31' }).publish(params).promise();

    publishTextPromise.then(
        function (data) {
            console.log(JSON.stringify({ MessageID: data.MessageId }));
        }).catch(
            function (err) {
                console.log(JSON.stringify({ Error: err }));
        });

}

async function main() {
    /**
     * Tor SOCKS ports that we defined in torrc file. 
     */
    const proxys = [
        'http://127.0.0.1:8080',
        'http://127.0.0.1:9999'
    ];
    
    /**
     * Scrape forever...
     */
    while (true) {
      for (const proxy of proxys) {
          try {
            /**
             * ...each time with different port.
             */
            await scrape(proxy);
            setTimeout(() => {
                console.log();
            }, 7330);
          } catch(error) {
            console.error('[' + new Date().toLocaleString() + '] ' + 'Fail proxy : ' + proxy);
            console.error(error);
            console.log();
          }
      }
    }
  }
  
  main();