const fs = require('fs')
const parse = require('csv-parse/lib/sync')
const AWS = require('aws-sdk')

const credentials = new AWS.SharedIniFileCredentials({
    profile: process.env.AWS_LOCAL_PROFILE
});
AWS.config.credentials = credentials;
const docClient = new AWS.DynamoDB.DocumentClient({
    region: 'us-east-2',
    apiVersion: "2011-12-05"
});
const file = 'promo_bot_mx_promos_1.csv';
const table = 'promo_bot_mx_promos';

const contents = fs.readFileSync(file, 'utf-8');
const data = parse(contents, {
    columns: titles => {
        const new_titles = [];

        titles.forEach(title => {
            title = title.replace(' (S)', '').replace(' (N)', '');
            new_titles.push(title);
        });

        return new_titles;
    }
});

data.forEach(item => {
    item.created_at = Number(item.created_at);

    docClient.put({
        TableName: table,
        Item: item
    }, ((err, res) => {
        if (err) console.log(err);
        console.log(res);
    }));
})
