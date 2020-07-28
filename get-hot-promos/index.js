'use strict'

const AWS = require('aws-sdk');
const cheerio = require('cheerio');
const got = require('got');
const Promo = require('./models/promo')
const sites = require('./sites')

const PAGE_SEARCH = 3

exports.handler = async (event) => {
    const results = [];
    let responseBody = {};
    let statusCode = 0;

    /** Iteration over sites loaded from json */
    sites.forEach(site => {
        console.log(`Scrapping ${site.siteName} on course...`)
        site.routes.forEach(route => {
            console.log(`Getting data from ${route.name}...`)
            /** We search a certain number of pages from each category */
            for(let i = 1 ; i <= PAGE_SEARCH; i++) {
                const pageParam = `?page=${i}`
                /** We save the promises on an array to wait for the resolution of all of them */
                results.push(scrapURL(site.siteURL + route.path + pageParam, route.name))
            }
        });
    });
    try {
        /** Array to keep all the new promos from scrapping */
        const retrievedPromos = [];

        /** Var data will store the results of all promises */
        const data = await Promise.all(results);
        
        data.forEach(array => { 
            /** We spread the array on retrievedPromos */
            retrievedPromos.push(...array);
        })
    
        /** DynamoDB instance */
        const documentClient = new AWS.DynamoDB.DocumentClient();
        const params = {
            TableName: "promo_bot_mx_promos",
        }

        /** Getting all promos from database as Promo objects*/
        const rawPromos = (await documentClient.scan(params).promise()).Items;
        const currentPromos = Promo.batchFromRaw(rawPromos)

        /** We call the function that will verify the existence of a promo and store it if new */
        responseBody = checkAndStore(retrievedPromos, currentPromos);
        statusCode = 200;
    }
    catch(err) {
        console.error(err);
        responseBody = 'There was an error on the request: ' + err;
        statusCode = 403;
    }

    return {
        statusCode: statusCode,
        body: responseBody
    };
}

/** 
 * It starts the search on the site passed as url parameter 
 * @param {String} url: Website to scrap.
 */
const scrapURL = async (url) => {
        const promos = []
        const options = { timeout: 3000 } //Three seconds of timeout.
        const response = await got(url, options);
        const $ = cheerio.load(response.body);

        /** We filter those thread deals that are not expired */
        $('.thread--deal:not(.thread--expired)').each((_, article) => {
                const promo = Promo.newInstance($(article));
                promos.push(promo);
            }
        )
        return promos;
}

/**
 * Check the existing promos on database and store the new ones on DynamoDB
 * @param {Array} data: Retrieved items from scrapping.
 * @param {Array} currentPromos: Array with the current promos on DB. 
 */
const checkAndStore = async (data, currentPromos) => {
    let added = 0;

    /** Double filter to remove those elements retrieved that already exists on DB*/
    data = data.filter((promo) => {
        const p = currentPromos.filter( promoStored => {
            return promo.id == promoStored.id
        }); 
        const newP = p.length == 0;
        added += newP ? 1 : 0; // We are counting the added elements.
        return newP;
    });

    console.log(`Added elements: ${added}`);

    const documentClient = new AWS.DynamoDB.DocumentClient({region: 'us-east-2'});
    const results = [];
    console.log("Writing elements on database...");
    
    data.forEach(promo => {
        const params = {
            TableName: "promo_bot_mx_promos",
            Item: {
                'id': promo.id,
                'title': promo.title,
                'temp': promo.temp,
                'date': promo.date.getTime(),
                'link': promo.link
            }
        }
        results.push(documentClient.put(params).promise());
    }
    );
    return await Promise.all(results);
    /*
    const items = [];
    data.forEach(promo => {
        items.push({
            PutRequest: {
                Item: {
                    'id': promo.id,
                    'title': promo.title,
                    'temp': promo.temp,
                    'date': promo.date.getTime(),
                    'link': promo.link
                }
            }
        })
    });
    const params = {
        RequestItems: {
            'promo_bot_mx_promos': items
        }
    };

    return await documentClient.batchWrite(params).promise();
    */
}

