const puppeteer = require('puppeteer');

const AWS = require("aws-sdk");
AWS.config.loadFromPath("/Users/ray/git-sample/puppeteer-test/config/awsconfig.json");
AWS.config.update({region: 'ap-northeast-1'});


//const screenshot = 'booking_results.png';
try {
    (async () => {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        while(true) {
            await page.goto('https://www.costco.co.kr/search/?text=kf');
            await page.waitForSelector('#mainSearchComponentDivGridList');
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

            console.log(new Date());

            // console.log(products);
            
            await page.waitFor(7330);
        }

        // await browser.close();
        // console.log('See screenshot: ' + screenshot);
    })();
} catch (err) {
    console.error(err);
}

function sendSms(msg) {

    var params = {
        Message: msg,
        PhoneNumber: '+821056242223'
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