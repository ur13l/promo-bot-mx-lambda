'use strict'

const AWS = require('aws-sdk');
const cheerio = require('cheerio');
const got = require('got');
const Promo = require('./models/promo');
const sites = require('./sites');

const PAGE_SEARCH = 3;
const TELEGRAM_URL = process.env.TELEGRAM_URL;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const ENDPOINT = process.env.ENDPOINT
const documentClient = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10', endpoint: ENDPOINT})
AWS.config.update({region: 'us-east-2'});

const compose = (...fns) => arg => fns.reduce((composed,f) => composed.then(f), Promise.resolve(arg));

const scrapURL = async (url) => {
    const promos = []
    const options = { timeout: 3000 } //Three seconds of timeout.
    const response = await got(url, options);
    const $ = cheerio.load(response.body, { decodeEntities: false });

    /** We filter those thread deals that are not expired */
    $('.thread--deal:not(.thread--expired)').each((_, article) => {
            const promo = Promo.newInstance($(article));
            promos.push(promo);
        }
    )
    return promos;
}

const iterateSites = async sites => {
    const results = [];

    /** Iteration over sites loaded from json */
    sites.forEach(site => {
        console.log(`Scrapping ${site.siteName} on course...`);
        site.routes.forEach(route => {
            console.log(`Getting data from ${route.name}...`);
            /** We search a certain number of pages from each category */
            for(let i = 1 ; i <= PAGE_SEARCH; i++) {
                const pageParam = `?page=${i}`;
                /** We save the promises on an array to wait for the resolution of all of them */
                results.push(scrapURL(site.siteURL + route.path + pageParam, route.name));
            }
        });
    });
    return Promise.all(results);
}

const mergeRetrievedPromos = async results => {
    /** Var results will store the results of all promises */
    return results.reduce((generalArray, specificArray) => [...generalArray, ...specificArray],[]);
}

const getDBItems = async retrievedPromos => {
    /** DynamoDB instance */
    const params = {
        TableName: "promo_bot_mx_promos",
    }

    /** Getting all promos from database as Promo objects*/
    const rawPromos = (await documentClient.scan(params).promise()).Items;

    return {
        retrievedPromos,
        currentPromos: Promo.batchFromRaw(rawPromos)
    }
}

const filterPromos = async ({retrievedPromos, currentPromos}) => {
    /** Double filter to remove those elements retrieved that already exists on DB*/
    return retrievedPromos.filter((promo) => {
        const p = currentPromos.filter( promoStored => {
            return promo.id === promoStored.id
        });
        const newP = p.length === 0;
        return newP;
    });
}

const storePromos = async retrievedPromos => {
    const results = [];
    console.log("Writing elements on database...");
    retrievedPromos.forEach(promo => {
            const params = {
                TableName: "promo_bot_mx_promos",
                Item: {
                    'id': promo.id,
                    'title': promo.title,
                    'temp': promo.temp,
                    'created_at': promo.created_at.getTime(),
                    'link': promo.link,
                    'price': promo.price
                }
            }
            results.push(documentClient.put(params).promise());
        }
    );
    await Promise.all(results);
    return retrievedPromos;
}

const broadcastTelegram = async data => {
    console.log(data);
    const messages = [];
    data.forEach(promo => {
        messages.push(sendMessageTelegram(`
            ${promo.title} | ${promo.price? promo.price : ''} | ${promo.temp}\n${promo.link}`));
    });
    await Promise.all(messages);
    return data;
}

const broadcastTwitter = async data => {
    //TODO: Broadcast Twitter functionallity
}

const sendMessageTelegram = async message => {
    console.log(TELEGRAM_URL + "?chat_id=" + TELEGRAM_CHAT_ID + "&text=" + message)
    const params = {
        timeout: 3000,
        searchParams: {
            chat_id: TELEGRAM_CHAT_ID,
            text: message
        }
    }
    return got(TELEGRAM_URL, params);
}

exports.handler = async (event) => {
    let body = {};
    let statusCode = 0;

    try {
         await compose(
            iterateSites,
            mergeRetrievedPromos,
            getDBItems,
            filterPromos,
            storePromos,
            broadcastTelegram,
            broadcastTwitter
        )(sites);
        body = `Elements saved successfully`
        statusCode = 200;
    }
    catch(err) {
        console.error(err);
        body = 'There was an error on the request: ' + err;
        statusCode = 403;
    }

    return {
        statusCode,
        body
    };
}





