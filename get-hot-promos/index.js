'use strict'
//const AWS = require('aws-sdk');
const cheerio = require('cheerio');
const got = require('got');
const Promo = require('./models/promo')

const HOT_TRESSHOLD = 200;
const PAGE_SEARCH = 3

exports.handler = async (event) => {

    console.time("execution_handler");
    const sites = [
        {
            siteName: "Promodescuentos",
            
            siteURL: "https://promodescuentos.com",
            routes: [
                {
                    name:"Videojuegos",
                    path:"/grupo/videojuegos"
                }, 
                {
                    name: "Tecnología",
                    path: "/grupo/tecnologia"
                }
            ]
        }
    ];

    const results = [];
    sites.forEach(site => {
        console.log(`Scrapping ${site.siteName} on course...`)
        site.routes.forEach(route => {
            console.log(`Getting data from ${route.name}...`)
            for(let i = 1 ; i <= PAGE_SEARCH; i++) {
                const pageParam = `?page=${i}`
                results.push(scrapURL(site.siteURL + route.path + pageParam, route.name))
            }
        });
    });
    storeInDatabase(await Promise.all(results));
}

/** 
 * It starts the search on the site passed as url parameter 
 */
const scrapURL = async (url, category) => {
    return new Promise(async (resolve, reject) => {
        const promos = []
        try {
            const response = await got(url);
            const $ = cheerio.load(response.body);
            $('article').each((_, article) => {
                    const promo = new Promo($(article));
                    promos.push(promo);
                }
            )
            resolve(promos);
        }
        catch(err) {
            reject(err)
        }
    })
}

/**
 * store data on DynamoDB
 * @param {*} data 
 */
const storeInDatabase = async (data) => {
    console.log(data);
    console.timeEnd("execution_handler");
}

exports.handler()