'use strict'

class Promo {
    constructor(rawArticle) {
        this.degree = this.extractHTML(rawArticle, '.vote-temp--hot, .vote-temp--burn'); 
        this.title = this.extractHTML(rawArticle, '.thread-title--card');
        this.link = this.extractAttr(rawArticle, '.thread-title--card', 'href');
    }

    extractHTML(elem, selector) {
        const value = elem.find(selector).html();
        if(value) {
            return value.trim();
        }
        return null;
    }

    extractAttr(elem, selector, attr) {
        const value = elem.find(selector).attr(attr);
        if(value) {
            return value.trim();
        }
        return null;
    }
} 

module.exports = Promo;