'use strict'
//const AWS = require('aws-sdk');
const cheerio = require('cheerio');
const got = require('got');

exports.handler = async (event) => {

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

    sites.forEach(site => {
        console.log(`Scrapping ${site.siteName} on course...`)
        site.routes.forEach(route => {
            console.log(`Getting data from ${route.name}...`)
            scrapURL(site.siteURL + route.path)
        });
        
    });
}

const scrapURL = async (url) => {
    const response = await got(url);
    const $ = cheerio.load(response.body);

    console.log($('article'));
}

exports.handler()