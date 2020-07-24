'use strict'
//const AWS = require('aws-sdk');
const cheerio = require('cheerio');
const got = require('got');

exports.handler = (event) => {

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
            const r = scrapURL(site.siteURL + route.path)
            results.push(scrapURL(site.siteURL + route.path))
        });
        
    });
}

/** 
 * It starts the search on the site passed as url parameter 
 */
const scrapURL = async (url) => {
    return new Promise((resolve, reject) => {
        try {
            const response = await got(url);
            const $ = cheerio.load(response.body);

            console.log($('article'));
            resolve();
        }
        catch(err) {
            reject(err)
        }
    })
}

/**
 * Function that verif
 * @param {*} data 
 */
const storeInDatabase = async (data) => {

}

exports.handler()